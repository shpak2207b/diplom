<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api/client.js'
import type { DashboardStats } from '../../types/index.js'

const router = useRouter()
const stats = ref<DashboardStats | null>(null)
const loading = ref(true)

onMounted(async () => {
  const res = await api.get<DashboardStats>('/api/admin/dashboard')
  stats.value = res.data
  loading.value = false
})
</script>

<template>
  <div>
    <h1>Сводка</h1>
    <div v-if="loading">Загрузка...</div>
    <template v-else-if="stats">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalOrders }}</div>
          <div class="stat-label">Заявок всего</div>
        </div>
        <div class="stat-card highlight">
          <div class="stat-value">{{ stats.newOrders }}</div>
          <div class="stat-label">Новых заявок</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalComponents.toLocaleString('ru') }}</div>
          <div class="stat-label">Компонентов в базе</div>
        </div>
        <div class="stat-card highlight-blue">
          <div class="stat-value">{{ stats.newMessages }}</div>
          <div class="stat-label">Сообщений</div>
        </div>
      </div>

      <div v-if="stats.recentMessages.length > 0" class="messages-block">
        <div class="messages-header">
          <h2>Последние сообщения</h2>
          <button class="link-btn" @click="router.push('/admin/messages')">Все сообщения →</button>
        </div>
        <div class="msg-list">
          <div v-for="msg in stats.recentMessages" :key="msg.id" class="msg-row">
            <div class="msg-meta">
              <span class="msg-name">{{ msg.name }}</span>
              <a :href="`mailto:${msg.email}`" class="msg-email">{{ msg.email }}</a>
              <span class="msg-date">{{ new Date(msg.createdAt).toLocaleString('ru') }}</span>
            </div>
            <div class="msg-text">{{ msg.message }}</div>
          </div>
        </div>
      </div>
      <div v-else class="no-messages">Новых сообщений нет</div>
    </template>
  </div>
</template>

<style scoped>
h1 { margin-top: 0; }
h2 { margin: 0; font-size: 16px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
  text-align: center;
}

.stat-card.highlight {
  border: 2px solid #e53e3e;
}

.stat-card.highlight-blue {
  border: 2px solid var(--unix-blue);
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--unix-blue);
}

.stat-label {
  font-size: 14px;
  opacity: 0.7;
  margin-top: 6px;
}

.messages-block {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
  overflow: hidden;
}

.messages-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.link-btn {
  background: none;
  border: none;
  color: var(--unix-blue);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.link-btn:hover { text-decoration: underline; }

.msg-list {
  display: flex;
  flex-direction: column;
}

.msg-row {
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.msg-row:last-child { border-bottom: none; }

.msg-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}

.msg-name { font-weight: 600; }

.msg-email {
  color: var(--unix-blue);
  text-decoration: none;
}
.msg-email:hover { text-decoration: underline; }

.msg-date { opacity: 0.5; font-size: 12px; }

.msg-text {
  font-size: 13px;
  opacity: 0.8;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-messages {
  text-align: center;
  opacity: 0.5;
  font-size: 14px;
  margin-top: 20px;
}
</style>
