import io
import base64
import qrcode
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status

from app.models.schedule import Schedule
from app.models.dock import Dock
from app.models.tenant import Tenant
from app.models.yard_event import YardEvent
from app.schemas.schedule import ScheduleCreate, ScheduleStatusUpdate
from app.core.config import settings
from app.services.websocket_manager import manager


def generate_qr_code_base64(data: str) -> str:
    """Gera um QR Code PNG em base64 pronto para renderização direta na tag <img src='...'>"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=3,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"


def check_dock_concurrency(
    db: Session,
    dock_id: UUID,
    start_time: datetime,
    end_time: datetime,
    exclude_schedule_id: UUID = None
) -> bool:
    """
    Verifica se já existe agendamento ativo concorrente na mesma doca para a janela informada.
    Retorna True se houver conflito (colisão de horário).
    """
    query = db.query(Schedule).filter(
        Schedule.dock_id == dock_id,
        Schedule.status.notin_(["Cancelado", "Liberado"]),
        Schedule.scheduled_window_start < end_time,
        Schedule.scheduled_window_end > start_time,
    )
    if exclude_schedule_id:
        query = query.filter(Schedule.id != exclude_schedule_id)
        
    conflicting = query.first()
    return conflicting is not None


def create_schedule(db: Session, schedule_in: ScheduleCreate) -> Schedule:
    # 1. Validar horários
    if schedule_in.scheduled_window_start >= schedule_in.scheduled_window_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O horário de início da janela deve ser anterior ao horário de término."
        )

    # 2. Validar colisão de doca caso doca tenha sido informada
    if schedule_in.dock_id:
        dock = db.query(Dock).filter(
            Dock.id == schedule_in.dock_id,
            Dock.tenant_id == schedule_in.tenant_id
        ).first()
        if not dock:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doca especificada não encontrada para este Armazém/Tenant."
            )
        
        has_collision = check_dock_concurrency(
            db,
            dock_id=schedule_in.dock_id,
            start_time=schedule_in.scheduled_window_start,
            end_time=schedule_in.scheduled_window_end
        )
        if has_collision:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Conflito de agendamento: A Doca '{dock.name}' já possui um agendamento reservado nesta janela de horário."
            )

    # 3. Criar registro de agendamento
    schedule = Schedule(
        tenant_id=schedule_in.tenant_id,
        dock_id=schedule_in.dock_id,
        carrier_name=schedule_in.carrier_name,
        cargo_type=schedule_in.cargo_type,
        invoice_number=schedule_in.invoice_number,
        driver_name=schedule_in.driver_name,
        driver_cpf=schedule_in.driver_cpf,
        driver_phone=schedule_in.driver_phone,
        vehicle_plate=schedule_in.vehicle_plate,
        trailer_plate=schedule_in.trailer_plate,
        scheduled_window_start=schedule_in.scheduled_window_start,
        scheduled_window_end=schedule_in.scheduled_window_end,
        notes=schedule_in.notes,
        status="Agendado"
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    # 4. Registrar evento inicial na máquina de estados
    event = YardEvent(
        tenant_id=schedule.tenant_id,
        schedule_id=schedule.id,
        from_status=None,
        to_status="Agendado",
        recorded_by="Motor de Agendamento API",
        notes="Agendamento criado com sucesso."
    )
    db.add(event)
    db.commit()

    return schedule


async def update_schedule_status(
    db: Session,
    schedule: Schedule,
    status_update: ScheduleStatusUpdate
) -> Schedule:
    old_status = schedule.status
    new_status = status_update.status
    now = datetime.now(timezone.utc)

    # Atualiza doca se fornecida
    if status_update.dock_id and status_update.dock_id != schedule.dock_id:
        schedule.dock_id = status_update.dock_id

    # Atualiza timestamps de acordo com o novo status
    if new_status == "Aguardando_Patio" and not schedule.checkin_at:
        schedule.checkin_at = now
    elif new_status == "Em_Doca":
        if not schedule.docked_at:
            schedule.docked_at = now
        # Altera status da doca para Ocupada
        if schedule.dock_id:
            dock = db.query(Dock).filter(Dock.id == schedule.dock_id).first()
            if dock:
                dock.status = "Ocupada"
    elif new_status == "Carregado_Descarregado":
        if not schedule.completed_at:
            schedule.completed_at = now
    elif new_status in ["Liberado", "Cancelado"]:
        if not schedule.departed_at:
            schedule.departed_at = now
        # Libera a doca
        if schedule.dock_id:
            dock = db.query(Dock).filter(Dock.id == schedule.dock_id).first()
            if dock:
                dock.status = "Livre"

    schedule.status = new_status
    if status_update.notes:
        schedule.notes = status_update.notes

    # Registrar evento de auditoria
    event = YardEvent(
        tenant_id=schedule.tenant_id,
        schedule_id=schedule.id,
        from_status=old_status,
        to_status=new_status,
        recorded_by=status_update.recorded_by or "Sistema",
        notes=status_update.notes
    )
    db.add(event)
    db.commit()
    db.refresh(schedule)

    # Disparar atualização em tempo real para a Torre de Controle via WebSocket
    await manager.broadcast_to_tenant(
        tenant_id=str(schedule.tenant_id),
        message={
            "type": "STATUS_CHANGED",
            "schedule_id": str(schedule.id),
            "vehicle_plate": schedule.vehicle_plate,
            "carrier_name": schedule.carrier_name,
            "old_status": old_status,
            "new_status": new_status,
            "dock_name": schedule.dock.name if schedule.dock else None,
            "updated_at": schedule.updated_at.isoformat()
        }
    )

    return schedule
