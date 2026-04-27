import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    {
      path: '/admin/login',
      component: () => import('../views/admin/AdminLoginView.vue'),
    },
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          component: () => import('../views/admin/AdminDashboardView.vue'),
        },
        {
          path: 'orders',
          component: () => import('../views/admin/AdminOrdersView.vue'),
        },
        {
          path: 'orders/:id',
          component: () => import('../views/admin/AdminOrderDetailView.vue'),
        },
        {
          path: 'components',
          component: () => import('../views/admin/AdminComponentsView.vue'),
        },
        {
          path: 'import',
          component: () => import('../views/admin/AdminImportView.vue'),
        },
      ],
    },
  ],
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      return { path: '/admin/login' }
    }
  }
})

export default router
