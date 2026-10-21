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
  Users,
  MapPin,
  CalendarDays,
  Smartphone,
  BadgeCheck,
  Camera,
  Layers,
  BarChart3,
  Scale,
  Send,
  MessageSquare,
  Lock,
  ChevronDown,
  Menu
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleEnterDemo() {
  authStore.enterDemoMode()
  router.push('/app')
}

// Menu Mobile State
const isMobileMenuOpen = ref(false)
function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

// Contatos Oficiais RAOS Tecnologia / DocaOS
const contactInfo = {
  whatsappRaw: '27996174965',
  whatsappDisplay: '(27) 99617-4965',
  email: 'contato@docaos.log.br',
  corporateEmail: 'contato@raostecnologia.com.br',
  cnpj: '66.914.167/0001-76',
  company: 'DocaOS • RAOS Tecnologia'
}

const copiedEmail = ref(false)

function copyEmail() {
  navigator.clipboard.writeText(contactInfo.email)
  copiedEmail.value = true
  setTimeout(() => { copiedEmail.value = false }, 2500)
}

function openWhatsAppDirect(customMessage) {
  const msg = customMessage || `Olá! Vim pelo site do DocaOS (docaos.log.br) e gostaria de agendar uma demonstração consultiva para o nosso armazém/centro de distribuição.`
  window.open(`https://api.whatsapp.com/send?phone=55${contactInfo.whatsappRaw}&text=${encodeURIComponent(msg)}`, '_blank')
}

