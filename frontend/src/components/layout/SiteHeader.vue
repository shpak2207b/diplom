<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '../../stores/theme.js'
import { useCartStore } from '../../stores/cart.js'

const theme = useThemeStore()
const cart = useCartStore()

const logoSrc = computed(() => (theme.isDark ? '/logo-dark.png' : '/logo-light.png'))
</script>

<template>
  <header>
    <a href="#" class="logo-link">
      <img :src="logoSrc" alt="Юникс Плюс" />
    </a>

    <nav>
      <a href="#about">О компании</a>
      <a href="#services">Услуги</a>
      <a href="#advantages">Преимущества</a>
      <a href="#catalog">Каталог</a>
      <a href="#certificates">Сертификаты</a>
      <a href="#contacts">Контакты</a>

      <button class="cart-badge" @click="cart.isOpen = true" title="Корзина заявки">
        🛒
        <span v-if="cart.totalCount > 0" class="cart-badge-count">{{ cart.totalCount }}</span>
      </button>
    </nav>

    <button class="theme-wrapper" :title="theme.isDark ? 'Светлая тема' : 'Тёмная тема'" @click="theme.toggle()">
      <!-- Moon icon (shown in light mode) -->
      <svg v-if="!theme.isDark" class="theme-icon" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 0 0 12 17a7 7 0 0 0 9-4.21z" />
      </svg>
      <!-- Sun icon (shown in dark mode) -->
      <svg v-else class="theme-icon" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    </button>
  </header>
</template>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 20px 30px;
  border-bottom: 1px solid #e5e5e5;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(5px);
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  transition: background-color 0.3s ease;
  position: sticky;
  top: 0;
  z-index: 100;
}

:global(body.dark-theme) header {
  background-color: rgba(20, 20, 20, 0.8);
  border-color: #333;
  box-shadow: 0 4px 10px rgba(255, 255, 255, 0.05);
}

.logo-link img {
  height: 80px;
  transition: opacity 0.3s;
  max-width: 100%;
}

.logo-link:hover img {
  opacity: 0.8;
}

nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

nav a {
  padding: 10px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
  transition: background-color 0.3s ease;
}

nav a:hover {
  background-color: var(--menu-hover);
}

.theme-wrapper {
  margin-left: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease;
  background: none;
  border: none;
  padding: 0;
}

.theme-wrapper:hover {
  transform: scale(1.1);
}

.theme-icon {
  width: 26px;
  height: 26px;
  stroke: var(--icon-color);
  fill: none;
}
</style>
