import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('theme') === 'dark')

  function apply() {
    if (isDark.value) {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  apply()

  watch(isDark, apply)

  function toggle() {
    isDark.value = !isDark.value
  }

  return { isDark, toggle }
})
