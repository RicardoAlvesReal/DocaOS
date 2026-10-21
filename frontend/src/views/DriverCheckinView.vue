<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { 
  Truck, 
  QrCode, 
  CheckCircle, 
  ShieldCheck, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Clock,
  ArrowRight,
  DoorOpen,
  Volume2,
  Navigation
} from 'lucide-vue-next'

const route = useRoute()
const token = route.params.token

const isLoading = ref(true)
const errorMessage = ref('')
const appointmentData = ref(null)

const step = ref(1) // 1: Conferência, 2: QR Code / Painel de Status
const inputPlate = ref('')
const inputCpf = ref('')
const isConfirming = ref(false)
const confirmError = ref('')
let statusPollInterval = null

// Estado de Geolocalização (GPS & Cerca Eletrônica / Lei 11.442)
const gpsState = ref({
  loading: false,
  lat: null,
  lon: null,
  accuracy: null,
  distance: null,
  validated: false,
  error: ''
})

function getDriverCoordinates() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: null, longitude: null, accuracy: null })
      return
    }
    gpsState.value.loading = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gpsState.value.loading = false
        gpsState.value.lat = pos.coords.latitude
        gpsState.value.lon = pos.coords.longitude
        gpsState.value.accuracy = pos.coords.accuracy
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        })
      },
      (err) => {
        gpsState.value.loading = false
        gpsState.value.error = err.message
        console.warn('Geolocalização não concedida pelo usuário:', err)
        resolve({ latitude: null, longitude: null, accuracy: null })
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    )
  })
}

async function fetchStatus() {
  try {
    const res = await fetch(`/api/v1/driver/${token}`)
    if (res.ok) {
      const data = await res.json()
      // Se status mudou para Em_Doca, vibrar celular se disponível
      if (appointmentData.value && appointmentData.value.status !== 'Em_Doca' && data.status === 'Em_Doca') {
        if ('vibrate' in navigator) {
          navigator.vibrate([300, 150, 300, 150, 500])
        }
      }
      appointmentData.value = data
      inputPlate.value = data.vehicle_plate
      // Se já passou de Agendado, pula direto para o painel de status
      if (data.status !== 'Agendado' && step.value === 1) {
        step.value = 2
      }
    }
  } catch (err) {
    console.error('Erro no polling do motorista:', err)
  }
}

