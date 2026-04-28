<script setup lang="ts">
import SiteHeader from '../components/layout/SiteHeader.vue'
import SiteFooter from '../components/layout/SiteFooter.vue'
import HeroSection from '../components/sections/HeroSection.vue'
import AboutSection from '../components/sections/AboutSection.vue'
import ServicesSection from '../components/sections/ServicesSection.vue'
import AdvantagesSection from '../components/sections/AdvantagesSection.vue'
import CatalogSection from '../components/sections/CatalogSection.vue'
import CertificatesSection from '../components/sections/CertificatesSection.vue'
import ContactsSection from '../components/sections/ContactsSection.vue'
import CartDrawer from '../components/cart/CartDrawer.vue'
</script>

<template>
  <SiteHeader />
  <main>
    <HeroSection />
    <AboutSection />
    <ServicesSection />
    <AdvantagesSection />
    <CatalogSection />
    <CertificatesSection />
    <ContactsSection />
  </main>
  <SiteFooter />
  <CartDrawer />
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-bottom: 40px;
  overflow-x: hidden;
}
</style>
