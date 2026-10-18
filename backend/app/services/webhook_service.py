import hmac
import hashlib
import json
import logging
import httpx
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.integration import WebhookSubscription

logger = logging.getLogger("rotaflow.webhooks")


async def dispatch_tenant_webhook(
    db: Session,
    tenant_id: UUID,
    event_type: str,
    payload: dict
):
    """
    Localiza todas as assinaturas ativas de webhook do tenant para o evento disparado
    e envia o payload assinado com HMAC-SHA256.
    """
    try:
        subscriptions = db.query(WebhookSubscription).filter(
            WebhookSubscription.tenant_id == tenant_id,
            WebhookSubscription.is_active == True
        ).all()

        if not subscriptions:
            return

        json_data = json.dumps(payload, default=str)

        async with httpx.AsyncClient(timeout=5.0) as client:
            for sub in subscriptions:
                # Verifica se o evento está na lista de eventos subscritos
                subscribed_events = [e.strip() for e in (sub.events or "").split(",")]
                if event_type not in subscribed_events and "*" not in subscribed_events:
                    continue

                # Gerar assinatura HMAC SHA-256
                signature = hmac.new(
                    sub.secret_token.encode("utf-8"),
                    json_data.encode("utf-8"),
                    hashlib.sha256
                ).hexdigest()

                headers = {
                    "Content-Type": "application/json",
                    "User-Agent": "RotaFlow-YMS-Webhook/2.0",
                    "X-RotaFlow-Event": event_type,
                    "X-RotaFlow-Signature": f"sha256={signature}",
                    "X-RotaFlow-Timestamp": datetime.now(timezone.utc).isoformat()
                }

                try:
                    response = await client.post(sub.target_url, content=json_data, headers=headers)
                    logger.info(f"Webhook enviado para {sub.target_url} - Status: {response.status_code}")
                except Exception as ex:
                    logger.warning(f"Falha ao entregar webhook em {sub.target_url}: {ex}")

    except Exception as e:
        logger.error(f"Erro no processamento de webhooks do tenant {tenant_id}: {e}")
