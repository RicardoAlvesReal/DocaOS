from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schedule import Schedule
from app.schemas.driver import DriverCheckinView, DriverConfirmation
from app.services.schedule_service import generate_qr_code_base64
from app.services.geo_service import validate_driver_geofence, format_distance

router = APIRouter(prefix="/driver", tags=["Motorista (Fricção Zero)"])


def mask_cpf(cpf: str) -> str:
    cleaned = cpf.replace(".", "").replace("-", "")
    if len(cleaned) == 11:
        return f"{cleaned[:3]}.***.***-{cleaned[-2:]}"
    return "***"


@router.get("/{access_token}", response_model=DriverCheckinView)
def get_driver_appointment(access_token: str, db: Session = Depends(get_db)):
    """
    Retorna os dados do agendamento para o celular do motorista via link WhatsApp.
    Não requer senha nem instalação de aplicativo.
    """
    schedule = db.query(Schedule).filter(Schedule.access_token == access_token).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agendamento não localizado ou link expirado."
        )

    # Gera QR code com o access_token e placa para leitura imediata na guarita
    qr_payload = f"ROTAFLOW:{schedule.access_token}:{schedule.vehicle_plate}"
    qr_code_image = generate_qr_code_base64(qr_payload)

    tenant = schedule.tenant
    warehouse_lat = tenant.latitude if tenant and tenant.latitude else -20.3155
    warehouse_lon = tenant.longitude if tenant and tenant.longitude else -40.3128
    radius = tenant.geofence_radius_meters if tenant and tenant.geofence_radius_meters else 1000
    require_geofence = tenant.require_geofence if tenant and tenant.require_geofence else False

    return DriverCheckinView(
        access_token=schedule.access_token,
        tenant_name=tenant.name if tenant else "Operador Logístico",
        carrier_name=schedule.carrier_name,
        cargo_type=schedule.cargo_type,
        driver_name=schedule.driver_name,
        driver_cpf_masked=mask_cpf(schedule.driver_cpf),
        vehicle_plate=schedule.vehicle_plate,
        trailer_plate=schedule.trailer_plate,
        scheduled_window_start=schedule.scheduled_window_start,
        scheduled_window_end=schedule.scheduled_window_end,
        dock_name=schedule.dock.name if schedule.dock else "A definir na portaria",
        status=schedule.status,
        qr_code_data=qr_code_image,
        warehouse_lat=warehouse_lat,
        warehouse_lon=warehouse_lon,
        geofence_radius_meters=radius,
        require_geofence=require_geofence,
        geofence_validated=schedule.geofence_validated,
        checkin_distance_meters=schedule.checkin_distance_meters
    )


@router.post("/{access_token}/confirm")
def confirm_driver_data(access_token: str, confirmation: DriverConfirmation, db: Session = Depends(get_db)):
    """Permite ao motorista validar a placa e o telefone antes de exibir o QR Code oficial"""
    schedule = db.query(Schedule).filter(Schedule.access_token == access_token).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado.")

    cleaned_plate = confirmation.vehicle_plate.replace("-", "").replace(" ", "").upper()
    cleaned_input_cpf = confirmation.driver_cpf.replace(".", "").replace("-", "")
    stored_cpf = schedule.driver_cpf.replace(".", "").replace("-", "")

    # Validação de segurança básica: CPF digitado deve coincidir com o CPF cadastrado no agendamento
    if cleaned_input_cpf != stored_cpf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O CPF informado não confere com o motorista deste agendamento."
        )

    # Validação e auditoria de Cerca Eletrônica (Geofencing)
    tenant = schedule.tenant
    warehouse_lat = tenant.latitude if tenant and tenant.latitude else -20.3155
    warehouse_lon = tenant.longitude if tenant and tenant.longitude else -40.3128
    radius = tenant.geofence_radius_meters if tenant and tenant.geofence_radius_meters else 1000
    require_geofence = tenant.require_geofence if tenant and tenant.require_geofence else False

    is_inside, distance_meters, geo_status = validate_driver_geofence(
        driver_lat=confirmation.latitude,
        driver_lon=confirmation.longitude,
        warehouse_lat=warehouse_lat,
        warehouse_lon=warehouse_lon,
        radius_meters=radius
    )

    if require_geofence and not is_inside:
        if distance_meters is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Check-in não autorizado: Você está a {format_distance(distance_meters)} do pátio. É necessário estar dentro do raio de {format_distance(radius)} para confirmar a chegada."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Check-in requer permissão de localização GPS ativa no navegador do celular para comprovar presença física no terminal."
            )

    if cleaned_plate:
        schedule.vehicle_plate = cleaned_plate
    if confirmation.driver_phone:
        schedule.driver_phone = confirmation.driver_phone

    if confirmation.latitude is not None and confirmation.longitude is not None:
        schedule.checkin_latitude = confirmation.latitude
        schedule.checkin_longitude = confirmation.longitude
        schedule.checkin_accuracy_meters = confirmation.accuracy_meters
        schedule.checkin_distance_meters = distance_meters
        schedule.geofence_validated = is_inside

    db.commit()

    qr_payload = f"ROTAFLOW:{schedule.access_token}:{schedule.vehicle_plate}"
    qr_code_image = generate_qr_code_base64(qr_payload)

    return {
        "success": True,
        "message": "Dados validados com sucesso! Apresente o QR Code na guarita.",
        "qr_code_data": qr_code_image,
        "geofence_validated": is_inside,
        "distance_meters": distance_meters,
        "distance_formatted": format_distance(distance_meters) if distance_meters is not None else None,
        "geo_status": geo_status
    }
