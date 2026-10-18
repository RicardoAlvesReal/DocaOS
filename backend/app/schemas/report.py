from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import List, Dict, Optional
from datetime import datetime


class CarrierDwellKpi(BaseModel):
    carrier_name: str
    trip_count: int
    avg_dwell_minutes: float
    overdue_count: int
    detention_fee_total: float

    model_config = ConfigDict(from_attributes=True)


class DockOccupancyKpi(BaseModel):
    dock_id: UUID
    dock_name: str
    dock_type: str
    status: str
    appointments_count: int

    model_config = ConfigDict(from_attributes=True)


class YardReportKpis(BaseModel):
    tenant_name: str
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    total_schedules: int
    total_checked_in: int
    total_completed: int
    avg_dwell_minutes: float
    avg_dock_minutes: float
    overdue_sla_count: int
    detention_fee_total: float
    currency: str = "BRL"
    status_distribution: Dict[str, int]
    carriers_kpis: List[CarrierDwellKpi]
    docks_kpis: List[DockOccupancyKpi]

    model_config = ConfigDict(from_attributes=True)

