<script setup>
import { ref, computed } from 'vue'
import { useYardStore } from '../stores/yard'
import { 
  DoorClosed, 
  PlusCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Truck,
  X
} from 'lucide-vue-next'

const yardStore = useYardStore()
const isNewDockModalOpen = ref(false)
const newDockForm = ref({
  code: '',
  name: '',
  dock_type: 'Geral',
  status: 'Livre'
})
const dockError = ref('')
const isSubmitting = ref(false)

const maxDocks = computed(() => yardStore.currentTenant?.max_docks || 10)
const isLimitReached = computed(() => yardStore.docks.length >= maxDocks.value)

function openModal() {
  newDockForm.value = {
    code: `DOCA-${(yardStore.docks.length + 1).toString().padStart(2, '0')}`,
    name: `Doca ${(yardStore.docks.length + 1).toString().padStart(2, '0')} - Carga Geral`,
    dock_type: 'Geral',
    status: 'Livre'
  }
  dockError.value = ''
  isNewDockModalOpen.value = true
}

async function createDock() {
  dockError.value = ''
  isSubmitting.value = true
  try {
    const res = await fetch('/api/v1/docks/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newDockForm.value,
        tenant_id: yardStore.currentTenant?.id
      })
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Falha ao cadastrar doca.')
    }

    await yardStore.fetchDocks()
    isNewDockModalOpen.value = false
    yardStore.showNotification(`Doca ${newDockForm.value.code} cadastrada!`, 'success')
  } catch (err) {
    dockError.value = err.message
  } finally {
    isSubmitting.value = false
  }
}

async function toggleDockMaintenance(dock) {
  const newStatus = dock.status === 'Manutenção' ? 'Livre' : 'Manutenção'
  try {
    const res = await fetch(`/api/v1/docks/${dock.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })

    if (res.ok) {
      await yardStore.fetchDocks()
      yardStore.showNotification(`Doca ${dock.code} alterada para ${newStatus}`, 'info')
    }
  } catch (err) {
    console.error(err)
  }
}
</script>

<template>
  <div class="space-y-6">
    
    <!-- Header with Capacity Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm">
      <div>
        <h1 class="text-xl font-extrabold text-white">Mapeamento Físico de Docas</h1>
        <p class="text-xs text-slate-400 mt-1">Configuração das portas de carga/descarga e controle de ocupação</p>
      </div>

      <div class="flex items-center space-x-4">
        <!-- License quota pill -->
        <div class="bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl text-xs font-mono">
          <span class="text-slate-400">Docas Licenciadas: </span>
          <span class="font-bold text-sky-400">{{ yardStore.docks.length }}</span>
          <span class="text-slate-500"> / {{ maxDocks }}</span>
        </div>

        <button
          @click="openModal"
          :disabled="isLimitReached"
          class="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-sky-600/30 transition-all cursor-pointer"
        >
          <PlusCircle class="w-4 h-4" />
          <span>Cadastrar Doca</span>
        </button>
      </div>
    </div>

    <!-- Docks Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="dock in yardStore.docks"
        :key="dock.id"
        class="bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all relative overflow-hidden"
        :class="[
          dock.status === 'Ocupada'
            ? 'border-indigo-600/50 bg-indigo-950/10'
            : dock.status === 'Manutenção'
            ? 'border-amber-600/50 bg-amber-950/10'
            : 'border-slate-800 hover:border-slate-700'
        ]"
      >
        <div class="flex items-start justify-between mb-3">
          <div>
            <span class="font-mono text-sm font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {{ dock.code }}
            </span>
            <h3 class="text-xs font-bold text-slate-200 mt-2 truncate">{{ dock.name }}</h3>
          </div>

          <span 
            class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border"
            :class="[
              dock.status === 'Livre' 
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' 
                : dock.status === 'Ocupada' 
                ? 'bg-indigo-950/60 text-indigo-400 border-indigo-800' 
                : 'bg-amber-950/60 text-amber-400 border-amber-800'
            ]"
          >
            {{ dock.status }}
          </span>
        </div>

        <div class="text-xs text-slate-400 space-y-1 mb-4">
          <div class="flex justify-between">
            <span class="text-slate-500">Tipo:</span>
            <span class="text-slate-300 font-medium">{{ dock.dock_type }}</span>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <button
            @click="toggleDockMaintenance(dock)"
            class="text-slate-400 hover:text-amber-400 flex items-center space-x-1 text-[11px] cursor-pointer"
          >
            <Wrench class="w-3.5 h-3.5" />
            <span>{{ dock.status === 'Manutenção' ? 'Liberar Doca' : 'Pôr em Manutenção' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Nova Doca -->
    <div 
      v-if="isNewDockModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <h3 class="font-bold text-base text-white">Cadastrar Nova Doca Física</h3>
          <button @click="isNewDockModalOpen = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="createDock" class="space-y-4">
          <div v-if="dockError" class="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
            {{ dockError }}
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Código da Doca *</label>
            <input
              v-model="newDockForm.code"
              type="text"
              required
              placeholder="Ex: DOCA-05"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Nome de Identificação *</label>
            <input
              v-model="newDockForm.name"
              type="text"
              required
              placeholder="Ex: Doca 05 - Carga Seca"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Tipo de Doca</label>
            <select
              v-model="newDockForm.dock_type"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Geral">Carga Geral</option>
              <option value="Seca">Carga Seca</option>
              <option value="Frigorífica">Frigorífica (Reefer)</option>
              <option value="Granel">Granel</option>
            </select>
          </div>

          <div class="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="isNewDockModalOpen = false"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
            >
              {{ isSubmitting ? 'Salvando...' : 'Salvar Doca' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
