<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useYardStore } from './stores/yard'
import { useThemeStore } from './stores/theme'
import Sidebar from './components/Sidebar.vue'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const yardStore = useYardStore()
const themeStore = useThemeStore()
const controlTowerRef = ref(null)

onMounted(async () => {
  await yardStore.fetchTenants()
})

function openNewScheduleModal() {
  if (controlTowerRef.value?.openNewScheduleModal) {
    controlTowerRef.value.openNewScheduleModal()
  } else {
    router.push('/app')
  }
}

function openNewTenantModal() {
  if (controlTowerRef.value?.openNewTenantModal) {
    controlTowerRef.value.openNewTenantModal()
  } else {
    router.push('/admin?action=new-tenant')
  }
}

function openNewUserModal() {
  if (controlTowerRef.value?.openNewUserModal) {
    controlTowerRef.value.openNewUserModal()
  } else {
    router.push('/admin?action=new-user')
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-[#00142c] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-[#00A896] selection:text-white relative overflow-x-hidden transition-colors duration-200">
    
    <!-- Background subtle ambient glow adaptado ao tema -->
    <div class="fixed top-0 left-1/4 w-[600px] h-[400px] bg-teal-500/5 dark:bg-[#00A896]/15 rounded-full blur-[140px] pointer-events-none"></div>
    <div class="fixed bottom-0 right-1/4 w-[500px] h-[350px] bg-sky-500/5 dark:bg-teal-400/10 rounded-full blur-[140px] pointer-events-none"></div>

    <!-- Navigation Sidebar (Lateral no Desktop & Gaveta no Mobile) -->
    <Sidebar 
      v-if="route.meta.layout !== 'blank'" 
      @open-new-schedule-modal="openNewScheduleModal" 
      @open-new-tenant-modal="openNewTenantModal"
      @open-new-user-modal="openNewUserModal"
    />

    <!-- Toast Notifications -->
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="yardStore.notification" 
        class="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl p-4 shadow-2xl flex items-center space-x-3 border backdrop-blur-md"
        :class="[
          yardStore.notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-700/80 text-emerald-200' 
            : yardStore.notification.type === 'error'
            ? 'bg-rose-950/90 border-rose-700/80 text-rose-200'
            : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xl'
        ]"
      >
        <CheckCircle2 v-if="yardStore.notification.type === 'success'" class="w-5 h-5 text-emerald-400 shrink-0" />
        <AlertCircle v-else-if="yardStore.notification.type === 'error'" class="w-5 h-5 text-rose-400 shrink-0" />
        <Info v-else class="w-5 h-5 text-teal-500 dark:text-teal-400 shrink-0" />
        <p class="text-xs font-medium">{{ yardStore.notification.message }}</p>
      </div>
    </transition>

    <!-- Main Router View (Largura 100% fluida adaptável ao monitor do cliente) -->
    <main 
      class="flex-1 w-full"
      :class="[
        route.meta.layout === 'blank' 
          ? 'p-0' 
          : 'lg:pl-64 xl:pl-72 flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 transition-all'
      ]"
    >
      <router-view v-slot="{ Component, route: currentRoute }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" :key="currentRoute.path" ref="controlTowerRef" />
        </transition>
      </router-view>
    </main>

  </div>
</template>
