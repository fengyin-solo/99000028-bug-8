<template>
  <div id="app">
    <Navbar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import { useAuthStore, TOKEN_KEY, USERNAME_KEY } from './stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// 其他标签页登录/退出时同步本页状态，保证多标签页一致
function handleStorage(event) {
  if (event.key && event.key !== TOKEN_KEY && event.key !== USERNAME_KEY) return

  authStore.syncFromStorage()

  if (!authStore.isLoggedIn && route.meta.requiresAuth) {
    // 已在别处退出：离开受保护页，回到登录页并保留目标页
    router.push({
      name: 'Login',
      query: { redirect: route.fullPath }
    }).catch(() => {})
  } else if (authStore.isLoggedIn && route.name === 'Login') {
    // 已在别处登录：离开登录页
    const redirect = Array.isArray(route.query.redirect)
      ? route.query.redirect[0]
      : route.query.redirect
    router.push(
      typeof redirect === 'string' && redirect.startsWith('/') && redirect !== '/login'
        ? redirect
        : '/admin'
    ).catch(() => {})
  }
}

onMounted(() => {
  window.addEventListener('storage', handleStorage)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorage)
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
