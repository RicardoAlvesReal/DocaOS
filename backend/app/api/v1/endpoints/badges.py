import secrets
import qrcode
import io
import base64
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.badge import Badge
from app.models.tenant import Tenant
from app.schemas.badge import BadgeCreate, BadgeUpdate, BadgeResponse

router = APIRouter(prefix="/badges", tags=["Crachá Digital & Credenciamento"])


def generate_badge_qr_base64(badge_code: str, doc: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(f"DOCAOS:BADGE:{badge_code}:{doc}")
    qr.make(fit=True)
    img = qr.make_image(fill_color="#001c3d", back_color="#ffffff")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"


@router.get("/", response_model=List[BadgeResponse])
def list_badges(
    tenant_id: UUID = Query(...),
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lista crachás digitais com filtros por tenant, categoria e busca"""
    query = db.query(Badge).filter(Badge.tenant_id == tenant_id)
    if category:
        query = query.filter(Badge.category == category)
    if status_filter:
        query = query.filter(Badge.status == status_filter)
    if q:
        search = f"%{q.strip()}%"
        query = query.filter(
            (Badge.full_name.ilike(search)) |
            (Badge.document_number.ilike(search)) |
            (Badge.company_name.ilike(search)) |
            (Badge.vehicle_plate.ilike(search)) |
            (Badge.badge_code.ilike(search))
        )
    
    badges = query.order_by(Badge.created_at.desc()).all()
    results = []
    for b in badges:
        res = BadgeResponse.model_validate(b)
        res.qr_code_data = generate_badge_qr_base64(b.badge_code, b.document_number)
        results.append(res)
    return results


@router.post("/", response_model=BadgeResponse, status_code=status.HTTP_201_CREATED)
def create_badge(badge_in: BadgeCreate, db: Session = Depends(get_db)):
    """Emite um novo Crachá Digital com QR Code instantâneo"""
    tenant = db.query(Tenant).filter(Tenant.id == badge_in.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Armazém / Tenant não localizado.")

    code = f"BADGE-{secrets.token_hex(4).upper()}"
    new_badge = Badge(
        tenant_id=badge_in.tenant_id,
        badge_code=code,
        full_name=badge_in.full_name.strip(),
        document_number=badge_in.document_number.strip(),
        phone=badge_in.phone,
        category=badge_in.category,
        company_name=badge_in.company_name.strip(),
        vehicle_plate=badge_in.vehicle_plate,
        authorized_zones=badge_in.authorized_zones or "Pátio & Docas",
        status=badge_in.status or "Ativo",
        valid_until=badge_in.valid_until,
        notes=badge_in.notes
    )
    db.add(new_badge)
    db.commit()
    db.refresh(new_badge)

    res = BadgeResponse.model_validate(new_badge)
    res.qr_code_data = generate_badge_qr_base64(new_badge.badge_code, new_badge.document_number)
    return res


@router.get("/{badge_id}", response_model=BadgeResponse)
def get_badge(badge_id: UUID, db: Session = Depends(get_db)):
    """Retorna detalhes do crachá especificado"""
    b = db.query(Badge).filter(Badge.id == badge_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Crachá não encontrado.")
    res = BadgeResponse.model_validate(b)
    res.qr_code_data = generate_badge_qr_base64(b.badge_code, b.document_number)
    return res


@router.patch("/{badge_id}", response_model=BadgeResponse)
def update_badge(badge_id: UUID, badge_update: BadgeUpdate, db: Session = Depends(get_db)):
    """Atualiza status ou dados do crachá (ex: Bloqueado por justa causa ou descredenciamento)"""
    b = db.query(Badge).filter(Badge.id == badge_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Crachá não encontrado.")

    data = badge_update.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(b, field, val)

    b.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(b)

    res = BadgeResponse.model_validate(b)
    res.qr_code_data = generate_badge_qr_base64(b.badge_code, b.document_number)
    return res


@router.post("/validate/{code}")
def validate_badge_access(code: str, tenant_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    """
    Endpoint de validação para Catracas, Portaria física e Leitor Óptico.
    Aceita código do crachá (BADGE-XXXX), QR string formatada ou documento (CPF).
    """
    clean_code = code.strip()
    if clean_code.startswith("ROTAFLOW:BADGE:"):
        parts = clean_code.split(":")
        if len(parts) >= 3:
            clean_code = parts[2]

    query = db.query(Badge).filter(
        (Badge.badge_code == clean_code) |
        (Badge.document_number == clean_code)
    )
    if tenant_id:
        query = query.filter(Badge.tenant_id == tenant_id)

    badge = query.first()
    if not badge:
        return {
            "authorized": False,
            "status": "NOT_FOUND",
            "message": "Credencial não localizada no sistema. Acesso negado."
        }

    if badge.status != "Ativo" and badge.status != "Em_Patio":
        return {
            "authorized": False,
            "status": badge.status,
            "badge_code": badge.badge_code,
            "full_name": badge.full_name,
            "category": badge.category,
            "company_name": badge.company_name,
            "message": f"CREDENCIAL {badge.status.upper()}! Entrada não autorizada."
        }

    # Atualiza status para Em_Patio na entrada
    if badge.status == "Ativo":
        badge.status = "Em_Patio"
    else:
        badge.status = "Ativo"  # Registra saída
    badge.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "authorized": True,
        "status": badge.status,
        "badge_code": badge.badge_code,
        "full_name": badge.full_name,
        "document_number": badge.document_number,
        "category": badge.category,
        "company_name": badge.company_name,
        "vehicle_plate": badge.vehicle_plate,
        "authorized_zones": badge.authorized_zones,
        "message": f"ACESSO AUTORIZADO! {badge.category.replace('_', ' ')}: {badge.full_name} ({badge.company_name})."
    }
