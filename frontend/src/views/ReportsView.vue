<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useYardStore } from '../stores/yard'
import { 
  BarChart3, 
  Download, 
  Clock, 
  AlertTriangle, 
  Truck, 
  Warehouse, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw,
  FileSpreadsheet,
  ArrowUpRight,
  Filter
} from 'lucide-vue-next'

const yardStore = useYardStore()

const isLoading = ref(false)
const kpisData = ref(null)
const selectedPeriod = ref('all') // 'today', '7d', '30d', 'all'
const isExporting = ref(false)

function getDateRange(period) {
  const today = new Date()
  let start = null
  let end = today.toISOString().split('T')[0]

  if (period === 'today') {
    start = end
  } else if (period === '7d') {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    start = d.toISOString().split('T')[0]
  } else if (period === '30d') {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    start = d.toISOString().split('T')[0]
  }

  return { start, end: start ? end : null }
}

async function fetchKpis() {
  if (!yardStore.currentTenant) return
  isLoading.value = true
  try {
    const { start, end } = getDateRange(selectedPeriod.value)
    let url = `/api/v1/reports/kpis?tenant_id=${yardStore.currentTenant.id}`
    if (start) url += `&start_date=${start}`
    if (end) url += `&end_date=${end}`

    const res = await fetch(url)
    if (res.ok) {
      kpisData.value = await res.json()
    }
  } catch (err) {
    console.error('Erro ao buscar relatórios:', err)
  } finally {
    isLoading.value = false
  }
}

function handleExportCsv() {
  if (!yardStore.currentTenant) return
  isExporting.value = true
  try {
    const { start, end } = getDateRange(selectedPeriod.value)
    let url = `/api/v1/reports/export-csv?tenant_id=${yardStore.currentTenant.id}`
    if (start) url += `&start_date=${start}`
    if (end) url += `&end_date=${end}`

    // Dispara download direto no navegador
    window.location.href = url
    yardStore.showNotification('Exportação iniciada! Seu arquivo .csv será baixado em instantes.', 'success')
  } catch (err) {
    yardStore.showNotification('Falha ao exportar CSV.', 'error')
  } finally {
    setTimeout(() => {
      isExporting.value = false
    }, 2000)
  }
}

watch(
  () => [yardStore.currentTenant?.id, selectedPeriod.value],
  () => {
    fetchKpis()
  }
)

onMounted(() => {
  fetchKpis()
})

function formatMinutes(min) {
  if (!min || min <= 0) return '0 min'
  const hours = Math.floor(min / 60)
  const remainingMin = Math.round(min % 60)
  if (hours > 0) {
    return `${hours}h ${remainingMin}m`
  }
  return `${remainingMin} min`
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}
</script>

