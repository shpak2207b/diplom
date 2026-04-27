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
  background-color: rgba(240, 242, 245, 0.9);
  padding: 30px 20px;
  text-align: center;
  font-size: 14px;
  color: #666;
  transition: background-color 0.3s ease;
}

:global(body.dark-theme) footer {
  background: rgba(25, 25, 25, 0.8);
  color: #aaa;
}

footer p {
  margin: 4px 0;
}
</style>
