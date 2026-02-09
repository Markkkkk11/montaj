# ⚡ Быстрый старт Montaj Platform

> 5-минутное руководство для запуска проекта

---

## 🖥️ Development (локально)

### 1. Установка

```bash
# Клонировать
git clone https://github.com/your-username/montaj.git
cd montaj

# Установить зависимости
npm install

# Настроить .env
cp .env.example .env
nano .env  # Заполните DATABASE_URL, REDIS_URL, JWT_SECRET
```

### 2. Запуск БД

```bash
# Запустить PostgreSQL и Redis
docker-compose up -d

# Применить миграции
cd backend
npx prisma migrate dev
npx prisma generate
cd ..
```

### 3. Запуск приложения

```bash
# Запустить backend и frontend
npm run dev
```

**Готово!** 
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 🌐 Production (VPS)

### 1. Подготовка сервера

```bash
# SSH на сервер
ssh root@YOUR_SERVER_IP

# Установить Docker
curl -fsSL https://get.docker.com | sh

# Клонировать проект
cd /var/www
git clone https://github.com/your-username/montaj.git
cd montaj
```

### 2. Настройка

```bash
# Настроить .env
cp env.production.example .env
nano .env  # Заполните все переменные!

# Получить SSL
sudo ./scripts/ssl-setup.sh your-domain.com admin@your-domain.com

# Обновить nginx.conf
sed -i 's/your-domain.com/yourdomain.com/g' ./nginx/nginx.conf
```

### 3. Запуск

```bash
# Сборка и запуск
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Миграции
docker exec -it montaj-backend-prod npx prisma migrate deploy

# Создать админа
docker exec -it montaj-postgres-prod psql -U postgres -d montaj
# Выполнить SQL из STAGE5_INSTRUCTIONS.md
```

**Готово!** https://your-domain.com

---

## 📋 Важные команды

```bash
# Логи
docker compose -f docker-compose.prod.yml logs -f

# Статус
docker compose -f docker-compose.prod.yml ps

# Мониторинг
./scripts/monitor.sh

# Бэкап
./scripts/backup.sh

# Перезапуск
docker compose -f docker-compose.prod.yml restart
```

---

## 🔑 Минимальные .env переменные

```env
# БД
POSTGRES_PASSWORD=strong-password
DATABASE_URL=postgresql://postgres:PASS@postgres:5432/montaj

# Redis  
REDIS_PASSWORD=redis-pass
REDIS_URL=redis://:PASS@redis:6379

# JWT
JWT_SECRET=$(openssl rand -base64 32)

# URLs
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

---

## 🆘 Помощь

- 📚 Полная документация: `README.md`
- 🚀 Деплой: `DEPLOYMENT.md`
- 🔐 Безопасность: `SECURITY.md`
- 📝 Этапы: `STAGE1-7_INSTRUCTIONS.md`

---

**Успешного запуска! 🚀**

