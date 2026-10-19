<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ShieldCheck, 
  Clock, 
  Truck, 
  Warehouse, 
  FileSpreadsheet, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  QrCode, 
  Network, 
  PhoneCall, 
  Mail,
  Building2, 
  ExternalLink,
  ChevronRight,
  X,
  Copy,
  Check,
  FileCheck2,
  Sliders,
  Sparkles,
  GraduationCap,
  Cpu,
  Users,
  MapPin
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleEnterDemo() {
  authStore.enterDemoMode()
  router.push('/app')
}

// Contatos Oficiais RAOS Tecnologia
const contactInfo = {
  whatsappRaw: '27996174965',
  whatsappDisplay: '(27) 99617-4965',
  email: 'contato@raostecnologia.com.br',
  cnpj: '66.914.167/0001-76',
  company: 'RAOS Tecnologia'
}

const copiedEmail = ref(false)
function copyEmail() {
  navigator.clipboard.writeText(contactInfo.email)
  copiedEmail.value = true
  setTimeout(() => { copiedEmail.value = false }, 2500)
}

function openWhatsAppDirect(customMessage) {
  const msg = customMessage || `Olá! Vim pelo site da RotaFlow e gostaria de falar com a equipe da RAOS Tecnologia sobre a implantação do YMS no nosso armazém.`
  window.open(`https://api.whatsapp.com/send?phone=55${contactInfo.whatsappRaw}&text=${encodeURIComponent(msg)}`, '_blank')
}

// Modal de Demonstração / Piloto
const isDemoModalOpen = ref(false)
const demoForm = ref({
  name: '',
  email: '',
  company: '',
  phone: '',
  dailyTrucks: '45',
  notes: ''
})
const isSubmittingDemo = ref(false)
const demoSuccess = ref(false)

function handleDemoSubmit() {
  isSubmittingDemo.value = true
  setTimeout(() => {
    isSubmittingDemo.value = false
    demoSuccess.value = true
  }, 900)
}

// Calculadora de ROI Interativa Realista (Lei 11.442/2007)
const dailyTrucks = ref(45)
const avgDwellHours = ref(6.5) // horas médias de permanência
const hourlyFee = ref(160) // R$ por hora excedente além de 5h
const toleranceHours = 5.0 // Lei 11.442/2007

const calculatedRoi = computed(() => {
  const excess = Math.max(0, avgDwellHours.value - toleranceHours)
  const monthlyTrucks = dailyTrucks.value * 22
  // ~35% das carretas sofrem retenção com cobrança
  const billedTrucks = Math.round(monthlyTrucks * 0.35)
  const monthlyCostWithoutYms = Math.round(billedTrucks * excess * hourlyFee.value)
  // RotaFlow reduz o Dwell Time em até 78%
  const monthlySavings = Math.round(monthlyCostWithoutYms * 0.78)
  const hoursSavedPerYear = Math.round(monthlyTrucks * excess * 12 * 0.75)

  return {
    excessHours: excess.toFixed(1),
    monthlyCost: monthlyCostWithoutYms,
    monthlySavings,
    hoursSavedPerYear
  }
})

function formatBRL(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)
}

