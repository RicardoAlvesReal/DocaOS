import uuid
import secrets
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Index, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    dock_id = Column(UUID(as_uuid=True), ForeignKey("docks.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Token único de acesso do motorista (link WhatsApp)
    access_token = Column(String(64), unique=True, nullable=False, index=True, default=lambda: secrets.token_urlsafe(32))
    
    # Dados da Carga e Transportadora
    carrier_name = Column(String(150), nullable=False)
    cargo_type = Column(String(100), default="Carga Geral", nullable=False)
    invoice_number = Column(String(100), nullable=True)  # Número da NF-e / CTE
    
    # Dados do Motorista e Veículo
    driver_name = Column(String(150), nullable=False)
    driver_cpf = Column(String(20), nullable=False, index=True)
    driver_phone = Column(String(30), nullable=True)
    vehicle_plate = Column(String(20), nullable=False, index=True)
    trailer_plate = Column(String(20), nullable=True)
    
    # Especificações Técnicas de Frota & Equipamento (Diferencial Competitivo)
    vehicle_body_type = Column(String(60), default="Baú Fechado", nullable=True)  # Baú Fechado, Sider Lateral, Frigorífico, Grade Baixa, Prancha
    temperature_controlled = Column(Boolean, default=False, nullable=True)
    temperature_target = Column(String(40), nullable=True)  # Ex: "-18°C", "+4°C"
    
    # Vistoria de Portaria / Auditoria de Lacre & Avarias (ISO 9001 / OEA)
    seal_number = Column(String(60), nullable=True)
    seal_status = Column(String(40), default="Intacto", nullable=True)  # Intacto, Rompido, Divergente, Não_Aplicável
    has_damage = Column(Boolean, default=False, nullable=True)
    damage_notes = Column(Text, nullable=True)
    
    # Ajudantes de Descarga / Chapas (Vinculação a Crachá Digital)
    helper_name = Column(String(150), nullable=True)
    helper_cpf = Column(String(30), nullable=True)
    
    # Janela de Horário Reservada (Time Slot)
    scheduled_window_start = Column(DateTime(timezone=True), nullable=False, index=True)
    scheduled_window_end = Column(DateTime(timezone=True), nullable=False, index=True)

    # Máquina de Estados:
    # Agendado -> Aguardando_Patio -> Em_Doca -> Carregado_Descarregado -> Liberado
    status = Column(String(50), default="Agendado", nullable=False, index=True)
    
    # Timestamps reais de cada fase do pátio
    checkin_at = Column(DateTime(timezone=True), nullable=True)       # Chegada na cancela / portaria
    docked_at = Column(DateTime(timezone=True), nullable=True)        # Encostou na doca
    completed_at = Column(DateTime(timezone=True), nullable=True)     # Fim do carregamento/descarregamento
    departed_at = Column(DateTime(timezone=True), nullable=True)      # Saída da cancela / liberação final
    
    # Auditoria de Geolocalização (Lei 11.442 / Antifraude)
    checkin_latitude = Column(Float, nullable=True)
    checkin_longitude = Column(Float, nullable=True)
    checkin_accuracy_meters = Column(Float, nullable=True)
    checkin_distance_meters = Column(Float, nullable=True)
    geofence_validated = Column(Boolean, default=False, nullable=False)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_schedule_dock_time_window", "dock_id", "scheduled_window_start", "scheduled_window_end"),
    )

    tenant = relationship("Tenant", back_populates="schedules")
    dock = relationship("Dock", back_populates="schedules")
    events = relationship("YardEvent", back_populates="schedule", cascade="all, delete-orphan", order_by="YardEvent.recorded_at")
