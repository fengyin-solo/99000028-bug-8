<template>
  <div id="app">
    <Navbar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import Navbar from './components/Navbar.vue'
import { useAuthStore, TOKEN_KEY } from './stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Multi-tab synchronization: `storage` only fires for changes made in
// other tabs, so the tab performing the action is never disrupted.
function handleStorageChange(event) {
  // The token write is the authoritative auth-state signal (username is
  // persisted before it). null means another tab called storage.clear().
  if (event.key !== TOKEN_KEY && event.key !== null) return

  const nextToken = localStorage.getItem(TOKEN_KEY) || ''
  const wasLoggedIn = authStore.isLoggedIn

  authStore.syncFromStorage()

  if (nextToken) {
    // Another tab logged in.
    if (!wasLoggedIn && route.name === 'Login') {
      router.replace('/admin')
    }
  } else {
    // Another tab logged out, or the session was cleared.
    if (wasLoggedIn) {
      ElMessage.info('登录状态已在其他标签页中退出')
    }
    if (route.meta.requiresAuth) {
      // Leave a clean, stable login state; the info toast above is the
      // notice, so no extra reason (which would toast a second time).
      router.replace({ name: 'Login' })
    }
  }
}

onMounted(() => {
  window.addEventListener('storage', handleStorageChange)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: #f5f7fa;
  color: #333;
  line-height: 1.6;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 60px);
}

a {
  color: #409eff;
  text-decoration: none;
}

a:hover {
  color: #66b1ff;
}
</style>
