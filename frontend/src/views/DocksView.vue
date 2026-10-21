<script setup>
import { ref, computed } from 'vue'
import { useYardStore } from '../stores/yard'
import { notifyDriverViaWhatsApp } from '../utils/whatsapp'
import { 
  DoorClosed, 
  PlusCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Truck,
  X,
  Calendar,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-vue-next'

const yardStore = useYardStore()
const viewMode = ref('grid') // 'grid' | 'agenda'

const isNewDockModalOpen = ref(false)
const newDockForm = ref({
  code: '',
  name: '',
  dock_type: 'Geral',
  status: 'Livre'
})
const dockError = ref('')
const isSubmitting = ref(false)

// Controle da Data da Agenda
const selectedDate = ref(new Date().toISOString().split('T')[0])

const timeSlots = [
  { label: '06:00', startH: 6, endH: 8 },
  { label: '08:00', startH: 8, endH: 10 },
  { label: '10:00', startH: 10, endH: 12 },
  { label: '12:00', startH: 12, endH: 14 },
  { label: '14:00', startH: 14, endH: 16 },
  { label: '16:00', startH: 16, endH: 18 },
  { label: '18:00', startH: 18, endH: 20 },
  { label: '20:00', startH: 20, endH: 22 }
]

const maxDocks = computed(() => yardStore.currentTenant?.max_docks || 10)
const isLimitReached = computed(() => yardStore.docks.length >= maxDocks.value)

function changeDate(days) {
  const current = new Date(selectedDate.value + 'T12:00:00')
  current.setDate(current.getDate() + days)
  selectedDate.value = current.toISOString().split('T')[0]
}

function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function openModal() {
  newDockForm.value = {
    code: `DOCA-${(yardStore.docks.length + 1).toString().padStart(2, '0')}`,
    name: `Doca ${(yardStore.docks.length + 1).toString().padStart(2, '0')} - Carga Geral`,
    dock_type: 'Geral',
    status: 'Livre'
  }
  dockError.value = ''
  isNewDockModalOpen.value = true
}

async function createDock() {
  dockError.value = ''
  isSubmitting.value = true
  try {
    const res = await fetch('/api/v1/docks/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newDockForm.value,
        tenant_id: yardStore.currentTenant?.id
      })
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Falha ao cadastrar doca.')
    }

    await yardStore.fetchDocks()
    isNewDockModalOpen.value = false
    yardStore.showNotification(`Doca ${newDockForm.value.code} cadastrada!`, 'success')
  } catch (err) {
    dockError.value = err.message
  } finally {
    isSubmitting.value = false
  }
}

