from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    user_email: str
    role: str
    tenant_id: Optional[UUID] = None
    tenant_name: Optional[str] = None


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "tenant_operator"
    tenant_id: Optional[UUID] = None
