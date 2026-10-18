from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional


class DockBase(BaseModel):
    name: str
    code: str
    dock_type: str = "Geral"
    status: str = "Livre"


class DockCreate(DockBase):
    tenant_id: UUID


class DockUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    dock_type: Optional[str] = None
    status: Optional[str] = None


class DockResponse(DockBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
