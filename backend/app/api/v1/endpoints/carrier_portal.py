from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.tenant import Tenant
from app.models.dock import Dock
from app.schemas.schedule import ScheduleCreate, ScheduleResponse
from app.services.schedule_service import create_schedule
from app.api.v1.endpoints.schedules import enrich_schedule_response
from app.services.whatsapp_service import dispatch_whatsapp_notification

router = APIRouter(prefix="/carrier-portal", tags=["Portal do Transportador"])


class CarrierTenantInfo(BaseModel):
    tenant_id: UUID
    name: str
    slug: str
    cnpj: Optional[str] = None
    has_carrier_portal: bool
    docks: List[dict]


class CarrierBookingRequest(BaseModel):
    carrier_name: str
    cargo_type: str = "Carga Geral"
    invoice_number: Optional[str] = None
    driver_name: str
    driver_cpf: str
    driver_phone: Optional[str] = None
    vehicle_plate: str
    trailer_plate: Optional[str] = None
    scheduled_window_start: datetime
    scheduled_window_end: datetime
    dock_id: Optional[UUID] = None
    notes: Optional[str] = None


@router.get("/{tenant_slug}/info", response_model=CarrierTenantInfo)
def get_carrier_portal_info(tenant_slug: str, db: Session = Depends(get_db)):
    """
    Retorna as informações do armazém e docas disponíveis para o transportador agendar.
    Requer que a flag 'has_carrier_portal' esteja habilitada pelo Super Admin.
    """
    tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Armazém com o identificador '{tenant_slug}' não foi encontrado."
        )

    if not tenant.has_carrier_portal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="O Portal de Auto-Agendamento do Transportador não está habilitado para este Armazém. Contate a administração da RAOS Tecnologia para ativar esta licença."
        )

    docks = db.query(Dock).filter(Dock.tenant_id == tenant.id).all()
    docks_list = [
        {"id": str(d.id), "name": d.name, "code": d.code, "dock_type": d.dock_type, "status": d.status}
        for d in docks
    ]

    return CarrierTenantInfo(
        tenant_id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        cnpj=tenant.cnpj,
        has_carrier_portal=tenant.has_carrier_portal,
        docks=docks_list
    )


@router.post("/{tenant_slug}/book", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def carrier_self_booking(
    tenant_slug: str,
    booking_in: CarrierBookingRequest,
    db: Session = Depends(get_db)
):
    """
    Permite que a transportadora agende sua própria janela de entrega ou coleta
    diretamente no portal do armazém.
    """
    tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Armazém não localizado.")

    if not tenant.has_carrier_portal:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Portal do Transportador desativado para este Armazém."
        )

    sch_create = ScheduleCreate(
        tenant_id=tenant.id,
        carrier_name=booking_in.carrier_name,
        cargo_type=booking_in.cargo_type,
        invoice_number=booking_in.invoice_number,
        driver_name=booking_in.driver_name,
        driver_cpf=booking_in.driver_cpf,
        driver_phone=booking_in.driver_phone,
        vehicle_plate=booking_in.vehicle_plate,
        trailer_plate=booking_in.trailer_plate,
        scheduled_window_start=booking_in.scheduled_window_start,
        scheduled_window_end=booking_in.scheduled_window_end,
        dock_id=booking_in.dock_id,
        notes=booking_in.notes or "Agendamento realizado via Portal do Transportador"
    )

    schedule = create_schedule(db=db, schedule_in=sch_create)

    # Dispara notificação no WhatsApp se habilitado
    if tenant.has_whatsapp_automation:
        await dispatch_whatsapp_notification(
            tenant=tenant,
            schedule=schedule,
            event_type="Agendado"
        )

    return enrich_schedule_response(schedule)
