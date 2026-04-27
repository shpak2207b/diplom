<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api/client.js'
import type { Order } from '../../types/index.js'

const router = useRouter()
const orders = ref<Order[]>([])
const total = ref(0)
const page = ref(1)
const statusFilter = ref('')
const loading = ref(false)

const statusOptions = [
  { value: '', label: 'Все' },
  { value: 'NEW', label: 'Новые' },
  { value: 'PROCESSED', label: 'В работе' },
  { value: 'COMPLETED', label: 'Завершены' },
]

const statusLabels: Record<string, string> = {
  NEW: 'Новая',
  PROCESSED: 'В работе',
  COMPLETED: 'Завершена',
}

async function fetchOrders() {
  loading.value = true
  const res = await api.get('/api/admin/orders', {
    params: { page: page.value, limit: 20, status: statusFilter.value || undefined },
  })
  orders.value = res.data.orders
  total.value = res.data.total
  loading.value = false
}

watch([page, statusFilter], fetchOrders)
onMounted(fetchOrders)
</script>

<template>
  <div>
    <h1>Заявки</h1>

    <div style="display:flex;gap:10px;margin-bottom:16px">
      <button
        v-for="opt in statusOptions"
        :key="opt.value"
        :class="['filter-btn', { active: statusFilter === opt.value }]"
        @click="statusFilter = opt.value; page = 1"
      >
        {{ opt.label }}
      </button>
    </div>

    <div v-if="loading">Загрузка...</div>
    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Дата</th>
          <th>Клиент</th>
          <th>Email</th>
          <th>Статус</th>
          <th>Позиций</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="order in orders"
          :key="order.id"
          class="clickable"
          @click="router.push(`/admin/orders/${order.id}`)"
        >
          <td>{{ order.id }}</td>
          <td>{{ new Date(order.createdAt).toLocaleString('ru') }}</td>
          <td>{{ order.customerName }}</td>
          <td>{{ order.customerEmail }}</td>
          <td>
            <span :class="['status-badge', order.status.toLowerCase()]">
              {{ statusLabels[order.status] }}
            </span>
          </td>
          <td>{{ order.items.length }}</td>
        </tr>
        <tr v-if="orders.length === 0">
          <td colspan="6" style="text-align:center;padding:20px">Заявок нет</td>
        </tr>
      </tbody>
    </table>

    <div v-if="total > 20" style="margin-top:16px;display:flex;gap:10px;align-items:center">
      <button :disabled="page === 1" @click="page--">← Назад</button>
      <span>Страница {{ page }}</span>
      <button :disabled="orders.length < 20" @click="page++">Вперёд →</button>
      <span style="opacity:0.6">Всего: {{ total }}</span>
    </div>
  </div>
</template>

<style scoped>
h1 { margin-top: 0; }

.filter-btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  background: none;
  color: var(--text-color);
  transition: background 0.2s;
}

.filter-btn.active {
  background: var(--unix-blue);
  color: #fff;
  border-color: var(--unix-blue);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--card-bg);
  border-radius: 10px;
  overflow: hidden;
}

.admin-table th,
.admin-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

:global(body.dark-theme) .admin-table th,
:global(body.dark-theme) .admin-table td {
  border-bottom-color: #333;
}

.admin-table th {
  background: var(--unix-blue);
  color: #fff;
}

.clickable {
  cursor: pointer;
  transition: background 0.15s;
}

.clickable:hover {
  background: var(--menu-hover);
}

.status-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.new {
  background: #fff3cd;
  color: #856404;
}

.status-badge.processed {
  background: #cce5ff;
  color: #004085;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}
</style>
