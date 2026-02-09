# 🚀 Инструкция по запуску Этапа 7: Деплой

## ✅ Что добавлено

### Infrastructure
- ✅ Docker production конфигурация (multi-stage builds)
- ✅ Nginx reverse proxy с SSL
- ✅ CI/CD с GitHub Actions
- ✅ Система мониторинга
- ✅ Автоматические бэкапы БД
- ✅ SEO оптимизация
- ✅ Security hardening
- ✅ Полная документация

---

## 🏗️ Локальный production тест

### Шаг 1: Подготовка окружения

```bash
cd /home/mark/Documents/montaj

# Скопировать пример production .env
cp env.production.example .env

# Отредактировать .env (установить все необходимые переменные)
nano .env
```

**Минимальные требования для .env:**

```env
POSTGRES_PASSWORD=strong-password-here
REDIS_PASSWORD=redis-password-here
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://localhost
NEXT_PUBLIC_API_URL=http://localhost/api
```

### Шаг 2: Сборка production образов

```bash
# Сборка всех образов
docker compose -f docker-compose.prod.yml build

# Проверить созданные образы
docker images | grep montaj
```

### Шаг 3: Запуск в production режиме

```bash
# Запустить все сервисы
docker compose -f docker-compose.prod.yml up -d

# Проверить статус
docker compose -f docker-compose.prod.yml ps

# Посмотреть логи
docker compose -f docker-compose.prod.yml logs -f
```

### Шаг 4: Применить миграции

```bash
# Войти в backend контейнер
docker exec -it montaj-backend-prod sh

# Применить миграции
npx prisma migrate deploy
npx prisma generate

# Выйти
exit
```

### Шаг 5: Проверка работы

```bash
# Health check backend
curl http://localhost:5000/health

# Health check frontend
curl http://localhost:3000

# Мониторинг
./scripts/monitor.sh
```

---

## 🌐 Деплой на VPS

### Подготовка сервера

```bash
# SSH подключение к серверу
ssh root@YOUR_SERVER_IP

# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo apt install docker-compose-plugin

# Создание пользователя для деплоя
sudo adduser deploy
sudo usermod -aG sudo,docker deploy
su - deploy
```

### Клонирование и настройка

```bash
# Создать директорию
sudo mkdir -p /var/www
sudo chown deploy:deploy /var/www

# Клонировать проект
cd /var/www
git clone https://github.com/YOUR_USERNAME/montaj.git
cd montaj

# Настроить .env
cp env.production.example .env
nano .env
```

### Генерация паролей

```bash
# JWT Secret
openssl rand -base64 32

# DB Password
openssl rand -base64 24

# Redis Password
openssl rand -base64 24
```

### SSL сертификат

```bash
# Автоматическая настройка SSL
sudo ./scripts/ssl-setup.sh your-domain.com admin@your-domain.com
```

Или вручную:

```bash
# Установить certbot
sudo apt install -y certbot

# Получить сертификат
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com \
  --email admin@your-domain.com \
  --agree-tos

# Копировать в проект
sudo mkdir -p ./nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/
sudo chmod 644 ./nginx/ssl/*.pem
```

### DNS настройка

Добавьте A-записи:

```
A    @      YOUR_SERVER_IP
A    www    YOUR_SERVER_IP
```

### Обновить nginx конфигурацию

```bash
# Заменить домен в nginx.conf
sed -i 's/your-domain.com/yourdomain.com/g' ./nginx/nginx.conf
```

### Запуск

```bash
# Сборка
docker compose -f docker-compose.prod.yml build

# Запуск
docker compose -f docker-compose.prod.yml up -d

# Проверка
docker compose -f docker-compose.prod.yml ps
```

### Миграции и админ

```bash
# Миграции
docker exec -it montaj-backend-prod npx prisma migrate deploy

# Создать администратора
docker exec -it montaj-postgres-prod psql -U postgres -d montaj

# SQL для создания админа
INSERT INTO users (id, phone, password_hash, role, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '+79991234567',
  -- Сгенерировать хеш: node -e "console.log(require('bcrypt').hashSync('password', 10))"
  '$2b$10$...',
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
);

\q
```

---

## 🔧 CI/CD настройка

### GitHub Secrets

Добавьте в GitHub (Settings → Secrets → Actions):

1. **SSH_PRIVATE_KEY**: Ваш SSH приватный ключ
2. **SERVER_HOST**: IP или домен сервера
3. **SERVER_USER**: Имя пользователя (deploy)
4. **DOMAIN**: Ваш домен

### Генерация SSH ключа

```bash
# На локальной машине
ssh-keygen -t ed25519 -C "deploy@montaj"

# Копировать на сервер
ssh-copy-id deploy@YOUR_SERVER_IP

# Добавить приватный ключ в GitHub Secrets
cat ~/.ssh/id_ed25519
```

### Проверка

После push в main:

```bash
# GitHub Actions автоматически:
1. Запустит тесты
2. Задеплоит на сервер
3. Проверит health
4. Отправит уведомление
```

---

## 💾 Настройка бэкапов

### Автоматические бэкапы

```bash
# Создать директорию
sudo mkdir -p /var/backups/montaj
sudo chown deploy:deploy /var/backups/montaj

# Добавить в crontab
crontab -e

# Добавить строку (каждый день в 3:00)
0 3 * * * cd /var/www/montaj && ./scripts/backup.sh
```

### Ручной бэкап

```bash
cd /var/www/montaj
./scripts/backup.sh
```

### Восстановление

