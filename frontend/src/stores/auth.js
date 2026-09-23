import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const TOKEN_KEY = 'blog_token'
export const USERNAME_KEY = 'blog_username'

function readStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

function readStoredUsername() {
  return localStorage.getItem(USERNAME_KEY) || ''
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(readStoredToken())
  const username = ref(readStoredUsername())

  const isLoggedIn = computed(() => !!token.value)

  function setSession(newToken, newUsername) {
    token.value = newToken
    username.value = newUsername
    // Write the username first and the token last: the token write is the
    // signal other tabs listen on, so they never see a token without its
    // matching username.
    localStorage.setItem(USERNAME_KEY, newUsername)
    localStorage.setItem(TOKEN_KEY, newToken)
  }

  // Single place that clears auth state, so the reactive store and
  // localStorage can never disagree after a logout / expired session.
  function clearAuth() {
    token.value = ''
    username.value = ''
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
  }

  async function login(user, password) {
    const response = await api.post('/auth/login', {
      username: user,
      password: password
    })

    setSession(response.data.token, response.data.username)

    return response.data
  }

  function logout() {
    clearAuth()
  }

  // Adopt a session established in another tab (storage event only
  // reports writes made by other tabs).
  function syncFromStorage() {
    token.value = readStoredToken()
    username.value = readStoredUsername()
  }

  return {
    token,
    username,
    isLoggedIn,
    login,
    logout,
    clearAuth,
    syncFromStorage
  }
})
