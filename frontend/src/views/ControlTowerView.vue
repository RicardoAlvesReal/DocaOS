<script setup>
import { ref, computed } from 'vue'
import { useYardStore } from '../stores/yard'
import KanbanCard from '../components/KanbanCard.vue'
import YardMap from '../components/YardMap.vue'
import { 
  Calendar, 
  Clock, 
  Warehouse, 
  CheckCircle, 
  AlertCircle, 
  DoorClosed, 
  Filter, 
  Search,
  X,
  Truck,
  Building2,
  Phone,
  CreditCard,
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  LayoutGrid,
  MapPin
} from 'lucide-vue-next'

const yardStore = useYardStore()
const activeView = ref('kanban') // 'kanban' | 'map'
const searchQuery = ref('')
const selectedCargoFilter = ref('')

// Modal de Importação em Lote (CSV)
const isBatchModalOpen = ref(false)
const batchFile = ref(null)
const isUploadingBatch = ref(false)
const batchResult = ref(null)
const batchError = ref('')

function onBatchFileSelected(e) {
  const file = e.target.files[0]
  if (file) {
    batchFile.value = file
    batchError.value = ''
    batchResult.value = null
  }
}

async function uploadBatchSchedules() {
  if (!batchFile.value || !yardStore.currentTenant) return
  isUploadingBatch.value = true
  batchError.value = ''
  batchResult.value = null

  try {
    const formData = new FormData()
    formData.append('tenant_id', yardStore.currentTenant.id)
    formData.append('file', batchFile.value)

    const res = await fetch('/api/v1/schedules/batch/import', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Falha ao processar arquivo.')
    }

    const data = await res.json()
    batchResult.value = data
    await yardStore.fetchSchedules()
    await yardStore.fetchDocks()
    yardStore.showNotification(`${data.created_count} agendamentos importados com sucesso!`, 'success')
  } catch (err) {
    batchError.value = err.message
  } finally {
    isUploadingBatch.value = false
  }
}


// Modal de Alocação de Doca
const isAssignDockModalOpen = ref(false)
const scheduleToAssign = ref(null)
const selectedDockId = ref('')

// Modal de Novo Agendamento
const isNewScheduleModalOpen = ref(false)
const newScheduleForm = ref({
  carrier_name: '',
  cargo_type: 'Carga Geral',
  invoice_number: '',
  driver_name: '',
  driver_cpf: '',
  driver_phone: '',
  vehicle_plate: '',
  trailer_plate: '',
  scheduled_window_start: '',
  scheduled_window_end: '',
  dock_id: '',
  notes: ''
})
const scheduleError = ref('')
const isSubmitting = ref(false)

// Configuração padrão de horário para novo agendamento
function initNewScheduleForm() {
  const start = new Date()
  start.setMinutes(start.getMinutes() + 15)
  const end = new Date(start)
  end.setHours(end.getHours() + 2)

  newScheduleForm.value = {
    carrier_name: '',
    cargo_type: 'Carga Geral',
    invoice_number: '',
    driver_name: '',
    driver_cpf: '',
    driver_phone: '',
    vehicle_plate: '',
    trailer_plate: '',
    scheduled_window_start: start.toISOString().slice(0, 16),
    scheduled_window_end: end.toISOString().slice(0, 16),
    dock_id: '',
    notes: ''
  }
  scheduleError.value = ''
}

defineExpose({
  openNewScheduleModal() {
    initNewScheduleForm()
    isNewScheduleModalOpen.value = true
  }
})

// Filtragem
function filterList(list) {
  return list.filter(item => {
    const matchesSearch = !searchQuery.value || 
      item.vehicle_plate.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.carrier_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.driver_name.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesCargo = !selectedCargoFilter.value || 
      item.cargo_type === selectedCargoFilter.value

    return matchesSearch && matchesCargo
  })
}

