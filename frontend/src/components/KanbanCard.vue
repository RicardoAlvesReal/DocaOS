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
  ExternalLink
} from 'lucide-vue-next'

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

function copyWhatsAppLink() {
  const url = `${window.location.origin}/checkin/${props.schedule.access_token}`
  const text = `Olá ${props.schedule.driver_name}, seu agendamento no terminal ${yardStore.currentTenant?.name || 'RotaFlow'} está confirmado para o veículo ${props.schedule.vehicle_plate}. Acesse seu link de check-in e QR Code da portaria aqui: ${url}`
  
  navigator.clipboard.writeText(url)
  const rawPhone = (props.schedule.driver_phone || '').replace(/\D/g, '')
  let whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
  if (rawPhone.length >= 10) {
    const formattedPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`
    whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`
  }
  window.open(whatsappUrl, '_blank')
}


async function advanceStatus() {
  const current = props.schedule.status
  if (current === 'Agendado') {
    // Check-in na cancela
    await yardStore.updateScheduleStatus(props.schedule.id, 'Aguardando_Patio')
  } else if (current === 'Aguardando_Patio') {
    // Alocar doca
    emit('assignDock', props.schedule)
  } else if (current === 'Em_Doca') {
    // Liberar
    await yardStore.updateScheduleStatus(props.schedule.id, 'Liberado')
  }
}
</script>

<template>
  <div 
    class="bg-slate-900/90 rounded-xl p-4 border transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 group"
    :class="[
      isOverdue 
        ? 'border-rose-600/60 shadow-rose-950/20 bg-gradient-to-b from-slate-900 to-rose-950/20' 
        : 'border-slate-800 hover:border-slate-700 shadow-slate-950/40'
    ]"
  >
    <!-- Card Header: Placa e SLA Badge -->
    <div class="flex items-start justify-between mb-2.5">
      <div>
        <div class="flex items-center space-x-2">
          <span class="font-mono text-base font-bold text-white tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {{ schedule.vehicle_plate }}
          </span>
          <span v-if="schedule.trailer_plate" class="text-xs font-mono text-slate-400">
            + {{ schedule.trailer_plate }}
          </span>
        </div>
        <p class="text-xs font-medium text-slate-300 mt-1 truncate max-w-[180px]">
          {{ schedule.carrier_name }}
        </p>
      </div>

      <!-- Live Timer Badge -->
      <div 
        class="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold"
        :class="[
          isOverdue 
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
        ]"
        :title="isOverdue ? 'Tempo excedido gerando custo de estadia' : 'Dentro da tolerância / SLA'"
      >
        <Clock class="w-3.5 h-3.5" />
        <span>{{ elapsedTimeFormatted }}</span>
      </div>
    </div>

    <!-- Cargo & Driver details -->
    <div class="space-y-1.5 text-xs text-slate-400 my-3">
      <div class="flex items-center justify-between">
        <span class="text-slate-500">Carga:</span>
        <span class="text-slate-300 font-medium truncate max-w-[170px]">{{ schedule.cargo_type }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-500">Motorista:</span>
        <span class="text-slate-300 font-medium truncate max-w-[170px]">{{ schedule.driver_name }}</span>
      </div>
      <div v-if="schedule.dock_name" class="flex items-center justify-between">
        <span class="text-slate-500">Doca:</span>
        <span class="text-sky-400 font-semibold bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/60">
          {{ schedule.dock_name }}
        </span>
      </div>
    </div>

    <!-- Overdue Alert with Detention Cost -->
    <div 
      v-if="isOverdue && detentionCost > 0"
      class="bg-rose-950/40 border border-rose-800/80 rounded-lg p-2 my-2.5 flex items-center justify-between text-xs"
    >
      <div class="flex items-center space-x-1.5 text-rose-300">
        <AlertTriangle class="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span class="font-medium text-[11px]">Multa de Estadia:</span>
      </div>
      <span class="font-mono font-bold text-rose-300">
        R$ {{ detentionCost }}
      </span>
    </div>

    <!-- Actions Footer -->
    <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between mt-2">
      <!-- WhatsApp Link Button -->
      <button
        @click="copyWhatsAppLink"
        title="Enviar link de check-in para o motorista no WhatsApp"
        class="text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 p-1.5 rounded-lg transition-colors flex items-center space-x-1 text-xs"
      >
        <Share2 class="w-3.5 h-3.5" />
        <span class="text-[11px]">WhatsApp</span>
      </button>

      <!-- Stage Transition Button -->
      <button
        v-if="schedule.status !== 'Liberado'"
        @click="advanceStatus"
        class="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-all active:scale-95"
        :class="[
          schedule.status === 'Agendado' 
            ? 'bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-600/40'
            : schedule.status === 'Aguardando_Patio'
            ? 'bg-sky-600/20 text-sky-300 hover:bg-sky-600/30 border border-sky-600/40'
            : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-600/40'
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
        <ArrowRightCircle class="w-3.5 h-3.5" />
      </button>

      <span v-else class="flex items-center space-x-1 text-emerald-400 text-xs font-medium">
        <CheckCircle2 class="w-3.5 h-3.5" />
        <span>Concluído</span>
      </span>
    </div>

  </div>
</template>
