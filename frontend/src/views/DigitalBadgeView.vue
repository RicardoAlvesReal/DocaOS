<script setup>
import { ref, computed, onMounted } from 'vue'
import { useYardStore } from '../stores/yard'
import QRCode from 'qrcode'
import { 
  IdCard, 
  PlusCircle, 
  Search, 
  Filter, 
  Printer, 
  Share2, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  QrCode as QrIcon, 
  X, 
  Copy, 
  ExternalLink, 
  Truck, 
  Users, 
  Building2, 
  Phone, 
  FileText, 
  Lock, 
  Unlock,
  Sparkles,
  MapPin,
  Eye
} from 'lucide-vue-next'

const yardStore = useYardStore()

const searchQuery = ref('')
const selectedCategory = ref('TODOS')
const isLoading = ref(false)

// Modais
const isCreateModalOpen = ref(false)
const selectedBadgeForPrint = ref(null)
const printQrDataUrl = ref('')
const isCopied = ref(false)

// Formulário de Novo Crachá
const newBadgeForm = ref({
  full_name: '',
  document_number: '',
  phone: '',
  category: 'Ajudante_Chapa',
  company_name: '',
  vehicle_plate: '',
  authorized_zones: 'Pátio & Docas',
  valid_days: 90,
  notes: ''
})
const createError = ref('')
const isSubmitting = ref(false)

const categories = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'Motorista', label: 'Motoristas' },
  { id: 'Ajudante_Chapa', label: 'Ajudantes / Chapas' },
  { id: 'Prestador_Servico', label: 'Prestadores / Terceiros' },
  { id: 'Fiscal_Patio', label: 'Fiscais de Pátio' }
]

// Estatísticas
const totalBadges = computed(() => yardStore.badges?.length || 0)
const inYardCount = computed(() => yardStore.badges?.filter(b => b.status === 'Em_Patio').length || 0)
const blockedCount = computed(() => yardStore.badges?.filter(b => b.status === 'Bloqueado').length || 0)

// Filtro em tempo real
const filteredBadges = computed(() => {
  let list = yardStore.badges || []
  if (selectedCategory.value !== 'TODOS') {
    list = list.filter(b => b.category === selectedCategory.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(b => 
      (b.full_name || '').toLowerCase().includes(q) ||
      (b.document_number || '').includes(q) ||
      (b.company_name || '').toLowerCase().includes(q) ||
      (b.vehicle_plate || '').toLowerCase().includes(q) ||
      (b.badge_code || '').toLowerCase().includes(q)
    )
  }
  return list
})

function formatDoc(doc) {
  if (!doc) return ''
  const clean = doc.replace(/\D/g, '')
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return doc
}

function getCategoryColor(category) {
  switch (category) {
    case 'Motorista':
      return 'bg-sky-950/80 text-[#00A896] dark:text-[#00E5C8] border-sky-800'
    case 'Ajudante_Chapa':
      return 'bg-amber-950/80 text-amber-400 border-amber-800'
    case 'Prestador_Servico':
      return 'bg-purple-950/80 text-purple-300 border-purple-800'
    case 'Fiscal_Patio':
      return 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700'
  }
}

function getCategoryLabel(category) {
  switch (category) {
    case 'Motorista': return 'Motorista Titular'
    case 'Ajudante_Chapa': return 'Ajudante de Carga (Chapa)'
    case 'Prestador_Servico': return 'Prestador / Terceirizado'
    case 'Fiscal_Patio': return 'Fiscal / Conferente'
    default: return category?.replace('_', ' ') || 'Credencial'
  }
}

async function openPrintModal(badge) {
  selectedBadgeForPrint.value = badge
  const qrString = `DOCAOS:BADGE:${badge.badge_code}:${badge.document_number}`
  try {
    printQrDataUrl.value = await QRCode.toDataURL(qrString, {
      width: 260,
      margin: 2,
      color: { dark: '#001c3d', light: '#ffffff' }
    })
  } catch (err) {
    console.error(err)
  }
}

function shareViaWhatsApp(badge) {
  const phone = badge.phone?.replace(/\D/g, '') || ''
  const tenantName = yardStore.currentTenant?.name || 'Terminal DocaOS'
  const text = encodeURIComponent(
    `*CRACHÁ DIGITAL DE ACESSO - ${tenantName}*\n\n` +
    `Olá, *${badge.full_name}*!\n` +
    `Sua credencial de acesso foi emitida com sucesso.\n\n` +
    `*Código:* ${badge.badge_code}\n` +
    `*Função:* ${getCategoryLabel(badge.category)}\n` +
    `*Empresa:* ${badge.company_name}\n` +
    `*Zonas Autorizadas:* ${badge.authorized_zones}\n` +
    `*Status:* ${badge.status}\n\n` +
    `Apresente este código ou o QR Code ao operador da portaria física para liberar a cancela.`
  )
  const url = phone ? `https://wa.me/55${phone}?text=${text}` : `https://wa.me/?text=${text}`
  window.open(url, '_blank')
}

function printBadge() {
  window.print()
}

function copyBadgeCode(code) {
  navigator.clipboard.writeText(code)
  isCopied.value = true
  setTimeout(() => { isCopied.value = false }, 2500)
}

function openCreateModal() {
  newBadgeForm.value = {
    full_name: '',
    document_number: '',
    phone: '',
    category: 'Ajudante_Chapa',
    company_name: yardStore.currentTenant?.name || 'Transportadora Parceira',
    vehicle_plate: '',
    authorized_zones: 'Pátio Geral & Docas',
    valid_days: 90,
    notes: ''
  }
  createError.value = ''
  isCreateModalOpen.value = true
}

async function handleCreateBadge() {
  createError.value = ''
  isSubmitting.value = true
  try {
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + Number(newBadgeForm.value.valid_days || 90))

    await yardStore.createBadge({
      full_name: newBadgeForm.value.full_name,
      document_number: newBadgeForm.value.document_number,
      phone: newBadgeForm.value.phone,
      category: newBadgeForm.value.category,
      company_name: newBadgeForm.value.company_name,
      vehicle_plate: newBadgeForm.value.vehicle_plate ? newBadgeForm.value.vehicle_plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : null,
      authorized_zones: newBadgeForm.value.authorized_zones,
      valid_until: validUntil.toISOString(),
      notes: newBadgeForm.value.notes
    })

    isCreateModalOpen.value = false
  } catch (err) {
    createError.value = err.message
  } finally {
    isSubmitting.value = false
  }
}

