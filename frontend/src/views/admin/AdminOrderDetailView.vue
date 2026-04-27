<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../../api/client.js'
import type { Order } from '../../types/index.js'

const route = useRoute()
const router = useRouter()
const order = ref<Order | null>(null)
const loading = ref(true)
const statusLoading = ref(false)

const statusOptions = [
  { value: 'NEW', label: 'Новая' },
  { value: 'PROCESSED', label: 'В работе' },
  { value: 'COMPLETED', label: 'Завершена' },
]

onMounted(async () => {
  const res = await api.get<Order>(`/api/admin/orders/${route.params.id}`)
  order.value = res.data
  loading.value = false
})

async function updateStatus(status: string) {
  if (!order.value) return
  statusLoading.value = true
  const res = await api.patch(`/api/admin/orders/${order.value.id}/status`, { status })
  order.value = { ...order.value, status: res.data.status }
  statusLoading.value = false
}
</script>

<template>
  <div>
    <button class="btn-back" @click="router.back()">← Назад</button>

    <div v-if="loading">Загрузка...</div>
    <template v-else-if="order">
      <h1>Заявка #{{ order.id }}</h1>

      <div class="info-grid">
        <div class="info-card">
          <h3>Клиент</h3>
          <p><b>Имя:</b> {{ order.customerName }}</p>
          <p><b>Email:</b> {{ order.customerEmail }}</p>
          <p v-if="order.customerPhone"><b>Телефон:</b> {{ order.customerPhone }}</p>
          <p v-if="order.companyName"><b>Компания:</b> {{ order.companyName }}</p>
          <p v-if="order.comment"><b>Комментарий:</b> {{ order.comment }}</p>
          <p><b>Дата:</b> {{ new Date(order.createdAt).toLocaleString('ru') }}</p>
        </div>

        <div class="info-card">
          <h3>Статус</h3>
          <select
            :value="order.status"
            :disabled="statusLoading"
            class="form-input"
            @change="updateStatus(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <h3>Позиции ({{ order.items.length }})</h3>
      <table class="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Парт номер</th>
            <th>Производитель</th>
            <th>Кол-во</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in order.items" :key="item.id">
            <td>{{ idx + 1 }}</td>
            <td>{{ item.partNumber }}</td>
            <td>{{ item.manufacturer }}</td>
            <td>{{ item.quantityRequested }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
h1 { margin-top: 0; }

.btn-back {
  background: none;
  border: 1px solid #ccc;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-color);
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 28px;
}

.info-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
}

.info-card h3 { margin-top: 0; }
.info-card p { margin: 6px 0; }

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

.admin-table th {
  background: var(--unix-blue);
  color: #fff;
}
</style>
