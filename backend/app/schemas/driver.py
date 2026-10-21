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
    warehouse_lat: Optional[float] = None
    warehouse_lon: Optional[float] = None
    geofence_radius_meters: Optional[int] = 1000
    require_geofence: Optional[bool] = False
    geofence_validated: Optional[bool] = False
    checkin_distance_meters: Optional[float] = None


class DriverConfirmation(BaseModel):
    vehicle_plate: str
    driver_cpf: str
    driver_phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy_meters: Optional[float] = None


class GateScanRequest(BaseModel):
    access_token: Optional[str] = None
    vehicle_plate: Optional[str] = None
    tenant_id: Optional[str] = None
    notes: Optional[str] = None
    seal_number: Optional[str] = None
    seal_status: Optional[str] = None
    has_damage: Optional[bool] = None
    damage_notes: Optional[str] = None


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
    checkin_at: Optional[datetime] = None
    seal_number: Optional[str] = None
    seal_status: Optional[str] = None
    badge_info: Optional[dict] = None

