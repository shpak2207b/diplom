# Юникс Плюс — Веб-сайт

Vue 3 + Fastify + PostgreSQL + Docker Compose

## Быстрый старт (dev)

```bash
# 1. Создать .env из шаблона
cp .env.example .env
# Отредактировать .env (JWT_SECRET и SMTP*)

# 2. Поднять все сервисы
docker compose up --build

# 3. Запустить миграцию БД (в другом терминале)
docker compose exec backend npx prisma migrate dev --name init

# 4. Создать первого админа
docker compose exec backend npx tsx src/../scripts/seed-admin.ts
# или напрямую:
# DATABASE_URL=... ADMIN_USERNAME=admin ADMIN_PASSWORD=... npx tsx scripts/seed-admin.ts

# 5. Мигрировать данные из SQLite (318к компонентов)
# Скопировать components.db в scripts/
# SQLITE_PATH=./components.db DATABASE_URL=... npx tsx scripts/migrate-sqlite-to-pg.ts
```

**Фронтенд:** http://localhost:5173  
**Бэкенд API:** http://localhost:3000/api/health  
**Админка:** http://localhost:5173/admin (логин: admin / changeme123)

## Производственный деплой (Pi / VPS)

```bash
# 1. Разместить SSL-сертификаты:
mkdir -p nginx/certs
cp /path/to/fullchain.pem nginx/certs/
cp /path/to/privkey.pem nginx/certs/

# 2. Создать production .env с реальными значениями

# 3. Запустить
docker compose -f docker-compose.prod.yml up --build -d

# 4. Первичная миграция БД
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 5. Создать админа
docker compose -f docker-compose.prod.yml exec backend \
  node -e "require('./scripts/seed-admin')"
```

## Импорт компонентов из CSV

Формат CSV (первая строка — заголовки):
```
part_number,manufacturer,quantity
STM32F417IGT7,STMicroelectronics,9
...
```

Загрузить через **Админка → Импорт**.

## API Reference

| Endpoint | Описание |
|----------|----------|
| `GET /api/catalog?q=&page=1&limit=25` | Поиск компонентов |
| `POST /api/contact` | Форма обратной связи |
| `POST /api/otp/request` | Запрос OTP-кода |
| `POST /api/otp/verify` | Подтверждение кода |
| `POST /api/orders` | Отправка заявки |
| `GET /api/efind?search=` | eFind.ru XML-фид |
| `POST /api/admin/login` | Авторизация |
| `GET /api/admin/dashboard` | Статистика |
