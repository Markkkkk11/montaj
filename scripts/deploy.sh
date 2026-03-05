#!/bin/bash
set -e

# ============================================================
# SVMontaj — Скрипт деплоя (вызывается при каждом обновлении)
# Запуск: bash /var/www/svmontaj/scripts/deploy.sh
# ============================================================

APP_DIR="/var/www/svmontaj"
UPLOAD_DIR="/var/www/svmontaj/uploads"

echo "🔄 Начинаем деплой SVMontaj..."
echo "⏰ $(date)"

cd "$APP_DIR"

# 1. Обновляем код
echo "📥 Получение обновлений из Git..."
git fetch origin main
git reset --hard origin/main

# 2. Сохраняем uploads (они не в git)
echo "📁 Проверяем папку uploads..."
mkdir -p "$UPLOAD_DIR"

# 3. Бэкенд
echo "📦 Обновление бэкенда..."
cd "$APP_DIR/backend"
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run build

# 4. Фронтенд
echo "📦 Обновление фронтенда..."
cd "$APP_DIR/frontend"
npm install
# Next.js иногда падает на rename внутри .next при инкрементальном артефакте,
# поэтому перед сборкой очищаем build-кэш полностью.
rm -rf .next
npm run build

# 5. Перезапуск приложений
echo "🚀 Перезапуск PM2..."
cd "$APP_DIR"
mkdir -p "$APP_DIR/logs"
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "✅ Деплой завершён успешно!"
echo "⏰ $(date)"
echo ""

