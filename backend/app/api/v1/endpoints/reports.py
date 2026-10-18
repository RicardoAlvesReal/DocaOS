import csv
import io
from datetime import datetime, date, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.tenant import Tenant
from app.models.dock import Dock
from app.models.schedule import Schedule
from app.schemas.report import YardReportKpis, CarrierDwellKpi, DockOccupancyKpi

router = APIRouter(prefix="/reports", tags=["Relatórios & Auditoria de Pátio"])


def calculate_schedule_metrics(schedule: Schedule, tenant: Tenant, now: datetime):
    """Calcula tempos de pátio, tempo de doca, tempo excedente e valor da estadia."""
    dwell_minutes = 0.0
    dock_minutes = 0.0
    overdue_minutes = 0.0
    detention_fee = 0.0
    is_overdue = False

    grace = tenant.grace_period_minutes if tenant else 30
    fee_per_hour = tenant.detention_fee_per_hour if tenant else 150.0

    # Tempo total no pátio (checkin até saída ou até agora se ainda estiver no pátio)
    if schedule.checkin_at:
        end_ref = schedule.departed_at or now
        # Garantir datetime com tz ou sem tz compatível
        c_at = schedule.checkin_at
        if c_at.tzinfo is None:
            c_at = c_at.replace(tzinfo=timezone.utc)
        if end_ref.tzinfo is None:
            end_ref = end_ref.replace(tzinfo=timezone.utc)
            
        dwell_minutes = max(0.0, (end_ref - c_at).total_seconds() / 60.0)

        if dwell_minutes > grace:
            is_overdue = True
            overdue_minutes = dwell_minutes - grace
            detention_fee = round((overdue_minutes / 60.0) * fee_per_hour, 2)

    # Tempo em doca (docked até completed/departed)
    if schedule.docked_at:
        dock_end = schedule.completed_at or schedule.departed_at or now
        d_at = schedule.docked_at
        if d_at.tzinfo is None:
            d_at = d_at.replace(tzinfo=timezone.utc)
        if dock_end.tzinfo is None:
            dock_end = dock_end.replace(tzinfo=timezone.utc)
        dock_minutes = max(0.0, (dock_end - d_at).total_seconds() / 60.0)

    return {
        "dwell_minutes": dwell_minutes,
        "dock_minutes": dock_minutes,
        "is_overdue": is_overdue,
        "overdue_minutes": overdue_minutes,
        "detention_fee": detention_fee
    }


