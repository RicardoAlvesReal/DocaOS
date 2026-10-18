from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DriverCheckinView(BaseModel):
    access_token: str
    tenant_name: str
    carrier_name: str
    cargo_type: str
    driver_name: str
    driver_cpf_masked: str
    vehicle_plate: str
    trailer_plate: Optional[str] = None
    scheduled_window_start: datetime
    scheduled_window_end: datetime
    dock_name: Optional[str] = None
    status: str
    qr_code_data: str


class DriverConfirmation(BaseModel):
    vehicle_plate: str
    driver_cpf: str
    driver_phone: Optional[str] = None


class GateScanRequest(BaseModel):
    access_token: Optional[str] = None
    vehicle_plate: Optional[str] = None
    tenant_id: Optional[str] = None
    notes: Optional[str] = None


class GateScanResponse(BaseModel):
    success: bool
    message: str
    schedule_id: str
    carrier_name: str
    driver_name: str
    vehicle_plate: str
    dock_name: Optional[str] = None
    previous_status: str
    new_status: str
    checkin_at: datetime
