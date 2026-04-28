<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useCartStore } from '../../stores/cart.js'
import { api } from '../../api/client.js'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: {
        sitekey: string
        callback: (token: string) => void
        'expired-callback'?: () => void
        'error-callback'?: () => void
        theme?: 'light' | 'dark' | 'auto'
      }) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

const emit = defineEmits<{ close: []; success: [] }>()

const cart = useCartStore()
const step = ref<'form' | 'success'>('form')

const form = reactive({
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  companyName: '',
  comment: '',
})

const captchaToken = ref('')
const captchaContainer = ref<HTMLElement>()
let widgetId = ''

const loading = ref(false)
const error = ref('')

onMounted(() => {
  if (window.turnstile && captchaContainer.value) {
    widgetId = window.turnstile.render(captchaContainer.value, {
      sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
      theme: 'auto',
      callback: (token) => { captchaToken.value = token },
      'expired-callback': () => { captchaToken.value = '' },
      'error-callback': () => { captchaToken.value = '' },
    })
  }
})

onUnmounted(() => {
  if (window.turnstile && widgetId) {
    window.turnstile.remove(widgetId)
  }
})

async function submit() {
  if (!form.customerName.trim() || !form.customerEmail.trim()) {
    error.value = 'Укажите имя и email'
    return
  }
  if (!captchaToken.value) {
    error.value = 'Пройдите проверку CAPTCHA'
    return
  }
  error.value = ''
  loading.value = true
  try {
    await api.post('/api/orders', {
      captchaToken: captchaToken.value,
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      customerPhone: form.customerPhone || undefined,
      companyName: form.companyName || undefined,
      comment: form.comment || undefined,
      items: cart.items.map((i) => ({
        componentId: i.component.id,
        partNumber: i.component.partNumber,
        manufacturer: i.component.manufacturer,
        quantity: i.quantity,
      })),
    })
    step.value = 'success'
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? 'Ошибка. Попробуйте ещё раз.'
    if (window.turnstile && widgetId) {
      window.turnstile.reset(widgetId)
      captchaToken.value = ''
    }
  } finally {
    loading.value = false
  }
}

function onSuccess() {
  emit('success')
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-box">
      <button class="modal-box-close" @click="emit('close')">&times;</button>

      <!-- Form -->
      <template v-if="step === 'form'">
        <h2>Оформить заявку</h2>
        <p style="font-size:13px;opacity:0.7;margin-top:-10px">
          Позиций: {{ cart.items.length }}
        </p>

        <div class="form-group">
          <label>Ваше имя *</label>
          <input v-model="form.customerName" class="form-input" type="text" placeholder="Иванов Иван" required />
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input v-model="form.customerEmail" class="form-input" type="email" placeholder="ivan@example.com" required />
        </div>
        <div class="form-group">
          <label>Телефон</label>
          <input v-model="form.customerPhone" class="form-input" type="tel" placeholder="+7 999 000-00-00" />
        </div>
        <div class="form-group">
          <label>Компания</label>
          <input v-model="form.companyName" class="form-input" type="text" placeholder="ООО Рога и Копыта" />
        </div>
        <div class="form-group">
          <label>Комментарий</label>
          <textarea v-model="form.comment" class="form-input" rows="3" placeholder="Сроки, особые требования..." style="resize:vertical" />
        </div>

        <div ref="captchaContainer" style="margin: 12px 0" />

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button class="btn-primary" :disabled="loading || !captchaToken" @click="submit">
          {{ loading ? 'Отправка...' : 'Отправить заявку' }}
        </button>
      </template>

      <!-- Success -->
      <template v-else>
        <div style="text-align:center;padding:20px 0">
          <div style="font-size:60px">✅</div>
          <h2>Заявка отправлена!</h2>
          <p>Мы свяжемся с вами в ближайшее время.</p>
          <button class="btn-primary" style="max-width:200px;margin:0 auto" @click="onSuccess">
            Закрыть
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
