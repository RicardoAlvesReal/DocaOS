import secrets
import hashlib
from uuid import UUID
from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, HttpUrl
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.tenant import Tenant
from app.models.schedule import Schedule
from app.models.integration import WebhookSubscription, ApiKey
from app.services.webhook_service import dispatch_tenant_webhook
from app.services.geo_service import calculate_haversine_distance, format_distance
from app.services.websocket_manager import manager

router = APIRouter(prefix="/integrations", tags=["Integrações Enterprise & Webhooks"])


# Schemas
class WebhookCreate(BaseModel):
    tenant_id: UUID
    target_url: str
    events: Optional[str] = "schedule.created,vehicle.checked_in,vehicle.docked,vehicle.completed,vehicle.released"


class WebhookResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    target_url: str
    secret_token: str
    events: str
    is_active: bool
    created_at: datetime


class ApiKeyCreate(BaseModel):
    tenant_id: UUID
    name: str  # Ex: "SAP Middleware", "TOTVS Protheus"


class ApiKeyResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    key_prefix: str
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime]
    full_api_key: Optional[str] = None  # Retornado apenas na criação


# Endpoints Webhooks
@router.get("/webhooks", response_model=List[WebhookResponse])
def list_webhooks(tenant_id: UUID = Query(...), db: Session = Depends(get_db)):
    return db.query(WebhookSubscription).filter(WebhookSubscription.tenant_id == tenant_id).order_by(WebhookSubscription.created_at.desc()).all()


