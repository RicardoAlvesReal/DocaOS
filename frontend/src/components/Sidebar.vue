<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useYardStore } from '../stores/yard'
import { useAuthStore } from '../stores/auth'
import ThemeToggle from './ThemeToggle.vue'
import { 
  LayoutDashboard, 
  DoorClosed, 
  ScanLine, 
  Users, 
  BarChart3, 
  Network, 
  ShieldCheck, 
  Warehouse, 
  PlusCircle, 
  LogOut, 
  Sparkles, 
  Menu, 
  X, 
  Radio, 
  ExternalLink, 
  Truck,
  Building2,
  Zap,
  CreditCard,
  DollarSign,
  UserPlus,
  Sliders,
  ChevronRight,
  ArrowLeft,
  Crown,
  MapPin,
  IdCard
} from 'lucide-vue-next'

const yardStore = useYardStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const emit = defineEmits(['openNewScheduleModal', 'openNewTenantModal', 'openNewUserModal'])

// Mobile Drawer State
const isMobileOpen = ref(false)

// Identifica se a rota atual é do ecossistema Super Admin Master
const isSuperAdminRoute = computed(() => route.path.startsWith('/admin'))

// Cálculo consolidado de MRR e métricas do Master
const totalMrr = computed(() => {
  return (yardStore.tenants || []).reduce((acc, t) => acc + (Number(t.monthly_fee) || 0), 0)
})

const activeTenantsCount = computed(() => {
  return (yardStore.tenants || []).filter(t => t.billing_status === 'active' || !t.billing_status).length
})

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

// =========================================================================
// ITENS DO MENU SUPER ADMIN (RAOS MASTER OS)
// =========================================================================
const currentAdminTab = computed(() => route.query.tab || 'tenants')

const adminNavItems = [
  { 
    id: 'tenants', 
    name: 'Clientes & Contratos', 
    subtitle: 'Mensalidades e Boletos',
    icon: Building2, 
    tab: 'tenants', 
    badge: () => yardStore.tenants?.length ? `${yardStore.tenants.length}` : null 
  },
  { 
    id: 'users', 
    name: 'Usuários & Credenciais', 
    subtitle: 'Gestão Global e Senhas',
    icon: Users, 
    tab: 'users' 
  },
  { 
    id: 'modules', 
    name: 'Módulos & Licenças', 
    subtitle: 'WhatsApp Bot e Portais',
    icon: Zap, 
    tab: 'modules' 
  }
]

// =========================================================================
// ITENS DO MENU OPERACIONAL (CLIENTES / ARMAZÉNS)
// =========================================================================
const navItems = [
  { name: 'Torre de Controle', path: '/app', icon: LayoutDashboard, badge: () => yardStore.totalInYard ? `${yardStore.totalInYard} no pátio` : null },
  { name: 'Docas', path: '/docas', icon: DoorClosed, badge: () => yardStore.occupiedDocksCount ? `${yardStore.occupiedDocksCount} ocupada(s)` : null },
  { name: 'Mapa do Pátio (GPS)', path: '/mapa', icon: MapPin },
  { name: 'Portaria & Cancela', path: '/portaria', icon: ScanLine },
  { name: 'Crachá Digital', path: '/crachas', icon: IdCard, badge: () => yardStore.badges?.length ? `${yardStore.badges.length}` : null },
  { name: 'Equipe & Fiscais', path: '/equipe', icon: Users },
  { name: 'Relatórios & ROI', path: '/relatorios', icon: BarChart3 },
  { name: 'Integrações & APIs', path: '/integracoes', icon: Network }
]

function onTenantChange(event) {
  const selected = yardStore.tenants.find(t => t.id === event.target.value)
  if (selected) {
    yardStore.selectTenant(selected)
  }
}

function handleNavClick(path) {
  router.push(path)
  isMobileOpen.value = false
}

function handleAdminTabClick(tab) {
  router.push({ path: '/admin', query: { tab } })
  isMobileOpen.value = false
}

