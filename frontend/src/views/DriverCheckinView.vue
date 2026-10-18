<script setup>
import { ref, onMounted } from 'vue'
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
  ArrowRight
} from 'lucide-vue-next'

const route = useRoute()
const token = route.params.token

const isLoading = ref(true)
const errorMessage = ref('')
const appointmentData = ref(null)

const step = ref(1) // 1: Conferência, 2: QR Code Tela Cheia
const inputPlate = ref('')
const inputCpf = ref('')
const isConfirming = ref(false)
const confirmError = ref('')

onMounted(async () => {
  try {
    const res = await fetch(`/api/v1/driver/${token}`)
    if (!res.ok) {
      throw new Error('Agendamento não encontrado ou link expirado.')
    }
    const data = await res.json()
    appointmentData.value = data
    inputPlate.value = data.vehicle_plate
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
})

async function handleConfirm() {
  confirmError.value = ''
  isConfirming.value = true
  try {
    const res = await fetch(`/api/v1/driver/${token}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_plate: inputPlate.value,
        driver_cpf: inputCpf.value
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

            <button
              type="submit"
              :disabled="isConfirming"
              class="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 text-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>{{ isConfirming ? 'Validando...' : 'Confirmar e Ver QR Code' }}</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <!-- STEP 2: QR Code Tela Cheia -->
      <div v-else-if="step === 2" class="space-y-4 text-center">
        <div class="bg-white rounded-3xl p-6 shadow-2xl border-4 border-sky-500/30">
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

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-left space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-400">Destino:</span>
            <span class="text-white font-medium">{{ appointmentData.dock_name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Status atual:</span>
            <span class="text-emerald-400 font-semibold">{{ appointmentData.status }}</span>
          </div>
        </div>

        <button
          @click="step = 1"
          class="text-xs text-slate-400 hover:text-white underline cursor-pointer"
        >
          Corrigir placa ou CPF
        </button>
      </div>

    </main>

    <!-- Footer -->
    <footer class="py-3 text-center border-t border-slate-900">
      <p class="text-[10px] text-slate-600 font-medium">RotaFlow YMS &bull; Operação Logística Integrada</p>
    </footer>

  </div>
</template>