const filteredScheduled = computed(() => filterList(yardStore.scheduledList))
const filteredWaiting = computed(() => filterList(yardStore.waitingYardList))
const filteredDocked = computed(() => filterList(yardStore.dockedList))
const filteredReleased = computed(() => filterList(yardStore.releasedList))

// Estatísticas
const overdueCount = computed(() => {
  const now = Date.now()
  const graceMs = (yardStore.currentTenant?.grace_period_minutes || 30) * 60000
  return yardStore.schedules.filter(s => {
    if (s.status === 'Agendado') {
      return now > new Date(s.scheduled_window_end).getTime()
    }
    if (['Aguardando_Patio', 'Em_Doca'].includes(s.status)) {
      const refTime = s.docked_at ? new Date(s.docked_at).getTime() : (s.checkin_at ? new Date(s.checkin_at).getTime() : now)
      return (now - refTime) > graceMs
    }
    return false
  }).length
})

function handleAssignDock(schedule) {
  scheduleToAssign.value = schedule
  selectedDockId.value = schedule.dock_id || ''
  isAssignDockModalOpen.value = true
}

async function confirmAssignDock() {
  if (!scheduleToAssign.value || !selectedDockId.value) return
  try {
    await yardStore.updateScheduleStatus(
      scheduleToAssign.value.id,
      'Em_Doca',
      selectedDockId.value,
      'Direcionado para a doca na Torre de Controle'
    )
    isAssignDockModalOpen.value = false
  } catch (err) {
    // Erro exibido na store via toast
  }
}

