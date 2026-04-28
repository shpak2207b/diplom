<template>
  <section id="about" class="section">
    <h2>О компании</h2>
    <p class="about-lead">
      ООО «Юникс Плюс» — поставщик электронных компонентов и электротехнического оборудования
      для производственных предприятий, системных интеграторов и R&amp;D-подразделений.
    </p>
    <div class="about-grid">
      <div class="about-item">
        <div class="about-icon-box"></div>
        <div>
          <strong>Промышленные поставки</strong>
          <p>Работаем с заводами, КБ и интеграторами — поставки под конкретные спецификации и серийные нужды производства.</p>
        </div>
      </div>
      <div class="about-item">
        <div class="about-icon-box"></div>
        <div>
          <strong>Подтверждённое качество</strong>
          <p>Компоненты только от авторизованных дистрибьюторов и проверенных поставщиков с полным документальным сопровождением.</p>
        </div>
      </div>
      <div class="about-item">
        <div class="about-icon-box"></div>
        <div>
          <strong>Поиск аналогов и дефицита</strong>
          <p>Помогаем закрывать дефицитные позиции, подбираем аналоги и альтернативные решения под требования схемы.</p>
        </div>
      </div>
      <div class="about-item">
        <div class="about-icon-box"></div>
        <div>
          <strong>Логистика под контролем</strong>
          <p>Прозрачные сроки, сопроводительная документация, соблюдение графика — держим производство в расписании.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about-lead {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 32px;
  font-size: 15px;
  opacity: 0.85;
  line-height: 1.6;
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.about-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.about-icon-box {
  width: 10px;
  min-width: 10px;
  height: 10px;
  margin-top: 6px;
  background: var(--unix-blue);
  border-radius: 2px;
}

.about-item strong {
  display: block;
  font-size: 15px;
  margin-bottom: 4px;
}

.about-item p {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
  line-height: 1.55;
}

@media (max-width: 640px) {
  .about-grid { grid-template-columns: 1fr; }
}
</style>
