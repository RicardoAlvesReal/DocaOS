from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from uuid import UUID

from app.core.database import get_db
from app.models.schedule import Schedule
from app.models.badge import Badge
from app.schemas.driver import GateScanRequest, GateScanResponse
from app.schemas.schedule import ScheduleStatusUpdate
from app.services.schedule_service import update_schedule_status

router = APIRouter(prefix="/gate", tags=["Portaria / Cancela"])


@router.post("/scan", response_model=GateScanResponse)
async def scan_gate_checkin(scan_in: GateScanRequest, db: Session = Depends(get_db)):
    """
    Check-in instantâneo na portaria/cancela ao escanear o QR Code do motorista,
    digitar a placa ou escanear o Crachá Digital de pedestre / ajudante.
    """
    token = scan_in.access_token
    plate = scan_in.vehicle_plate

    # =========================================================================
    # 1. VERIFICAÇÃO SE É LEITURA DE CRACHÁ DIGITAL (PEDESTRE / AJUDANTE)
    # =========================================================================
    is_badge_scan = (token and ("BADGE" in token or "DOCAOS:BADGE:" in token or "ROTAFLOW:BADGE:" in token)) or (plate and "BADGE" in plate)
    if is_badge_scan:
        raw_code = token or plate
        clean_code = raw_code.strip()
        if clean_code.startswith("DOCAOS:BADGE:") or clean_code.startswith("ROTAFLOW:BADGE:"):
            parts = clean_code.split(":")
            if len(parts) >= 3:
                clean_code = parts[2]

        badge = db.query(Badge).filter(
            (Badge.badge_code == clean_code) |
            (Badge.document_number == clean_code)
        ).first()

        if badge:
            now = datetime.now(timezone.utc)
            prev_status = badge.status
            if badge.status != "Ativo" and badge.status != "Em_Patio":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"CRACHÁ {badge.status.upper()}! Acesso não autorizado para {badge.full_name} ({badge.company_name})."
                )

            # Alterna status
            if badge.status == "Ativo":
                badge.status = "Em_Patio"
                action_msg = f"ENTRADA DE PEDESTRE: {badge.full_name} ({badge.category.replace('_', ' ')}) liberado para acesso às áreas: {badge.authorized_zones}."
            else:
                badge.status = "Ativo"
                action_msg = f"SAÍDA DE PEDESTRE REGISTRADA: {badge.full_name} ({badge.category.replace('_', ' ')}) deixou o armazém."

            badge.updated_at = now
            db.commit()

            return GateScanResponse(
                success=True,
                message=action_msg,
                schedule_id=str(badge.id),
                carrier_name=badge.company_name,
                driver_name=badge.full_name,
                vehicle_plate=badge.vehicle_plate or "ACESSO PEDESTRE",
                dock_name=f"Zona: {badge.authorized_zones}",
                previous_status=prev_status,
                new_status=badge.status,
                checkin_at=now,
                badge_info={
                    "badge_code": badge.badge_code,
                    "category": badge.category,
                    "document_number": badge.document_number,
                    "authorized_zones": badge.authorized_zones
                }
            )

    # =========================================================================
    # 2. LEITURA DE VEÍCULO / VIAGEM
    # =========================================================================
    # Tratar leitura direta de QR Code que venha no formato "DOCAOS:<token>:<placa>" ou "ROTAFLOW:<token>:<placa>"
    if token and (token.startswith("DOCAOS:") or token.startswith("ROTAFLOW:")):
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
            detail="Nenhum agendamento ou credencial encontrada para o QR Code ou placa fornecida."
        )

    previous_status = schedule.status
    now = datetime.now(timezone.utc)
    message_text = ""

    # Se estiver Agendado, registra ENTRADA no pátio
    if schedule.status == "Agendado":
        notes_detail = scan_in.notes or "Check-in de entrada efetuado pela portaria física."
        if scan_in.seal_number:
            notes_detail += f" [Lacre: {scan_in.seal_number} ({scan_in.seal_status or 'Intacto'})]"
        if scan_in.has_damage:
            notes_detail += f" [AVARIA IDENTIFICADA: {scan_in.damage_notes or 'Verificada na portaria'}]"

        status_update = ScheduleStatusUpdate(
            status="Aguardando_Patio",
            notes=notes_detail,
            recorded_by="Portaria / Cancela",
            seal_number=scan_in.seal_number,
            seal_status=scan_in.seal_status or "Intacto",
            has_damage=scan_in.has_damage or False,
            damage_notes=scan_in.damage_notes
        )
        schedule = await update_schedule_status(db=db, schedule=schedule, status_update=status_update)
        message_text = f"ENTRADA REGISTRADA! Veículo {schedule.vehicle_plate} autorizado a acessar o pátio."
        if schedule.seal_number:
            message_text += f" (Lacre conferido: {schedule.seal_number})"
    # Se já estiver dentro do pátio / em doca, registra SAÍDA e libera cancela
    elif schedule.status in ["Em_Doca", "Carregado_Descarregado", "Aguardando_Patio"]:
        notes_detail = scan_in.notes or "Check-out de saída registrado na cancela da portaria."
        status_update = ScheduleStatusUpdate(
            status="Liberado",
            notes=notes_detail,
            recorded_by="Portaria / Cancela",
            seal_number=scan_in.seal_number or schedule.seal_number,
            seal_status=scan_in.seal_status or schedule.seal_status,
            has_damage=scan_in.has_damage if scan_in.has_damage is not None else schedule.has_damage,
            damage_notes=scan_in.damage_notes or schedule.damage_notes
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
        checkin_at=schedule.checkin_at or now,
        seal_number=schedule.seal_number,
        seal_status=schedule.seal_status
    )

