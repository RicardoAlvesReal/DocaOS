import uuid
import secrets
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Badge(Base):
    __tablename__ = "badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Código único criptografado do crachá para leitura óptica em QR Code
    badge_code = Column(String(64), unique=True, nullable=False, index=True, default=lambda: f"BADGE-{secrets.token_hex(6).upper()}")
    
    # Identificação da Pessoa Física
    full_name = Column(String(150), nullable=False)
    document_number = Column(String(30), nullable=False, index=True)  # CPF / CNH / RG
    phone = Column(String(30), nullable=True)
    
    # Cargo / Categoria
    # Categorias: Motorista, Ajudante_Chapa, Prestador_Servico, Fiscal_Patio, Visitante
    category = Column(String(60), nullable=False, default="Ajudante_Chapa", index=True)
    company_name = Column(String(150), nullable=False)
    vehicle_plate = Column(String(20), nullable=True)
    
    # Zonas de Segurança Autorizadas
    authorized_zones = Column(String(255), default="Pátio & Docas", nullable=False)
    
    # Status: Ativo, Em_Patio, Bloqueado, Expirado
    status = Column(String(40), default="Ativo", nullable=False, index=True)
    
    valid_until = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    tenant = relationship("Tenant")
