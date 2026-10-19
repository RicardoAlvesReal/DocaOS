<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useYardStore } from '../stores/yard'
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ClipboardCheck, 
  ScanLine, 
  Warehouse, 
  Trash2, 
  Mail, 
  Lock, 
  User, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Search
} from 'lucide-vue-next'

const authStore = useAuthStore()
const yardStore = useYardStore()

const users = ref([])
const isLoading = ref(true)
const isModalOpen = ref(false)
const searchQuery = ref('')
const isSubmitting = ref(false)
const formError = ref('')

// Novo Colaborador Form
const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'fiscal_patio'
})

// Dados simulados para o modo Sandbox
const MOCK_TEAM = [
  {
    id: 'mock-user-1',
    name: 'Carlos Alberto Vistoriador',
    email: 'carlos.fiscal@rotaflow.com.br',
    role: 'fiscal_patio',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-user-2',
    name: 'Marcos Vinicius Portaria',
    email: 'portaria.santos@rotaflow.com.br',
    role: 'gatekeeper',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-user-3',
    name: 'Renata Oliveira Doca',
    email: 'renata.docas@rotaflow.com.br',
    role: 'tenant_operator',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-user-4',
    name: 'Rodrigo Mendes Supervisor',
    email: 'rodrigo.gerente@rotaflow.com.br',
    role: 'tenant_manager',
    is_active: true,
    created_at: new Date().toISOString()
  }
]

const roleLabels = {
  fiscal_patio: {
    title: 'Fiscal de Pátio / Conferente',
    desc: 'Confere cargas, lacres, notas fiscais e avarias físicas das carretas',
    badgeClass: 'bg-sky-950/80 text-sky-400 border-sky-800',
    icon: ClipboardCheck
  },
  gatekeeper: {
    title: 'Portaria & Cancela',
    desc: 'Bipa QR Codes e autoriza entrada e saída de veículos na cancela',
    badgeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-800',
    icon: ScanLine
  },
  tenant_operator: {
    title: 'Operador de Doca',
    desc: 'Chama carretas, controla tempo de estadia e docas ativas',
    badgeClass: 'bg-blue-950/80 text-blue-400 border-blue-800',
    icon: Warehouse
  },
  tenant_manager: {
    title: 'Gerente / Supervisor',
    desc: 'Acesso total à gestão, auditoria jurídica e integrações',
    badgeClass: 'bg-amber-950/80 text-amber-400 border-amber-800',
    icon: ShieldCheck
  }
}

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const q = searchQuery.value.toLowerCase()
  return users.value.filter(u => 
    u.name.toLowerCase().includes(q) || 
    u.email.toLowerCase().includes(q) ||
    (roleLabels[u.role]?.title || '').toLowerCase().includes(q)
  )
})

const counts = computed(() => {
  const f = users.value.filter(u => u.role === 'fiscal_patio').length
  const g = users.value.filter(u => u.role === 'gatekeeper').length
  const o = users.value.filter(u => u.role === 'tenant_operator').length
  const m = users.value.filter(u => u.role === 'tenant_manager').length
  return { total: users.value.length, fiscal: f, gate: g, operator: o, manager: m }
})

async function fetchTeam() {
  isLoading.value = true
  if (authStore.isDemoMode) {
    users.value = JSON.parse(JSON.stringify(MOCK_TEAM))
    isLoading.value = false
    return
  }

  try {
    const res = await fetch('/api/v1/auth/users', {
      headers: authStore.getAuthHeader()
    })
    if (res.ok) {
      users.value = await res.json()
    }
  } catch (err) {
    console.error('Erro ao buscar equipe:', err)
  } finally {
    isLoading.value = false
  }
}