async function toggleBadgeLock(badge) {
  const nextStatus = badge.status === 'Bloqueado' ? 'Ativo' : 'Bloqueado'
  await yardStore.updateBadgeStatus(badge.id, nextStatus)
}

onMounted(async () => {
  isLoading.value = true
  await yardStore.fetchBadges()
  isLoading.value = false
})
</script>

<template>
  <div class="space-y-6">
    
    <!-- Top Header Banner -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#031d3d] border border-slate-200 dark:border-teal-500/20 p-6 rounded-2xl shadow-xl">
      <div class="space-y-1">
        <div class="inline-flex items-center space-x-2 bg-sky-950/80 border border-sky-800 px-3.5 py-1 rounded-full text-xs font-mono font-semibold text-[#00A896] dark:text-[#00E5C8]">
          <IdCard class="w-3.5 h-3.5" />
          <span>Credenciamento de Pessoas & Terceiros</span>
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight">Crachá Digital & Controle de Pedestres</h1>
        <p class="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Emissão instantânea de credenciais em QR Code para <strong>Ajudantes de Carga (Chapas)</strong>, 
          <strong>Motoristas</strong>, <strong>Fiscais</strong> e <strong>Prestadores de Serviços Terceirizados</strong>. Envio via WhatsApp e impressão pronta para crachá de bolso.
        </p>
      </div>

      <!-- Action Button & Stats -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center space-x-2 bg-slate-950/90 border border-slate-200 dark:border-teal-500/20 px-3.5 py-2 rounded-xl text-xs font-mono">
          <span class="text-slate-400">No Pátio Agora:</span>
          <span class="font-bold text-emerald-400 flex items-center space-x-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{{ inYardCount }} pessoas</span>
          </span>
        </div>

        <button
          @click="openCreateModal"
          class="flex items-center space-x-2 bg-gradient-to-r from-[#00A896] to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-mono text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer active:scale-95"
        >
          <PlusCircle class="w-4 h-4" />
          <span>+ Emitir Novo Crachá</span>
        </button>
      </div>
    </div>

    <!-- Filters & Search Bar -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100 dark:bg-[#001833] border border-slate-200 dark:border-teal-500/20/80 p-3.5 rounded-xl">
      <!-- Category Pills -->
      <div class="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectedCategory = cat.id"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          :class="selectedCategory === cat.id ? 'bg-[#086cfe] text-white shadow-md' : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Search Box -->
      <div class="relative w-full sm:w-72">
        <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nome, CPF, empresa..."
          class="w-full bg-slate-950 border border-slate-200 dark:border-teal-500/20 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00A896] font-sans"
        />
      </div>
    </div>

    <!-- Badges Grid (Cards de Crachá Profissional) -->
    <div v-if="filteredBadges.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      <div
        v-for="badge in filteredBadges"
        :key="badge.id"
        class="bg-white dark:bg-[#031d3d] border rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between relative overflow-hidden group"
        :class="badge.status === 'Bloqueado' ? 'border-rose-900/60 bg-rose-950/10' : 'border-slate-200 dark:border-teal-500/20'"
      >
        <!-- Top Visual Badge Lanyard Hole -->
        <div class="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-slate-800 rounded-full border border-slate-700"></div>

        <div>
          <!-- Header Card Info -->
          <div class="flex items-start justify-between mt-2 mb-3">
            <span 
              class="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
              :class="getCategoryColor(badge.category)"
            >
              {{ getCategoryLabel(badge.category) }}
            </span>

            <span 
              class="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full flex items-center space-x-1 border"
              :class="[
                badge.status === 'Ativo' 
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                  : badge.status === 'Em_Patio'
                  ? 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse'
                  : 'bg-rose-950 text-rose-400 border-rose-800'
              ]"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="badge.status === 'Bloqueado' ? 'bg-rose-400' : 'bg-emerald-400'"></span>
              <span>{{ badge.status === 'Em_Patio' ? 'NO PÁTIO' : badge.status.toUpperCase() }}</span>
            </span>
          </div>

          <!-- User Identity Section -->
          <div class="flex items-center space-x-3 mb-4">
            <!-- Avatar estilizado -->
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500/20 via-slate-800 to-indigo-500/20 border border-sky-400/30 flex items-center justify-center font-bold text-[#00A896] dark:text-[#00E5C8] text-sm shadow-inner shrink-0">
              {{ badge.full_name?.substring(0, 2).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-bold text-white truncate" :title="badge.full_name">
                {{ badge.full_name }}
              </h3>
              <p class="text-xs font-mono text-slate-400 mt-0.5">
                CPF: {{ formatDoc(badge.document_number) }}
              </p>
            </div>
          </div>

          <!-- Metadados do Crachá -->
          <div class="bg-slate-950/80 border border-slate-200 dark:border-teal-500/20/80 rounded-xl p-3 space-y-1.5 text-xs text-slate-300 font-sans mb-4">
            <div class="flex items-center justify-between">
              <span class="text-slate-500 text-[11px]">Empresa:</span>
              <span class="font-semibold text-white truncate max-w-[170px]" :title="badge.company_name">{{ badge.company_name }}</span>
            </div>

            <div v-if="badge.vehicle_plate" class="flex items-center justify-between">
              <span class="text-slate-500 text-[11px]">Placa Vinculada:</span>
              <span class="font-mono font-bold text-[#00A896] dark:text-[#00E5C8]">{{ badge.vehicle_plate }}</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-slate-500 text-[11px]">Zonas Autorizadas:</span>
              <span class="text-[11px] font-medium text-slate-300 truncate max-w-[170px]" :title="badge.authorized_zones">{{ badge.authorized_zones }}</span>
            </div>

            <div class="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] font-mono text-slate-400">
              <span>Código: <strong class="text-slate-200">{{ badge.badge_code }}</strong></span>
              <button 
                @click="copyBadgeCode(badge.badge_code)" 
                class="hover:text-[#00A896] dark:text-[#00E5C8] cursor-pointer"
                title="Copiar código"
              >
                <Copy class="w-3 h-3 inline" />
              </button>
            </div>
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div class="pt-3 border-t border-slate-200 dark:border-teal-500/20 flex items-center justify-between gap-2">
          <!-- Botão WhatsApp -->
          <button
            @click="shareViaWhatsApp(badge)"
            class="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            title="Enviar credencial e instruções para o WhatsApp do colaborador"
          >
            <Phone class="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </button>

          <!-- Botão Imprimir / Ver Crachá -->
          <button
            @click="openPrintModal(badge)"
            class="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Ver e Imprimir Crachá em Formato PVC / Papel"
          >
            <Printer class="w-4 h-4" />
          </button>

          <!-- Botão Bloquear / Desbloquear -->
          <button
            @click="toggleBadgeLock(badge)"
            class="p-2 rounded-lg transition-colors cursor-pointer"
            :class="badge.status === 'Bloqueado' ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900' : 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40'"
            :title="badge.status === 'Bloqueado' ? 'Desbloquear Credencial' : 'Bloquear Acesso Imediatamente'"
          >
            <Lock v-if="badge.status !== 'Bloqueado'" class="w-4 h-4" />
            <Unlock v-else class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white dark:bg-[#031d3d] border border-slate-200 dark:border-teal-500/20 rounded-2xl p-12 text-center space-y-3">
      <div class="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-200 dark:border-teal-500/20 flex items-center justify-center mx-auto text-slate-500">
        <IdCard class="w-7 h-7" />
      </div>
      <h3 class="text-base font-bold text-white">Nenhum crachá localizado</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        Não foram encontrados crachás cadastrados para os filtros selecionados. Clique abaixo para emitir a primeira credencial.
      </p>
      <button
        @click="openCreateModal"
        class="bg-gradient-to-r from-[#00A896] to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-mono text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
      >
        + Emitir Primeiro Crachá
      </button>
    </div>

    <!-- =================================================================== -->
    <!-- MODAL 1: EMISSÃO DE NOVO CRACHÁ DIGITAL                             -->
    <!-- =================================================================== -->
    <transition name="modal">
      <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div class="modal-panel bg-white dark:bg-[#031d3d] border border-slate-200 dark:border-teal-500/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-teal-500/20">
            <div>
              <h3 class="text-base font-bold text-white">Emitir Crachá Digital & Credencial</h3>
              <p class="text-xs text-slate-400">Credenciamento de pedestres, ajudantes e prestadores de serviços</p>
            </div>
            <button @click="isCreateModalOpen = false" class="text-slate-400 hover:text-white cursor-pointer">
              <X class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="handleCreateBadge" class="space-y-4">
            <div v-if="createError" class="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
              {{ createError }}
            </div>

            <!-- Categoria -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Categoria de Acesso *</label>
              <select
                v-model="newBadgeForm.category"
                class="w-full bg-slate-50 dark:bg-[#00142c] border border-slate-200 dark:border-teal-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00A896] cursor-pointer"
              >
                <option value="Ajudante_Chapa">Ajudante de Carga / Descarga (Chapa)</option>
                <option value="Motorista">Motorista Titular</option>
                <option value="Prestador_Servico">Prestador de Serviço / Manutenção Terceirizada</option>
                <option value="Fiscal_Patio">Fiscal de Pátio / Conferente</option>
                <option value="Visitante">Visitante / Auditoria Externa</option>
              </select>
            </div>

            <!-- Nome Completo & Documento -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  v-model="newBadgeForm.full_name"
                  type="text"
                  required
                  placeholder="Ex: Wellington Gomes Pereira"
                  class="w-full bg-slate-50 dark:bg-[#00142c] border border-slate-200 dark:border-teal-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00A896]"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">CPF / Documento *</label>
                <input
                  v-model="newBadgeForm.document_number"
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  class="w-full bg-slate-50 dark:bg-[#00142c] border border-slate-200 dark:border-teal-500/20 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00A896]"
                />
              </div>
            </div>

            <!-- Telefone WhatsApp & Empresa -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">WhatsApp (com DDD)</label>
                <input
                  v-model="newBadgeForm.phone"
                  type="tel"
                  placeholder="(11) 98888-7777"
                  class="w-full bg-slate-50 dark:bg-[#00142c] border border-slate-200 dark:border-teal-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00A896]"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Empresa / Transportadora *</label>
                <input
                  v-model="newBadgeForm.company_name"
                  type="text"
                  required
                  placeholder="Ex: Cooperativa de Chapas ou Jamef"
                  class="w-full bg-slate-50 dark:bg-[#00142c] border border-slate-200 dark:border-teal-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00A896]"
                />
              </div>
            </div>

            <!-- Placa Vinculada & Zonas Autorizadas -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Placa do Veículo (Opcional)</label>
                <input
                  v-model="newBadgeForm.vehicle_plate"
                  type="text"
                  placeholder="Ex: BRA2E19 (se houver)"
                  class="w-full bg-slate-50 dark:bg-[#00142c] border border-slate-200 dark:border-teal-500/20 rounded-lg px-3 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-[#00A896]"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Zonas de Acesso Autorizadas</label>
                <input
                  v-model="newBadgeForm.authorized_zones"
                  type="text"
                  placeholder="Ex: Doca 01 e Pátio Externo"
                  class="w-full bg-slate-50 dark:bg-[#00142c] border border-slate-200 dark:border-teal-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00A896]"
                />
              </div>
            </div>

            <!-- Validade em Dias -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Validade do Crachá</label>
              <select
                v-model="newBadgeForm.valid_days"
                class="w-full bg-slate-50 dark:bg-[#00142c] border border-slate-200 dark:border-teal-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00A896] cursor-pointer"
              >
                <option :value="1">1 dia (Acesso Avulso / Diária)</option>
                <option :value="7">7 dias (Operação Semanal)</option>
                <option :value="30">30 dias (Mensal)</option>
                <option :value="90">90 dias (Trimestral)</option>
                <option :value="365">1 ano (Colaborador Fixo / Frotista)</option>
              </select>
            </div>

            <!-- Botões de Ação -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-teal-500/20">
              <button
                type="button"
                @click="isCreateModalOpen = false"
                class="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="bg-gradient-to-r from-[#00A896] to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-mono text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                {{ isSubmitting ? 'Gerando Credencial...' : 'Emitir Crachá Digital' }}
              </button>
            </div>
          </form>

        </div>
      </div>
    </transition>

    <!-- =================================================================== -->
    <!-- MODAL 2: VISUALIZAÇÃO E IMPRESSÃO DE CRACHÁ (FORMATO PVC / BOLSO)   -->
    <!-- =================================================================== -->
    <transition name="modal">
      <div v-if="selectedBadgeForPrint" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-200 dark:border-teal-500/20 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 relative">
          
          <button 
            @click="selectedBadgeForPrint = null"
            class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>

          <!-- O Crachá Físico Estilizado (Visual de Carteira) -->
          <div id="printable-badge" class="bg-gradient-to-b from-[#0a152d] to-[#040813] border-2 border-sky-500/40 rounded-2xl p-5 shadow-2xl text-left space-y-3 relative overflow-hidden">
            <!-- Chip RFID Decorativo -->
            <div class="flex items-center justify-between pb-2 border-b border-sky-900/60">
              <div class="flex items-center space-x-2">
                <div class="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-400/40 p-0.5 flex items-center justify-center">
                  <img src="/docaos-icon.png" alt="DocaOS" class="w-full h-full object-contain" />
                </div>
                <div>
                  <span class="text-xs font-black text-white">Doca<span class="text-[#00A896]">OS</span></span>
                  <span class="block text-[8px] font-mono text-slate-400">CREDENCIAL DocaOS &bull; docaos.log.br</span>
                </div>
              </div>

              <div class="w-7 h-5 rounded bg-amber-500/20 border border-amber-400/50 flex items-center justify-center">
                <span class="text-[7px] font-mono text-amber-300 font-bold">RFID</span>
              </div>
            </div>

            <!-- Dados Centrais -->
            <div class="flex items-center space-x-3 pt-1">
              <div class="w-14 h-14 rounded-xl bg-slate-800 border-2 border-sky-400/40 flex items-center justify-center text-lg font-bold text-[#00A896] dark:text-[#00E5C8] shadow-md shrink-0">
                {{ selectedBadgeForPrint.full_name?.substring(0, 2).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <h4 class="text-sm font-bold text-white leading-tight truncate">
                  {{ selectedBadgeForPrint.full_name }}
                </h4>
                <p class="text-[10px] font-mono text-slate-400 mt-0.5">
                  CPF: {{ formatDoc(selectedBadgeForPrint.document_number) }}
                </p>
                <span class="inline-block mt-1 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-sky-950 text-teal-700 dark:text-teal-300 border border-sky-800">
                  {{ getCategoryLabel(selectedBadgeForPrint.category) }}
                </span>
              </div>
            </div>

            <!-- QR Code do Crachá -->
            <div class="bg-white p-3 rounded-xl shadow-lg border-2 border-sky-500/30 text-center mx-auto my-2">
              <img :src="printQrDataUrl" alt="QR Code Crachá" class="w-36 h-36 mx-auto" />
              <p class="text-[9px] font-mono font-bold text-slate-900 mt-1">
                {{ selectedBadgeForPrint.badge_code }}
              </p>
            </div>

            <div class="text-[9px] font-mono text-slate-400 space-y-0.5 pt-1 border-t border-slate-900">
              <p><strong>Empresa:</strong> {{ selectedBadgeForPrint.company_name }}</p>
              <p><strong>Áreas Liberadas:</strong> {{ selectedBadgeForPrint.authorized_zones }}</p>
            </div>
          </div>

          <!-- Ações do Modal -->
          <div class="flex items-center gap-2 pt-2">
            <button
              @click="printBadge"
              class="flex-1 bg-gradient-to-r from-[#00A896] to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-mono text-xs font-bold py-2.5 px-3 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Printer class="w-4 h-4" />
              <span>Imprimir Crachá</span>
            </button>

            <button
              @click="shareViaWhatsApp(selectedBadgeForPrint)"
              class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold py-2.5 px-3 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Phone class="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  #printable-badge, #printable-badge * {
    visibility: visible;
  }
  #printable-badge {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 320px !important;
    background: white !important;
    color: black !important;
    border: 2px solid #000 !important;
  }
}
</style>
