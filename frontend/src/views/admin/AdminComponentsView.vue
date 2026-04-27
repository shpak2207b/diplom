<script setup lang="ts">
import { ref, watch, onMounted, reactive } from 'vue'
import { api } from '../../api/client.js'
import type { Component } from '../../types/index.js'

const items = ref<Component[]>([])
const total = ref(0)
const page = ref(1)
const query = ref('')
const loading = ref(false)
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// Inline edit
const editingId = ref<number | null>(null)
const editForm = reactive({ partNumber: '', manufacturer: '', quantity: 0 })

// New component form
const showCreate = ref(false)
const createForm = reactive({ partNumber: '', manufacturer: '', quantity: 0 })
const createLoading = ref(false)

async function fetchComponents() {
  loading.value = true
  const res = await api.get('/api/admin/components', {
    params: { q: query.value, page: page.value, limit: 50 },
  })
  items.value = res.data.items
  total.value = res.data.total
  loading.value = false
}

function onSearch() {
  if (debounceTimer.value) clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    page.value = 1
    fetchComponents()
  }, 300)
}

watch(page, fetchComponents)
onMounted(fetchComponents)

function startEdit(item: Component) {
  editingId.value = item.id
  editForm.partNumber = item.partNumber
  editForm.manufacturer = item.manufacturer
  editForm.quantity = item.quantity
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(id: number) {
  await api.put(`/api/admin/components/${id}`, editForm)
  editingId.value = null
  fetchComponents()
}

async function deleteComponent(id: number) {
  if (!confirm('Удалить компонент?')) return
  await api.delete(`/api/admin/components/${id}`)
  fetchComponents()
}

async function createComponent() {
  if (!createForm.partNumber.trim()) return
  createLoading.value = true
  await api.post('/api/admin/components', createForm)
  showCreate.value = false
  createForm.partNumber = ''
  createForm.manufacturer = ''
  createForm.quantity = 0
  createLoading.value = false
  fetchComponents()
}
</script>

<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h1 style="margin:0">Компоненты</h1>
      <button class="btn-primary" style="width:auto;padding:10px 20px" @click="showCreate = !showCreate">
        + Добавить
      </button>
    </div>

    <!-- Create form -->
    <div v-if="showCreate" class="create-form">
      <input v-model="createForm.partNumber" class="form-input" placeholder="Парт номер *" />
      <input v-model="createForm.manufacturer" class="form-input" placeholder="Производитель" />
      <input v-model.number="createForm.quantity" class="form-input" type="number" placeholder="Количество" min="0" />
      <button class="btn-primary" style="width:auto" :disabled="createLoading" @click="createComponent">
        Сохранить
      </button>
      <button class="btn-secondary" @click="showCreate = false">Отмена</button>
    </div>

    <div style="margin-bottom:16px">
      <input
        v-model="query"
        class="form-input"
        style="max-width:360px"
        placeholder="Поиск..."
        @input="onSearch"
      />
    </div>

    <div v-if="loading">Загрузка...</div>
    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Парт номер</th>
          <th>Производитель</th>
          <th>Кол-во</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.id }}</td>
          <template v-if="editingId === item.id">
            <td><input v-model="editForm.partNumber" class="edit-input" /></td>
            <td><input v-model="editForm.manufacturer" class="edit-input" /></td>
            <td><input v-model.number="editForm.quantity" class="edit-input" type="number" style="width:80px" /></td>
            <td>
              <button class="act-btn save" @click="saveEdit(item.id)">✓</button>
              <button class="act-btn cancel" @click="cancelEdit">✕</button>
            </td>
          </template>
          <template v-else>
            <td>{{ item.partNumber }}</td>
            <td>{{ item.manufacturer }}</td>
            <td>{{ item.quantity }}</td>
            <td>
              <button class="act-btn edit" @click="startEdit(item)">✏</button>
              <button class="act-btn del" @click="deleteComponent(item.id)">🗑</button>
            </td>
          </template>
        </tr>
        <tr v-if="items.length === 0">
          <td colspan="5" style="text-align:center;padding:20px">Ничего не найдено</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top:16px;display:flex;gap:10px;align-items:center">
      <button :disabled="page === 1" @click="page--">← Назад</button>
      <span>Страница {{ page }}</span>
      <button :disabled="items.length < 50" @click="page++">Вперёд →</button>
      <span style="opacity:0.6">Всего: {{ total.toLocaleString('ru') }}</span>
    </div>
  </div>
</template>

<style scoped>
h1 { margin-top: 0; }

.create-form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 20px;
  background: var(--card-bg);
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
}

.create-form .form-input {
  margin: 0;
  width: auto;
  flex: 1;
  min-width: 120px;
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
  padding: 9px 12px;
  border-bottom: 1px solid #eee;
  text-align: left;
  font-size: 13px;
}

:global(body.dark-theme) .admin-table td {
  border-bottom-color: #333;
}

.admin-table th {
  background: var(--unix-blue);
  color: #fff;
}

.edit-input {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  background: var(--card-bg);
  color: var(--text-color);
}

.act-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 15px;
  transition: background 0.2s;
}

.act-btn:hover { background: var(--menu-hover); }
.act-btn.save { color: #0a7a0a; }
.act-btn.del { color: #cc0000; }
</style>
