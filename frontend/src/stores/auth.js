import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const TOKEN_KEY = 'blog_token'
export const USERNAME_KEY = 'blog_username'

// 本地解析 JWT 过期时间，用于页面刷新/重开时识别已失效的令牌
function isTokenExpired(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    if (typeof payload.exp !== 'number') return true
    return payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

// 从 localStorage 恢复会话，已过期/无法解析的令牌直接清除，
// 保证刷新或重新打开页面后各处状态一致
function loadStoredAuth() {
  const token = localStorage.getItem(TOKEN_KEY) || ''
  if (token && !isTokenExpired(token)) {
    return { token, username: localStorage.getItem(USERNAME_KEY) || '' }
  }
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USERNAME_KEY)
  return { token: '', username: '' }
}

export const useAuthStore = defineStore('auth', () => {
  const stored = loadStoredAuth()
  const token = ref(stored.token)
  const username = ref(stored.username)

  const isLoggedIn = computed(() => !!token.value)

  async function login(user, password) {
    const response = await api.post('/auth/login', {
      username: user,
      password: password
    })

    token.value = response.data.token
    username.value = response.data.username

    localStorage.setItem(TOKEN_KEY, token.value)
    localStorage.setItem(USERNAME_KEY, username.value)

    return response.data
  }

  function logout() {
    token.value = ''
    username.value = ''
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
  }

  // 其他标签页登录/退出后，通过 storage 事件同步本页状态
  function syncFromStorage() {
    const storedToken = localStorage.getItem(TOKEN_KEY) || ''
    if (storedToken && !isTokenExpired(storedToken)) {
      token.value = storedToken
      username.value = localStorage.getItem(USERNAME_KEY) || ''
    } else {
      token.value = ''
      username.value = ''
    }
  }

  return {
    token,
    username,
    isLoggedIn,
    login,
    logout,
    syncFromStorage
  }
})
