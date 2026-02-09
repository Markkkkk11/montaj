#!/bin/bash

# Скрипт для автоматического бэкапа PostgreSQL

set -e

# Конфигурация
BACKUP_DIR="/var/backups/montaj"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="montaj_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

# Загрузка переменных окружения
source .env 2>/dev/null || true

DB_NAME=${POSTGRES_DB:-montaj}
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD}

echo "🔄 Начало бэкапа базы данных: $DB_NAME"
echo "📅 Дата: $(date)"

# Создать директорию для бэкапов
mkdir -p $BACKUP_DIR

# Создать бэкап
echo "💾 Создание бэкапа..."
docker exec montaj-postgres-prod pg_dump \
    -U $DB_USER \
    -d $DB_NAME \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists | gzip > $BACKUP_DIR/$BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Бэкап создан: $BACKUP_DIR/$BACKUP_FILE"
    
    # Размер файла
    SIZE=$(du -h $BACKUP_DIR/$BACKUP_FILE | cut -f1)
    echo "📦 Размер: $SIZE"
else
    echo "❌ Ошибка создания бэкапа!"
    exit 1
fi

# Удалить старые бэкапы
echo "🧹 Удаление бэкапов старше $RETENTION_DAYS дней..."
find $BACKUP_DIR -name "montaj_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Список бэкапов
echo "📋 Доступные бэкапы:"
ls -lh $BACKUP_DIR/montaj_backup_*.sql.gz 2>/dev/null | tail -n 5

echo "✅ Бэкап завершён успешно!"

