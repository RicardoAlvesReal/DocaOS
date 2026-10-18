import uuid
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1.router import api_router
from app.services.websocket_manager import manager
from app.core.security import get_password_hash
from app.models.tenant import Tenant
from app.models.dock import Dock
from app.models.schedule import Schedule
from app.models.yard_event import YardEvent
from app.models.user import User

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Middleware API para Orquestração de Pátios (YMS) e Agendamento de Docas B2B",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas da API REST
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.websocket("/ws/yard/{tenant_id}")
async def websocket_yard_endpoint(websocket: WebSocket, tenant_id: str):
    """Canal WebSocket para sincronização em tempo real do Kanban da Torre de Controle"""
    await manager.connect(websocket, tenant_id)
    try:
        while True:
            # Mantém conexão viva e escuta mensagens de heartbeat/ping do frontend
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, tenant_id)
    except Exception:
        manager.disconnect(websocket, tenant_id)


def seed_initial_demo_data():
    """Gera armazém piloto, docas e agendamentos iniciais caso a base esteja limpa"""
    db = SessionLocal()
    try:
        existing_tenant = db.query(Tenant).first()
        if not existing_tenant:
            # 1. Tenant Piloto
            pilot_tenant = Tenant(
                name="ComLog & Terminais Retroportuários",
                slug="comlog-santos",
                cnpj="12.345.678/0001-90",
                max_docks=8,
                grace_period_minutes=30,
                detention_fee_per_hour=180.0
            )
            db.add(pilot_tenant)
            db.commit()
            db.refresh(pilot_tenant)

            # 2. Super Admin RAOS e Gerente do Tenant
            super_admin = User(
                name="Gestor RAOS Tecnologia",
                email="admin@raos.com.br",
                hashed_password=get_password_hash("raos2026"),
                role="super_admin",
                is_active=True
            )
            tenant_manager = User(
                tenant_id=pilot_tenant.id,
                name="Carlos Ferreira (Gerente de Pátio)",
                email="operacao@comlog.com.br",
                hashed_password=get_password_hash("comlog123"),
                role="tenant_manager",
                is_active=True
            )
            db.add_all([super_admin, tenant_manager])

            # 3. Docas Físicas
            doca1 = Dock(tenant_id=pilot_tenant.id, name="Doca 01 - Carga Seca", code="DOCA-01", dock_type="Seca", status="Ocupada")
            doca2 = Dock(tenant_id=pilot_tenant.id, name="Doca 02 - Frigorífica", code="DOCA-02", dock_type="Frigorífica", status="Livre")
            doca3 = Dock(tenant_id=pilot_tenant.id, name="Doca 03 - Geral", code="DOCA-03", dock_type="Geral", status="Livre")
            doca4 = Dock(tenant_id=pilot_tenant.id, name="Doca 04 - Granel", code="DOCA-04", dock_type="Granel", status="Livre")
            db.add_all([doca1, doca2, doca3, doca4])
            db.commit()

            # 4. Agendamentos Demonstrativos para o Kanban
            now = datetime.now(timezone.utc)
            
            # Caminhão em Doca (descarregando)
            sch1 = Schedule(
                tenant_id=pilot_tenant.id,
                dock_id=doca1.id,
                carrier_name="Jamef Transportes",
                cargo_type="Eletrônicos e Peças",
                driver_name="Antônio Carlos Silveira",
                driver_cpf="28391829102",
                driver_phone="11987654321",
                vehicle_plate="BRA2E19",
                trailer_plate="ABC9876",
                scheduled_window_start=now - timedelta(hours=2),
                scheduled_window_end=now + timedelta(hours=1),
                status="Em_Doca",
                checkin_at=now - timedelta(hours=1, minutes=45),
                docked_at=now - timedelta(minutes=40)
            )

            # Caminhão Aguardando no Pátio (Check-in feito na portaria, aguardando doca liberar)
            sch2 = Schedule(
                tenant_id=pilot_tenant.id,
                dock_id=doca2.id,
                carrier_name="Braspress Logística",
                cargo_type="Alimentos Congelados",
                driver_name="Márcio Rogério Rocha",
                driver_cpf="81920192837",
                driver_phone="11976543210",
                vehicle_plate="RTO4B22",
                scheduled_window_start=now - timedelta(minutes=30),
                scheduled_window_end=now + timedelta(hours=2),
                status="Aguardando_Patio",
                checkin_at=now - timedelta(minutes=25)
            )

            # Caminhão Agendado (A caminho, janela prevista)
            sch3 = Schedule(
                tenant_id=pilot_tenant.id,
                dock_id=doca3.id,
                carrier_name="Patrus Transportes",
                cargo_type="Insumos Químicos",
                driver_name="José Roberto de Lima",
                driver_cpf="50192837465",
                driver_phone="11965432109",
                vehicle_plate="LOG8F31",
                scheduled_window_start=now + timedelta(minutes=45),
                scheduled_window_end=now + timedelta(hours=3),
                status="Agendado"
            )

            # Caminhão Liberado
            sch4 = Schedule(
                tenant_id=pilot_tenant.id,
                dock_id=doca1.id,
                carrier_name="TNT Mercúrio",
                cargo_type="Carga Geral",
                driver_name="Valter Mendes",
                driver_cpf="19283746501",
                vehicle_plate="SPX1A99",
                scheduled_window_start=now - timedelta(hours=4),
                scheduled_window_end=now - timedelta(hours=2),
                status="Liberado",
                checkin_at=now - timedelta(hours=3, minutes=50),
                docked_at=now - timedelta(hours=3, minutes=10),
                completed_at=now - timedelta(hours=1, minutes=30),
                departed_at=now - timedelta(hours=1, minutes=15)
            )

            db.add_all([sch1, sch2, sch3, sch4])
            db.commit()

            # Cria eventos de histórico
            for sch in [sch1, sch2, sch3, sch4]:
                db.add(YardEvent(
                    tenant_id=pilot_tenant.id,
                    schedule_id=sch.id,
                    from_status=None,
                    to_status=sch.status,
                    recorded_by="Carga Inicial",
                    notes="Provisionado no banco piloto."
                ))
            db.commit()
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    # Cria tabelas no PostgreSQL
    Base.metadata.create_all(bind=engine)
    # Popula dados de demonstração para o piloto se vazio
    seed_initial_demo_data()


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs",
        "realtime_ws": "/ws/yard/{tenant_id}"
    }
