<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.username, form.password)
    router.push('/admin')
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-box">
      <h2>Юникс Плюс — Админ</h2>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Логин</label>
          <input v-model="form.username" class="form-input" type="text" autocomplete="username" required />
        </div>
        <div class="form-group">
          <label>Пароль</label>
          <input v-model="form.password" class="form-input" type="password" autocomplete="current-password" required />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button class="btn-primary" :disabled="loading" type="submit">
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
}

.login-box {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 40px;
  width: 360px;
  max-width: 95vw;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.login-box h2 {
  text-align: center;
  margin-bottom: 24px;
  color: var(--unix-blue);
}
</style>
