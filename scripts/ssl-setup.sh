#!/bin/bash

# Скрипт для настройки SSL сертификатов с Let's Encrypt

set -e

DOMAIN=${1:-"your-domain.com"}
EMAIL=${2:-"admin@your-domain.com"}

echo "🔐 Настройка SSL для домена: $DOMAIN"
echo "📧 Email: $EMAIL"

# Проверка наличия certbot
if ! command -v certbot &> /dev/null; then
    echo "📦 Установка certbot..."
    sudo apt update
    sudo apt install -y certbot
fi

# Остановить nginx если запущен
echo "⏸️  Остановка nginx..."
sudo docker-compose -f docker-compose.prod.yml stop nginx || true

# Получить сертификат
echo "🔒 Получение SSL сертификата..."
sudo certbot certonly \
    --standalone \
    --agree-tos \
    --no-eff-email \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Копировать сертификаты в nginx директорию
echo "📋 Копирование сертификатов..."
sudo mkdir -p ./nginx/ssl
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./nginx/ssl/
sudo chmod 644 ./nginx/ssl/*.pem

# Обновить конфигурацию nginx
echo "⚙️  Обновление конфигурации nginx..."
sed -i "s/your-domain.com/$DOMAIN/g" ./nginx/nginx.conf

# Запустить nginx
echo "▶️  Запуск nginx..."
sudo docker-compose -f docker-compose.prod.yml up -d nginx

# Настроить автообновление
echo "🔄 Настройка автообновления сертификатов..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker-compose -f $(pwd)/docker-compose.prod.yml restart nginx") | crontab -

echo "✅ SSL настроен успешно!"
echo "🌐 Ваш сайт доступен по адресу: https://$DOMAIN"

