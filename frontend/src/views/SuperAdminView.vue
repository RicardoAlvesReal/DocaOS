<script setup>
import { ref, onMounted } from 'vue'
import { useYardStore } from '../stores/yard'
import { 
  ShieldAlert, 
  Building2, 
  PlusCircle, 
  DoorClosed, 
  Clock, 
  DollarSign, 
  CheckCircle2,
  X
} from 'lucide-vue-next'

import { useAuthStore } from '../stores/auth'

const yardStore = useYardStore()
const authStore = useAuthStore()
const isNewTenantModalOpen = ref(false)
const newTenantForm = ref({
  name: '',
  slug: '',
  cnpj: '',
  max_docks: 8,
  grace_period_minutes: 30,
  detention_fee_per_hour: 150.0
})
const isSubmitting = ref(false)
const tenantError = ref('')

async function createTenant() {
  tenantError.value = ''
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
    yardStore.showNotification(`Cliente ${newTenantForm.value.name} provisionado com sucesso!`, 'success')
  } catch (err) {
    tenantError.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    
    <!-- Top Super Admin Banner -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/50 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldAlert class="w-4 h-4" />
          <span>Acesso Exclusivo &bull; RAOS Tecnologia</span>
        </div>
        <h1 class="text-xl font-extrabold text-white">Gestão Central de Clientes (Tenants)</h1>
        <p class="text-xs text-slate-400">Provisionamento manual de armazéns logísticos e licenças de docas</p>
      </div>

      <button
        @click="isNewTenantModalOpen = true"
        class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
      >
        <PlusCircle class="w-4 h-4" />
        <span>Provisionar Novo Armazém</span>
      </button>
    </div>

    <!-- Tenants List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="tenant in yardStore.tenants"
        :key="tenant.id"
        class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition-colors"
      >
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-sm font-bold text-white">{{ tenant.name }}</h3>
            <p class="text-xs font-mono text-slate-500 mt-0.5">slug: {{ tenant.slug }}</p>
          </div>
          <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
            Ativo
          </span>
        </div>

        <div class="space-y-2 text-xs bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
          <div class="flex items-center justify-between">
            <span class="text-slate-400 flex items-center space-x-1.5">
              <DoorClosed class="w-3.5 h-3.5 text-sky-400" />
              <span>Docas Licenciadas:</span>
            </span>
            <span class="font-mono font-bold text-white">{{ tenant.max_docks }}</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-slate-400 flex items-center space-x-1.5">
              <Clock class="w-3.5 h-3.5 text-amber-400" />
              <span>Tempo de Carência:</span>
            </span>
            <span class="font-mono font-bold text-white">{{ tenant.grace_period_minutes }} min</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-slate-400 flex items-center space-x-1.5">
              <DollarSign class="w-3.5 h-3.5 text-rose-400" />
              <span>Multa de Estadia:</span>
            </span>
            <span class="font-mono font-bold text-white">R$ {{ tenant.detention_fee_per_hour }}/hora</span>
          </div>
        </div>

        <button
          @click="yardStore.selectTenant(tenant)"
          class="w-full py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:border-sky-500 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          Acessar como Este Operador
        </button>
      </div>
    </div>

    <!-- Modal: Novo Tenant -->
    <div
      v-if="isNewTenantModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <h3 class="font-bold text-base text-white">Provisionar Cliente (Armazém Logístico)</h3>
          <button @click="isNewTenantModalOpen = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="createTenant" class="space-y-4">
          <div v-if="tenantError" class="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
            {{ tenantError }}
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Nome do Operador *</label>
              <input
                v-model="newTenantForm.name"
                type="text"
                required
                placeholder="Ex: GDL Logística"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Slug URL *</label>
              <input
                v-model="newTenantForm.slug"
                type="text"
                required
                placeholder="Ex: gdl-logistica"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">CNPJ</label>
            <input
              v-model="newTenantForm.cnpj"
              type="text"
              placeholder="00.000.000/0000-00"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Limite Docas *</label>
              <input
                v-model.number="newTenantForm.max_docks"
                type="number"
                min="1"
                required
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Carência (min) *</label>
              <input
                v-model.number="newTenantForm.grace_period_minutes"
                type="number"
                min="0"
                required
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Multa R$/hora *</label>
              <input
                v-model.number="newTenantForm.detention_fee_per_hour"
                type="number"
                min="0"
                step="10"
                required
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
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
              class="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {{ isSubmitting ? 'Provisionando...' : 'Criar e Licenciar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
