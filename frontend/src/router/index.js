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

// Only honour same-app internal paths as post-login targets; ignore
// protocol-relative or absolute URLs (open-redirect safety).
function resolveRedirect(target) {
  if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) {
    return target
  }
  return '/admin'
}

// Navigation guard for auth
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth) {
    if (!authStore.isLoggedIn) {
      next({
        name: 'Login',
        query: {
          redirect: to.fullPath,
          reason: 'required'
        }
      })
    } else {
      next()
    }
  } else if (to.name === 'Login' && authStore.isLoggedIn) {
    // Valid session: opening the login page returns to the original target
    // (or the dashboard) instead of showing a login form.
    next(resolveRedirect(to.query.redirect))
  } else {
    next()
  }
})

export default router