<template>
  <div class="space-y-6">

    <!-- Header & Filtros -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
      <div>
        <div class="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
          <BarChart3 class="w-4 h-4" />
          <span>Inteligência Logística &bull; {{ yardStore.currentTenant?.name || 'Armazém' }}</span>
        </div>
        <h1 class="text-2xl font-black text-white">Relatórios & Auditoria de Pátio</h1>
        <p class="text-xs text-slate-400">Tempo de permanência (Dwell Time), ociosidade de docas e proteção jurídica contra multas de estadia</p>
      </div>

      <div class="flex items-center flex-wrap gap-2.5">
        <!-- Seletor de Período -->
        <div class="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700 text-xs">
          <button 
            @click="selectedPeriod = 'today'"
            class="px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
            :class="selectedPeriod === 'today' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
          >
            Hoje
          </button>
          <button 
            @click="selectedPeriod = '7d'"
            class="px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
            :class="selectedPeriod === '7d' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
          >
            7 Dias
          </button>
          <button 
            @click="selectedPeriod = '30d'"
            class="px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
            :class="selectedPeriod === '30d' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
          >
            30 Dias
          </button>
          <button 
            @click="selectedPeriod = 'all'"
            class="px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
            :class="selectedPeriod === 'all' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
          >
            Histórico Total
          </button>
        </div>

        <!-- Botão Atualizar -->
        <button 
          @click="fetchKpis" 
          :disabled="isLoading"
          class="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Recarregar Indicadores"
        >
          <RefreshCw class="w-4 h-4" :class="{'animate-spin': isLoading}" />
        </button>

        <!-- Botão Exportar CSV -->
        <button
          @click="handleExportCsv"
          :disabled="isExporting"
          class="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <FileSpreadsheet class="w-4 h-4" />
          <span>{{ isExporting ? 'Exportando...' : 'Exportar Laudo CSV' }}</span>
        </button>
      </div>
    </div>

    <!-- Cards de Métricas Principais (KPIs) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- Dwell Time Médio -->
      <div class="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-sky-500/40 transition-all">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tempo Médio no Pátio</span>
          <div class="p-2 rounded-xl bg-sky-500/10 text-sky-400">
            <Clock class="w-4 h-4" />
          </div>
        </div>
        <div class="text-2xl font-black text-white">
          {{ formatMinutes(kpisData?.avg_dwell_minutes) }}
        </div>
        <p class="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
          <span>Carência padrão:</span>
          <span class="text-sky-400 font-bold">{{ yardStore.currentTenant?.grace_period_minutes || 30 }} min</span>
        </p>
      </div>

      <!-- Volume Atendido -->
      <div class="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Caminhões Atendidos</span>
          <div class="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Truck class="w-4 h-4" />
          </div>
        </div>
        <div class="text-2xl font-black text-white">
          {{ kpisData?.total_completed || 0 }} <span class="text-sm font-medium text-slate-400">/ {{ kpisData?.total_schedules || 0 }}</span>
        </div>
        <p class="text-[11px] text-slate-400 mt-1">
          Check-ins portaria: <strong class="text-indigo-400">{{ kpisData?.total_checked_in || 0 }}</strong>
        </p>
      </div>

      <!-- Tempo Médio em Doca -->
      <div class="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-sky-500/40 transition-all">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tempo Médio em Doca</span>
          <div class="p-2 rounded-xl bg-sky-500/10 text-sky-400">
            <Warehouse class="w-4 h-4" />
          </div>
        </div>
        <div class="text-2xl font-black text-white">
          {{ formatMinutes(kpisData?.avg_dock_minutes) }}
        </div>
        <p class="text-[11px] text-slate-400 mt-1">
          Operação física de carga/descarga
        </p>
      </div>

      <!-- Multas de Estadia / Risco -->
      <div class="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estadias Excedentes</span>
          <div class="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle class="w-4 h-4" />
          </div>
        </div>
        <div class="text-2xl font-black text-amber-400">
          {{ formatCurrency(kpisData?.detention_fee_total) }}
        </div>
        <p class="text-[11px] text-slate-400 mt-1">
          <strong class="text-rose-400">{{ kpisData?.overdue_sla_count || 0 }}</strong> veículos com estouro de tolerância
        </p>
      </div>

    </div>

    <!-- Tabela Analítica por Transportadora (Fator Negociação) -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      <div class="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 class="text-base font-extrabold text-white flex items-center space-x-2">
            <span>Performance por Transportadora</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {{ kpisData?.carriers_kpis?.length || 0 }} transportadoras
            </span>
          </h2>
          <p class="text-xs text-slate-400">Tempo de permanência e histórico de diárias por parceiro logístico</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <th class="py-3 px-4">Transportadora</th>
              <th class="py-3 px-4 text-center">Viagens Atendidas</th>
              <th class="py-3 px-4 text-center">Tempo Médio Pátio</th>
              <th class="py-3 px-4 text-center">Viagens com Atraso</th>
              <th class="py-3 px-4 text-right">Estadia Estimada (R$)</th>
              <th class="py-3 px-4 text-center">Status SLA</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50">
            <tr 
              v-for="c in kpisData?.carriers_kpis" 
              :key="c.carrier_name"
              class="hover:bg-slate-800/30 transition-colors"
            >
              <td class="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                <Truck class="w-3.5 h-3.5 text-sky-400" />
                <span>{{ c.carrier_name }}</span>
              </td>
              <td class="py-3.5 px-4 text-center font-semibold text-slate-200">
                {{ c.trip_count }}
              </td>
              <td class="py-3.5 px-4 text-center font-mono font-medium text-slate-300">
                {{ formatMinutes(c.avg_dwell_minutes) }}
              </td>
              <td class="py-3.5 px-4 text-center">
                <span 
                  v-if="c.overdue_count > 0"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30"
                >
                  {{ c.overdue_count }} atrasos
                </span>
                <span v-else class="text-emerald-400 text-[11px] font-medium flex items-center justify-center space-x-1">
                  <CheckCircle2 class="w-3 h-3" />
                  <span>100% no prazo</span>
                </span>
              </td>
              <td class="py-3.5 px-4 text-right font-mono font-bold" :class="c.detention_fee_total > 0 ? 'text-amber-400' : 'text-slate-400'">
                {{ formatCurrency(c.detention_fee_total) }}
              </td>
              <td class="py-3.5 px-4 text-center">
                <span 
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                  :class="c.overdue_count === 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'"
                >
                  {{ c.overdue_count === 0 ? 'Dentro do SLA' : 'Risco Operacional' }}
                </span>
              </td>
            </tr>
            <tr v-if="!kpisData?.carriers_kpis?.length">
              <td colspan="6" class="py-8 text-center text-slate-500">
                Nenhum registro de transporte encontrado para o período selecionado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Ocupação e Utilização de Docas Físicas -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
      <div class="mb-4">
        <h2 class="text-base font-extrabold text-white flex items-center space-x-2">
          <span>Ocupação & Fluxo de Docas</span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {{ kpisData?.docks_kpis?.length || 0 }} docas
          </span>
        </h2>
        <p class="text-xs text-slate-400">Distribuição de movimentação por doca no armazém</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div 
          v-for="dock in kpisData?.docks_kpis"
          :key="dock.dock_id"
          class="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between"
        >
          <div>
            <div class="flex items-center space-x-1.5 mb-1">
              <span class="w-2 h-2 rounded-full" :class="dock.status === 'Ocupada' ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'"></span>
              <span class="text-xs font-bold text-white">{{ dock.dock_name }}</span>
            </div>
            <p class="text-[10px] text-slate-400">{{ dock.dock_type }} &bull; Status: <strong :class="dock.status === 'Ocupada' ? 'text-rose-400' : 'text-emerald-400'">{{ dock.status }}</strong></p>
          </div>
          <div class="text-right">
            <span class="text-lg font-black text-sky-400">{{ dock.appointments_count }}</span>
            <p class="text-[9px] uppercase font-bold text-slate-500">Agendamentos</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
