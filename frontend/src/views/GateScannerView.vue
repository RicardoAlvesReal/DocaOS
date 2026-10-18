<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import QRCode from 'qrcode'
import { useYardStore } from '../stores/yard'
import { useAuthStore } from '../stores/auth'
import { 
  ScanLine, 
  Camera, 
  CameraOff,
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DoorClosed, 
  Truck,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Volume2,
  QrCode as QrIcon,
  Eye,
  X,
  Zap
} from 'lucide-vue-next'

const yardStore = useYardStore()
const authStore = useAuthStore()

const scanInput = ref('')
const scanInputRef = ref(null)
const isScanning = ref(false)
const scanResult = ref(null)
const scanError = ref('')

// Câmera & Leitor Óptico Web
const isCameraActive = ref(false)
const isCameraLoading = ref(false)
const cameraError = ref('')
const availableCameras = ref([])
const currentCameraIndex = ref(0)
let html5QrCode = null

// Modal de visualização de QR Code para teste
const showQrModal = ref(false)
const sampleQrDataUrl = ref('')
const samplePlateSelected = ref('BRA2E19')

// Placas ativas para teste rápido no Sandbox / Demonstração
const demoPlates = ['BRA2E19', 'SPX9A88', 'VIX1J99']

// Identifica com segurança se a aplicação está em modo Sandbox / Demonstração
const isSandboxMode = computed(() => Boolean(
  authStore.isDemoMode || 
  yardStore.currentTenant?.id === 'demo-tenant-id' || 
  yardStore.currentTenant?.name?.includes('Sandbox') ||
  authStore.user?.role === 'demo_operator' ||
  localStorage.getItem('rotaflow_demo_mode') === 'true'
))

// Bip sintético de confirmação de leitura óptica (Web Audio API)
function playBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const audioCtx = new AudioContext()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, audioCtx.currentTime) // Nota Lá (880Hz)
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12)
    
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.12)
  } catch (e) {
    // Silencia se o áudio não tiver permissão de reprodução imediata
  }
}

// =========================================================================
// CONTROLE DO LEITOR ÓPTICO POR CÂMERA (Webcam / Celular / Tablet)
// =========================================================================
async function startCamera() {
  cameraError.value = ''
  isCameraLoading.value = true

  try {
    // Garante que o elemento DOM do leitor existe
    await nextTick()

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode('gate-camera-stream')
    }

    // Tenta listar câmeras disponíveis
    try {
      const devices = await Html5Qrcode.getCameras()
      if (devices && devices.length > 0) {
        availableCameras.value = devices
      }
    } catch {
      // Ignora erro de enumeração e usa configuração padrão
    }

    const config = {
      fps: 12,
      qrbox: { width: 240, height: 240 },
      aspectRatio: 1.0
    }

    const cameraIdOrConfig = availableCameras.value.length > 0 
      ? availableCameras.value[currentCameraIndex.value].id 
      : { facingMode: 'environment' }

    await html5QrCode.start(
      cameraIdOrConfig,
      config,
      (decodedText) => {
        playBeep()
        performScan(decodedText)
      },
      () => {
        // Callback de frame não lido (normal em tempo real)
      }
    )

    isCameraActive.value = true
  } catch (err) {
    console.warn('Não foi possível iniciar a câmera:', err)
    cameraError.value = 'Câmera não detectada ou permissão de vídeo negada no navegador. O leitor via pistola USB e a digitação de placa continuam funcionando normalmente!'
    isCameraActive.value = false
  } finally {
    isCameraLoading.value = false
  }
}

async function stopCamera() {
  if (html5QrCode && isCameraActive.value) {
    try {
      await html5QrCode.stop()
      await html5QrCode.clear()
    } catch (err) {
      console.warn('Erro ao finalizar câmera:', err)
    }
  }
  isCameraActive.value = false
  isCameraLoading.value = false
}

async function switchCamera() {
  if (availableCameras.value.length <= 1) return
  await stopCamera()
  currentCameraIndex.value = (currentCameraIndex.value + 1) % availableCameras.value.length
  await startCamera()
}

