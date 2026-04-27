<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
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
  debounceTimer.value = setTimeout(() => {
    page.value = 1
    fetchCatalog()
  }, 300)
}

watch(page, fetchCatalog)

onMounted(fetchCatalog)

function addToCart(component: Component) {
  cart.addItem(component, 1)
}

function prevPage() {
  if (page.value > 1) page.value--
}

function nextPage() {
  if (data.value && page.value < data.value.pages) page.value++
}
</script>

<template>
  <section id="catalog" class="section catalog-section">
    <h2>Каталог компонентов*</h2>

    <div class="search-box">
      <input
        v-model="query"
        type="text"
        placeholder="Поиск по парт номеру или производителю..."
        @input="onSearch"
      />
    </div>

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
        <tr v-if="loading">
          <td colspan="5" style="text-align:center;padding:20px">Загрузка...</td>
        </tr>
        <tr v-else-if="!data || data.items.length === 0">
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
              >
                {{ cart.hasItem(item.id) ? '✓ Добавлено' : '+ В заявку' }}
              </button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <div v-if="data" class="pagination">
      <button :disabled="page === 1" @click="prevPage">← Назад</button>
      <span style="align-self:center;font-size:13px">
        {{ page }} / {{ data.pages }} ({{ data.total.toLocaleString('ru') }} записей)
      </span>
      <button :disabled="page >= data.pages" @click="nextPage">Вперёд →</button>
    </div>

    <p style="text-align:center;font-size:12px;opacity:0.7;margin-top:16px">
      *ООО Юникс-Плюс не гарантирует полное количество на складе, для уточнения информации
      воспользуйтесь формой обратной связи или свяжитесь с нами.
    </p>
  </section>
</template>

<style scoped>
.add-btn {
  padding: 4px 10px;
  border: 1px solid var(--unix-blue);
  border-radius: 4px;
  background: none;
  color: var(--unix-blue);
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;
}

.add-btn:hover,
.add-btn.added {
  background: var(--unix-blue);
  color: #fff;
}
</style>
