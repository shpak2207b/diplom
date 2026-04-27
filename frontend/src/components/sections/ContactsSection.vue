<script setup lang="ts">
import { ref, reactive } from 'vue'
import { api } from '../../api/client.js'

const form = reactive({ name: '', email: '', message: '' })
const loading = ref(false)
const success = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await api.post('/api/contact', form)
    success.value = true
    form.name = ''
    form.email = ''
    form.message = ''
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? 'Ошибка отправки. Попробуйте ещё раз.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section id="contacts" class="section">
    <h2>Свяжитесь с нами</h2>
    <p class="contact-intro">
      Опишите номенклатуру (BOM), объёмы и желаемые сроки — ответим в течение рабочего дня.
    </p>

    <div class="contact-form">
      <div v-if="success" class="success-msg" style="padding:20px 0">
        ✅ Сообщение отправлено! Мы свяжемся с вами в ближайшее время.
      </div>

      <form v-else @submit.prevent="submit">
        <input
          v-model="form.name"
          type="text"
          placeholder="Ваше имя"
          required
          minlength="2"
          maxlength="100"
        />
        <input
          v-model="form.email"
          type="email"
          placeholder="Ваш email"
          required
        />
        <textarea
          v-model="form.message"
          rows="5"
          placeholder="Ваше сообщение"
          required
          minlength="5"
          maxlength="5000"
        />
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Отправка...' : 'Отправить' }}
        </button>
      </form>
    </div>
  </section>
</template>
