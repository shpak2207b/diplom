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

const editingId = ref<number | null>(null)
const editForm = reactive({ partNumber: '', manufacturer: '', quantity: 0 })

// Quick quantity edit
const qtyEditId = ref<number | null>(null)
const qtyEditVal = ref(0)

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
  debounceTimer.value = setTimeout(() => { page.value = 1; fetchComponents() }, 300)
}

watch(page, fetchComponents)
onMounted(fetchComponents)

function startEdit(item: Component) {
  qtyEditId.value = null
  editingId.value = item.id
  editForm.partNumber = item.partNumber
  editForm.manufacturer = item.manufacturer
  editForm.quantity = item.quantity
}

function cancelEdit() { editingId.value = null }

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
  Object.assign(createForm, { partNumber: '', manufacturer: '', quantity: 0 })
  createLoading.value = false
  fetchComponents()
}

function startQtyEdit(item: Component) {
  editingId.value = null
  qtyEditId.value = item.id
  qtyEditVal.value = item.quantity
}

async function saveQty(id: number) {
  await api.put(`/api/admin/components/${id}`, { quantity: qtyEditVal.value })
  qtyEditId.value = null
  fetchComponents()
}

function onQtyKey(e: KeyboardEvent, id: number) {
  if (e.key === 'Enter') saveQty(id)
  if (e.key === 'Escape') qtyEditId.value = null
}
</script>

<template>
  <div>
    <div class="list-header">
      <h1>Компоненты</h1>
      <button class="btn-primary" style="width:auto;padding:10px 20px" @click="showCreate = !showCreate">
        + Добавить
      </button>
    </div>

    <div v-if="showCreate" class="create-form">
      <input v-model="createForm.partNumber" class="form-input" placeholder="Парт номер *" />
      <input v-model="createForm.manufacturer" class="form-input" placeholder="Производитель" />
      <input v-model.number="createForm.quantity" class="form-input" type="number" placeholder="Количество" min="0" />
      <button class="btn-primary" style="width:auto" :disabled="createLoading" @click="createComponent">Сохранить</button>
      <button class="btn-secondary" @click="showCreate = false">Отмена</button>
    </div>

    <div style="margin-bottom:16px">
      <input v-model="query" class="form-input" style="max-width:360px" placeholder="Поиск..." @input="onSearch" />
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
            <td><input v-model.number="editForm.quantity" class="edit-input qty" type="number" /></td>
            <td>
              <button class="act-btn save" title="Сохранить" @click="saveEdit(item.id)">✓</button>
              <button class="act-btn cancel" title="Отмена" @click="cancelEdit">✕</button>
            </td>
          </template>

          <template v-else>
            <td>{{ item.partNumber }}</td>
            <td>{{ item.manufacturer }}</td>
            <td>
              <span
                v-if="qtyEditId !== item.id"
                class="qty-display"
                title="Нажмите для изменения"
                @click="startQtyEdit(item)"
              >{{ item.quantity }}</span>
              <input
                v-else
                v-model.number="qtyEditVal"
                class="edit-input qty"
                type="number"
                autofocus
                @blur="saveQty(item.id)"
                @keydown="onQtyKey($event, item.id)"
              />
            </td>
            <td>
              <button class="act-btn edit" title="Редактировать" @click="startEdit(item)">✏</button>
              <button class="act-btn del" title="Удалить" @click="deleteComponent(item.id)">✕</button>
            </td>
          </template>
        </tr>
        <tr v-if="items.length === 0">
          <td colspan="5" style="text-align:center;padding:20px">Ничего не найдено</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination-bar">
      <button :disabled="page === 1" @click="page--">← Назад</button>
      <span>Страница {{ page }}</span>
      <button :disabled="items.length < 50" @click="page++">Вперёд →</button>
      <span style="opacity:0.6">Всего: {{ total.toLocaleString('ru') }}</span>
    </div>
  </div>
</template>

<style scoped>
h1 { margin-top: 0; }

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.create-form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 20px;
  background: #fff;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}

.create-form .form-input {
  margin: 0;
  width: auto;
  flex: 1;
  min-width: 120px;
  background: #fff;
  color: #1b2b3a;
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
  padding: 9px 12px;
  border-bottom: 1px solid #eee;
  text-align: left;
  font-size: 13px;
}

.admin-table th {
  background: var(--unix-blue);
  color: #fff;
}

.edit-input {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #aaa;
  border-radius: 4px;
  font-size: 13px;
  background: #fff;
  color: #1b2b3a;
}

.edit-input.qty { width: 70px; }

.qty-display {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: border-color 0.15s, background 0.15s;
}

.qty-display:hover {
  border-color: #aaa;
  background: #f5f7fa;
}

.act-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 7px;
  border-radius: 4px;
  font-size: 14px;
  transition: background 0.15s;
}
.act-btn:hover { background: #f0f2f5; }
.act-btn.edit   { color: var(--unix-blue); }
.act-btn.save   { color: #0a7a0a; font-size: 16px; }
.act-btn.cancel { color: #888; }
.act-btn.del    { color: #cc0000; }

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
