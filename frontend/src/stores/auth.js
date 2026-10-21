import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('rotaflow_token') || localStorage.getItem('raos_admin_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('rotaflow_user') || localStorage.getItem('raos_admin_user') || 'null'))
  const isDemoMode = ref(localStorage.getItem('rotaflow_demo_mode') === 'true')

  const isAuthenticated = computed(() => {
    return Boolean(token.value && user.value) || isDemoMode.value
  })

  const isSuperAdmin = computed(() => {
    return Boolean(!isDemoMode.value && token.value && user.value && user.value.role === 'super_admin')
  })

  async function login(email, password) {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Credenciais de acesso inválidas.')
    }

    const data = await res.json()
    isDemoMode.value = false
    localStorage.removeItem('rotaflow_demo_mode')

    token.value = data.access_token
    user.value = {
      name: data.user_name,
      email: data.user_email,
      role: data.role,
      tenant_id: data.tenant_id,
      tenant_name: data.tenant_name
    }

    localStorage.setItem('rotaflow_token', data.access_token)
    localStorage.setItem('rotaflow_user', JSON.stringify(user.value))

    // Compatibilidade com SuperAdmin se aplicável
    if (data.role === 'super_admin') {
      localStorage.setItem('raos_admin_token', data.access_token)
      localStorage.setItem('raos_admin_user', JSON.stringify(user.value))
    }

    return user.value
  }

  async function loginSuperAdmin(email, password) {
    const u = await login(email, password)
    if (u.role !== 'super_admin') {
      logout()
      throw new Error('Acesso negado: Este portal é restrito exclusivamente ao Super Admin da RAOS.')
    }
    return u
  }

  function enterDemoMode() {
    token.value = null
    isDemoMode.value = true
    user.value = {
      name: 'Visitante (Modo Sandbox)',
      email: 'demo@docaos.log.br',
      role: 'demo_operator',
      tenant_id: 'demo-sandbox-01',
      tenant_name: 'Terminal Demonstrativo DocaOS (Sandbox)'
    }
    localStorage.setItem('docaos_demo_mode', 'true')
    localStorage.setItem('rotaflow_demo_mode', 'true')
    localStorage.setItem('docaos_user', JSON.stringify(user.value))
    localStorage.setItem('rotaflow_user', JSON.stringify(user.value))
    localStorage.removeItem('docaos_token')
    localStorage.removeItem('rotaflow_token')
    localStorage.removeItem('raos_admin_token')
  }

  function logout() {
    token.value = null
    user.value = null
    isDemoMode.value = false
    localStorage.removeItem('rotaflow_token')
    localStorage.removeItem('rotaflow_user')
    localStorage.removeItem('rotaflow_demo_mode')
    localStorage.removeItem('raos_admin_token')
    localStorage.removeItem('raos_admin_user')
  }

  function getAuthHeader() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  return {
    token,
    user,
    isDemoMode,
    isAuthenticated,
    isSuperAdmin,
    login,
    loginSuperAdmin,
    enterDemoMode,
    logout,
    getAuthHeader
  }
})
