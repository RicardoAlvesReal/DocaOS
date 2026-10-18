from pydantic import BaseModel, ConfigDict, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class ScheduleBase(BaseModel):
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

    @field_validator("vehicle_plate")
    @classmethod
    def clean_plate(cls, v: str) -> str:
        return v.replace("-", "").replace(" ", "").upper().strip()

    @field_validator("driver_cpf")
    @classmethod
    def clean_cpf(cls, v: str) -> str:
        return v.replace(".", "").replace("-", "").strip()


class ScheduleCreate(ScheduleBase):
    tenant_id: UUID


class ScheduleStatusUpdate(BaseModel):
    status: str  # Agendado, Aguardando_Patio, Em_Doca, Carregado_Descarregado, Liberado, Cancelado
    dock_id: Optional[UUID] = None
    notes: Optional[str] = None
    recorded_by: Optional[str] = "Torre de Controle"


class YardEventResponse(BaseModel):
    id: UUID
    from_status: Optional[str]
    to_status: str
    recorded_at: datetime
    recorded_by: str
    notes: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class ScheduleResponse(ScheduleBase):
    id: UUID
    tenant_id: UUID
    access_token: str
    status: str
    checkin_at: Optional[datetime] = None
    docked_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    departed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    driver_access_url: Optional[str] = None
    dock_name: Optional[str] = None
    events: List[YardEventResponse] = []

    model_config = ConfigDict(from_attributes=True)
