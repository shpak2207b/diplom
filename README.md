# Юникс Плюс — веб-сайт

Vue 3 + Fastify + PostgreSQL + Redis, развёрнуто через Docker Compose.

---

## Содержание

1. [Требования](#1-требования)
2. [Запуск для разработки](#2-запуск-для-разработки)
3. [Деплой на сервер (Raspberry Pi / VPS)](#3-деплой-на-сервер-raspberry-pi--vps)
4. [SSL-сертификаты](#4-ssl-сертификаты)
5. [Первый запуск: миграция БД и создание админа](#5-первый-запуск-миграция-бд-и-создание-админа)
6. [Перенос данных из старой базы (SQLite → PostgreSQL)](#6-перенос-данных-из-старой-базы-sqlite--postgresql)
7. [Перенос сайта на другой сервер](#7-перенос-сайта-на-другой-сервер)
8. [API](#8-api)

---

## 1. Требования

| Инструмент | Версия |
|---|---|
| Docker | 24+ |
| Docker Compose | v2 (команда `docker compose`) |
| Git | любая |

На сервере больше ничего устанавливать не нужно — Node.js, PostgreSQL и Redis работают внутри контейнеров.

---

## 2. Запуск для разработки

```bash
# Клонировать репозиторий
git@github.com:shpak2207b/diplom.gitcd diplom-new

# Создать файл переменных окружения
cp .env.example .env
# Отредактировать .env — минимум поменять JWT_SECRET

# Поднять все сервисы (PostgreSQL, Redis, backend, frontend)
docker compose up --build

# В другом терминале — применить миграции БД
docker compose exec backend npx prisma migrate deploy

# Создать первого администратора
docker compose exec backend npx tsx scripts/seed-admin.ts
# По умолчанию: login=admin, password=changeme123
# Можно переопределить: ADMIN_USERNAME=ivan ADMIN_PASSWORD=secret npx tsx ...
```

**Адреса:**
- Сайт: http://localhost:5173
- API health: http://localhost:3001/api/health
- Админка: http://localhost:5173/admin

Изменения в `frontend/src` и `backend/src` применяются автоматически (hot reload).

---

## 3. Деплой на сервер (Raspberry Pi / VPS)

### 3.1. Подготовка сервера

```bash
# Установить Docker (если не установлен)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Выйти и зайти снова, чтобы группа применилась
```

### 3.2. Загрузить код

```bash
git@github.com:shpak2207b/diplom.git
cd diplom-new
```

### 3.3. Настроить переменные окружения

```bash
cp .env.example .env
nano .env
```

Обязательно поменять:

```dotenv
DB_PASSWORD=надёжный_пароль_БД
JWT_SECRET=случайная_строка_минимум_32_символа  # openssl rand -hex 32
SMTP_HOST=smtp.вашпочта.ru
SMTP_USER=noreply@unixplus.su
SMTP_PASS=пароль_почты
ADMIN_EMAIL=info@unixplus.su
NODE_ENV=production
```

### 3.4. Запустить

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Флаг `-d` запускает в фоне. Посмотреть логи:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### 3.5. Применить миграции и создать админа (один раз)

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec backend npx tsx scripts/seed-admin.ts
```

Сайт будет доступен на портах 80 (HTTP → редирект на HTTPS) и 443 (HTTPS).  
Без SSL-сертификата nginx не запустится — см. раздел 4.

---

## 4. SSL-сертификаты

### Вариант А — Certbot (Let's Encrypt, рекомендуется для VPS с доменом)

```bash
# Установить certbot
sudo apt install certbot

# Получить сертификат (сайт должен быть доступен по домену)
sudo certbot certonly --standalone -d unixplus.su -d www.unixplus.su

# Скопировать в папку проекта
mkdir -p nginx/certs
sudo cp /etc/letsencrypt/live/unixplus.su/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/unixplus.su/privkey.pem nginx/certs/
sudo chown $USER nginx/certs/*.pem
```

Обновление сертификата раз в 90 дней:

```bash
sudo certbot renew
sudo cp /etc/letsencrypt/live/unixplus.su/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/unixplus.su/privkey.pem nginx/certs/
docker compose -f docker-compose.prod.yml restart nginx
```

### Вариант Б — самоподписанный (для Raspberry Pi в локальной сети)

```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout nginx/certs/privkey.pem \
  -out nginx/certs/fullchain.pem \
  -subj "/CN=localhost"
```

Браузер покажет предупреждение — нужно добавить исключение вручную.

---

## 5. Первый запуск: миграция БД и создание админа

После первого `docker compose up` база данных пуста. Нужно выполнить два шага:

```bash
# Шаг 1 — применить схему (создаёт все таблицы)
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Шаг 2 — создать учётную запись администратора
docker compose -f docker-compose.prod.yml exec backend npx tsx scripts/seed-admin.ts
```

После этого войти в админку: `https://ваш-домен/admin`  
Логин: `admin`, пароль: `changeme123` — **сразу сменить через интерфейс**.

---

## 6. Перенос данных из старой базы (SQLite → PostgreSQL)

Если на предыдущем сервере компоненты хранились в файле `components.db` (SQLite), их можно перенести скриптом.

### 6.1. Скопировать файл базы на новый сервер

```bash
# С локальной машины / старого сервера
scp /путь/к/components.db user@новый-сервер:~/diplom-new/scripts/
```

### 6.2. Запустить миграцию

```bash
cd diplom-new

# dev-окружение
docker compose exec backend \
  sh -c "SQLITE_PATH=/app/scripts/components.db npx tsx scripts/migrate-sqlite-to-pg.ts"

# prod-окружение
docker compose -f docker-compose.prod.yml exec backend \
  sh -c "SQLITE_PATH=/app/scripts/components.db npx tsx scripts/migrate-sqlite-to-pg.ts"
```

Скрипт пакетно переносит все записи (по 1000 штук), выводит прогресс.  
Если в БД уже есть компоненты — скрипт остановится и предупредит.

### 6.3. Импорт через Excel / JSON (альтернатива)

Если данные есть в Excel или JSON — использовать встроенный импорт в админке:

1. Войти в **Админка → Импорт**
2. Скачать шаблон, заполнить данными
3. Загрузить файл, проверить предпросмотр, нажать «Импортировать»

Формат файла:

| partNumber | manufacturer | quantity | package | category | description |
|---|---|---|---|---|---|
| LM358N | Texas Instruments | 100 | DIP-8 | Усилители | Двойной ОУ |

---

## 7. Перенос сайта на другой сервер

### 7.1. Перенос кода

```bash
# На новом сервере
git clone https://github.com/your-org/diplom-new.git
cd diplom-new
cp .env.example .env
# Скопировать настройки из .env старого сервера
```

### 7.2. Перенос данных БД

```bash
# На СТАРОМ сервере — сделать дамп
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U $DB_USER unixplus > backup.sql

# Скопировать дамп на новый сервер
scp backup.sql user@новый-сервер:~/diplom-new/

# На НОВОМ сервере — поднять сервисы
docker compose -f docker-compose.prod.yml up --build -d

# Дождаться старта PostgreSQL, затем восстановить дамп
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U $DB_USER unixplus < backup.sql
```

### 7.3. Перенос SSL-сертификатов

```bash
scp nginx/certs/fullchain.pem user@новый-сервер:~/diplom-new/nginx/certs/
scp nginx/certs/privkey.pem   user@новый-сервер:~/diplom-new/nginx/certs/
```

После этого всё работает без дополнительных настроек.

---

## 8. API

| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/api/catalog?q=&page=1&limit=25` | Поиск компонентов |
| GET | `/api/catalog/:id` | Компонент по ID |
| POST | `/api/contact` | Форма обратной связи |
| POST | `/api/orders` | Оформить заявку |
| GET | `/api/efind?search=` | eFind.ru XML-фид |
| POST | `/api/admin/login` | Авторизация в админке |
| GET | `/api/admin/dashboard` | Сводная статистика |
| GET | `/api/admin/components` | Список компонентов |
| POST | `/api/admin/import/preview` | Предпросмотр импорта |
| POST | `/api/admin/import/confirm` | Подтвердить импорт |
| GET | `/api/admin/import/template?format=xlsx` | Скачать шаблон |
| GET | `/api/admin/messages` | Сообщения |
| PATCH | `/api/admin/messages/:id/archive` | В архив |
| DELETE | `/api/admin/messages/:id` | Удалить сообщение |
| GET | `/api/admin/orders` | Заявки |
| PATCH | `/api/admin/orders/:id/status` | Обновить статус заявки |
