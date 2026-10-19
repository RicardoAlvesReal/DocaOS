<script setup>
import { ref, onMounted, watch } from 'vue'
import { useYardStore } from '../stores/yard'
import { 
  Network, 
  Key, 
  Send, 
  Trash2, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ShieldCheck, 
  Code2, 
  Terminal,
  ExternalLink,
  X,
  GraduationCap,
  Users,
  Cpu,
  MapPin,
  PhoneCall,
  Radio,
  Navigation,
  Truck
} from 'lucide-vue-next'

const yardStore = useYardStore()

const webhooks = ref([])
const apiKeys = ref([])
const isLoading = ref(false)

// Configuração de Telemetria / Rastreadores Veiculares (Autotrac, Sascar, OnixSat, etc)
const telemetryConfig = ref({
  has_telemetry_integration: false,
  telemetry_provider: 'Generic_Webhook',
  telemetry_api_key: '',
  telemetry_client_id: '',
  telemetry_endpoint: '',
  ingestion_webhook_url: ''
})
const isSavingTelemetry = ref(false)
const isTestingTelemetry = ref(false)
const telemetryTestResult = ref(null)

// Provedores pré-configurados
const telemetryProviders = [
  { id: 'Autotrac', name: 'Autotrac (API WebServices / Satelital)' },
  { id: 'Sascar', name: 'Sascar / Michelin Connected Fleet' },
  { id: 'OnixSat', name: 'OnixSat / Buonny Gerenciamento' },
  { id: 'Omnilink', name: 'Omnilink / Zatix Frotas' },
  { id: 'Cobli', name: 'Cobli Gestão de Frotas' },
  { id: 'Generic_Webhook', name: 'Webhook Genérico (Open Telematics Protocol)' }
]

// Modais
const isNewWebhookModalOpen = ref(false)
const newWebhookForm = ref({
  target_url: '',
  events: 'schedule.created,vehicle.checked_in,vehicle.docked,vehicle.completed,vehicle.released'
})

const isNewApiKeyModalOpen = ref(false)
const newApiKeyForm = ref({ name: '' })
const createdApiKey = ref(null)

const isTestingWebhook = ref({})

async function fetchIntegrations() {
  if (!yardStore.currentTenant) return
  isLoading.value = true
  try {
    const [resWh, resKeys, resTele] = await Promise.all([
      fetch(`/api/v1/integrations/webhooks?tenant_id=${yardStore.currentTenant.id}`),
      fetch(`/api/v1/integrations/api-keys?tenant_id=${yardStore.currentTenant.id}`),
      fetch(`/api/v1/integrations/telemetry?tenant_id=${yardStore.currentTenant.id}`)
    ])
    if (resWh.ok) webhooks.value = await resWh.json()
    if (resKeys.ok) apiKeys.value = await resKeys.json()
    if (resTele.ok) telemetryConfig.value = await resTele.json()
  } catch (err) {
    console.error('Erro ao buscar integrações:', err)
  } finally {
    isLoading.value = false
  }
}

async function saveTelemetryConfig() {
  if (!yardStore.currentTenant) return
  isSavingTelemetry.value = true
  try {
    const res = await fetch('/api/v1/integrations/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: yardStore.currentTenant.id,
        ...telemetryConfig.value
      })
    })
    if (res.ok) {
      yardStore.showNotification('Conector de rastreador veicular salvo com sucesso!', 'success')
    } else {
      throw new Error()
    }
  } catch {
    yardStore.showNotification('Falha ao salvar configuração de rastreadores.', 'error')
  } finally {
    isSavingTelemetry.value = false
  }
}

