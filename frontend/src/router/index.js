import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: () => import('../views/ArticleDetail.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/admin',
    name: 'Dashboard',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/articles',
    name: 'AdminArticleList',
    component: () => import('../views/admin/ArticleList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/articles/new',
    name: 'ArticleCreate',
    component: () => import('../views/admin/ArticleEditor.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/articles/:id/edit',
    name: 'ArticleEdit',
    component: () => import('../views/admin/ArticleEditor.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 只接受站内路径，避免开放重定向或绕回登录页
function resolveRedirect(raw, fallback = '/admin') {
  const redirect = Array.isArray(raw) ? raw[0] : raw
  if (typeof redirect === 'string' && redirect.startsWith('/') && redirect !== '/login') {
    return redirect
  }
  return fallback
}

// Navigation guard for auth
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // 已登录用户访问登录页时，直接送往目标页，保持各处状态一致
  if (to.name === 'Login' && authStore.isLoggedIn) {
    next(resolveRedirect(to.query.redirect))
    return
  }

  next()
})

export default router
