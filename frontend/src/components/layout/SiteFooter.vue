<template>
  <footer>
    <p>© 2025 ООО «Юникс-Плюс» | info@unixplus.su</p>
    <p>117218, город Москва, ул. Кржижановского, 15к1, Зэт, пом. 2/1/3</p>
    <p>ИНН / КПП: 7730506730 / 772701001</p>
    <p>тел. +7-991-266-88-95, +7-991-583-88-97</p>
  </footer>
</template>

<style scoped>
footer {
  background-color: var(--header-bg);
  padding: 30px 20px;
  text-align: center;
  font-size: 14px;
  color: var(--text-color);
  border-top: 1px solid var(--header-border);
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

footer p {
  margin: 4px 0;
}

@media (max-width: 768px) {
  footer {
    padding: 20px 16px;
    font-size: 13px;
  }
}
</style>