async function testTelemetryPing() {
  if (!yardStore.currentTenant) return
  isTestingTelemetry.value = true
  telemetryTestResult.value = null
  try {
    const res = await fetch('/api/v1/integrations/telemetry/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: yardStore.currentTenant.id,
        vehicle_plate: 'BRA2E19',
        latitude: -20.3150,
        longitude: -40.3120,
        accuracy_meters: 8.5,
        speed_kmh: 45
      })
    })
    const data = await res.json()
    telemetryTestResult.value = data
    yardStore.showNotification(data.message, data.success ? 'success' : 'info')
  } catch {
    yardStore.showNotification('Erro ao disparar ping de telemetria.', 'error')
  } finally {
    isTestingTelemetry.value = false
  }
}

async function handleCreateWebhook() {
  if (!newWebhookForm.value.target_url) return
  try {
    const res = await fetch('/api/v1/integrations/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: yardStore.currentTenant.id,
        target_url: newWebhookForm.value.target_url,
        events: newWebhookForm.value.events
      })
    })

    if (res.ok) {
      const created = await res.json()
      webhooks.value.unshift(created)
      isNewWebhookModalOpen.value = false
      newWebhookForm.value.target_url = ''
      yardStore.showNotification('Endpoint de Webhook registrado com sucesso!', 'success')
    }
  } catch (err) {
    yardStore.showNotification('Erro ao cadastrar webhook.', 'error')
  }
}

async function handleDeleteWebhook(id) {
  if (!confirm('Deseja realmente remover este Webhook? O ERP não receberá mais notificações.')) return
  try {
    const res = await fetch(`/api/v1/integrations/webhooks/${id}`, { method: 'DELETE' })
    if (res.ok) {
      webhooks.value = webhooks.value.filter(w => w.id !== id)
      yardStore.showNotification('Webhook removido com sucesso.', 'info')
    }
  } catch (err) {
    yardStore.showNotification('Falha ao remover webhook.', 'error')
  }
}

async function handleTestWebhook(id) {
  isTestingWebhook.value[id] = true
  try {
    const res = await fetch(`/api/v1/integrations/webhooks/${id}/test`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      yardStore.showNotification(data.message || 'Disparo de teste efetuado!', 'success')
    } else {
      yardStore.showNotification('Falha ao enviar webhook de teste.', 'error')
    }
  } catch (err) {
    yardStore.showNotification('Erro no teste de conectividade.', 'error')
  } finally {
    isTestingWebhook.value[id] = false
  }
}

async function handleCreateApiKey() {
  if (!newApiKeyForm.value.name) return
  try {
    const res = await fetch('/api/v1/integrations/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: yardStore.currentTenant.id,
        name: newApiKeyForm.value.name
      })
    })

    if (res.ok) {
      const created = await res.json()
      apiKeys.value.unshift(created)
      createdApiKey.value = created
      newApiKeyForm.value.name = ''
      isNewApiKeyModalOpen.value = false
      yardStore.showNotification('Chave de API gerada com sucesso!', 'success')
    }
  } catch (err) {
    yardStore.showNotification('Falha ao criar API Key.', 'error')
  }
}

