<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useYardStore } from '../stores/yard'
import { 
  Clock, 
  DoorOpen, 
  Share2, 
  CheckCircle2, 
  ArrowRightCircle, 
  AlertTriangle,
  User,
  Phone,
  Truck,
  ExternalLink,
  ShieldCheck,
  MapPin
} from 'lucide-vue-next'
import { notifyDriverViaWhatsApp } from '../utils/whatsapp'

const props = defineProps({
  schedule: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['assignDock'])
const yardStore = useYardStore()
const now = ref(Date.now())
let timerInterval = null

onMounted(() => {
  timerInterval = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// Calcula tempo decorrido na fase atual
const phaseTimestamp = computed(() => {
  if (props.schedule.status === 'Agendado') {
    return new Date(props.schedule.scheduled_window_start).getTime()
  } else if (props.schedule.status === 'Aguardando_Patio') {
    return props.schedule.checkin_at ? new Date(props.schedule.checkin_at).getTime() : Date.now()
  } else if (props.schedule.status === 'Em_Doca') {
    return props.schedule.docked_at ? new Date(props.schedule.docked_at).getTime() : Date.now()
  } else {
    return props.schedule.departed_at ? new Date(props.schedule.departed_at).getTime() : Date.now()
  }
})

const elapsedTimeFormatted = computed(() => {
  if (props.schedule.status === 'Agendado') {
    const diff = phaseTimestamp.value - now.value
    if (diff > 0) {
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(minutes / 60)
      const remMin = minutes % 60
      return `Em ${hours > 0 ? hours + 'h ' : ''}${remMin}m`
    } else {
      const lateMin = Math.floor(Math.abs(diff) / 60000)
      return `${lateMin}m de atraso`
    }
  }

  const diffMs = Math.max(0, now.value - phaseTimestamp.value)
  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// Verificação de SLA e cálculo de multa de estadia
const isOverdue = computed(() => {
  if (props.schedule.status === 'Agendado') {
    return now.value > new Date(props.schedule.scheduled_window_end).getTime()
  }
  if (['Aguardando_Patio', 'Em_Doca'].includes(props.schedule.status)) {
    const diffMinutes = (now.value - phaseTimestamp.value) / 60000
    const gracePeriod = yardStore.currentTenant?.grace_period_minutes || 30
    return diffMinutes > gracePeriod
  }
  return false
})

const detentionCost = computed(() => {
  if (!isOverdue.value || props.schedule.status === 'Liberado') return 0
  const diffHours = Math.max(0, (now.value - phaseTimestamp.value) / 3600000)
  const feePerHour = yardStore.currentTenant?.detention_fee_per_hour || 150
  return (diffHours * feePerHour).toFixed(2)
})

function sendWhatsAppNotification() {
  const status = props.schedule.status
  let type = 'checkin_link'
  if (status === 'Aguardando_Patio') type = 'dock_call'
  else if (status === 'Em_Doca') type = 'dock_call'
  else if (status === 'Liberado') type = 'release'

  notifyDriverViaWhatsApp({
    schedule: props.schedule,
    tenant: yardStore.currentTenant,
    notificationType: type,
    dockName: props.schedule.dock_name || 'Doca Operacional'
  })
  yardStore.showNotification(`Disparando WhatsApp para ${props.schedule.driver_name || 'o motorista'}...`, 'success')
}

async function advanceStatus() {
  const current = props.schedule.status
  if (current === 'Agendado') {
    await yardStore.updateScheduleStatus(props.schedule.id, 'Aguardando_Patio')
  } else if (current === 'Aguardando_Patio') {
    emit('assignDock', props.schedule)
  } else if (current === 'Em_Doca') {
    await yardStore.updateScheduleStatus(props.schedule.id, 'Liberado')
  }
}
</script>

<template>
  <div 
    class="bg-white dark:bg-[#04244a] rounded-xl p-3.5 border transition-all duration-150 shadow-sm"
    :class="[
      isOverdue 
        ? 'border-rose-300 dark:border-rose-500/50 bg-rose-50/70 dark:bg-rose-950/20' 
        : 'border-slate-200 dark:border-teal-500/20 hover:border-teal-500/40 dark:hover:border-teal-400/40'
    ]"
  >
    <!-- Card Header: Placa e SLA Badge -->
    <div class="flex items-start justify-between mb-2">
      <div>
        <div class="flex items-center space-x-1.5">
          <span class="font-mono text-sm font-bold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
            {{ schedule.vehicle_plate }}
          </span>
          <span v-if="schedule.trailer_plate" class="text-xs font-mono text-slate-500 dark:text-slate-400">
            + {{ schedule.trailer_plate }}
          </span>
        </div>
        <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-[170px]">
          {{ schedule.carrier_name }}
        </p>
      </div>

      <!-- Live Timer Badge -->
      <div 
        class="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold"
        :class="[
          isOverdue 
            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 animate-pulse' 
            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
        ]"
        :title="isOverdue ? 'Tempo excedido gerando custo de estadia' : 'Dentro da tolerância / SLA'"
      >
        <Clock class="w-3.5 h-3.5" />
        <span>{{ elapsedTimeFormatted }}</span>
      </div>
    </div>

    <!-- Cargo & Driver details -->
    <div class="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 my-3">
      <div class="flex items-center justify-between">
        <span class="text-slate-500 dark:text-slate-400">Carga:</span>
        <span class="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[170px]">{{ schedule.cargo_type }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-500 dark:text-slate-400">Motorista:</span>
        <span class="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[170px]">{{ schedule.driver_name }}</span>
      </div>
      <div v-if="schedule.dock_name" class="flex items-center justify-between">
        <span class="text-slate-500 dark:text-slate-400">Doca:</span>
        <span class="text-teal-700 dark:text-[#00E5C8] font-bold bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800/60">
          {{ schedule.dock_name }}
        </span>
      </div>
      <div v-if="schedule.geofence_validated" class="flex items-center justify-between">
        <span class="text-slate-500 dark:text-slate-400">Presença:</span>
        <span class="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex items-center space-x-1" title="Presença física auditada por GPS">
          <ShieldCheck class="w-3 h-3 text-emerald-500 shrink-0" />
          <span>GPS Auditado ({{ schedule.checkin_distance_meters ? schedule.checkin_distance_meters + 'm' : 'Pátio' }})</span>
        </span>
      </div>
    </div>

    <!-- Overdue Alert with Detention Cost -->
    <div 
      v-if="isOverdue && detentionCost > 0"
      class="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-lg p-2 my-2.5 flex items-center justify-between text-xs"
    >
      <div class="flex items-center space-x-1.5 text-rose-700 dark:text-rose-300">
        <AlertTriangle class="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
        <span class="font-medium text-[11px]">Multa de Estadia:</span>
      </div>
      <span class="font-mono font-bold text-rose-700 dark:text-rose-300">
        R$ {{ detentionCost }}
      </span>
    </div>

    <!-- Actions Footer -->
    <div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80 mt-2">
      <!-- WhatsApp Direct Dispatch Button -->
      <button
        @click="sendWhatsAppNotification"
        :title="schedule.status === 'Aguardando_Patio' ? 'Chamar motorista para a doca via WhatsApp' : 'Enviar notificação ao motorista no WhatsApp'"
        class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-transparent hover:bg-emerald-100 dark:hover:bg-emerald-950/60 p-1.5 rounded-lg transition-colors flex items-center space-x-1 text-xs border border-emerald-200 dark:border-emerald-500/20 shadow-sm cursor-pointer"
      >
        <Share2 class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span class="text-[11px] font-bold">WhatsApp</span>
      </button>

      <!-- Stage Transition Button -->
      <button
        v-if="schedule.status !== 'Liberado'"
        @click="advanceStatus"
        class="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-all active:scale-95 shadow-sm cursor-pointer"
        :class="[
          schedule.status === 'Agendado' 
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-600/20 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-600/30 border border-amber-300 dark:border-amber-600/40'
            : schedule.status === 'Aguardando_Patio'
            ? 'bg-teal-100 text-teal-800 dark:bg-teal-600/20 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-600/30 border border-teal-300 dark:border-teal-600/40'
            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-600/20 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-600/30 border border-emerald-300 dark:border-emerald-600/40'
        ]"
      >
        <span>
          {{ 
            schedule.status === 'Agendado' 
              ? 'Dar Entrada' 
              : schedule.status === 'Aguardando_Patio' 
              ? 'Chamar Doca' 
              : 'Liberar' 
          }}
        </span>
        <ArrowRightCircle class="w-3.5 h-3.5 shrink-0" />
      </button>

      <span v-else class="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
        <CheckCircle2 class="w-3.5 h-3.5" />
        <span>Concluído</span>
      </span>
    </div>

  </div>
</template>
