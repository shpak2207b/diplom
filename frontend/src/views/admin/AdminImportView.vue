<script setup lang="ts">
import { ref } from 'vue'
import { api } from '../../api/client.js'

const file = ref<File | null>(null)
const loading = ref(false)
const result = ref<{ inserted: number; errors: string[] } | null>(null)
const error = ref('')

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
  result.value = null
  error.value = ''
}

async function doImport() {
  if (!file.value) return
  loading.value = true
  error.value = ''
  result.value = null

  const formData = new FormData()
  formData.append('file', file.value)

  try {
    const res = await api.post('/api/admin/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    result.value = res.data
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? 'Ошибка импорта'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1>Импорт компонентов</h1>

    <div class="import-card">
      <p style="opacity:0.7;margin-top:0">
        Загрузите CSV или XLSX файл с колонками: <code>part_number</code>, <code>manufacturer</code>,
        <code>quantity</code>. Первая строка — заголовки.
      </p>

      <div class="drop-zone">
        <input type="file" id="fileInput" accept=".csv,.xlsx,.xls" @change="onFileChange" />
        <label for="fileInput">
          <span v-if="!file">📂 Выберите файл CSV или XLSX</span>
          <span v-else>📄 {{ file.name }} ({{ (file.size / 1024).toFixed(0) }} KB)</span>
        </label>
      </div>

      <button
        class="btn-primary"
        style="max-width:200px;margin-top:16px"
        :disabled="!file || loading"
        @click="doImport"
      >
        {{ loading ? 'Импорт...' : 'Начать импорт' }}
      </button>
    </div>

    <div v-if="result" class="result-box">
      <h3>Результат</h3>
      <p>✅ Добавлено: <strong>{{ result.inserted }}</strong></p>
      <div v-if="result.errors.length > 0">
        <p>⚠️ Ошибки ({{ result.errors.length }}):</p>
        <ul>
          <li v-for="err in result.errors" :key="err">{{ err }}</li>
        </ul>
      </div>
    </div>

    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<style scoped>
h1 { margin-top: 0; }

.import-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
  max-width: 600px;
}

.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  transition: border-color 0.2s;
  cursor: pointer;
}

.drop-zone:hover {
  border-color: var(--unix-blue);
}

.drop-zone input[type="file"] {
  display: none;
}

.drop-zone label {
  cursor: pointer;
  font-size: 15px;
  display: block;
}

.result-box {
  margin-top: 24px;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  max-width: 600px;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
}

code {
  background: rgba(0,0,0,.07);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 13px;
}
</style>
