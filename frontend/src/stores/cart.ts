import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, Component } from '../types/index.js'

export const useCartStore = defineStore(
  'cart',
  () => {
    const items = ref<CartItem[]>([])
    const isOpen = ref(false)

    const totalCount = computed(() =>
      items.value.reduce((sum, i) => sum + i.quantity, 0),
    )

    function addItem(component: Component, qty = 1) {
      const existing = items.value.find((i) => i.component.id === component.id)
      if (existing) {
        existing.quantity += qty
      } else {
        items.value.push({ component, quantity: qty })
      }
      isOpen.value = true
    }

    function removeItem(componentId: number) {
      items.value = items.value.filter((i) => i.component.id !== componentId)
    }

    function setQuantity(componentId: number, qty: number) {
      const item = items.value.find((i) => i.component.id === componentId)
      if (item) {
        if (qty <= 0) {
          removeItem(componentId)
        } else {
          item.quantity = qty
        }
      }
    }

    function clear() {
      items.value = []
    }

    function hasItem(componentId: number) {
      return items.value.some((i) => i.component.id === componentId)
    }

    return { items, isOpen, totalCount, addItem, removeItem, setQuantity, clear, hasItem }
  },
  {
    persist: {
      pick: ['items'],
    },
  },
)
