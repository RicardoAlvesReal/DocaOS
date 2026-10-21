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
  Zap,
  MapPin,
  IdCard,
  ClipboardCheck,
  ShieldCheck
} from 'lucide-vue-next'

const yardStore = useYardStore()
const authStore = useAuthStore()

const scanInput = ref('')
const scanInputRef = ref(null)
const isScanning = ref(false)
const scanResult = ref(null)
const scanError = ref('')

// Vistoria de Portaria (Lacre & Avarias - Diferencial ISO/OEA)
const showInspection = ref(false)
const sealNumber = ref('')
const sealStatus = ref('Intacto')
const hasDamage = ref(false)
const damageNotes = ref('')

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

// Placas e Crachás ativos para teste rápido no Sandbox / Demonstração
const demoPlates = ['BRA2E19', 'SPX9A88', 'VIX1J99']
const demoBadges = [
  { code: 'BADGE-M7701', label: 'Carlos (Motorista)' },
  { code: 'BADGE-A8842', label: 'Wellington (Chapa)' },
  { code: 'BADGE-P9910', label: 'Eduardo (Thermo King)' }
]

// Identifica com segurança se a aplicação está em modo Sandbox / Demonstração
const isSandboxMode = computed(() => Boolean(
  authStore.isDemoMode || 
  yardStore.currentTenant?.id === 'demo-tenant-id' || 
  yardStore.currentTenant?.name?.includes('Sandbox') ||
  authStore.user?.role === 'demo_operator' ||
  localStorage.getItem('docaos_demo_mode') === 'true' ||
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
  isCameraActive.value = true

  try {
    // Garante que o elemento DOM do leitor já está visível e com dimensões calculadas
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
      fps: 15,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
        const size = Math.max(160, Math.floor(minEdge * 0.75))
        return { width: size, height: size }
      },
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
  } catch (err) {
    console.warn('Não foi possível iniciar a câmera:', err)
    isCameraActive.value = false
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      cameraError.value = 'Navegadores exigem conexão segura (HTTPS ou localhost) para abrir a câmera de vídeo. Acesse por HTTPS ou use a pistola óptica USB / digitação.'
    } else {
      cameraError.value = 'Câmera não detectada ou permissão de vídeo negada no navegador. O leitor via pistola USB e a digitação de placa continuam funcionando normalmente!'
    }
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
        // A. Verificação se é leitura de Crachá Digital (Pedestre / Ajudante)
        if (valueToSearch.includes('BADGE') || valueToSearch.startsWith('DOCAOS:BADGE:') || valueToSearch.startsWith('ROTAFLOW:BADGE:')) {
          const cleanCode = valueToSearch.replace('DOCAOS:BADGE:', '').replace('ROTAFLOW:BADGE:', '').split(':')[0]
          const badge = (yardStore.badges || []).find(b => 
            b.badge_code === cleanCode || 
            b.document_number === cleanCode || 
            valueToSearch.includes(b.badge_code)
          )
          if (badge) {
            const isEntry = badge.status === 'Ativo'
            badge.status = isEntry ? 'Em_Patio' : 'Ativo'
            scanResult.value = {
              success: true,
              message: isEntry 
                ? `ACESSO PEDESTRE AUTORIZADO! ${badge.full_name} liberado para: ${badge.authorized_zones}.` 
                : `SAÍDA REGISTRADA: ${badge.full_name} deixou as dependências.`,
              schedule_id: badge.id,
              carrier_name: badge.company_name,
              driver_name: badge.full_name,
              vehicle_plate: badge.vehicle_plate || 'ACESSO A PÉ / PEDESTRE',
              dock_name: `Zona: ${badge.authorized_zones}`,
              previous_status: isEntry ? 'Ativo' : 'Em_Patio',
              new_status: badge.status,
              checkin_at: new Date(),
              badge_info: {
                badge_code: badge.badge_code,
                category: badge.category,
                document_number: badge.document_number,
                authorized_zones: badge.authorized_zones
              }
            }
            yardStore.showNotification(`Crachá ${badge.badge_code} validado na portaria! (Sandbox)`, 'success')
            scanInput.value = ''
            isScanning.value = false
            return
          }
        }

        // B. Verificação de Agendamento de Veículo
        const clean = valueToSearch.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
        const found = yardStore.schedules.find(s => 
          (s.vehicle_plate || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase() === clean || 
          s.qr_code_data === valueToSearch ||
          (s.qr_code_data && valueToSearch.includes(s.qr_code_data)) ||
          s.id === valueToSearch ||
          (s.vehicle_plate && valueToSearch.includes(s.vehicle_plate))
        )

        if (!found) {
          throw new Error(`Nenhum agendamento ou crachá ativo encontrado para "${valueToSearch}". No modo Sandbox, utilize as placas ou crachás de teste sugeridos abaixo.`)
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
            checkin_at: now,
            seal_number: sealNumber.value || null,
            seal_status: sealStatus.value || 'Intacto'
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
    const isTokenOrQr = valueToSearch.includes('DOCAOS:') || valueToSearch.includes('ROTAFLOW:') || valueToSearch.includes('BADGE') || valueToSearch.length > 20
    const payload = {
      access_token: isTokenOrQr ? valueToSearch : undefined,
      vehicle_plate: !isTokenOrQr ? valueToSearch : undefined,
      tenant_id: yardStore.currentTenant?.id,
      seal_number: sealNumber.value || undefined,
      seal_status: sealStatus.value || 'Intacto',
      has_damage: hasDamage.value || false,
      damage_notes: damageNotes.value || undefined
    }

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
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
      <div class="text-center sm:text-left space-y-1">
        <div class="inline-flex items-center space-x-2 bg-teal-950/80 border border-teal-800 px-3.5 py-1 rounded-full text-xs font-mono font-semibold text-[#00A896] dark:text-[#00E5C8]">
          <ScanLine class="w-3.5 h-3.5" />
          <span>Portaria & Cancela Inteligente</span>
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight">Leitor Óptico de QR Code & Placas</h1>
        <p class="text-xs text-slate-400">
          Validação instantânea por câmera de vídeo, leitor óptico USB de balcão (pistola laser) ou digitação de placa.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <router-link
          to="/crachas"
          class="flex items-center space-x-2 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-700/60 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-lg"
          title="Ver e emitir crachás digitais para pedestres e terceiros"
        >
          <IdCard class="w-4 h-4 text-indigo-400" />
          <span>Crachás Digitais</span>
        </router-link>

        <router-link
          to="/mapa"
          class="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-lg"
          title="Ver mapa de veículos se aproximando da portaria"
        >
          <MapPin class="w-4 h-4 text-emerald-400" />
          <span>Veículos no Mapa GPS</span>
        </router-link>
      </div>
    </div>

    <!-- Scanner Input Card -->
    <div class="bg-white dark:bg-[#031d3d] border border-slate-200 dark:border-teal-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      
      <!-- =============================================================== -->
      <!-- Visual Scanner / Video Camera Stream Box                        -->
      <!-- =============================================================== -->
      <div class="relative bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-b from-[#086cfe]/5 via-transparent to-[#086cfe]/5 pointer-events-none"></div>

        <!-- CÂMERA ATIVA -->
        <div v-show="isCameraActive" class="space-y-3">
          <div class="relative max-w-sm mx-auto overflow-hidden rounded-xl border border-[#00A896]/40 bg-black shadow-2xl">
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
          <div class="w-16 h-16 rounded-2xl bg-slate-900 border border-[#00A896]/30 flex items-center justify-center mx-auto text-[#00A896] dark:text-[#00E5C8] shadow-xl shadow-sky-500/10 mb-2">
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
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00A896] to-teal-500 hover:bg-blue-600 disabled:opacity-50 text-white font-mono text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
            >
              <Camera class="w-4 h-4" />
              <span>{{ isCameraLoading ? 'Iniciando Leitor de Vídeo...' : 'Ligar Câmera / Leitor Web' }}</span>
            </button>

            <button
              v-if="isSandboxMode"
              @click="generateSampleQr('BRA2E19')"
              class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-700 dark:text-teal-300 border border-[#00A896]/30 font-mono text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Eye class="w-4 h-4 text-[#00A896] dark:text-[#00E5C8]" />
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
            placeholder="Digite a Placa (ex: BRA2E19) ou use a pistola óptica no QR Code ou Crachá..."
            class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#086cfe] focus:ring-1 focus:ring-[#086cfe] uppercase tracking-wider"
          />
        </div>

        <!-- Gaveta de Vistoria de Portaria (Lacre & Avarias - ISO 9001 / OEA) -->
        <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <button 
            type="button" 
            @click="showInspection = !showInspection"
            class="flex items-center justify-between w-full text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            <div class="flex items-center space-x-2">
              <ClipboardCheck class="w-4 h-4 text-[#00A896] dark:text-[#00E5C8]" />
              <span>Vistoria de Portaria (Conferência de Lacre & Avarias)</span>
            </div>
            <span class="text-[10px] font-mono text-[#00A896] dark:text-[#00E5C8] px-2 py-0.5 rounded bg-teal-950 border border-teal-800">
              {{ showInspection ? 'Ocultar Checklist' : '+ Abrir Vistoria ISO' }}
            </span>
          </button>

          <!-- Campos Expansíveis de Vistoria -->
          <div v-show="showInspection" class="space-y-3 pt-3 border-t border-slate-800/80">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block text-[11px] font-semibold text-slate-400 mb-1">Nº do Lacre do Baú (Manifesto)</label>
                <input
                  v-model="sealNumber"
                  type="text"
                  placeholder="Ex: LCR-88910"
                  class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono uppercase text-white focus:outline-none focus:border-[#00A896]"
                />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-slate-400 mb-1">Condição do Lacre</label>
                <select
                  v-model="sealStatus"
                  class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00A896] cursor-pointer"
                >
                  <option value="Intacto">Intacto / Conferido</option>
                  <option value="Rompido">Rompido / Violado (Alerta)</option>
                  <option value="Divergente">Divergente do CTE</option>
                  <option value="Sem_Lacre">Sem Lacre (Carga Seca/Local)</option>
                </select>
              </div>
            </div>

            <!-- Registro de Avarias / Divergência -->
            <div class="space-y-2 pt-1">
              <label class="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  v-model="hasDamage"
                  class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-rose-500"
                />
                <span :class="{ 'text-rose-400 font-bold': hasDamage }">Identificada avaria na carroceria ou carga na portaria</span>
              </label>

              <input
                v-if="hasDamage"
                v-model="damageNotes"
                type="text"
                placeholder="Descreva a avaria para registro na timeline de auditoria ISO..."
                class="w-full bg-slate-900 border border-rose-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          :disabled="isScanning || !scanInput"
          class="w-full bg-gradient-to-r from-[#00A896] to-teal-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/25 text-xs font-mono uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span v-if="isScanning" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span v-else>Validar Acesso na Cancela / Catraca</span>
          <ArrowRight v-if="!isScanning" class="w-4 h-4" />
        </button>
      </form>

      <!-- Quick Test Chips & Simulação de Leitor Óptico -->
      <div class="pt-3 border-t border-slate-800/80 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-slate-400 font-medium">Testes rápidos & Simulação de Leitor Óptico:</span>
          <span v-if="isSandboxMode" class="text-[10px] font-mono text-amber-400 flex items-center space-x-1">
            <Sparkles class="w-3 h-3" />
            <span>Sandbox Ativo</span>
          </span>
        </div>
        
        <!-- Veículos -->
        <div class="flex flex-wrap gap-2 items-center">
          <span class="text-[10px] font-mono uppercase text-slate-500">Veículos:</span>
          <button
            v-for="p in demoPlates"
            :key="p"
            @click="simulateOpticalScan(p)"
            class="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-mono text-teal-700 dark:text-teal-300 hover:text-white border border-[#00A896]/30 hover:border-sky-400 transition-colors cursor-pointer flex items-center space-x-1"
            :title="`Disparar leitura óptica com bip para ${p}`"
          >
            <Volume2 class="w-3.5 h-3.5 text-emerald-400" />
            <Truck class="w-3.5 h-3.5 text-[#00A896] dark:text-[#00E5C8]" />
            <span>{{ p }}</span>
          </button>
        </div>

        <!-- Crachás Digitais de Pedestres -->
        <div class="flex flex-wrap gap-2 items-center pt-1 border-t border-slate-900">
          <span class="text-[10px] font-mono uppercase text-indigo-400 flex items-center space-x-1">
            <IdCard class="w-3 h-3" />
            <span>Crachás:</span>
          </span>
          <button
            v-for="b in demoBadges"
            :key="b.code"
            @click="simulateOpticalScan(b.code)"
            class="px-2.5 py-1 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 text-xs font-mono text-indigo-300 hover:text-white border border-indigo-700/50 hover:border-indigo-500 transition-colors cursor-pointer flex items-center space-x-1"
            :title="`Disparar leitura óptica do crachá ${b.code}`"
          >
            <Volume2 class="w-3.5 h-3.5 text-indigo-400" />
            <span>{{ b.label }}</span>
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
          <span class="text-[11px] uppercase font-mono font-bold tracking-wider text-emerald-400">
            {{ scanResult.badge_info ? 'Credencial Validada • Catraca/Portaria Liberada' : 'Cancela Liberada • Veículo Autorizado' }}
          </span>
          <h2 class="text-base sm:text-lg font-bold text-white">{{ scanResult.message }}</h2>
        </div>
      </div>

      <!-- Detalhes do Acesso -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/90 p-4 rounded-2xl border border-slate-800 text-xs">
        <div>
          <span class="text-slate-500 text-[10px] font-mono uppercase block">
            {{ scanResult.badge_info ? 'Código do Crachá' : 'Placa do Veículo' }}
          </span>
          <p class="text-sm font-mono font-bold text-white mt-0.5">
            {{ scanResult.badge_info ? scanResult.badge_info.badge_code : scanResult.vehicle_plate }}
          </p>
        </div>
        <div>
          <span class="text-slate-500 text-[10px] font-mono uppercase block">
            {{ scanResult.badge_info ? 'Colaborador / Terceiro' : 'Motorista' }}
          </span>
          <p class="font-semibold text-slate-200 mt-0.5 truncate">{{ scanResult.driver_name }}</p>
        </div>
        <div>
          <span class="text-slate-500 text-[10px] font-mono uppercase block">Empresa</span>
          <p class="font-semibold text-slate-200 mt-0.5 truncate">{{ scanResult.carrier_name }}</p>
        </div>
        <div>
          <span class="text-slate-500 text-[10px] font-mono uppercase block">
            {{ scanResult.badge_info ? 'Zonas Liberadas' : 'Doca / Pátio' }}
          </span>
          <p class="font-semibold text-[#00A896] dark:text-[#00E5C8] mt-0.5 truncate">{{ scanResult.dock_name }}</p>
        </div>
      </div>

      <!-- Lacre conferido (se houver) -->
      <div v-if="scanResult.seal_number" class="p-2.5 rounded-xl bg-slate-950/90 border border-emerald-800/60 text-xs font-mono text-emerald-300 flex items-center justify-between">
        <span class="flex items-center space-x-1.5">
          <ShieldCheck class="w-4 h-4 text-emerald-400" />
          <span>Lacre do Baú Conferido: <strong>{{ scanResult.seal_number }}</strong></span>
        </span>
        <span class="text-[10px] font-bold uppercase bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
          {{ scanResult.seal_status || 'Intacto' }}
        </span>
      </div>

      <div class="flex items-center justify-between text-xs text-slate-400 pt-1 font-mono">
        <span>Status Atual: <strong class="text-white">{{ scanResult.new_status }}</strong></span>
        <button @click="scanResult = null" class="text-[#00A896] dark:text-[#00E5C8] hover:text-white underline cursor-pointer text-[11px]">
          Fechar Notificação
        </button>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- MODAL DE VISUALIZAÇÃO DE QR CODE PARA TESTE                         -->
    <!-- =================================================================== -->
    <transition name="modal">
      <div v-if="showQrModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="modal-panel bg-white dark:bg-[#001c3d] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-teal-500/20 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center relative">
          <button 
            @click="showQrModal = false"
            class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>

          <div class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-950 text-[#00A896] dark:text-[#00E5C8] border border-teal-800 text-[11px] font-mono font-semibold">
            <QrIcon class="w-3.5 h-3.5" />
            <span>QR Code do Motorista (Simulação)</span>
          </div>

          <h3 class="text-base font-bold text-slate-900 dark:text-white">
            Aponte sua Câmera ou Leitor USB
          </h3>
          
          <p class="text-xs text-slate-600 dark:text-slate-400">
            Este é o QR Code que o motorista da carreta <strong class="text-white">{{ samplePlateSelected }}</strong> recebe via WhatsApp.
          </p>

          <!-- QR Code Image -->
          <div class="bg-white p-4 rounded-2xl inline-block shadow-xl border-4 border-[#00A896]/30">
            <img :src="sampleQrDataUrl" alt="QR Code" class="w-48 h-48 mx-auto" />
          </div>

          <div class="flex items-center justify-center gap-2 pt-2">
            <button
              v-for="p in demoPlates"
              :key="p"
              @click="generateSampleQr(p)"
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer"
              :class="samplePlateSelected === p ? 'bg-gradient-to-r from-[#00A896] to-teal-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
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
    </transition>

  </div>
</template>

<style scoped>
:deep(#gate-camera-stream) {
  width: 100% !important;
  border: none !important;
}

:deep(#gate-camera-stream video) {
  width: 100% !important;
  height: auto !important;
  max-height: 360px;
  object-fit: cover !important;
  border-radius: 0.75rem;
}

:deep(#gate-camera-stream__scan_region) {
  min-height: 240px;
}
</style>