```bash
# Список бэкапов
ls -lh /var/backups/montaj/

# Восстановить
./scripts/restore.sh /var/backups/montaj/montaj_backup_YYYYMMDD_HHMMSS.sql.gz
```

---

## 📊 Мониторинг

### Системный мониторинг

```bash
# Запустить скрипт мониторинга
./scripts/monitor.sh
```

### Логи

```bash
# Все логи
docker compose -f docker-compose.prod.yml logs -f

# Конкретный сервис
docker compose -f docker-compose.prod.yml logs -f backend

# Ошибки
docker compose -f docker-compose.prod.yml logs | grep -i error

# Последние 100 строк
docker compose -f docker-compose.prod.yml logs --tail=100
```

### Метрики

```bash
# Real-time статистика контейнеров
docker stats

# Использование диска
docker system df

# Статус
docker compose -f docker-compose.prod.yml ps
```

---

## 🧪 Проверка production функционала

### Тест 1: Доступность сервисов

```bash
# Backend health
curl https://your-domain.com/api/health

# Frontend
curl https://your-domain.com

# SSL
curl -I https://your-domain.com | grep -i "HTTP\|SSL"
```

### Тест 2: API endpoints

```bash
# Регистрация
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"+79991234567","password":"test123","role":"CUSTOMER"}'

# Health
curl https://your-domain.com/api/health
```

### Тест 3: Performance

```bash
# Response time
time curl https://your-domain.com/api/health

# Load test (optional, требует установки ab)
ab -n 1000 -c 10 https://your-domain.com/
```

### Тест 4: Security headers

```bash
curl -I https://your-domain.com | grep -i "strict\|x-frame\|x-content"
```

### Тест 5: Caching

```bash
# Static files должны иметь Cache-Control
curl -I https://your-domain.com/_next/static/... | grep -i cache
```

---

## 🔧 Обслуживание

### Обновление приложения

```bash
cd /var/www/montaj

# Остановить
docker compose -f docker-compose.prod.yml down

# Обновить код
git pull origin main

# Пересобрать
docker compose -f docker-compose.prod.yml build --no-cache

# Миграции
docker exec montaj-backend-prod npx prisma migrate deploy

# Запустить
docker compose -f docker-compose.prod.yml up -d

# Проверить
docker compose -f docker-compose.prod.yml logs -f
```

### Очистка Docker

```bash
# Удалить старые образы
docker image prune -a -f

# Удалить volumes (ОСТОРОЖНО!)
docker volume prune -f

# Полная очистка
docker system prune -af --volumes
```

### Продление SSL

```bash
# Автоматическое (через cron)
sudo certbot renew --quiet

# Вручную
sudo certbot renew

# Перезапустить nginx
docker compose -f docker-compose.prod.yml restart nginx
```

---

## 🐛 Troubleshooting

### Контейнер не запускается

```bash
# Логи
docker compose -f docker-compose.prod.yml logs backend

# Пересоздать
docker compose -f docker-compose.prod.yml up -d --force-recreate backend
```

### 502 Bad Gateway

```bash
# Проверить backend
docker ps | grep backend

# Логи backend
docker logs montaj-backend-prod

# Перезапустить
docker compose -f docker-compose.prod.yml restart backend nginx
```

### База данных недоступна

```bash
# Проверить PostgreSQL
docker exec montaj-postgres-prod pg_isready

# Войти в БД
docker exec -it montaj-postgres-prod psql -U postgres -d montaj
```

### Ошибки миграций

```bash
# Применить миграции
docker exec montaj-backend-prod npx prisma migrate deploy

# Пересоздать клиент
docker exec montaj-backend-prod npx prisma generate
```

---

## 📋 Быстрые команды

```bash
# Запуск
docker compose -f docker-compose.prod.yml up -d

# Остановка
docker compose -f docker-compose.prod.yml down

# Перезапуск
docker compose -f docker-compose.prod.yml restart

# Логи
docker compose -f docker-compose.prod.yml logs -f

# Статус
docker compose -f docker-compose.prod.yml ps

# Мониторинг
./scripts/monitor.sh

# Бэкап
./scripts/backup.sh

# Восстановление
./scripts/restore.sh /path/to/backup.sql.gz
```

---

## 📚 Дополнительная документация

- **DEPLOYMENT.md** - Полное руководство по деплою
- **SECURITY.md** - Политика безопасности
- **STAGE7_COMPLETE.md** - Технический отчёт

---

## ✅ Чеклист готовности к production

- [ ] VPS сервер настроен
- [ ] Docker установлен
- [ ] Код клонирован
- [ ] .env настроен (все переменные)
- [ ] Пароли сгенерированы (сильные!)
- [ ] SSL сертификаты получены
- [ ] DNS записи добавлены
- [ ] Nginx конфигурация обновлена
- [ ] Контейнеры запущены
- [ ] Миграции применены
- [ ] Администратор создан
- [ ] Health checks проходят ✅
- [ ] CI/CD настроен (GitHub Secrets)
- [ ] Бэкапы настроены (cron)
- [ ] Firewall настроен (UFW)
- [ ] Мониторинг работает
- [ ] Логи пишутся
- [ ] SSL работает (https://)
- [ ] Performance тесты пройдены

---

## 🎉 Готово!

**Ваша платформа Montaj запущена в production!**

**URL:** https://your-domain.com  
**Admin Panel:** https://your-domain.com/admin  
**API:** https://your-domain.com/api

**Следующие шаги:**
1. Создайте тестовые аккаунты
2. Проверьте все функции
3. Настройте мониторинг (опционально Sentry/Grafana)
4. Начните маркетинг! 🚀

---

**Поздравляем с запуском! 🎊**