async function toggleDockMaintenance(dock) {
  const newStatus = dock.status === 'Manutenção' ? 'Livre' : 'Manutenção'
  try {
    const res = await fetch(`/api/v1/docks/${dock.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })

    if (res.ok) {
      await yardStore.fetchDocks()
      yardStore.showNotification(`Doca ${dock.code} alterada para ${newStatus}`, 'info')
    }
  } catch (err) {
    console.error(err)
  }
}

function getOccupyingSchedule(dockId) {
  return (yardStore.schedules || []).find(s => s.dock_id === dockId && s.status === 'Em_Doca')
}

// Retorna agendamentos de uma doca para um horário específico na visualização de Agenda
function getSchedulesForSlot(dockId, slot) {
  return (yardStore.schedules || []).filter(s => {
    if (s.dock_id !== dockId) return false
    const timeStr = s.scheduled_window_start || s.time_window_start
    if (!timeStr) return false
    
    const schedDate = new Date(timeStr)
    const hour = schedDate.getHours()
    return hour >= slot.startH && hour < slot.endH
  })
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Em_Doca': return 'bg-sky-950/90 text-sky-300 border-sky-800'
    case 'Aguardando_Patio': return 'bg-amber-950/90 text-amber-300 border-amber-800'
    case 'Liberado': return 'bg-emerald-950/90 text-emerald-300 border-emerald-800'
    default: return 'bg-slate-800 text-slate-300 border-slate-700'
  }
}

async function callNextTruckToDock(dock) {
  const waitingTruck = yardStore.waitingYardList[0]
  if (!waitingTruck) {
    yardStore.showNotification('Nenhum caminhão aguardando no pátio no momento.', 'warning')
    return
  }

  try {
    await yardStore.updateScheduleStatus(
      waitingTruck.id,
      'Em_Doca',
      dock.id,
      `Chamado para ${dock.code} na Gestão de Docas`
    )

    notifyDriverViaWhatsApp({
      schedule: waitingTruck,
      tenant: yardStore.currentTenant,
      notificationType: 'dock_call',
      dockName: `${dock.code} (${dock.name})`
    })

    yardStore.showNotification(`Veículo ${waitingTruck.vehicle_plate} chamado para a ${dock.code} via WhatsApp!`, 'success')
  } catch (err) {
    yardStore.showNotification('Falha ao alocar doca.', 'error')
  }
}
</script>

<template>
  <div class="space-y-6">
    
    <!-- Header with Capacity Banner & View Mode Switcher -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0e1422] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl">
      <div>
        <div class="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-sky-950/80 border border-sky-800 text-xs font-mono font-semibold text-sky-400 mb-1">
          <DoorClosed class="w-3.5 h-3.5" />
          <span>Gestão Operacional de Docas</span>
        </div>
        <h1 class="text-xl font-bold text-white">Mapeamento & Agenda de Docas</h1>
        <p class="text-xs text-slate-400 mt-0.5">Visão em Tempo Real (Grid) e Calendário de Slots Horários (Gantt)</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Alternador de Visão: Grid vs Agenda -->
        <div class="bg-slate-50 dark:bg-[#00142c] border border-slate-200 dark:border-slate-800 p-1 rounded-xl flex items-center space-x-1">
          <button
            @click="viewMode = 'grid'"
            class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            :class="viewMode === 'grid' ? 'bg-[#00A896] text-white font-bold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
          >
            <LayoutGrid class="w-3.5 h-3.5" />
            <span>Tempo Real (Grid)</span>
          </button>
          
          <button
            @click="viewMode = 'agenda'"
            class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            :class="viewMode === 'agenda' ? 'bg-[#00A896] text-white font-bold shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
          >
            <Calendar class="w-3.5 h-3.5" />
            <span>Agenda & Slots (Gantt)</span>
          </button>
        </div>

        <!-- License quota pill -->
        <div class="bg-slate-100 dark:bg-[#00142c] border border-slate-200 dark:border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
          <span class="text-slate-400">Docas: </span>
          <span class="font-bold text-[#00A896] dark:text-[#00E5C8]">{{ yardStore.docks.length }}</span>
          <span class="text-slate-500"> / {{ maxDocks }}</span>
        </div>

        <button
          @click="openModal"
          :disabled="isLimitReached"
          class="flex items-center space-x-1.5 bg-gradient-to-r from-[#00A896] to-teal-500 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-teal-500/20"
        >
          <PlusCircle class="w-4 h-4" />
          <span>+ Cadastrar Doca</span>
        </button>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- MODO 1: VISÃO EM TEMPO REAL (GRID DE CARDS FÍSICOS)                 -->
    <!-- =================================================================== -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      <div
        v-for="dock in yardStore.docks"
        :key="dock.id"
        class="bg-[#0e1422] border rounded-2xl p-5 transition-all relative overflow-hidden flex flex-col justify-between"
        :class="[
          dock.status === 'Ocupada'
            ? 'border-sky-500/40 bg-[#0c1322] shadow-lg shadow-sky-950/20'
            : dock.status === 'Manutenção'
            ? 'border-amber-600/40 bg-[#16120b]'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-700'
        ]"
      >
        <div>
          <div class="flex items-start justify-between mb-3">
            <div>
              <span class="font-mono text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                {{ dock.code }}
              </span>
              <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 truncate">{{ dock.name }}</h3>
            </div>

            <span 
              class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border font-mono"
              :class="[
                dock.status === 'Livre' 
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' 
                  : dock.status === 'Ocupada' 
                  ? 'bg-sky-950/60 text-sky-400 border-sky-800 animate-pulse' 
                  : 'bg-amber-950/60 text-amber-400 border-amber-800'
              ]"
            >
              {{ dock.status }}
            </span>
          </div>

          <!-- Caminhão Ocupando a Doca (se houver) -->
          <div v-if="getOccupyingSchedule(dock.id)" class="bg-slate-950/90 border border-sky-500/30 rounded-xl p-3 mb-3 text-xs space-y-1">
            <div class="flex items-center justify-between text-slate-400 text-[11px]">
              <span class="flex items-center space-x-1 text-sky-400 font-bold">
                <Truck class="w-3.5 h-3.5" />
                <span>Em Operação</span>
              </span>
              <span class="font-mono font-bold text-white">{{ getOccupyingSchedule(dock.id).vehicle_plate }}</span>
            </div>
            <p class="text-slate-300 truncate text-[11px] font-medium">{{ getOccupyingSchedule(dock.id).carrier_name }}</p>
            <p class="text-[10px] text-slate-500 truncate">Motorista: {{ getOccupyingSchedule(dock.id).driver_name }} ({{ getOccupyingSchedule(dock.id).driver_phone || 'Sem tel.' }})</p>
          </div>

          <div class="text-xs text-slate-400 space-y-1 mb-4">
            <div class="flex justify-between">
              <span class="text-slate-500">Tipo de Doca:</span>
              <span class="text-slate-300 font-medium">{{ dock.dock_type }}</span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
          <!-- Botão Chamar Próximo da Fila no WhatsApp (se Livre) -->
          <button
            v-if="dock.status === 'Livre' && yardStore.waitingYardList.length > 0"
            @click="callNextTruckToDock(dock)"
            class="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1"
            title="Chama o primeiro caminhão da fila e envia notificação no WhatsApp"
          >
            <span>Chamar Próximo (WhatsApp)</span>
          </button>

          <button
            @click="toggleDockMaintenance(dock)"
            class="text-slate-400 hover:text-amber-400 flex items-center space-x-1 text-[11px] cursor-pointer ml-auto"
          >
            <Wrench class="w-3.5 h-3.5" />
            <span>{{ dock.status === 'Manutenção' ? 'Liberar Doca' : 'Manutenção' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- MODO 2: VISÃO DE AGENDA & SLOTS HORÁRIOS (GANTT DE DOCAS)          -->
    <!-- =================================================================== -->
    <div v-else class="space-y-4">
      
      <!-- Date Navigator & Info -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100 dark:bg-[#001833] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
        <div class="flex items-center space-x-3">
          <button
            @click="changeDate(-1)"
            class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-200 dark:border-slate-800 cursor-pointer"
            title="Dia Anterior"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <div class="text-center sm:text-left">
            <span class="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Visualizando Agenda para:</span>
            <span class="text-sm font-bold text-white capitalize">{{ formatDateDisplay(selectedDate) }}</span>
          </div>

          <button
            @click="changeDate(1)"
            class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-200 dark:border-slate-800 cursor-pointer"
            title="Próximo Dia"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <button
          @click="selectedDate = new Date().toISOString().split('T')[0]"
          class="text-xs font-mono text-sky-400 hover:text-sky-300 underline cursor-pointer"
        >
          Voltar para Hoje
        </button>
      </div>

      <!-- Gantt Matrix Table -->
      <div class="bg-white dark:bg-[#031d3d] border border-slate-200 dark:border-teal-500/20 rounded-2xl shadow-sm text-slate-800 dark:text-slate-100 shadow-xl overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[900px]">
          <!-- Time Header -->
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-950/80 text-[11px] font-mono text-slate-400">
              <th class="py-3 px-4 w-48 font-bold text-white border-r border-slate-200 dark:border-slate-800/80">Doca Física</th>
              <th 
                v-for="slot in timeSlots" 
                :key="slot.label"
                class="py-3 px-2 text-center border-r border-slate-200 dark:border-slate-800/50 min-w-[110px]"
              >
                <div class="font-bold text-slate-200">{{ slot.label }}</div>
                <span class="text-[9px] text-slate-500">Janela 2h</span>
              </th>
            </tr>
          </thead>

          <!-- Docks Rows -->
          <tbody class="divide-y divide-slate-800/60 text-xs">
            <tr 
              v-for="dock in yardStore.docks" 
              :key="dock.id"
              class="hover:bg-slate-900/40 transition-colors"
            >
              <!-- Dock Name Column -->
              <td class="py-3 px-4 border-r border-slate-200 dark:border-slate-800/80 bg-slate-950/40">
                <div class="flex items-center space-x-2">
                  <span class="font-mono text-xs font-bold text-sky-400 bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                    {{ dock.code }}
                  </span>
                  <div>
                    <p class="font-bold text-white text-[11px] truncate max-w-[120px]" :title="dock.name">{{ dock.name }}</p>
                    <span class="text-[9px] text-slate-500">{{ dock.dock_type }}</span>
                  </div>
                </div>
              </td>

              <!-- Slots Columns -->
              <td 
                v-for="slot in timeSlots" 
                :key="slot.label"
                class="p-1.5 border-r border-slate-200 dark:border-slate-800/50 align-top"
              >
                <!-- Agendamento Alocado -->
                <div 
                  v-if="getSchedulesForSlot(dock.id, slot).length > 0"
                  class="space-y-1"
                >
                  <div
                    v-for="sch in getSchedulesForSlot(dock.id, slot)"
                    :key="sch.id"
                    class="p-2 rounded-xl border text-[10px] space-y-1 shadow-md transition-all hover:scale-[1.02]"
                    :class="getStatusBadgeClass(sch.status)"
                  >
                    <div class="flex items-center justify-between font-mono font-bold">
                      <span>{{ sch.vehicle_plate }}</span>
                      <span class="text-[8px] uppercase tracking-wide px-1 py-0.2 rounded bg-black/40">{{ sch.status }}</span>
                    </div>
                    <p class="truncate text-slate-200 font-medium" :title="sch.carrier_name">{{ sch.carrier_name }}</p>
                    <p class="text-slate-400 truncate text-[9px]">Motorista: {{ sch.driver_name }}</p>
                  </div>
                </div>

                <!-- Slot Livre -->
                <div 
                  v-else 
                  class="h-16 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/60 hover:border-sky-500/40 hover:bg-sky-500/5 flex items-center justify-center text-[10px] font-mono text-slate-600 hover:text-sky-400 transition-colors p-1 text-center"
                >
                  <span>Livre</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- Modal: Nova Doca Física -->
    <transition name="modal">
      <div 
        v-if="isNewDockModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      >
        <div class="modal-panel bg-[#0e1422] border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 class="font-bold text-base text-white">Cadastrar Nova Doca Física</h3>
            <button @click="isNewDockModalOpen = false" class="text-slate-400 hover:text-white cursor-pointer">
              <X class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="createDock" class="space-y-4">
            <div v-if="dockError" class="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
              {{ dockError }}
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Código da Doca *</label>
              <input
                v-model="newDockForm.code"
                type="text"
                required
                placeholder="Ex: DOCA-05"
                class="w-full bg-slate-50 dark:bg-[#00142c] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Nome de Identificação *</label>
              <input
                v-model="newDockForm.name"
                type="text"
                required
                placeholder="Ex: Doca 05 - Carga Seca"
                class="w-full bg-slate-50 dark:bg-[#00142c] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Tipo de Doca</label>
              <select
                v-model="newDockForm.dock_type"
                class="w-full bg-slate-50 dark:bg-[#00142c] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="Geral">Carga Geral</option>
                <option value="Seca">Carga Seca</option>
                <option value="Frigorífica">Frigorífica (Reefer)</option>
                <option value="Granel">Granel</option>
              </select>
            </div>

            <div class="flex justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                @click="isNewDockModalOpen = false"
                class="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                {{ isSubmitting ? 'Salvando...' : 'Salvar Doca' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

  </div>
</template>
