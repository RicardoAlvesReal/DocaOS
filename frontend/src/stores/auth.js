import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('raos_admin_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('raos_admin_user') || 'null'))

  const isSuperAdmin = computed(() => {
    return Boolean(token.value && user.value && user.value.role === 'super_admin')
  })

  async function loginSuperAdmin(email, password) {
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
    if (data.role !== 'super_admin') {
      throw new Error('Acesso negado: Este portal é restrito exclusivamente ao Super Admin da RAOS.')
    }

    token.value = data.access_token
    user.value = {
      name: data.user_name,
      email: data.user_email,
      role: data.role
    }

    localStorage.setItem('raos_admin_token', data.access_token)
    localStorage.setItem('raos_admin_user', JSON.stringify(user.value))
    return user.value
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('raos_admin_token')
    localStorage.removeItem('raos_admin_user')
  }

  function getAuthHeader() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  return {
    token,
    user,
    isSuperAdmin,
    loginSuperAdmin,
    logout,
    getAuthHeader
  }
})
