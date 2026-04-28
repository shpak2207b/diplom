<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '../../stores/cart.js'
import OrderModal from '../order/OrderModal.vue'

const cart = useCartStore()
const orderOpen = ref(false)

function close() { cart.isOpen = false }

function openOrder() {
  if (cart.items.length === 0) return
  orderOpen.value = true
}

function onOrderSuccess() {
  orderOpen.value = false
  cart.isOpen = false
  cart.clear()
}
</script>

<template>
  <Teleport to="body">
    <div v-if="cart.isOpen" class="cart-drawer-overlay" @click.self="close">
      <div class="cart-drawer">
        <div class="cart-drawer-header">
          <h3 style="margin:0">Заявка ({{ cart.totalCount }})</h3>
          <button class="modal-box-close" @click="close">&times;</button>
        </div>

        <div class="cart-drawer-body">
          <p v-if="cart.items.length === 0" style="text-align:center;opacity:0.6">
            Добавьте компоненты из каталога
          </p>

          <div v-for="item in cart.items" :key="item.component.id" class="cart-item">
            <div class="cart-item-info">
              <div class="cart-item-part">{{ item.component.partNumber }}</div>
              <div class="cart-item-mfg">{{ item.component.manufacturer }}</div>
            </div>

            <div class="qty-stepper">
              <button @click="cart.setQuantity(item.component.id, item.quantity - 1)">−</button>
              <span>{{ item.quantity }}</span>
              <button @click="cart.setQuantity(item.component.id, item.quantity + 1)">+</button>
            </div>

            <button class="remove-btn" title="Удалить" @click="cart.removeItem(item.component.id)">
              ×
            </button>
          </div>
        </div>

        <div class="cart-drawer-footer">
          <button
            class="btn-primary"
            style="flex:1"
            :disabled="cart.items.length === 0"
            @click="openOrder"
          >
            Отправить заявку
          </button>
          <button
            class="btn-secondary"
            :disabled="cart.items.length === 0"
            @click="cart.clear()"
          >
            Очистить
          </button>
        </div>
      </div>
    </div>

    <OrderModal
      v-if="orderOpen"
      @close="orderOpen = false"
      @success="onOrderSuccess"
    />
  </Teleport>
</template>
