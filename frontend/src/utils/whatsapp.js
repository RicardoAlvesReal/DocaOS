/**
 * RotaFlow YMS - Utilitário de Notificações WhatsApp para Motoristas
 * Suporta despacho direto via link wa.me e webhook para gateways (Evolution, Z-API, Twilio)
 */

export function formatWhatsAppUrl(phone, text) {
  const cleanPhone = (phone || '').replace(/\D/g, '')
  if (!cleanPhone || cleanPhone.length < 8) {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
  }
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
  return `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(text)}`
}

export function openWhatsApp(phone, text) {
  const url = formatWhatsAppUrl(phone, text)
  window.open(url, '_blank')
}

export function buildDockCallMessage({ driverName, vehiclePlate, dockName, warehouseName }) {
  return `🚨 *CHAMADA PARA DOCA - ${warehouseName || 'CENTRO DE DISTRIBUIÇÃO'}*\n\n` +
         `Olá, *${driverName || 'Motorista'}*!\n` +
         `Seu veículo placa *${vehiclePlate}* foi convocado para carregar/descarregar na *${dockName || 'DOCA DESIGNADA'}*.\n\n` +
         `📍 *Ação necessária:* Dirija-se imediatamente com seu veículo para a doca informada.\n` +
         `⏱️ O início da operação física já foi autorizado pela torre de controle.\n\n` +
         `_RotaFlow YMS • Portaria & Logística_`
}

export function buildCheckinLinkMessage({ driverName, vehiclePlate, warehouseName, checkinUrl }) {
  return `📋 *AGENDAMENTO CONFIRMADO - ${warehouseName || 'CENTRO DE DISTRIBUIÇÃO'}*\n\n` +
         `Olá, *${driverName || 'Motorista'}*!\n` +
         `Seu agendamento para o veículo placa *${vehiclePlate}* está confirmado no sistema.\n\n` +
         `📲 *Acesse seu link de check-in, cerca GPS e QR Code da portaria:*\n` +
         `${checkinUrl}\n\n` +
         `_Apresente o QR Code na cancela ao se aproximar do armazém._`
}

export function buildReleaseMessage({ driverName, vehiclePlate, warehouseName }) {
  return `✅ *OPERAÇÃO FINALIZADA - ${warehouseName || 'CENTRO DE DISTRIBUIÇÃO'}*\n\n` +
         `Olá, *${driverName || 'Motorista'}*!\n` +
         `A operação de carga/descarga do veículo placa *${vehiclePlate}* foi concluída com sucesso.\n\n` +
         `🚪 A cancela de saída está autorizada para desocupação do pátio.\n` +
         `Obrigado pela pontualidade e tenha uma excelente viagem!`
}

/**
 * Dispara envio de WhatsApp (registra no backend se houver conector ativo e abre envio direto)
 */
export async function notifyDriverViaWhatsApp({
  schedule,
  tenant,
  notificationType = 'dock_call',
  dockName = null,
  customText = null
}) {
  const warehouseName = tenant?.name || 'Centro de Distribuição'
  const driverName = schedule.driver_name || 'Motorista'
  const vehiclePlate = schedule.vehicle_plate || 'Veículo'
  const phone = schedule.driver_phone || ''

  let text = customText
  if (!text) {
    if (notificationType === 'dock_call') {
      text = buildDockCallMessage({ driverName, vehiclePlate, dockName, warehouseName })
    } else if (notificationType === 'checkin_link') {
      const checkinUrl = `${window.location.origin}/checkin/${schedule.access_token || schedule.id}`
      text = buildCheckinLinkMessage({ driverName, vehiclePlate, warehouseName, checkinUrl })
    } else if (notificationType === 'release') {
      text = buildReleaseMessage({ driverName, vehiclePlate, warehouseName })
    }
  }

  // Tenta registrar o disparo na API do backend em background
  try {
    fetch('/api/v1/integrations/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenant?.id,
        schedule_id: schedule.id,
        driver_phone: phone,
        driver_name: driverName,
        vehicle_plate: vehiclePlate,
        dock_name: dockName,
        notification_type: notificationType,
        custom_message: text
      })
    }).catch(() => {})
  } catch (err) {
    // Falha silenciosa de telemetria
  }

  // Abre janela do WhatsApp para envio imediato ao motorista
  openWhatsApp(phone, text)
}
