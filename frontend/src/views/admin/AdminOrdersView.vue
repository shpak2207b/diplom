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
  { value: '', label: 'Все активные' },
  { value: 'NEW', label: 'Новые' },
  { value: 'PROCESSED', label: 'В работе' },
  { value: 'COMPLETED', label: 'Завершены' },
  { value: 'ARCHIVED', label: 'Архив' },
]

const statusLabels: Record<string, string> = {
  NEW: 'Новая',
  PROCESSED: 'В работе',
  COMPLETED: 'Завершена',
  ARCHIVED: 'Архив',
}

async function fetchOrders() {
  loading.value = true
  // "Все активные" excludes archived
  const params: Record<string, unknown> = { page: page.value, limit: 20 }
  if (statusFilter.value) {
    params.status = statusFilter.value
  } else {
    params.excludeStatus = 'ARCHIVED'
  }
  const res = await api.get('/api/admin/orders', { params })
  orders.value = res.data.orders
  total.value = res.data.total
  loading.value = false
}

watch([page, statusFilter], fetchOrders)
onMounted(fetchOrders)

async function archiveOrder(id: number, e: Event) {
  e.stopPropagation()
  await api.patch(`/api/admin/orders/${id}/status`, { status: 'ARCHIVED' })
  fetchOrders()
}

async function deleteOrder(id: number, e: Event) {
  e.stopPropagation()
  if (!confirm('Удалить заявку безвозвратно?')) return
  await api.delete(`/api/admin/orders/${id}`)
  fetchOrders()
}
</script>

<template>
  <div>
    <h1>Заявки</h1>

    <div class="filter-bar">
      <button
        v-for="opt in statusOptions"
        :key="opt.value"
        :class="['filter-btn', { active: statusFilter === opt.value }]"
        @click="statusFilter = opt.value; page = 1"
      >{{ opt.label }}</button>
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
          <th></th>
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
          <td class="row-actions">
            <button
              v-if="order.status !== 'ARCHIVED'"
              class="act-btn archive"
              @click="archiveOrder(order.id, $event)"
            >В архив</button>
            <button
              class="act-btn del"
              title="Удалить"
              @click="deleteOrder(order.id, $event)"
            >🗑</button>
          </td>
        </tr>
        <tr v-if="orders.length === 0">
          <td colspan="7" style="text-align:center;padding:20px">Заявок нет</td>
        </tr>
      </tbody>
    </table>

    <div v-if="total > 20" class="pagination-bar">
      <button :disabled="page === 1" @click="page--">← Назад</button>
      <span>Страница {{ page }}</span>
      <button :disabled="orders.length < 20" @click="page++">Вперёд →</button>
      <span style="opacity:0.6">Всего: {{ total }}</span>
    </div>
  </div>
</template>

<style scoped>
h1 { margin-top: 0; }

.filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.filter-btn {
  padding: 7px 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  background: #fff;
  color: #1b2b3a;
  font-size: 13px;
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
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}

.admin-table th,
.admin-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #eee;
  text-align: left;
  font-size: 13px;
}

.admin-table th {
  background: var(--unix-blue);
  color: #fff;
}

.clickable { cursor: pointer; transition: background 0.15s; }
.clickable:hover { background: #f5f7fa; }

.status-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.status-badge.new      { background: #fff3cd; color: #856404; }
.status-badge.processed { background: #cce5ff; color: #004085; }
.status-badge.completed { background: #d4edda; color: #155724; }
.status-badge.archived  { background: #e2e3e5; color: #495057; }

.row-actions { white-space: nowrap; }

.act-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 14px;
  transition: background 0.15s;
}
.act-btn:hover { background: #f0f2f5; }
.act-btn.archive { color: #6c757d; }
.act-btn.del { color: #cc0000; }

.pagination-bar {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.pagination-bar button {
  padding: 7px 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  background: #fff;
  color: #1b2b3a;
}

.pagination-bar button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