function handleNewTenantClick() {
  emit('openNewTenantModal')
  isMobileOpen.value = false
}

function handleNewUserClick() {
  emit('openNewUserModal')
  isMobileOpen.value = false
}

function handleNewSchedule() {
  emit('openNewScheduleModal')
  isMobileOpen.value = false
}

function handleOpenCarrierPortal() {
  const slug = yardStore.currentTenant?.slug || 'comlog'
  router.push(`/agendar/${slug}`)
  isMobileOpen.value = false
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function handleExitDemo() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div>
    <!-- ================================================================= -->
    <!-- MOBILE TOP BAR (Apenas em telas pequenas < lg)                    -->
    <!-- ================================================================= -->
    <header 
      class="lg:hidden sticky top-0 z-40 border-b backdrop-blur-md px-4 h-16 flex items-center justify-between"
      :class="isSuperAdminRoute ? 'bg-white/95 dark:bg-[#090b16]/95 border-slate-200 dark:border-indigo-900/80' : 'bg-white/95 dark:bg-[#00142c]/95 border-slate-200 dark:border-teal-500/20'"
    >
      <div class="flex items-center space-x-3">
        <button 
          @click="isMobileOpen = true" 
          class="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 focus:outline-none cursor-pointer"
          aria-label="Abrir menu de navegação"
        >
          <Menu class="w-6 h-6" />
        </button>

        <!-- Logo Mobile Super Admin -->
        <div v-if="isSuperAdminRoute" class="flex items-center space-x-2 cursor-pointer" @click="handleNavClick('/admin')">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500/20 to-indigo-600/30 border border-amber-500/40 p-1 flex items-center justify-center shadow-md">
            <Crown class="w-4 h-4 text-amber-400" />
          </div>
          <span class="text-base font-black tracking-tight text-white">
            RAOS <span class="text-amber-400">Master</span>
          </span>
          <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 uppercase">
            SUPER
          </span>
        </div>

        <!-- Logo Mobile Operacional -->
        <div v-else class="flex items-center space-x-2 cursor-pointer" @click="handleNavClick('/app')">
          <div class="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 p-1 flex items-center justify-center shadow-md">
            <img src="/docaos-icon.png" alt="DocaOS" class="w-full h-full object-contain" />
          </div>
          <span class="text-lg font-black tracking-tight text-white">
            Doca<span class="text-[#00A896]">OS</span>
          </span>
          <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-950 text-[#00E5C8] border border-teal-800 uppercase">
            PATIO & DOCK
          </span>
        </div>
      </div>

      <!-- Quick Actions Mobile -->
      <div class="flex items-center space-x-2">
        <ThemeToggle :compact="true" class="mr-1" />
        <template v-if="isSuperAdminRoute">
          <button
            @click="handleNewTenantClick"
            class="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md text-xs font-mono font-bold flex items-center space-x-1 cursor-pointer"
          >
            <PlusCircle class="w-3.5 h-3.5" />
            <span>+ Cliente</span>
          </button>
        </template>
        <template v-else>
          <div 
            class="flex items-center space-x-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
            :class="(yardStore.isWsConnected || authStore.isDemoMode) ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80' : 'bg-amber-950/60 text-amber-400 border-amber-800/80'"
          >
            <span class="w-1.5 h-1.5 rounded-full animate-pulse" :class="(yardStore.isWsConnected || authStore.isDemoMode) ? 'bg-emerald-400' : 'bg-amber-400'"></span>
            <span>{{ (yardStore.isWsConnected || authStore.isDemoMode) ? 'ONLINE' : 'OFFLINE' }}</span>
          </div>

          <button
            @click="handleNewSchedule"
            class="p-2 bg-[#086cfe] hover:bg-blue-600 text-white rounded-xl shadow-md cursor-pointer"
            title="Novo Agendamento"
          >
            <PlusCircle class="w-4 h-4" />
          </button>
        </template>
      </div>
    </header>

    <!-- ================================================================= -->
    <!-- BACKDROP PARA MOBILE                                              -->
    <!-- ================================================================= -->
    <div 
      v-if="isMobileOpen" 
      @click="isMobileOpen = false" 
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
    ></div>

    <!-- ================================================================= -->
    <!-- SIDEBAR VERTICAL (Fixa no Desktop & Drawer no Mobile)             -->
    <!-- ================================================================= -->
    <aside 
      class="fixed top-0 bottom-0 left-0 z-50 w-64 xl:w-72 border-r flex flex-col justify-between transition-transform duration-300 ease-in-out overflow-y-auto"
      :class="[
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        isSuperAdminRoute 
          ? 'bg-[#070914] border-indigo-900/60 selection:bg-amber-500 selection:text-black' 
          : 'bg-[#070a12] border-slate-800'
      ]"
    >

      <!-- =============================================================== -->
      <!-- CASO 1: SUPER ADMIN MASTER MENU (ROTA /admin)                    -->
      <!-- =============================================================== -->
      <div v-if="isSuperAdminRoute" class="p-5 space-y-6">
        
        <!-- Header & Identity RAOS Master -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 cursor-pointer" @click="handleNavClick('/admin')">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600/30 via-slate-900 to-amber-500/20 border border-amber-500/50 p-2 flex items-center justify-center shadow-lg shadow-indigo-950/60 shrink-0">
              <Crown class="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div class="flex items-center space-x-1.5">
                <span class="text-lg font-black tracking-tight text-white">
                  RAOS <span class="text-amber-400">Master</span>
                </span>
                <span class="text-[9px] font-mono uppercase font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm">
                  SUPER
                </span>
              </div>
              <p class="text-[10px] font-mono text-indigo-300/80 font-medium tracking-wide">Backoffice Multi-Tenant</p>
            </div>
          </div>

          <button 
            @click="isMobileOpen = false" 
            class="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- CNPJ & Licença Corporativa -->
        <div class="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-3 space-y-1.5">
          <div class="flex items-center justify-between text-[10px] font-mono">
            <span class="text-slate-400">RAOS Tecnologia LTDA</span>
            <span class="text-emerald-400 flex items-center space-x-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ONLINE</span>
            </span>
          </div>
          <p class="text-[11px] font-mono font-bold text-slate-300">
            CNPJ 66.914.167/0001-76
          </p>
        </div>

        <!-- Widget Consolidado de MRR & Faturamento -->
        <div class="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 border border-indigo-900/60 rounded-2xl p-3.5 space-y-2 shadow-inner">
          <div class="flex items-center justify-between text-xs font-mono">
            <span class="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
              <DollarSign class="w-3.5 h-3.5 text-emerald-400" />
              <span>MRR Consolidado</span>
            </span>
            <span class="text-[10px] font-bold text-indigo-300">{{ activeTenantsCount }} clientes</span>
          </div>
          <p class="text-xl font-black text-emerald-400 font-mono tracking-tight">
            {{ formatCurrency(totalMrr) }}
          </p>
          <span class="text-[10px] text-slate-500 font-mono block">Faturamento direto em boletos</span>
        </div>

        <!-- Botões de Ação Master -->
        <div class="space-y-2">
          <button
            @click="handleNewTenantClick"
            class="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white py-2.5 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <PlusCircle class="w-4 h-4" />
            <span>Cadastrar Cliente</span>
          </button>

          <button
            @click="handleNewUserClick"
            class="w-full bg-slate-900 hover:bg-slate-800 text-indigo-200 border border-indigo-900/80 py-2 px-3.5 rounded-xl font-semibold text-xs font-mono flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <UserPlus class="w-3.5 h-3.5 text-sky-400" />
            <span>Novo Usuário Global</span>
          </button>
        </div>

        <!-- Menu de Navegação Super Admin -->
        <nav class="space-y-1.5 font-sans">
          <p class="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 pb-1 font-bold">
            Módulos de Governança
          </p>
          
          <button
            v-for="item in adminNavItems"
            :key="item.id"
            @click="handleAdminTabClick(item.tab)"
            class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left"
            :class="[
              currentAdminTab === item.tab
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50 shadow-md shadow-indigo-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
            ]"
          >
            <div class="flex items-center space-x-3 min-w-0">
              <component 
                :is="item.icon" 
                class="w-4 h-4 shrink-0 transition-colors"
                :class="currentAdminTab === item.tab ? 'text-amber-400' : 'text-slate-400'"
              />
              <div class="min-w-0">
                <span class="tracking-wide block truncate">{{ item.name }}</span>
                <span class="text-[9px] font-mono text-slate-500 block truncate">{{ item.subtitle }}</span>
              </div>
            </div>

            <span 
              v-if="item.badge && item.badge()" 
              class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold shrink-0 ml-1"
            >
              {{ item.badge() }}
            </span>
          </button>
        </nav>

        <!-- Bloco de Auditoria & Suporte (Acessar Pátio do Cliente) -->
        <div class="bg-slate-900/90 border border-indigo-900/50 rounded-2xl p-3.5 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase font-bold text-indigo-300 tracking-wider flex items-center space-x-1.5">
              <Warehouse class="w-3.5 h-3.5 text-indigo-400" />
              <span>Auditoria de Pátio</span>
            </span>
            <span class="text-[9px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded">SUPORTE</span>
          </div>

          <p class="text-[10px] text-slate-400 leading-tight">
            Inspecione as docas e operação de qualquer cliente em tempo real:
          </p>

          <select
            :value="yardStore.currentTenant?.id"
            @change="onTenantChange"
            class="w-full bg-slate-950 text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-2 border border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option 
              v-for="t in yardStore.tenants" 
              :key="t.id" 
              :value="t.id"
              class="bg-slate-900 text-slate-200"
            >
              {{ t.name }}
            </option>
          </select>

          <button
            @click="handleNavClick('/app')"
            class="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer border border-slate-700"
          >
            <span>Inspecionar Pátio &rarr;</span>
          </button>
        </div>

      </div>

      <!-- =============================================================== -->
      <!-- CASO 2: OPERACIONAL (CLIENTES / MODO SUPORTE)                    -->
      <!-- =============================================================== -->
      <div v-else class="p-5 space-y-5">
        
        <!-- Alerta de Modo Suporte (Aparece para o SuperAdmin quando dentro do pátio) -->
        <div v-if="authStore.isSuperAdmin" class="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-amber-500/50 rounded-2xl p-3 space-y-2 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-1.5 text-xs font-mono font-bold text-amber-300">
              <Crown class="w-4 h-4 text-amber-400" />
              <span>MODO SUPORTE MASTER</span>
            </div>
            <span class="text-[9px] bg-indigo-900 text-indigo-200 px-1.5 py-0.5 rounded font-mono font-bold">RAOS</span>
          </div>
          <p class="text-[10px] text-slate-300 leading-tight">
            Inspecionando operação de <strong>{{ yardStore.currentTenant?.name }}</strong>.
          </p>
          <button
            @click="handleNavClick('/admin')"
            class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-center font-bold py-1.5 px-2 rounded-lg text-[10px] uppercase tracking-wider font-mono shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Voltar ao Painel Master</span>
          </button>
        </div>

        <!-- Logo & Brand Header Operacional -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 cursor-pointer" @click="handleNavClick('/app')">
            <div class="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 p-1 flex items-center justify-center shrink-0 shadow-sm">
              <img src="/docaos-icon.png" alt="DocaOS" class="w-full h-full object-contain" />
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-xl font-black tracking-tight text-white">
                  Doca<span class="text-[#00A896]">OS</span>
                </span>
                <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-950 text-[#00E5C8] border border-teal-800 uppercase">
                  OPERATING SYSTEM
                </span>
              </div>
              <p class="text-[10px] font-mono text-slate-400">docaos.log.br</p>
            </div>
          </div>

          <button 
            @click="isMobileOpen = false" 
            class="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Sandbox Alert Badge -->
        <div v-if="authStore.isDemoMode" class="bg-amber-50 dark:bg-[#04244a] border border-amber-500/30 rounded-xl p-3 space-y-2">
          <div class="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
            <Sparkles class="w-3.5 h-3.5 text-amber-400" />
            <span>MODO SANDBOX</span>
          </div>
          <p class="text-xs text-slate-300 leading-tight">
            Ambiente de demonstração. Seus testes não afetam clientes reais.
          </p>
          <div class="flex items-center space-x-2 pt-1">
            <a 
              href="https://api.whatsapp.com/send?phone=5527996174965&text=Ol%C3%A1!%20Gostei%20do%20piloto%20do%20DocaOS%20e%20gostaria%20de%20implantar%20no%20meu%20armaz%C3%A9m." 
              target="_blank"
              class="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-center font-bold py-1.5 px-2 rounded-lg text-xs uppercase tracking-wider transition-all"
            >
              Implantar &rarr;
            </a>
            <button 
              @click="handleExitDemo" 
              class="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>

        <!-- Armazém Ativo & Conexão Realtime -->
        <div class="bg-slate-100/80 dark:bg-[#04244a] border border-slate-200 dark:border-teal-500/20 rounded-xl p-3 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-xs font-medium text-slate-400">Armazém Ativo</span>
            <div 
              class="flex items-center space-x-1 text-xs font-semibold"
              :class="(yardStore.isWsConnected || authStore.isDemoMode) ? 'text-emerald-400' : 'text-amber-400'"
              :title="yardStore.isWsConnected ? 'WebSocket conectado' : 'Conectando WebSocket...'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="(yardStore.isWsConnected || authStore.isDemoMode) ? 'bg-emerald-400' : 'bg-amber-400'"></span>
              <span>{{ (yardStore.isWsConnected || authStore.isDemoMode) ? 'ONLINE' : 'CONECTANDO' }}</span>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <div class="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#00A896] dark:text-[#00E5C8] shrink-0">
              <Warehouse class="w-4 h-4" />
            </div>

            <!-- Se for Super Admin em suporte: Seletor livre -->
            <select
              v-if="authStore.isSuperAdmin && yardStore.tenants.length > 0"
              :value="yardStore.currentTenant?.id"
              @change="onTenantChange"
              class="w-full bg-[#070a12] text-slate-200 text-xs font-medium rounded-lg px-2 py-1.5 border border-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option 
                v-for="t in yardStore.tenants" 
                :key="t.id" 
                :value="t.id"
                class="bg-slate-900 text-slate-200"
              >
                {{ t.name }}
              </option>
            </select>

            <!-- Se for Operador Real: Nome Travado -->
            <div v-else class="min-w-0 flex-1">
              <p class="text-xs font-bold text-slate-800 dark:text-white truncate" :title="yardStore.currentTenant?.name || authStore.user?.tenant_name">
                {{ yardStore.currentTenant?.name || authStore.user?.tenant_name || 'Terminal Demonstrativo' }}
              </p>
              <span class="text-[11px] text-slate-400">Unidade Operacional</span>
            </div>
          </div>
        </div>

        <!-- Botão Novo Agendamento (CTA Operacional) -->
        <button
          @click="handleNewSchedule"
          class="w-full bg-gradient-to-r from-[#00A896] to-teal-500 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
        >
          <PlusCircle class="w-4 h-4" />
          <span>Novo Agendamento</span>
        </button>

        <!-- Navegação Operacional -->
        <nav class="space-y-1 font-sans">
          <p class="text-[11px] text-slate-400 px-3 pb-1 font-semibold uppercase tracking-wider">Menu Operacional</p>
          
          <button
            v-for="item in navItems"
            :key="item.path"
            @click="handleNavClick(item.path)"
            class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-left"
            :class="[
              route.path === item.path
                ? 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-800 dark:text-[#00E5C8] border-l-2 border-l-[#00A896] font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#04244a]/60'
            ]"
          >
            <div class="flex items-center space-x-3">
              <component 
                :is="item.icon" 
                class="w-4 h-4 shrink-0 transition-colors"
                :class="route.path === item.path ? 'text-[#00A896] dark:text-[#00E5C8]' : 'text-slate-400 dark:text-slate-500'"
              />
              <span class="tracking-wide">{{ item.name }}</span>
            </div>

            <span 
              v-if="item.badge && item.badge()" 
              class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              {{ item.badge() }}
            </span>
          </button>
        </nav>

        <!-- Portal do Transportador -->
        <div v-if="yardStore.currentTenant?.has_carrier_portal || authStore.isDemoMode" class="pt-2 border-t border-slate-800/80">
          <p class="text-[10px] font-mono uppercase tracking-wider text-sky-400 px-3 pb-1 font-bold flex items-center justify-between">
            <span>Transportadoras</span>
            <span class="text-[9px] bg-sky-950 text-sky-300 border border-sky-800 px-1.5 py-0.5 rounded font-mono">PORTAL</span>
          </p>
          <button
            @click="handleOpenCarrierPortal"
            class="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer border border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300"
          >
            <div class="flex items-center space-x-2.5">
              <Truck class="w-4 h-4 text-[#00A896] dark:text-[#00E5C8] shrink-0" />
              <span>Auto-Agendamento</span>
            </div>
            <ExternalLink class="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        <!-- Atalho Painel Super Admin (Apenas SuperAdmin) -->
        <div v-if="authStore.isSuperAdmin" class="pt-2 border-t border-slate-800/80">
          <p class="text-[10px] font-mono uppercase tracking-wider text-indigo-400 px-3 pb-1 font-bold">Gestão RAOS Master</p>
          <button
            @click="handleNavClick('/admin')"
            class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-950/50 hover:bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 transition-all cursor-pointer"
          >
            <div class="flex items-center space-x-3">
              <Crown class="w-4 h-4 text-amber-400" />
              <span>Painel Super Admin</span>
            </div>
            <span class="text-[9px] font-mono bg-indigo-900 text-amber-300 px-1.5 py-0.5 rounded font-bold">MASTER</span>
          </button>
        </div>

      </div>

      <!-- =============================================================== -->
      <!-- BOTTOM FOOTER (PERFIL & LOGOUT)                                 -->
      <!-- =============================================================== -->
      <div 
        class="p-4 border-t"
        :class="isSuperAdminRoute ? 'border-slate-200 dark:border-indigo-950 bg-slate-50 dark:bg-slate-950/80' : 'border-slate-200 dark:border-teal-500/20 bg-slate-50 dark:bg-slate-950/60'"
      >
        <ThemeToggle class="mb-3" />
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 min-w-0">
            <!-- Avatar -->
            <div 
              class="w-9 h-9 rounded-xl flex items-center justify-center font-bold uppercase text-xs shrink-0"
              :class="isSuperAdminRoute ? 'bg-indigo-950 text-amber-400 border border-amber-500/40' : 'bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/30 text-[#00A896] dark:text-[#00E5C8]'"
            >
              {{ isSuperAdminRoute ? 'RA' : (authStore.user?.name || 'OP').substring(0, 2) }}
            </div>
            <!-- Info -->
            <div class="min-w-0">
              <p class="text-xs font-bold text-slate-800 dark:text-white truncate" :title="authStore.user?.name">
                {{ isSuperAdminRoute ? 'Super Admin RAOS' : (authStore.user?.name || 'Operador Convidado') }}
              </p>
              <p class="text-[10px] font-mono text-slate-500 truncate" :title="authStore.user?.email">
                {{ authStore.user?.email || 'admin@raos.com.br' }}
              </p>
            </div>
          </div>

          <!-- Logout Button -->
          <button 
            @click="handleLogout" 
            title="Sair do Sistema" 
            class="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer shrink-0 ml-1"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  </div>
</template>
