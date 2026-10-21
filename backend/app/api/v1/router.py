from fastapi import APIRouter
from app.api.v1.endpoints import auth, tenants, docks, schedules, driver, gate, reports, integrations, carrier_portal, badges

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(tenants.router)
api_router.include_router(docks.router)
api_router.include_router(schedules.router)
api_router.include_router(driver.router)
api_router.include_router(gate.router)
api_router.include_router(badges.router)
api_router.include_router(reports.router)
api_router.include_router(integrations.router)
api_router.include_router(carrier_portal.router)


