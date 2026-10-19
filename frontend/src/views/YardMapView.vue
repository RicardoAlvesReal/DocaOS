<script setup>
import { ref, computed } from 'vue'
import { useYardStore } from '../stores/yard'
import YardMap from '../components/YardMap.vue'
import { 
  MapPin, 
  Warehouse, 
  Truck, 
  Navigation, 
  ShieldCheck, 
  Radio, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Layers
} from 'lucide-vue-next'

const yardStore = useYardStore()
const selectedVehicle = ref(null)

const activeVehicles = computed(() => {
  return (yardStore.schedules || []).filter(s => s.status !== 'released')
})
</script>

<template>
  <div class="space-y-6">
    
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
      <div>
        <div class="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
          <MapPin class="w-4 h-4" />
          <span>Geofencing & Telemetria em Tempo Real &bull; {{ yardStore.currentTenant?.name || 'Armazém' }}</span>
        </div>
        <h1 class="text-2xl font-black text-white">Mapa do Pátio & Cerca Eletrônica (GPS)</h1>
        <p class="text-xs text-slate-400">
          Auditoria de presença física para início do relógio de permanência (Lei Federal 11.442/2007) e rastreamento de veículos na rodovia
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <router-link
          to="/integracoes"
          class="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <Radio class="w-4 h-4 text-emerald-400" />
          <span>Configurar Rastreadores</span>
        </router-link>

        <router-link
          to="/app"
          class="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <span>Ir para Torre de Controle</span>
          <ChevronRight class="w-4 h-4" />
        </router-link>
      </div>
    </div>

    <!-- Cards de Resumo Geográfico -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5">
        <div class="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
          <Warehouse class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs text-slate-400">Coordenadas do Centro de Distribuição</p>
          <p class="text-sm font-bold font-mono text-white mt-0.5">
            {{ yardStore.currentTenant?.latitude?.toFixed(4) || '-20.3155' }}, {{ yardStore.currentTenant?.longitude?.toFixed(4) || '-40.3128' }}
          </p>
        </div>
      </div>

      <div class="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5">
        <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs text-slate-400">Raio de Geofencing Anti-Fraude</p>
          <p class="text-sm font-bold font-mono text-emerald-400 mt-0.5">
            {{ yardStore.currentTenant?.geofence_radius_meters || 1000 }} metros
            <span class="text-xs font-normal text-slate-400">({{ yardStore.currentTenant?.require_geofence ? 'Obrigatório' : 'Auditoria Passiva' }})</span>
          </p>
        </div>
      </div>

      <div class="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3.5">
        <div class="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
          <Truck class="w-5 h-5" />
        </div>
        <div>
          <p class="text-xs text-slate-400">Veículos em Movimentação Ativa</p>
          <p class="text-sm font-bold font-mono text-amber-400 mt-0.5">
            {{ activeVehicles.length }} veículos monitorados
          </p>
        </div>
      </div>
    </div>

    <!-- Componente Principal do Mapa Interativo -->
    <YardMap height="600px" />

    <!-- Tabela de Veículos e Posições GPS -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      <div class="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 class="text-base font-extrabold text-white flex items-center space-x-2">
            <span>Registro de Posições & Auditoria GPS de Veículos</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {{ activeVehicles.length }} agendados
            </span>
          </h2>
          <p class="text-xs text-slate-400">Confronto de coordenadas do motorista/rastreador com o portão do armazém</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-800/80 text-[11px] font-mono uppercase text-slate-400 bg-slate-950/40">
              <th class="py-3 px-4">Placa / Veículo</th>
              <th class="py-3 px-4">Motorista / Transportadora</th>
              <th class="py-3 px-4">Status no Pátio</th>
              <th class="py-3 px-4">Distância Auditada</th>
              <th class="py-3 px-4">Validação Cerca</th>
              <th class="py-3 px-4 text-right">Horário Check-in</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-xs">
            <tr 
              v-for="s in activeVehicles" 
              :key="s.id"
              class="hover:bg-slate-800/30 transition-colors"
            >
              <td class="py-3.5 px-4">
                <span class="font-mono font-bold text-white text-sm tracking-wider">{{ s.vehicle_plate }}</span>
              </td>
              <td class="py-3.5 px-4">
                <p class="font-semibold text-slate-200">{{ s.driver_name || 'Aguardando motorista' }}</p>
                <p class="text-[11px] text-slate-500 font-mono">{{ s.carrier_name || 'Transportadora' }}</p>
              </td>
              <td class="py-3.5 px-4">
                <span 
                  class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase"
                  :class="{
                    'bg-amber-950 text-amber-300 border border-amber-800': s.status === 'scheduled',
                    'bg-sky-950 text-sky-300 border border-sky-800': s.status === 'checked_in',
                    'bg-indigo-950 text-indigo-300 border border-indigo-800': s.status === 'docked',
                    'bg-emerald-950 text-emerald-300 border border-emerald-800': s.status === 'completed'
                  }"
                >
                  {{ s.status }}
                </span>
              </td>
              <td class="py-3.5 px-4 font-mono">
                <span v-if="s.checkin_distance_meters !== null && s.checkin_distance_meters !== undefined" class="text-sky-400 font-bold">
                  {{ Math.round(s.checkin_distance_meters) }}m do portão
                </span>
                <span v-else class="text-slate-500 italic">
                  Aproximando (em trânsito)
                </span>
              </td>
              <td class="py-3.5 px-4">
                <span 
                  v-if="s.geofence_validated"
                  class="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-lg"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  <span>Presença Confirmada</span>
                </span>
                <span 
                  v-else-if="s.checkin_distance_meters"
                  class="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded-lg"
                >
                  <AlertTriangle class="w-3.5 h-3.5" />
                  <span>Fora do Raio</span>
                </span>
                <span v-else class="text-slate-500 text-[11px]">
                  Pendente de Check-in
                </span>
              </td>
              <td class="py-3.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                {{ s.checkin_time ? new Date(s.checkin_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--' }}
              </td>
            </tr>

            <tr v-if="activeVehicles.length === 0">
              <td colspan="6" class="py-8 text-center text-slate-500">
                Nenhum veículo em operação ativa no momento.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>
