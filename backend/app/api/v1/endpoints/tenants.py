from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_super_admin
from app.models.tenant import Tenant
from app.models.dock import Dock
from app.models.user import User
from app.schemas.tenant import TenantCreate, TenantResponse, TenantUpdate

router = APIRouter(prefix="/tenants", tags=["Super Admin / Tenants"])


@router.get("/", response_model=List[TenantResponse])
def list_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista operadores logísticos.
    Super Admin visualiza todos com dados financeiros.
    Operadores comuns visualizam apenas o seu próprio armazém.
    """
    if current_user.role == "super_admin":
        return db.query(Tenant).order_by(Tenant.created_at.desc()).all()
    
    if not current_user.tenant_id:
        return []
        
    return db.query(Tenant).filter(Tenant.id == current_user.tenant_id).all()


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
        **tenant_in.model_dump()
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
def get_tenant(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtém detalhes do armazém (Super Admin ou operador pertencente ao armazém)"""
    if current_user.role != "super_admin" and current_user.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito ao próprio armazém logístico."
        )

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
