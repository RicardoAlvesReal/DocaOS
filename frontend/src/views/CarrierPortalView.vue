<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QRCode from 'qrcode'
import { 
  Truck, 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  QrCode as QrIcon,
  Copy,
  ExternalLink
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const tenantSlug = computed(() => route.params.slug || 'comlog')
const isLoading = ref(true)
const errorMessage = ref('')
const tenantInfo = ref(null)

const isBooking = ref(false)
const bookingSuccess = ref(null)
const bookingQrCodeUrl = ref('')
const copiedLink = ref(false)

const form = ref({
  carrier_name: '',
  cargo_type: 'Carga Geral',
  invoice_number: '',
  vehicle_plate: '',
  trailer_plate: '',
  vehicle_body_type: 'Baú Fechado',
  temperature_controlled: false,
  temperature_target: '',
  driver_name: '',
  driver_cpf: '',
  driver_phone: '',
  helper_name: '',
  helper_cpf: '',
  scheduled_date: new Date().toISOString().split('T')[0],
  scheduled_time: '14:00',
  dock_id: '',
  notes: ''
})

async function fetchTenantInfo() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await fetch(`/api/v1/carrier-portal/${tenantSlug.value}/info`)
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Armazém não localizado ou portal não liberado.')
    }
    tenantInfo.value = await res.json()
    if (tenantInfo.value.docks && tenantInfo.value.docks.length > 0) {
      form.value.dock_id = tenantInfo.value.docks[0].id
    }
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
}

