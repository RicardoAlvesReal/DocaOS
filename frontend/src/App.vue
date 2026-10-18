<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useYardStore } from './stores/yard'
import Navbar from './components/Navbar.vue'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'

const route = useRoute()
const yardStore = useYardStore()
const controlTowerRef = ref(null)

onMounted(async () => {
  await yardStore.fetchTenants()
})

function openNewScheduleModal() {
  if (controlTowerRef.value?.openNewScheduleModal) {
    controlTowerRef.value.openNewScheduleModal()
  } else {
    // Se não estiver na Torre de Controle, navega para ela e abre o modal
    window.location.href = '/'
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white relative overflow-x-hidden">
    
    <!-- Background subtle ambient glow -->
    <div class="fixed top-0 left-1/4 w-[600px] h-[400px] bg-sky-600/10 rounded-full blur-[140px] pointer-events-none"></div>
    <div class="fixed bottom-0 right-1/4 w-[500px] h-[350px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>

    <!-- Navigation Header (Hidden on driver mobile portal) -->
    <Navbar 
      v-if="route.meta.layout !== 'blank'" 
      @open-new-schedule-modal="openNewScheduleModal" 
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
            : 'bg-slate-900/90 border-slate-700 text-slate-200'
        ]"
      >
        <CheckCircle2 v-if="yardStore.notification.type === 'success'" class="w-5 h-5 text-emerald-400 shrink-0" />
        <AlertCircle v-else-if="yardStore.notification.type === 'error'" class="w-5 h-5 text-rose-400 shrink-0" />
        <Info v-else class="w-5 h-5 text-sky-400 shrink-0" />
        <p class="text-xs font-medium">{{ yardStore.notification.message }}</p>
      </div>
    </transition>

    <!-- Main Router View -->
    <main 
      class="flex-1 w-full"
      :class="[route.meta.layout === 'blank' ? 'p-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6']"
    >
      <router-view v-slot="{ Component }">
        <component :is="Component" ref="controlTowerRef" />
      </router-view>
    </main>

  </div>
</template>
