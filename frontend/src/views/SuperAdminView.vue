<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useYardStore } from '../stores/yard'
import { useAuthStore } from '../stores/auth'
import { 
  ShieldAlert, 
  Building2, 
  PlusCircle, 
  DoorClosed, 
  Clock, 
  DollarSign, 
  CheckCircle2,
  X,
  Sparkles,
  MessageSquare,
  Truck,
  ExternalLink,
  Sliders,
  Settings,
  Copy,
  Zap,
  Check,
  Users,
  KeyRound,
  Trash2,
  Edit,
  Mail,
  Receipt,
  CreditCard,
  Calendar,
  AlertTriangle,
  UserPlus,
  Search,
  Filter,
  MapPin,
  Radio
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const yardStore = useYardStore()
const authStore = useAuthStore()

// Abas do Painel Master
const activeTab = ref(route.query.tab || 'tenants') // 'tenants' | 'users' | 'modules'

// Sincronização da aba ativa com a URL (?tab=...)
watch(() => route.query.tab, (newTab) => {
  if (newTab && ['tenants', 'users', 'modules'].includes(newTab)) {
    activeTab.value = newTab
  }
}, { immediate: true })

function switchTab(tab) {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
}

// Lista de Usuários de Todos os Clientes
const allUsers = ref([])
const isLoadingUsers = ref(false)
const userSearch = ref('')
const selectedTenantFilter = ref('')

// Modais
const isNewTenantModalOpen = ref(false)
const isEditTenantModalOpen = ref(false)
const isNewUserModalOpen = ref(false)
const isResetPasswordModalOpen = ref(false)
const isDeleteUserModalOpen = ref(false)

// Estado para edição de Tenant / Contrato Financeiro
const editingTenant = ref(null)
const editTenantForm = ref({
  id: '',
  name: '',
  slug: '',
  cnpj: '',
  plan_tier: 'Professional',
  monthly_fee: 1800.0,
  billing_due_day: 10,
  billing_status: 'active',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  max_docks: 8,
  grace_period_minutes: 30,
  detention_fee_per_hour: 150.0,
  has_whatsapp_automation: false,
  has_carrier_portal: false,
  whatsapp_api_url: '',
  whatsapp_api_token: '',
  latitude: null,
  longitude: null,
  geofence_radius_meters: 1000,
  require_geofence: false,
  has_telemetry_integration: false,
  telemetry_provider: 'Generic_Webhook',
  telemetry_api_key: '',
  telemetry_client_id: '',
  telemetry_endpoint: ''
})

// Formulário de Novo Armazém
const newTenantForm = ref({
  name: '',
  slug: '',
  cnpj: '',
  plan_tier: 'Professional',
  monthly_fee: 2500.0,
  billing_due_day: 10,
  billing_status: 'active',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  max_docks: 8,
  grace_period_minutes: 30,
  detention_fee_per_hour: 150.0,
  has_whatsapp_automation: true,
  has_carrier_portal: true,
  latitude: null,
  longitude: null,
  geofence_radius_meters: 1000,
  require_geofence: false,
  has_telemetry_integration: false,
  telemetry_provider: 'Generic_Webhook',
  telemetry_api_key: '',
  telemetry_client_id: '',
  telemetry_endpoint: ''
})

// Formulário de Novo Usuário para Cliente
const newUserForm = ref({
  tenant_id: '',
  name: '',
  email: '',
  password: '',
  role: 'tenant_manager'
})

// Estado de Reset de Senha
const selectedUserForPassword = ref(null)
const newPasswordInput = ref('')

// Estado de Exclusão de Usuário
const selectedUserForDelete = ref(null)

const isSubmitting = ref(false)
const modalError = ref('')
const copiedSlug = ref('')

// =========================================================================
// KPIs FINANCEIROS DO SUPER ADMIN
// =========================================================================
const totalMrr = computed(() => {
  return yardStore.tenants.reduce((sum, t) => {
    const fee = typeof t.monthly_fee === 'number' ? t.monthly_fee : parseFloat(t.monthly_fee || 0)
    return sum + (t.billing_status !== 'cancelled' ? fee : 0)
  }, 0)
})

const activeTenantsCount = computed(() => {
  return yardStore.tenants.filter(t => t.billing_status === 'active' || !t.billing_status).length
})

const totalDocksLicensed = computed(() => {
  return yardStore.tenants.reduce((sum, t) => sum + (t.max_docks || 0), 0)
})

// =========================================================================
// CARREGAMENTO DE DADOS
// =========================================================================
async function fetchAllUsers() {
  isLoadingUsers.value = true
  try {
    const res = await fetch('/api/v1/auth/users', {
      headers: authStore.getAuthHeader()
    })
    if (res.ok) {
      allUsers.value = await res.json()
    }
  } catch (err) {
    console.error('Erro ao buscar usuários:', err)
  } finally {
    isLoadingUsers.value = false
  }
}

const filteredUsers = computed(() => {
  let list = allUsers.value || []
  if (selectedTenantFilter.value) {
    list = list.filter(u => u.tenant_id === selectedTenantFilter.value)
  }
  if (userSearch.value && userSearch.value.trim()) {
    const q = userSearch.value.toLowerCase().trim()
    list = list.filter(u => 
      (u.name || '').toLowerCase().includes(q) || 
      (u.email || '').toLowerCase().includes(q) ||
      (u.tenant_name || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    )
  }
  return list
})

function onSearchInput() {
  if (userSearch.value.trim().length > 0 && activeTab.value !== 'users') {
    switchTab('users')
  }
}

function onTenantFilterChange() {
  if (selectedTenantFilter.value && activeTab.value !== 'users') {
    switchTab('users')
  }
}

function clearUserSearch() {
  userSearch.value = ''
}

function filterUsersByTenant(tenantId) {
  selectedTenantFilter.value = tenantId
  userSearch.value = ''
  switchTab('users')
}

// =========================================================================
// AÇÕES DE TENANTS / CONTRATO FINANCEIRO
// =========================================================================
async function createTenant() {
  modalError.value = ''
  isSubmitting.value = true
  try {
    const res = await fetch('/api/v1/tenants/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...authStore.getAuthHeader()
      },
      body: JSON.stringify(newTenantForm.value)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Falha ao cadastrar cliente.')
    }

    await yardStore.fetchTenants()
    isNewTenantModalOpen.value = false
    yardStore.showNotification(`Armazém ${newTenantForm.value.name} cadastrado com mensalidade de ${formatCurrency(newTenantForm.value.monthly_fee)}!`, 'success')
  } catch (err) {
    modalError.value = err.message
  } finally {
    isSubmitting.value = false
  }
}

function openEditTenantModal(tenant) {
  editingTenant.value = tenant
  editTenantForm.value = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    cnpj: tenant.cnpj || '',
    plan_tier: tenant.plan_tier || 'Professional',
    monthly_fee: tenant.monthly_fee !== undefined ? tenant.monthly_fee : 1800.0,
    billing_due_day: tenant.billing_due_day || 10,
    billing_status: tenant.billing_status || 'active',
    contact_name: tenant.contact_name || '',
    contact_email: tenant.contact_email || '',
    contact_phone: tenant.contact_phone || '',
    max_docks: tenant.max_docks || 8,
    grace_period_minutes: tenant.grace_period_minutes || 30,
    detention_fee_per_hour: tenant.detention_fee_per_hour || 150.0,
    has_whatsapp_automation: Boolean(tenant.has_whatsapp_automation),
    has_carrier_portal: Boolean(tenant.has_carrier_portal),
    whatsapp_api_url: tenant.whatsapp_api_url || '',
    whatsapp_api_token: tenant.whatsapp_api_token || '',
    latitude: tenant.latitude ?? null,
    longitude: tenant.longitude ?? null,
    geofence_radius_meters: tenant.geofence_radius_meters || 1000,
    require_geofence: Boolean(tenant.require_geofence),
    has_telemetry_integration: Boolean(tenant.has_telemetry_integration),
    telemetry_provider: tenant.telemetry_provider || 'Generic_Webhook',
    telemetry_api_key: tenant.telemetry_api_key || '',
    telemetry_client_id: tenant.telemetry_client_id || '',
    telemetry_endpoint: tenant.telemetry_endpoint || ''
  }
  isEditTenantModalOpen.value = true
}

