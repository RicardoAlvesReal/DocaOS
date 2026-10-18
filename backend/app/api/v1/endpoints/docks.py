from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.models.dock import Dock
from app.models.tenant import Tenant
from app.schemas.dock import DockCreate, DockResponse, DockUpdate

router = APIRouter(prefix="/docks", tags=["Docas"])


@router.get("/", response_model=List[DockResponse])
def list_docks(tenant_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    """Lista as docas físicas, opcionalmente filtradas por Tenant"""
    query = db.query(Dock)
    if tenant_id:
        query = query.filter(Dock.tenant_id == tenant_id)
    return query.order_by(Dock.code.asc()).all()


@router.post("/", response_model=DockResponse, status_code=status.HTTP_201_CREATED)
def create_dock(dock_in: DockCreate, db: Session = Depends(get_db)):
    """Adiciona uma nova doca física ao armazém respeitando o limite contratado"""
    tenant = db.query(Tenant).filter(Tenant.id == dock_in.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant não encontrado.")

    current_count = db.query(Dock).filter(Dock.tenant_id == dock_in.tenant_id).count()
    if current_count >= tenant.max_docks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Limite de docas atingido ({current_count}/{tenant.max_docks}). Solicite um upgrade de licença com a RAOS."
        )

    existing_code = db.query(Dock).filter(
        Dock.tenant_id == dock_in.tenant_id,
        Dock.code == dock_in.code
    ).first()
    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Doca com o código '{dock_in.code}' já existe para este Tenant."
        )

    dock = Dock(
        tenant_id=dock_in.tenant_id,
        name=dock_in.name,
        code=dock_in.code,
        dock_type=dock_in.dock_type,
        status=dock_in.status
    )
    db.add(dock)
    db.commit()
    db.refresh(dock)
    return dock


@router.patch("/{dock_id}", response_model=DockResponse)
def update_dock(dock_id: UUID, dock_in: DockUpdate, db: Session = Depends(get_db)):
    dock = db.query(Dock).filter(Dock.id == dock_id).first()
    if not dock:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doca não encontrada.")

    update_data = dock_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dock, field, value)

    db.commit()
    db.refresh(dock)
    return dock
