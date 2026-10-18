<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useYardStore } from '../stores/yard'
import { useAuthStore } from '../stores/auth'
import { 
  LayoutDashboard, 
  DoorClosed, 
  ScanLine, 
  ShieldCheck, 
  Warehouse, 
  PlusCircle,
  Truck,
  LogOut
} from 'lucide-vue-next'

const yardStore = useYardStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const emit = defineEmits(['openNewScheduleModal'])

// O Super Admin foi REMOVIDO dos links públicos visíveis aos usuários
const navItems = [
  { name: 'Torre de Controle', path: '/', icon: LayoutDashboard },
  { name: 'Docas', path: '/docas', icon: DoorClosed },
  { name: 'Portaria & Cancela', path: '/portaria', icon: ScanLine }
]

function onTenantChange(event) {
  const selected = yardStore.tenants.find(t => t.id === event.target.value)
  if (selected) {
    yardStore.selectTenant(selected)
  }
}

function handleLogoutAdmin() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        
        <!-- Logo & Brand -->
        <div class="flex items-center space-x-3 cursor-pointer" @click="router.push('/')">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Truck class="w-5 h-5 text-white" />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                RotaFlow
              </span>
              <span class="text-xs uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                YMS
              </span>
            </div>
            <p class="text-[10px] text-slate-400 font-medium">Orquestração de Pátios & Docas</p>
          </div>
        </div>

        <!-- Navigation Links (Apenas rotas operacionais padrão) -->
        <nav class="hidden md:flex items-center space-x-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            :class="[
              route.path === item.path
                ? 'bg-sky-600/10 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            ]"
          >
            <component :is="item.icon" class="w-4 h-4" />
            <span>{{ item.name }}</span>
          </router-link>
        </nav>

        <!-- Right Side: Tenant Selector, Realtime & Actions -->
        <div class="flex items-center space-x-3">
          
          <!-- Se estiver logado como Super Admin, exibe badge exclusivo e link para /admin -->
          <div v-if="authStore.isSuperAdmin" class="flex items-center space-x-2 bg-indigo-950/80 border border-indigo-700/80 px-2.5 py-1 rounded-xl text-xs">
            <router-link to="/admin" class="flex items-center space-x-1.5 text-indigo-300 hover:text-white font-semibold">
              <ShieldCheck class="w-3.5 h-3.5 text-indigo-400" />
              <span>Painel RAOS</span>
            </router-link>
            <button 
              @click="handleLogoutAdmin" 
              title="Sair do modo Super Admin" 
              class="text-indigo-400 hover:text-rose-400 pl-1 border-l border-indigo-800/80 cursor-pointer"
            >
              <LogOut class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Tenant Dropdown -->
          <div v-if="yardStore.tenants.length > 0" class="flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Warehouse class="w-3.5 h-3.5 text-slate-400" />
            <select
              :value="yardStore.currentTenant?.id"
              @change="onTenantChange"
              class="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
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
          </div>

          <!-- Realtime WS indicator -->
          <div 
            class="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors"
            :class="[
              yardStore.isWsConnected 
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80' 
                : 'bg-amber-950/60 text-amber-400 border-amber-800/80'
            ]"
            :title="yardStore.isWsConnected ? 'Sincronização em tempo real ativa' : 'Reconectando WebSocket...'"
          >
            <span 
              class="w-2 h-2 rounded-full animate-pulse"
              :class="yardStore.isWsConnected ? 'bg-emerald-400' : 'bg-amber-400'"
            ></span>
            <span class="font-mono text-[11px] font-semibold">
              {{ yardStore.isWsConnected ? 'REALTIME' : 'CONECTANDO' }}
            </span>
          </div>

          <!-- New Appointment Button -->
          <button
            @click="emit('openNewScheduleModal')"
            class="flex items-center space-x-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle class="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>

      </div>
    </div>
  </header>
</template>
