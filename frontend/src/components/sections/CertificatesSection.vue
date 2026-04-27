<script setup lang="ts">
import { ref } from 'vue'

const modalOpen = ref(false)

function openModal() { modalOpen.value = true }
function closeModal() { modalOpen.value = false }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeModal()
}
</script>

<template>
  <section id="certificates" class="section">
    <h2>Сертификаты</h2>
    <div class="certs-grid">
      <img
        src="/cert-iso9001-thumb.png"
        alt="Сертификат ISO 9001"
        class="cert-thumb"
        @click="openModal"
      />
    </div>
  </section>

  <Teleport to="body">
    <div
      v-if="modalOpen"
      class="modal-overlay"
      @click.self="closeModal"
      @keydown="onKeydown"
      tabindex="-1"
    >
      <span class="modal-close" @click="closeModal">&times;</span>
      <img src="/cert-iso9001-full.png" alt="ISO 9001" class="modal-content" />
    </div>
  </Teleport>
</template>

<style scoped>
.modal-content {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 12px;
  display: block;
  margin: auto;
}
</style>
