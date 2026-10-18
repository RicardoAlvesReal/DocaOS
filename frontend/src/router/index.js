import { createRouter, createWebHistory } from 'vue-router'
import ControlTowerView from '../views/ControlTowerView.vue'
import DriverCheckinView from '../views/DriverCheckinView.vue'
import GateScannerView from '../views/GateScannerView.vue'
import DocksView from '../views/DocksView.vue'
import SuperAdminView from '../views/SuperAdminView.vue'
import AdminLoginView from '../views/AdminLoginView.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'ControlTower',
    component: ControlTowerView,
    meta: { title: 'Torre de Controle (Kanban)' }
  },
  {
    path: '/checkin/:token',
    name: 'DriverCheckin',
    component: DriverCheckinView,
    meta: { title: 'Check-in do Motorista', layout: 'blank' }
  },
  {
    path: '/portaria',
    name: 'GateScanner',
    component: GateScannerView,
    meta: { title: 'Portaria & Cancela' }
  },
  {
    path: '/docas',
    name: 'Docks',
    component: DocksView,
    meta: { title: 'Gestão de Docas' }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLoginView,
    meta: { title: 'Acesso Restrito RAOS' }
  },
  {
    path: '/admin',
    name: 'SuperAdmin',
    component: SuperAdminView,
    meta: { 
      title: 'Super Admin RAOS',
      requiresSuperAdmin: true 
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guarda de Rotas para Proteger /admin
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'YMS'} | RotaFlow`

  if (to.meta.requiresSuperAdmin) {
    const authStore = useAuthStore()
    if (!authStore.isSuperAdmin) {
      // Redireciona para tela de login do Admin
      return next({ path: '/admin/login', query: { redirect: to.fullPath } })
    }
  }

  next()
})

export default router
