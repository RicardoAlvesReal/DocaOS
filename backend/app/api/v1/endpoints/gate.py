from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from uuid import UUID

from app.core.database import get_db
from app.models.schedule import Schedule
from app.schemas.driver import GateScanRequest, GateScanResponse
from app.schemas.schedule import ScheduleStatusUpdate
from app.services.schedule_service import update_schedule_status

router = APIRouter(prefix="/gate", tags=["Portaria / Cancela"])


@router.post("/scan", response_model=GateScanResponse)
async def scan_gate_checkin(scan_in: GateScanRequest, db: Session = Depends(get_db)):
    """
    Check-in instantâneo na portaria/cancela ao escanear o QR Code do motorista
    ou digitar a placa. Muda o status de Agendado para Aguardando_Patio e inicia o SLA.
    """
    token = scan_in.access_token
    plate = scan_in.vehicle_plate

    # Tratar leitura direta de QR Code que venha no formato "ROTAFLOW:<token>:<placa>"
    if token and token.startswith("ROTAFLOW:"):
        parts = token.split(":")
        if len(parts) >= 2:
            token = parts[1]
        if len(parts) >= 3 and not plate:
            plate = parts[2]

    schedule = None
    if token:
        schedule = db.query(Schedule).filter(Schedule.access_token == token).first()

    if not schedule and plate:
        cleaned_plate = plate.replace("-", "").replace(" ", "").upper()
        # Busca agendamento recente para esta placa
        query = db.query(Schedule).filter(Schedule.vehicle_plate == cleaned_plate)
        if scan_in.tenant_id:
            try:
                valid_uuid = UUID(str(scan_in.tenant_id))
                query = query.filter(Schedule.tenant_id == valid_uuid)
            except (ValueError, TypeError):
                query = query.filter(False)
        schedule = query.order_by(Schedule.scheduled_window_start.asc()).first()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhum agendamento encontrado para o QR Code ou placa fornecida."
        )

    previous_status = schedule.status
    now = datetime.now(timezone.utc)
    message_text = ""

    # Se estiver Agendado, registra ENTRADA no pátio
    if schedule.status == "Agendado":
        status_update = ScheduleStatusUpdate(
            status="Aguardando_Patio",
            notes=scan_in.notes or "Check-in de entrada efetuado pela portaria física.",
            recorded_by="Portaria / Cancela"
        )
        schedule = await update_schedule_status(db=db, schedule=schedule, status_update=status_update)
        message_text = f"ENTRADA REGISTRADA! Veículo {schedule.vehicle_plate} autorizado a acessar o pátio."
    # Se já estiver dentro do pátio / em doca, registra SAÍDA e libera cancela
    elif schedule.status in ["Em_Doca", "Carregado_Descarregado", "Aguardando_Patio"]:
        status_update = ScheduleStatusUpdate(
            status="Liberado",
            notes=scan_in.notes or "Check-out de saída registrado na cancela da portaria.",
            recorded_by="Portaria / Cancela"
        )
        schedule = await update_schedule_status(db=db, schedule=schedule, status_update=status_update)
        message_text = f"SAÍDA REGISTRADA! Operação concluída para {schedule.vehicle_plate}. Cancela liberada."
    else:
        message_text = f"Veículo {schedule.vehicle_plate} já possui saída registrada ({schedule.status})."

    return GateScanResponse(
        success=True,
        message=message_text,
        schedule_id=str(schedule.id),
        carrier_name=schedule.carrier_name,
        driver_name=schedule.driver_name,
        vehicle_plate=schedule.vehicle_plate,
        dock_name=schedule.dock.name if schedule.dock else "Aguardando chamada de doca",
        previous_status=previous_status,
        new_status=schedule.status,
        checkin_at=schedule.checkin_at or now
    )