@router.get("/kpis", response_model=YardReportKpis)
def get_yard_kpis(
    tenant_id: UUID = Query(..., description="ID do Tenant / Armazém"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Retorna consolidação analítica de KPIs de pátio: Dwell Time, taxa de ocupação,
    estadias acumuladas e tempo por transportadora.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não encontrado.")

    query = db.query(Schedule).filter(Schedule.tenant_id == tenant_id)

    if start_date:
        start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
        query = query.filter(Schedule.scheduled_window_start >= start_dt)
    if end_date:
        end_dt = datetime.combine(end_date, datetime.max.time(), tzinfo=timezone.utc)
        query = query.filter(Schedule.scheduled_window_start <= end_dt)

    schedules = query.all()
    now = datetime.now(timezone.utc)

    total_schedules = len(schedules)
    total_checked_in = sum(1 for s in schedules if s.checkin_at is not None)
    total_completed = sum(1 for s in schedules if s.status in ["Carregado_Descarregado", "Liberado"])

    dwell_times = []
    dock_times = []
    overdue_count = 0
    total_detention = 0.0

    status_dist = {
        "Agendado": 0,
        "Aguardando_Patio": 0,
        "Em_Doca": 0,
        "Carregado_Descarregado": 0,
        "Liberado": 0,
        "Cancelado": 0
    }

    carrier_groups = {}

    for s in schedules:
        status_dist[s.status] = status_dist.get(s.status, 0) + 1
        metrics = calculate_schedule_metrics(s, tenant, now)

        if s.checkin_at:
            dwell_times.append(metrics["dwell_minutes"])
        if s.docked_at:
            dock_times.append(metrics["dock_minutes"])
        if metrics["is_overdue"]:
            overdue_count += 1
            total_detention += metrics["detention_fee"]

        c_name = s.carrier_name or "Desconhecida"
        if c_name not in carrier_groups:
            carrier_groups[c_name] = {
                "trips": 0,
                "total_dwell": 0.0,
                "overdues": 0,
                "fees": 0.0
            }
        carrier_groups[c_name]["trips"] += 1
        carrier_groups[c_name]["total_dwell"] += metrics["dwell_minutes"]
        if metrics["is_overdue"]:
            carrier_groups[c_name]["overdues"] += 1
            carrier_groups[c_name]["fees"] += metrics["detention_fee"]

    avg_dwell = round(sum(dwell_times) / len(dwell_times), 1) if dwell_times else 0.0
    avg_dock = round(sum(dock_times) / len(dock_times), 1) if dock_times else 0.0

    carriers_kpis = [
        CarrierDwellKpi(
            carrier_name=name,
            trip_count=data["trips"],
            avg_dwell_minutes=round(data["total_dwell"] / data["trips"], 1) if data["trips"] > 0 else 0.0,
            overdue_count=data["overdues"],
            detention_fee_total=round(data["fees"], 2)
        )
        for name, data in sorted(carrier_groups.items(), key=lambda x: x[1]["trips"], reverse=True)
    ]

    # KPIs de Docas
    docks = db.query(Dock).filter(Dock.tenant_id == tenant_id).all()
    docks_kpis = []
    for d in docks:
        count = sum(1 for s in schedules if s.dock_id == d.id)
        docks_kpis.append(
            DockOccupancyKpi(
                dock_id=d.id,
                dock_name=d.name,
                dock_type=d.dock_type,
                status=d.status,
                appointments_count=count
            )
        )

    return YardReportKpis(
        tenant_name=tenant.name,
        period_start=datetime.combine(start_date, datetime.min.time()) if start_date else None,
        period_end=datetime.combine(end_date, datetime.max.time()) if end_date else None,
        total_schedules=total_schedules,
        total_checked_in=total_checked_in,
        total_completed=total_completed,
        avg_dwell_minutes=avg_dwell,
        avg_dock_minutes=avg_dock,
        overdue_sla_count=overdue_count,
        detention_fee_total=round(total_detention, 2),
        currency="BRL",
        status_distribution=status_dist,
        carriers_kpis=carriers_kpis,
        docks_kpis=docks_kpis
    )


@router.get("/export-csv")
def export_yard_csv(
    tenant_id: UUID = Query(..., description="ID do Tenant / Armazém"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Gera exportação em CSV com UTF-8 BOM e delimitador ';' contendo todos os timestamps auditáveis,
    permanência e cálculo de estadias para defesa de custos logísticos.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não encontrado.")

    query = db.query(Schedule).filter(Schedule.tenant_id == tenant_id)

    if start_date:
        start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
        query = query.filter(Schedule.scheduled_window_start >= start_dt)
    if end_date:
        end_dt = datetime.combine(end_date, datetime.max.time(), tzinfo=timezone.utc)
        query = query.filter(Schedule.scheduled_window_start <= end_dt)

    schedules = query.order_by(Schedule.scheduled_window_start.desc()).all()
    now = datetime.now(timezone.utc)

    output = io.StringIO()
    # Adiciona UTF-8 BOM para o Excel abrir com acentuação correta no Windows
    output.write("\ufeff")
    writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_MINIMAL)

    # Cabeçalho
    writer.writerow([
        "ID Agendamento",
        "Data Janela",
        "Hora Início Prevista",
        "Hora Fim Prevista",
        "Status Atual",
        "Placa Cavalo",
        "Placa Carreta",
        "Transportadora",
        "Tipo de Carga",
        "NF-e / Documento",
        "Motorista",
        "CPF Motorista",
        "Telefone Motorista",
        "Doca Alocada",
        "Check-in Portaria",
        "Entrada em Doca",
        "Fim da Operação",
        "Saída da Portaria",
        "Tempo Total Pátio (min)",
        "Tempo em Doca (min)",
        "Carência Contratual (min)",
        "Tempo Excedente (min)",
        "Estouro de SLA",
        "Taxa Hora Parada (R$)",
        "Custo Estadia Estimado (R$)",
        "Observações"
    ])

    def fmt_dt(dt):
        return dt.strftime("%d/%m/%Y %H:%M:%S") if dt else "-"

    for s in schedules:
        metrics = calculate_schedule_metrics(s, tenant, now)
        dock_name = s.dock.name if s.dock else "Não alocada"

        writer.writerow([
            str(s.id),
            s.scheduled_window_start.strftime("%d/%m/%Y"),
            s.scheduled_window_start.strftime("%H:%M"),
            s.scheduled_window_end.strftime("%H:%M"),
            s.status.replace("_", " "),
            s.vehicle_plate,
            s.trailer_plate or "-",
            s.carrier_name,
            s.cargo_type,
            s.invoice_number or "-",
            s.driver_name,
            s.driver_cpf,
            s.driver_phone or "-",
            dock_name,
            fmt_dt(s.checkin_at),
            fmt_dt(s.docked_at),
            fmt_dt(s.completed_at),
            fmt_dt(s.departed_at),
            f"{metrics['dwell_minutes']:.1f}".replace(".", ","),
            f"{metrics['dock_minutes']:.1f}".replace(".", ","),
            tenant.grace_period_minutes,
            f"{metrics['overdue_minutes']:.1f}".replace(".", ","),
            "SIM" if metrics["is_overdue"] else "NÃO",
            f"{tenant.detention_fee_per_hour:.2f}".replace(".", ","),
            f"{metrics['detention_fee']:.2f}".replace(".", ","),
            (s.notes or "").replace("\n", " ")
        ])

    csv_content = output.getvalue()
    filename = f"relatorio_permanencia_patio_{tenant.slug}_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"

    return Response(
        content=csv_content.encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