// Modal de Demonstração / Piloto
const isDemoModalOpen = ref(false)
const demoForm = ref({
  name: '',
  email: '',
  company: '',
  phone: '',
  segment: 'centro-distribuicao',
  docks: '16-30',
  message: ''
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
  // DocaOS reduz o Dwell Time em até 78%
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

// FAQ Accordion
const activeFaq = ref(0)
const faqs = [
  {
    q: 'Quanto tempo leva para implantar o DocaOS na nossa operação?',
    a: 'O DocaOS é uma plataforma 100% cloud. O setup padrão leva de 48 horas a 5 dias úteis, incluindo importação de frotas e docas, parametrização de SLAs e treinamento operacional dos porteiros e balanceiros via videoconferência ou presencial.'
  },
  {
    q: 'Como funciona o Crachá Digital para Ajudantes e Chapas?',
    a: 'Qualquer colaborador ou terceiro pode ser credenciado em menos de 2 minutos. O sistema gera um crachá institucional com foto, CPF, empresa e QR Code de segurança que pode ser enviado instantaneamente via WhatsApp para o celular dele ou impresso no padrão bolso/PVC.'
  },
  {
    q: 'O DocaOS protege mesmo juridicamente contra a Lei 11.442/2007?',
    a: 'Sim. O Artigo 5º-A da Lei 11.442/2007 estabelece o prazo máximo de 5 horas para carga ou descarga a contar da chegada na portaria. O DocaOS registra o timestamp inviolável de entrada, chamada à doca, início, fim de operação e saída, emitindo um Laudo Pericial Digital probatório com código de validação pública.'
  },
  {
    q: 'É necessário instalar servidores físicos ou equipamentos caros na guarita?',
    a: 'Não. O DocaOS roda diretamente em navegadores web em celulares, tablets ou PCs de guarita. É compatível com câmeras web simples, celulares dos operadores ou leitores laser de código de barras USB comuns.'
  },
  {
    q: 'O sistema se integra com o nosso ERP ou WMS?',
    a: 'Sim. Oferecemos APIs RESTful completas e Webhooks em tempo real com conectores para SAP, TOTVS Protheus, Senior, Sankhya, Oracle e sistemas proprietários de TMS/WMS.'
  }
]
</script>

<template>
  <div class="min-h-screen bg-[#001c3d] text-slate-100 flex flex-col font-sans selection:bg-[#00A896] selection:text-white">
    <!-- ============================================ -->
    <!-- HEADER NAVBAR RIGOROSAMENTE CENTRALIZADO     -->
    <!-- ============================================ -->
    <header class="sticky top-0 z-50 bg-[#00142c]/95 backdrop-blur-md border-b border-teal-500/20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <!-- Coluna Esquerda: Logo Oficial DocaOS -->
        <div class="flex items-center shrink-0">
          <a href="#inicio" @click="closeMobileMenu" class="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#00A896] rounded-lg p-1" aria-label="DocaOS - Início">
            <img src="/docaos-logo.png" alt="DocaOS - Patio & Dock Operating System" class="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 duration-200" />
          </a>
        </div>

        <!-- Coluna Central: Menu Desktop Rigorosamente Centralizado -->
        <nav class="hidden lg:flex items-center justify-center flex-1" aria-label="Menu Principal">
          <div class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900/80 border border-teal-500/30 backdrop-blur-md shadow-inner text-xs xl:text-sm font-semibold text-slate-300">
            <a href="#inicio" class="px-3.5 py-1 rounded-full hover:text-white hover:bg-teal-500/20 transition-all">Início</a>
            <a href="#funcionalidades" class="px-3.5 py-1 rounded-full hover:text-white hover:bg-teal-500/20 transition-all">Módulos</a>
            <a href="#solucoes" class="px-3.5 py-1 rounded-full hover:text-white hover:bg-teal-500/20 transition-all">Soluções</a>
            <a href="#crachas" class="px-3.5 py-1 rounded-full hover:text-white hover:bg-teal-500/20 transition-all">Crachá Digital</a>
            <a href="#lei11442" class="px-3.5 py-1 rounded-full hover:text-white hover:bg-teal-500/20 transition-all">Lei 11.442/07</a>
            <a href="#calculadora-roi" class="px-3.5 py-1 rounded-full hover:text-white hover:bg-teal-500/20 transition-all">Calculadora ROI</a>
            <a href="#contato" class="px-3.5 py-1 rounded-full hover:text-white hover:bg-teal-500/20 transition-all">Contato</a>
          </div>
        </nav>

        <!-- Coluna Direita: CTAs + Botão Hambúrguer Mobile -->
        <div class="flex items-center gap-3 shrink-0">
          <button
            @click="openWhatsAppDirect()"
            class="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all shadow-sm hover:shadow-emerald-500/10"
            title="Falar com consultor via WhatsApp"
          >
            <PhoneCall class="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </button>

          <button
            @click="handleEnterDemo"
            class="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-gradient-to-r from-[#00A896] to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Acessar Demo</span>
            <ArrowRight class="w-4 h-4" />
          </button>

          <!-- Botão Menu Mobile -->
          <button
            @click="toggleMobileMenu"
            class="lg:hidden p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-teal-400 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-[#00A896] transition-colors"
            aria-label="Abrir Menu de Navegação"
          >
            <X v-if="isMobileMenuOpen" class="w-6 h-6 text-teal-400" />
            <Menu v-else class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Menu Gaveta Mobile / Tablet (Expansível) -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="isMobileMenuOpen"
          class="lg:hidden bg-[#00142c] border-b border-teal-500/20 px-4 pt-3 pb-6 shadow-2xl backdrop-blur-xl"
        >
          <div class="flex flex-col space-y-2 text-center text-sm font-semibold text-slate-200">
            <a href="#inicio" @click="closeMobileMenu" class="py-2.5 px-4 rounded-lg hover:bg-teal-500/10 hover:text-teal-300 transition-colors">Início</a>
            <a href="#funcionalidades" @click="closeMobileMenu" class="py-2.5 px-4 rounded-lg hover:bg-teal-500/10 hover:text-teal-300 transition-colors">Módulos da Plataforma</a>
            <a href="#solucoes" @click="closeMobileMenu" class="py-2.5 px-4 rounded-lg hover:bg-teal-500/10 hover:text-teal-300 transition-colors">Soluções para Pátios & Docas</a>
            <a href="#crachas" @click="closeMobileMenu" class="py-2.5 px-4 rounded-lg hover:bg-teal-500/10 hover:text-teal-300 transition-colors">Crachá Digital de Pedestres</a>
            <a href="#lei11442" @click="closeMobileMenu" class="py-2.5 px-4 rounded-lg hover:bg-teal-500/10 hover:text-teal-300 transition-colors">Compliance Lei 11.442/07</a>
            <a href="#calculadora-roi" @click="closeMobileMenu" class="py-2.5 px-4 rounded-lg hover:bg-teal-500/10 hover:text-teal-300 transition-colors">Calculadora de ROI</a>
            <a href="#contato" @click="closeMobileMenu" class="py-2.5 px-4 rounded-lg hover:bg-teal-500/10 hover:text-teal-300 transition-colors">Fale com Especialista</a>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2.5">
            <button
              @click="openWhatsAppDirect(); closeMobileMenu()"
              class="w-full py-2.5 px-4 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2"
            >
              <PhoneCall class="w-4 h-4" />
              <span>Falar no WhatsApp: (27) 99617-4965</span>
            </button>
            <button
              @click="handleEnterDemo(); closeMobileMenu()"
              class="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-[#00A896] to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
            >
              <span>Acessar Demonstração Ao Vivo</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </transition>
    </header>

    <main class="flex-1">
      <!-- ============================================ -->
      <!-- HERO SECTION (CENTRALIZADO COM MÁXIMO IMPACTO) -->
      <!-- ============================================ -->
      <section id="inicio" class="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-gradient-to-b from-[#00142c] via-[#001c3d] to-[#02234c] flex flex-col items-center justify-center text-center">
        <!-- Background Lighting Orbs -->
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-[#00A896]/20 to-teal-400/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div class="absolute -top-10 right-10 w-80 h-80 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col items-center">
          <div class="text-center max-w-4xl mx-auto flex flex-col items-center">
            <!-- Badge -->
            <div class="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm mx-auto">
              <span class="w-2 h-2 rounded-full bg-[#00A896] animate-pulse"></span>
              Plataforma 100% Cloud • docaos.log.br • Pátios & Docas em Tempo Real
            </div>

            <!-- SEO Main H1 -->
            <h1 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-6 text-center">
              Reduza <span class="bg-gradient-to-r from-[#00A896] via-teal-300 to-sky-400 bg-clip-text text-transparent">Custos Operacionais</span> e Elimine Filas na Portaria Logística
            </h1>

            <!-- Subtitle -->
            <p class="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed mb-8 max-w-3xl mx-auto text-center">
              Plataforma corporativa de <strong>Yard Management System (YMS)</strong> e <strong>Agendamento de Docas</strong>: controle de acesso por QR Code, matriz de slots diários, crachá digital para chapas e motoristas, vistoria de lacres OEA e blindagem jurídica contra sobreestadias da Lei 11.442/07.
            </p>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 w-full max-w-md sm:max-w-none">
              <a
                href="#contato"
                class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#00A896] to-teal-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-sm sm:text-base shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 transition-all transform hover:-translate-y-0.5"
              >
                <Sparkles class="w-5 h-5 text-teal-100" />
                <span>Agendar Apresentação Comercial</span>
              </a>

              <button
                @click="handleEnterDemo"
                class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-teal-500/40 font-semibold text-sm sm:text-base transition-all shadow-md"
              >
                <span>Ver Demonstração Ao Vivo</span>
                <ChevronRight class="w-4 h-4 text-teal-400" />
              </button>
            </div>

            <!-- Key Numbers Ribbon Rigorosamente Centralizado -->
            <div class="w-full max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 sm:p-6 rounded-2xl bg-[#00142c]/80 border border-teal-500/20 backdrop-blur-md shadow-2xl mb-14 text-center justify-center items-center">
              <div class="p-2 sm:border-r border-slate-800 flex flex-col items-center justify-center">
                <div class="text-2xl sm:text-3xl font-extrabold text-[#00A896]">-42%</div>
                <div class="text-xs text-slate-400 mt-1 font-medium">Tempo de Portaria (Check-in em 35s)</div>
              </div>
              <div class="p-2 sm:border-r border-slate-800 flex flex-col items-center justify-center">
                <div class="text-2xl sm:text-3xl font-extrabold text-teal-300">Zero</div>
                <div class="text-xs text-slate-400 mt-1 font-medium">Papel & Planilhas Manuais</div>
              </div>
              <div class="p-2 sm:border-r border-slate-800 flex flex-col items-center justify-center">
                <div class="text-2xl sm:text-3xl font-extrabold text-sky-400">100%</div>
                <div class="text-xs text-slate-400 mt-1 font-medium">Auditoria & Laudo Lei 11.442</div>
              </div>
              <div class="p-2 flex flex-col items-center justify-center">
                <div class="text-2xl sm:text-3xl font-extrabold text-emerald-400">+50.000</div>
                <div class="text-xs text-slate-400 mt-1 font-medium">Acessos & Cargas Processadas</div>
              </div>
            </div>
          </div>

          <!-- Hero Realistic Logistics Photography Showcase Centralizado -->
          <div class="relative w-full max-w-5xl mx-auto flex flex-col items-center group">
            <div class="w-full relative rounded-2xl overflow-hidden border-2 border-teal-500/30 shadow-2xl shadow-teal-500/10">
              <img
                src="/images/hero-hub.jpg"
                alt="Centro de Distribuição e Hub Logístico Automatizado com DocaOS"
                class="w-full h-auto max-h-[560px] object-cover transition-transform duration-700 group-hover:scale-105"
                loading="eager"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#00142c] via-transparent to-black/30 pointer-events-none"></div>

              <!-- Floating Live Telemetry Cards -->
              <div class="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto flex flex-col sm:flex-row gap-3 pointer-events-none">
                <div class="flex items-center gap-3 p-3 sm:px-4 sm:py-3 rounded-xl bg-slate-900/90 border border-teal-500/40 backdrop-blur-md shadow-lg">
                  <div class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                  <div class="text-left">
                    <div class="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Doca 04 • Chamando BRA2E19</span>
                      <span class="px-1.5 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-300 font-mono">WhatsApp</span>
                    </div>
                    <div class="text-[11px] text-slate-400">Tempo de espera: 22 min • Alocado em Doca Frigorífica</div>
                  </div>
                </div>

                <div class="hidden md:flex items-center gap-3 p-3 sm:px-4 sm:py-3 rounded-xl bg-slate-900/90 border border-sky-500/40 backdrop-blur-md shadow-lg">
                  <ShieldCheck class="w-4 h-4 text-sky-400 shrink-0" />
                  <div class="text-left">
                    <div class="text-xs font-bold text-white">Lei 11.442/07: Tolerância Ativa</div>
                    <div class="text-[11px] text-slate-400">02h18m restantes de 5h00 • R$ 0 em sobreestadias</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- CLIENTS / TARGET OPERATORS CAROUSEL          -->
      <!-- ============================================ -->
      <section class="py-10 bg-[#00142c] border-y border-teal-500/20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <p class="text-xs uppercase tracking-wider text-teal-400/80 font-bold mb-6 text-center">
            Projetado para Operações Logísticas de Alta Densidade no Brasil
          </p>
          <div class="w-full grid grid-cols-2 md:grid-cols-6 gap-4 items-center justify-center text-slate-300 font-semibold text-xs sm:text-sm">
            <div class="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-center gap-2">
              <Warehouse class="w-4 h-4 text-[#00A896]" />
              <span>Condomínios Logísticos</span>
            </div>
            <div class="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-center gap-2">
              <Building2 class="w-4 h-4 text-[#00A896]" />
              <span>Centros de Distribuição</span>
            </div>
            <div class="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-center gap-2">
              <Truck class="w-4 h-4 text-[#00A896]" />
              <span>Operadores 3PL</span>
            </div>
            <div class="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-center gap-2">
              <Zap class="w-4 h-4 text-[#00A896]" />
              <span>Indústrias & Fábricas</span>
            </div>
            <div class="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-center gap-2">
              <Network class="w-4 h-4 text-[#00A896]" />
              <span>Transportadoras</span>
            </div>
            <div class="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-center gap-2">
              <ShieldCheck class="w-4 h-4 text-[#00A896]" />
              <span>Varejo & Atacado</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- CORE MODULES GRID CENTRALIZADO               -->
      <!-- ============================================ -->
      <section id="funcionalidades" class="py-20 bg-[#001c3d]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <div class="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
            <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30 mb-3 mx-auto">
              Módulos da Plataforma
            </span>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-center">
              Uma Plataforma Integrada, <span class="bg-gradient-to-r from-[#00A896] to-teal-300 bg-clip-text text-transparent">Toda a Operação</span> sob Controle
            </h2>
            <p class="text-slate-300 text-sm sm:text-base mt-4 text-center">
              Cada módulo foi desenvolvido para eliminar gargalos crônicos da logística: filas na guarita, docas ociosas, falta de controle de ajudantes e diárias de sobreestadia.
            </p>
          </div>

          <div class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch justify-center">
            <!-- Card 1 -->
            <div class="p-6 rounded-2xl bg-[#00142c]/80 border border-teal-500/20 hover:border-teal-500/50 transition-all hover:-translate-y-1 shadow-lg group flex flex-col">
              <div class="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#00A896] mb-5 group-hover:scale-110 transition-transform">
                <QrCode class="w-6 h-6" />
              </div>
              <h3 class="text-base font-bold text-white mb-2">Scanner QR Code & Portaria</h3>
              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed flex-1">
                Leitura instantânea de QR Code via câmera de celular, tablet ou leitor laser USB. Validação automática de placas Mercosul e liberação da cancela em menos de 40 segundos.
              </p>
            </div>

            <!-- Card 2 -->
            <div class="p-6 rounded-2xl bg-[#00142c]/80 border border-teal-500/20 hover:border-teal-500/50 transition-all hover:-translate-y-1 shadow-lg group flex flex-col">
              <div class="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#00A896] mb-5 group-hover:scale-110 transition-transform">
                <CalendarDays class="w-6 h-6" />
              </div>
              <h3 class="text-base font-bold text-white mb-2">Agendamento em Slots (Gantt)</h3>
              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed flex-1">
                Matriz de janelas horárias configuráveis (slots de 2h das 06h às 22h). Elimine conflitos de agendamento, reduza ociosidade e maximize o giro das docas.
              </p>
            </div>

            <!-- Card 3 -->
            <div class="p-6 rounded-2xl bg-[#00142c]/80 border border-teal-500/20 hover:border-teal-500/50 transition-all hover:-translate-y-1 shadow-lg group flex flex-col">
              <div class="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#00A896] mb-5 group-hover:scale-110 transition-transform">
                <BadgeCheck class="w-6 h-6" />
              </div>
              <h3 class="text-base font-bold text-white mb-2">Crachá Digital de Pedestres</h3>
              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed flex-1">
                Credenciamento de ajudantes (chapas), motoristas e prestadores em 2 minutos. Envio imediato para o celular via WhatsApp ou impressão no padrão crachá de bolso.
              </p>
            </div>

            <!-- Card 4 -->
            <div class="p-6 rounded-2xl bg-[#00142c]/80 border border-teal-500/20 hover:border-teal-500/50 transition-all hover:-translate-y-1 shadow-lg group flex flex-col">
              <div class="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#00A896] mb-5 group-hover:scale-110 transition-transform">
                <Camera class="w-6 h-6" />
              </div>
              <h3 class="text-base font-bold text-white mb-2">Vistoria de Lacres OEA</h3>
              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed flex-1">
                Auditoria de integridade de lacres (rompido, intacto, divergente da NF) e registro fotográfico de avarias físicas na carga antes da entrada ou saída da cancela.
              </p>
            </div>

            <!-- Card 5 -->
            <div class="p-6 rounded-2xl bg-[#00142c]/80 border border-teal-500/20 hover:border-teal-500/50 transition-all hover:-translate-y-1 shadow-lg group flex flex-col">
              <div class="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#00A896] mb-5 group-hover:scale-110 transition-transform">
                <Truck class="w-6 h-6" />
              </div>
              <h3 class="text-base font-bold text-white mb-2">Gestão de Frotas & Veículos</h3>
              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed flex-1">
                Cadastro detalhado por tipo de veículo (VUC, Toco, Truck, Carreta, Bitrem), especificação de carroceria (Sider, Baú, Frigorífico) e capacidade em pallets.
              </p>
            </div>

            <!-- Card 6 -->
            <div class="p-6 rounded-2xl bg-[#00142c]/80 border border-teal-500/20 hover:border-teal-500/50 transition-all hover:-translate-y-1 shadow-lg group flex flex-col">
              <div class="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#00A896] mb-5 group-hover:scale-110 transition-transform">
                <Layers class="w-6 h-6" />
              </div>
              <h3 class="text-base font-bold text-white mb-2">Torre de Controle Kanban</h3>
              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed flex-1">
                Visão macro em tempo real com WebSockets. Arraste veículos entre as etapas (Agendado, No Pátio, Em Doca e Liberado) com notificações push e alertas sonoros.
              </p>
            </div>

            <!-- Card 7 -->
            <div class="p-6 rounded-2xl bg-[#00142c]/80 border border-teal-500/20 hover:border-teal-500/50 transition-all hover:-translate-y-1 shadow-lg group flex flex-col">
              <div class="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#00A896] mb-5 group-hover:scale-110 transition-transform">
                <Smartphone class="w-6 h-6" />
              </div>
              <h3 class="text-base font-bold text-white mb-2">Cerca GPS & Check-in PWA</h3>
              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed flex-1">
                Sem necessidade de baixar apps em lojas. Motorista realiza pré-check-in no navegador e entra na fila automaticamente quando entra no raio georreferenciado do pátio.
              </p>
            </div>

            <!-- Card 8 -->
            <div class="p-6 rounded-2xl bg-[#00142c]/80 border border-teal-500/20 hover:border-teal-500/50 transition-all hover:-translate-y-1 shadow-lg group flex flex-col">
              <div class="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#00A896] mb-5 group-hover:scale-110 transition-transform">
                <Lock class="w-6 h-6" />
              </div>
              <h3 class="text-base font-bold text-white mb-2">Multi-Tenant com Segurança RLS</h3>
              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed flex-1">
                Gestão centralizada de múltiplos condomínios e clientes. Isolamento total de dados no banco de dados e perfis granulares (Master, Portaria, Doca, Transportador).
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- DEEP DIVE 1: ACCESS CONTROL & GATE           -->
      <!-- ============================================ -->
      <section id="solucoes" class="py-20 bg-gradient-to-b from-[#001c3d] to-[#00142c] border-t border-teal-500/10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <!-- Content -->
            <div class="flex flex-col justify-center">
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30 mb-4 w-fit">
                Controle de Acesso & Guarita
              </span>
              <h2 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-5 leading-tight">
                Reduza em até 42% o tempo de <span class="text-[#00A896]">liberação na portaria</span>
              </h2>
              <p class="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                Filas de caminhões na portaria geram bloqueios na via pública, multas, insatisfação de motoristas e custos com horas extras. O módulo de Portaria Inteligente do DocaOS substitui anotações em pranchetas por validação óptica instantânea.
              </p>

              <ul class="space-y-3.5 mb-8">
                <li class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-[#00A896] shrink-0 mt-0.5" />
                  <span class="text-sm text-slate-200"><strong>Leitura Óptica Universal:</strong> funciona na câmera do celular, tablet ou leitores de código de barras USB de alta performance.</span>
                </li>
                <li class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-[#00A896] shrink-0 mt-0.5" />
                  <span class="text-sm text-slate-200"><strong>Checklist de Vistoria OEA:</strong> conferência de numeração de lacre (intacto, violado ou divergente da NF) e registro fotográfico de avarias.</span>
                </li>
                <li class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-[#00A896] shrink-0 mt-0.5" />
                  <span class="text-sm text-slate-200"><strong>Validação Unificada:</strong> valida no mesmo totem tanto carretas e contêineres quanto pedestres e crachás de ajudantes.</span>
                </li>
                <li class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-[#00A896] shrink-0 mt-0.5" />
                  <span class="text-sm text-slate-200"><strong>Disparo Automático do Relógio da Lei 11.442:</strong> timestamp com carimbo de tempo inviolável assim que o caminhão cruza a cancela.</span>
                </li>
              </ul>

              <div>
                <a
                  href="#contato"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00A896] to-teal-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-teal-500/20 transition-all"
                >
                  <span>Solicitar Proposta para Portaria</span>
                  <ArrowRight class="w-4 h-4" />
                </a>
              </div>
            </div>

            <!-- Photo Showcase Centralizado -->
            <div class="relative group flex justify-center items-center">
              <div class="w-full rounded-2xl overflow-hidden border-2 border-teal-500/30 shadow-2xl shadow-teal-500/10">
                <img
                  src="/images/gate-portaria.jpg"
                  alt="Portaria Inteligente de Centro de Distribuição com Totem QR Code e Vistoria DocaOS"
                  class="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div class="absolute -bottom-4 -right-4 p-4 rounded-xl bg-[#00142c] border border-teal-500/40 shadow-xl hidden sm:block">
                <div class="text-xs text-slate-400">Tempo Médio de Liberação</div>
                <div class="text-xl font-bold text-teal-300">35 segundos / carreta</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- DEEP DIVE 2: DOCK MANAGEMENT & GANTT         -->
      <!-- ============================================ -->
      <section class="py-20 bg-[#00142c] border-t border-teal-500/10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <!-- Photo Showcase Centralizado -->
            <div class="relative group order-2 lg:order-1 flex justify-center items-center">
              <div class="w-full rounded-2xl overflow-hidden border-2 border-teal-500/30 shadow-2xl shadow-teal-500/10">
                <img
                  src="/images/dock-operations.jpg"
                  alt="Operação de Docas e Carregamento com Caminhões e Empilhadeiras no DocaOS"
                  class="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div class="absolute -bottom-4 -left-4 p-4 rounded-xl bg-[#001c3d] border border-teal-500/40 shadow-xl hidden sm:block">
                <div class="text-xs text-slate-400">Giro & Produtividade</div>
                <div class="text-xl font-bold text-[#00A896]">+30% de Carretas / Doca</div>
              </div>
            </div>

            <!-- Content -->
            <div class="order-1 lg:order-2 flex flex-col justify-center">
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30 mb-4 w-fit">
                Gestão & Agendamento de Docas
              </span>
              <h2 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-5 leading-tight">
                Aumente a <span class="text-[#00A896]">produtividade das docas</span> em até 30%
              </h2>
              <p class="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                Docas ociosas ou com conflito de horários de descarregamento causam estrangulamento imediato no armazém. O DocaOS oferece visão dual: monitoramento físico em tempo real e timeline horizontal de slots diários.
              </p>

              <ul class="space-y-3.5 mb-8">
                <li class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-[#00A896] shrink-0 mt-0.5" />
                  <span class="text-sm text-slate-200"><strong>Modo Tempo Real (Grid Físico):</strong> status visual de cada doca (Livre, Ocupada, Manutenção) com placa do veículo alocado e tempo de operação.</span>
                </li>
                <li class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-[#00A896] shrink-0 mt-0.5" />
                  <span class="text-sm text-slate-200"><strong>Modo Agenda (Gantt em Slots):</strong> matriz diária de janelas horárias de 2h (06h às 22h) permitindo encaixar agendamentos e antecipar gargalos.</span>
                </li>
                <li class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-[#00A896] shrink-0 mt-0.5" />
                  <span class="text-sm text-slate-200"><strong>Chamada de Motorista em 1 Clique via WhatsApp:</strong> notifique o próximo motorista da fila do pátio para encostar na doca com instrução clara.</span>
                </li>
                <li class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-[#00A896] shrink-0 mt-0.5" />
                  <span class="text-sm text-slate-200"><strong>Trava Atômica de Alocação:</strong> impossibilita alocar dois veículos na mesma doca no mesmo slot, evitando colisões operacionais.</span>
                </li>
              </ul>

              <div>
                <button
                  @click="handleEnterDemo"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-bold text-sm transition-all"
                >
                  <span>Experimentar Agenda de Docas</span>
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- DEEP DIVE 3: DIGITAL BADGE (CRACHÁ)          -->
      <!-- ============================================ -->
      <section id="crachas" class="py-20 bg-gradient-to-b from-[#00142c] to-[#001c3d] border-t border-teal-500/10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <!-- Content -->
            <div class="flex flex-col justify-center">
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 mb-4 w-fit">
                Controle de Pedestres & Chapas
              </span>
              <h2 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-5 leading-tight">
                Crachá Digital para <span class="text-[#00A896]">Ajudantes, Chapas e Motoristas</span>
              </h2>
              <p class="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                Terminais logísticos precisam de controle rigoroso sobre quem circula a pé entre as carretas e docas. O módulo de Crachá Digital do DocaOS garante identificação imediata, segurança patrimonial e conformidade com normas trabalhistas e de segurança.
              </p>

              <ul class="space-y-3.5 mb-8">
                <li class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-[#00A896] shrink-0 mt-0.5" />
                  <span class="text-sm text-slate-200"><strong>Envio Direto via WhatsApp:</strong> o operador de portaria cadastra o ajudante e dispara o crachá direto para o WhatsApp dele em 10 segundos.</span>
                </li>
                <li class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-[#00A896] shrink-0 mt-0.5" />
                  <span class="text-sm text-slate-200"><strong>QR Code Criptografado & Antifraude:</strong> assinatura digital intransferível contendo CPF, empresa, placa vinculada e zonas autorizadas.</span>
                </li>
                <li class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-[#00A896] shrink-0 mt-0.5" />
                  <span class="text-sm text-slate-200"><strong>Layout Pronto para Impressão PVC / Bolso:</strong> formato crachá com tarja institucional da empresa, foto e código legível por qualquer scanner.</span>
                </li>
                <li class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-[#00A896] shrink-0 mt-0.5" />
                  <span class="text-sm text-slate-200"><strong>Censo do Pátio em Tempo Real:</strong> saiba exatamente quantas pessoas a pé estão no pátio em caso de evacuação ou auditoria fiscal.</span>
                </li>
              </ul>

              <div>
                <button
                  @click="openWhatsAppDirect('Olá! Gostaria de entender mais sobre como funciona o Crachá Digital para chapas e ajudantes no DocaOS.')"
                  class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <PhoneCall class="w-4 h-4" />
                  <span>Tirar Dúvidas sobre o Crachá</span>
                </button>
              </div>
            </div>

            <!-- Photo Showcase Centralizado -->
            <div class="relative group flex justify-center items-center">
              <div class="w-full rounded-2xl overflow-hidden border-2 border-teal-500/30 shadow-2xl shadow-teal-500/10">
                <img
                  src="/images/driver-cracha.jpg"
                  alt="Motorista e Ajudante de Carga Apresentando Crachá Digital DocaOS no Celular"
                  class="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div class="absolute -bottom-4 -right-4 p-4 rounded-xl bg-[#00142c] border border-teal-500/40 shadow-xl hidden sm:block">
                <div class="text-xs text-slate-400">Onboarding de Chapas</div>
                <div class="text-xl font-bold text-emerald-400">100% Digital via WhatsApp</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- SECTION: LEI FEDERAL 11.442/2007 CENTRALIZADA -->
      <!-- ============================================ -->
      <section id="lei11442" class="py-20 bg-[#00142c] border-t border-teal-500/10 flex flex-col items-center">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div class="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 to-[#001c3d] border border-teal-500/30 relative overflow-hidden shadow-2xl">
            <div class="absolute -right-20 -top-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10">
              <div class="lg:col-span-2">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 mb-4">
                  <Scale class="w-3.5 h-3.5" />
                  Compliance Jurídico & Proteção Financeira
                </div>
                <h2 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                  Blindagem Jurídica sob a <span class="text-[#00A896]">Lei Federal 11.442/2007 (Art. 5º-A)</span>
                </h2>
                <p class="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                  A legislação brasileira estipula o prazo máximo de <strong>5 horas para carga ou descarga</strong> a partir da chegada do caminhão no terminal. Após esse prazo, cada hora excedente pode gerar cobranças de diária de até R$ 200,00/veículo por parte de transportadoras.
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-200">
                  <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <strong class="text-white block mb-1">⏱️ Cronômetro Legal Inviolável</strong>
                    Início automático na portaria e paralisação automática em caso de intempéries ou atraso comprovado do motorista.
                  </div>
                  <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <strong class="text-white block mb-1">📄 Laudo Pericial Digital</strong>
                    Emissão de PDF com carimbo de tempo, dados de guarita e assinaturas digitais para impugnar cobranças indevidas de sobreestadia.
                  </div>
                </div>
              </div>

              <!-- Visual badge box Centralizado -->
              <div class="p-6 rounded-2xl bg-[#00142c] border border-teal-500/30 text-center flex flex-col justify-center items-center">
                <div class="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Economia Média Apurada</div>
                <div class="text-3xl sm:text-4xl font-extrabold text-[#00A896] mb-2">R$ 84.000+</div>
                <div class="text-xs text-slate-300 mb-6 max-w-xs">economizados por mês em diárias e contestações abusivas de frotistas.</div>
                <a
                  href="#calculadora-roi"
                  class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold transition-colors"
                >
                  <BarChart3 class="w-4 h-4" />
                  <span>Calcular Economia do Seu CD</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- ROI CALCULATOR SECTION RIGOROSAMENTE CENTRALIZADA -->
      <!-- ============================================ -->
      <section id="calculadora-roi" class="py-20 bg-[#001c3d] border-t border-teal-500/10 flex flex-col items-center">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center">
          <div class="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
            <span class="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30 mb-3 mx-auto">
              Simulador de Economia Real
            </span>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-center">
              Quanto o seu armazém pode <span class="bg-gradient-to-r from-[#00A896] to-teal-300 bg-clip-text text-transparent">economizar</span> por mês?
            </h2>
            <p class="text-slate-300 text-sm sm:text-base mt-4 text-center">
              Ajuste as variáveis reais do seu centro de distribuição ou condomínio logístico e descubra o impacto financeiro da eliminação de filas e sobreestadias.
            </p>
          </div>

          <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            <!-- Inputs -->
            <div class="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-[#00142c] border border-teal-500/20 shadow-xl space-y-6">
              <!-- Slider 1 -->
              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="text-xs sm:text-sm font-semibold text-slate-200">Volume diário de carretas / caminhões:</label>
                  <span class="text-sm font-extrabold text-[#00A896] font-mono">{{ dailyTrucks }} veículos/dia</span>
                </div>
                <input
                  v-model.number="dailyTrucks"
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00A896]"
                />
                <div class="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>10 (Operação Leve)</span>
                  <span>100 (Médio Porte)</span>
                  <span>200+ (Hub Nacional)</span>
                </div>
              </div>

              <!-- Slider 2 -->
              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="text-xs sm:text-sm font-semibold text-slate-200">Tempo médio de permanência (Dwell Time):</label>
                  <span class="text-sm font-extrabold text-amber-400 font-mono">{{ avgDwellHours }} horas</span>
                </div>
                <input
                  v-model.number="avgDwellHours"
                  type="range"
                  min="3.0"
                  max="12.0"
                  step="0.5"
                  class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div class="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>3.0h (Ideal)</span>
                  <span>5.0h (Limite Lei 11.442)</span>
                  <span>12.0h (Gargalo Severo)</span>
                </div>
              </div>

              <!-- Slider 3 -->
              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="text-xs sm:text-sm font-semibold text-slate-200">Valor médio cobrado por hora de sobreestadia:</label>
                  <span class="text-sm font-extrabold text-sky-400 font-mono">R$ {{ hourlyFee }},00 / hora</span>
                </div>
                <input
                  v-model.number="hourlyFee"
                  type="range"
                  min="80"
                  max="300"
                  step="10"
                  class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <div class="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>R$ 80 (VUC/Toco)</span>
                  <span>R$ 160 (Carreta Padrão)</span>
                  <span>R$ 300 (Frigorífico)</span>
                </div>
              </div>
            </div>

            <!-- Output Box Centralizada -->
            <div class="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#00142c] to-[#02234c] border-2 border-teal-500/40 shadow-2xl text-center flex flex-col items-center">
              <div class="text-xs uppercase tracking-wider text-teal-300 font-bold mb-2">Economia Mensal Estimada</div>
              <div class="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00A896] via-teal-300 to-emerald-400 mb-2">
                {{ formatBRL(calculatedRoi.monthlySavings) }}
              </div>
              <div class="text-xs text-slate-400 mb-6">redução direta de perdas por sobreestadia e diárias</div>

              <div class="w-full space-y-3 pt-4 border-t border-slate-800 text-left text-xs sm:text-sm">
                <div class="flex justify-between text-slate-300">
                  <span>Horas excedentes/carreta:</span>
                  <span class="font-bold text-amber-400">{{ calculatedRoi.excessHours }}h além da tolerância</span>
                </div>
                <div class="flex justify-between text-slate-300">
                  <span>Custo mensal sem YMS:</span>
                  <span class="font-bold text-rose-400">{{ formatBRL(calculatedRoi.monthlyCost) }}</span>
                </div>
                <div class="flex justify-between text-slate-300">
                  <span>Horas produtivas recuperadas:</span>
                  <span class="font-bold text-teal-300">{{ calculatedRoi.hoursSavedPerYear }} horas/ano</span>
                </div>
              </div>

              <a
                href="#contato"
                class="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00A896] to-teal-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-teal-500/20"
              >
                <span>Apresentar Diagnóstico à Diretoria</span>
                <ArrowRight class="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- TESTIMONIALS SECTION CENTRALIZADA            -->
      <!-- ============================================ -->
      <section class="py-20 bg-[#00142c] border-t border-teal-500/10 flex flex-col items-center">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center">
          <div class="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
            <span class="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30 mb-3 mx-auto">
              Cases de Sucesso
            </span>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-center">
              O que Diretores e Gestores Logísticos <span class="text-[#00A896]">Dizem Sobre o DocaOS</span>
            </h2>
          </div>

          <div class="w-full grid grid-cols-1 md:grid-cols-3 gap-6 justify-center">
            <!-- Testimonial 1 -->
            <div class="p-6 rounded-2xl bg-[#001c3d]/80 border border-teal-500/20 flex flex-col justify-between shadow-lg">
              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed italic mb-6">
                "Reduzimos o tempo de liberação de carretas na portaria de 14 para 3 minutos. O DocaOS eliminou completamente as planilhas de papel e nos deu visibilidade total do fluxo de caminhões. O retorno sobre investimento aconteceu em menos de 60 dias."
              </p>
              <div class="flex items-center gap-3 pt-4 border-t border-slate-800">
                <div class="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center font-bold text-teal-300 text-sm">
                  CS
                </div>
                <div>
                  <div class="text-xs sm:text-sm font-bold text-white">Carlos Eduardo Silva</div>
                  <div class="text-[11px] text-slate-400">Diretor de Operações — LogCenter Sudeste</div>
                </div>
              </div>
            </div>

            <!-- Testimonial 2 -->
            <div class="p-6 rounded-2xl bg-[#001c3d]/80 border border-teal-500/20 flex flex-col justify-between shadow-lg">
              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed italic mb-6">
                "Antes do DocaOS, gastávamos cerca de 3 horas por dia resolvendo conflitos de transportadoras na porta das docas. A Matriz de Slots em Gantt e a chamada direta por WhatsApp organizaram nossa expedição. Nossa produtividade de docas aumentou 28%."
              </p>
              <div class="flex items-center gap-3 pt-4 border-t border-slate-800">
                <div class="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center font-bold text-sky-300 text-sm">
                  AF
                </div>
                <div>
                  <div class="text-xs sm:text-sm font-bold text-white">Ana Beatriz Ferreira</div>
                  <div class="text-[11px] text-slate-400">Head de Supply Chain — GalpãoLog Distribuição</div>
                </div>
              </div>
            </div>

            <!-- Testimonial 3 -->
            <div class="p-6 rounded-2xl bg-[#001c3d]/80 border border-teal-500/20 flex flex-col justify-between shadow-lg">
              <p class="text-slate-300 text-xs sm:text-sm leading-relaxed italic mb-6">
                "O Crachá Digital para chapas e ajudantes foi um divisor de águas na segurança patrimonial do nosso condomínio logístico. Credenciamos centenas de terceiros por mês sem papel, com rastreabilidade total de quem entra e sai."
              </p>
              <div class="flex items-center gap-3 pt-4 border-t border-slate-800">
                <div class="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300 text-sm">
                  RM
                </div>
                <div>
                  <div class="text-xs sm:text-sm font-bold text-white">Roberto Mendes</div>
                  <div class="text-[11px] text-slate-400">Gerente de Segurança & Pátio — CD Hub Minas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- FAQ SECTION CENTRALIZADA                     -->
      <!-- ============================================ -->
      <section class="py-20 bg-[#001c3d] border-t border-teal-500/10 flex flex-col items-center">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center">
          <div class="text-center mb-14 flex flex-col items-center">
            <span class="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30 mb-3 mx-auto">
              Perguntas Frequentes
            </span>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-center">
              Tudo o que você precisa saber sobre o <span class="text-[#00A896]">DocaOS</span>
            </h2>
          </div>

          <div class="w-full space-y-4">
            <div
              v-for="(faq, index) in faqs"
              :key="index"
              class="rounded-xl bg-[#00142c] border border-teal-500/20 overflow-hidden transition-colors"
            >
              <button
                @click="activeFaq = activeFaq === index ? -1 : index"
                class="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-200 hover:text-teal-300 transition-colors"
              >
                <span>{{ faq.q }}</span>
                <ChevronDown
                  class="w-5 h-5 text-teal-400 shrink-0 transition-transform duration-200"
                  :class="{ 'rotate-180': activeFaq === index }"
                />
              </button>
              <div v-show="activeFaq === index" class="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                {{ faq.a }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- CONTACT FORM SECTION (CENTRALIZADA B2B)      -->
      <!-- ============================================ -->
      <section id="contato" class="py-20 bg-gradient-to-b from-[#00142c] to-[#000e20] border-t border-teal-500/20 flex flex-col items-center">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <!-- Centered Header -->
          <div class="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
            <span class="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30 mb-3 mx-auto">
              Fale com Nossos Especialistas
            </span>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-center">
              Pronto para transformar a gestão do seu <span class="text-[#00A896]">pátio logístico</span>?
            </h2>
            <p class="text-slate-300 text-sm sm:text-base mt-4 text-center">
              Agende uma reunião consultiva personalizada com nossa equipe de engenharia e operações. Analisamos seu fluxo de veículos e desenhamos a implantação ideal para seu CD.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start justify-center max-w-6xl mx-auto">
            <!-- Left info -->
            <div class="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div class="space-y-4">
                <div class="flex items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <PhoneCall class="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div class="text-[11px] text-slate-400">Atendimento Imediato via WhatsApp</div>
                    <a :href="`https://wa.me/55${contactInfo.whatsappRaw}`" target="_blank" class="text-xs sm:text-sm font-bold text-white hover:text-emerald-400 transition-colors">
                      {{ contactInfo.whatsappDisplay }}
                    </a>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <Mail class="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <div class="text-[11px] text-slate-400">E-mail Comercial & Suporte</div>
                    <a :href="`mailto:${contactInfo.email}`" class="text-xs sm:text-sm font-bold text-white hover:text-teal-400 transition-colors">
                      {{ contactInfo.email }}
                    </a>
                  </div>
                </div>

                <div class="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/30 transition-colors">
                  <img src="/raos-icon.png" alt="RAOS Tecnologia" class="w-11 h-11 object-contain rounded-xl p-1 bg-slate-800/90 border border-teal-500/30 shadow-md shrink-0" />
                  <div>
                    <div class="text-[11px] text-teal-400/90 font-semibold uppercase tracking-wider">Empresa Desenvolvedora</div>
                    <div class="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-1.5">
                      <span>RAOS Tecnologia</span>
                      <span class="text-[11px] font-normal text-slate-400">• CNPJ: {{ contactInfo.cnpj }}</span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5">Software House Especializada em Soluções Logísticas</div>
                  </div>
                </div>
              </div>

              <!-- Quick direct WhatsApp CTA -->
              <div class="pt-2">
                <button
                  @click="openWhatsAppDirect()"
                  class="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all"
                >
                  <PhoneCall class="w-4 h-4" />
                  <span>Conversar Agora pelo WhatsApp</span>
                </button>
              </div>
            </div>

            <!-- Right form -->
            <div class="lg:col-span-7 p-6 sm:p-10 rounded-3xl bg-[#00142c] border border-teal-500/30 shadow-2xl">
              <h3 class="text-xl font-bold text-white mb-2">Solicite uma Proposta Personalizada</h3>
              <p class="text-slate-400 text-xs sm:text-sm mb-6">Preencha os dados da sua operação e nosso time entrará em contato em até 2 horas úteis.</p>

              <form @submit.prevent="handleDemoSubmit" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
                    <input
                      v-model="demoForm.name"
                      required
                      type="text"
                      placeholder="Ex: Roberto Silva"
                      class="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-[#00A896] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">E-mail Corporativo *</label>
                    <input
                      v-model="demoForm.email"
                      required
                      type="email"
                      placeholder="roberto@empresa.com.br"
                      class="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-[#00A896] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Empresa / Condomínio *</label>
                    <input
                      v-model="demoForm.company"
                      required
                      type="text"
                      placeholder="Nome da sua empresa"
                      class="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-[#00A896] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">WhatsApp / Telefone *</label>
                    <input
                      v-model="demoForm.phone"
                      required
                      type="tel"
                      placeholder="(00) 00000-0000"
                      class="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-[#00A896] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Segmento Operacional *</label>
                    <select
                      v-model="demoForm.segment"
                      class="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-[#00A896] focus:outline-none transition-colors"
                    >
                      <option value="condominio-logistico">Condomínio Logístico</option>
                      <option value="centro-distribuicao">Centro de Distribuição (CD)</option>
                      <option value="operador-logistico">Operador 3PL</option>
                      <option value="industria">Indústria / Fábrica</option>
                      <option value="transportadora">Transportadora</option>
                      <option value="varejo">Varejo / Atacado</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Número de Docas</label>
                    <select
                      v-model="demoForm.docks"
                      class="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-[#00A896] focus:outline-none transition-colors"
                    >
                      <option value="1-5">1 a 5 docas</option>
                      <option value="6-15">6 a 15 docas</option>
                      <option value="16-30">16 a 30 docas</option>
                      <option value="31-50">31 a 50 docas</option>
                      <option value="50+">Mais de 50 docas</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Desafios Atuais da Operação</label>
                  <textarea
                    v-model="demoForm.message"
                    rows="3"
                    placeholder="Ex: Temos filas na portaria pela manhã, sobreestadias de caminhões frigoríficos e precisamos de agendamento em slots..."
                    class="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-[#00A896] focus:outline-none transition-colors"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  :disabled="isSubmittingDemo || demoSuccess"
                  class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#00A896] to-teal-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span v-if="isSubmittingDemo">Enviando solicitação...</span>
                  <span v-else-if="demoSuccess">✓ Solicitação Enviada com Sucesso!</span>
                  <span v-else>Solicitar Apresentação e Proposta</span>
                </button>

                <div v-if="demoSuccess" class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center">
                  Obrigado! Recebemos sua solicitação. Nosso consultor entrará em contato em breve pelo telefone/WhatsApp informado.
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- ============================================ -->
    <!-- FOOTER CENTRALIZADO & HARMONIOSO             -->
    <!-- ============================================ -->
    <footer class="bg-[#000e20] border-t border-teal-500/20 py-12 text-slate-400 text-xs sm:text-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <!-- Col 1: Brand -->
          <div class="space-y-4">
            <img src="/docaos-logo.png" alt="DocaOS - Patio & Dock Operating System" class="h-10 w-auto" />
            <p class="text-xs text-slate-400 leading-relaxed">
              Sistema Operacional de Pátios (YMS) e Agendamento Inteligente de Docas com credenciamento por Crachá Digital e auditoria probatória sob a Lei Federal 11.442/2007.
            </p>
            <div class="text-[11px] text-teal-400/80 font-mono">
              Domínio Oficial: docaos.log.br
            </div>
          </div>

          <!-- Col 2: Soluções -->
          <div>
            <div class="font-bold text-white text-xs uppercase tracking-wider mb-3">Módulos & Soluções</div>
            <ul class="space-y-2 text-xs">
              <li><a href="#funcionalidades" class="hover:text-teal-300 transition-colors">Portaria Express & Vistoria</a></li>
              <li><a href="#solucoes" class="hover:text-teal-300 transition-colors">Agendamento em Slots (Gantt)</a></li>
              <li><a href="#crachas" class="hover:text-teal-300 transition-colors">Crachá Digital de Pedestres</a></li>
              <li><a href="#lei11442" class="hover:text-teal-300 transition-colors">Laudo Pericial Lei 11.442/07</a></li>
              <li><a href="#funcionalidades" class="hover:text-teal-300 transition-colors">Cerca Virtual GPS & PWA</a></li>
            </ul>
          </div>

          <!-- Col 3: Links Rápidos -->
          <div>
            <div class="font-bold text-white text-xs uppercase tracking-wider mb-3">Acesso Rápido</div>
            <ul class="space-y-2 text-xs">
              <li><router-link to="/app" class="hover:text-teal-300 transition-colors">Torre de Controle (Kanban)</router-link></li>
              <li><router-link to="/docas" class="hover:text-teal-300 transition-colors">Gestão & Agenda de Docas</router-link></li>
              <li><router-link to="/portaria" class="hover:text-teal-300 transition-colors">Portaria & Vistoria</router-link></li>
              <li><router-link to="/crachas" class="hover:text-teal-300 transition-colors">Emissão de Crachás</router-link></li>
              <li><router-link to="/login" class="hover:text-teal-300 transition-colors">Login do Operador</router-link></li>
            </ul>
          </div>

          <!-- Col 4: Contato -->
          <div>
            <div class="font-bold text-white text-xs uppercase tracking-wider mb-3">Contato & Empresa</div>
            <div class="flex items-center gap-2.5 mb-2.5">
              <img src="/raos-icon.png" alt="RAOS Tecnologia" class="w-6 h-6 object-contain rounded-md border border-slate-700 bg-slate-800/80 p-0.5" />
              <span class="font-bold text-white text-xs">RAOS Tecnologia</span>
            </div>
            <div class="space-y-1.5 text-xs text-slate-400">
              <div>CNPJ: {{ contactInfo.cnpj }}</div>
              <div>WhatsApp: {{ contactInfo.whatsappDisplay }}</div>
              <div>E-mail: {{ contactInfo.email }}</div>
            </div>
          </div>
        </div>

        <div class="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <div>
            © 2026 DocaOS (docaos.log.br) • Desenvolvido por RAOS Tecnologia. Todos os direitos reservados.
          </div>
          <div class="flex items-center gap-6 justify-center">
            <span>Lei 11.442/2007 Compliant</span>
            <span>Segurança RLS Supabase</span>
            <span>100% Cloud</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
