from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.schedule import Schedule
from app.schemas.driver import DriverCheckinView, DriverConfirmation
from app.services.schedule_service import generate_qr_code_base64

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

    return DriverCheckinView(
        access_token=schedule.access_token,
        tenant_name=schedule.tenant.name if schedule.tenant else "Operador Logístico",
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
        qr_code_data=qr_code_image
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

    if cleaned_plate:
        schedule.vehicle_plate = cleaned_plate
    if confirmation.driver_phone:
        schedule.driver_phone = confirmation.driver_phone

    db.commit()

    qr_payload = f"ROTAFLOW:{schedule.access_token}:{schedule.vehicle_plate}"
    qr_code_image = generate_qr_code_base64(qr_payload)

    return {
        "success": True,
        "message": "Dados validados com sucesso! Apresente o QR Code na guarita.",
        "qr_code_data": qr_code_image
    }
