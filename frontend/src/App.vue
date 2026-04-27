<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useThemeStore } from './stores/theme.js'

// Init theme store to apply saved theme on load
useThemeStore()
</script>

<template>
  <RouterView />
</template>