async function handleDeleteApiKey(id) {
  if (!confirm('Revogar esta chave de API? Todas as integrações com ela serão interrompidas imediatamente.')) return
  try {
    const res = await fetch(`/api/v1/integrations/api-keys/${id}`, { method: 'DELETE' })
    if (res.ok) {
      apiKeys.value = apiKeys.value.filter(k => k.id !== id)
      yardStore.showNotification('API Key revogada com sucesso.', 'info')
    }
  } catch (err) {
    yardStore.showNotification('Falha ao revogar API Key.', 'error')
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
  yardStore.showNotification('Copiado para a área de transferência!', 'success')
}

watch(() => yardStore.currentTenant?.id, () => {
  fetchIntegrations()
})

onMounted(() => {
  fetchIntegrations()
})
</script>

<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
      <div>
        <div class="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Network class="w-4 h-4" />
          <span>Conectividade Enterprise &bull; {{ yardStore.currentTenant?.name || 'Armazém' }}</span>
        </div>
        <h1 class="text-2xl font-black text-white">Integrações & Webhooks (ERP / WMS)</h1>
        <p class="text-xs text-slate-400">Sincronização bidirecional em tempo real com SAP, TOTVS Protheus, Senior e sistemas legados</p>
      </div>

      <div class="flex items-center space-x-2">
        <button
          @click="isNewApiKeyModalOpen = true"
          class="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
        >
          <Key class="w-4 h-4 text-amber-400" />
          <span>Gerar Chave API</span>
        </button>

        <button
          @click="isNewWebhookModalOpen = true"
          class="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <PlusCircle class="w-4 h-4" />
          <span>Novo Webhook</span>
        </button>
      </div>
    </div>

    <!-- Banner Informativo de Arquitetura B2B -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-start space-x-3.5">
        <div class="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
          <Send class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-white mb-1">Webhooks de Saída (Push Events)</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Quando um caminhão conclui a carga/descarga ou sai da portaria, o RotaFlow envia um POST assinado com <strong>HMAC-SHA256</strong> para o seu servidor, liberando faturamento no ERP instantaneamente.
          </p>
        </div>
      </div>

      <div class="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-start space-x-3.5">
        <div class="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
          <Key class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-white mb-1">Ingestão via API Rest (Pull / Push)</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Seu TMS ou ERP pode agendar janelas diretamente via API sem intervenção manual usando chaves com prefixo seguro <code class="text-amber-300 font-mono text-[11px]">rf_live_...</code>.
          </p>
        </div>
      </div>
    </div>

    <!-- Banner Oficial: Implantação de APIs & Treinamento Remoto/Local pela RAOS Tecnologia -->
    <div class="bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-800/60 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="space-y-1.5 max-w-2xl">
          <div class="inline-flex items-center space-x-2 bg-sky-950 text-sky-400 border border-sky-800 px-3 py-1 rounded-full text-[11px] font-mono font-semibold">
            <GraduationCap class="w-3.5 h-3.5" />
            <span>Serviço Corporativo & Implantação Técnica</span>
          </div>
          <h2 class="text-base sm:text-lg font-bold text-white">
            Integrações com APIs e Treinamentos Realizados pela RAOS Tecnologia
          </h2>
          <p class="text-xs text-slate-300 leading-relaxed">
            Nossa equipe de engenharia é a desenvolvedora e mantenedora oficial da plataforma. Realizamos a integração técnica completa com o seu ERP (SAP, TOTVS Protheus, Senior, Oracle) e a capacitação operacional dos colaboradores do pátio, atendendo tanto de forma <strong>remota</strong> quanto <strong>presencial / localmente</strong> no seu centro de distribuição.
          </p>
        </div>

        <a
          href="https://api.whatsapp.com/send?phone=5527996174965&text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20apoio%20da%20engenharia%20da%20RAOS%20Tecnologia%20para%20integra%C3%A7%C3%A3o%20de%20APIs%20ou%20treinamento%20local/remoto%20da%20nossa%20equipe."
          target="_blank"
          class="shrink-0 inline-flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all shadow-lg shadow-sky-600/20 active:scale-95 cursor-pointer"
        >
          <PhoneCall class="w-4 h-4" />
          <span>Falar com o Time de Engenharia</span>
        </a>
      </div>

      <!-- Grade dos 2 pilares: APIs e Treinamento -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300 border-t border-slate-800/80">
        <div class="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
          <div class="flex items-center space-x-2 font-bold text-sky-300">
            <Cpu class="w-4 h-4" />
            <span>Integração de APIs & Webhooks</span>
          </div>
          <p class="text-[11px] text-slate-400">
            <strong>Remoto ou Presencial:</strong> Mapeamento de payloads, autenticação por tokens seguros, configuração de Webhooks push/pull e testes em homologação.
          </p>
        </div>

        <div class="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
          <div class="flex items-center space-x-2 font-bold text-emerald-300">
            <Users class="w-4 h-4" />
            <span>Treinamento da Equipe de Pátio</span>
          </div>
          <p class="text-[11px] text-slate-400">
            <strong>Remoto ou Presencial:</strong> Capacitação prática de fiscais de portaria (leitores ópticos), operadores de doca e gestores com acompanhamento no Go-Live.
          </p>
        </div>
      </div>
    </div>

    <!-- Lista de Webhooks Ativos -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      <div class="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 class="text-base font-extrabold text-white flex items-center space-x-2">
            <span>Webhooks Cadastrados</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {{ webhooks.length }} ativos
            </span>
          </h2>
          <p class="text-xs text-slate-400">Endpoints que recebem eventos automáticos de pátio</p>
        </div>
      </div>

      <div class="divide-y divide-slate-800/60">
        <div 
          v-for="wh in webhooks" 
          :key="wh.id"
          class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition-all"
        >
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-mono text-xs font-bold text-slate-100 truncate max-w-md sm:max-w-xl">
                {{ wh.target_url }}
              </span>
            </div>
            <div class="flex items-center flex-wrap gap-1.5">
              <span 
                v-for="ev in wh.events.split(',')" 
                :key="ev" 
                class="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700/80"
              >
                {{ ev.trim() }}
              </span>
            </div>
            <p class="text-[10px] text-slate-500 font-mono">
              Segredo HMAC: <span class="text-slate-400">{{ wh.secret_token.slice(0, 8) }}••••••••••••••</span>
            </p>
          </div>

          <div class="flex items-center space-x-2 self-end sm:self-center shrink-0">
            <button
              @click="handleTestWebhook(wh.id)"
              :disabled="isTestingWebhook[wh.id]"
              class="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
            >
              <Send class="w-3.5 h-3.5" :class="{'animate-pulse text-sky-300': isTestingWebhook[wh.id]}" />
              <span>{{ isTestingWebhook[wh.id] ? 'Testando...' : 'Testar Disparo' }}</span>
            </button>

            <button
              @click="handleDeleteWebhook(wh.id)"
              class="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Excluir Webhook"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="!webhooks.length" class="p-8 text-center text-slate-500 text-xs">
          Nenhum webhook configurado. Clique em "Novo Webhook" para conectar seu ERP.
        </div>
      </div>
    </div>

    <!-- Lista de API Keys -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      <div class="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 class="text-base font-extrabold text-white flex items-center space-x-2">
            <span>Chaves de API para Integração (ERP / TMS)</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {{ apiKeys.length }} chaves
            </span>
          </h2>
          <p class="text-xs text-slate-400">Tokens de autenticação para scripts externos e agendamento automático</p>
        </div>
      </div>

      <div class="divide-y divide-slate-800/60">
        <div 
          v-for="key in apiKeys" 
          :key="key.id"
          class="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-800/20 transition-all"
        >
          <div>
            <div class="flex items-center space-x-2 mb-1">
              <span class="text-xs font-bold text-white">{{ key.name }}</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {{ key.key_prefix }}
              </span>
            </div>
            <p class="text-[10px] text-slate-400">
              Criada em: {{ new Date(key.created_at).toLocaleDateString('pt-BR') }} &bull; Último uso: {{ key.last_used_at ? new Date(key.last_used_at).toLocaleString('pt-BR') : 'Nunca utilizada' }}
            </p>
          </div>

          <button
            @click="handleDeleteApiKey(key.id)"
            class="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Revogar Chave"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

        <div v-if="!apiKeys.length" class="p-8 text-center text-slate-500 text-xs">
          Nenhuma chave de API gerada para este Armazém.
        </div>
      </div>
    </div>

    <!-- SEÇÃO: TELEMETRIA DE FROTAS & RASTREADORES VEICULARES (AUTOTRAC, SASCAR, ONIXSAT, ETC.) -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-5 p-6 sm:p-7">
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div class="inline-flex items-center space-x-2 bg-sky-950 text-sky-400 border border-sky-800 px-3 py-1 rounded-full text-[11px] font-mono font-semibold mb-2">
            <Radio class="w-3.5 h-3.5" />
            <span>Telemetria de Frotas & Localizadores Satelitais</span>
          </div>
          <h2 class="text-base sm:text-lg font-extrabold text-white">
            Conectores de Rastreadores (Autotrac, Sascar, OnixSat, Omnilink, Cobli)
          </h2>
          <p class="text-xs text-slate-400 max-w-2xl mt-1">
            Permite ao RotaFlow receber a posição GPS dos caminhões em trânsito pela rodovia via sinal de satélite/GPRS, calculando a distância e prevendo o horário de chegada ao pátio.
          </p>
        </div>

        <label class="flex items-center space-x-3 bg-slate-950 p-2.5 px-4 rounded-xl border border-slate-800 cursor-pointer self-start sm:self-auto">
          <input 
            type="checkbox" 
            v-model="telemetryConfig.has_telemetry_integration" 
            class="w-5 h-5 accent-sky-500 rounded cursor-pointer"
          />
          <span class="text-xs font-semibold text-slate-200">
            {{ telemetryConfig.has_telemetry_integration ? 'Módulo Habilitado' : 'Módulo Inativo' }}
          </span>
        </label>
      </div>

      <!-- Configurações do Provedor de Telemetria -->
      <form @submit.prevent="saveTelemetryConfig" class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Provedor de Rastreamento / Telemetria</label>
            <select
              v-model="telemetryConfig.telemetry_provider"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option v-for="p in telemetryProviders" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
            <span class="text-[10px] text-slate-500 mt-1 block">
              Selecione a empresa que monitora os veículos ou use o Webhook Genérico.
            </span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">
              Token do Rastreador Veicular <span class="text-slate-500 font-normal">(Opcional)</span>
            </label>
            <input
              v-model="telemetryConfig.telemetry_api_key"
              type="password"
              placeholder="Ex: sec_live_autotrac_884920..."
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
            <span class="text-[10px] text-slate-500 mt-1 block">
              O mapa do sistema é <strong>100% gratuito (OpenStreetMap)</strong> e não requer chave. Este campo serve apenas se você desejar puxar dados da Sascar/Autotrac.
            </span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">ID da Conta / Código de Contrato</label>
            <input
              v-model="telemetryConfig.telemetry_client_id"
              type="text"
              placeholder="Ex: CLI-99482-BR"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Endpoint de Ingestão de Telemetria (Webhook)</label>
            <div class="flex items-center space-x-2">
              <input
                :value="telemetryConfig.ingestion_webhook_url || `/api/v1/integrations/telemetry/ping?tenant_id=${yardStore.currentTenant?.id}`"
                readonly
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-sky-300 font-mono"
              />
              <button
                type="button"
                @click="copyToClipboard(telemetryConfig.ingestion_webhook_url || `/api/v1/integrations/telemetry/ping?tenant_id=${yardStore.currentTenant?.id}`)"
                class="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors shrink-0 cursor-pointer"
                title="Copiar URL de Ingestão"
              >
                <Copy class="w-4 h-4" />
              </button>
            </div>
            <span class="text-[10px] text-slate-500 mt-1 block">
              Endereço que a empresa de rastreamento deve chamar para enviar pings de GPS.
            </span>
          </div>

        </div>

        <!-- Exemplo de Payload JSON aceito -->
        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span class="font-bold text-white flex items-center space-x-1.5">
              <Terminal class="w-3.5 h-3.5 text-sky-400" />
              <span>Formato de Ingestão de Sinal GPS (JSON Push)</span>
            </span>
            <span class="font-mono text-emerald-400">POST /api/v1/integrations/telemetry/ping</span>
          </div>
          <pre class="font-mono text-sky-300 text-[11px] bg-slate-900/60 p-3 rounded-xl overflow-x-auto"><code>{
  "tenant_id": "{{ yardStore.currentTenant?.id || 'seu-tenant-id' }}",
  "vehicle_plate": "BRA2E19",
  "latitude": -20.3150,
  "longitude": -40.3120,
  "speed_kmh": 65,
  "accuracy_meters": 8.0
}</code></pre>
        </div>

        <!-- Botões de Ação -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            @click="testTelemetryPing"
            :disabled="isTestingTelemetry"
            class="w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <Navigation class="w-4 h-4" :class="{'animate-spin': isTestingTelemetry}" />
            <span>{{ isTestingTelemetry ? 'Testando Sinal...' : 'Simular Ping GPS de Veículo (Placa BRA2E19)' }}</span>
          </button>

          <button
            type="submit"
            :disabled="isSavingTelemetry"
            class="w-full sm:w-auto flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{{ isSavingTelemetry ? 'Salvando...' : 'Salvar Conector de Telemetria' }}</span>
          </button>
        </div>
      </form>

    </div>

    <!-- Modal Novo Webhook -->
    <transition name="modal">
      <div 
        v-if="isNewWebhookModalOpen" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <div class="modal-panel bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
          <button 
            @click="isNewWebhookModalOpen = false"
            class="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>

          <h3 class="text-base font-bold text-white mb-1">Novo Endpoint de Webhook</h3>
          <p class="text-xs text-slate-400 mb-4">Insira o endereço HTTP HTTPS do ERP para receber os disparos</p>

          <form @submit.prevent="handleCreateWebhook" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">URL de Destino (Endpoint)</label>
              <input 
                v-model="newWebhookForm.target_url" 
                type="url" 
                placeholder="https://api.empresa.com.br/webhook/patio"
                required
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Eventos Escutados (Separados por vírgula)</label>
              <input 
                v-model="newWebhookForm.events" 
                type="text" 
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
              />
              <p class="text-[10px] text-slate-500 mt-1">
                Disponíveis: vehicle.checked_in, vehicle.docked, vehicle.completed, vehicle.released
              </p>
            </div>

            <div class="pt-2 flex justify-end space-x-2">
              <button 
                type="button" 
                @click="isNewWebhookModalOpen = false"
                class="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Salvar Webhook
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Modal Nova API Key -->
    <transition name="modal">
      <div 
        v-if="isNewApiKeyModalOpen" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <div class="modal-panel bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
          <button 
            @click="isNewApiKeyModalOpen = false"
            class="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>

          <h3 class="text-base font-bold text-white mb-1">Gerar Chave de API</h3>
          <p class="text-xs text-slate-400 mb-4">Identifique qual sistema utilizará esta credencial</p>

          <form @submit.prevent="handleCreateApiKey" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Nome da Aplicação</label>
              <input 
                v-model="newApiKeyForm.name" 
                type="text" 
                placeholder="Ex: Middleware SAP ou TOTVS Protheus"
                required
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div class="pt-2 flex justify-end space-x-2">
              <button 
                type="button" 
                @click="isNewApiKeyModalOpen = false"
                class="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Gerar Chave
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Modal Exibição Chave Criada (Mostra apenas 1 vez) -->
    <transition name="modal">
      <div 
        v-if="createdApiKey" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <div class="modal-panel bg-slate-900 border border-amber-600/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
          <div class="flex items-center space-x-2 text-amber-400 mb-2">
            <ShieldCheck class="w-5 h-5" />
            <h3 class="text-base font-black text-white">Chave de API Gerada!</h3>
          </div>
          <p class="text-xs text-amber-200/80 mb-4">
            Copie esta chave agora. Por motivos de segurança, ela <strong>não poderá ser exibida novamente</strong>.
          </p>

          <div class="bg-slate-950 border border-slate-800 p-3.5 rounded-xl font-mono text-xs text-amber-300 break-all flex items-center justify-between gap-2 mb-4">
            <span>{{ createdApiKey.full_api_key }}</span>
            <button 
              @click="copyToClipboard(createdApiKey.full_api_key)"
              class="p-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 shrink-0 cursor-pointer"
              title="Copiar"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>

          <button 
            @click="createdApiKey = null"
            class="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            Entendido, já salvei minha chave
          </button>
        </div>
      </div>
    </transition>

  </div>
</template>
