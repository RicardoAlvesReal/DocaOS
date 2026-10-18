from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from datetime import datetime, date

from app.core.database import get_db
from app.core.config import settings
from app.models.schedule import Schedule
from app.models.dock import Dock
from app.schemas.schedule import (
    ScheduleCreate,
    ScheduleResponse,
    ScheduleStatusUpdate
)
from app.services.schedule_service import (
    create_schedule,
    update_schedule_status,
    check_dock_concurrency
)

router = APIRouter(prefix="/schedules", tags=["Agendamentos (Time Slots)"])


def enrich_schedule_response(schedule: Schedule) -> ScheduleResponse:
    driver_url = f"{settings.DRIVER_PORTAL_URL}/{schedule.access_token}"
    dock_name = schedule.dock.name if schedule.dock else None
    
    resp = ScheduleResponse.model_validate(schedule)
    resp.driver_access_url = driver_url
    resp.dock_name = dock_name
    return resp


@router.get("/", response_model=List[ScheduleResponse])
def list_schedules(
    tenant_id: Optional[UUID] = None,
    status_filter: Optional[str] = None,
    target_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Lista todos os agendamentos, com suporte a filtros por tenant, status e dia"""
    query = db.query(Schedule)

    if tenant_id:
        query = query.filter(Schedule.tenant_id == tenant_id)
    if status_filter:
        query = query.filter(Schedule.status == status_filter)
    if target_date:
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())
        query = query.filter(
            Schedule.scheduled_window_start >= start_of_day,
            Schedule.scheduled_window_start <= end_of_day
        )

    schedules = query.order_by(Schedule.scheduled_window_start.asc()).all()
    return [enrich_schedule_response(s) for s in schedules]


@router.post("/", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def schedule_appointment(schedule_in: ScheduleCreate, db: Session = Depends(get_db)):
    """
    Reserva uma janela de horário (Time Slot).
    Bloqueia concorrência caso a mesma doca já esteja ocupada no mesmo horário.
    Retorna link exclusivo do motorista para envio via WhatsApp.
    """
    schedule = create_schedule(db=db, schedule_in=schedule_in)
    return enrich_schedule_response(schedule)


@router.get("/{schedule_id}", response_model=ScheduleResponse)
def get_schedule(schedule_id: UUID, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado.")
    return enrich_schedule_response(schedule)


@router.patch("/{schedule_id}/status", response_model=ScheduleResponse)
async def update_status(
    schedule_id: UUID,
    status_in: ScheduleStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Altera o status do caminhão na máquina de estados (Agendado -> Aguardando_Patio -> Em_Doca -> Liberado)
    e transmite imediatamente para a Torre de Controle via WebSocket.
    """
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado.")

    # Se estiver alocando uma doca ao entrar em Doca, validar se não colide
    if status_in.dock_id and status_in.status == "Em_Doca":
        collision = check_dock_concurrency(
            db=db,
            dock_id=status_in.dock_id,
            start_time=schedule.scheduled_window_start,
            end_time=schedule.scheduled_window_end,
            exclude_schedule_id=schedule.id
        )
        if collision:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A doca selecionada já está ocupada por outro agendamento neste horário."
            )

    updated_schedule = await update_schedule_status(db=db, schedule=schedule, status_update=status_in)
    return enrich_schedule_response(updated_schedule)