@router.post("/webhooks", response_model=WebhookResponse, status_code=status.HTTP_201_CREATED)
def create_webhook(webhook_in: WebhookCreate, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.id == webhook_in.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não encontrado.")

    sub = WebhookSubscription(
        tenant_id=webhook_in.tenant_id,
        target_url=str(webhook_in.target_url),
        secret_token=secrets.token_hex(20),
        events=webhook_in.events or "schedule.created,vehicle.checked_in,vehicle.docked,vehicle.completed,vehicle.released",
        is_active=True
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/webhooks/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_webhook(webhook_id: UUID, db: Session = Depends(get_db)):
    sub = db.query(WebhookSubscription).filter(WebhookSubscription.id == webhook_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook não encontrado.")
    db.delete(sub)
    db.commit()
    return None


@router.post("/webhooks/{webhook_id}/test")
async def test_webhook(webhook_id: UUID, db: Session = Depends(get_db)):
    sub = db.query(WebhookSubscription).filter(WebhookSubscription.id == webhook_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Webhook não encontrado.")

    test_payload = {
        "event": "test.ping",
        "message": "Teste de conectividade RotaFlow YMS",
        "tenant_id": str(sub.tenant_id),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await dispatch_tenant_webhook(
        db=db,
        tenant_id=sub.tenant_id,
        event_type="test.ping",
        payload=test_payload
    )
    return {"success": True, "message": f"Disparo de teste executado para {sub.target_url}"}


# Endpoints API Keys
@router.get("/api-keys", response_model=List[ApiKeyResponse])
def list_api_keys(tenant_id: UUID = Query(...), db: Session = Depends(get_db)):
    return db.query(ApiKey).filter(ApiKey.tenant_id == tenant_id).order_by(ApiKey.created_at.desc()).all()


@router.post("/api-keys", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
def create_api_key(key_in: ApiKeyCreate, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.id == key_in.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não encontrado.")

    raw_token = secrets.token_urlsafe(32)
    full_key = f"rf_live_{raw_token}"
    key_prefix = full_key[:14] + "..."
    key_hash = hashlib.sha256(full_key.encode("utf-8")).hexdigest()

    api_key = ApiKey(
        tenant_id=key_in.tenant_id,
        name=key_in.name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        is_active=True
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    resp = ApiKeyResponse(
        id=api_key.id,
        tenant_id=api_key.tenant_id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        is_active=api_key.is_active,
        created_at=api_key.created_at,
        last_used_at=api_key.last_used_at,
        full_api_key=full_key
    )
    return resp


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_key(key_id: UUID, db: Session = Depends(get_db)):
    key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API Key não encontrada.")
    db.delete(key)
    db.commit()
    return None


# =========================================================================
# TELEMETRIA DE FROTAS & RASTREADORES VEICULARES (GPS DE CARRETAS)
# =========================================================================
class TelemetryConfigUpdate(BaseModel):
    tenant_id: UUID
    has_telemetry_integration: bool
    telemetry_provider: str = "Generic_Webhook"  # Autotrac, Sascar, OnixSat, Omnilink, Cobli, Generic_Webhook
    telemetry_api_key: Optional[str] = None
    telemetry_client_id: Optional[str] = None
    telemetry_endpoint: Optional[str] = None


class TelemetryPingRequest(BaseModel):
    tenant_id: UUID
    vehicle_plate: str
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = None
    speed_kmh: Optional[float] = None


@router.get("/telemetry")
def get_telemetry_config(tenant_id: UUID = Query(...), db: Session = Depends(get_db)):
    """Retorna as configurações do conector de telemetria veicular do Armazém"""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não encontrado.")

    return {
        "tenant_id": tenant.id,
        "has_telemetry_integration": tenant.has_telemetry_integration,
        "telemetry_provider": tenant.telemetry_provider or "Generic_Webhook",
        "telemetry_api_key": tenant.telemetry_api_key or "",
        "telemetry_client_id": tenant.telemetry_client_id or "",
        "telemetry_endpoint": tenant.telemetry_endpoint or "",
        "ingestion_webhook_url": f"/api/v1/integrations/telemetry/ping?tenant_id={tenant.id}"
    }


@router.post("/telemetry")
def update_telemetry_config(telemetry_in: TelemetryConfigUpdate, db: Session = Depends(get_db)):
    """Atualiza as credenciais e o provedor de telemetria (Autotrac, Sascar, OnixSat, Omnilink, Cobli)"""
    tenant = db.query(Tenant).filter(Tenant.id == telemetry_in.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não encontrado.")

    tenant.has_telemetry_integration = telemetry_in.has_telemetry_integration
    tenant.telemetry_provider = telemetry_in.telemetry_provider
    tenant.telemetry_api_key = telemetry_in.telemetry_api_key
    tenant.telemetry_client_id = telemetry_in.telemetry_client_id
    tenant.telemetry_endpoint = telemetry_in.telemetry_endpoint

    db.commit()
    db.refresh(tenant)

    return {
        "success": True,
        "message": f"Conector de telemetria ({tenant.telemetry_provider}) atualizado com sucesso!",
        "has_telemetry_integration": tenant.has_telemetry_integration,
        "telemetry_provider": tenant.telemetry_provider
    }


@router.post("/telemetry/ping")
async def receive_telemetry_ping(ping: TelemetryPingRequest, db: Session = Depends(get_db)):
    """
    Endpoint de Ingestão de Telemetria (Rastreadores Veiculares):
    Recebe coordenadas GPS em tempo real de provedores como Autotrac, Sascar, OnixSat, Omnilink, Cobli ou Webhook Genérico.
    Calcula automaticamente a distância até o pátio e atualiza o agendamento ativo do caminhão.
    """
    tenant = db.query(Tenant).filter(Tenant.id == ping.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não encontrado.")

    cleaned_plate = ping.vehicle_plate.replace("-", "").replace(" ", "").upper()
    schedule = (
        db.query(Schedule)
        .filter(
            Schedule.tenant_id == ping.tenant_id,
            Schedule.vehicle_plate == cleaned_plate,
            Schedule.status.in_(["Agendado", "Aguardando_Patio"])
        )
        .order_by(Schedule.scheduled_window_start.asc())
        .first()
    )

    if not schedule:
        return {
            "success": False,
            "message": f"Nenhum agendamento ativo encontrado para a placa {cleaned_plate}.",
            "vehicle_plate": cleaned_plate
        }

    warehouse_lat = tenant.latitude if tenant.latitude else -20.3155
    warehouse_lon = tenant.longitude if tenant.longitude else -40.3128
    radius = tenant.geofence_radius_meters if tenant.geofence_radius_meters else 1000

    distance = calculate_haversine_distance(ping.latitude, ping.longitude, warehouse_lat, warehouse_lon)
    is_inside = distance <= radius

    schedule.checkin_latitude = ping.latitude
    schedule.checkin_longitude = ping.longitude
    schedule.checkin_accuracy_meters = ping.accuracy_meters
    schedule.checkin_distance_meters = round(distance, 1)
    if is_inside and not schedule.geofence_validated:
        schedule.geofence_validated = True

    db.commit()

    # Notifica a Torre de Controle via WebSocket em tempo real
    await manager.broadcast_to_tenant(
        tenant_id=str(tenant.id),
        message={
            "type": "TELEMETRY_UPDATED",
            "schedule_id": str(schedule.id),
            "vehicle_plate": schedule.vehicle_plate,
            "distance_meters": round(distance, 1),
            "distance_formatted": format_distance(distance),
            "is_inside_geofence": is_inside,
            "speed_kmh": ping.speed_kmh
        }
    )

    return {
        "success": True,
        "message": f"Telemetria recebida! Veículo a {format_distance(distance)} do pátio.",
        "vehicle_plate": cleaned_plate,
        "distance_meters": round(distance, 1),
        "is_inside_geofence": is_inside
    }


# =========================================================================
# NOTIFICAÇÕES WHATSAPP PARA MOTORISTAS (CHAMADA DE DOCA & CHECK-IN)
# =========================================================================
class WhatsAppSendRequest(BaseModel):
    tenant_id: Optional[UUID] = None
    schedule_id: Optional[UUID] = None
    driver_phone: str
    driver_name: str
    vehicle_plate: str
    dock_name: Optional[str] = None
    notification_type: str = "dock_call"
    custom_message: Optional[str] = None


@router.post("/whatsapp/send")
async def send_whatsapp_notification(
    payload: WhatsAppSendRequest,
    db: Session = Depends(get_db)
):
    """
    Dispara ou registra envio de notificação via WhatsApp para o motorista de caminhão.
    Compatível com gateways Evolution API, Z-API, Twilio ou link direto wa.me.
    """
    clean_phone = "".join(filter(str.isdigit, payload.driver_phone))
    if clean_phone and not clean_phone.startswith("55"):
        clean_phone = f"55{clean_phone}"

    message = payload.custom_message
    if not message:
        if payload.notification_type == "dock_call":
            dock = payload.dock_name or "Doca Designada"
            message = (
                f"🚨 *CHAMADA PARA DOCA*\n\n"
                f"Olá, *{payload.driver_name}*!\n"
                f"Seu veículo placa *{payload.vehicle_plate}* foi chamado para a *{dock}*.\n\n"
                f"📍 Por favor, encoste o caminhão imediatamente.\n"
                f"_RotaFlow YMS • Gestão de Pátios_"
            )
        else:
            message = (
                f"📋 *ROTAFLOW YMS*\n\n"
                f"Olá, *{payload.driver_name}*! Notificação referente ao veículo *{payload.vehicle_plate}*."
            )

    direct_url = f"https://api.whatsapp.com/send?phone={clean_phone}&text={message}" if clean_phone else None

    # Se houver webhook de eventos WhatsApp assinado pelo tenant, despacha em segundo plano
    if payload.tenant_id:
        await dispatch_tenant_webhook(
            db=db,
            tenant_id=payload.tenant_id,
            event_name="driver.whatsapp_notified",
            payload={
                "driver_name": payload.driver_name,
                "driver_phone": clean_phone,
                "vehicle_plate": payload.vehicle_plate,
                "dock_name": payload.dock_name,
                "notification_type": payload.notification_type,
                "message": message,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

    return {
        "success": True,
        "message": "Notificação WhatsApp processada com sucesso.",
        "phone": clean_phone,
        "direct_url": direct_url,
        "dispatched_text": message
    }

