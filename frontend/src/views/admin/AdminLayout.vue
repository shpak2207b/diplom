<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

function logout() {
  auth.logout()
  router.push('/admin/login')
}
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="admin-logo">Юникс Плюс</div>
      <nav>
        <RouterLink to="/admin">Сводка</RouterLink>
        <RouterLink to="/admin/orders">Заявки</RouterLink>
        <RouterLink to="/admin/components">Компоненты</RouterLink>
        <RouterLink to="/admin/messages">Сообщения</RouterLink>
        <RouterLink to="/admin/import">Импорт</RouterLink>
      </nav>
      <button class="logout-btn" @click="logout">Выйти</button>
    </aside>
    <main class="admin-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  /* Force light theme regardless of body class */
  --bg-color: #f0f2f5;
  --text-color: #1b2b3a;
  --card-bg: #ffffff;
  --header-border: #e0e0e0;
  --menu-hover: rgba(0, 51, 102, 0.1);
  --icon-color: #1b2b3a;
  --add-btn-color: #003366;
  --add-btn-border: #003366;
  color: #1b2b3a;
}

.admin-sidebar {
  width: 220px;
  background: var(--unix-blue);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  gap: 8px;
  flex-shrink: 0;
}

.admin-logo {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 24px;
  text-align: center;
}

.admin-sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.admin-sidebar nav a {
  display: block;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  padding: 10px 14px;
  border-radius: 8px;
  transition: background 0.2s;
}

.admin-sidebar nav a:hover,
.admin-sidebar nav a.router-link-exact-active {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: auto;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.admin-content {
  flex: 1;
  padding: 32px;
  background: #f0f2f5;
  overflow-y: auto;
}
</style>
