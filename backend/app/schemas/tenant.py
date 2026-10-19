from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional


class TenantBase(BaseModel):
    name: str
    slug: str
    cnpj: Optional[str] = None
    max_docks: int = 10
    grace_period_minutes: int = 30
    detention_fee_per_hour: float = 150.0
    plan_tier: Optional[str] = "Professional"
    has_whatsapp_automation: Optional[bool] = False
    has_carrier_portal: Optional[bool] = False
    monthly_fee: Optional[float] = 1800.0
    billing_due_day: Optional[int] = 10
    billing_status: Optional[str] = "active"
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    whatsapp_api_url: Optional[str] = None
    whatsapp_api_token: Optional[str] = None
    whatsapp_instance: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geofence_radius_meters: Optional[int] = 1000
    require_geofence: Optional[bool] = False
    has_telemetry_integration: Optional[bool] = False
    telemetry_provider: Optional[str] = "Generic_Webhook"
    telemetry_api_key: Optional[str] = None
    telemetry_client_id: Optional[str] = None
    telemetry_endpoint: Optional[str] = None


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    cnpj: Optional[str] = None
    max_docks: Optional[int] = None
    grace_period_minutes: Optional[int] = None
    detention_fee_per_hour: Optional[float] = None
    plan_tier: Optional[str] = None
    has_whatsapp_automation: Optional[bool] = None
    has_carrier_portal: Optional[bool] = None
    monthly_fee: Optional[float] = None
    billing_due_day: Optional[int] = None
    billing_status: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    whatsapp_api_url: Optional[str] = None
    whatsapp_api_token: Optional[str] = None
    whatsapp_instance: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geofence_radius_meters: Optional[int] = None
    require_geofence: Optional[bool] = None
    has_telemetry_integration: Optional[bool] = None
    telemetry_provider: Optional[str] = None
    telemetry_api_key: Optional[str] = None
    telemetry_client_id: Optional[str] = None
    telemetry_endpoint: Optional[str] = None


class TenantResponse(TenantBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
