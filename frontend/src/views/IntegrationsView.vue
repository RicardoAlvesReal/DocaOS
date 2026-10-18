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
  X
} from 'lucide-vue-next'

const yardStore = useYardStore()

const webhooks = ref([])
const apiKeys = ref([])
const isLoading = ref(false)

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
    const [resWh, resKeys] = await Promise.all([
      fetch(`/api/v1/integrations/webhooks?tenant_id=${yardStore.currentTenant.id}`),
      fetch(`/api/v1/integrations/api-keys?tenant_id=${yardStore.currentTenant.id}`)
    ])
    if (resWh.ok) webhooks.value = await resWh.json()
    if (resKeys.ok) apiKeys.value = await resKeys.json()
  } catch (err) {
    console.error('Erro ao buscar integrações:', err)
  } finally {
    isLoading.value = false
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

    <!-- Modal Novo Webhook -->
    <div 
      v-if="isNewWebhookModalOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
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

    <!-- Modal Nova API Key -->
    <div 
      v-if="isNewApiKeyModalOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
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

    <!-- Modal Exibição Chave Criada (Mostra apenas 1 vez) -->
    <div 
      v-if="createdApiKey" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div class="bg-slate-900 border border-amber-600/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
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

  </div>
</template>