async function saveTenantContract() {
  modalError.value = ''
  isSubmitting.value = true
  try {
    const res = await fetch(`/api/v1/tenants/${editTenantForm.value.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authStore.getAuthHeader()
      },
      body: JSON.stringify(editTenantForm.value)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Falha ao atualizar parâmetros contratuais.')
    }

    const updated = await res.json()
    const idx = yardStore.tenants.findIndex(t => t.id === updated.id)
    if (idx !== -1) {
      yardStore.tenants[idx] = updated
    }
    if (yardStore.currentTenant?.id === updated.id) {
      yardStore.currentTenant = updated
    }

    isEditTenantModalOpen.value = false
    yardStore.showNotification(`Contrato de ${updated.name} atualizado: ${formatCurrency(updated.monthly_fee)}/mês!`, 'success')
  } catch (err) {
    modalError.value = err.message
  } finally {
    isSubmitting.value = false
  }
}

// =========================================================================
// AÇÕES DE USUÁRIOS DOS CLIENTES (CRIAR, RESETAR SENHA, EXCLUIR)
// =========================================================================
function openNewTenantModal() {
  modalError.value = ''
  newTenantForm.value = {
    name: '',
    slug: '',
    cnpj: '',
    plan_tier: 'Professional',
    monthly_fee: 2500.0,
    billing_due_day: 10,
    billing_status: 'active',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    max_docks: 8,
    grace_period_minutes: 30,
    detention_fee_per_hour: 150.0,
    has_whatsapp_automation: true,
    has_carrier_portal: true
  }
  isNewTenantModalOpen.value = true
}

function openNewUserModal(preselectedTenantId = '') {
  modalError.value = ''
  newUserForm.value = {
    tenant_id: preselectedTenantId || (yardStore.tenants[0]?.id || ''),
    name: '',
    email: '',
    password: '',
    role: 'tenant_manager'
  }
  isNewUserModalOpen.value = true
}

// Observa disparos de ações na URL
watch(() => route.query.action, (act) => {
  if (act === 'new-tenant') {
    openNewTenantModal()
    router.replace({ query: { ...route.query, action: undefined } })
  } else if (act === 'new-user') {
    openNewUserModal()
    router.replace({ query: { ...route.query, action: undefined } })
  }
}, { immediate: true })

defineExpose({
  openNewTenantModal,
  openNewUserModal
})

async function createUser() {
  modalError.value = ''
  isSubmitting.value = true
  try {
    const res = await fetch('/api/v1/auth/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authStore.getAuthHeader()
      },
      body: JSON.stringify(newUserForm.value)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Falha ao criar usuário.')
    }

    await fetchAllUsers()
    isNewUserModalOpen.value = false
    yardStore.showNotification(`Usuário ${newUserForm.value.name} criado com sucesso!`, 'success')
  } catch (err) {
    modalError.value = err.message
  } finally {
    isSubmitting.value = false
  }
}

function openResetPasswordModal(user) {
  modalError.value = ''
  selectedUserForPassword.value = user
  newPasswordInput.value = ''
  isResetPasswordModalOpen.value = true
}

async function handleResetPassword() {
  if (!newPasswordInput.value || newPasswordInput.value.length < 6) {
    modalError.value = 'A senha deve conter no mínimo 6 caracteres.'
    return
  }
  isSubmitting.value = true
  modalError.value = ''
  try {
    const res = await fetch(`/api/v1/auth/users/${selectedUserForPassword.value.id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authStore.getAuthHeader()
      },
      body: JSON.stringify({ new_password: newPasswordInput.value })
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Falha ao resetar senha.')
    }

    isResetPasswordModalOpen.value = false
    yardStore.showNotification(`Senha do usuário ${selectedUserForPassword.value.email} redefinida com sucesso!`, 'success')
  } catch (err) {
    modalError.value = err.message
  } finally {
    isSubmitting.value = false
  }
}

