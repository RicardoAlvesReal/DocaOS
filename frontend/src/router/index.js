import { createRouter, createWebHistory } from 'vue-router'
import ControlTowerView from '../views/ControlTowerView.vue'
import DriverCheckinView from '../views/DriverCheckinView.vue'
import GateScannerView from '../views/GateScannerView.vue'
import DocksView from '../views/DocksView.vue'
import SuperAdminView from '../views/SuperAdminView.vue'
import ReportsView from '../views/ReportsView.vue'
import IntegrationsView from '../views/IntegrationsView.vue'
import TeamView from '../views/TeamView.vue'
import LandingPageView from '../views/LandingPageView.vue'
import LoginView from '../views/LoginView.vue'
import AdminLoginView from '../views/AdminLoginView.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'LandingPage',
    component: LandingPageView,
    meta: { title: 'YMS Enterprise & Agendamento de Docas', layout: 'blank' }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { title: 'Acesso Operacional', layout: 'blank' }
  },
  {
    path: '/app',
    alias: ['/torre'],
    name: 'ControlTower',
    component: ControlTowerView,
    meta: { 
      title: 'Torre de Controle (Kanban)',
      requiresAuth: true
    }
  },
  {
    path: '/checkin/:token',
    name: 'DriverCheckin',
    component: DriverCheckinView,
    meta: { title: 'Check-in do Motorista', layout: 'blank' }
  },
  {
    path: '/agendar/:slug?',
    name: 'CarrierPortal',
    component: () => import('../views/CarrierPortalView.vue'),
    meta: { title: 'Portal do Transportador', layout: 'blank' }
  },
  {
    path: '/portaria',
    name: 'GateScanner',
    component: GateScannerView,
    meta: { 
      title: 'Portaria & Cancela',
      requiresAuth: true
    }
  },
  {
    path: '/docas',
    name: 'Docks',
    component: DocksView,
    meta: { 
      title: 'Gestão de Docas',
      requiresAuth: true
    }
  },
  {
    path: '/relatorios',
    name: 'Reports',
    component: ReportsView,
    meta: { 
      title: 'Relatórios & Auditoria',
      requiresAuth: true
    }
  },
  {
    path: '/integracoes',
    name: 'Integrations',
    component: IntegrationsView,
    meta: { 
      title: 'Integrações & Webhooks ERP',
      requiresAuth: true
    }
  },
  {
    path: '/equipe',
    name: 'Team',
    component: TeamView,
    meta: { 
      title: 'Equipe & Fiscais de Pátio',
      requiresAuth: true
    }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLoginView,
    meta: { title: 'Acesso Restrito RAOS', layout: 'blank' }
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

// Guarda de Rotas para Proteger /admin e /app
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'YMS'} | RotaFlow`
  const authStore = useAuthStore()

  // 1. Proteção de Super Admin
  if (to.meta.requiresSuperAdmin) {
    if (!authStore.isSuperAdmin) {
      return next({ path: '/admin/login', query: { redirect: to.fullPath } })
    }
  }

  // 2. Proteção Operacional do Sistema Real
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }
  }

  // 3. Se já autenticado e tentando acessar login, vai para o /app
  if (to.path === '/login' && authStore.isAuthenticated && !authStore.isDemoMode) {
    return next({ path: '/app' })
  }

  next()
})

export default router
