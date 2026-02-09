#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Запуск проверки работоспособности системы..."
echo ""

# Проверка Docker контейнеров
echo "📦 Проверка Docker контейнеров..."
if docker ps | grep -q montaj-postgres; then
    echo -e "${GREEN}✓${NC} PostgreSQL запущен"
else
    echo -e "${RED}✗${NC} PostgreSQL не запущен"
    echo "  → Запустите: docker-compose up -d postgres"
fi

if docker ps | grep -q montaj-redis; then
    echo -e "${GREEN}✓${NC} Redis запущен"
else
    echo -e "${RED}✗${NC} Redis не запущен"
    echo "  → Запустите: docker-compose up -d redis"
fi

echo ""
echo "🔍 Проверка портов..."

# Проверка портов
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Порт 5432 (PostgreSQL) открыт"
else
    echo -e "${YELLOW}⚠${NC} Порт 5432 недоступен"
fi

if lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Порт 6379 (Redis) открыт"
else
    echo -e "${YELLOW}⚠${NC} Порт 6379 недоступен"
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Порт 3001 (Backend API) открыт"
else
    echo -e "${YELLOW}⚠${NC} Порт 3001 недоступен - API не запущен"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Порт 3000 (Frontend) открыт"
else
    echo -e "${YELLOW}⚠${NC} Порт 3000 недоступен - Frontend не запущен"
fi

echo ""
echo "🏥 Запуск health check..."
cd backend && npm run test:health

echo ""
echo "✅ Проверка завершена!"

