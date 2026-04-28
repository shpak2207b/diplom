<script setup lang="ts">
import { ref } from 'vue'
import { api } from '../../api/client.js'

interface ImportRow {
  partNumber: string
  manufacturer: string
  quantity: number
  package: string
  category: string
  description: string
}

const step = ref<'upload' | 'preview' | 'done'>('upload')
const file = ref<File | null>(null)
const loading = ref(false)
const error = ref('')
const rows = ref<ImportRow[]>([])
const result = ref<{ upserted: number; errors: string[] } | null>(null)
const dragOver = ref(false)

const ACCEPTED = ['.json', '.xlsx', '.xls']

function pickFile(f: File | null | undefined) {
  if (!f) return
  const ext = '.' + f.name.split('.').pop()?.toLowerCase()
  if (!ACCEPTED.includes(ext)) {
    error.value = 'Поддерживаются только .xlsx и .json файлы'
    return
  }
  file.value = f
  error.value = ''
}

function onFileChange(e: Event) {
  pickFile((e.target as HTMLInputElement).files?.[0])
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  pickFile(e.dataTransfer?.files?.[0])
}

async function doPreview() {
  if (!file.value) return
  loading.value = true
  error.value = ''
  const formData = new FormData()
  formData.append('file', file.value)
  try {
    const res = await api.post('/api/admin/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    rows.value = res.data.rows.map((r: any) => ({
      partNumber: r.partNumber ?? '',
      manufacturer: r.manufacturer ?? '',
      quantity: r.quantity ?? 0,
      package: r.package ?? '',
      category: r.category ?? '',
      description: r.description ?? '',
    }))
    step.value = 'preview'
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? 'Ошибка парсинга файла'
  } finally {
    loading.value = false
  }
}

function addRow() {
  rows.value.push({ partNumber: '', manufacturer: '', quantity: 0, package: '', category: '', description: '' })
}

function removeRow(i: number) {
  rows.value.splice(i, 1)
}

async function doImport() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.post('/api/admin/import/confirm', rows.value)
    result.value = res.data
    step.value = 'done'
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? 'Ошибка импорта'
  } finally {
    loading.value = false
  }
}

function reset() {
  step.value = 'upload'
  file.value = null
  rows.value = []
  result.value = null
  error.value = ''
}

