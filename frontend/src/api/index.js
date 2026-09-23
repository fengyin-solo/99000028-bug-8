import axios from 'axios'
import router from '../router'
import { useAuthStore, TOKEN_KEY } from '../stores/auth'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses: clear the stale session everywhere and send
// the user to the login page when they are on a protected page.
// The login request itself is excluded so wrong credentials don't
// trigger the session-expired flow.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const isLoginRequest = error.config?.url?.includes('/auth/login')

    if (status === 401 && !isLoginRequest) {
      const authStore = useAuthStore()
      const hadSession = authStore.isLoggedIn || !!localStorage.getItem(TOKEN_KEY)

      if (hadSession) {
        // 同时清理 store 与 localStorage，避免顶栏仍显示已登录、旧账号残留
        authStore.logout()

        const current = router.currentRoute.value
        if (current.meta?.requiresAuth) {
          // 保留原目标页，登录成功后可返回
          router.push({
            name: 'Login',
            query: { redirect: current.fullPath, expired: '1' }
          }).catch(() => {})
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
