#!/bin/bash

# Скрипт для восстановления из бэкапа

set -e

if [ -z "$1" ]; then
    echo "❌ Использование: ./restore.sh <путь_к_бэкапу>"
    echo "Пример: ./restore.sh /var/backups/montaj/montaj_backup_20260209_120000.sql.gz"
    echo ""
    echo "Доступные бэкапы:"
    ls -lh /var/backups/montaj/montaj_backup_*.sql.gz 2>/dev/null || echo "Бэкапы не найдены"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Файл не найден: $BACKUP_FILE"
    exit 1
fi

# Загрузка переменных окружения
source .env 2>/dev/null || true

DB_NAME=${POSTGRES_DB:-montaj}
DB_USER=${POSTGRES_USER:-postgres}

echo "⚠️  ВНИМАНИЕ: Это удалит текущую базу данных!"
echo "База: $DB_NAME"
echo "Бэкап: $BACKUP_FILE"
echo ""
read -p "Продолжить? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Отменено"
    exit 1
fi

echo "🔄 Начало восстановления..."

# Остановить backend
echo "⏸️  Остановка backend..."
docker-compose -f docker-compose.prod.yml stop backend

# Восстановление
echo "💾 Восстановление базы данных..."
gunzip -c $BACKUP_FILE | docker exec -i montaj-postgres-prod psql \
    -U $DB_USER \
    -d $DB_NAME

if [ $? -eq 0 ]; then
    echo "✅ База данных восстановлена успешно!"
else
    echo "❌ Ошибка восстановления!"
    exit 1
fi

# Запустить backend
echo "▶️  Запуск backend..."
docker-compose -f docker-compose.prod.yml up -d backend

echo "✅ Восстановление завершено!"

