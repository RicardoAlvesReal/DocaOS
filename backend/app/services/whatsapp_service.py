import logging
import httpx
from typing import Optional
from app.models.tenant import Tenant
from app.models.schedule import Schedule
from app.core.config import settings

logger = logging.getLogger(__name__)


async def dispatch_whatsapp_notification(
    tenant: Tenant,
    schedule: Schedule,
    event_type: str,
    extra_notes: Optional[str] = None
) -> dict:
    """
    Envia notificação automatizada de WhatsApp para o motorista caso o armazém
    possua a licença 'has_whatsapp_automation' ativada pelo Super Admin.
    """
    if not tenant or not tenant.has_whatsapp_automation:
        return {"status": "skipped", "reason": "WhatsApp automation not enabled for this tenant"}

    raw_phone = (schedule.driver_phone or "").strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not raw_phone or len(raw_phone) < 10:
        return {"status": "skipped", "reason": "Invalid or missing driver phone"}

    if not raw_phone.startswith("55"):
        raw_phone = f"55{raw_phone}"

    driver_url = f"{settings.DRIVER_PORTAL_URL}/{schedule.access_token}"
    dock_name = schedule.dock.name if schedule.dock else "Doca Principal"

    # Modelos de Mensagens Padronizadas
    messages = {
        "Agendado": (
            f"🚚 *DOCAOS &bull; {tenant.name}*\n\n"
            f"Olá *{schedule.driver_name}*, sua janela de descarregamento/carga está confirmada!\n\n"
            f"📦 *Veículo:* {schedule.vehicle_plate}\n"
            f"🏢 *Doca Prevista:* {dock_name}\n"
            f"⏱️ *Janela:* {schedule.scheduled_window_start.strftime('%d/%m às %H:%M')}\n\n"
            f"📲 Acesse seu comprovante e *QR Code de entrada* na cancela pelo link:\n{driver_url}"
        ),
        "Aguardando_Patio": (
            f"✅ *DOCAOS &bull; ENTRADA CONFIRMADA*\n\n"
            f"Motorista *{schedule.driver_name}*, sua entrada no pátio do terminal *{tenant.name}* foi validada na portaria.\n\n"
            f"🅿️ *Posição:* Aguardando no pátio interno.\n"
            f"⚠️ Fique atento ao celular! Enviaremos uma mensagem aqui assim que sua doca for liberada."
        ),
        "Em_Doca": (
            f"🚨 *CHAMADA PARA A DOCA &bull; {tenant.name}*\n\n"
            f"Atenção *{schedule.driver_name}* (Veículo *{schedule.vehicle_plate}*):\n\n"
            f"📍 *Favor encostar IMEDIATAMENTE na {dock_name}!* Os operadores já estão aguardando para iniciar a movimentação da carga."
        ),
        "Liberado": (
            f"🏁 *DOCAOS &bull; OPERAÇÃO CONCLUÍDA*\n\n"
            f"*{schedule.driver_name}*, a operação física do veículo *{schedule.vehicle_plate}* foi finalizada com sucesso no terminal *{tenant.name}*.\n\n"
            f"🟢 Cancela de saída autorizada na portaria. Tenha uma excelente viagem!"
        )
    }

    message_body = messages.get(event_type, (
        f"📢 *DOCAOS &bull; {tenant.name}*\n\n"
        f"Atualização do veículo *{schedule.vehicle_plate}*: status alterado para *{event_type}*."
    ))

    if extra_notes:
        message_body += f"\n\n📝 *Observação:* {extra_notes}"

    logger.info(f"[WHATSAPP BOT] Enviando para {raw_phone} (Evento: {event_type}) - Tenant: {tenant.name}")

    # Se houver webhook/gateway configurado no armazém (ex: Z-API / Evolution API / Twilio)
    if tenant.whatsapp_api_url and tenant.whatsapp_api_token:
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                headers = {
                    "Content-Type": "application/json",
                    "Client-Token": tenant.whatsapp_api_token,
                    "apikey": tenant.whatsapp_api_token
                }
                payload = {
                    "number": raw_phone,
                    "phone": raw_phone,
                    "message": message_body,
                    "text": message_body
                }
                resp = await client.post(tenant.whatsapp_api_url, json=payload, headers=headers)
                return {
                    "status": "sent",
                    "provider_status": resp.status_code,
                    "phone": raw_phone,
                    "event": event_type
                }
        except Exception as e:
            logger.error(f"[WHATSAPP BOT ERROR] Falha ao enviar requisição HTTP: {e}")
            return {"status": "error", "error": str(e), "phone": raw_phone}

    # Modo Simulado / Standalone Integrado
    return {
        "status": "simulated_sent",
        "phone": raw_phone,
        "message_preview": message_body[:100] + "...",
        "event": event_type,
        "tenant_id": str(tenant.id)
    }
