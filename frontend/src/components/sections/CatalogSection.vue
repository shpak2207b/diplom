<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { api } from '../../api/client.js'
import { useCartStore } from '../../stores/cart.js'
import type { CatalogResponse, Component } from '../../types/index.js'

const cart = useCartStore()

const query = ref('')
const page = ref(1)
const limit = 25
const data = ref<CatalogResponse | null>(null)
const loading = ref(false)
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

async function fetchCatalog() {
  loading.value = true
  try {
    const res = await api.get<CatalogResponse>('/api/catalog', {
      params: { q: query.value, page: page.value, limit },
    })
    data.value = res.data
  } catch (e) {
    console.error('Catalog fetch error', e)
  } finally {
    loading.value = false
  }
}

function onSearch() {
  if (debounceTimer.value) clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => { page.value = 1; fetchCatalog() }, 300)
}

watch(page, fetchCatalog)
onMounted(fetchCatalog)

function addToCart(component: Component) { cart.addItem(component, 1) }

const pageButtons = computed(() => {
  const total = data.value?.pages ?? 1
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const cur = page.value
  const pages: (number | '...')[] = [1]
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})
</script>

<template>
  <section id="catalog" class="section catalog-section">
    <h2>Каталог компонентов*</h2>

    <div class="catalog-filters">
      <input
        v-model="query"
        type="text"
        placeholder="Поиск по парт номеру или производителю..."
        @input="onSearch"
      />
    </div>

    <div class="table-wrap" :class="{ 'table-loading': loading }">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Парт номер</th>
            <th>Производитель</th>
            <th>Количество</th>
            <th>Заявка</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!data || (data.items.length === 0 && !loading)">
            <td colspan="5" style="text-align:center;padding:20px">Ничего не найдено</td>
          </tr>
          <template v-else>
            <tr v-for="(item, idx) in data.items" :key="item.id">
              <td>{{ (page - 1) * limit + idx + 1 }}</td>
              <td>{{ item.partNumber }}</td>
              <td>{{ item.manufacturer }}</td>
              <td>{{ item.quantity }}</td>
              <td>
                <button
                  class="add-btn"
                  :class="{ added: cart.hasItem(item.id) }"
                  @click="addToCart(item)"
                >{{ cart.hasItem(item.id) ? '✓ Добавлено' : '+ В заявку' }}</button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="data && data.pages > 1" class="pagination">
      <button :disabled="page === 1" @click="page = 1">«</button>
      <button :disabled="page === 1" @click="page--">‹</button>
      <template v-for="btn in pageButtons" :key="String(btn)">
        <span v-if="btn === '...'" class="page-ellipsis">…</span>
        <button v-else :class="{ active: btn === page }" @click="page = btn as number">{{ btn }}</button>
      </template>
      <button :disabled="page >= data.pages" @click="page++">›</button>
      <button :disabled="page >= data.pages" @click="page = data.pages">»</button>
    </div>

    <div v-if="data" class="catalog-info">
      Страница {{ page }} из {{ data.pages }} · {{ data.total.toLocaleString('ru') }} записей
    </div>

    <p style="text-align:center;font-size:12px;opacity:0.7;margin-top:16px">
      *ООО Юникс-Плюс не гарантирует полное количество на складе, для уточнения информации
      воспользуйтесь формой обратной связи или свяжитесь с нами.
    </p>
  </section>
</template>

<style scoped>
.table-wrap {
  transition: opacity 0.15s ease;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-wrap.table-loading {
  opacity: 0.45;
  pointer-events: none;
}

.catalog-filters {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
}

.catalog-filters input {
  padding: 10px;
  width: 340px;
  max-width: 100%;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
  background: var(--card-bg);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
}

@media (max-width: 768px) {
  .catalog-filters input {
    width: 100%;
  }
}


.add-btn {
  padding: 4px 10px;
  border: 1px solid var(--add-btn-border);
  border-radius: 4px;
  background: none;
  color: var(--add-btn-color);
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;
}

.add-btn:hover, .add-btn.added {
  background: var(--unix-blue);
  color: #fff;
  border-color: var(--unix-blue);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.pagination button {
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  border: 1px solid var(--header-border);
  border-radius: 6px;
  cursor: pointer;
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 14px;
  transition: background 0.2s, color 0.2s;
}

.pagination button:hover:not(:disabled) {
  background: var(--unix-blue);
  color: #fff;
  border-color: var(--unix-blue);
}

.pagination button.active {
  background: var(--unix-blue);
  color: #fff;
  border-color: var(--unix-blue);
  font-weight: 700;
}

.pagination button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-ellipsis {
  padding: 0 4px;
  opacity: 0.5;
  font-size: 16px;
}

.catalog-info {
  text-align: center;
  font-size: 12px;
  opacity: 0.6;
  margin-top: 10px;
}
</style>
