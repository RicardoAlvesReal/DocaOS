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
from app.models.integration import WebhookSubscription, ApiKey
from app.services.webhook_service import dispatch_tenant_webhook

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
