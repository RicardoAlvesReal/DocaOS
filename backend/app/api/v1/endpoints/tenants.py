from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.dependencies import require_super_admin
from app.models.tenant import Tenant
from app.models.dock import Dock
from app.models.user import User
from app.schemas.tenant import TenantCreate, TenantResponse, TenantUpdate

router = APIRouter(prefix="/tenants", tags=["Super Admin / Tenants"])


@router.get("/", response_model=List[TenantResponse])
def list_tenants(db: Session = Depends(get_db)):
    """Lista os operadores logísticos cadastrados"""
    return db.query(Tenant).order_by(Tenant.created_at.desc()).all()


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
def create_tenant(
    tenant_in: TenantCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """
    Cadastro de novo Armazém/Cliente Logístico.
    EXCLUSIVO RAOS: Requer token com role 'super_admin'.
    """
    existing = db.query(Tenant).filter(Tenant.slug == tenant_in.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slug '{tenant_in.slug}' já está em uso por outro Tenant."
        )

    tenant = Tenant(
        name=tenant_in.name,
        slug=tenant_in.slug,
        cnpj=tenant_in.cnpj,
        max_docks=tenant_in.max_docks,
        grace_period_minutes=tenant_in.grace_period_minutes,
        detention_fee_per_hour=tenant_in.detention_fee_per_hour
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    # Criação inicial automática das docas contratadas
    initial_docks_to_create = min(tenant.max_docks, 4)
    for i in range(1, initial_docks_to_create + 1):
        dock = Dock(
            tenant_id=tenant.id,
            name=f"Doca {i:02d} - Carga Geral",
            code=f"DOCA-{i:02d}",
            dock_type="Geral",
            status="Livre"
        )
        db.add(dock)
    db.commit()

    return tenant


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(tenant_id: UUID, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não encontrado.")
    return tenant


@router.patch("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: UUID,
    tenant_in: TenantUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_super_admin)
):
    """Atualização de limites e regras de cobrança do cliente (Exclusivo Super Admin)"""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não encontrado.")
    
    update_data = tenant_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)

    db.commit()
    db.refresh(tenant)
    return tenant
