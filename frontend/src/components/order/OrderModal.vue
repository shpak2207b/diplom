<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useCartStore } from '../../stores/cart.js'
import { api } from '../../api/client.js'

const emit = defineEmits<{ close: []; success: [] }>()

const cart = useCartStore()
const step = ref(1) // 1: form, 2: otp, 3: success

const form = reactive({
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  companyName: '',
  comment: '',
})

const otpCode = ref(['', '', '', '', '', ''])
const otpRefs = ref<HTMLInputElement[]>([])
const otpToken = ref('')

const loading = ref(false)
const error = ref('')

// --- Step 1: request OTP ---
async function requestOtp() {
  if (!form.customerName.trim() || !form.customerEmail.trim()) {
    error.value = 'Укажите имя и email'
    return
  }
  error.value = ''
  loading.value = true
  try {
    await api.post('/api/otp/request', { email: form.customerEmail })
    step.value = 2
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? 'Ошибка. Попробуйте ещё раз.'
  } finally {
    loading.value = false
  }
}

// --- Step 2: handle OTP input ---
function onOtpInput(idx: number, e: Event) {
  const input = e.target as HTMLInputElement
  const val = input.value.replace(/\D/g, '')
  otpCode.value[idx] = val.slice(-1)
  if (val && idx < 5) {
    otpRefs.value[idx + 1]?.focus()
  }
  if (otpCode.value.every((c) => c !== '')) {
    verifyAndSubmit()
  }
}

function onOtpKeydown(idx: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !otpCode.value[idx] && idx > 0) {
    otpRefs.value[idx - 1]?.focus()
  }
}

async function verifyAndSubmit() {
  error.value = ''
  loading.value = true
  const code = otpCode.value.join('')
  try {
    // Verify OTP and get token
    const verifyRes = await api.post('/api/otp/verify', {
      email: form.customerEmail,
      code,
    })
    otpToken.value = verifyRes.data.token

    // Submit order
    await api.post('/api/orders', {
      token: otpToken.value,
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

    step.value = 3
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? 'Ошибка. Проверьте код.'
    otpCode.value = ['', '', '', '', '', '']
    otpRefs.value[0]?.focus()
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

      <!-- Step 1: Form -->
      <template v-if="step === 1">
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

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button class="btn-primary" :disabled="loading" @click="requestOtp">
          {{ loading ? 'Отправка кода...' : 'Получить код на email' }}
        </button>
      </template>

      <!-- Step 2: OTP -->
      <template v-else-if="step === 2">
        <h2>Код подтверждения</h2>
        <p style="font-size:14px">
          Введите 6-значный код, отправленный на <strong>{{ form.customerEmail }}</strong>
        </p>

        <div class="otp-inputs">
          <input
            v-for="(_, idx) in otpCode"
            :key="idx"
            :ref="(el) => { if (el) otpRefs[idx] = el as HTMLInputElement }"
            :value="otpCode[idx]"
            type="text"
            inputmode="numeric"
            maxlength="1"
            @input="onOtpInput(idx, $event)"
            @keydown="onOtpKeydown(idx, $event)"
          />
        </div>

        <p v-if="error" class="error-msg" style="text-align:center">{{ error }}</p>
        <p v-if="loading" style="text-align:center;font-size:14px">Проверка...</p>

        <button class="btn-secondary" style="width:100%;margin-top:10px" @click="step = 1">
          ← Назад
        </button>
      </template>

      <!-- Step 3: Success -->
      <template v-else-if="step === 3">
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
