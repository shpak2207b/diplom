<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { api } from '../../api/client.js'

interface Message {
  id: number
  name: string
  email: string
  message: string
  archived: boolean
  createdAt: string
}

const messages = ref<Message[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const selected = ref<Message | null>(null)
const tab = ref<'new' | 'archive'>('new')

async function fetchMessages() {
  loading.value = true
  const res = await api.get('/api/admin/messages', {
    params: { page: page.value, limit: 20, archived: tab.value === 'archive' },
  })
  messages.value = res.data.messages
  total.value = res.data.total
  loading.value = false
}

onMounted(fetchMessages)
watch(tab, () => { page.value = 1; fetchMessages() })

async function archiveMessage(id: number) {
  await api.patch(`/api/admin/messages/${id}/archive`)
  if (selected.value?.id === id) selected.value = null
  fetchMessages()
}

async function deleteMessage(id: number) {
  if (!confirm('Удалить сообщение безвозвратно?')) return
  await api.delete(`/api/admin/messages/${id}`)
  if (selected.value?.id === id) selected.value = null
  fetchMessages()
}
</script>

<template>
  <div>
    <h1>Сообщения</h1>

    <div class="tabs">
      <button :class="{ active: tab === 'new' }" @click="tab = 'new'">Новые</button>
      <button :class="{ active: tab === 'archive' }" @click="tab = 'archive'">Архив</button>
    </div>

    <div v-if="loading">Загрузка...</div>
    <table v-else class="admin-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Дата</th>
          <th>Имя</th>
          <th>Email</th>
          <th>Сообщение</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="msg in messages"
          :key="msg.id"
          class="clickable"
          @click="selected = msg"
        >
          <td>{{ msg.id }}</td>
          <td style="white-space:nowrap">{{ new Date(msg.createdAt).toLocaleString('ru') }}</td>
          <td>{{ msg.name }}</td>
          <td>{{ msg.email }}</td>
          <td class="msg-preview">{{ msg.message }}</td>
          <td class="actions-cell">
            <button
              v-if="tab === 'new'"
              class="act-btn arch"
              title="В архив"
              @click.stop="archiveMessage(msg.id)"
            >В архив</button>
            <button
              v-if="tab === 'archive'"
              class="act-btn del"
              title="Удалить"
              @click.stop="deleteMessage(msg.id)"
            >✕</button>
          </td>
        </tr>
        <tr v-if="messages.length === 0">
          <td colspan="6" style="text-align:center;padding:20px">Сообщений нет</td>
        </tr>
      </tbody>
    </table>

    <div v-if="total > 20" class="pagination-bar">
      <button :disabled="page === 1" @click="page--; fetchMessages()">← Назад</button>
      <span>Страница {{ page }}</span>
      <button :disabled="messages.length < 20" @click="page++; fetchMessages()">Вперёд →</button>
      <span style="opacity:0.6">Всего: {{ total }}</span>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="selected" class="msg-overlay" @click.self="selected = null">
        <div class="msg-modal">
          <button class="modal-close" @click="selected = null">&times;</button>
          <div class="msg-meta">
            <span><b>{{ selected.name }}</b></span>
            <a :href="`mailto:${selected.email}`">{{ selected.email }}</a>
            <span style="opacity:0.6;font-size:12px">{{ new Date(selected.createdAt).toLocaleString('ru') }}</span>
          </div>
          <div class="msg-body">{{ selected.message }}</div>
          <div style="margin-top:16px;display:flex;gap:10px">
            <a :href="`mailto:${selected.email}`" class="btn-reply">Ответить</a>
            <button v-if="tab === 'new'" class="btn-arch" @click="archiveMessage(selected.id)">В архив</button>
            <button v-if="tab === 'archive'" class="btn-del" @click="deleteMessage(selected.id)">Удалить</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
h1 { margin-top: 0; }

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tabs button {
  padding: 8px 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
  color: #1b2b3a;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.tabs button.active {
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
  vertical-align: middle;
}

.admin-table th { background: var(--unix-blue); color: #fff; }

.clickable { cursor: pointer; transition: background 0.15s; }
.clickable:hover { background: #f5f7fa; }

.msg-preview {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #555;
}

.actions-cell { white-space: nowrap; }

.act-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 7px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.15s;
}
.act-btn:hover { background: #f0f2f5; }
.act-btn.arch { color: #555; border: 1px solid #ccc; }
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

/* Modal */
.msg-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.msg-modal {
  background: #fff;
  color: #1b2b3a;
  border-radius: 12px;
  width: 560px;
  max-width: 96vw;
  max-height: 80vh;
  overflow-y: auto;
  padding: 28px;
  position: relative;
  box-shadow: 0 8px 32px rgba(0,0,0,.2);
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 18px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #888;
  line-height: 1;
}
.modal-close:hover { color: #1b2b3a; }

.msg-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}
.msg-meta a { color: var(--unix-blue); text-decoration: none; }
.msg-meta a:hover { text-decoration: underline; }

.msg-body {
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}

.btn-reply {
  display: inline-block;
  background: var(--unix-blue);
  color: #fff;
  border: none;
  padding: 9px 20px;
  border-radius: 7px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
}
.btn-reply:hover { background: #0055aa; }

.btn-arch {
  background: none;
  border: 1px solid #888;
  color: #444;
  padding: 9px 16px;
  border-radius: 7px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-arch:hover { background: #f0f0f0; }

.btn-del {
  background: none;
  border: 1px solid #cc0000;
  color: #cc0000;
  padding: 9px 16px;
  border-radius: 7px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-del:hover { background: #fff0f0; }
</style>
