<script setup>
import { ref } from 'vue'
import { useYardStore } from '../stores/yard'
import { 
  ScanLine, 
  Camera, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DoorClosed, 
  Truck,
  ArrowRight
} from 'lucide-vue-next'

const yardStore = useYardStore()
const scanInput = ref('')
const isScanning = ref(false)
const scanResult = ref(null)
const scanError = ref('')

// Simulações de testes rápidos para a portaria
const demoPlates = ['RTO4B22', 'LOG8F31', 'BRA2E19']

async function performScan(customValue = null) {
  const valueToSearch = customValue || scanInput.value
  if (!valueToSearch) return

  scanError.value = ''
  scanResult.value = null
  isScanning.value = true

  try {
    const isTokenOrQr = valueToSearch.includes('ROTAFLOW:') || valueToSearch.length > 20
    const payload = isTokenOrQr 
      ? { access_token: valueToSearch, tenant_id: yardStore.currentTenant?.id }
      : { vehicle_plate: valueToSearch, tenant_id: yardStore.currentTenant?.id }

    const res = await fetch('/api/v1/gate/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.detail || 'Não foi possível validar a entrada na portaria.')
    }

    const data = await res.json()
    scanResult.value = data
    scanInput.value = ''
    yardStore.fetchSchedules() // Atualiza a lista
  } catch (err) {
    scanError.value = err.message
  } finally {
    isScanning.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    
    <!-- Header -->
    <div class="text-center space-y-2">
      <div class="inline-flex items-center space-x-2 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full text-xs font-semibold text-sky-400">
        <ScanLine class="w-3.5 h-3.5" />
        <span>Portaria & Cancela Principal</span>
      </div>
      <h1 class="text-2xl font-extrabold text-white tracking-tight">Leitura de QR Code & Entrada de Veículos</h1>
      <p class="text-xs text-slate-400">Aproxime o QR Code do celular do motorista ou digite a placa para check-in imediato</p>
    </div>

    <!-- Scanner Input Card -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
      
      <!-- Visual Scanner Box -->
      <div class="relative bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-b from-sky-500/5 via-transparent to-sky-500/5 pointer-events-none"></div>
        <div class="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center mx-auto text-sky-400 shadow-lg mb-3">
          <Camera class="w-8 h-8 animate-pulse" />
        </div>
        <p class="text-xs font-semibold text-slate-300">Leitor Óptico / Câmera de Portaria</p>
        <p class="text-[11px] text-slate-500 mt-1">Cole o código lido pelo leitor USB ou digite a placa do caminhão</p>

        <!-- Scanner laser bar animation -->
        <div class="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent top-1/2 -translate-y-1/2 animate-pulse"></div>
      </div>

      <!-- Input Form -->
      <form @submit.prevent="performScan()" class="space-y-3">
        <div class="relative">
          <input
            v-model="scanInput"
            type="text"
            placeholder="Digite a Placa (ex: BRA2E19) ou cole o QR Code..."
            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 uppercase tracking-wider"
          />
        </div>

        <button
          type="submit"
          :disabled="isScanning || !scanInput"
          class="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-sky-500/20 text-sm flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
        >
          <span>{{ isScanning ? 'Validando Entrada...' : 'Registrar Entrada na Cancela' }}</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </form>

      <!-- Quick Test Chips -->
      <div class="pt-2 border-t border-slate-800/80">
        <span class="text-[11px] text-slate-500 block mb-2 font-medium">Testar leitura rápida com placas demo:</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in demoPlates"
            :key="p"
            @click="performScan(p)"
            class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            {{ p }}
          </button>
        </div>
      </div>

    </div>

    <!-- Error Banner -->
    <div v-if="scanError" class="bg-rose-950/60 border border-rose-800 rounded-2xl p-4 flex items-start space-x-3 text-rose-300 text-xs">
      <AlertCircle class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div>
        <p class="font-bold">Atenção na Portaria</p>
        <p class="mt-0.5">{{ scanError }}</p>
      </div>
    </div>

    <!-- Success Modal / Card -->
    <div v-if="scanResult" class="bg-emerald-950/40 border border-emerald-700/80 rounded-3xl p-6 shadow-2xl space-y-4">
      <div class="flex items-center space-x-3">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <CheckCircle2 class="w-7 h-7" />
        </div>
        <div>
          <span class="text-[11px] uppercase font-bold tracking-wider text-emerald-400">Check-in Confirmado</span>
          <h2 class="text-lg font-bold text-white">Veículo Liberado para o Pátio!</h2>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
        <div>
          <span class="text-slate-500">Placa:</span>
          <p class="text-sm font-mono font-bold text-white mt-0.5">{{ scanResult.vehicle_plate }}</p>
        </div>
        <div>
          <span class="text-slate-500">Motorista:</span>
          <p class="font-semibold text-slate-200 mt-0.5 truncate">{{ scanResult.driver_name }}</p>
        </div>
        <div>
          <span class="text-slate-500">Transportadora:</span>
          <p class="font-semibold text-slate-200 mt-0.5 truncate">{{ scanResult.carrier_name }}</p>
        </div>
        <div>
          <span class="text-slate-500">Doca Designada:</span>
          <p class="font-semibold text-sky-400 mt-0.5">{{ scanResult.dock_name }}</p>
        </div>
      </div>

      <p class="text-xs text-slate-400 text-center">
        O cronômetro de permanência no pátio começou a rodar na Torre de Controle.
      </p>
    </div>

  </div>
</template>
