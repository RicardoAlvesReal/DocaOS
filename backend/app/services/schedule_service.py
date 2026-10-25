import io
import base64
import qrcode
from typing import Optional, List
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
from app.services.webhook_service import dispatch_tenant_webhook
from app.services.whatsapp_service import dispatch_whatsapp_notification


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
    if status_update.seal_number is not None:
        schedule.seal_number = status_update.seal_number
    if status_update.seal_status is not None:
        schedule.seal_status = status_update.seal_status
    if status_update.has_damage is not None:
        schedule.has_damage = status_update.has_damage
    if status_update.damage_notes is not None:
        schedule.damage_notes = status_update.damage_notes

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

    # Disparar Webhook para ERP/WMS externo
    status_event_map = {
        "Aguardando_Patio": "vehicle.checked_in",
        "Em_Doca": "vehicle.docked",
        "Carregado_Descarregado": "vehicle.completed",
        "Liberado": "vehicle.released"
    }
    event_name = status_event_map.get(new_status, "schedule.status_updated")
    await dispatch_tenant_webhook(
        db=db,
        tenant_id=schedule.tenant_id,
        event_type=event_name,
        payload={
            "event": event_name,
            "schedule_id": str(schedule.id),
            "tenant_id": str(schedule.tenant_id),
            "vehicle_plate": schedule.vehicle_plate,
            "trailer_plate": schedule.trailer_plate,
            "carrier_name": schedule.carrier_name,
            "driver_name": schedule.driver_name,
            "driver_cpf": schedule.driver_cpf,
            "invoice_number": schedule.invoice_number,
            "dock_code": schedule.dock.code if schedule.dock else None,
            "dock_name": schedule.dock.name if schedule.dock else None,
            "previous_status": old_status,
            "current_status": new_status,
            "checkin_at": schedule.checkin_at.isoformat() if schedule.checkin_at else None,
            "docked_at": schedule.docked_at.isoformat() if schedule.docked_at else None,
            "completed_at": schedule.completed_at.isoformat() if schedule.completed_at else None,
            "departed_at": schedule.departed_at.isoformat() if schedule.departed_at else None,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )

    # Disparar notificação automatizada no WhatsApp do motorista (se habilitado pelo Super Admin)
    tenant = db.query(Tenant).filter(Tenant.id == schedule.tenant_id).first()
    if tenant and tenant.has_whatsapp_automation:
        await dispatch_whatsapp_notification(
            tenant=tenant,
            schedule=schedule,
            event_type=new_status,
            extra_notes=status_update.notes
        )

    # Se uma doca foi liberada nesta transição e o armazém tiver automação ativa, convoca o próximo da fila
    if old_status != new_status and new_status in ["Liberado", "Cancelado"] and schedule.dock_id:
        freed_dock = db.query(Dock).filter(Dock.id == schedule.dock_id).first()
        if freed_dock and tenant and tenant.has_auto_dock_assignment:
            await try_auto_dispatch_dock_to_queue(db=db, dock=freed_dock, tenant=tenant)

    return schedule


def is_dock_compatible_with_cargo(dock_type: Optional[str], cargo_type: Optional[str]) -> bool:
    """Verifica compatibilidade técnica entre a doca física e a carga do caminhão."""
    if not dock_type or dock_type.lower() in ["geral", "carga geral", "crossdocking", "disponivel"]:
        return True

    dt = dock_type.lower()
    ct = (cargo_type or "").lower()

    if "frigo" in dt or "refrig" in dt:
        return any(k in ct for k in ["congel", "refrig", "frio", "aliment", "sorvete", "carne", "vacina", "perec"])

    if "granel" in dt:
        return any(k in ct for k in ["granel", "grão", "soja", "milho", "adubo", "fertil"])

    if "seca" in dt:
        return not any(k in ct for k in ["congel", "refrig"])

    return True


async def try_auto_dispatch_dock_to_queue(
    db: Session,
    dock: Dock,
    tenant: Optional[Tenant] = None
) -> Optional[Schedule]:
    """
    Quando uma doca fica livre, se a automação estiver habilitada,
    busca o próximo caminhão em 'Aguardando_Patio' compatível,
    aloca a doca, altera para 'Em_Doca' e notifica o motorista no WhatsApp.
    """
    if not tenant:
        tenant = db.query(Tenant).filter(Tenant.id == dock.tenant_id).first()

    if not tenant or not tenant.has_auto_dock_assignment:
        return None

    if tenant.auto_dock_mode not in ["on_release", "on_arrival_and_release"]:
        return None

    if dock.status != "Livre":
        return None

    # Busca caminhões aguardando no pátio ordenados por chegada/início de janela
    waiting_schedules = (
        db.query(Schedule)
        .filter(
            Schedule.tenant_id == dock.tenant_id,
            Schedule.status == "Aguardando_Patio"
        )
        .order_by(Schedule.checkin_at.asc(), Schedule.scheduled_window_start.asc())
        .all()
    )

    if not waiting_schedules:
        return None

    target = None
    # 1. Prioridade: agendamento que já tinha esta doca pré-reservada
    for s in waiting_schedules:
        if s.dock_id == dock.id:
            target = s
            break

    # 2. Prioridade: agendamento sem doca prévia compatível
    if not target:
        for s in waiting_schedules:
            if not s.dock_id and is_dock_compatible_with_cargo(dock.dock_type, s.cargo_type):
                target = s
                break

    # 3. Fallback: primeiro compatível da fila
    if not target:
        for s in waiting_schedules:
            if is_dock_compatible_with_cargo(dock.dock_type, s.cargo_type):
                target = s
                break

    if target:
        update_in = ScheduleStatusUpdate(
            status="Em_Doca",
            dock_id=dock.id,
            notes=f"Auto-Dispatch Automático: Vaga liberada na {dock.code} ({dock.name}). Convocado automaticamente pelo sistema.",
            recorded_by="Robô Auto-Dispatch DocaOS"
        )
        updated = await update_schedule_status(db=db, schedule=target, status_update=update_in)
        return updated

    return None


async def try_auto_dispatch_on_arrival(
    db: Session,
    schedule: Schedule
) -> Optional[Schedule]:
    """
    Ao registrar entrada no pátio (check-in na portaria ou geofence),
    se a automação estiver habilitada e houver doca livre compatível,
    já aloca imediatamente e despacha o caminhão direto para a doca sem deixá-lo retido na espera.
    """
    tenant = db.query(Tenant).filter(Tenant.id == schedule.tenant_id).first()
    if not tenant or not tenant.has_auto_dock_assignment:
        return None

    if tenant.auto_dock_mode not in ["on_arrival", "on_arrival_and_release"]:
        return None

    # Se já tem doca pré-atribuída e ela está livre
    if schedule.dock_id:
        dock = db.query(Dock).filter(Dock.id == schedule.dock_id, Dock.tenant_id == tenant.id).first()
        if dock and dock.status == "Livre":
            update_in = ScheduleStatusUpdate(
                status="Em_Doca",
                dock_id=dock.id,
                notes=f"Auto-Dispatch de Portaria: Doca {dock.name} livre. Direcionamento imediato.",
                recorded_by="Robô Auto-Dispatch Portaria Express"
            )
            return await update_schedule_status(db=db, schedule=schedule, status_update=update_in)

    # Busca qualquer doca livre compatível
    free_docks = (
        db.query(Dock)
        .filter(
            Dock.tenant_id == tenant.id,
            Dock.status == "Livre"
        )
        .order_by(Dock.code.asc())
        .all()
    )

    for dock in free_docks:
        if is_dock_compatible_with_cargo(dock.dock_type, schedule.cargo_type):
            update_in = ScheduleStatusUpdate(
                status="Em_Doca",
                dock_id=dock.id,
                notes=f"Auto-Dispatch de Portaria: Vaga compatível localizada na {dock.name}.",
                recorded_by="Robô Auto-Dispatch Portaria Express"
            )
            return await update_schedule_status(db=db, schedule=schedule, status_update=update_in)

    return None


async def run_batch_auto_dispatch(db: Session, tenant_id: UUID) -> List[dict]:
    """
    Executa uma rodada completa de alocação automática para todas as docas livres
    e caminhões em espera para o armazém especificado.
    """
    free_docks = (
        db.query(Dock)
        .filter(Dock.tenant_id == tenant_id, Dock.status == "Livre")
        .order_by(Dock.code.asc())
        .all()
    )
    results = []
    for dock in free_docks:
        sch = await try_auto_dispatch_dock_to_queue(db=db, dock=dock)
        if sch:
            results.append({
                "dock_code": dock.code,
                "dock_name": dock.name,
                "schedule_id": str(sch.id),
                "vehicle_plate": sch.vehicle_plate,
                "driver_name": sch.driver_name,
                "carrier_name": sch.carrier_name
            })
    return results

