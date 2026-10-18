from fastapi import APIRouter
from app.api.v1.endpoints import auth, tenants, docks, schedules, driver, gate

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(tenants.router)
api_router.include_router(docks.router)
api_router.include_router(schedules.router)
api_router.include_router(driver.router)
api_router.include_router(gate.router)
