<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore } from '../../stores/theme.js'
import { useCartStore } from '../../stores/cart.js'

const theme = useThemeStore()
const cart = useCartStore()
const menuOpen = ref(false)

const logoSrc = computed(() => (theme.isDark ? '/logo-dark.png' : '/logo-light.png'))

function closeMenu() { menuOpen.value = false }
</script>

<template>
  <header>
    <a href="#" class="logo-link">
      <img :src="logoSrc" alt="Юникс Плюс" />
    </a>

    <nav :class="{ 'nav-open': menuOpen }">
      <a href="#about" @click="closeMenu">О компании</a>
      <a href="#services" @click="closeMenu">Услуги</a>
      <a href="#advantages" @click="closeMenu">Преимущества</a>
      <a href="#catalog" @click="closeMenu">Каталог</a>
      <a href="#certificates" @click="closeMenu">Сертификаты</a>
      <a href="#contacts" @click="closeMenu">Контакты</a>

      <button class="cart-badge" @click="cart.isOpen = true; closeMenu()" title="Заявка">
        <span class="cart-label">Заявка</span>
        <span v-if="cart.totalCount > 0" class="cart-badge-count">{{ cart.totalCount }}</span>
      </button>
    </nav>

    <div class="header-controls">
      <button class="theme-wrapper" :title="theme.isDark ? 'Светлая тема' : 'Тёмная тема'" @click="theme.toggle()">
        <svg v-if="!theme.isDark" class="theme-icon" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 0 0 12 17a7 7 0 0 0 9-4.21z" />
        </svg>
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

      <button
        class="burger"
        :class="{ open: menuOpen }"
        aria-label="Меню"
        @click="menuOpen = !menuOpen"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>
</template>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 20px 30px;
  border-bottom: 1px solid var(--header-border);
  background-color: var(--header-bg);
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: background-color 0.3s ease, border-color 0.3s ease;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo-link img {
  height: 80px;
  transition: opacity 0.3s;
  max-width: 100%;
  display: block;
}

.logo-link:hover img { opacity: 0.8; }

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

nav a:hover { background-color: var(--menu-hover); }

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.theme-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease;
  background: none;
  border: none;
  padding: 0;
}

.theme-wrapper:hover { transform: scale(1.1); }

.theme-icon {
  width: 26px;
  height: 26px;
  stroke: var(--icon-color);
  fill: none;
}

.cart-label {
  font-weight: 600;
  font-size: 14px;
}

/* ===== Burger button ===== */
.burger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  width: 32px;
  height: 32px;
}

.burger span {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--icon-color);
  border-radius: 2px;
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.burger.open span:nth-child(2) { opacity: 0; }
.burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ===== Mobile ===== */
@media (max-width: 768px) {
  header {
    flex-wrap: wrap;
    padding: 14px 16px;
  }

  .burger {
    display: flex;
  }

  nav {
    display: none;
    order: 3;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding-top: 10px;
    border-top: 1px solid var(--header-border);
  }

  nav.nav-open {
    display: flex;
  }

  nav a {
    padding: 12px 10px;
    border-radius: 8px;
  }

  /* Cart-badge takes full width in mobile menu */
  nav .cart-badge {
    width: 100%;
    justify-content: center;
    border-radius: 8px;
  }
}
</style>
