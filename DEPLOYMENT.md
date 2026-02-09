# 🚀 Руководство по деплою Montaj Platform

## 📋 Содержание

1. [Требования](#требования)
2. [Подготовка сервера](#подготовка-сервера)
3. [Установка](#установка)
4. [Конфигурация](#конфигурация)
5. [Запуск](#запуск)
6. [CI/CD](#cicd)
7. [Мониторинг](#мониторинг)
8. [Бэкапы](#бэкапы)
9. [Обслуживание](#обслуживание)
10. [Решение проблем](#решение-проблем)

---

## Требования

### Минимальные требования сервера

- **OS:** Ubuntu 20.04 LTS или выше
- **CPU:** 2 vCPU
- **RAM:** 4 GB
- **Storage:** 50 GB SSD
- **Network:** 100 Mbps

### Рекомендуемые требования

- **OS:** Ubuntu 22.04 LTS
- **CPU:** 4 vCPU
- **RAM:** 8 GB
- **Storage:** 100 GB SSD
- **Network:** 1 Gbps

### Необходимое ПО

- Docker 24.0+
- Docker Compose 2.20+
- Git 2.34+
- Node.js 20+ (для локальной разработки)
- PostgreSQL 15+ (или через Docker)
- Nginx (или через Docker)

---

## Подготовка сервера

### 1. Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Установка Docker

```bash
# Удалить старые версии
sudo apt remove docker docker-engine docker.io containerd runc

# Установить зависимости
sudo apt install -y ca-certificates curl gnupg lsb-release

# Добавить GPG ключ Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Добавить репозиторий
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установить Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker

# Проверить установку
docker --version
docker compose version
```

### 3. Настройка Firewall

```bash
# Установить UFW
sudo apt install -y ufw

# Базовые правила
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Разрешить SSH, HTTP, HTTPS
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Включить firewall
sudo ufw enable

# Проверить статус
sudo ufw status
```

### 4. Создание пользователя для деплоя

```bash
# Создать пользователя
sudo adduser deploy

# Добавить в sudo и docker группы
sudo usermod -aG sudo,docker deploy

# Переключиться на пользователя
su - deploy
```

---

## Установка

### 1. Клонирование репозитория

```bash
# Создать директорию
sudo mkdir -p /var/www
sudo chown deploy:deploy /var/www

# Клонировать проект
cd /var/www
git clone https://github.com/your-username/montaj.git
cd montaj
```

### 2. Настройка переменных окружения

```bash
# Скопировать пример
cp env.production.example .env

# Редактировать .env
nano .env
```

**Важные переменные для изменения:**

```env
# Базы данных
POSTGRES_PASSWORD=<generate-strong-password>
REDIS_PASSWORD=<generate-strong-password>

# JWT
JWT_SECRET=<openssl rand -base64 32>

# SMSC.ru
SMSC_LOGIN=<your-smsc-login>
SMSC_PASSWORD=<your-smsc-password>

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=<your-email@gmail.com>
SMTP_PASSWORD=<your-app-password>

# YooKassa
YOOKASSA_SHOP_ID=<your-shop-id>
YOOKASSA_SECRET_KEY=<your-secret-key>

# URLs
FRONTEND_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

### 3. Генерация паролей

```bash
# JWT Secret
openssl rand -base64 32

# Session Secret
openssl rand -base64 32

# Пароль БД
openssl rand -base64 24
```

---

## Конфигурация

### 1. Настройка SSL

```bash
# Запустить скрипт настройки SSL
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

# Копировать сертификаты
sudo mkdir -p ./nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/
sudo chmod 644 ./nginx/ssl/*.pem
```

### 2. Обновить nginx.conf

```bash
# Заменить your-domain.com на ваш домен
sed -i 's/your-domain.com/yourdomain.com/g' ./nginx/nginx.conf
```

### 3. Настройка DNS

Добавьте A-записи для вашего домена:

```
A    @      <YOUR_SERVER_IP>
A    www    <YOUR_SERVER_IP>
```

---

## Запуск

### 1. Сборка и запуск контейнеров

```bash
# Сборка образов
docker compose -f docker-compose.prod.yml build

# Запуск в фоновом режиме
docker compose -f docker-compose.prod.yml up -d

# Проверить логи
docker compose -f docker-compose.prod.yml logs -f
```

### 2. Применение миграций

```bash
# Войти в backend контейнер
docker exec -it montaj-backend-prod sh

# Применить миграции
npx prisma migrate deploy

# Выйти
exit
```

### 3. Создание первого администратора

```bash
# Войти в PostgreSQL
docker exec -it montaj-postgres-prod psql -U postgres -d montaj

# Создать администратора (замените данные)
INSERT INTO users (id, phone, password_hash, role, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '+79991234567',
  '$2b$10$YourHashedPasswordHere',
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
);

# Выйти
\q
```

**Для генерации пароля:**

```bash
node -e "console.log(require('bcrypt').hashSync('your-password', 10))"
```

### 4. Проверка работоспособности

```bash
# Health check backend
curl http://localhost:5000/health

# Health check frontend
curl http://localhost:3000

# Проверить все контейнеры
docker compose -f docker-compose.prod.yml ps
```

---

## CI/CD

### 1. Настройка GitHub Actions

Добавьте secrets в GitHub:

**Settings → Secrets → Actions → New repository secret**

- `SSH_PRIVATE_KEY`: SSH ключ для доступа к серверу
- `SERVER_HOST`: IP адрес или домен сервера
- `SERVER_USER`: Имя пользователя (deploy)
- `DOMAIN`: Ваш домен

### 2. Генерация SSH ключа

```bash
# На локальной машине
ssh-keygen -t ed25519 -C "deploy@montaj"

# Скопировать на сервер
ssh-copy-id deploy@your-server-ip

# Добавить приватный ключ в GitHub Secrets
cat ~/.ssh/id_ed25519
```

### 3. Тестирование деплоя

После push в main ветку:

1. Автоматически запускаются тесты
2. При успехе - деплой на сервер
3. Health check
4. Уведомление о результате

---

## Мониторинг

### 1. Системный мониторинг

```bash
# Запустить скрипт мониторинга
./scripts/monitor.sh
```

### 2. Логи

```bash
# Все логи
docker compose -f docker-compose.prod.yml logs -f

# Конкретный сервис
docker compose -f docker-compose.prod.yml logs -f backend

# Последние 100 строк
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

### 3. Метрики контейнеров

```bash
# Real-time статистика
docker stats

# Использование диска
docker system df
```

### 4. Настройка Sentry (опционально)

```bash
# Установить Sentry SDK
cd backend
npm install @sentry/node

# Добавить в .env
SENTRY_DSN=your-sentry-dsn
```

---

## Бэкапы

### 1. Настройка автоматических бэкапов

```bash
# Создать директорию
sudo mkdir -p /var/backups/montaj
sudo chown deploy:deploy /var/backups/montaj

# Добавить в crontab
crontab -e

# Добавить строку (бэкап каждый день в 3:00)
0 3 * * * cd /var/www/montaj && ./scripts/backup.sh
```

### 2. Ручной бэкап

```bash
cd /var/www/montaj
./scripts/backup.sh
```

### 3. Восстановление из бэкапа

```bash
# Список бэкапов
ls -lh /var/backups/montaj/

# Восстановить
./scripts/restore.sh /var/backups/montaj/montaj_backup_20260209_120000.sql.gz
```

### 4. Удалённые бэкапы

Рекомендуется копировать бэкапы на удалённое хранилище:

```bash
# AWS S3
aws s3 sync /var/backups/montaj/ s3://your-bucket/montaj-backups/

# rsync на другой сервер
rsync -avz /var/backups/montaj/ user@backup-server:/backups/montaj/
```

---

## Обслуживание

### Обновление приложения

```bash
cd /var/www/montaj

# Остановить контейнеры
docker compose -f docker-compose.prod.yml down

# Получить последние изменения
git pull origin main

# Пересобрать образы
docker compose -f docker-compose.prod.yml build --no-cache

# Применить миграции
docker exec montaj-backend-prod npx prisma migrate deploy

# Запустить
docker compose -f docker-compose.prod.yml up -d

# Проверить логи
docker compose -f docker-compose.prod.yml logs -f
```

### Обновление зависимостей

```bash
# Backend
cd backend
npm update
npm audit fix

# Frontend
cd frontend
npm update
npm audit fix

# Пересобрать образы
docker compose -f docker-compose.prod.yml build
```

### Очистка Docker

```bash
# Удалить неиспользуемые образы
docker image prune -a

# Удалить неиспользуемые volumes
docker volume prune

# Полная очистка
docker system prune -af --volumes
```

### Продление SSL сертификата

```bash
# Автоматическое продление (через cron)
sudo certbot renew --quiet

# Перезапустить nginx
docker compose -f docker-compose.prod.yml restart nginx
```

---

## Решение проблем

### Контейнер не запускается

```bash
# Проверить логи
docker compose -f docker-compose.prod.yml logs backend

# Проверить конфигурацию
docker compose -f docker-compose.prod.yml config

# Пересоздать контейнер
docker compose -f docker-compose.prod.yml up -d --force-recreate backend
```

### База данных недоступна

```bash
# Проверить статус PostgreSQL
docker exec montaj-postgres-prod pg_isready

# Войти в PostgreSQL
docker exec -it montaj-postgres-prod psql -U postgres

# Проверить подключение из backend
docker exec -it montaj-backend-prod sh
npx prisma db push
```

### Nginx 502 Bad Gateway

```bash
# Проверить что backend запущен
docker ps | grep backend

# Проверить логи backend
docker compose -f docker-compose.prod.yml logs backend

# Проверить nginx конфигурацию
docker exec montaj-nginx-prod nginx -t

# Перезапустить nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### Ошибки миграций Prisma

```bash
# Сбросить БД (ВНИМАНИЕ: удалит все данные!)
docker exec montaj-backend-prod npx prisma migrate reset

# Применить миграции заново
docker exec montaj-backend-prod npx prisma migrate deploy

# Пересоздать клиент Prisma
docker exec montaj-backend-prod npx prisma generate
```

### Высокая нагрузка на сервер

```bash
# Проверить использование ресурсов
docker stats

# Проверить логи на ошибки
docker compose -f docker-compose.prod.yml logs | grep -i error

# Увеличить ресурсы контейнера (в docker-compose.prod.yml)
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### SSL сертификат не работает

```bash
# Проверить сертификат
openssl s_client -connect your-domain.com:443

# Проверить файлы
ls -l ./nginx/ssl/

# Перезапустить nginx
docker compose -f docker-compose.prod.yml restart nginx
```

---

## Команды быстрого доступа

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

## Контакты и поддержка

- **Email:** support@your-domain.com
- **GitHub:** https://github.com/your-username/montaj
- **Документация:** https://docs.your-domain.com

---

## Чеклист деплоя

- [ ] Сервер настроен (Docker, UFW)
- [ ] Репозиторий клонирован
- [ ] .env настроен
- [ ] SSL сертификаты получены
- [ ] DNS записи добавлены
- [ ] Контейнеры запущены
- [ ] Миграции применены
- [ ] Администратор создан
- [ ] Health checks проходят
- [ ] CI/CD настроен
- [ ] Бэкапы настроены
- [ ] Мониторинг работает
- [ ] Документация обновлена

**Готово! Ваша платформа запущена! 🎉**