// Simulador de Webhook Payload Ativo
const activeWebhookEvent = ref('gate.checkin')
const webhookPayloads = {
  'gate.checkin': {
    event: 'gate.checkin_completed',
    timestamp: '2026-10-18T14:32:04.112Z',
    hub_id: 'hub_vitoria_es',
    data: {
      schedule_id: 'sch_884f2910',
      vehicle_plate: 'BRA2E19',
      driver_name: 'Marcos Vinícius Silva',
      carrier_name: 'Braspress Transportes',
      dwell_clock_started_at: '14:32:04',
      assigned_dock: 'Doca 04 (Secos & Carga Geral)',
      legal_sla_limit_at: '19:32:04'
    }
  },
  'dock.called': {
    event: 'dock.driver_called',
    timestamp: '2026-10-18T15:10:22.845Z',
    hub_id: 'hub_vitoria_es',
    data: {
      schedule_id: 'sch_884f2910',
      vehicle_plate: 'BRA2E19',
      target_dock_id: 'DOCA-04',
      notification_sent_via: 'WhatsApp + Push PWA',
      wait_time_minutes: 38
    }
  },
  'gate.checkout': {
    event: 'gate.checkout_authorized',
    timestamp: '2026-10-18T16:48:15.002Z',
    hub_id: 'hub_vitoria_es',
    data: {
      schedule_id: 'sch_884f2910',
      total_dwell_minutes: 136,
      legal_status: 'DENTRO_DA_TOLERANCIA_5H',
      detention_fee_due: 0.00,
      currency: 'BRL'
    }
  },
  'telemetry.ping': {
    event: 'telemetry.gps_received',
    timestamp: '2026-10-18T14:15:00.000Z',
    hub_id: 'hub_vitoria_es',
    data: {
      provider: 'Autotrac / Sascar / OnixSat / Cobli',
      vehicle_plate: 'BRA2E19',
      latitude: -20.3150,
      longitude: -40.3120,
      distance_to_yard_meters: 1450,
      estimated_arrival_minutes: 6,
      geofence_status: 'APPROACHING'
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#070a12] text-slate-100 font-sans selection:bg-sky-500 selection:text-white relative overflow-x-hidden">

    <!-- HEADER / TOPBAR CORPORATIVA -->
    <header class="border-b border-slate-800/80 bg-[#070a12]/95 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <!-- Marca Principal RotaFlow -->
        <div class="flex items-center space-x-3 cursor-pointer" @click="router.push('/')">
          <div class="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 p-1 flex items-center justify-center">
            <img src="/rotaflow-icon.png" alt="RotaFlow" class="w-full h-full object-contain" />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xl font-bold tracking-tight text-white">
                Rota<span class="text-sky-400">Flow</span>
              </span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                YMS
              </span>
            </div>
            <p class="text-xs text-slate-400">Gestão de Pátios & Agendamento de Docas</p>
          </div>
        </div>

        <!-- Links de Navegação -->
        <nav class="hidden lg:flex items-center space-x-7 text-xs font-medium text-slate-300">
          <a href="#solucao" class="hover:text-white transition-colors">Visão Operacional</a>
          <a href="#arquitetura" class="hover:text-white transition-colors">Engenharia</a>
          <a href="#roi" class="hover:text-white transition-colors">Calculadora Lei 11.442</a>
          <a href="#webhooks" class="hover:text-white transition-colors">Webhooks & ERP</a>
          <a href="#servicos" class="hover:text-white transition-colors">Integrações & Treinamento</a>
        </nav>

        <!-- CTAs Diretos -->
        <div class="flex items-center space-x-3">
          <button
            @click="handleEnterDemo"
            class="hidden sm:inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-lg text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all cursor-pointer"
          >
            <Sparkles class="w-3.5 h-3.5 text-sky-400" />
            <span>Testar Sandbox</span>
          </button>

          <router-link
            to="/login"
            class="hidden sm:inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <span>Área do Cliente</span>
          </router-link>

          <button
            @click="openWhatsAppDirect()"
            class="inline-flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-all cursor-pointer"
          >
            <PhoneCall class="w-3.5 h-3.5" />
            <span>Falar com Engenharia</span>
          </button>
        </div>

      </div>
    </header>

    <!-- HERO SECTION -->
    <section class="pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      <div class="text-center space-y-6 max-w-4xl mx-auto">
        <!-- Headline Direta (duas linhas no máximo, sem gradiente) -->
        <h1 class="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08] max-w-4xl mx-auto">
          Orquestração de pátios e blindagem contra sobreestadias.
        </h1>

        <!-- Statement Parágrafo -->
        <p class="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
          O <strong>RotaFlow YMS</strong> elimina filas na portaria com check-in em segundos, direciona caminhões para docas livres e audita o <em>Dwell Time</em> sob a <strong>Lei Federal 11.442/2007</strong>.
        </p>

        <!-- Botões de Ação Imediata (Sólidos, sem gradientes) -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            @click="openWhatsAppDirect('Olá! Gostaria de agendar uma apresentação de 20 minutos do RotaFlow YMS para o nosso terminal logístico.')"
            class="w-full sm:w-auto flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-6 py-3.5 rounded-lg transition-all cursor-pointer"
          >
            <span>Falar com o Time de Engenharia</span>
            <ArrowRight class="w-4 h-4" />
          </button>

          <button
            @click="handleEnterDemo"
            class="w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold px-6 py-3.5 rounded-lg transition-all cursor-pointer"
          >
            <Sparkles class="w-4 h-4 text-sky-400" />
            <span>Explorar Demonstração Interativa</span>
          </button>
        </div>

        <!-- Telemetria Rápida / Prova de Performance -->
        <div class="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3.5 text-left max-w-4xl mx-auto">
          <div class="bg-[#0e1422] border border-slate-800 p-4 rounded-xl">
            <span class="text-xs text-slate-400 block font-medium">Tempo de Portaria</span>
            <span class="text-2xl font-bold font-mono text-emerald-400 mt-1 block">&lt; 40 segundos</span>
            <span class="text-xs text-slate-400 block mt-1">com QR Code óptico</span>
          </div>
          <div class="bg-[#0e1422] border border-slate-800 p-4 rounded-xl">
            <span class="text-xs text-slate-400 block font-medium">Lei 11.442 / Art 5º-A</span>
            <span class="text-2xl font-bold font-mono text-sky-400 mt-1 block">Tolerância 5h</span>
            <span class="text-xs text-slate-400 block mt-1">relatório auditável</span>
          </div>
          <div class="bg-[#0e1422] border border-slate-800 p-4 rounded-xl">
            <span class="text-xs text-slate-400 block font-medium">Ocupação de Docas</span>
            <span class="text-2xl font-bold font-mono text-white mt-1 block">Zero Conflito</span>
            <span class="text-xs text-slate-400 block mt-1">reserva atômica de janela</span>
          </div>
          <div class="bg-[#0e1422] border border-slate-800 p-4 rounded-xl">
            <span class="text-xs text-slate-400 block font-medium">Disponibilidade</span>
            <span class="text-2xl font-bold font-mono text-white mt-1 block">99.9% SLA</span>
            <span class="text-xs text-slate-400 block mt-1">telemetria em tempo real</span>
          </div>
        </div>
      </div>

      <!-- SHOWCASE OPERACIONAL REAL -->
      <div id="solucao" class="pt-6">
        <div class="bg-[#0e1422] border border-slate-800 rounded-2xl p-5 sm:p-7">
          
          <!-- Terminal Header Autêntico (sem fake mac dots) -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-2">
            <div class="flex items-center space-x-2 text-xs text-slate-300">
              <span class="font-bold text-white">ROTAFLOW YMS</span>
              <span class="text-slate-600">&bull;</span>
              <span>TERMINAL VITÓRIA HUB 01</span>
              <span class="text-slate-600">&bull;</span>
              <span class="text-slate-400">TELEMETRIA EM TEMPO REAL</span>
            </div>

            <div class="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>CANAL AO VIVO ATIVO</span>
            </div>
          </div>

          <!-- Grid Interno: 3 Colunas Kanban + Telemetria Lateral -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            <!-- Colunas Kanban -->
            <div class="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              <!-- Coluna 1: No Pátio -->
              <div class="bg-[#070a12] border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-amber-400 flex items-center space-x-1.5">
                    <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>NO PÁTIO (12)</span>
                  </span>
                  <span class="text-slate-400 text-xs">Fila de Espera</span>
                </div>

                <!-- Card 1 -->
                <div class="bg-[#0e1422] border border-amber-500/30 rounded-lg p-3 space-y-2">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-xs text-slate-400">Cavalo Mecânico</span>
                      <p class="font-mono font-bold text-xs text-white">BRA2E19 &bull; Scania 450</p>
                    </div>
                    <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                      02h 45m
                    </span>
                  </div>
                  <div class="text-xs text-slate-400">
                    <p>Braspress &bull; Carga Geral</p>
                    <p class="text-amber-400 text-xs mt-0.5">Janela SLA: 02h 15m restantes</p>
                  </div>
                </div>

                <!-- Card 2 -->
                <div class="bg-[#0e1422] border border-slate-800 rounded-lg p-3 space-y-2">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-xs text-slate-400">Carreta Baú</span>
                      <p class="font-mono font-bold text-xs text-white">RTE8H22 &bull; Volvo FH</p>
                    </div>
                    <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      01h 10m
                    </span>
                  </div>
                  <div class="text-xs text-slate-400">
                    <p>Jamef Encomendas</p>
                  </div>
                </div>
              </div>

              <!-- Coluna 2: Em Operação de Doca -->
              <div class="bg-[#070a12] border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-sky-400 flex items-center space-x-1.5">
                    <span class="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>EM DOCA (8)</span>
                  </span>
                  <span class="text-slate-400 text-xs">Carga/Descarga</span>
                </div>

                <!-- Card Ativo Doca 04 -->
                <div class="bg-[#0e1422] border border-sky-500/30 rounded-lg p-3 space-y-2">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-xs font-bold text-sky-400">DOCA 04</span>
                      <p class="font-mono font-bold text-xs text-white">FLW9A31 &bull; DAF XF</p>
                    </div>
                    <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                      00h 42m
                    </span>
                  </div>
                  <div class="text-xs text-slate-400">
                    <p>Patrus Transportes</p>
                    <p class="text-emerald-400 text-xs mt-0.5">Descarga: 65% concluída</p>
                  </div>
                </div>

                <!-- Card Ativo Doca 07 -->
                <div class="bg-[#0e1422] border border-slate-800 rounded-lg p-3 space-y-2">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-xs font-bold text-sky-400">DOCA 07</span>
                      <p class="font-mono font-bold text-xs text-white">LOG4C55 &bull; MB Actros</p>
                    </div>
                    <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      01h 15m
                    </span>
                  </div>
                  <div class="text-xs text-slate-400">
                    <p>Reiterlog &bull; Congelados</p>
                  </div>
                </div>
              </div>

              <!-- Coluna 3: Concluídos Hoje -->
              <div class="bg-[#070a12] border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-emerald-400 flex items-center space-x-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>LIBERADOS (38)</span>
                  </span>
                  <span class="text-slate-400 text-xs">Hoje</span>
                </div>

                <div class="bg-[#0e1422] border border-emerald-500/20 rounded-lg p-3 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-bold text-xs text-white">KMT7B12</span>
                    <span class="text-xs text-emerald-400 font-mono">1h 55m total</span>
                  </div>
                  <p class="text-xs text-slate-400">FedEx Brasil &bull; Saída 14:10</p>
                  <p class="text-xs text-emerald-400">Laudo Conforme Lei 11.442</p>
                </div>
              </div>

            </div>

            <!-- Telemetria Lateral: Dispositivo do Motorista -->
            <div class="lg:col-span-4 bg-[#070a12] border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div>
                <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <span class="text-xs font-bold text-white">VISÃO DO MOTORISTA (PWA)</span>
                  <span class="text-xs text-slate-400">WhatsApp Direct</span>
                </div>

                <div class="bg-[#0e1422] border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">Motorista:</span>
                    <span class="text-white font-medium">Marcos V. Silva</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">Placa:</span>
                    <span class="font-mono font-bold text-white">BRA2E19</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">Doca Designada:</span>
                    <span class="font-bold text-sky-400">Doca 04</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">Notificação:</span>
                    <span class="text-emerald-400 font-semibold">Enviada via WhatsApp</span>
                  </div>
                </div>
              </div>

              <div class="pt-2">
                <button
                  @click="handleEnterDemo"
                  class="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-lg border border-slate-700 transition-colors cursor-pointer text-center"
                >
                  Abrir Simulador Completo
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

    </section>

    <!-- ARQUITETURA & SUBSTÂNCIA -->
    <section id="arquitetura" class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      <div class="text-center space-y-3 max-w-3xl mx-auto">
        <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Arquitetura projetada para a realidade da operação logística.
        </h2>
        <p class="text-base text-slate-300">
          Substitua planilhas paralelas e conflitos de rádio por uma esteira de dados auditável e automatizada.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Bento 1: Lei 11.442/2007 (Destaque Grande 2 Colunas) -->
        <div class="md:col-span-2 bg-[#0e1422] border border-slate-800 rounded-2xl p-8 space-y-5">
          <div class="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <FileCheck2 class="w-5 h-5" />
          </div>
          <div class="space-y-2">
            <h3 class="text-2xl font-bold text-white">
              Cálculo de Estadia sob a Lei Federal 11.442/2007 (Art. 5º-A)
            </h3>
            <p class="text-sm text-slate-300 leading-relaxed">
              Evite cobranças arbitrárias de horas paradas por transportadoras. O RotaFlow calcula exatamente a tolerância legal de 5 horas a partir do carimbo de tempo da portaria e emite relatórios com valor por tonelada/hora formatados para contestação ou pagamento transparente.
            </p>
          </div>

          <!-- Memorial de Auditoria Simulado -->
          <div class="bg-[#070a12] border border-slate-800 p-4 rounded-xl text-xs space-y-2">
            <div class="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span class="font-medium text-slate-300">RELATÓRIO DE PERMANÊNCIA AUDITADO</span>
              <span class="text-emerald-400 font-semibold">CONFORME LEI</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
              <div>
                <span class="text-slate-400 block">Check-in Portaria</span>
                <span class="text-white font-mono font-bold">14:15:22</span>
              </div>
              <div>
                <span class="text-slate-400 block">Início Doca</span>
                <span class="text-white font-mono font-bold">15:02:10</span>
              </div>
              <div>
                <span class="text-slate-400 block">Check-out Saída</span>
                <span class="text-white font-mono font-bold">18:10:05</span>
              </div>
              <div>
                <span class="text-slate-400 block">Dwell Time Total</span>
                <span class="text-sky-300 font-mono font-bold">03h 54m (&lt; 5h)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bento 2: Concorrência Atômica de Docas -->
        <div class="bg-[#0e1422] border border-slate-800 rounded-2xl p-8 space-y-4">
          <div class="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Warehouse class="w-5 h-5" />
          </div>
          <h3 class="text-xl font-bold text-white">Trava Atômica de Docas</h3>
          <p class="text-xs text-slate-300 leading-relaxed">
            Impedimento via banco de dados relacional de agendamento duplicado. Duas carretas nunca disputam a mesma janela, eliminando atritos no pátio.
          </p>
          <ul class="space-y-2 text-xs text-slate-400 pt-2">
            <li class="flex items-center space-x-2">
              <Check class="w-3.5 h-3.5 text-emerald-400" />
              <span>Separação por tipo de carga (Frio/Seco)</span>
            </li>
            <li class="flex items-center space-x-2">
              <Check class="w-3.5 h-3.5 text-emerald-400" />
              <span>Capacidade de paletes por hora</span>
            </li>
            <li class="flex items-center space-x-2">
              <Check class="w-3.5 h-3.5 text-emerald-400" />
              <span>Manutenção programada de niveladores</span>
            </li>
          </ul>
        </div>

        <!-- Bento 3: Importação em Lote CSV -->
        <div class="bg-[#0e1422] border border-slate-800 rounded-2xl p-8 space-y-4">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet class="w-5 h-5" />
          </div>
          <h3 class="text-xl font-bold text-white">Importação Massiva CSV</h3>
          <p class="text-xs text-slate-300 leading-relaxed">
            Agende dezenas de carretas com um clique. Faça upload direto da planilha da sua transportadora com validação imediata de placas Mercosul e telefones.
          </p>
          <div class="bg-[#070a12] border border-slate-800 p-3 rounded-lg text-xs text-slate-400">
            <span class="text-emerald-400 font-bold">200 agendamentos</span> processados em 1.2 segundos com sanitização imediata.
          </div>
        </div>

        <!-- Bento 4: Portaria Inteligente OCR/QR -->
        <div class="md:col-span-2 bg-[#0e1422] border border-slate-800 rounded-2xl p-8 space-y-4">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Zap class="w-5 h-5" />
            </div>
            <span class="text-xs text-slate-400 font-medium">Cancela de Entrada e Saída</span>
          </div>
          <h3 class="text-2xl font-bold text-white">Portaria & Cancela em 2 Segundos</h3>
          <p class="text-sm text-slate-300 leading-relaxed">
            Elimine as pranchetas e filas na rodovia. O operador da portaria aponta o leitor para o QR Code no celular do motorista ou digita a placa. O sistema valida os documentos, registra o horário legal e autoriza a entrada.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div class="bg-[#070a12] border border-slate-800 p-3 rounded-lg">
              <span class="text-slate-400 block text-xs">Check-in</span>
              <span class="text-white font-semibold">Entrada registrada</span>
            </div>
            <div class="bg-[#070a12] border border-slate-800 p-3 rounded-lg">
              <span class="text-slate-400 block text-xs">Convocação</span>
              <span class="text-sky-400 font-semibold">Doca sinalizada</span>
            </div>
            <div class="bg-[#070a12] border border-slate-800 p-3 rounded-lg">
              <span class="text-slate-400 block text-xs">Check-out</span>
              <span class="text-emerald-400 font-semibold">Cancela liberada</span>
            </div>
          </div>
        </div>

      </div>

    </section>

    <!-- CALCULADORA DE ROI (A Coisa Viva / Substance) -->
    <section id="roi" class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div class="bg-[#0e1422] border border-slate-800 rounded-2xl p-8 sm:p-12">
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <!-- Controles / Sliders -->
          <div class="lg:col-span-6 space-y-6">
            <div class="space-y-2">
              <h2 class="text-3xl font-extrabold text-white">Quanto o seu pátio perde por mês em sobreestadias?</h2>
              <p class="text-sm text-slate-300 leading-relaxed">
                Ajuste os parâmetros da sua operação e calcule a redução de custos proporcionada pelo RotaFlow sob a Lei 11.442/2007.
              </p>
            </div>

            <!-- Slider 1: Carretas por dia -->
            <div class="space-y-2 bg-[#070a12] p-4 rounded-xl border border-slate-800">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300 font-medium">Volume de Carretas / Dia</span>
                <span class="text-sky-400 font-bold font-mono text-sm">{{ dailyTrucks }} carretas</span>
              </div>
              <input 
                v-model.number="dailyTrucks" 
                type="range" 
                min="10" 
                max="250" 
                step="5"
                class="w-full accent-sky-500 cursor-pointer"
              />
              <div class="flex justify-between text-xs text-slate-400">
                <span>10 carretas</span>
                <span>250 carretas/dia</span>
              </div>
            </div>

            <!-- Slider 2: Tempo Médio de Permanência -->
            <div class="space-y-2 bg-[#070a12] p-4 rounded-xl border border-slate-800">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300 font-medium">Permanência Média no Pátio (Dwell Time)</span>
                <span class="text-amber-400 font-bold font-mono text-sm">{{ avgDwellHours }} horas</span>
              </div>
              <input 
                v-model.number="avgDwellHours" 
                type="range" 
                min="3" 
                max="12" 
                step="0.5"
                class="w-full accent-amber-500 cursor-pointer"
              />
              <div class="flex justify-between text-xs text-slate-400">
                <span>3h (Sem multa)</span>
                <span>Tolerância Legal: 5h</span>
                <span>12h de pátio</span>
              </div>
            </div>

            <!-- Slider 3: Custo Hora Parada -->
            <div class="space-y-2 bg-[#070a12] p-4 rounded-xl border border-slate-800">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300 font-medium">Custo da Hora Excedente / Carreta</span>
                <span class="text-emerald-400 font-bold font-mono text-sm">R$ {{ hourlyFee }}/hora</span>
              </div>
              <input 
                v-model.number="hourlyFee" 
                type="range" 
                min="80" 
                max="300" 
                step="10"
                class="w-full accent-emerald-500 cursor-pointer"
              />
              <div class="flex justify-between text-xs text-slate-400">
                <span>R$ 80</span>
                <span>Média Brasil: R$ 160</span>
                <span>R$ 300</span>
              </div>
            </div>

          </div>

          <!-- Resultado Financeiro -->
          <div class="lg:col-span-6 bg-[#070a12] border border-slate-800 rounded-xl p-7 sm:p-8 space-y-6">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4">
              <span class="text-xs uppercase font-medium text-slate-400">Impacto Financeiro Estimado</span>
              <span class="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                BASE 22 DIAS ÚTEIS
              </span>
            </div>

            <div class="space-y-1">
              <span class="text-xs text-slate-400 block">Economia Mensal Direta Estimada</span>
              <p class="text-4xl sm:text-5xl font-extrabold text-emerald-400 font-mono tracking-tight">
                {{ formatBRL(calculatedRoi.monthlySavings) }}
              </p>
              <p class="text-xs text-slate-400">
                Economia em estadias indevidas evitadas e ganho de giro de doca.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 text-xs">
              <div class="bg-[#0e1422] p-3 rounded-lg border border-slate-800">
                <span class="text-slate-400 block text-xs">Custo Atual sem YMS</span>
                <span class="text-rose-400 font-bold font-mono text-base">{{ formatBRL(calculatedRoi.monthlyCost) }}</span>
                <span class="text-xs text-slate-400 block">exposição a disputas</span>
              </div>
              <div class="bg-[#0e1422] p-3 rounded-lg border border-slate-800">
                <span class="text-slate-400 block text-xs">Horas Recuperadas / Ano</span>
                <span class="text-sky-400 font-bold font-mono text-base">{{ calculatedRoi.hoursSavedPerYear }} horas</span>
                <span class="text-xs text-slate-400 block">de tempo útil de pátio</span>
              </div>
            </div>

            <button
              @click="openWhatsAppDirect(`Olá! Simulei a economia de ${formatBRL(calculatedRoi.monthlySavings)}/mês na calculadora do RotaFlow para ${dailyTrucks} carretas/dia. Gostaria de entender a implantação.`)"
              class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <PhoneCall class="w-4 h-4" />
              <span>Validar Estudo com Especialista</span>
            </button>
          </div>

        </div>

      </div>
    </section>

    <!-- INTEGRAÇÃO COM ERP & WEBHOOKS -->
    <section id="webhooks" class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      
      <div class="text-center space-y-3 max-w-3xl mx-auto">
        <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Integrado com ERPs & Rastreadores de Frota.
        </h2>
        <p class="text-base text-slate-300">
          Disparos instantâneos com assinatura criptográfica HMAC-SHA256 para SAP, TOTVS, Senior e conectores prontos para telemetria veicular (Autotrac, Sascar, OnixSat, Omnilink, Cobli).
        </p>
      </div>

      <!-- Simulador de Payload JSON -->
      <div class="bg-[#070a12] border border-slate-800 rounded-xl p-6 sm:p-8 max-w-4xl mx-auto text-xs">
        
        <!-- Tabs de Eventos -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="text-slate-400 text-xs">Evento:</span>
            <button
              v-for="evt in ['gate.checkin', 'dock.called', 'gate.checkout', 'telemetry.ping']"
              :key="evt"
              @click="activeWebhookEvent = evt"
              class="px-3 py-1.5 rounded text-xs transition-colors cursor-pointer"
              :class="activeWebhookEvent === evt ? 'bg-sky-600 text-white font-bold' : 'bg-[#0e1422] text-slate-400 hover:text-white'"
            >
              {{ evt }}
            </button>
          </div>

          <div class="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
            <CheckCircle2 class="w-3.5 h-3.5" />
            <span>Assinatura HMAC & Telemetria JSON</span>
          </div>
        </div>

        <!-- Visualizador JSON -->
        <div class="py-4 overflow-x-auto text-slate-300 text-xs leading-relaxed">
          <pre class="font-mono text-sky-300"><code>{{ JSON.stringify(webhookPayloads[activeWebhookEvent], null, 2) }}</code></pre>
        </div>

        <div class="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>Tempo médio de entrega do webhook: <strong class="text-white">140ms</strong></span>
          <span>Retentativa automática com Exponential Backoff (5 tentativas)</span>
        </div>

      </div>

    </section>

    <!-- SERVIÇOS: INTEGRAÇÃO DE APIS & TREINAMENTO DE EQUIPES (REMOTO E LOCAL) -->
    <section id="servicos" class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      <div class="text-center space-y-3 max-w-3xl mx-auto">
        <div class="inline-flex items-center space-x-2 bg-sky-950/80 border border-sky-800 px-3.5 py-1 rounded-full text-xs font-mono font-semibold text-sky-400">
          <GraduationCap class="w-3.5 h-3.5" />
          <span>Engenharia Direta & Capacitação</span>
        </div>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Integrações de APIs e Treinamentos Feitos Pela Própria Empresa Desenvolvedora
        </h2>
        <p class="text-base text-slate-300">
          A <strong>RAOS Tecnologia</strong> não entrega apenas um software. Desenvolvemos as integrações com seu ERP e capacitamos toda a sua equipe com atendimento <strong>remoto</strong> ou <strong>presencial / local no seu pátio</strong>.
        </p>
      </div>

      <!-- Grid dos 2 grandes pilares -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        
        <!-- Card 1: Integração com APIs e ERPs -->
        <div class="bg-[#0e1422] border border-slate-800 rounded-2xl p-7 sm:p-8 flex flex-col justify-between space-y-6">
          <div class="space-y-4">
            <div class="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Cpu class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-xl font-bold text-white mb-2">Integração de APIs & Conectores ERP</h3>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Nossos engenheiros cuidam do ciclo completo de integração com o ecossistema do seu negócio (SAP, TOTVS Protheus, Senior, Oracle WMS, Sankhya ou banco legado).
              </p>
            </div>

            <div class="space-y-3 pt-2 border-t border-slate-800/80">
              <div class="flex items-start space-x-3 text-xs text-slate-300">
                <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong class="text-white block">Atendimento Remoto:</strong>
                  <span>Acesso seguro via VPN, mapeamento de webhooks e homologação completa em ambiente Sandbox com testes de ponta a ponta.</span>
                </div>
              </div>

              <div class="flex items-start space-x-3 text-xs text-slate-300">
                <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong class="text-white block">Atendimento Presencial / Local:</strong>
                  <span>Engenheiros no local para integrar servidores de portaria física, balanças rodoviárias, cancelas automatizadas e leitores ópticos fixos.</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            SLA de homologação assistida por engenheiro de software sênior
          </div>
        </div>

        <!-- Card 2: Treinamento Operacional de Equipes -->
        <div class="bg-[#0e1422] border border-slate-800 rounded-2xl p-7 sm:p-8 flex flex-col justify-between space-y-6">
          <div class="space-y-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-xl font-bold text-white mb-2">Treinamento e Capacitação Operacional</h3>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Capacitação sob medida para fiscais de guarita, operadores de docas, conferentes de pátio e coordenadores de logística, garantindo transição sem pausas no pátio.
              </p>
            </div>

            <div class="space-y-3 pt-2 border-t border-slate-800/80">
              <div class="flex items-start space-x-3 text-xs text-slate-300">
                <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong class="text-white block">Treinamento Remoto:</strong>
                  <span>Sessões online interativas, simulações em tempo real com leitor virtual e materiais de consulta rápida em PDF para a portaria.</span>
                </div>
              </div>

              <div class="flex items-start space-x-3 text-xs text-slate-300">
                <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong class="text-white block">Treinamento Presencial / Local:</strong>
                  <span>Instrutores no seu armazém treinando as equipes na prática e acompanhando a operação real no dia de virada do sistema (Go-Live).</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            Acompanhamento presencial no primeiro dia de operação real
          </div>
        </div>

      </div>

      <!-- Banner de Ação para Contratação -->
      <div class="bg-[#070a12] border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div class="flex items-start space-x-4">
          <div class="p-3 rounded-xl bg-sky-500/10 text-sky-400 shrink-0 mt-1">
            <MapPin class="w-6 h-6" />
          </div>
          <div class="space-y-1">
            <h4 class="text-base font-bold text-white">Precisa de integração com seu ERP ou treinamento no seu pátio?</h4>
            <p class="text-xs text-slate-300">
              Alinhe escopo, prazos e modalidade (remota ou presencial) diretamente com quem constrói a plataforma.
            </p>
          </div>
        </div>

        <button
          @click="openWhatsAppDirect('Olá! Gostaria de falar sobre a contratação de integração com nosso ERP e treinamento local/remoto da equipe com a engenharia da RAOS Tecnologia.')"
          class="shrink-0 w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-sky-600/20 active:scale-95 cursor-pointer"
        >
          <PhoneCall class="w-4 h-4" />
          <span>Falar com o Time de Engenharia</span>
        </button>
      </div>

    </section>

    <!-- ÁREA DE CONTATO OFICIAL RAOS TECNOLOGIA -->
    <section id="contato" class="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div class="bg-[#0e1422] border border-slate-800 rounded-2xl p-8 sm:p-14 space-y-8 text-center">
        
        <div class="space-y-3 max-w-2xl mx-auto">
          <h2 class="text-3xl sm:text-4xl font-extrabold text-white">
            Pronto para transformar a eficiência do seu pátio?
          </h2>
          <p class="text-base text-slate-300 leading-relaxed">
            Fale diretamente com os engenheiros responsáveis pelo desenvolvimento da plataforma RotaFlow na <strong>RAOS Tecnologia</strong>.
          </p>
        </div>

        <!-- Cards de Contato Oficiais (WhatsApp + E-mail) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2 text-left">
          
          <!-- Card WhatsApp -->
          <a
            :href="`https://api.whatsapp.com/send?phone=55${contactInfo.whatsappRaw}&text=Ol%C3%A1!%20Gostaria%20de%20falar%20com%20a%20RAOS%20Tecnologia%20sobre%20o%20RotaFlow%20YMS.`"
            target="_blank"
            class="bg-[#070a12] border border-slate-800 hover:border-emerald-500/50 p-5 rounded-xl space-y-3 transition-all group block"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400 font-medium">WhatsApp & Telefone</span>
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            </div>
            <p class="text-xl font-bold font-mono text-white group-hover:text-emerald-400 transition-colors">
              {{ contactInfo.whatsappDisplay }}
            </p>
            <div class="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
              <PhoneCall class="w-3.5 h-3.5" />
              <span>Iniciar conversa no WhatsApp &rarr;</span>
            </div>
          </a>

          <!-- Card E-mail -->
          <div class="bg-[#070a12] border border-slate-800 hover:border-sky-500/50 p-5 rounded-xl space-y-3 transition-all">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400 font-medium">E-mail Corporativo</span>
              <button 
                @click="copyEmail" 
                class="text-xs text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
              >
                <Check v-if="copiedEmail" class="w-3.5 h-3.5 text-emerald-400" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiedEmail ? 'Copiado!' : 'Copiar' }}</span>
              </button>
            </div>
            <p class="text-base font-bold text-white truncate font-mono">
              {{ contactInfo.email }}
            </p>
            <a 
              :href="`mailto:${contactInfo.email}`"
              class="flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold"
            >
              <Mail class="w-3.5 h-3.5" />
              <span>Enviar e-mail para a equipe &rarr;</span>
            </a>
          </div>

        </div>

        <!-- CNPJ e Garantia -->
        <div class="pt-4 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-4">
          <span>Empresa: <strong class="text-white">RAOS Tecnologia</strong></span>
          <span>&bull;</span>
          <span>CNPJ: <strong class="text-white">66.914.167/0001-76</strong></span>
          <span>&bull;</span>
          <span class="text-emerald-400">Atendimento Técnico em Todo o Brasil</span>
        </div>

      </div>
    </section>

    <!-- FOOTER INSTITUCIONAL RAOS TECNOLOGIA -->
    <footer class="border-t border-slate-800 bg-[#050811] py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
        
        <!-- Coluna 1 & 2: Logomarca RotaFlow + Crédito RAOS Desenvolvedora -->
        <div class="md:col-span-2 space-y-4">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 p-1 flex items-center justify-center">
              <img src="/rotaflow-icon.png" alt="RotaFlow YMS" class="w-full h-full object-contain" />
            </div>
            <div>
              <span class="text-xl font-bold text-white">
                Rota<span class="text-sky-400">Flow</span> <span class="text-slate-400 text-xs">YMS</span>
              </span>
              <p class="text-xs text-slate-400">Yard Management System & Orquestração de Pátios</p>
            </div>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed max-w-md">
            Solução enterprise de alta disponibilidade para controle de frotas, portarias inteligentes e eliminação de multas de sobreestadia sob a Lei Federal 11.442/2007.
          </p>

          <!-- Selo Oficial: Desenvolvido por RAOS Tecnologia -->
          <div class="pt-2">
            <p class="text-xs font-semibold text-slate-400 mb-2">Desenvolvido e Mantido por</p>
            <div class="inline-flex items-center space-x-4 bg-white p-2.5 rounded-xl border border-slate-200">
              <img src="/raos-logomarca.png" alt="RAOS Tecnologia" class="h-6 w-auto object-contain" />
              <div class="border-l border-slate-200 pl-3 text-xs text-slate-800 leading-tight">
                <span class="font-bold block text-slate-900">CNPJ: 66.914.167/0001-76</span>
                <span class="text-xs text-slate-600">Engenharia de Software Corporativa</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna 3: Plataforma Operacional -->
        <div class="space-y-3 text-xs">
          <h4 class="font-bold text-white">Módulos da Plataforma</h4>
          <ul class="space-y-2 text-slate-400">
            <li><router-link to="/app" class="hover:text-sky-400 transition-colors">Torre de Controle (Kanban)</router-link></li>
            <li><router-link to="/mapa" class="hover:text-sky-400 transition-colors">Mapa do Pátio & Cerca GPS</router-link></li>
            <li><router-link to="/docas" class="hover:text-sky-400 transition-colors">Ocupação de Docas</router-link></li>
            <li><router-link to="/portaria" class="hover:text-sky-400 transition-colors">Portaria & Cancela QR</router-link></li>
            <li><router-link to="/relatorios" class="hover:text-sky-400 transition-colors">Auditoria Dwell Time & SLA</router-link></li>
            <li><router-link to="/integracoes" class="hover:text-sky-400 transition-colors">Webhooks & API REST</router-link></li>
          </ul>
        </div>

        <!-- Coluna 4: Contatos & Governança -->
        <div class="space-y-3 text-xs">
          <h4 class="font-bold text-white">Contato & Governança</h4>
          <ul class="space-y-2 text-slate-400">
            <li><span class="text-white font-bold">RAOS Tecnologia</span></li>
            <li><span>CNPJ: 66.914.167/0001-76</span></li>
            <li><span class="text-emerald-400 font-semibold">WhatsApp: (27) 99617-4965</span></li>
            <li><span class="text-slate-300 font-mono">contato@raostecnologia.com.br</span></li>
            <li class="pt-1">
              <router-link to="/admin/login" class="text-sky-400 hover:text-sky-300 font-bold transition-colors">
                Portal Super Admin RAOS &rarr;
              </router-link>
            </li>
          </ul>
        </div>

      </div>

      <div class="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p>&copy; {{ new Date().getFullYear() }} RotaFlow YMS. Todos os direitos reservados. Desenvolvido por <strong>RAOS Tecnologia</strong>.</p>
        <div class="flex items-center space-x-4">
          <span>CNPJ: 66.914.167/0001-76</span>
          <span>&bull;</span>
          <router-link to="/login" class="text-slate-400 hover:text-white transition-colors">Área do Cliente (Login)</router-link>
        </div>
      </div>
    </footer>

  </div>
</template>
