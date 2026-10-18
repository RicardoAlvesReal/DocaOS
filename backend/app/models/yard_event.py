import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class YardEvent(Base):
    __tablename__ = "yard_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False, index=True)
    
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    recorded_by = Column(String(100), default="Sistema", nullable=False)  # Ex: "Portaria", "Operador Doca", "API", "Motorista"
    notes = Column(Text, nullable=True)

    schedule = relationship("Schedule", back_populates="events")