function openDeleteUserModal(user) {
  selectedUserForDelete.value = user
  isDeleteUserModalOpen.value = true
}

async function handleDeleteUser() {
  isSubmitting.value = true
  try {
    const res = await fetch(`/api/v1/auth/users/${selectedUserForDelete.value.id}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeader()
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Falha ao excluir usuário.')
    }

    allUsers.value = allUsers.value.filter(u => u.id !== selectedUserForDelete.value.id)
    isDeleteUserModalOpen.value = false
    yardStore.showNotification(`Usuário ${selectedUserForDelete.value.email} excluído!`, 'info')
  } catch (err) {
    yardStore.showNotification(err.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function copyCarrierPortalLink(slug) {
  const link = `${window.location.origin}/agendar/${slug}`
  navigator.clipboard.writeText(link)
  copiedSlug.value = slug
  setTimeout(() => { copiedSlug.value = '' }, 2500)
}

onMounted(() => {
  yardStore.fetchTenants()
  fetchAllUsers()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    
    <!-- =================================================================== -->
    <!-- MASTER CONTROL BANNER EXECUTIVO RAOS                                -->
    <!-- =================================================================== -->
    <div class="bg-gradient-to-r from-[#070e1c] via-[#0b1b36] to-[#070e1c] border border-indigo-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
      <!-- Glow Accent -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        <div class="flex items-center space-x-4">
          <div class="w-14 h-14 rounded-2xl bg-white p-2.5 flex items-center justify-center shrink-0 shadow-xl shadow-sky-500/20 border-2 border-indigo-400/40">
            <img src="/raos-icon.png" alt="RAOS Tecnologia" class="w-full h-full object-contain" />
          </div>
          <div>
            <div class="inline-flex items-center space-x-2 bg-indigo-950/80 border border-indigo-700/80 px-3 py-1 rounded-full text-xs font-mono font-bold text-indigo-300 mb-1">
              <ShieldAlert class="w-3.5 h-3.5 text-indigo-400" />
              <span>Painel Master Super Admin &bull; RAOS Tecnologia (CNPJ 66.914.167/0001-76)</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Comando Central SaaS & Faturamento</h1>
            <p class="text-xs text-slate-300 mt-1 max-w-2xl">
              Gerencie contratos, defina o valor mensal cobrado por cliente para emissão de boletos, controle licenças e gerencie usuários de qualquer armazém.
            </p>
          </div>
        </div>

        <div class="flex items-center flex-wrap gap-3">
          <button
            @click="isNewTenantModalOpen = true"
            class="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-mono font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <PlusCircle class="w-4 h-4" />
            <span>Cadastrar Cliente</span>
          </button>

          <button
            @click="openNewUserModal()"
            class="bg-slate-800 hover:bg-slate-700 active:scale-95 text-sky-300 border border-sky-500/30 px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer"
          >
            <UserPlus class="w-4 h-4 text-sky-400" />
            <span>Criar Usuário</span>
          </button>
        </div>
      </div>

      <!-- Métricas Master de Negócio (MRR & Clientes) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-indigo-950/80">
        <div class="bg-slate-950/70 border border-indigo-900/40 p-4 rounded-2xl">
          <span class="text-slate-400 text-[11px] font-mono uppercase block flex items-center space-x-1.5">
            <DollarSign class="w-3.5 h-3.5 text-emerald-400" />
            <span>MRR Contratado</span>
          </span>
          <p class="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">{{ formatCurrency(totalMrr) }}</p>
          <span class="text-[10px] text-slate-500 font-mono">Receita mensal em boletos</span>
        </div>

        <div class="bg-slate-950/70 border border-indigo-900/40 p-4 rounded-2xl">
          <span class="text-slate-400 text-[11px] font-mono uppercase block flex items-center space-x-1.5">
            <Building2 class="w-3.5 h-3.5 text-sky-400" />
            <span>Clientes Pagantes</span>
          </span>
          <p class="text-xl sm:text-2xl font-black text-white font-mono mt-1">{{ activeTenantsCount }}</p>
          <span class="text-[10px] text-slate-500 font-mono">Armazéns em contrato ativo</span>
        </div>

        <div class="bg-slate-950/70 border border-indigo-900/40 p-4 rounded-2xl">
          <span class="text-slate-400 text-[11px] font-mono uppercase block flex items-center space-x-1.5">
            <DoorClosed class="w-3.5 h-3.5 text-amber-400" />
            <span>Docas Licenciadas</span>
          </span>
          <p class="text-xl sm:text-2xl font-black text-white font-mono mt-1">{{ totalDocksLicensed }}</p>
          <span class="text-[10px] text-slate-500 font-mono">Baias físicas ativas no YMS</span>
        </div>

        <div class="bg-slate-950/70 border border-indigo-900/40 p-4 rounded-2xl">
          <span class="text-slate-400 text-[11px] font-mono uppercase block flex items-center space-x-1.5">
            <Users class="w-3.5 h-3.5 text-indigo-400" />
            <span>Total de Usuários</span>
          </span>
          <p class="text-xl sm:text-2xl font-black text-white font-mono mt-1">{{ allUsers.length }}</p>
          <span class="text-[10px] text-slate-500 font-mono">Operadores e gestores ativos</span>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- BARRA DE BUSCA GLOBAL DE USUÁRIOS & FILTRO POR CLIENTE              -->
    <!-- =================================================================== -->
    <div class="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-900/50 p-3.5 sm:p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
      <div class="flex items-center space-x-3 w-full flex-1">
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="userSearch"
            @input="onSearchInput"
            type="text"
            placeholder="Buscar usuário de qualquer cliente por nome, e-mail, armazém ou cargo..."
            class="w-full bg-slate-950 border border-indigo-950 text-slate-100 placeholder:text-slate-500 rounded-2xl pl-10 pr-9 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition-all font-sans"
          />
          <button 
            v-if="userSearch" 
            @click="clearUserSearch" 
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5 rounded cursor-pointer"
            title="Limpar busca"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <select
          v-model="selectedTenantFilter"
          @change="onTenantFilterChange"
          class="bg-slate-950 border border-indigo-950 text-slate-300 rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer shrink-0 font-sans"
        >
          <option value="">Todos os Armazéns</option>
          <option v-for="t in yardStore.tenants" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>

      <div class="flex items-center justify-between w-full md:w-auto space-x-3 shrink-0">
        <div class="text-[11px] font-mono text-slate-400 flex items-center space-x-1.5">
          <Users class="w-3.5 h-3.5 text-indigo-400" />
          <span>{{ filteredUsers.length }} de {{ allUsers.length }} usuário(s)</span>
        </div>

        <button
          v-if="activeTab !== 'users'"
          @click="switchTab('users')"
          class="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
        >
          <span>Ver na Tabela &rarr;</span>
        </button>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- NAVEGAÇÃO POR ABAS EXECUTIVAS                                      -->
    <!-- =================================================================== -->
    <div class="flex items-center space-x-2 border-b border-slate-800 pb-2">
      <button
        @click="switchTab('tenants')"
        class="px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center space-x-2"
        :class="activeTab === 'tenants' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-400 hover:text-white hover:bg-slate-900'"
      >
        <Building2 class="w-4 h-4" />
        <span>Clientes, Contratos & Boletos</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/50">{{ yardStore.tenants.length }}</span>
      </button>

      <button
        @click="switchTab('users')"
        class="px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center space-x-2"
        :class="activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-400 hover:text-white hover:bg-slate-900'"
      >
        <Users class="w-4 h-4" />
        <span>Administração de Usuários</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/50">{{ allUsers.length }}</span>
      </button>

      <button
        @click="switchTab('modules')"
        class="px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center space-x-2"
        :class="activeTab === 'modules' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-400 hover:text-white hover:bg-slate-900'"
      >
        <Zap class="w-4 h-4 text-amber-400" />
        <span>Módulos & Licenciamento</span>
      </button>
    </div>

    <!-- =================================================================== -->
    <!-- ABA 1: CLIENTES, CONTRATOS & FATURAMENTO MENSAL                    -->
    <!-- =================================================================== -->
    <transition name="tab-fade" mode="out-in">
      <div v-if="activeTab === 'tenants'" key="tenants" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="tenant in yardStore.tenants"
          :key="tenant.id"
          class="bg-slate-900 border rounded-3xl p-6 shadow-xl space-y-5 transition-all relative overflow-hidden"
          :class="tenant.plan_tier === 'Enterprise' ? 'border-amber-500/40 shadow-amber-950/20' : 'border-slate-800 hover:border-slate-700'"
        >
          <!-- Top Card Header -->
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-base font-bold text-white">{{ tenant.name }}</h3>
              </div>
              <p class="text-xs font-mono text-slate-500 mt-0.5">CNPJ: {{ tenant.cnpj || 'Não informado' }}</p>
            </div>
            
            <span 
              class="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full"
              :class="{
                'bg-amber-950 text-amber-300 border border-amber-700/80': tenant.plan_tier === 'Enterprise',
                'bg-sky-950 text-sky-300 border border-sky-800': tenant.plan_tier === 'Professional' || !tenant.plan_tier,
                'bg-slate-800 text-slate-400': tenant.plan_tier === 'Starter'
              }"
            >
              {{ tenant.plan_tier || 'Professional' }}
            </span>
          </div>

          <!-- BLOCO FINANCEIRO & BOLETO (DEFINIDO LIVREMENTE PELO SUPER ADMIN) -->
          <div class="bg-gradient-to-br from-slate-950 to-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400 flex items-center space-x-1 font-mono">
                <Receipt class="w-3.5 h-3.5 text-emerald-400" />
                <span>Mensalidade Contratada:</span>
              </span>
              <span class="text-base font-black text-emerald-400 font-mono">
                {{ formatCurrency(tenant.monthly_fee || 1800) }}
              </span>
            </div>

            <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
              <span class="flex items-center space-x-1">
                <Calendar class="w-3 h-3 text-sky-400" />
                <span>Vencimento do Boleto:</span>
              </span>
              <span class="text-white font-bold">Todo dia {{ tenant.billing_due_day || 10 }}</span>
            </div>

            <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
              <span>Status da Cobrança:</span>
              <span 
                class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                :class="tenant.billing_status === 'active' || !tenant.billing_status ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'"
              >
                {{ tenant.billing_status === 'active' || !tenant.billing_status ? 'Adimplente' : tenant.billing_status }}
              </span>
            </div>
          </div>

          <!-- Módulos & Recursos Liberados -->
          <div class="p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80 space-y-2 text-xs font-mono">
            <div class="flex items-center justify-between">
              <span class="text-slate-400 flex items-center space-x-1.5">
                <MessageSquare class="w-3.5 h-3.5 text-emerald-400" />
                <span>Robô de WhatsApp:</span>
              </span>
              <span :class="tenant.has_whatsapp_automation ? 'text-emerald-400 font-bold' : 'text-slate-500'">
                {{ tenant.has_whatsapp_automation ? '🟢 ATIVADO' : '⚫ INATIVO' }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-slate-400 flex items-center space-x-1.5">
                <Truck class="w-3.5 h-3.5 text-sky-400" />
                <span>Portal Transportador:</span>
              </span>
              <span :class="tenant.has_carrier_portal ? 'text-sky-400 font-bold' : 'text-slate-500'">
                {{ tenant.has_carrier_portal ? '🟢 LIBERADO' : '⚫ BLOQUEADO' }}
              </span>
            </div>

            <div class="flex items-center justify-between pt-1 border-t border-slate-900">
              <span class="text-slate-500">Docas Contratadas:</span>
              <span class="text-white font-bold">{{ tenant.max_docks }} docas</span>
            </div>
          </div>

          <!-- Botões de Gestão -->
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button
              @click="openEditTenantModal(tenant)"
              class="py-2.5 px-3 rounded-xl text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Sliders class="w-3.5 h-3.5 text-sky-400" />
              <span>Ajustar Contrato</span>
            </button>

            <button
              @click="openNewUserModal(tenant.id)"
              class="py-2.5 px-3 rounded-xl text-xs font-mono font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <UserPlus class="w-3.5 h-3.5" />
              <span>+ Usuário</span>
            </button>
          </div>

          <!-- Botão para localizar e filtrar usuários deste armazém -->
          <button
            @click="filterUsersByTenant(tenant.id)"
            class="w-full py-2 px-3 rounded-xl text-[11px] font-mono font-semibold bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Search class="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Usuários deste Armazém ({{ allUsers.filter(u => u.tenant_id === tenant.id).length }})</span>
          </button>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- ABA 2: ADMINISTRAÇÃO CENTRAL DE USUÁRIOS                           -->
    <!-- =================================================================== -->
    <div v-else-if="activeTab === 'users'" key="users" class="space-y-4">
      
      <!-- Barra de Filtros & Busca de Usuários -->
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div class="flex items-center space-x-3 w-full sm:w-auto">
          <div class="relative flex-1 sm:w-80">
            <Search class="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="userSearch"
              type="text"
              placeholder="Buscar por nome, e-mail, armazém ou cargo..."
              class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button v-if="userSearch" @click="clearUserSearch" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5 rounded cursor-pointer">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <select
            v-model="selectedTenantFilter"
            class="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Todos os Armazéns</option>
            <option v-for="t in yardStore.tenants" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>

        <button
          @click="openNewUserModal()"
          class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shrink-0"
        >
          <UserPlus class="w-4 h-4" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      <!-- Tabela Central de Usuários -->
      <div class="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                <th class="py-3.5 px-4">Nome do Usuário</th>
                <th class="py-3.5 px-4">E-mail de Login</th>
                <th class="py-3.5 px-4">Armazém / Cliente</th>
                <th class="py-3.5 px-4">Função / Cargo</th>
                <th class="py-3.5 px-4 text-center">Status</th>
                <th class="py-3.5 px-4 text-right">Ações Super Admin</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-sans">
              <tr 
                v-for="user in filteredUsers" 
                :key="user.id"
                class="hover:bg-slate-800/40 transition-colors"
              >
                <td class="py-3 px-4 font-bold text-white flex items-center space-x-2.5">
                  <div class="w-7 h-7 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {{ user.name.charAt(0).toUpperCase() }}
                  </div>
                  <span>{{ user.name }}</span>
                </td>

                <td class="py-3 px-4 font-mono text-slate-300">
                  {{ user.email }}
                </td>

                <td class="py-3 px-4">
                  <span class="font-semibold text-slate-200 block">{{ user.tenant_name || 'RAOS Master' }}</span>
                  <span v-if="!user.tenant_name" class="text-[10px] font-mono text-indigo-400 font-bold">SUPER ADMIN</span>
                </td>

                <td class="py-3 px-4">
                  <span 
                    class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                    :class="{
                      'bg-indigo-950 text-indigo-300 border border-indigo-800': user.role === 'super_admin',
                      'bg-amber-950 text-amber-300 border border-amber-800': user.role === 'tenant_manager',
                      'bg-blue-950 text-blue-300 border border-blue-800': user.role === 'tenant_operator',
                      'bg-emerald-950 text-emerald-300 border border-emerald-800': user.role === 'gatekeeper',
                      'bg-sky-950 text-sky-300 border border-sky-800': user.role === 'fiscal_patio'
                    }"
                  >
                    {{ user.role }}
                  </span>
                </td>

                <td class="py-3 px-4 text-center font-mono text-[11px]">
                  <span :class="user.is_active ? 'text-emerald-400' : 'text-rose-400'">
                    {{ user.is_active ? '● Ativo' : '○ Bloqueado' }}
                  </span>
                </td>

                <!-- AÇÕES: RESETAR SENHA & EXCLUIR -->
                <td class="py-3 px-4 text-right">
                  <div class="inline-flex items-center space-x-2">
                    <button
                      @click="openResetPasswordModal(user)"
                      class="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800/80 font-mono text-[11px] flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Redefinir Senha do Usuário"
                    >
                      <KeyRound class="w-3.5 h-3.5" />
                      <span>Resetar Senha</span>
                    </button>

                    <button
                      v-if="user.role !== 'super_admin'"
                      @click="openDeleteUserModal(user)"
                      class="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/80 cursor-pointer transition-colors"
                      title="Excluir Usuário"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="filteredUsers.length === 0">
                <td colspan="6" class="py-8 text-center text-slate-500 font-mono">
                  Nenhum usuário localizado para o filtro selecionado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- ABA 3: MÓDULOS & LICENCIAMENTO GLOBAL                              -->
    <!-- =================================================================== -->
    <div v-else-if="activeTab === 'modules'" key="modules" class="space-y-6">
      <div class="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
        <h3 class="text-sm font-bold text-white flex items-center space-x-2">
          <Zap class="w-4 h-4 text-amber-400" />
          <span>Matriz de Módulos & Recursos Licenciados por Cliente</span>
        </h3>
        <p class="text-xs text-slate-400">
          Ative ou desative automações de ponta (Robô de WhatsApp para motoristas e Portal de Auto-Agendamento de Transportadoras) e gerencie limites de docas físicas por armazém.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="tenant in yardStore.tenants"
          :key="'module-' + tenant.id"
          class="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5"
        >
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 class="font-bold text-white text-base">{{ tenant.name }}</h4>
              <span class="text-[11px] font-mono text-slate-500">Plano {{ tenant.plan_tier || 'Professional' }} &bull; {{ formatCurrency(tenant.monthly_fee) }}/mês</span>
            </div>
            <button
              @click="openEditTenantModal(tenant)"
              class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-sky-400 border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
            >
              <Sliders class="w-3.5 h-3.5" />
              <span>Configurar</span>
            </button>
          </div>

          <!-- Feature 1: WhatsApp Bot -->
          <div class="p-4 rounded-2xl border" :class="tenant.has_whatsapp_automation ? 'bg-emerald-950/20 border-emerald-800/60' : 'bg-slate-950/50 border-slate-800/80'">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2.5">
                <div class="p-2 rounded-xl" :class="tenant.has_whatsapp_automation ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-800 text-slate-500'">
                  <MessageSquare class="w-4 h-4" />
                </div>
                <div>
                  <h5 class="text-xs font-bold text-white">Robô de Automação de WhatsApp</h5>
                  <p class="text-[10px] text-slate-400">Notificações automáticas para motoristas sobre doca livre e chamadas</p>
                </div>
              </div>
              <span class="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full" :class="tenant.has_whatsapp_automation ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-slate-800 text-slate-400'">
                {{ tenant.has_whatsapp_automation ? 'LICENCIADO' : 'BLOQUEADO' }}
              </span>
            </div>
          </div>

          <!-- Feature 2: Portal do Transportador -->
          <div class="p-4 rounded-2xl border" :class="tenant.has_carrier_portal ? 'bg-sky-950/20 border-sky-800/60' : 'bg-slate-950/50 border-slate-800/80'">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2.5">
                <div class="p-2 rounded-xl" :class="tenant.has_carrier_portal ? 'bg-sky-900/40 text-sky-400' : 'bg-slate-800 text-slate-500'">
                  <Truck class="w-4 h-4" />
                </div>
                <div>
                  <h5 class="text-xs font-bold text-white">Portal do Transportador (Auto-Agendamento)</h5>
                  <p class="text-[10px] text-slate-400">Link público exclusivo para transportadoras marcarem janelas de descarga</p>
                </div>
              </div>
              <span class="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full" :class="tenant.has_carrier_portal ? 'bg-sky-950 text-sky-300 border border-sky-700' : 'bg-slate-800 text-slate-400'">
                {{ tenant.has_carrier_portal ? 'LIBERADO' : 'BLOQUEADO' }}
              </span>
            </div>
            <div v-if="tenant.has_carrier_portal" class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span class="truncate">Link: /agendar/{{ tenant.slug }}</span>
              <a :href="'/agendar/' + tenant.slug" target="_blank" class="text-sky-400 hover:text-sky-300 flex items-center space-x-1 shrink-0 ml-2">
                <span>Abrir Portal</span>
                <ExternalLink class="w-3 h-3" />
              </a>
            </div>
          </div>

          <!-- Feature 3: Licença de Docas Físicas -->
          <div class="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <div class="p-2 rounded-xl bg-slate-800 text-amber-400">
                <DoorClosed class="w-4 h-4" />
              </div>
              <div>
                <h5 class="text-xs font-bold text-white">Docas Físicas Licenciadas</h5>
                <p class="text-[10px] text-slate-400">Capacidade simultânea de atendimento de carretas</p>
              </div>
            </div>
            <span class="text-base font-black text-amber-400 font-mono">{{ tenant.max_docks }} docas</span>
          </div>
        </div>
      </div>
    </div>
    </transition>

    <!-- =================================================================== -->
    <!-- MODAL 1: EDITAR CONTRATO & MENSALIDADE DO CLIENTE                  -->
    <!-- =================================================================== -->
    <transition name="modal">
      <div
        v-if="isEditTenantModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      >
        <div class="modal-panel bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl my-8 space-y-6">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="font-bold text-base text-white">Administração de Contrato & Cobrança</h3>
            <p class="text-xs font-mono text-slate-400">{{ editTenantForm.name }}</p>
          </div>
          <button @click="isEditTenantModalOpen = false" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveTenantContract" class="space-y-4">
          <div v-if="modalError" class="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
            {{ modalError }}
          </div>

          <!-- BLOCO DE FATURAMENTO / BOLETO BANCÁRIO -->
          <div class="bg-slate-950 p-4 rounded-2xl border border-indigo-950 space-y-3">
            <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block flex items-center space-x-1.5">
              <DollarSign class="w-4 h-4" />
              <span>Valores de Cobrança Mensal (Boleto Bancário)</span>
            </span>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Valor da Mensalidade (R$/mês) *</label>
                <input
                  v-model.number="editTenantForm.monthly_fee"
                  type="number"
                  step="50"
                  min="0"
                  required
                  placeholder="Ex: 2500"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
                <span class="text-[10px] text-slate-500 mt-0.5 block">Valor livre que seu banco emitirá no boleto</span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Dia do Vencimento *</label>
                <input
                  v-model.number="editTenantForm.billing_due_day"
                  type="number"
                  min="1"
                  max="31"
                  required
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <span class="text-[10px] text-slate-500 mt-0.5 block">Ex: todo dia 05, 10, 15, 20</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Plano Comercial</label>
                <select
                  v-model="editTenantForm.plan_tier"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Starter">Starter</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Status da Assinatura</label>
                <select
                  v-model="editTenantForm.billing_status"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="active">Adimplente / Ativo</option>
                  <option value="trial">Degustação / Piloto</option>
                  <option value="overdue">Boleto em Atraso</option>
                  <option value="cancelled">Contrato Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          <!-- MÓDULOS LIBERADOS -->
          <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <span class="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider block">Módulos & Limites Operacionais</span>
            
            <label class="flex items-center justify-between cursor-pointer">
              <div>
                <span class="text-xs font-semibold text-white block">Robô de WhatsApp Automático</span>
                <span class="text-[11px] text-slate-400">Disparos diretos de entrada e convocação de docas</span>
              </div>
              <input type="checkbox" v-model="editTenantForm.has_whatsapp_automation" class="w-5 h-5 accent-emerald-500" />
            </label>

            <label class="flex items-center justify-between pt-2 border-t border-slate-900 cursor-pointer">
              <div>
                <span class="text-xs font-semibold text-white block">Portal do Transportador</span>
                <span class="text-[11px] text-slate-400">Link exclusivo para transportadoras agendarem sozinhas</span>
              </div>
              <input type="checkbox" v-model="editTenantForm.has_carrier_portal" class="w-5 h-5 accent-sky-500" />
            </label>
          </div>

          <!-- CERCA ELETRÔNICA & GEOFENCING (LEI 11.442 / ANTIFRAUDE) -->
          <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div class="flex items-center space-x-2">
              <MapPin class="w-4 h-4 text-sky-400" />
              <span class="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">Cerca Eletrônica & GPS (Lei 11.442)</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Latitude Pátio</label>
                <input v-model.number="editTenantForm.latitude" type="number" step="0.000001" placeholder="Ex: -20.3155" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Longitude Pátio</label>
                <input v-model.number="editTenantForm.longitude" type="number" step="0.000001" placeholder="Ex: -40.3128" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Raio (metros)</label>
                <input v-model.number="editTenantForm.geofence_radius_meters" type="number" step="100" min="100" placeholder="1000" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
              </div>
            </div>

            <label class="flex items-center justify-between pt-2 border-t border-slate-900 cursor-pointer">
              <div>
                <span class="text-xs font-semibold text-white block">Exigir Presença Física via GPS</span>
                <span class="text-[11px] text-slate-400">Bloqueia o check-in no celular se o motorista estiver fora do raio</span>
              </div>
              <input type="checkbox" v-model="editTenantForm.require_geofence" class="w-5 h-5 accent-sky-500" />
            </label>
          </div>

          <!-- TELEMETRIA & RASTREADORES VEICULARES (AUTOTRAC, SASCAR, ONIXSAT, ETC.) -->
          <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <Radio class="w-4 h-4 text-emerald-400" />
                <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Telemetria de Frotas & Rastreadores</span>
              </div>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" v-model="editTenantForm.has_telemetry_integration" class="w-4 h-4 accent-emerald-500" />
                <span class="text-[11px] font-bold text-slate-300">{{ editTenantForm.has_telemetry_integration ? 'Habilitado' : 'Inativo' }}</span>
              </label>
            </div>

            <div v-if="editTenantForm.has_telemetry_integration" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Provedor Homologado</label>
                <select
                  v-model="editTenantForm.telemetry_provider"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Autotrac">Autotrac (API WebServices)</option>
                  <option value="Sascar">Sascar / Michelin Fleet</option>
                  <option value="OnixSat">OnixSat / Buonny</option>
                  <option value="Omnilink">Omnilink / Zatix</option>
                  <option value="Cobli">Cobli Gestão de Frotas</option>
                  <option value="Generic_Webhook">Webhook Genérico Open GPS</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">ID da Conta / Código Contrato</label>
                <input
                  v-model="editTenantForm.telemetry_client_id"
                  type="text"
                  placeholder="Ex: CLI-8849-BR"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-300 mb-1">
                  Token do Rastreador Veicular <span class="text-slate-500 font-normal">(Opcional - mapa não requer chave)</span>
                </label>
                <input
                  v-model="editTenantForm.telemetry_api_key"
                  type="password"
                  placeholder="Token seguro do provedor Sascar/Autotrac"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          <!-- Limite de Docas e Multas -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Limite Docas</label>
              <input v-model.number="editTenantForm.max_docks" type="number" min="1" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Carência (min)</label>
              <input v-model.number="editTenantForm.grace_period_minutes" type="number" min="0" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Multa R$/hora</label>
              <input v-model.number="editTenantForm.detention_fee_per_hour" type="number" min="0" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="isEditTenantModalOpen = false"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-mono font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {{ isSubmitting ? 'Salvando...' : 'Salvar Contrato Financeiro' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </transition>

    <!-- =================================================================== -->
    <!-- MODAL 2: RESETAR SENHA DO USUÁRIO                                   -->
    <!-- =================================================================== -->
    <transition name="modal">
      <div
        v-if="isResetPasswordModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <div class="modal-panel bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center space-x-2 text-amber-400">
            <KeyRound class="w-5 h-5" />
            <h3 class="font-bold text-base text-white">Redefinir Senha do Usuário</h3>
          </div>
          <button @click="isResetPasswordModalOpen = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">
          Defina uma nova senha para o colaborador <strong class="text-white">{{ selectedUserForPassword?.name }}</strong> (<span class="font-mono text-sky-400">{{ selectedUserForPassword?.email }}</span>):
        </p>

        <div v-if="modalError" class="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs">
          {{ modalError }}
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Nova Senha</label>
          <input
            v-model="newPasswordInput"
            type="text"
            required
            placeholder="Digite a nova senha (mínimo 6 caracteres)..."
            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
          />
        </div>

        <div class="flex justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            @click="isResetPasswordModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            @click="handleResetPassword"
            :disabled="isSubmitting || !newPasswordInput"
            class="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-mono font-bold shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
          >
            {{ isSubmitting ? 'Salvando...' : 'Definir Nova Senha' }}
          </button>
        </div>
      </div>
    </div>
    </transition>

    <!-- =================================================================== -->
    <!-- MODAL 3: EXCLUIR USUÁRIO                                            -->
    <!-- =================================================================== -->
    <transition name="modal">
      <div
        v-if="isDeleteUserModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <div class="modal-panel bg-slate-900 border border-rose-800/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
        <div class="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-700 flex items-center justify-center mx-auto text-rose-400">
          <Trash2 class="w-6 h-6" />
        </div>

        <h3 class="font-bold text-base text-white">Confirmar Exclusão</h3>
        <p class="text-xs text-slate-300 leading-relaxed">
          Tem certeza de que deseja excluir o usuário <strong class="text-white">{{ selectedUserForDelete?.name }}</strong> (<span class="font-mono text-sky-400">{{ selectedUserForDelete?.email }}</span>)?
        </p>

        <div class="flex space-x-3 pt-2">
          <button
            @click="isDeleteUserModalOpen = false"
            class="w-1/2 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
          >
            Cancelar
          </button>
          <button
            @click="handleDeleteUser"
            :disabled="isSubmitting"
            class="w-1/2 py-2.5 rounded-xl text-xs font-mono font-bold text-white bg-rose-600 hover:bg-rose-500 cursor-pointer shadow-lg shadow-rose-600/30"
          >
            {{ isSubmitting ? 'Excluindo...' : 'Sim, Excluir' }}
          </button>
        </div>
      </div>
    </div>
    </transition>

    <!-- =================================================================== -->
    <!-- MODAL 4: CADASTRAR NOVO USUÁRIO                                     -->
    <!-- =================================================================== -->
    <transition name="modal">
      <div
        v-if="isNewUserModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      >
        <div class="modal-panel bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl my-8 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="font-bold text-base text-white">Cadastrar Usuário para Cliente</h3>
          <button @click="isNewUserModalOpen = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="createUser" class="space-y-4">
          <div v-if="modalError" class="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs">
            {{ modalError }}
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Armazém / Cliente *</label>
            <select
              v-model="newUserForm.tenant_id"
              required
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option v-for="t in yardStore.tenants" :key="t.id" :value="t.id">
                {{ t.name }} ({{ t.slug }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
            <input
              v-model="newUserForm.name"
              type="text"
              required
              placeholder="Ex: João da Silva"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">E-mail de Login *</label>
            <input
              v-model="newUserForm.email"
              type="email"
              required
              placeholder="joao@armazem.com.br"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Senha Inicial *</label>
            <input
              v-model="newUserForm.password"
              type="text"
              required
              placeholder="Senha de acesso (mínimo 6 dígitos)"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Cargo / Função</label>
            <select
              v-model="newUserForm.role"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="tenant_manager">Gerente / Supervisor de Pátio</option>
              <option value="tenant_operator">Operador de Doca</option>
              <option value="gatekeeper">Portaria & Cancela</option>
              <option value="fiscal_patio">Fiscal de Pátio / Conferente</option>
            </select>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="isNewUserModalOpen = false"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-mono font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {{ isSubmitting ? 'Cadastrando...' : 'Criar Usuário' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </transition>

    <!-- =================================================================== -->
    <!-- MODAL 5: PROVISIONAR NOVO ARMAZÉM COM MENSALIDADE LIVRE             -->
    <!-- =================================================================== -->
    <transition name="modal">
      <div
        v-if="isNewTenantModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      >
        <div class="modal-panel bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl my-8 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="font-bold text-base text-white">Provisionar Cliente (Armazém Logístico)</h3>
          <button @click="isNewTenantModalOpen = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="createTenant" class="space-y-4">
          <div v-if="modalError" class="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
            {{ modalError }}
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Nome do Operador *</label>
              <input
                v-model="newTenantForm.name"
                type="text"
                required
                placeholder="Ex: Santos Brasil Logística"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Slug URL *</label>
              <input
                v-model="newTenantForm.slug"
                type="text"
                required
                placeholder="Ex: santos-brasil"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <!-- BLOCO FINANCEIRO NA ABERTURA -->
          <div class="p-3.5 bg-slate-950 rounded-2xl border border-indigo-950 space-y-3">
            <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">Acordo Comercial & Boleto Bancário</span>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Valor Mensal Cobrado (R$/mês) *</label>
                <input
                  v-model.number="newTenantForm.monthly_fee"
                  type="number"
                  step="50"
                  min="0"
                  required
                  placeholder="Ex: 2500"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Dia Vencimento Boleto *</label>
                <input
                  v-model.number="newTenantForm.billing_due_day"
                  type="number"
                  min="1"
                  max="31"
                  required
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Limite Docas *</label>
              <input v-model.number="newTenantForm.max_docks" type="number" min="1" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Carência (min) *</label>
              <input v-model.number="newTenantForm.grace_period_minutes" type="number" min="0" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Multa R$/h *</label>
              <input v-model.number="newTenantForm.detention_fee_per_hour" type="number" min="0" step="10" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono" />
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="isNewTenantModalOpen = false"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-mono font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {{ isSubmitting ? 'Provisionando...' : 'Cadastrar e Licenciar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </transition>

  </div>
</template>
