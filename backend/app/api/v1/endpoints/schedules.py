import csv
import io
from dateutil import parser as date_parser
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import Response
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


@router.get("/batch/template-csv")
def download_batch_template():
    """Retorna planilha modelo (.csv) com colunas e linhas de exemplo para preenchimento em lote."""
    content = "\ufeffplaca_veiculo;placa_carreta;transportadora;tipo_carga;numero_nfe;nome_motorista;cpf_motorista;telefone_motorista;codigo_doca;inicio_janela;fim_janela;observacoes\n"
    content += "ABC1D23;XYZ9876;Transportadora Exemplo;Carga Seca;NF-12345;José da Silva;123.456.789-00;11987654321;DOCA-01;2026-10-18 08:00;2026-10-18 10:00;Prioridade no descarregamento\n"
    content += "BRA2E19;;Logística Brasil;Congelados;NF-99887;Antônio Silveira;987.654.321-99;11976543210;DOCA-02;2026-10-18 10:30;2026-10-18 12:30;Carga refrigerada a -18C\n"
    return Response(
        content=content.encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="modelo_importacao_agendamentos_docaos.csv"'}
    )


@router.post("/batch/import")
async def batch_import_schedules(
    tenant_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Importa múltiplos agendamentos a partir de uma planilha CSV.
    Valida placas, horários e conflitos de doca.
    Retorna resumo de sucessos e linhas com inconsistências.
    """
    raw_content = await file.read()
    try:
        text = raw_content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw_content.decode("latin-1", errors="replace")

    # Detectar delimitador (';' ou ',')
    sample = text[:1024]
    delimiter = ";" if ";" in sample else ","

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    
    # Mapear docas existentes do tenant para busca rápida por código ou nome
    tenant_docks = db.query(Dock).filter(Dock.tenant_id == tenant_id).all()
    dock_map = {}
    for d in tenant_docks:
        dock_map[d.code.upper().strip()] = d.id
        dock_map[d.name.upper().strip()] = d.id

    created_list = []
    errors = []
    line_number = 1

    for row in reader:
        line_number += 1
        # Trata chaves minúsculas e sem espaços
        normalized_row = {k.strip().lower(): (v.strip() if v else "") for k, v in row.items() if k}
        
        plate = normalized_row.get("placa_veiculo") or normalized_row.get("placa")
        driver_name = normalized_row.get("nome_motorista") or normalized_row.get("motorista")
        driver_cpf = normalized_row.get("cpf_motorista") or normalized_row.get("cpf")
        carrier_name = normalized_row.get("transportadora")
        cargo_type = normalized_row.get("tipo_carga") or "Carga Geral"
        invoice_number = normalized_row.get("numero_nfe") or normalized_row.get("nf") or normalized_row.get("nfe")
        trailer_plate = normalized_row.get("placa_carreta") or normalized_row.get("carreta")
        driver_phone = normalized_row.get("telefone_motorista") or normalized_row.get("telefone")
        notes = normalized_row.get("observacoes") or normalized_row.get("obs")
        dock_code = normalized_row.get("codigo_doca") or normalized_row.get("doca")
        start_str = normalized_row.get("inicio_janela") or normalized_row.get("inicio")
        end_str = normalized_row.get("fim_janela") or normalized_row.get("fim")

        if not plate or not driver_name or not driver_cpf or not carrier_name or not start_str or not end_str:
            errors.append({
                "linha": line_number,
                "placa": plate or "-",
                "erro": "Campos obrigatórios ausentes (placa, motorista, cpf, transportadora, início ou fim)."
            })
            continue

        # Parsing de datas
        try:
            start_dt = date_parser.parse(start_str, dayfirst=True)
            end_dt = date_parser.parse(end_str, dayfirst=True)
        except Exception as e:
            errors.append({
                "linha": line_number,
                "placa": plate,
                "erro": f"Formato de data/hora inválido ({start_str} / {end_str}). Use YYYY-MM-DD HH:MM ou DD/MM/YYYY HH:MM."
            })
            continue

        if start_dt >= end_dt:
            errors.append({
                "linha": line_number,
                "placa": plate,
                "erro": "Horário de início da janela deve ser anterior ao horário de término."
            })
            continue

        # Identificar doca se informada
        dock_id = None
        if dock_code:
            dock_id = dock_map.get(dock_code.upper().strip())
            if not dock_id:
                errors.append({
                    "linha": line_number,
                    "placa": plate,
                    "erro": f"Doca '{dock_code}' não encontrada para este Armazém."
                })
                continue

            # Checar colisão de horário na doca
            has_collision = check_dock_concurrency(
                db=db,
                dock_id=dock_id,
                start_time=start_dt,
                end_time=end_dt
            )
            if has_collision:
                errors.append({
                    "linha": line_number,
                    "placa": plate,
                    "erro": f"Conflito de agenda: Doca '{dock_code}' já está ocupada nessa janela."
                })
                continue

        try:
            sch_in = ScheduleCreate(
                tenant_id=tenant_id,
                carrier_name=carrier_name,
                cargo_type=cargo_type,
                invoice_number=invoice_number,
                driver_name=driver_name,
                driver_cpf=driver_cpf,
                driver_phone=driver_phone,
                vehicle_plate=plate,
                trailer_plate=trailer_plate,
                dock_id=dock_id,
                scheduled_window_start=start_dt,
                scheduled_window_end=end_dt,
                notes=notes
            )
            created = create_schedule(db=db, schedule_in=sch_in)
            created_list.append(enrich_schedule_response(created))
        except Exception as err:
            errors.append({
                "linha": line_number,
                "placa": plate,
                "erro": str(err)
            })

    return {
        "success": True,
        "total_lines_read": line_number - 1,
        "created_count": len(created_list),
        "failed_count": len(errors),
        "errors": errors,
        "created_schedules": created_list
    }
