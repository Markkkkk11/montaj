#!/bin/bash
set -e

# ============================================================
# SVMontaj — Первичная настройка VPS (Ubuntu 24.04)
# Запуск: bash vps-setup.sh
# ============================================================

echo "🚀 Начинаем настройку VPS для SVMontaj..."

# --- 1. Обновление системы ---
echo "📦 Обновление пакетов..."
apt update && apt upgrade -y

# --- 2. Установка Node.js 20 LTS ---
echo "📦 Установка Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
echo "✅ Node.js $(node -v), npm $(npm -v)"

# --- 3. Установка PostgreSQL ---
echo "📦 Установка PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Создаём пользователя и БД
echo "🗄️ Настройка базы данных..."
sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname='svmontaj'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER svmontaj WITH PASSWORD 'SvM0ntaj2024_Pr0d!';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='svmontaj'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE svmontaj OWNER svmontaj;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE svmontaj TO svmontaj;"
echo "✅ PostgreSQL настроен (БД: svmontaj, пользователь: svmontaj)"

# --- 4. Установка Redis ---
echo "📦 Установка Redis..."
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server
echo "✅ Redis запущен"

# --- 5. Установка Nginx ---
echo "📦 Установка Nginx..."
apt install -y nginx
systemctl enable nginx
echo "✅ Nginx установлен"

# --- 6. Установка PM2 ---
echo "📦 Установка PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root
echo "✅ PM2 установлен"

# --- 7. Установка Git ---
echo "📦 Установка Git..."
apt install -y git
echo "✅ Git установлен"

# --- 8. Создание директорий ---
echo "📁 Создание директорий..."
mkdir -p /var/www/svmontaj
mkdir -p /var/www/svmontaj/uploads
chmod 755 /var/www/svmontaj/uploads

# --- 9. Настройка фаервола ---
echo "🔒 Настройка фаервола..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "✅ Фаервол настроен (SSH + Nginx)"

# --- 10. Настройка Nginx ---
echo "⚙️ Настройка Nginx..."
cat > /etc/nginx/sites-available/svmontaj << 'NGINX_CONF'
server {
    listen 80;
    server_name 89.23.96.129;

    # Максимальный размер загружаемых файлов
    client_max_body_size 20M;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Uploads (статические файлы)
    location /uploads/ {
        alias /var/www/svmontaj/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
NGINX_CONF

# Активируем конфиг
ln -sf /etc/nginx/sites-available/svmontaj /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "✅ Nginx настроен"

# --- 11. Клонирование репозитория ---
echo "📥 Клонирование проекта..."
cd /var/www/svmontaj
if [ -d ".git" ]; then
  echo "Репозиторий уже существует, обновляем..."
  git pull origin main
else
  git clone https://github.com/Markkkkk11/montaj.git .
fi

# --- 12. Настройка окружения бэкенда ---
echo "⚙️ Создание .env для бэкенда..."
cat > /var/www/svmontaj/backend/.env << 'ENV_BACKEND'
DATABASE_URL="postgresql://svmontaj:SvM0ntaj2024_Pr0d!@127.0.0.1:5432/svmontaj"
REDIS_URL="redis://127.0.0.1:6379"
JWT_SECRET="sosnovtsev_montaj_jun_writer"
NODE_ENV="production"
PORT=5000
CORS_ORIGINS="http://89.23.96.129"
UPLOAD_DIR="/var/www/svmontaj/uploads"
FRONTEND_URL="http://89.23.96.129"

# SMS
SMSC_LOGIN="demo"
SMSC_PASSWORD="demo"

# Email
SMTP_HOST="smtp.yandex.ru"
SMTP_PORT=465
SMTP_USER="SVMontaj24@yandex.ru"
SMTP_PASSWORD="axgenbrevxzjmowu"
EMAIL_FROM="SVMontaj24@yandex.ru"

# YooKassa
YOOKASSA_SHOP_ID="your-shop-id"
YOOKASSA_SECRET_KEY="your-secret-key"

# Яндекс.Карты
YANDEX_MAPS_API_KEY=58dcae52-7fa8-4802-a613-df0baddf9c66

# GreenSMS
GREENSMS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNzc3YWdlbnQiLCJpYXQiOjE3NzA5ODk2NTYsImlzcyI6ImFwaS5ncmVlbnNtcy5ydSJ9.Ed0FnEFV4GgXOs_3PgVgMOhl0iCnOtRdfYW13MGOTGw
GREENSMS_ENABLED=true
EMAIL_ENABLED=true
ENV_BACKEND

# --- 13. Настройка окружения фронтенда ---
echo "⚙️ Создание .env.local для фронтенда..."
cat > /var/www/svmontaj/frontend/.env.local << 'ENV_FRONTEND'
NEXT_PUBLIC_API_URL=http://89.23.96.129
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=58dcae52-7fa8-4802-a613-df0baddf9c66
ENV_FRONTEND

# --- 14. Установка зависимостей и сборка ---
echo "📦 Установка зависимостей бэкенда..."
cd /var/www/svmontaj/backend
npm install

echo "🔧 Генерация Prisma клиента..."
npx prisma generate

echo "🗄️ Применение миграций..."
npx prisma db push --accept-data-loss

echo "🏗️ Сборка бэкенда..."
npm run build

echo "📦 Установка зависимостей фронтенда..."
cd /var/www/svmontaj/frontend
npm install

echo "🏗️ Сборка фронтенда..."
npm run build

# --- 15. Запуск через PM2 ---
echo "🚀 Запуск приложений через PM2..."
cd /var/www/svmontaj

# Создаём конфигурацию PM2
cat > /var/www/svmontaj/ecosystem.config.js << 'PM2_CONFIG'
module.exports = {
  apps: [
    {
      name: 'svmontaj-backend',
      cwd: '/var/www/svmontaj/backend',
      script: 'dist/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: '/var/www/svmontaj/logs/backend-error.log',
      out_file: '/var/www/svmontaj/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'svmontaj-frontend',
      cwd: '/var/www/svmontaj/frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/www/svmontaj/logs/frontend-error.log',
      out_file: '/var/www/svmontaj/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
PM2_CONFIG

mkdir -p /var/www/svmontaj/logs

pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "=============================================="
echo "✅ SVMontaj успешно развёрнут!"
echo "=============================================="
echo ""
echo "🌐 Сайт: http://89.23.96.129"
echo "🔧 API:  http://89.23.96.129/api/"
echo "❤️ Health: http://89.23.96.129/health"
echo ""
echo "📋 Полезные команды:"
echo "  pm2 status          — статус приложений"
echo "  pm2 logs            — логи в реальном времени"
echo "  pm2 restart all     — перезапуск"
echo "  pm2 monit           — мониторинг"
echo ""

