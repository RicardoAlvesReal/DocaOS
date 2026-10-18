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


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    cnpj: Optional[str] = None
    max_docks: Optional[int] = None
    grace_period_minutes: Optional[int] = None
    detention_fee_per_hour: Optional[float] = None


class TenantResponse(TenantBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
