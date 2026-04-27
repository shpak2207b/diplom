<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api/client.js'
import type { DashboardStats } from '../../types/index.js'

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
    <h1>Дашборд</h1>
    <div v-if="loading">Загрузка...</div>
    <div v-else-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalOrders }}</div>
        <div class="stat-label">Заявок всего</div>
      </div>
      <div class="stat-card new">
        <div class="stat-value">{{ stats.newOrders }}</div>
        <div class="stat-label">Новых</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalComponents.toLocaleString('ru') }}</div>
        <div class="stat-label">Компонентов в базе</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1 { margin-top: 0; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.stat-card.new {
  border: 2px solid #e53e3e;
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
</style>