// =========================================================================
// SUPORTE A LEITOR ÓPTICO FÍSICO USB (Pistola Laser)
// =========================================================================
let barcodeBuffer = ''
let lastKeyTime = 0

function handleGlobalKeydown(e) {
  // Ignora se estiver digitando em outros inputs ou se modal estiver aberto
  if (showQrModal.value) return
  
  const currentTime = Date.now()

  if (e.key === 'Enter') {
    if (barcodeBuffer.length >= 3) {
      playBeep()
      performScan(barcodeBuffer)
      barcodeBuffer = ''
      e.preventDefault()
    }
    return
  }

  // Pistolas ópticas USB digitam a sequência em altíssima velocidade (< 50ms por caractere)
  if (currentTime - lastKeyTime > 120) {
    barcodeBuffer = ''
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    barcodeBuffer += e.key
    lastKeyTime = currentTime
  }
}

// =========================================================================
// GERADOR DE QR CODE DE DEMONSTRAÇÃO (SANDBOX)
// =========================================================================
async function generateSampleQr(plate = 'BRA2E19') {
  samplePlateSelected.value = plate
  const targetSched = yardStore.schedules.find(s => s.vehicle_plate === plate)
  const qrString = targetSched?.qr_code_data || `ROTAFLOW:DEMO-TOKEN-${plate}:${plate}`
  try {
    sampleQrDataUrl.value = await QRCode.toDataURL(qrString, {
      width: 280,
      margin: 2,
      color: {
        dark: '#001c3d',
        light: '#ffffff'
      }
    })
    showQrModal.value = true
  } catch (err) {
    console.error('Erro ao gerar QR Code para teste:', err)
  }
}

// Simula a leitura óptica instantânea com bip
function simulateOpticalScan(plate) {
  playBeep()
  const targetSched = yardStore.schedules.find(s => s.vehicle_plate === plate)
  const code = targetSched?.qr_code_data || `ROTAFLOW:DEMO-TOKEN-${plate}:${plate}`
  scanInput.value = code
  performScan(code)
}