async function handleBooking() {
  errorMessage.value = ''
  isBooking.value = true

  try {
    const startIso = new Date(`${form.value.scheduled_date}T${form.value.scheduled_time}:00`).toISOString()
    const endDate = new Date(`${form.value.scheduled_date}T${form.value.scheduled_time}:00`)
    endDate.setHours(endDate.getHours() + 2) // Janela padrão de 2 horas
    const endIso = endDate.toISOString()

    const payload = {
      carrier_name: form.value.carrier_name,
      cargo_type: form.value.cargo_type,
      invoice_number: form.value.invoice_number,
      vehicle_plate: form.value.vehicle_plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
      trailer_plate: form.value.trailer_plate ? form.value.trailer_plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : null,
      vehicle_body_type: form.value.vehicle_body_type,
      temperature_controlled: form.value.temperature_controlled,
      temperature_target: form.value.temperature_target || null,
      driver_name: form.value.driver_name,
      driver_cpf: form.value.driver_cpf,
      driver_phone: form.value.driver_phone,
      helper_name: form.value.helper_name || null,
      helper_cpf: form.value.helper_cpf || null,
      scheduled_window_start: startIso,
      scheduled_window_end: endIso,
      dock_id: form.value.dock_id || null,
      notes: form.value.notes
    }

    const res = await fetch(`/api/v1/carrier-portal/${tenantSlug.value}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Não foi possível concluir o agendamento.')
    }

    const created = await res.json()
    bookingSuccess.value = created

    // Gera QR Code para exibição instantânea
    const qrString = created.qr_code_data || `DOCAOS:${created.access_token}:${created.vehicle_plate}`
    bookingQrCodeUrl.value = await QRCode.toDataURL(qrString, { width: 260, margin: 2 })

  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isBooking.value = false
  }
}

function copyDriverUrl() {
  if (!bookingSuccess.value?.driver_access_url) return
  navigator.clipboard.writeText(bookingSuccess.value.driver_access_url)
  copiedLink.value = true
  setTimeout(() => { copiedLink.value = false }, 3000)
}

onMounted(() => {
  fetchTenantInfo()
})
</script>

<template>
  <div class="min-h-screen bg-[#050b14] text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative font-sans">
    
    <!-- Ambient Glows -->
    <div class="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-[#086cfe]/15 via-blue-600/10 to-transparent rounded-full blur-[140px] pointer-events-none"></div>

    <!-- Header -->
    <header class="max-w-4xl w-full mx-auto flex items-center justify-between py-3 relative z-10 border-b border-slate-800/80">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 p-1 flex items-center justify-center shadow-lg">
          <img src="/docaos-icon.png" alt="DocaOS" class="w-full h-full object-contain" />
        </div>
        <div>
          <span class="text-base font-black text-white">Doca<span class="text-[#00A896]">OS</span></span>
          <span class="block text-[10px] font-mono text-slate-400">Portal do Transportador &bull; Agendamento Autônomo (docaos.log.br)</span>
        </div>
      </div>

      <div class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-mono">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>Janelas Abertas</span>
      </div>
    </header>

    <!-- Main Container -->
    <main class="my-auto max-w-3xl w-full mx-auto py-8 relative z-10">
      
      <!-- Estado de Carregamento -->
      <div v-if="isLoading" class="text-center py-16 space-y-3">
        <div class="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs font-mono text-slate-400">Carregando janelas e docas do armazém...</p>
      </div>

      <!-- Erro / Portal Bloqueado -->
      <div v-else-if="errorMessage && !tenantInfo" class="bg-slate-900 border border-rose-800/80 rounded-3xl p-8 text-center space-y-4 shadow-2xl max-w-lg mx-auto">
        <div class="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-700 flex items-center justify-center mx-auto text-rose-400">
          <AlertCircle class="w-8 h-8" />
        </div>
        <h2 class="text-lg font-bold text-white">Acesso Não Habilitado</h2>
        <p class="text-xs text-slate-300 leading-relaxed">{{ errorMessage }}</p>
        <button
          @click="router.push('/')"
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-xl cursor-pointer"
        >
          Voltar para o Início
        </button>
      </div>

      <!-- SUCESSO: COMPROVANTE & QR CODE -->
      <div v-else-if="bookingSuccess" class="bg-slate-900/90 border border-emerald-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div class="text-center space-y-2">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10 mb-2">
            <CheckCircle2 class="w-10 h-10" />
          </div>
          <span class="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">Reserva Confirmada com Sucesso</span>
          <h2 class="text-xl sm:text-2xl font-black text-white">Janela Garantida em {{ tenantInfo.name }}</h2>
          <p class="text-xs text-slate-400 max-w-md mx-auto">
            O motorista da carreta <strong class="text-white font-mono">{{ bookingSuccess.vehicle_plate }}</strong> já está autorizado a comparecer no horário agendado.
          </p>
        </div>

        <!-- QR Code Card -->
        <div class="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center max-w-sm mx-auto space-y-3">
          <p class="text-[11px] font-mono font-bold text-slate-300 uppercase">QR Code Oficial de Portaria</p>
          <div class="bg-white p-3 rounded-2xl inline-block shadow-lg border-2 border-sky-500/40">
            <img :src="bookingQrCodeUrl" alt="QR Code de Agendamento" class="w-44 h-44 mx-auto" />
          </div>
          <p class="text-[10px] text-slate-400">Apresente este código na guarita física para liberação imediata da cancela.</p>
        </div>

        <!-- Ações do Transportador -->
        <div class="space-y-3 max-w-md mx-auto">
          <a
            :href="bookingSuccess.driver_access_url"
            target="_blank"
            class="w-full bg-[#086cfe] hover:bg-blue-600 text-white font-mono text-xs font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <span>Abrir Cartão do Motorista no Celular</span>
            <ExternalLink class="w-4 h-4" />
          </a>

          <button
            @click="copyDriverUrl"
            class="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold py-3 px-4 rounded-xl border border-slate-700 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <Copy class="w-4 h-4 text-sky-400" />
            <span>{{ copiedLink ? 'Link Copiado para o WhatsApp!' : 'Copiar Link para Enviar ao Motorista' }}</span>
          </button>

          <button
            @click="bookingSuccess = null"
            class="w-full text-center text-xs font-mono text-slate-500 hover:text-slate-300 pt-2 cursor-pointer"
          >
            Agendar Outra Carreta
          </button>
        </div>
      </div>

      <!-- FORMULÁRIO DE AUTO-AGENDAMENTO -->
      <div v-else class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        
        <!-- Identificação do Armazém -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span class="text-[11px] font-mono font-bold text-sky-400 uppercase tracking-wider">Agendamento de Entrega / Coleta</span>
            <h1 class="text-xl sm:text-2xl font-black text-white">{{ tenantInfo.name }}</h1>
            <p v-if="tenantInfo.cnpj" class="text-xs font-mono text-slate-400">CNPJ: {{ tenantInfo.cnpj }}</p>
          </div>
          <div class="hidden sm:flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
            <Building2 class="w-4 h-4 text-sky-400" />
            <span>{{ tenantInfo.docks.length }} Docas Disponíveis</span>
          </div>
        </div>

        <div v-if="errorMessage" class="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-400" />
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleBooking" class="space-y-5">
          
          <!-- Seção 1: Transportadora & Carga -->
          <div>
            <h3 class="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Truck class="w-4 h-4 text-sky-400" />
              <span>1. Dados da Transportadora & Carga</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-mono text-slate-400 mb-1">Nome da Transportadora *</label>
                <input
                  v-model="form.carrier_name"
                  type="text"
                  required
                  placeholder="Ex: Rodonaves Transportes"
                  class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#086cfe]"
                />
              </div>
              <div>
                <label class="block text-[11px] font-mono text-slate-400 mb-1">Tipo de Carga</label>
                <select
                  v-model="form.cargo_type"
                  class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#086cfe]"
                >
                  <option value="Carga Geral">Carga Geral (Seca)</option>
                  <option value="Refrigerado">Carga Refrigerada / Congelada</option>
                  <option value="Granel">Granel Sólido / Líquido</option>
                  <option value="Químico">Produtos Químicos</option>
                  <option value="Container">Container Marítimo</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-mono text-slate-400 mb-1">Número da NF-e / CTE</label>
                <input
                  v-model="form.invoice_number"
                  type="text"
                  placeholder="Ex: NF-89210"
                  class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#086cfe]"
                />
              </div>
            </div>
          </div>

          <!-- Seção 2: Veículo & Motorista -->
          <div class="pt-2 border-t border-slate-800/80">
            <h3 class="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <User class="w-4 h-4 text-sky-400" />
              <span>2. Veículo & Motorista</span>
            </h3>
            <!-- Especificação do Veículo & Carroceria -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div>
                <label class="block text-[11px] font-mono text-slate-400 mb-1">Tipo de Carroceria *</label>
                <select
                  v-model="form.vehicle_body_type"
                  class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#086cfe] cursor-pointer"
                >
                  <option value="Baú Fechado">Baú Fechado</option>
                  <option value="Sider Lateral">Sider (Carga Lateral)</option>
                  <option value="Frigorífico / Reefer">Frigorífico (Refrigerado)</option>
                  <option value="Grade Baixa">Grade Baixa</option>
                  <option value="Prancha / Container">Prancha / Container</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-mono text-slate-400 mb-1">Refrigeração</label>
                <label class="flex items-center space-x-2 mt-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    v-model="form.temperature_controlled"
                    class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500"
                  />
                  <span>Termoking Ativo</span>
                </label>
              </div>
              <div v-if="form.temperature_controlled">
                <label class="block text-[11px] font-mono text-slate-400 mb-1">Temperatura Alvo</label>
                <input
                  v-model="form.temperature_target"
                  type="text"
                  placeholder="Ex: -18°C"
                  class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#086cfe]"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label class="block text-[11px] font-mono text-slate-400 mb-1">Placa do Cavalo *</label>
                <input
                  v-model="form.vehicle_plate"
                  type="text"
                  required
                  placeholder="Ex: BRA2E19"
                  class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-mono text-white uppercase focus:outline-none focus:border-[#086cfe]"
                />
              </div>
              <div>
                <label class="block text-[11px] font-mono text-slate-400 mb-1">Placa Carreta</label>
                <input
                  v-model="form.trailer_plate"
                  type="text"
                  placeholder="Ex: SPX9A88"
                  class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-mono text-white uppercase focus:outline-none focus:border-[#086cfe]"
                />
              </div>
              <div>
                <label class="block text-[11px] font-mono text-slate-400 mb-1">Nome do Motorista *</label>
                <input
                  v-model="form.driver_name"
                  type="text"
                  required
                  placeholder="Ex: Marcos Silva"
                  class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#086cfe]"
                />
              </div>
              <div>
                <label class="block text-[11px] font-mono text-slate-400 mb-1">Celular / WhatsApp *</label>
                <input
                  v-model="form.driver_phone"
                  type="text"
                  required
                  placeholder="(11) 98765-4321"
                  class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#086cfe]"
                />
              </div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label class="block text-[11px] font-mono text-slate-400 mb-1">CPF do Motorista *</label>
                <input
                  v-model="form.driver_cpf"
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#086cfe]"
                />
              </div>

              <!-- Ajudante de Descarga (Chapa) -->
              <div class="bg-indigo-950/20 border border-indigo-900/50 p-2.5 rounded-xl">
                <span class="text-[10px] font-mono uppercase font-bold text-indigo-300 block mb-1">Ajudante de Carga / Chapa (Crachá Digital)</span>
                <div class="grid grid-cols-2 gap-2">
                  <input
                    v-model="form.helper_name"
                    type="text"
                    placeholder="Nome do ajudante"
                    class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    v-model="form.helper_cpf"
                    type="text"
                    placeholder="CPF ajudante"
                    class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Seção 3: Data, Horário & Doca -->
          <div class="pt-2 border-t border-slate-800/80">
            <h3 class="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Clock class="w-4 h-4 text-sky-400" />
              <span>3. Janela de Horário Desejada</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-mono text-slate-400 mb-1">Data da Chegada *</label>
                <input
                  v-model="form.scheduled_date"
                  type="date"
                  required
                  class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#086cfe]"
                />
              </div>
              <div>
                <label class="block text-[11px] font-mono text-slate-400 mb-1">Horário Previsto *</label>
                <input
                  v-model="form.scheduled_time"
                  type="time"
                  required
                  class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#086cfe]"
                />
              </div>
              <div>
                <label class="block text-[11px] font-mono text-slate-400 mb-1">Doca Preferencial</label>
                <select
                  v-model="form.dock_id"
                  class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#086cfe]"
                >
                  <option value="">Qualquer doca disponível</option>
                  <option v-for="d in tenantInfo.docks" :key="d.id" :value="d.id">
                    {{ d.name }} ({{ d.dock_type }})
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Botão Submissão -->
          <button
            type="submit"
            :disabled="isBooking"
            class="w-full bg-[#086cfe] hover:bg-blue-600 disabled:opacity-50 text-white font-mono text-xs font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-[0.98]"
          >
            <span v-if="isBooking" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span v-else>Confirmar Janela & Gerar QR Code</span>
            <ArrowRight v-if="!isBooking" class="w-4 h-4" />
          </button>
        </form>

      </div>

    </main>

    <!-- Footer -->
    <footer class="max-w-4xl w-full mx-auto text-center py-4 text-[11px] font-mono text-slate-500 border-t border-slate-800/60 relative z-10">
      DocaOS &bull; Patio & Dock Operating System (docaos.log.br)
    </footer>

  </div>
</template>
