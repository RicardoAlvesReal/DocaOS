import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Inicializa tema verificando localStorage ou preferncia do sistema, padro 'dark'
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('docaos-theme')
    if (saved) return saved === 'dark'
    // Padro corporativo DocaOS: Dark Mode
    return true
  }

  const isDark = ref(getInitialTheme())

  function applyTheme(dark) {
    isDark.value = dark
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (dark) {
        root.classList.add('dark')
        root.classList.remove('light')
        root.style.colorScheme = 'dark'
        localStorage.setItem('docaos-theme', 'dark')
      } else {
        root.classList.remove('dark')
        root.classList.add('light')
        root.style.colorScheme = 'light'
        localStorage.setItem('docaos-theme', 'light')
      }
    }
  }

  function toggleTheme() {
    applyTheme(!isDark.value)
  }

  // Executa na inicializao
  applyTheme(isDark.value)

  return {
    isDark,
    toggleTheme,
    applyTheme
  }
})
