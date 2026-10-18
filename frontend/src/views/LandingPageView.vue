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
  TrendingUp, 
  DollarSign, 
  PhoneCall, 
  Mail,
  Building2, 
  ExternalLink,
  ChevronRight,
  X,
  Play,
  Copy,
  Check,
  Cpu,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Radio,
  FileCheck2,
  Sliders,
  Send,
  Sparkles
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

// Calculadora de ROI Interativa Realista
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
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-[#086cfe] selection:text-white relative overflow-x-hidden">

    <!-- Grid Técnico Sutil de Fundo (Engineering Dot Matrix) -->
    <div 
      class="fixed inset-0 pointer-events-none opacity-20"
      style="background-image: radial-gradient(circle at 1px 1px, rgba(147, 197, 253, 0.25) 1px, transparent 0); background-size: 32px 32px;"
    ></div>

    <!-- Iluminação Ambiente de Alta Precisão (Dark Glow) -->
    <div class="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-[#086cfe]/20 via-blue-700/15 to-transparent rounded-full blur-[140px] pointer-events-none"></div>

    <!-- ================================================================= -->
    <!-- HEADER / TOPBAR CORPORATIVA                                       -->
    <!-- ================================================================= -->
    <header class="border-b border-white/[0.08] bg-[#070b14]/85 backdrop-blur-xl sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <!-- Marca Principal RotaFlow -->
        <div class="flex items-center space-x-3.5 cursor-pointer" @click="router.push('/')">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500/20 to-blue-600/20 border border-sky-400/30 p-1.5 flex items-center justify-center shadow-lg shadow-sky-500/15">
            <img src="/rotaflow-icon.png" alt="RotaFlow" class="w-full h-full object-contain" />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xl font-black tracking-tight text-white">
                Rota<span class="text-sky-400">Flow</span> <span class="text-sky-400 font-mono text-sm uppercase">YMS</span>
              </span>
              <span class="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-sky-950/80 text-sky-300 border border-sky-800/80 font-mono">
                ENTERPRISE
              </span>
            </div>
            <p class="text-[11px] text-slate-400 font-mono">Gestão de Frotas Privadas &bull; Orquestração de Pátios</p>
          </div>
        </div>

        <!-- Links de Navegação Técnica -->
        <nav class="hidden lg:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <a href="#solucao" class="hover:text-white transition-colors">Visão Operacional</a>
          <a href="#arquitetura" class="hover:text-white transition-colors">Bento Grid</a>
          <a href="#roi" class="hover:text-white transition-colors">Calculadora Lei 11.442</a>
          <a href="#webhooks" class="hover:text-white transition-colors">Webhooks & ERP</a>
          <a href="#contato" class="text-sky-400 hover:text-sky-300 transition-colors">Fale com a Engenharia</a>
        </nav>

        <!-- CTAs Diretos -->
        <div class="flex items-center space-x-3">
          <button
            @click="handleEnterDemo"
            class="hidden sm:inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl text-sky-300 hover:text-white bg-sky-950/40 border border-sky-500/30 hover:border-sky-400 transition-all cursor-pointer font-mono shadow-sm"
          >
            <Sparkles class="w-3.5 h-3.5 text-sky-400" />
            <span>Demonstração (Sandbox)</span>
          </button>

          <router-link
            to="/login"
            class="hidden sm:inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.2] transition-all cursor-pointer font-mono"
          >
            <span>Área do Cliente</span>
          </router-link>

          <button
            @click="openWhatsAppDirect()"
            class="inline-flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#086cfe] to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer uppercase tracking-wider font-mono"
          >
            <PhoneCall class="w-3.5 h-3.5" />
            <span>WhatsApp (27) 99617-4965</span>
          </button>
        </div>

      </div>
    </header>

    <!-- ================================================================= -->
    <!-- HERO SECTION DE ENGENHARIA LOGÍSTICA                              -->
    <!-- ================================================================= -->
    <section class="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      <div class="text-center space-y-6 max-w-4xl mx-auto">
        <!-- Badge de Engenharia -->
        <div class="inline-flex items-center space-x-2.5 bg-white/[0.03] border border-white/[0.1] px-4 py-1.5 rounded-full text-xs font-mono text-slate-300 shadow-xl backdrop-blur-md">
          <span class="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
          <span class="text-slate-400">Arquitetura de Alta Disponibilidade:</span>
          <span class="text-sky-300 font-bold">FastAPI + WebSockets + PostgreSQL</span>
        </div>

        <!-- Headline Cirúrgica -->
        <h1 class="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.12]">
          Orquestração de pátios logísticos, portaria em 2s e <span class="bg-gradient-to-r from-sky-400 via-blue-300 to-[#086cfe] bg-clip-text text-transparent">blindagem contra sobreestadias</span>.
        </h1>

        <!-- Subheadline Especializada -->
        <p class="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-3xl mx-auto">
          O <strong>RotaFlow YMS</strong> elimina gargalos na cancela com check-in sem atrito via WhatsApp, convoca motoristas para docas por telemetria e produz laudos irrefutáveis de <em>Dwell Time</em> sob a <strong>Lei Federal 11.442/2007</strong>.
        </p>

        <!-- Botões de Ação Imediata -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            @click="openWhatsAppDirect('Olá! Gostaria de agendar uma apresentação de 20 minutos do RotaFlow YMS para o nosso terminal logístico.')"
            class="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#086cfe] hover:bg-blue-600 text-white text-xs uppercase tracking-wider font-extrabold px-7 py-4 rounded-xl shadow-2xl shadow-blue-600/30 active:scale-95 transition-all cursor-pointer font-mono"
          >
            <span>Falar com o Time de Engenharia</span>
            <ArrowRight class="w-4 h-4" />
          </button>

          <button
            @click="handleEnterDemo"
            class="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.12] hover:border-sky-500/40 text-xs uppercase tracking-wider font-semibold px-6 py-4 rounded-xl shadow-xl transition-all cursor-pointer font-mono"
          >
            <Sparkles class="w-4 h-4 text-sky-400" />
            <span>Testar Piloto Interativo (Sandbox)</span>
          </button>
        </div>

        <!-- Telemetria Rápida / Prova de Performance -->
        <div class="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-left max-w-4xl mx-auto font-mono">
          <div class="bg-white/[0.02] border border-white/[0.08] p-3.5 rounded-xl">
            <span class="text-[11px] text-slate-500 block uppercase">Tempo de Portaria</span>
            <span class="text-xl font-bold text-emerald-400">&lt; 40 segundos</span>
            <span class="text-[10px] text-slate-400 block mt-0.5">com QR Code óptico</span>
          </div>
          <div class="bg-white/[0.02] border border-white/[0.08] p-3.5 rounded-xl">
            <span class="text-[11px] text-slate-500 block uppercase">Lei 11.442 / Art 5º-A</span>
            <span class="text-xl font-bold text-sky-400">Tolerância 5h</span>
            <span class="text-[10px] text-slate-400 block mt-0.5">auditoria de sobreestadia</span>
          </div>
          <div class="bg-white/[0.02] border border-white/[0.08] p-3.5 rounded-xl">
            <span class="text-[11px] text-slate-500 block uppercase">Taxa de Concorrência</span>
            <span class="text-xl font-bold text-sky-400">Zero Conflito</span>
            <span class="text-[10px] text-slate-400 block mt-0.5">trava atômica em docas</span>
          </div>
          <div class="bg-white/[0.02] border border-white/[0.08] p-3.5 rounded-xl">
            <span class="text-[11px] text-slate-500 block uppercase">Disponibilidade</span>
            <span class="text-xl font-bold text-amber-400">99.9% SLA</span>
            <span class="text-[10px] text-slate-400 block mt-0.5">infraestrutura dedicada</span>
          </div>
        </div>
      </div>

      <!-- =============================================================== -->
      <!-- PRODUCT SHOWCASE REAL: MOCKUP OPERACIONAL KANBAN + APP MOTORISTA -->
      <!-- =============================================================== -->
      <div id="solucao" class="relative pt-6">
        <div class="relative bg-slate-950/90 border border-white/[0.12] rounded-3xl p-4 sm:p-7 shadow-2xl shadow-sky-950/30 overflow-hidden">
          
          <!-- Window Header (Mac / Linux Style) -->
          <div class="flex items-center justify-between pb-5 border-b border-white/[0.08] mb-6">
            <div class="flex items-center space-x-3">
              <div class="flex items-center space-x-1.5">
                <span class="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              </div>
              <span class="text-xs font-mono text-slate-400 pl-2 border-l border-white/[0.1]">
                RotaFlow YMS Enterprise &bull; Terminal Vitória Hub 01 &bull; Realtime WebSockets
              </span>
            </div>

            <div class="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>CANAL AO VIVO ATIVO</span>
            </div>
          </div>

          <!-- Grid Interno da Interface: 3 Colunas Kanban + Telemetria Lateral -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            <!-- Colunas Kanban (9 Colunas) -->
            <div class="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              <!-- Coluna 1: Aguardando no Pátio -->
              <div class="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
                <div class="flex items-center justify-between text-xs font-mono">
                  <span class="font-bold text-amber-400 flex items-center space-x-1.5">
                    <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>NO PÁTIO (12)</span>
                  </span>
                  <span class="text-slate-500 text-[10px]">Fila de Espera</span>
                </div>

                <!-- Card 1 -->
                <div class="bg-slate-950 border border-amber-500/30 rounded-xl p-3 space-y-2 shadow-sm">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-[10px] font-mono text-slate-400 uppercase">Cavalo Mecânico</span>
                      <p class="font-mono font-bold text-xs text-white">BRA2E19 &bull; Scania 450</p>
                    </div>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                      02h 45m
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-300">Braspress &bull; Carga Fracionada</p>
                  <div class="flex items-center justify-between pt-1 border-t border-white/[0.06] text-[10px] font-mono text-slate-400">
                    <span>Doca Prevista: #04</span>
                    <span class="text-emerald-400 font-semibold">Tolerância OK</span>
                  </div>
                </div>

                <!-- Card 2 -->
                <div class="bg-slate-950 border border-white/[0.08] rounded-xl p-3 space-y-2">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-[10px] font-mono text-slate-400 uppercase">Bitrem Granel</span>
                      <p class="font-mono font-bold text-xs text-white">RDO8X11 &bull; Volvo FH</p>
                    </div>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      01h 12m
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-300">Jamef Encomendas</p>
                  <div class="flex items-center justify-between pt-1 border-t border-white/[0.06] text-[10px] font-mono text-slate-400">
                    <span>Doca Prevista: #02</span>
                    <span class="text-emerald-400 font-semibold">Tolerância OK</span>
                  </div>
                </div>

              </div>

              <!-- Coluna 2: Em Doca / Operação -->
              <div class="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
                <div class="flex items-center justify-between text-xs font-mono">
                  <span class="font-bold text-sky-400 flex items-center space-x-1.5">
                    <span class="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>EM DOCA (8)</span>
                  </span>
                  <span class="text-slate-500 text-[10px]">Carga/Descarga</span>
                </div>

                <!-- Card Doca 03 -->
                <div class="bg-slate-950 border border-sky-500/30 rounded-xl p-3 space-y-2 shadow-sm">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-[10px] font-mono text-sky-400 font-bold uppercase">Doca #03 - Descarga</span>
                      <p class="font-mono font-bold text-xs text-white">MEC9K82 &bull; Carreta Baú</p>
                    </div>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800 animate-pulse">
                      OPERANDO
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-300">DirectLog &bull; 850 Volumes</p>
                  <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r from-sky-400 to-indigo-500 h-full w-[65%]"></div>
                  </div>
                  <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                    <span>SLA: 45 min restantes</span>
                    <span class="text-sky-300 font-bold">65% concluído</span>
                  </div>
                </div>

                <!-- Card Doca 05 -->
                <div class="bg-slate-950 border border-white/[0.08] rounded-xl p-3 space-y-2">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-[10px] font-mono text-slate-400 uppercase">Doca #05 - Carga</span>
                      <p class="font-mono font-bold text-xs text-white">SPK4L77 &bull; Sider 28 Paletes</p>
                    </div>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      Iniciando
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-300">Translog Brasil Express</p>
                  <div class="flex items-center justify-between pt-1 border-t border-white/[0.06] text-[10px] font-mono text-slate-400">
                    <span>Conferência cega iniciada</span>
                  </div>
                </div>

              </div>

              <!-- Coluna 3: Liberados / Concluídos -->
              <div class="bg-slate-900/60 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
                <div class="flex items-center justify-between text-xs font-mono">
                  <span class="font-bold text-emerald-400 flex items-center space-x-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>LIBERADOS (34)</span>
                  </span>
                  <span class="text-slate-500 text-[10px]">Cancela Exit</span>
                </div>

                <!-- Card Liberado Sem Taxa -->
                <div class="bg-slate-950 border border-emerald-500/20 rounded-xl p-3 space-y-2">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-[10px] font-mono text-emerald-400 uppercase">Check-out OK</span>
                      <p class="font-mono font-bold text-xs text-white">VIX1J99 &bull; Truck 14T</p>
                    </div>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      R$ 0,00 Taxa
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-300">Permanência Total: 01h 48m</p>
                  <div class="text-[10px] font-mono text-slate-500">
                    Laudo digital gerado e auditado
                  </div>
                </div>

                <!-- Card com Alerta de SLA Evitado -->
                <div class="bg-slate-950 border border-sky-500/20 rounded-xl p-3 space-y-2">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-[10px] font-mono text-sky-400 uppercase">Auditoria Fechada</span>
                      <p class="font-mono font-bold text-xs text-white">BHZ3M44 &bull; Carreta</p>
                    </div>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300">
                      04h 15m
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-300">Evitou multa de R$ 320,00</p>
                  <div class="text-[10px] font-mono text-emerald-400 font-bold">
                    Liberado 45m antes do limite legal
                  </div>
                </div>

              </div>

            </div>

            <!-- Coluna Lateral: Mockup do Smartphone do Motorista (4 Colunas) -->
            <div class="lg:col-span-4 bg-slate-900 border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between space-y-4">
              
              <div class="space-y-2">
                <div class="flex items-center space-x-2 text-xs font-mono text-sky-400 font-bold uppercase">
                  <QrCode class="w-4 h-4" />
                  <span>PWA do Motorista (Zero Login)</span>
                </div>
                <p class="text-xs text-slate-300">
                  O motorista recebe um link no WhatsApp. Sem cadastrar senhas, abre o passe digital no celular:
                </p>
              </div>

              <!-- Bezel do Celular -->
              <div class="mx-auto w-full max-w-[260px] bg-slate-950 border-2 border-slate-700/80 rounded-[28px] p-3 shadow-2xl space-y-3 font-mono text-center">
                <!-- Notch -->
                <div class="w-16 h-3 bg-slate-800 rounded-full mx-auto"></div>

                <div class="space-y-1">
                  <p class="text-[10px] text-slate-400 uppercase">RotaFlow Digital Pass</p>
                  <p class="text-xs font-bold text-white">Placa: BRA2E19</p>
                </div>

                <!-- Status de Chamada Ativa -->
                <div class="bg-[#001c3d]/90 border border-[#086cfe]/50 p-2.5 rounded-xl text-left space-y-1">
                  <div class="flex items-center space-x-1.5 text-[10px] font-bold text-sky-300 uppercase">
                    <Radio class="w-3 h-3 text-sky-400 animate-pulse" />
                    <span>DIRIJA-SE À DOCA AGORA</span>
                  </div>
                  <p class="text-xs font-black text-white">DOCA #04 &bull; SETOR SECOS</p>
                  <p class="text-[9px] text-slate-300">Tolerância de apresentação: 10 min</p>
                </div>

                <!-- QR Code Simulado de Alta Precisão -->
                <div class="bg-white p-3 rounded-xl mx-auto w-28 h-28 flex items-center justify-center shadow-md">
                  <QrCode class="w-24 h-24 text-slate-900" />
                </div>
                <p class="text-[9px] text-slate-400">Aproxime na cancela para liberação automática</p>
              </div>

              <div class="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Notificação WhatsApp:</span>
                <span class="text-emerald-400 font-bold">Entregue (2 seg)</span>
              </div>

            </div>

          </div>

        </div>
      </div>

    </section>

    <!-- ================================================================= -->
    <!-- BENTO GRID: ARQUITETURA TÉCNICA E DIFERENCIAIS CORPORATIVOS       -->
    <!-- ================================================================= -->
    <section id="arquitetura" class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      <div class="text-center space-y-3 max-w-3xl mx-auto">
        <span class="text-xs font-mono font-bold uppercase tracking-widest text-sky-400">Arquitetura Corporativa de Ponta a Ponta</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Por que grandes frotas e operadores logísticos adotam o RotaFlow?
        </h2>
        <p class="text-sm text-slate-400">
          Substitua planilhas paralelas e conflitos de rádio por uma esteira de dados auditável e automatizada.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Bento 1: Lei 11.442/2007 (Destaque Grande 2 Colunas) -->
        <div class="md:col-span-2 bg-gradient-to-br from-slate-900/90 via-slate-950 to-sky-950/20 border border-white/[0.08] hover:border-sky-500/40 rounded-3xl p-8 space-y-5 transition-all">
          <div class="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <FileCheck2 class="w-6 h-6" />
          </div>
          <div class="space-y-2">
            <div class="inline-flex items-center space-x-2 text-[10px] font-mono uppercase tracking-wider text-sky-300 font-bold px-2.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-800">
              Blindagem Jurídica & Tributária
            </div>
            <h3 class="text-2xl font-bold text-white">
              Cálculo Irrefutável de Estadia (Lei Federal 11.442/2007, Art. 5º-A)
            </h3>
            <p class="text-sm text-slate-300 leading-relaxed">
              Evite cobranças arbitrárias de demurrage e horas paradas por transportadoras. O RotaFlow calcula exatamente a tolerância legal de 5 horas a partir do carimbo de tempo da portaria e emite relatórios com valor por tonelada/hora formatados para contestação ou pagamento transparente.
            </p>
          </div>

          <!-- Memorial de Auditoria Simulado -->
          <div class="bg-black/50 border border-white/[0.08] p-4 rounded-2xl font-mono text-xs space-y-2">
            <div class="flex items-center justify-between text-slate-400 border-b border-white/[0.08] pb-2 text-[11px]">
              <span>RELATÓRIO DE PERMANÊNCIA AUDITADO</span>
              <span class="text-emerald-400">STATUS: CONFORME</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-[11px]">
              <div>
                <span class="text-slate-500 block">Check-in Portaria</span>
                <span class="text-white font-bold">14:15:22</span>
              </div>
              <div>
                <span class="text-slate-500 block">Início Doca</span>
                <span class="text-white font-bold">15:02:10</span>
              </div>
              <div>
                <span class="text-slate-500 block">Check-out Saída</span>
                <span class="text-white font-bold">18:10:05</span>
              </div>
              <div>
                <span class="text-slate-500 block">Dwell Time Total</span>
                <span class="text-sky-300 font-bold">03h 54m (&lt; 5h)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bento 2: Concorrência Atômica de Docas -->
        <div class="bg-slate-900/90 border border-white/[0.08] hover:border-sky-500/40 rounded-3xl p-8 space-y-4 transition-all">
          <div class="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Warehouse class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold text-white">Trava Atômica de Docas</h3>
          <p class="text-xs text-slate-300 leading-relaxed">
            Impedimento via banco de dados relacional de agendamento duplicado. Duas carretas nunca disputam a mesma janela, eliminando atritos no pátio.
          </p>
          <ul class="space-y-2 text-xs font-mono text-slate-400 pt-2">
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
        <div class="bg-slate-900/90 border border-white/[0.08] hover:border-emerald-500/40 rounded-3xl p-8 space-y-4 transition-all">
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold text-white">Importação Massiva CSV</h3>
          <p class="text-xs text-slate-300 leading-relaxed">
            Agende 200 caminhões em segundos. Faça upload direto da planilha da sua transportadora com validação imediata de placas Mercosul e telefones.
          </p>
          <div class="bg-black/40 border border-white/[0.06] p-3 rounded-xl font-mono text-[11px] text-slate-400">
            <span class="text-emerald-400 font-bold">200 agendamentos</span> processados em 1.2 segundos com sanitização de CPF e telefone.
          </div>
        </div>

        <!-- Bento 4: Portaria Inteligente OCR/QR (Destaque 2 Colunas) -->
        <div class="md:col-span-2 bg-gradient-to-tr from-slate-900/90 via-slate-950 to-sky-950/20 border border-white/[0.08] hover:border-sky-500/40 rounded-3xl p-8 space-y-4 transition-all">
          <div class="flex items-center justify-between">
            <div class="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Zap class="w-6 h-6" />
            </div>
            <span class="text-xs font-mono text-slate-400">Cancela de Entrada e Saída</span>
          </div>
          <h3 class="text-2xl font-bold text-white">Portaria & Cancela em 2 Segundos</h3>
          <p class="text-sm text-slate-300 leading-relaxed">
            Elimine as pranchetas e filas na rodovia. O operador da portaria apenas aponta o leitor para o QR Code no celular do motorista ou digita os 3 dígitos da placa. O sistema valida os documentos, registra o horário legal e abre a cancela imediatamente.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
            <div class="bg-black/40 border border-white/[0.06] p-3 rounded-xl">
              <span class="text-slate-500 block">Check-in</span>
              <span class="text-white font-bold">Entrada registrada</span>
            </div>
            <div class="bg-black/40 border border-white/[0.06] p-3 rounded-xl">
              <span class="text-slate-500 block">Convocação</span>
              <span class="text-sky-400 font-bold">Doca sinalizada</span>
            </div>
            <div class="bg-black/40 border border-white/[0.06] p-3 rounded-xl">
              <span class="text-slate-500 block">Check-out</span>
              <span class="text-emerald-400 font-bold">Cancela liberada</span>
            </div>
          </div>
        </div>

      </div>

    </section>

    <!-- ================================================================= -->
    <!-- CALCULADORA DE ROI: SIMULAÇÃO FINANCEIRA INTERATIVA               -->
    <!-- ================================================================= -->
    <section id="roi" class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div class="bg-gradient-to-br from-[#001c3d]/80 via-slate-900 to-sky-950/40 border border-[#086cfe]/40 rounded-3xl p-8 sm:p-12 shadow-2xl">
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <!-- Controles / Sliders (6 Colunas) -->
          <div class="lg:col-span-6 space-y-6">
            <div class="space-y-2">
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">Simulador de Economia Operacional</span>
              <h2 class="text-3xl font-extrabold text-white">Quanto o seu pátio perde por mês em sobreestadias?</h2>
              <p class="text-xs text-slate-300 leading-relaxed">
                Ajuste os parâmetros da sua operação e calcule a redução de custos proporcionada pelo RotaFlow sob a Lei 11.442/2007.
              </p>
            </div>

            <!-- Slider 1: Carretas por dia -->
            <div class="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-white/[0.06]">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-slate-300 font-semibold">Volume de Carretas / Dia</span>
                <span class="text-sky-400 font-bold text-sm">{{ dailyTrucks }} carretas</span>
              </div>
              <input 
                v-model.number="dailyTrucks" 
                type="range" 
                min="10" 
                max="250" 
                step="5"
                class="w-full accent-[#086cfe] cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10 carretas</span>
                <span>250 carretas/dia</span>
              </div>
            </div>

            <!-- Slider 2: Tempo Médio de Permanência -->
            <div class="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-white/[0.06]">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-slate-300 font-semibold">Permanência Média no Pátio (Dwell Time)</span>
                <span class="text-amber-400 font-bold text-sm">{{ avgDwellHours }} horas</span>
              </div>
              <input 
                v-model.number="avgDwellHours" 
                type="range" 
                min="3" 
                max="12" 
                step="0.5"
                class="w-full accent-amber-500 cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>3h (Sem multa)</span>
                <span>Tolerância Legal: 5h</span>
                <span>12h de pátio</span>
              </div>
            </div>

            <!-- Slider 3: Valor da Hora Parada (Demurrage) -->
            <div class="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-white/[0.06]">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-slate-300 font-semibold">Custo da Hora Excedente / Carreta</span>
                <span class="text-emerald-400 font-bold text-sm">R$ {{ hourlyFee }}/hora</span>
              </div>
              <input 
                v-model.number="hourlyFee" 
                type="range" 
                min="80" 
                max="300" 
                step="10"
                class="w-full accent-emerald-500 cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>R$ 80</span>
                <span>Média Brasil: R$ 160</span>
                <span>R$ 300</span>
              </div>
            </div>

          </div>

          <!-- Resultado Financeiro (6 Colunas) -->
          <div class="lg:col-span-6 bg-slate-950/90 border border-white/[0.12] rounded-3xl p-7 sm:p-8 space-y-6 shadow-2xl">
            <div class="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <span class="text-xs font-mono uppercase tracking-wider text-slate-400">Impacto Financeiro Estimado</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                PROJEÇÃO BASE 22 DIAS ÚTEIS
              </span>
            </div>

            <div class="space-y-1">
              <span class="text-xs font-mono text-slate-400 block uppercase">Economia Mensal Direta Estimada</span>
              <p class="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight">
                {{ formatBRL(calculatedRoi.monthlySavings) }}
              </p>
              <p class="text-[11px] text-slate-400 font-mono">
                Economia em estadias indevidas evitadas e ganho de capacidade de giro de doca.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.08] font-mono text-xs">
              <div class="bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                <span class="text-slate-500 block text-[10px]">Custo Atual sem YMS</span>
                <span class="text-rose-400 font-bold text-base">{{ formatBRL(calculatedRoi.monthlyCost) }}</span>
                <span class="text-[9px] text-slate-500 block">exposição a disputas</span>
              </div>
              <div class="bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                <span class="text-slate-500 block text-[10px]">Horas Recuperadas / Ano</span>
                <span class="text-sky-400 font-bold text-base">{{ calculatedRoi.hoursSavedPerYear }} horas</span>
                <span class="text-[9px] text-slate-500 block">de tempo útil de pátio</span>
              </div>
            </div>

            <button
              @click="openWhatsAppDirect(`Olá! Simulei a economia de ${formatBRL(calculatedRoi.monthlySavings)}/mês na calculadora do RotaFlow para ${dailyTrucks} carretas/dia. Gostaria de entender a implantação.`)"
              class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider py-4 px-6 rounded-xl shadow-xl shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <PhoneCall class="w-4 h-4" />
              <span>Validar Estudo de Caso com Especialista</span>
            </button>
          </div>

        </div>

      </div>
    </section>

    <!-- ================================================================= -->
    <!-- INTEGRAÇÃO COM ERP & WEBHOOKS REALISTAS                           -->
    <!-- ================================================================= -->
    <section id="webhooks" class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      
      <div class="text-center space-y-3 max-w-3xl mx-auto">
        <span class="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">Conectividade & API REST</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Integrado com SAP, TOTVS Protheus, Senior e Oracle WMS
        </h2>
        <p class="text-sm text-slate-400">
          Disparos instantâneos com assinatura criptográfica HMAC-SHA256 para manter seu ERP sincronizado em cada movimentação da carreta.
        </p>
      </div>

      <!-- Simulador de Payload JSON -->
      <div class="bg-slate-950 border border-white/[0.1] rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto shadow-2xl font-mono text-xs">
        
        <!-- Tabs de Eventos -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div class="flex items-center space-x-2">
            <span class="text-slate-500 text-xs">Evento Webhook:</span>
            <button
              v-for="evt in ['gate.checkin', 'dock.called', 'gate.checkout']"
              :key="evt"
              @click="activeWebhookEvent = evt"
              class="px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
              :class="activeWebhookEvent === evt ? 'bg-[#086cfe] text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'"
            >
              {{ evt }}
            </button>
          </div>

          <div class="flex items-center space-x-2 text-[11px] text-emerald-400">
            <CheckCircle2 class="w-3.5 h-3.5" />
            <span>Assinatura HMAC: X-RotaFlow-Signature</span>
          </div>
        </div>

        <!-- Visualizador JSON -->
        <div class="py-4 overflow-x-auto text-slate-300 text-xs leading-relaxed">
          <pre class="font-mono text-sky-300"><code>{{ JSON.stringify(webhookPayloads[activeWebhookEvent], null, 2) }}</code></pre>
        </div>

        <div class="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>Tempo médio de entrega do webhook: <strong>140ms</strong></span>
          <span>Retentativa automática com Exponential Backoff (5 tentativas)</span>
        </div>

      </div>

    </section>

    <!-- ================================================================= -->
    <!-- ÁREA DE CONTATO OFICIAL & ENGENHARIA RAOS TECNOLOGIA              -->
    <!-- ================================================================= -->
    <section id="contato" class="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div class="bg-gradient-to-tr from-[#001c3d]/90 via-slate-900 to-sky-950/50 border border-[#086cfe]/40 rounded-3xl p-8 sm:p-14 shadow-2xl space-y-8 text-center relative overflow-hidden">
        
        <!-- Glow Top -->
        <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#086cfe]/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="space-y-3 relative z-10 max-w-2xl mx-auto">
          <div class="inline-flex items-center space-x-2 bg-sky-950/80 border border-sky-700/80 px-3 py-1 rounded-full text-xs font-mono text-sky-300 font-bold uppercase">
            <Building2 class="w-3.5 h-3.5" />
            <span>Canal Direto com a Engenharia & Negócios</span>
          </div>
          <h2 class="text-3xl sm:text-4xl font-black text-white">
            Pronto para transformar a eficiência do seu pátio?
          </h2>
          <p class="text-sm text-slate-300 leading-relaxed">
            Fale diretamente com os engenheiros responsáveis pelo desenvolvimento da plataforma RotaFlow na <strong>RAOS Tecnologia</strong>.
          </p>
        </div>

        <!-- Cards de Contato Oficiais (WhatsApp + E-mail) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2 relative z-10 text-left font-mono">
          
          <!-- Card WhatsApp -->
          <a
            :href="`https://api.whatsapp.com/send?phone=55${contactInfo.whatsappRaw}&text=Ol%C3%A1!%20Gostaria%20de%20falar%20com%20a%20RAOS%20Tecnologia%20sobre%20o%20RotaFlow%20YMS.`"
            target="_blank"
            class="bg-slate-950/90 border border-emerald-500/30 hover:border-emerald-500 p-5 rounded-2xl space-y-3 transition-all group block shadow-lg hover:shadow-emerald-950/30"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400 uppercase font-semibold">WhatsApp & Telefone</span>
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p class="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
              {{ contactInfo.whatsappDisplay }}
            </p>
            <div class="flex items-center space-x-1.5 text-xs text-emerald-400 font-sans font-semibold">
              <PhoneCall class="w-3.5 h-3.5" />
              <span>Iniciar conversa no WhatsApp &rarr;</span>
            </div>
          </a>

          <!-- Card E-mail -->
          <div class="bg-slate-950/90 border border-[#086cfe]/30 hover:border-[#086cfe] p-5 rounded-2xl space-y-3 transition-all shadow-lg">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400 uppercase font-semibold">E-mail Corporativo</span>
              <button 
                @click="copyEmail" 
                class="text-xs text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer font-sans"
              >
                <Check v-if="copiedEmail" class="w-3.5 h-3.5 text-emerald-400" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiedEmail ? 'Copiado!' : 'Copiar' }}</span>
              </button>
            </div>
            <p class="text-base font-bold text-white truncate">
              {{ contactInfo.email }}
            </p>
            <a 
              :href="`mailto:${contactInfo.email}`"
              class="flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 font-sans font-semibold"
            >
              <Mail class="w-3.5 h-3.5" />
              <span>Enviar e-mail para a equipe &rarr;</span>
            </a>
          </div>

        </div>

        <!-- CNPJ e Garantia -->
        <div class="pt-4 text-xs font-mono text-slate-400 relative z-10 flex flex-wrap items-center justify-center gap-4">
          <span>Empresa: <strong>RAOS Tecnologia</strong></span>
          <span>&bull;</span>
          <span>CNPJ: <strong>66.914.167/0001-76</strong></span>
          <span>&bull;</span>
          <span class="text-emerald-400">Atendimento Técnico em Todo o Brasil</span>
        </div>

      </div>
    </section>

    <!-- ================================================================= -->
    <!-- FOOTER INSTITUCIONAL RAOS TECNOLOGIA                              -->
    <!-- ================================================================= -->
    <footer class="border-t border-white/[0.08] bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/[0.06]">
        
        <!-- Coluna 1 & 2: Logomarca RotaFlow + Crédito RAOS Desenvolvedora -->
        <div class="md:col-span-2 space-y-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500/20 to-blue-600/20 border border-sky-400/30 p-1.5 flex items-center justify-center shadow-md shadow-sky-500/10">
              <img src="/rotaflow-icon.png" alt="RotaFlow YMS" class="w-full h-full object-contain" />
            </div>
            <div>
              <span class="text-xl font-black text-white">
                Rota<span class="text-sky-400">Flow</span> <span class="text-sky-400 font-mono text-sm">YMS</span>
              </span>
              <p class="text-[11px] text-slate-400 font-mono">Yard Management System & Orquestração de Pátios</p>
            </div>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed max-w-md">
            Solução enterprise de alta disponibilidade para controle de frotas, portarias inteligentes e eliminação de multas de sobreestadia sob a Lei Federal 11.442/2007.
          </p>

          <!-- Selo Oficial: Desenvolvido por RAOS Tecnologia -->
          <div class="pt-3">
            <p class="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono mb-2">Desenvolvido e Mantido por</p>
            <div class="inline-flex items-center space-x-4 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-md">
              <img src="/raos-logomarca.png" alt="RAOS Tecnologia" class="h-7 w-auto object-contain" />
              <div class="border-l border-slate-200 pl-3 text-[11px] text-slate-800 leading-tight font-mono">
                <span class="font-extrabold block text-slate-900">CNPJ: 66.914.167/0001-76</span>
                <span class="text-[10px] text-slate-600">Engenharia de Software Corporativa</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna 3: Plataforma Operacional -->
        <div class="space-y-3 font-mono text-xs">
          <h4 class="font-bold uppercase tracking-wider text-white">Módulos da Plataforma</h4>
          <ul class="space-y-2 text-slate-400">
            <li><router-link to="/app" class="hover:text-sky-400 transition-colors">Torre de Controle (Kanban)</router-link></li>
            <li><router-link to="/docas" class="hover:text-sky-400 transition-colors">Ocupação de Docas</router-link></li>
            <li><router-link to="/portaria" class="hover:text-sky-400 transition-colors">Portaria & Cancela QR</router-link></li>
            <li><router-link to="/relatorios" class="hover:text-sky-400 transition-colors">Auditoria Dwell Time & SLA</router-link></li>
            <li><router-link to="/integracoes" class="hover:text-sky-400 transition-colors">Webhooks & API REST</router-link></li>
          </ul>
        </div>

        <!-- Coluna 4: Contatos & Governança -->
        <div class="space-y-3 font-mono text-xs">
          <h4 class="font-bold uppercase tracking-wider text-white">Contato & Governança</h4>
          <ul class="space-y-2 text-slate-400">
            <li><span class="text-white font-bold">RAOS Tecnologia</span></li>
            <li><span>CNPJ: 66.914.167/0001-76</span></li>
            <li><span class="text-emerald-400 font-semibold">WhatsApp: (27) 99617-4965</span></li>
            <li><span class="text-slate-300">contato@raostecnologia.com.br</span></li>
            <li class="pt-1">
              <router-link to="/admin/login" class="text-sky-400 hover:text-sky-300 font-bold transition-colors">
                Portal Super Admin RAOS &rarr;
              </router-link>
            </li>
          </ul>
        </div>

      </div>

      <div class="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-4">
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
