import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export const useYardStore = defineStore('yard', () => {
  const authStore = useAuthStore()

  const tenants = ref([])
  const currentTenant = ref(null)
  const docks = ref([])
  const schedules = ref([])
  const isLoading = ref(false)
  const isWsConnected = ref(false)
  const notification = ref(null)
  let ws = null

  // Dados Simulados para Modo Sandbox / Demonstração
  const MOCK_TENANT = {
    id: 'demo-tenant-id',
    name: 'Terminal Santos Logística (Sandbox Demo)',
    slug: 'terminal-santos-demo',
    cnpj: '12.345.678/0001-99',
    plan_tier: 'Enterprise',
    has_whatsapp_automation: true,
    has_carrier_portal: true,
    max_docks: 5,
    grace_period_minutes: 30,
    detention_fee_per_hour: 150.0
  }

  const MOCK_DOCKS = [
    { id: 'dock-01', name: 'Doca #01', dock_type: 'Carga_Geral', status: 'Disponivel' },
    { id: 'dock-02', name: 'Doca #02', dock_type: 'Refrigerado', status: 'Ocupada' },
    { id: 'dock-03', name: 'Doca #03', dock_type: 'Granel', status: 'Disponivel' },
    { id: 'dock-04', name: 'Doca #04', dock_type: 'Crossdocking', status: 'Disponivel' },
    { id: 'dock-05', name: 'Doca #05', dock_type: 'Carga_Geral', status: 'Ocupada' }
  ]

  const now = new Date()
  const MOCK_SCHEDULES = [
    {
      id: 'demo-sched-1',
      vehicle_plate: 'BRA2E19',
      vehicle_type: 'Carreta Baú',
      carrier_name: 'Rodonaves Transportes',
      driver_name: 'Carlos Alberto Silva',
      driver_cpf: '123.456.789-00',
      driver_phone: '(11) 98765-4321',
      operation_type: 'Descarga',
      invoice_number: 'NF-89210',
      status: 'Agendado',
      time_window_start: new Date(now.getTime() - 30 * 60000).toISOString(),
      time_window_end: new Date(now.getTime() + 90 * 60000).toISOString(),
      checkin_gate_at: null,
      dock_in_at: null,
      released_at: null,
      dock_id: null,
      dock_name: null,
      qr_code_data: 'ROTAFLOW-DEMO-BRA2E19',
      overdue_minutes: 0,
      detention_fee: 0
    },
    {
      id: 'demo-sched-2',
      vehicle_plate: 'SPX9A88',
      vehicle_type: 'Truck Sider',
      carrier_name: 'Jamef Encomendas',
      driver_name: 'Marcos Vinicius Souza',
      driver_cpf: '234.567.890-11',
      driver_phone: '(27) 99888-7766',
      operation_type: 'Carga',
      invoice_number: 'NF-10492',
      status: 'Aguardando_Patio',
      time_window_start: new Date(now.getTime() - 90 * 60000).toISOString(),
      time_window_end: new Date(now.getTime() + 30 * 60000).toISOString(),
      checkin_gate_at: new Date(now.getTime() - 45 * 60000).toISOString(),
      dock_in_at: null,
      released_at: null,
      dock_id: null,
      dock_name: null,
      qr_code_data: 'ROTAFLOW-DEMO-SPX9A88',
      overdue_minutes: 0,
      detention_fee: 0
    },
    {
      id: 'demo-sched-3',
      vehicle_plate: 'VIX1J99',
      vehicle_type: 'Carreta Grade Baixa',
      carrier_name: 'Braspress Transportes',
      driver_name: 'Roberto Dias',
      driver_cpf: '345.678.901-22',
      driver_phone: '(31) 97777-6655',
      operation_type: 'Descarga',
      invoice_number: 'NF-77312',
      status: 'Em_Doca',
      time_window_start: new Date(now.getTime() - 150 * 60000).toISOString(),
      time_window_end: new Date(now.getTime() - 30 * 60000).toISOString(),
      checkin_gate_at: new Date(now.getTime() - 130 * 60000).toISOString(),
      dock_in_at: new Date(now.getTime() - 65 * 60000).toISOString(),
      released_at: null,
      dock_id: 'dock-02',
      dock_name: 'Doca #02',
      qr_code_data: 'ROTAFLOW-DEMO-VIX1J99',
      overdue_minutes: 0,
      detention_fee: 0
    },
    {
      id: 'demo-sched-4',
      vehicle_plate: 'RIO4K77',
      vehicle_type: 'Bitrem 9 Eixos',
      carrier_name: 'Patrus Transportes',
      driver_name: 'Eduardo Guimarães',
      driver_cpf: '456.789.012-33',
      driver_phone: '(21) 96666-5544',
      operation_type: 'Carga',
      invoice_number: 'NF-99401',
      status: 'Em_Doca',
      time_window_start: new Date(now.getTime() - 200 * 60000).toISOString(),
      time_window_end: new Date(now.getTime() - 80 * 60000).toISOString(),
      checkin_gate_at: new Date(now.getTime() - 190 * 60000).toISOString(),
      dock_in_at: new Date(now.getTime() - 150 * 60000).toISOString(),
      released_at: null,
      dock_id: 'dock-05',
      dock_name: 'Doca #05',
      qr_code_data: 'ROTAFLOW-DEMO-RIO4K77',
      overdue_minutes: 0,
      detention_fee: 0
    },
    {
      id: 'demo-sched-5',
      vehicle_plate: 'BHZ3M44',
      vehicle_type: 'VUC Urbano',
      carrier_name: 'TNT Mercúrio',
      driver_name: 'Leandro Pereira',
      driver_cpf: '567.890.123-44',
      driver_phone: '(31) 95555-4433',
      operation_type: 'Descarga',
      invoice_number: 'NF-66114',
      status: 'Liberado',
      time_window_start: new Date(now.getTime() - 300 * 60000).toISOString(),
      time_window_end: new Date(now.getTime() - 180 * 60000).toISOString(),
      checkin_gate_at: new Date(now.getTime() - 290 * 60000).toISOString(),
      dock_in_at: new Date(now.getTime() - 220 * 60000).toISOString(),
      released_at: new Date(now.getTime() - 95 * 60000).toISOString(),
      dock_id: 'dock-01',
      dock_name: 'Doca #01',
      qr_code_data: 'ROTAFLOW-DEMO-BHZ3M44',
      overdue_minutes: 0,
      detention_fee: 0
    },
    {
      id: 'demo-sched-6',
      vehicle_plate: 'CWB8T55',
      vehicle_type: 'Carreta Frigorífica',
      carrier_name: 'Transpes S/A',
      driver_name: 'Antônio Ferreira',
      driver_cpf: '678.901.234-55',
      driver_phone: '(41) 94444-3322',
      operation_type: 'Descarga',
      invoice_number: 'NF-44321',
      status: 'Liberado',
      time_window_start: new Date(now.getTime() - 480 * 60000).toISOString(),
      time_window_end: new Date(now.getTime() - 360 * 60000).toISOString(),
      checkin_gate_at: new Date(now.getTime() - 450 * 60000).toISOString(),
      dock_in_at: new Date(now.getTime() - 280 * 60000).toISOString(),
      released_at: new Date(now.getTime() - 60 * 60000).toISOString(),
      dock_id: 'dock-03',
      dock_name: 'Doca #03',
      qr_code_data: 'ROTAFLOW-DEMO-CWB8T55',
      overdue_minutes: 90,
      detention_fee: 147.60
    }
  ]

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
    if (authStore.isDemoMode) {
      tenants.value = [MOCK_TENANT]
      currentTenant.value = MOCK_TENANT
      await Promise.all([fetchDocks(), fetchSchedules()])
      return
    }

    try {
      const res = await fetch('/api/v1/tenants/', {
        headers: authStore.getAuthHeader()
      })
      if (res.ok) {
        const allTenants = await res.json()
        if (authStore.user?.role !== 'super_admin' && authStore.user?.tenant_id) {
          tenants.value = allTenants.filter(t => t.id === authStore.user.tenant_id)
        } else {
          tenants.value = allTenants
        }
        if (tenants.value.length > 0) {
          const userTenant = tenants.value.find(t => t.id === authStore.user?.tenant_id) || tenants.value[0]
          selectTenant(userTenant)
        }
      }
    } catch (err) {
      console.error('Erro ao buscar tenants:', err)
    }
  }

  async function selectTenant(tenant) {
    if (!tenant) return
    // Bloqueio rigoroso: operador não-admin nunca pode acessar outro tenant
    if (authStore.user?.role && authStore.user.role !== 'super_admin' && authStore.user.tenant_id) {
      if (tenant.id !== authStore.user.tenant_id) {
        console.warn('Acesso a tenant bloqueado por isolamento multi-inquilino.')
        return
      }
    }
    currentTenant.value = tenant
    await Promise.all([fetchDocks(), fetchSchedules()])
    if (!authStore.isDemoMode) {
      initWebSocket()
    }
  }

  async function fetchDocks() {
    if (authStore.isDemoMode) {
      docks.value = JSON.parse(JSON.stringify(MOCK_DOCKS))
      return
    }

    if (!currentTenant.value) return
    try {
      const res = await fetch(`/api/v1/docks/?tenant_id=${currentTenant.value.id}`, {
        headers: authStore.getAuthHeader()
      })
      if (res.ok) {
        docks.value = await res.json()
      }
    } catch (err) {
      console.error('Erro ao buscar docas:', err)
    }
  }

  async function fetchSchedules() {
    if (authStore.isDemoMode) {
      schedules.value = JSON.parse(JSON.stringify(MOCK_SCHEDULES))
      return
    }

    if (!currentTenant.value) return
    isLoading.value = true
    try {
      const res = await fetch(`/api/v1/schedules/?tenant_id=${currentTenant.value.id}`, {
        headers: authStore.getAuthHeader()
      })
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
    if (authStore.isDemoMode) {
      const newMock = {
        id: `demo-sched-${Date.now()}`,
        ...payload,
        status: 'Agendado',
        checkin_gate_at: null,
        dock_in_at: null,
        released_at: null,
        qr_code_data: `ROTAFLOW-DEMO-${payload.vehicle_plate}`,
        overdue_minutes: 0,
        detention_fee: 0
      }
      schedules.value.unshift(newMock)
      showNotification(`Agendamento simulado criado para placa ${payload.vehicle_plate}! (Sandbox)`, 'success')
      return newMock
    }

    const res = await fetch('/api/v1/schedules/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...authStore.getAuthHeader()
      },
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
    if (authStore.isDemoMode) {
      const target = schedules.value.find(s => s.id === scheduleId)
      if (target) {
        target.status = newStatus
        if (newStatus === 'Aguardando_Patio' && !target.checkin_gate_at) {
          target.checkin_gate_at = new Date().toISOString()
        }
        if (newStatus === 'Em_Doca') {
          target.dock_in_at = new Date().toISOString()
          target.dock_id = dockId
          const d = docks.value.find(dock => dock.id === dockId)
          if (d) target.dock_name = d.name
        }
        if (newStatus === 'Liberado') {
          target.released_at = new Date().toISOString()
        }
      }
      showNotification(`Status alterado para "${newStatus.replace('_', ' ')}" (Modo Sandbox)`, 'info')
      return target
    }

    try {
      const res = await fetch(`/api/v1/schedules/${scheduleId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...authStore.getAuthHeader()
        },
        body: JSON.stringify({
          status: newStatus,
          dock_id: dockId,
          notes: notes,
          recorded_by: authStore.user?.name || 'Torre de Controle (Kanban)'
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Erro ao atualizar status do veículo.')
      }

      const updated = await res.json()
      const idx = schedules.value.findIndex(s => s.id === scheduleId)
      if (idx !== -1) {
        schedules.value[idx] = updated
      }
      showNotification(`Veículo ${updated.vehicle_plate} atualizado para "${newStatus.replace('_', ' ')}"`, 'info')
      return updated
    } catch (err) {
      showNotification(err.message, 'error')
      throw err
    }
  }

  function initWebSocket() {
    if (authStore.isDemoMode) {
      isWsConnected.value = true
      return
    }

    if (!currentTenant.value) return
    if (ws) {
      ws.close()
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/yard/${currentTenant.value.id}`

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      isWsConnected.value = true
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWsEvent(data)
      } catch (err) {
        console.error('Falha ao processar WebSocket:', err)
      }
    }

    ws.onclose = () => {
      isWsConnected.value = false
      setTimeout(() => {
        if (currentTenant.value && !authStore.isDemoMode) initWebSocket()
      }, 5000)
    }

    ws.onerror = () => {
      isWsConnected.value = false
    }
  }

  function handleWsEvent(eventData) {
    if (eventData.event === 'schedule_status_updated') {
      const updated = eventData.data
      const idx = schedules.value.findIndex(s => s.id === updated.id)
      if (idx !== -1) {
        schedules.value[idx] = updated
      } else {
        schedules.value.unshift(updated)
      }
      showNotification(`Veículo ${updated.vehicle_plate} agora está "${updated.status.replace('_', ' ')}"`, 'info')
    } else if (eventData.event === 'schedule_created') {
      const created = eventData.data
      schedules.value.unshift(created)
      showNotification(`Novo agendamento: ${created.vehicle_plate}`, 'info')
    } else if (eventData.event === 'dock_status_updated') {
      fetchDocks()
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
    showNotification,
    fetchTenants,
    selectTenant,
    fetchDocks,
    fetchSchedules,
    createSchedule,
    updateScheduleStatus,
    initWebSocket
  }
})
