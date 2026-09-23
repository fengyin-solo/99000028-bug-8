import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { useAuthStore } from '../stores/auth'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('blog_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Several admin requests can be in flight together (e.g. the dashboard
// fetches articles and tags in parallel); only react to the first 401.
let unauthorizedHandled = false

function isAuthFailure(status) {
  // 401: missing/expired/invalid token. 403 is tolerated as well in case
  // an older backend build reports a bad token that way.
  return status === 401 || status === 403
}

// Handle 401 responses
api.interceptors.response.use(
  (response) => {
    // A successful call (e.g. after logging back in) re-arms failure
    // handling so a later expiry is processed again.
    unauthorizedHandled = false
    return response
  },
  (error) => {
    const status = error.response?.status

    // A rejected login attempt is just wrong credentials: never tear the
    // session down or bounce away from the login page.
    const isLoginRequest = error.config?.url?.includes('/auth/login')

    if (isAuthFailure(status) && !isLoginRequest) {
      const authStore = useAuthStore()
      authStore.clearAuth()

      if (!unauthorizedHandled) {
        unauthorizedHandled = true
        const currentRoute = router.currentRoute.value

        if (currentRoute.name !== 'Login') {
          const query = { reason: 'expired' }
          // Remember the protected page so login can return to it.
          if (currentRoute.meta.requiresAuth) {
            query.redirect = currentRoute.fullPath
          }
          // The Login page shows the "session expired" notice itself once
          // it mounts, so the message isn't duplicated here.
          router.replace({ name: 'Login', query })
        } else {
          // Already on the login page (e.g. a stale request landed late):
          // no navigation happens, so show the notice directly.
          ElMessage.warning('登录已失效，请重新登录')
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
