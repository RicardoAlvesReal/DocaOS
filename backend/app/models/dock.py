import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Dock(Base):
    __tablename__ = "docks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # Ex: "Doca 01 - Carga Seca"
    code = Column(String(50), nullable=False)  # Ex: "DOCA-01"
    dock_type = Column(String(50), default="Geral", nullable=False)  # Seca, Frigorífica, Geral, Granel
    status = Column(String(50), default="Livre", nullable=False)  # Livre, Ocupada, Manutenção
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "code", name="uq_tenant_dock_code"),
    )

    tenant = relationship("Tenant", back_populates="docks")
    schedules = relationship("Schedule", back_populates="dock")
