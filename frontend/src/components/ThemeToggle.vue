<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'
import { Sun, Moon } from 'lucide-vue-next'

const props = defineProps({
  compact: {
    type: Boolean,
    default: false
  },
  showLabel: {
    type: Boolean,
    default: true
  }
})

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

function handleToggle() {
  themeStore.toggleTheme()
}
</script>

<template>
  <!-- Modo Compacto (Apenas cone para Barras Superiores) -->
  <button
    v-if="compact"
    @click="handleToggle"
    type="button"
    class="p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border"
    :class="[
      isDark
        ? 'bg-[#001c3d] hover:bg-[#062d59] text-amber-300 border-teal-500/30 hover:border-amber-400/50 shadow-sm'
        : 'bg-white hover:bg-slate-100 text-teal-700 border-slate-200 hover:border-teal-500/50 shadow-sm'
    ]"
    :title="isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'"
    :aria-label="isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'"
  >
    <Sun v-if="isDark" class="w-4 h-4 text-amber-300 transition-transform hover:rotate-45" />
    <Moon v-else class="w-4 h-4 text-teal-700 transition-transform hover:-rotate-12" />
  </button>

  <!-- Modo Completo com Switch (Para Sidebar e Menus) -->
  <div
    v-else
    @click="handleToggle"
    class="w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group"
    :class="[
      isDark
        ? 'bg-[#042042] hover:bg-[#072c5a] border-teal-500/20 text-slate-200'
        : 'bg-slate-100/80 hover:bg-slate-200/80 border-slate-200 text-slate-800'
    ]"
    role="button"
    tabindex="0"
    :title="isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'"
  >
    <div class="flex items-center space-x-2.5 min-w-0">
      <div
        class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0"
        :class="isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-teal-500/10 text-teal-700'"
      >
        <Sun v-if="isDark" class="w-4 h-4" />
        <Moon v-else class="w-4 h-4" />
      </div>
      <div v-if="showLabel" class="min-w-0">
        <span class="text-xs font-bold block truncate">
          {{ isDark ? 'Modo Escuro' : 'Modo Claro' }}
        </span>
        <span class="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
          {{ isDark ? 'Visual corporativo noturno' : 'Visual clean diurno' }}
        </span>
      </div>
    </div>

    <!-- Toggle Pill Visual -->
    <div
      class="w-10 h-5 rounded-full p-0.5 transition-colors relative flex items-center shrink-0"
      :class="isDark ? 'bg-[#00A896]' : 'bg-slate-300'"
    >
      <div
        class="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center"
        :class="isDark ? 'translate-x-5' : 'translate-x-0'"
      >
        <div class="w-1.5 h-1.5 rounded-full" :class="isDark ? 'bg-[#00A896]' : 'bg-slate-400'"></div>
      </div>
    </div>
  </div>
</template>