async function downloadTemplate(format: 'json' | 'xlsx') {
  const res = await api.get(`/api/admin/import/template?format=${format}`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = `template.${format}`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div>
    <h1>Импорт компонентов</h1>

    <!-- Step 1: Upload -->
    <template v-if="step === 'upload'">
      <div class="import-card">
        <div class="template-row">
          <span style="opacity:0.7;font-size:13px">Скачать шаблон:</span>
          <button class="tpl-btn" @click="downloadTemplate('xlsx')">Excel (.xlsx)</button>
          <button class="tpl-btn" @click="downloadTemplate('json')">JSON</button>
        </div>

        <p class="hint">
          Поддерживаются файлы <strong>.xlsx</strong> и <strong>.json</strong>.<br/>
          Обязательные поля: <code>partNumber</code>, <code>quantity</code>.<br/>
          Необязательные: <code>manufacturer</code>, <code>package</code>, <code>category</code>, <code>description</code>.<br/>
          Если компонент с таким <code>partNumber</code> уже есть — он будет обновлён.
        </p>

        <div
          class="drop-zone"
          :class="{ 'drop-zone--over': dragOver, 'drop-zone--has-file': !!file }"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop.prevent="onDrop"
        >
          <div class="drop-zone-icon">{{ file ? '📄' : '📂' }}</div>
          <div v-if="file" class="drop-zone-name">{{ file.name }} ({{ (file.size / 1024).toFixed(0) }} KB)</div>
          <div v-else class="drop-zone-hint">Перетащите файл сюда<br/><span>или</span></div>
          <input type="file" id="fileInput" accept=".json,.xlsx,.xls" @change="onFileChange" />
          <label for="fileInput" class="file-btn">{{ file ? 'Заменить файл' : 'Выбрать файл' }}</label>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button
          class="btn-primary"
          style="max-width:220px;margin-top:16px"
          :disabled="!file || loading"
          @click="doPreview"
        >
          {{ loading ? 'Обработка...' : 'Далее →' }}
        </button>
      </div>
    </template>

    <!-- Step 2: Preview & Edit -->
    <template v-if="step === 'preview'">
      <div class="preview-header">
        <div>
          <h2>Предпросмотр — {{ rows.length }} строк</h2>
          <p class="hint" style="margin:0">Проверьте данные, при необходимости отредактируйте, затем нажмите «Импортировать».</p>
        </div>
        <div class="preview-actions">
          <button class="btn-secondary" @click="reset">← Назад</button>
          <button class="btn-secondary" @click="addRow">+ Строка</button>
          <button class="btn-primary" style="min-width:160px" :disabled="loading || rows.length === 0" @click="doImport">
            {{ loading ? 'Импорт...' : `Импортировать (${rows.length})` }}
          </button>
        </div>
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div class="table-wrap">
        <table class="preview-table">
          <thead>
            <tr>
              <th>Парт номер *</th>
              <th>Производитель</th>
              <th>Кол-во *</th>
              <th>Корпус</th>
              <th>Категория</th>
              <th>Описание</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in rows" :key="i" :class="{ 'row-error': !row.partNumber }">
              <td><input v-model="row.partNumber" placeholder="LM358N" /></td>
              <td><input v-model="row.manufacturer" placeholder="Texas Instruments" /></td>
              <td><input v-model.number="row.quantity" type="number" min="0" style="width:70px" /></td>
              <td><input v-model="row.package" placeholder="DIP-8" /></td>
              <td><input v-model="row.category" placeholder="Усилители" /></td>
              <td><input v-model="row.description" placeholder="Описание" /></td>
              <td><button class="del-row" @click="removeRow(i)" title="Удалить строку">✕</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Step 3: Done -->
    <template v-if="step === 'done' && result">
      <div class="result-card">
        <div class="result-icon" :class="result.upserted === 0 ? 'result-icon--fail' : 'result-icon--ok'">
          {{ result.upserted === 0 ? '✕' : '✓' }}
        </div>
        <h2>{{ result.upserted === 0 ? 'Импорт не выполнен' : 'Импорт завершён' }}</h2>
        <p v-if="result.upserted > 0">Обработано записей: <strong>{{ result.upserted }}</strong></p>
        <div v-if="result.errors.length > 0" class="result-errors">
          <p>Ошибки ({{ result.errors.length }}):</p>
          <ul>
            <li v-for="err in result.errors" :key="err">{{ err }}</li>
          </ul>
        </div>
        <button class="btn-primary" style="max-width:220px;margin-top:20px" @click="reset">
          Импортировать ещё
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
h1 { margin-top: 0; }
h2 { margin: 0 0 4px; font-size: 17px; }

.import-card {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
  max-width: 640px;
}

.template-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.tpl-btn {
  padding: 6px 14px;
  border: 1px solid var(--unix-blue);
  border-radius: 6px;
  background: none;
  color: var(--unix-blue);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.tpl-btn:hover { background: rgba(0,51,102,0.07); }

.hint {
  font-size: 13px;
  opacity: 0.75;
  line-height: 1.6;
  margin-bottom: 18px;
}

.drop-zone {
  border: 2px dashed #b0bec5;
  border-radius: 10px;
  padding: 28px 20px 20px;
  text-align: center;
  transition: border-color 0.2s, background 0.2s;
  cursor: default;
  margin-bottom: 4px;
}
.drop-zone--over {
  border-color: var(--unix-blue);
  background: rgba(0, 51, 102, 0.04);
}
.drop-zone--has-file {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.04);
}

.drop-zone-icon { font-size: 32px; margin-bottom: 6px; }

.drop-zone-hint {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  line-height: 1.6;
}
.drop-zone-hint span { opacity: 0.5; font-size: 12px; }

.drop-zone-name {
  font-size: 14px;
  color: #2e7d32;
  font-weight: 600;
  margin-bottom: 10px;
}

.drop-zone input[type="file"] { display: none; }

.file-btn {
  display: inline-block;
  padding: 9px 20px;
  background: var(--unix-blue);
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}
.file-btn:hover { background: #0055aa; }

/* Preview */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.preview-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
}

.table-wrap {
  overflow-x: auto;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 800px;
}

.preview-table th {
  background: var(--unix-blue);
  color: #fff;
  padding: 10px 8px;
  text-align: left;
  white-space: nowrap;
}

.preview-table td {
  padding: 4px 6px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-table input {
  width: 100%;
  padding: 5px 7px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 13px;
  background: transparent;
  color: #1b2b3a;
  transition: border-color 0.15s, background 0.15s;
  box-sizing: border-box;
}
.preview-table input:focus {
  outline: none;
  border-color: var(--unix-blue);
  background: #fff;
}

.row-error td { background: #fff5f5; }

.del-row {
  background: none;
  border: none;
  color: #cc0000;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0.6;
  transition: opacity 0.15s;
}
.del-row:hover { opacity: 1; background: #fff0f0; }

/* Done */
.result-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px 28px;
  max-width: 420px;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
  text-align: center;
}

.result-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.result-icon--ok { color: #22a722; }
.result-icon--fail { color: #cc0000; }

.result-errors {
  text-align: left;
  background: #fff5f5;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 12px;
  font-size: 13px;
}

.result-errors ul { margin: 4px 0 0; padding-left: 18px; }
.result-errors li { margin-bottom: 4px; color: #cc0000; }

code {
  background: rgba(0,0,0,.07);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 12px;
}
</style>
