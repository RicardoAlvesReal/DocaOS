import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useYardStore = defineStore('yard', () => {
  const tenants = ref([])
  const currentTenant = ref(null)
  const docks = ref([])
  const schedules = ref([])
  const isLoading = ref(false)
  const isWsConnected = ref(false)
  const notification = ref(null)
  let ws = null

  // Grupos por Status para o Kanban
  const scheduledList = computed(() => 
    schedules.value.filter(s => s.status === 'Agendado')
  )
  const waitingYardList = computed(() => 
    schedules.value.filter(s => s.status === 'Aguardando_Patio')
  )
  const dockedList = computed(() => 
    schedules.value.filter(s => s.status === 'Em_Doca')
  )
  const releasedList = computed(() => 
    schedules.value.filter(s => s.status === 'Liberado')
  )

  // Totais para cards de métricas
  const totalInYard = computed(() => 
    schedules.value.filter(s => ['Aguardando_Patio', 'Em_Doca'].includes(s.status)).length
  )
  const occupiedDocksCount = computed(() => 
    docks.value.filter(d => d.status === 'Ocupada').length
  )

  function showNotification(message, type = 'info') {
    notification.value = { message, type, id: Date.now() }
    setTimeout(() => {
      notification.value = null
    }, 4500)
  }

  async function fetchTenants() {
    try {
      const res = await fetch('/api/v1/tenants/')
      if (res.ok) {
        tenants.value = await res.json()
        if (tenants.value.length > 0 && !currentTenant.value) {
          selectTenant(tenants.value[0])
        }
      }
    } catch (err) {
      console.error('Erro ao buscar tenants:', err)
    }
  }

  async function selectTenant(tenant) {
    currentTenant.value = tenant
    await Promise.all([fetchDocks(), fetchSchedules()])
    initWebSocket()
  }

  async function fetchDocks() {
    if (!currentTenant.value) return
    try {
      const res = await fetch(`/api/v1/docks/?tenant_id=${currentTenant.value.id}`)
      if (res.ok) {
        docks.value = await res.json()
      }
    } catch (err) {
      console.error('Erro ao buscar docas:', err)
    }
  }

  async function fetchSchedules() {
    if (!currentTenant.value) return
    isLoading.value = true
    try {
      const res = await fetch(`/api/v1/schedules/?tenant_id=${currentTenant.value.id}`)
      if (res.ok) {
        schedules.value = await res.json()
      }
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function createSchedule(payload) {
    const res = await fetch('/api/v1/schedules/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        tenant_id: currentTenant.value.id
      })
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.detail || 'Falha ao agendar time slot.')
    }

    const created = await res.json()
    schedules.value.unshift(created)
    showNotification(`Agendamento criado para placa ${created.vehicle_plate}!`, 'success')
    return created
  }

  async function updateScheduleStatus(scheduleId, newStatus, dockId = null, notes = '') {
    try {
      const res = await fetch(`/api/v1/schedules/${scheduleId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          dock_id: dockId,
          notes: notes,
          recorded_by: 'Torre de Controle (Kanban)'
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Falha ao atualizar status.')
      }

      const updated = await res.json()
      const index = schedules.value.findIndex(s => s.id === scheduleId)
      if (index !== -1) {
        schedules.value[index] = updated
      }
      await fetchDocks() // Atualiza status das docas (Livre/Ocupada)
      showNotification(`Veículo ${updated.vehicle_plate} movido para ${newStatus.replace('_', ' ')}`, 'success')
      return updated
    } catch (err) {
      showNotification(err.message, 'error')
      throw err
    }
  }

  function initWebSocket() {
    if (!currentTenant.value) return
    if (ws) {
      ws.close()
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/ws/yard/${currentTenant.value.id}`

    try {
      ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        isWsConnected.value = true
        console.log('WebSocket Torre de Controle Conectado:', wsUrl)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'STATUS_CHANGED') {
            showNotification(`[Tempo Real] Placa ${data.vehicle_plate}: ${data.new_status.replace('_', ' ')}`, 'info')
            fetchSchedules()
            fetchDocks()
          }
        } catch (e) {
          console.error('Erro ao processar mensagem WS:', e)
        }
      }

      ws.onclose = () => {
        isWsConnected.value = false
        // Reconectar após 4 segundos se o tenant ainda estiver selecionado
        setTimeout(() => {
          if (currentTenant.value) initWebSocket()
        }, 4000)
      }

      ws.onerror = (err) => {
        console.error('Erro no WebSocket:', err)
        isWsConnected.value = false
      }
    } catch (e) {
      console.error('Não foi possível iniciar WebSocket:', e)
    }
  }

  return {
    tenants,
    currentTenant,
    docks,
    schedules,
    isLoading,
    isWsConnected,
    notification,
    scheduledList,
    waitingYardList,
    dockedList,
    releasedList,
    totalInYard,
    occupiedDocksCount,
    fetchTenants,
    selectTenant,
    fetchDocks,
    fetchSchedules,
    createSchedule,
    updateScheduleStatus,
    showNotification
  }
})
