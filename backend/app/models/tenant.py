import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    cnpj = Column(String(20), nullable=True)
    max_docks = Column(Integer, default=10, nullable=False)
    grace_period_minutes = Column(Integer, default=30, nullable=False)  # Tolerância antes de contar atraso
    detention_fee_per_hour = Column(Float, default=150.0, nullable=False)  # Valor da hora parada (multa de estadia)

    # Níveis de Licenciamento & Feature Flags (Controlado pelo Super Admin RAOS)
    plan_tier = Column(String(50), default="Professional", nullable=False)  # Starter, Professional, Enterprise
    has_whatsapp_automation = Column(Boolean, default=False, nullable=False)  # Robô de Notificação de WhatsApp
    has_carrier_portal = Column(Boolean, default=False, nullable=False)  # Portal de Auto-Agendamento do Transportador

    # Gestão Comercial & Faturamento Direto (Boletos Bancários)
    monthly_fee = Column(Float, default=1800.0, nullable=False)  # Mensalidade definida livremente (R$/mês)
    billing_due_day = Column(Integer, default=10, nullable=False)  # Dia de vencimento do boleto
    billing_status = Column(String(50), default="active", nullable=False)  # active, trial, overdue, cancelled
    contact_name = Column(String(255), nullable=True)  # Contato financeiro/operacional no cliente
    contact_email = Column(String(255), nullable=True)  # E-mail para envio de boletos
    contact_phone = Column(String(50), nullable=True)  # Telefone do responsável

    # Configuração de Gateway WhatsApp do Armazém (Opcional / Provedor Customizado)
    whatsapp_api_url = Column(String(255), nullable=True)
    whatsapp_api_token = Column(String(255), nullable=True)
    whatsapp_instance = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relacionamentos
    docks = relationship("Dock", back_populates="tenant", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="tenant", cascade="all, delete-orphan")
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