async function submitNewSchedule() {
  scheduleError.value = ''
  isSubmitting.value = true
  try {
    const payload = {
      ...newScheduleForm.value,
      dock_id: newScheduleForm.value.dock_id ? newScheduleForm.value.dock_id : null,
      scheduled_window_start: new Date(newScheduleForm.value.scheduled_window_start).toISOString(),
      scheduled_window_end: new Date(newScheduleForm.value.scheduled_window_end).toISOString()
    }
    await yardStore.createSchedule(payload)
    isNewScheduleModalOpen.value = false
  } catch (err) {
    scheduleError.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    
    <!-- KPI Summary Bar -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-[#0e1422] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-slate-400 font-medium">Veículos no Pátio</p>
          <p class="text-2xl font-bold font-mono text-white mt-1">{{ yardStore.totalInYard }}</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
          <Truck class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-[#0e1422] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-slate-400 font-medium">Docas em Operação</p>
          <div class="flex items-baseline space-x-1 mt-1">
            <span class="text-2xl font-bold font-mono text-white">{{ yardStore.occupiedDocksCount }}</span>
            <span class="text-xs text-slate-500 font-mono">/ {{ yardStore.docks.length }}</span>
          </div>
        </div>
        <div class="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
          <DoorClosed class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-[#0e1422] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-slate-400 font-medium">Alertas de Estadia (SLA)</p>
          <p class="text-2xl font-bold font-mono text-rose-400 mt-1">{{ overdueCount }}</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
          <AlertCircle class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-[#0e1422] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p class="text-xs text-slate-400 font-medium">Liberados Hoje</p>
          <p class="text-2xl font-bold font-mono text-emerald-400 mt-1">{{ yardStore.releasedList.length }}</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0e1422] p-3 rounded-xl border border-slate-800">
      <div class="relative w-full sm:w-80">
        <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por placa, transportadora ou motorista..."
          class="w-full bg-[#070a12] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      <div class="flex items-center space-x-2 w-full sm:w-auto">
        <!-- Alternador de Visão: Kanban vs Mapa GPS -->
        <div class="flex items-center bg-[#070a12] border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            @click="activeView = 'kanban'"
            class="flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer"
            :class="activeView === 'kanban' ? 'bg-sky-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <LayoutGrid class="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
          <button
            @click="activeView = 'map'"
            class="flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer"
            :class="activeView === 'map' ? 'bg-sky-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'"
          >
            <MapPin class="w-3.5 h-3.5 text-emerald-400" />
            <span>Mapa GPS</span>
          </button>
        </div>

        <Filter class="w-4 h-4 text-slate-400" />
        <select
          v-model="selectedCargoFilter"
          class="bg-[#070a12] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="">Todas as Cargas</option>
          <option value="Carga Geral">Carga Geral</option>
          <option value="Alimentos Congelados">Alimentos Congelados</option>
          <option value="Eletrônicos e Peças">Eletrônicos e Peças</option>
          <option value="Insumos Químicos">Insumos Químicos</option>
        </select>

        <button
          @click="isBatchModalOpen = true"
          class="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all shrink-0 ml-1"
          title="Importar agendamentos em lote via arquivo CSV"
        >
          <FileSpreadsheet class="w-3.5 h-3.5 text-emerald-400" />
          <span>Importar Planilha</span>
        </button>
      </div>

    </div>

    <!-- Visão Mapa GPS & Cerca Eletrônica -->
    <div v-if="activeView === 'map'" class="space-y-4">
      <YardMap height="650px" />
    </div>

    <!-- Kanban Columns Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- 1. Agendados -->
      <div class="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col min-h-[500px]">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <h3 class="font-bold text-sm text-slate-200">1. Agendados</h3>
          </div>
          <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {{ filteredScheduled.length }}
          </span>
        </div>

        <div class="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
          <KanbanCard 
            v-for="item in filteredScheduled" 
            :key="item.id" 
            :schedule="item"
            @assign-dock="handleAssignDock"
          />
          <div v-if="filteredScheduled.length === 0" class="text-center py-12 text-slate-500 text-xs">
            Nenhum caminhão agendado para o período.
          </div>
        </div>
      </div>

      <!-- 2. Aguardando no Pátio -->
      <div class="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col min-h-[500px]">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-sky-400"></span>
            <h3 class="font-bold text-sm text-slate-200">2. No Pátio (Cancela)</h3>
          </div>
          <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
            {{ filteredWaiting.length }}
          </span>
        </div>

        <div class="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
          <KanbanCard 
            v-for="item in filteredWaiting" 
            :key="item.id" 
            :schedule="item"
            @assign-dock="handleAssignDock"
          />
          <div v-if="filteredWaiting.length === 0" class="text-center py-12 text-slate-500 text-xs">
            Nenhum caminhão aguardando no pátio.
          </div>
        </div>
      </div>

      <!-- 3. Em Doca -->
      <div class="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col min-h-[500px]">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-sky-400"></span>
            <h3 class="font-bold text-sm text-slate-200">3. Em Doca (Operação)</h3>
          </div>
          <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
            {{ filteredDocked.length }}
          </span>
        </div>

        <div class="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
          <KanbanCard 
            v-for="item in filteredDocked" 
            :key="item.id" 
            :schedule="item"
            @assign-dock="handleAssignDock"
          />
          <div v-if="filteredDocked.length === 0" class="text-center py-12 text-slate-500 text-xs">
            Nenhuma doca operando no momento.
          </div>
        </div>
      </div>

      <!-- 4. Liberados -->
      <div class="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col min-h-[500px]">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <h3 class="font-bold text-sm text-slate-200">4. Liberados / Saída</h3>
          </div>
          <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
            {{ filteredReleased.length }}
          </span>
        </div>

        <div class="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
          <KanbanCard 
            v-for="item in filteredReleased" 
            :key="item.id" 
            :schedule="item"
            @assign-dock="handleAssignDock"
          />
          <div v-if="filteredReleased.length === 0" class="text-center py-12 text-slate-500 text-xs">
            Nenhum caminhão finalizado ainda hoje.
          </div>
        </div>
      </div>

    </div>

    <!-- Modal: Alocação de Doca -->
    <transition name="modal">
      <div 
        v-if="isAssignDockModalOpen" 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      >
        <div class="modal-panel bg-[#0e1422] border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <DoorClosed class="w-5 h-5 text-sky-400" />
            <h3 class="font-bold text-base text-white">Alocar Doca de Operação</h3>
          </div>
          <button @click="isAssignDockModalOpen = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div v-if="scheduleToAssign" class="mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
          <p class="text-slate-400">Veículo:</p>
          <p class="font-mono font-bold text-sm text-white">{{ scheduleToAssign.vehicle_plate }} - {{ scheduleToAssign.carrier_name }}</p>
          <p class="text-slate-400 mt-1">Carga: <span class="text-slate-200">{{ scheduleToAssign.cargo_type }}</span></p>
        </div>

        <div class="space-y-2 mb-6">
          <label class="block text-xs font-semibold text-slate-300">Selecione a Doca:</label>
          <select 
            v-model="selectedDockId"
            class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="" disabled>Escolha uma doca física...</option>
            <option 
              v-for="dock in yardStore.docks" 
              :key="dock.id" 
              :value="dock.id"
              :disabled="dock.status === 'Manutenção'"
            >
              {{ dock.code }} - {{ dock.name }} (Status: {{ dock.status }})
            </option>
          </select>
        </div>

        <div class="flex justify-end space-x-3">
          <button 
            @click="isAssignDockModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="confirmAssignDock"
            :disabled="!selectedDockId"
            class="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
          >
            Confirmar e Encostar
          </button>
        </div>
      </div>
    </div>
    </transition>

    <!-- Modal: Novo Agendamento (Time Slot) -->
    <transition name="modal">
      <div 
        v-if="isNewScheduleModalOpen" 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      >
        <div class="modal-panel bg-[#0e1422] border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl my-8">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <Calendar class="w-5 h-5 text-indigo-400" />
            <h3 class="font-bold text-base text-white">Agendar Janela de Horário (Time Slot)</h3>
          </div>
          <button @click="isNewScheduleModalOpen = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="submitNewSchedule" class="space-y-4">
          <div v-if="scheduleError" class="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
            {{ scheduleError }}
          </div>

          <!-- Transportadora e Tipo de Carga -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Transportadora *</label>
              <input
                v-model="newScheduleForm.carrier_name"
                type="text"
                required
                placeholder="Ex: Braspress, Jamef, Autônomo"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Tipo de Carga *</label>
              <select
                v-model="newScheduleForm.cargo_type"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Carga Geral">Carga Geral</option>
                <option value="Alimentos Congelados">Alimentos Congelados</option>
                <option value="Eletrônicos e Peças">Eletrônicos e Peças</option>
                <option value="Insumos Químicos">Insumos Químicos</option>
                <option value="Granel">Granel</option>
              </select>
            </div>
          </div>

          <!-- Placas -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Placa do Cavalo *</label>
              <input
                v-model="newScheduleForm.vehicle_plate"
                type="text"
                required
                placeholder="Ex: BRA2E19"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Placa da Carreta (Opcional)</label>
              <input
                v-model="newScheduleForm.trailer_plate"
                type="text"
                placeholder="Ex: ABC1234"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <!-- Motorista -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Nome do Motorista *</label>
              <input
                v-model="newScheduleForm.driver_name"
                type="text"
                required
                placeholder="Nome completo"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">CPF do Motorista *</label>
              <input
                v-model="newScheduleForm.driver_cpf"
                type="text"
                required
                placeholder="Apenas números"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">WhatsApp / Telefone</label>
              <input
                v-model="newScheduleForm.driver_phone"
                type="text"
                placeholder="(11) 99999-9999"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <!-- Janela de Horário e Doca Pré-alocada -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Início da Janela *</label>
              <input
                v-model="newScheduleForm.scheduled_window_start"
                type="datetime-local"
                required
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Fim da Janela *</label>
              <input
                v-model="newScheduleForm.scheduled_window_end"
                type="datetime-local"
                required
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Doca Designada</label>
              <select
                v-model="newScheduleForm.dock_id"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="">A definir na chegada</option>
                <option v-for="d in yardStore.docks" :key="d.id" :value="d.id">
                  {{ d.code }} - {{ d.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Observações -->
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Observações / NF-e</label>
            <input
              v-model="newScheduleForm.notes"
              type="text"
              placeholder="Ex: NF 10429, descarregar pallets prioritários"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="isNewScheduleModalOpen = false"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
            >
              {{ isSubmitting ? 'Validando Horário...' : 'Gerar Agendamento & Link WhatsApp' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </transition>

    <!-- Modal Importação em Lote (CSV) -->
    <!-- Modal: Importação em Lote (CSV) -->
    <transition name="modal">
      <div
        v-if="isBatchModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <div class="modal-panel bg-[#0e1422] border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          @click="isBatchModalOpen = false"
          class="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>

        <div class="flex items-center space-x-2.5 text-emerald-400 mb-1">
          <FileSpreadsheet class="w-5 h-5" />
          <h3 class="text-base font-black text-white">Importação em Lote de Agendamentos</h3>
        </div>
        <p class="text-xs text-slate-400 mb-4">
          Suba a grade diária de caminhões do seu armazém via arquivo CSV formatado.
        </p>

        <!-- Download do Modelo CSV -->
        <div class="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between mb-4">
          <div>
            <h4 class="text-xs font-bold text-white">Modelo Padrão RotaFlow (.csv)</h4>
            <p class="text-[11px] text-slate-400">Contém colunas oficiais de placa, motorista, transportadora e horários.</p>
          </div>
          <a
            href="/api/v1/schedules/batch/template-csv"
            download
            class="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Baixar Modelo</span>
          </a>
        </div>

        <!-- Área de Upload -->
        <div class="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-2xl p-6 text-center transition-all bg-slate-950/40 mb-4">
          <UploadCloud class="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p class="text-xs font-semibold text-slate-200 mb-1">
            {{ batchFile ? batchFile.name : 'Selecione ou arraste sua planilha CSV aqui' }}
          </p>
          <p class="text-[10px] text-slate-500 mb-3">Formatos aceitos: .csv (delimitador ponto e vírgula ou vírgula)</p>
          <input
            type="file"
            accept=".csv"
            @change="onBatchFileSelected"
            class="hidden"
            id="batch-file-input"
          />
          <label
            for="batch-file-input"
            class="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
          >
            <span>Escolher Arquivo</span>
          </label>
        </div>

        <!-- Erro Geral -->
        <div v-if="batchError" class="bg-rose-950/60 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs mb-4 flex items-center space-x-2">
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-400" />
          <span>{{ batchError }}</span>
        </div>

        <!-- Relatório de Resultado -->
        <div v-if="batchResult" class="space-y-3 mb-4">
          <div class="bg-emerald-950/50 border border-emerald-850 p-3.5 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-400" />
              <span><strong>{{ batchResult.created_count }}</strong> agendamentos criados com sucesso!</span>
            </div>
            <span class="text-[11px] text-slate-400">{{ batchResult.total_lines_read }} linhas processadas</span>
          </div>

          <div v-if="batchResult.failed_count > 0" class="bg-slate-950 border border-rose-900/50 rounded-xl p-3 text-xs">
            <p class="font-bold text-rose-400 mb-2">{{ batchResult.failed_count }} inconsistências encontradas:</p>
            <div class="max-h-32 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
              <div v-for="err in batchResult.errors" :key="err.linha" class="text-slate-300 border-b border-slate-800/60 pb-1">
                <span class="text-rose-400 font-bold">Linha {{ err.linha }} (Placa {{ err.placa }}):</span> {{ err.erro }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            @click="isBatchModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="button"
            @click="uploadBatchSchedules"
            :disabled="!batchFile || isUploadingBatch"
            class="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
          >
            <UploadCloud class="w-4 h-4" />
            <span>{{ isUploadingBatch ? 'Processando Grade...' : 'Processar Importação' }}</span>
          </button>
        </div>
      </div>
    </div>
    </transition>

  </div>
</template>