async function handleCreateUser() {
  formError.value = ''
  isSubmitting.value = true

  if (authStore.isDemoMode) {
    const newUser = {
      id: `mock-${Date.now()}`,
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
      is_active: true
    }
    users.value.unshift(newUser)
    yardStore.showNotification(`Colaborador ${form.value.name} cadastrado! (Sandbox)`, 'success')
    closeModal()
    isSubmitting.value = false
    return
  }

  try {
    const res = await fetch('/api/v1/auth/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authStore.getAuthHeader()
      },
      body: JSON.stringify({
        ...form.value,
        tenant_id: yardStore.currentTenant?.id
      })
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Não foi possível cadastrar o colaborador.')
    }

    const created = await res.json()
    users.value.unshift(created)
    yardStore.showNotification(`Colaborador ${created.name} cadastrado com sucesso!`, 'success')
    closeModal()
  } catch (err) {
    formError.value = err.message
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteUser(user) {
  if (!confirm(`Tem certeza que deseja remover o acesso de ${user.name}?`)) return

  if (authStore.isDemoMode) {
    users.value = users.value.filter(u => u.id !== user.id)
    yardStore.showNotification(`Colaborador ${user.name} removido! (Sandbox)`, 'info')
    return
  }

  try {
    const res = await fetch(`/api/v1/auth/users/${user.id}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeader()
    })

    if (res.ok || res.status === 204) {
      users.value = users.value.filter(u => u.id !== user.id)
      yardStore.showNotification(`Acesso de ${user.name} revogado.`, 'info')
    } else {
      const err = await res.json()
      alert(err.detail || 'Falha ao excluir colaborador.')
    }
  } catch (err) {
    console.error('Erro ao deletar usuário:', err)
  }
}

function openModal() {
  form.value = {
    name: '',
    email: '',
    password: '',
    role: 'fiscal_patio'
  }
  formError.value = ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

onMounted(() => {
  fetchTeam()
})
</script>

<template>
  <div class="space-y-6">
    
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
      <div>
        <div class="flex items-center space-x-2">
          <h1 class="text-2xl font-black text-white tracking-tight">Equipe & Fiscais de Pátio</h1>
          <span class="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
            Acessos Operacionais
          </span>
        </div>
        <p class="text-xs text-slate-400 mt-1">
          Cadastre fiscais de pátio, conferentes de carga, porteiros e supervisores com controle de permissões.
        </p>
      </div>

      <button
        @click="openModal"
        class="bg-[#086cfe] hover:bg-blue-600 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
      >
        <UserPlus class="w-4 h-4" />
        <span>Cadastrar Colaborador</span>
      </button>
    </div>

    <!-- KPIs de Equipe -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
        <span class="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">Total de Colaboradores</span>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-black text-white">{{ counts.total }}</span>
          <Users class="w-5 h-5 text-sky-400" />
        </div>
        <p class="text-[10px] text-slate-400">Usuários ativos na equipe</p>
      </div>

      <div class="bg-slate-900/80 border border-sky-500/20 rounded-2xl p-4 space-y-1">
        <span class="text-[11px] font-mono text-sky-400 uppercase tracking-wider block">Fiscais & Conferentes</span>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-black text-sky-400">{{ counts.fiscal }}</span>
          <ClipboardCheck class="w-5 h-5 text-sky-400" />
        </div>
        <p class="text-[10px] text-slate-400">Vistoria e conferência de carretas</p>
      </div>

      <div class="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-4 space-y-1">
        <span class="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">Portaria & Cancela</span>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-black text-emerald-400">{{ counts.gate }}</span>
          <ScanLine class="w-5 h-5 text-emerald-400" />
        </div>
        <p class="text-[10px] text-slate-400">Leitura de QR Code e cancela</p>
      </div>

      <div class="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-4 space-y-1">
        <span class="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">Gestores & Operadores</span>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-black text-amber-400">{{ counts.operator + counts.manager }}</span>
          <Warehouse class="w-5 h-5 text-amber-400" />
        </div>
        <p class="text-[10px] text-slate-400">Torre de controle e docas</p>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="flex items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
      <div class="relative flex-1 max-w-md">
        <Search class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nome, e-mail ou cargo..."
          class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#086cfe]"
        />
      </div>
      <span class="text-xs font-mono text-slate-400">
        {{ filteredUsers.length }} colaborador(es)
      </span>
    </div>

    <!-- Tabela / Lista de Colaboradores -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div v-if="isLoading" class="p-12 text-center space-y-3">
        <div class="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs font-mono text-slate-400">Carregando equipe do armazém...</p>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="p-12 text-center space-y-3">
        <Users class="w-10 h-10 text-slate-600 mx-auto" />
        <p class="text-sm font-semibold text-slate-300">Nenhum colaborador encontrado.</p>
        <p class="text-xs text-slate-500">Cadastre fiscais de pátio ou conferentes para atuar na operação.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
            <tr>
              <th class="px-5 py-3.5">Colaborador</th>
              <th class="px-5 py-3.5">Perfil de Acesso</th>
              <th class="px-5 py-3.5">Atribuições</th>
              <th class="px-5 py-3.5">Status</th>
              <th class="px-5 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-sans">
            <tr 
              v-for="u in filteredUsers" 
              :key="u.id"
              class="hover:bg-slate-800/40 transition-colors"
            >
              <!-- Nome & Email -->
              <td class="px-5 py-4">
                <div class="flex items-center space-x-3">
                  <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#086cfe]/20 to-sky-400/20 border border-sky-500/30 flex items-center justify-center font-bold text-sky-400 uppercase text-xs">
                    {{ u.name.substring(0, 2) }}
                  </div>
                  <div>
                    <span class="font-bold text-white block">{{ u.name }}</span>
                    <span class="text-[11px] text-slate-400 font-mono">{{ u.email }}</span>
                  </div>
                </div>
              </td>

              <!-- Perfil Badge -->
              <td class="px-5 py-4">
                <div class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold"
                  :class="roleLabels[u.role]?.badgeClass || 'bg-slate-800 text-slate-300 border-slate-700'"
                >
                  <component :is="roleLabels[u.role]?.icon || User" class="w-3.5 h-3.5" />
                  <span>{{ roleLabels[u.role]?.title || u.role }}</span>
                </div>
              </td>

              <!-- Atribuições -->
              <td class="px-5 py-4 max-w-xs">
                <span class="text-slate-400 text-[11px] leading-relaxed block">
                  {{ roleLabels[u.role]?.desc || 'Acesso geral às operações do armazém.' }}
                </span>
              </td>

              <!-- Status -->
              <td class="px-5 py-4">
                <span class="inline-flex items-center space-x-1 text-emerald-400 font-mono text-[11px]">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Ativo</span>
                </span>
              </td>

              <!-- Ações -->
              <td class="px-5 py-4 text-right">
                <button
                  @click="handleDeleteUser(u)"
                  title="Revogar Acesso"
                  class="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Cadastro de Colaborador -->
    <transition name="modal">
      <div 
        v-if="isModalOpen" 
        class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div class="modal-panel bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-xl bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
              <UserPlus class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Cadastrar Colaborador</h3>
              <p class="text-[11px] text-slate-400">Crie o acesso para operadores e fiscais do pátio</p>
            </div>
          </div>
          <button @click="closeModal" class="text-slate-500 hover:text-white cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div v-if="formError" class="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-400" />
          <span>{{ formError }}</span>
        </div>

        <form @submit.prevent="handleCreateUser" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1 font-mono">Nome Completo</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Ex: Carlos Eduardo da Silva"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#086cfe]"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1 font-mono">E-mail Corporativo de Login</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="carlos.fiscal@armazem.com.br"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#086cfe]"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1 font-mono">Senha Inicial de Acesso</label>
            <input
              v-model="form.password"
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#086cfe]"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">Perfil Operacional / Função</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <!-- Fiscal de Pátio / Conferente -->
              <label 
                class="flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all"
                :class="form.role === 'fiscal_patio' ? 'bg-sky-950/60 border-sky-500/80 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'"
              >
                <input type="radio" v-model="form.role" value="fiscal_patio" class="mt-0.5" />
                <div>
                  <span class="text-xs font-bold block text-white">Fiscal de Pátio / Conferente</span>
                  <span class="text-[10px] text-slate-400 block mt-0.5">Vistoria e validação de lacres e cargas</span>
                </div>
              </label>

              <!-- Portaria & Cancela -->
              <label 
                class="flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all"
                :class="form.role === 'gatekeeper' ? 'bg-emerald-950/60 border-emerald-500/80 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'"
              >
                <input type="radio" v-model="form.role" value="gatekeeper" class="mt-0.5" />
                <div>
                  <span class="text-xs font-bold block text-white">Portaria & Cancela</span>
                  <span class="text-[10px] text-slate-400 block mt-0.5">Leitura óptica de QR Code na entrada</span>
                </div>
              </label>

              <!-- Operador de Doca -->
              <label 
                class="flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all"
                :class="form.role === 'tenant_operator' ? 'bg-blue-950/60 border-blue-500/80 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'"
              >
                <input type="radio" v-model="form.role" value="tenant_operator" class="mt-0.5" />
                <div>
                  <span class="text-xs font-bold block text-white">Operador de Doca</span>
                  <span class="text-[10px] text-slate-400 block mt-0.5">Operação e cronômetro de docas</span>
                </div>
              </label>

              <!-- Gerente de Logística -->
              <label 
                class="flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all"
                :class="form.role === 'tenant_manager' ? 'bg-amber-950/60 border-amber-500/80 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'"
              >
                <input type="radio" v-model="form.role" value="tenant_manager" class="mt-0.5" />
                <div>
                  <span class="text-xs font-bold block text-white">Gerente / Supervisor</span>
                  <span class="text-[10px] text-slate-400 block mt-0.5">Controle geral, laudos e auditoria</span>
                </div>
              </label>

            </div>
          </div>

          <div class="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="bg-[#086cfe] hover:bg-blue-600 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <span v-if="isSubmitting" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-else>Cadastrar Colaborador</span>
            </button>
          </div>
        </form>

      </div>
    </div>
    </transition>

  </div>
</template>