onMounted(async () => {
  try {
    const res = await fetch(`/api/v1/driver/${token}`)
    if (!res.ok) {
      throw new Error('Agendamento não encontrado ou link expirado.')
    }
    const data = await res.json()
    appointmentData.value = data
    inputPlate.value = data.vehicle_plate
    if (data.status !== 'Agendado') {
      step.value = 2
    }
    // Inicia polling leve a cada 4 segundos
    statusPollInterval = setInterval(fetchStatus, 4000)
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (statusPollInterval) clearInterval(statusPollInterval)
})


async function handleConfirm() {
  confirmError.value = ''
  isConfirming.value = true
  try {
    // Captura coordenadas instantâneas de GPS no momento do check-in
    const coords = await getDriverCoordinates()

    const res = await fetch(`/api/v1/driver/${token}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_plate: inputPlate.value,
        driver_cpf: inputCpf.value,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy_meters: coords.accuracy
      })
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.detail || 'Não foi possível validar seus dados.')
    }

    const result = await res.json()
    if (result.qr_code_data) {
      appointmentData.value.qr_code_data = result.qr_code_data
    }
    if (result.geofence_validated !== undefined) {
      appointmentData.value.geofence_validated = result.geofence_validated
      appointmentData.value.checkin_distance_meters = result.distance_meters
      gpsState.value.validated = result.geofence_validated
      gpsState.value.distance = result.distance_formatted
    }
    step.value = 2
  } catch (err) {
    confirmError.value = err.message
  } finally {
    isConfirming.value = false
  }
}

function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 max-w-md mx-auto">
    
    <!-- Top Brand Header -->
    <header class="py-4 text-center border-b border-slate-800/80">
      <div class="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full shadow-sm">
        <Truck class="w-4 h-4 text-sky-400" />
        <span class="text-xs font-bold tracking-wide text-slate-300">
          {{ appointmentData?.tenant_name || 'Terminal Logístico' }}
        </span>
      </div>
      <h1 class="text-lg font-extrabold mt-2 text-white">Check-in de Chegada</h1>
      <p class="text-[11px] text-slate-400">Acesso direto sem aplicativo</p>
    </header>

    <!-- Content Area -->
    <main class="my-auto py-6">
      
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-16 space-y-3">
        <div class="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs text-slate-400 font-medium">Buscando seu agendamento...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="bg-rose-950/40 border border-rose-800 rounded-2xl p-6 text-center space-y-3">
        <AlertCircle class="w-12 h-12 text-rose-400 mx-auto" />
        <h2 class="text-base font-bold text-white">Link Inválido ou Expirado</h2>
        <p class="text-xs text-rose-300">{{ errorMessage }}</p>
        <p class="text-[11px] text-slate-400">Entre em contato com a transportadora para reenviar seu agendamento.</p>
      </div>

      <!-- STEP 1: Conferência de Dados -->
      <div v-else-if="step === 1" class="space-y-5">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3.5">
          <div class="border-b border-slate-800 pb-3">
            <span class="text-[10px] uppercase font-bold tracking-wider text-sky-400">Passo 1 de 2</span>
            <h2 class="text-sm font-bold text-white mt-0.5">Confirme seus dados para liberar o QR Code</h2>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Motorista:</span>
              <span class="font-semibold text-white">{{ appointmentData.driver_name }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Transportadora:</span>
              <span class="font-semibold text-white">{{ appointmentData.carrier_name }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/60">
              <span class="text-slate-400">Janela de Horário:</span>
              <span class="font-semibold text-sky-400 font-mono text-[11px]">
                {{ formatDate(appointmentData.scheduled_window_start) }}
              </span>
            </div>
          </div>

          <form @submit.prevent="handleConfirm" class="space-y-4 pt-2">
            <div v-if="confirmError" class="p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs">
              {{ confirmError }}
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Confirme a Placa do Veículo *</label>
              <input
                v-model="inputPlate"
                type="text"
                required
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-base font-mono font-bold text-center uppercase tracking-widest text-sky-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Digite seu CPF (apenas números) *</label>
              <input
                v-model="inputCpf"
                type="text"
                required
                placeholder="Ex: 12345678900"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-center text-white focus:outline-none focus:border-sky-500"
              />
              <span class="text-[10px] text-slate-500 block text-center mt-1">
                Cadastrado como: {{ appointmentData.driver_cpf_masked }}
              </span>
            </div>

            <!-- Cerca Eletrônica / GPS Info -->
            <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center space-x-2.5 text-xs text-slate-300">
              <MapPin class="w-4 h-4 text-sky-400 shrink-0" />
              <span>Sua presença física no pátio será auditada via GPS para atendimento à Lei 11.442/2007.</span>
            </div>

            <button
              type="submit"
              :disabled="isConfirming"
              class="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>{{ isConfirming ? (gpsState.loading ? 'Obtendo GPS...' : 'Validando Presença...') : 'Confirmar Presença & Ver QR Code' }}</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <!-- STEP 2: QR Code e Acompanhamento em Tempo Real -->
      <div v-else-if="step === 2" class="space-y-4 text-center">

        <!-- Badge de Presença Física / GPS (Lei 11.442/2007) -->
        <div v-if="appointmentData.geofence_validated || gpsState.validated" class="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-[11px] font-mono text-emerald-300">
          <ShieldCheck class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Presença Física Auditada ({{ gpsState.distance || (appointmentData.checkin_distance_meters ? appointmentData.checkin_distance_meters + 'm' : 'No pátio') }}) &bull; Lei 11.442</span>
        </div>

        <!-- ALERTA URGENTE: VEÍCULO CHAMADO PARA A DOCA -->
        <div 
          v-if="appointmentData.status === 'Em_Doca'" 
          class="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 text-white shadow-2xl border-2 border-emerald-400 animate-pulse text-left space-y-2"
        >
          <div class="flex items-center space-x-2 text-xs font-black uppercase tracking-wider bg-emerald-950/40 px-3 py-1 rounded-full w-max text-emerald-200">
            <DoorOpen class="w-4 h-4 text-emerald-300" />
            <span>VAGA LIBERADA &bull; DIRIJA-SE À DOCA</span>
          </div>
          <h2 class="text-2xl font-black">{{ appointmentData.dock_name }}</h2>
          <p class="text-xs text-emerald-100">
            Estacione seu veículo na doca indicada e apresente-se ao conferente para início da operação.
          </p>
        </div>

        <!-- STATUS: AGUARDANDO NO PÁTIO -->
        <div 
          v-else-if="appointmentData.status === 'Aguardando_Patio'" 
          class="bg-sky-950/70 border border-sky-800/80 rounded-2xl p-4 text-left flex items-start space-x-3"
        >
          <Clock class="w-5 h-5 text-sky-400 shrink-0 mt-0.5 animate-spin" style="animation-duration: 8s" />
          <div>
            <h3 class="text-xs font-bold text-white">Check-in Efetuado na Portaria</h3>
            <p class="text-[11px] text-slate-300 mt-0.5">
              Aguarde na área de espera do pátio. Quando sua doca for liberada, esta tela atualizará e vibrará automaticamente.
            </p>
          </div>
        </div>

        <!-- STATUS: LIBERADO -->
        <div 
          v-else-if="appointmentData.status === 'Liberado'" 
          class="bg-emerald-950/70 border border-emerald-800 rounded-2xl p-4 text-left flex items-start space-x-3"
        >
          <CheckCircle class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h3 class="text-xs font-bold text-white">Operação Concluída com Sucesso!</h3>
            <p class="text-[11px] text-slate-300 mt-0.5">
              Carga/descarga finalizada e saída registrada na portaria. Tenha uma excelente viagem!
            </p>
          </div>
        </div>

        <!-- Cartão do QR Code (Exibido para check-in na portaria) -->
        <div 
          v-if="appointmentData.status === 'Agendado' || !appointmentData.status" 
          class="bg-white rounded-3xl p-6 shadow-2xl border-4 border-sky-500/30"
        >
          <div class="text-slate-900 mb-3">
            <span class="text-xs uppercase font-extrabold tracking-wider bg-slate-100 text-slate-800 px-3 py-1 rounded-full border border-slate-300">
              Passaporte de Portaria
            </span>
            <p class="text-lg font-black font-mono mt-2 tracking-widest">{{ inputPlate }}</p>
          </div>

          <!-- QR Code Image -->
          <div class="bg-white p-2 rounded-2xl inline-block shadow-inner">
            <img 
              :src="appointmentData.qr_code_data" 
              alt="QR Code de Check-in" 
              class="w-64 h-64 mx-auto object-contain"
            />
          </div>

          <div class="mt-4 text-slate-800">
            <p class="text-xs font-bold uppercase tracking-wider text-sky-800">Apresente este código na guarita</p>
            <p class="text-[11px] text-slate-500 mt-0.5">O leitor óptico fará a leitura direto da tela do seu celular</p>
          </div>
        </div>

        <!-- Dados do Agendamento -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-left space-y-1.5">
          <div class="flex justify-between">
            <span class="text-slate-400">Doca Designada:</span>
            <span class="text-white font-medium">{{ appointmentData.dock_name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Status atual:</span>
            <span class="text-emerald-400 font-semibold">{{ appointmentData.status }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Transportadora:</span>
            <span class="text-slate-300 font-medium truncate max-w-[200px]">{{ appointmentData.carrier_name }}</span>
          </div>
        </div>

        <button
          v-if="appointmentData.status === 'Agendado'"
          @click="step = 1"
          class="text-xs text-slate-400 hover:text-white underline cursor-pointer"
        >
          Corrigir placa ou CPF
        </button>
      </div>


    </main>

    <!-- Footer -->
    <footer class="py-3 text-center border-t border-slate-900">
      <p class="text-[10px] text-slate-500 font-medium">DocaOS &bull; Patio & Dock Operating System (docaos.log.br)</p>
    </footer>

  </div>
</template>
