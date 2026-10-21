from pydantic import BaseModel, ConfigDict, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional


class BadgeBase(BaseModel):
    full_name: str
    document_number: str
    phone: Optional[str] = None
    category: str = "Ajudante_Chapa"
    company_name: str
    vehicle_plate: Optional[str] = None
    authorized_zones: Optional[str] = "Pátio & Docas"
    status: Optional[str] = "Ativo"
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None

    @field_validator("document_number")
    @classmethod
    def clean_doc(cls, v: str) -> str:
        return v.replace(".", "").replace("-", "").replace("/", "").strip()

    @field_validator("vehicle_plate")
    @classmethod
    def clean_plate(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        return v.replace("-", "").replace(" ", "").upper().strip()


class BadgeCreate(BadgeBase):
    tenant_id: UUID


class BadgeUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    category: Optional[str] = None
    company_name: Optional[str] = None
    vehicle_plate: Optional[str] = None
    authorized_zones: Optional[str] = None
    status: Optional[str] = None
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None


class BadgeResponse(BadgeBase):
    id: UUID
    tenant_id: UUID
    badge_code: str
    created_at: datetime
    updated_at: datetime
    qr_code_data: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
