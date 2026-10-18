<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Radio, 
  Sparkles,
  Truck,
  ArrowLeft
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('operador@rotaflow.com.br')
const password = ref('rotaflow123')
const isLoading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await authStore.login(email.value, password.value)
    const redirectPath = route.query.redirect || '/app'
    router.push(redirectPath)
  } catch (err) {
    errorMessage.value = err.message || 'Falha ao autenticar. Verifique suas credenciais.'
  } finally {
    isLoading.value = false
  }
}

function handleEnterDemo() {
  authStore.enterDemoMode()
  const redirectPath = route.query.redirect || '/app'
  router.push(redirectPath)
}
</script>

<template>
  <div class="min-h-screen bg-[#050b14] text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-sans">
    
    <!-- Ambient Background Glows -->
    <div class="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#086cfe]/15 via-blue-700/10 to-transparent rounded-full blur-[140px] pointer-events-none"></div>
    <div class="fixed bottom-0 right-1/4 w-[500px] h-[300px] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none"></div>

    <!-- Top Navigation Bar -->
    <header class="max-w-6xl w-full mx-auto flex items-center justify-between py-2 relative z-10">
      <router-link to="/" class="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors font-mono">
        <ArrowLeft class="w-4 h-4" />
        <span>Voltar para o Início</span>
      </router-link>

      <div class="inline-flex items-center space-x-2 bg-sky-950/80 border border-sky-800/80 px-3 py-1 rounded-full text-xs font-mono text-sky-300">
        <span class="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
        <span>Acesso Restrito &bull; Segurança JWT</span>
      </div>
    </header>

    <!-- Main Card Container -->
    <main class="my-auto max-w-md w-full mx-auto py-8 relative z-10">
      <div class="bg-slate-900/90 border border-white/[0.08] backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/40 space-y-6">
        
        <!-- Logo & Header -->
        <div class="text-center space-y-3">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-600/20 border border-sky-400/30 p-2 flex items-center justify-center mx-auto shadow-xl shadow-sky-500/15">
            <img src="/rotaflow-icon.png" alt="RotaFlow" class="w-full h-full object-contain" />
          </div>
          <div>
            <div class="flex items-center justify-center space-x-2">
              <span class="text-2xl font-black tracking-tight text-white">
                Rota<span class="text-sky-400">Flow</span>
              </span>
              <span class="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                YMS
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Acesso Operacional & Orquestração de Pátios</p>
          </div>
        </div>

        <!-- Feedback de Erro -->
        <div v-if="errorMessage" class="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-400" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Formulário de Login -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1 font-mono">E-mail Operacional</label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="email"
                type="email"
                required
                placeholder="operador@rotaflow.com.br"
                class="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#086cfe] focus:ring-1 focus:ring-[#086cfe] transition-all"
              />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-slate-300 font-mono">Senha</label>
              <span class="text-[10px] text-slate-500">Criptografia Bcrypt</span>
            </div>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#086cfe] focus:ring-1 focus:ring-[#086cfe] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-[#086cfe] hover:bg-blue-600 active:scale-[0.98] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <span v-if="isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span v-else>Entrar no Painel do Armazém</span>
            <ArrowRight v-if="!isLoading" class="w-4 h-4" />
          </button>
        </form>

        <!-- Divisor -->
        <div class="relative flex items-center justify-center">
          <div class="border-t border-white/[0.08] w-full"></div>
          <span class="bg-slate-900 px-3 text-[10px] font-mono uppercase text-slate-500 shrink-0">Ou experimente</span>
          <div class="border-t border-white/[0.08] w-full"></div>
        </div>

        <!-- Botão Acessar Demonstração (Sandbox) -->
        <div class="space-y-2">
          <button
            type="button"
            @click="handleEnterDemo"
            class="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-sky-500/30 hover:border-sky-400 text-sky-300 hover:text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
          >
            <Sparkles class="w-4 h-4 text-sky-400" />
            <span>Acessar Demonstração Interativa (Sandbox)</span>
          </button>
          <p class="text-[11px] text-center text-slate-400">
            Ambiente seguro com dados fictícios. Nenhuma alteração afeta clientes reais.
          </p>
        </div>

      </div>

      <!-- Links Adicionais de Governança -->
      <div class="mt-6 text-center space-y-2 text-xs text-slate-500 font-mono">
        <p>
          Problemas de acesso? 
          <a href="https://api.whatsapp.com/send?phone=5527996174965&text=Ol%C3%A1!%20Preciso%20de%20suporte%20no%20acesso%20do%20RotaFlow." target="_blank" class="text-sky-400 hover:underline">
            Fale com o suporte técnico
          </a>
        </p>
        <p>
          <router-link to="/admin/login" class="text-slate-400 hover:text-white transition-colors">
            Acesso Restrito Super Admin RAOS &rarr;
          </router-link>
        </p>
      </div>

    </main>

    <!-- Footer -->
    <footer class="py-2 text-center text-[11px] text-slate-600 font-mono relative z-10">
      &copy; {{ new Date().getFullYear() }} RotaFlow YMS &bull; Desenvolvido e mantido por RAOS Tecnologia
    </footer>

  </div>
</template>