// =========================================================================
// EXECUÇÃO DO SCAN (SANDBOX vs REAL BACKEND)
// =========================================================================
async function performScan(customValue = null) {
  const valueToSearch = customValue || scanInput.value
  if (!valueToSearch) return

  scanError.value = ''
  scanResult.value = null
  isScanning.value = true

  // Foco de volta no input para o próximo scan da pistola
  nextTick(() => scanInputRef.value?.focus())

  // =====================================================================
  // 1. MODO SANDBOX / DEMONSTRAÇÃO (Execução Local Segura em Memória)
  // =====================================================================
  if (isSandboxMode.value) {
    setTimeout(() => {
      try {
        const clean = valueToSearch.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
        const found = yardStore.schedules.find(s => 
          (s.vehicle_plate || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase() === clean || 
          s.qr_code_data === valueToSearch ||
          (s.qr_code_data && valueToSearch.includes(s.qr_code_data)) ||
          s.id === valueToSearch ||
          (s.vehicle_plate && valueToSearch.includes(s.vehicle_plate))
        )

        if (!found) {
          throw new Error(`Nenhum agendamento ativo encontrado para "${valueToSearch}". No modo Sandbox, utilize as placas de teste sugeridas abaixo (ex: BRA2E19, SPX9A88 ou VIX1J99).`)
        }

        const now = new Date()

        if (found.status === 'Agendado') {
          found.status = 'Aguardando_Patio'
          found.checkin_gate_at = now.toISOString()
          scanResult.value = {
            success: true,
            message: `ENTRADA REGISTRADA! Veículo ${found.vehicle_plate} autorizado a acessar o pátio. Cancela liberada!`,
            schedule_id: found.id,
            carrier_name: found.carrier_name,
            driver_name: found.driver_name,
            vehicle_plate: found.vehicle_plate,
            dock_name: 'Aguardando chamada de doca',
            previous_status: 'Agendado',
            new_status: 'Aguardando_Patio',
            checkin_at: now
          }
          yardStore.showNotification(`Entrada confirmada para ${found.vehicle_plate}! (Sandbox)`, 'success')
        } else if (['Aguardando_Patio', 'Em_Doca'].includes(found.status)) {
          const prev = found.status
          found.status = 'Liberado'
          found.released_at = now.toISOString()
          scanResult.value = {
            success: true,
            message: `SAÍDA REGISTRADA! Operação física concluída para ${found.vehicle_plate}. Cancela liberada para saída!`,
            schedule_id: found.id,
            carrier_name: found.carrier_name,
            driver_name: found.driver_name,
            vehicle_plate: found.vehicle_plate,
            dock_name: found.dock_name || 'Doca Concluída',
            previous_status: prev,
            new_status: 'Liberado',
            checkin_at: found.checkin_gate_at || now
          }
          yardStore.showNotification(`Saída confirmada para ${found.vehicle_plate}! (Sandbox)`, 'info')
        } else {
          scanResult.value = {
            success: true,
            message: `Veículo ${found.vehicle_plate} já possui saída final registrada no pátio (${found.status}).`,
            schedule_id: found.id,
            carrier_name: found.carrier_name,
            driver_name: found.driver_name,
            vehicle_plate: found.vehicle_plate,
            dock_name: found.dock_name || 'Finalizado',
            previous_status: 'Liberado',
            new_status: 'Liberado',
            checkin_at: found.checkin_gate_at || now
          }
        }

        scanInput.value = ''
      } catch (err) {
        scanError.value = err.message
      } finally {
        isScanning.value = false
      }
    }, 200)
    return
  }

  // =====================================================================
  // 2. MODO REAL / PRODUÇÃO (Chamada à API do Backend)
  // =====================================================================
  try {
    const isTokenOrQr = valueToSearch.includes('ROTAFLOW:') || valueToSearch.length > 20
    const payload = isTokenOrQr 
      ? { access_token: valueToSearch, tenant_id: yardStore.currentTenant?.id }
      : { vehicle_plate: valueToSearch, tenant_id: yardStore.currentTenant?.id }

    const res = await fetch('/api/v1/gate/scan', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...authStore.getAuthHeader()
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      let errorMsg = 'Não foi possível validar a entrada na portaria.'
      try {
        const text = await res.text()
        try {
          const errData = JSON.parse(text)
          errorMsg = errData.detail || errorMsg
        } catch {
          errorMsg = (text && text.length < 200) ? text : `Erro no servidor (${res.status})`
        }
      } catch {
        errorMsg = `Erro na comunicação com o servidor (${res.status})`
      }
      throw new Error(errorMsg)
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

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  nextTick(() => {
    scanInputRef.value?.focus()
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  stopCamera()
})
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    
    <!-- Header -->
    <div class="text-center space-y-2">
      <div class="inline-flex items-center space-x-2 bg-sky-950/80 border border-sky-800 px-3.5 py-1 rounded-full text-xs font-mono font-semibold text-sky-400">
        <ScanLine class="w-3.5 h-3.5" />
        <span>Portaria & Cancela Inteligente</span>
      </div>
      <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Leitor Óptico de QR Code & Placas</h1>
      <p class="text-xs text-slate-400 max-w-lg mx-auto">
        Validação instantânea por câmera de vídeo, leitor óptico USB de balcão (pistola laser) ou digitação de placa.
      </p>
    </div>

    <!-- Scanner Input Card -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      
      <!-- =============================================================== -->
      <!-- Visual Scanner / Video Camera Stream Box                        -->
      <!-- =============================================================== -->
      <div class="relative bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-b from-[#086cfe]/5 via-transparent to-[#086cfe]/5 pointer-events-none"></div>

        <!-- CÂMERA ATIVA -->
        <div v-show="isCameraActive" class="space-y-3">
          <div class="relative max-w-sm mx-auto overflow-hidden rounded-xl border border-sky-500/40 bg-black shadow-2xl">
            <div id="gate-camera-stream" class="w-full"></div>
            <!-- Target Overlay HUD -->
            <div class="absolute inset-0 border-2 border-sky-400/30 pointer-events-none flex items-center justify-center">
              <div class="w-48 h-48 border-2 border-dashed border-sky-400/80 rounded-xl animate-pulse"></div>
            </div>
            <!-- Scanning Laser Line -->
            <div class="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#086cfe] to-transparent top-1/2 -translate-y-1/2 animate-pulse pointer-events-none"></div>
          </div>

          <div class="flex items-center justify-center space-x-3 pt-2">
            <button
              @click="stopCamera"
              class="px-3.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <CameraOff class="w-4 h-4" />
              <span>Desligar Câmera</span>
            </button>

            <button
              v-if="availableCameras.length > 1"
              @click="switchCamera"
              class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw class="w-4 h-4" />
              <span>Trocar Câmera</span>
            </button>
          </div>
        </div>

        <!-- CÂMERA DESLIGADA / STANDBY -->
        <div v-show="!isCameraActive" class="space-y-4">
          <div class="w-16 h-16 rounded-2xl bg-slate-900 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400 shadow-xl shadow-sky-500/10 mb-2">
            <Camera class="w-8 h-8" :class="{ 'animate-pulse': isCameraLoading }" />
          </div>
          
          <div>
            <p class="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">Leitor Óptico & Câmera de Portaria</p>
            <p class="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
              Aponte a câmera para o QR Code do motorista ou use a pistola óptica USB conectada à guarita.
            </p>
          </div>

          <!-- Botão para Ligar Câmera -->
          <div class="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              @click="startCamera"
              :disabled="isCameraLoading"
              class="px-4 py-2 rounded-xl bg-[#086cfe] hover:bg-blue-600 disabled:opacity-50 text-white font-mono text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
            >
              <Camera class="w-4 h-4" />
              <span>{{ isCameraLoading ? 'Iniciando Leitor de Vídeo...' : 'Ligar Câmera / Leitor Web' }}</span>
            </button>

            <button
              v-if="isSandboxMode"
              @click="generateSampleQr('BRA2E19')"
              class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/30 font-mono text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Eye class="w-4 h-4 text-sky-400" />
              <span>Ver QR Code de Teste</span>
            </button>
          </div>
        </div>

        <!-- Alerta de Erro de Câmera se houver -->
        <div v-if="cameraError" class="mt-4 p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-amber-300 text-xs text-left flex items-start space-x-2.5">
          <AlertCircle class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{{ cameraError }}</span>
        </div>

        <!-- Indicador de Status do Leitor USB Físico -->
        <div class="mt-4 pt-3 border-t border-slate-900 flex items-center justify-center space-x-2 text-[11px] font-mono text-emerald-400">
          <Zap class="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Leitor USB / Pistola Laser pronto: aponte e aperte o gatilho a qualquer momento</span>
        </div>
      </div>

      <!-- Input Form -->
      <form @submit.prevent="performScan()" class="space-y-4">
        <div class="relative">
          <input
            ref="scanInputRef"
            v-model="scanInput"
            type="text"
            placeholder="Digite a Placa (ex: BRA2E19) ou use a pistola óptica no QR Code..."
            class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#086cfe] focus:ring-1 focus:ring-[#086cfe] uppercase tracking-wider"
          />
        </div>

        <button
          type="submit"
          :disabled="isScanning || !scanInput"
          class="w-full bg-[#086cfe] hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/25 text-xs font-mono uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span v-if="isScanning" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span v-else>Validar Acesso na Cancela</span>
          <ArrowRight v-if="!isScanning" class="w-4 h-4" />
        </button>
      </form>

      <!-- Quick Test Chips & Simulação de Leitor Óptico -->
      <div class="pt-3 border-t border-slate-800/80 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-slate-400 font-medium">Testes rápidos & Simulação de Leitor Óptico:</span>
          <span v-if="isSandboxMode" class="text-[10px] font-mono text-amber-400 flex items-center space-x-1">
            <Sparkles class="w-3 h-3" />
            <span>Sandbox Ativo</span>
          </span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in demoPlates"
            :key="p"
            @click="simulateOpticalScan(p)"
            class="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-mono text-sky-300 hover:text-white border border-sky-500/30 hover:border-sky-400 transition-colors cursor-pointer flex items-center space-x-1.5"
            :title="`Disparar leitura óptica com bip para ${p}`"
          >
            <Volume2 class="w-3.5 h-3.5 text-emerald-400" />
            <Truck class="w-3.5 h-3.5 text-sky-400" />
            <span>{{ p }}</span>
            <span class="text-[10px] text-slate-500">(Bip Óptico)</span>
          </button>
        </div>
      </div>

    </div>

    <!-- Error Banner -->
    <div v-if="scanError" class="bg-rose-950/70 border border-rose-800 rounded-2xl p-4 flex items-start space-x-3 text-rose-300 text-xs shadow-lg">
      <AlertCircle class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div>
        <p class="font-bold">Atenção na Portaria</p>
        <p class="mt-0.5 leading-relaxed">{{ scanError }}</p>
      </div>
    </div>

    <!-- Success Modal / Card -->
    <div v-if="scanResult" class="bg-emerald-950/40 border border-emerald-700/80 rounded-3xl p-6 shadow-2xl space-y-4">
      <div class="flex items-center space-x-3">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 class="w-7 h-7" />
        </div>
        <div>
          <span class="text-[11px] uppercase font-mono font-bold tracking-wider text-emerald-400">Cancela Liberada</span>
          <h2 class="text-base sm:text-lg font-bold text-white">{{ scanResult.message }}</h2>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/90 p-4 rounded-2xl border border-slate-800 text-xs">
        <div>
          <span class="text-slate-500 text-[10px] font-mono uppercase block">Placa</span>
          <p class="text-sm font-mono font-bold text-white mt-0.5">{{ scanResult.vehicle_plate }}</p>
        </div>
        <div>
          <span class="text-slate-500 text-[10px] font-mono uppercase block">Motorista</span>
          <p class="font-semibold text-slate-200 mt-0.5 truncate">{{ scanResult.driver_name }}</p>
        </div>
        <div>
          <span class="text-slate-500 text-[10px] font-mono uppercase block">Transportadora</span>
          <p class="font-semibold text-slate-200 mt-0.5 truncate">{{ scanResult.carrier_name }}</p>
        </div>
        <div>
          <span class="text-slate-500 text-[10px] font-mono uppercase block">Doca / Pátio</span>
          <p class="font-semibold text-sky-400 mt-0.5 truncate">{{ scanResult.dock_name }}</p>
        </div>
      </div>

      <div class="flex items-center justify-between text-xs text-slate-400 pt-1 font-mono">
        <span>Status Atual: <strong class="text-white">{{ scanResult.new_status }}</strong></span>
        <button @click="scanResult = null" class="text-sky-400 hover:text-white underline cursor-pointer text-[11px]">
          Fechar Notificação
        </button>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- MODAL DE VISUALIZAÇÃO DE QR CODE PARA TESTE                         -->
    <!-- =================================================================== -->
    <div v-if="showQrModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center relative">
        <button 
          @click="showQrModal = false"
          class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>

        <div class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-950 text-sky-400 border border-sky-800 text-[11px] font-mono font-semibold">
          <QrIcon class="w-3.5 h-3.5" />
          <span>QR Code do Motorista (Simulação)</span>
        </div>

        <h3 class="text-base font-bold text-white">
          Aponte sua Câmera ou Leitor USB
        </h3>
        
        <p class="text-xs text-slate-400">
          Este é o QR Code que o motorista da carreta <strong class="text-white">{{ samplePlateSelected }}</strong> recebe via WhatsApp.
        </p>

        <!-- QR Code Image -->
        <div class="bg-white p-4 rounded-2xl inline-block shadow-xl border-4 border-sky-500/30">
          <img :src="sampleQrDataUrl" alt="QR Code" class="w-48 h-48 mx-auto" />
        </div>

        <div class="flex items-center justify-center gap-2 pt-2">
          <button
            v-for="p in demoPlates"
            :key="p"
            @click="generateSampleQr(p)"
            class="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer"
            :class="samplePlateSelected === p ? 'bg-[#086cfe] text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
          >
            {{ p }}
          </button>
        </div>

        <button
          @click="showQrModal = false; simulateOpticalScan(samplePlateSelected)"
          class="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
        >
          <Volume2 class="w-4 h-4" />
          <span>Testar Validação Imediata</span>
        </button>
      </div>
    </div>

  </div>
</template>
