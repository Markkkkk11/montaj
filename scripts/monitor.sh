#!/bin/bash

# Скрипт мониторинга состояния системы

echo "🔍 Мониторинг системы Montaj"
echo "================================"
echo ""

# Статус контейнеров
echo "📦 Статус Docker контейнеров:"
docker-compose -f docker-compose.prod.yml ps
echo ""

# Использование ресурсов
echo "💻 Использование ресурсов:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

# Логи ошибок (последние 10)
echo "📝 Последние ошибки:"
docker-compose -f docker-compose.prod.yml logs --tail=10 | grep -i error || echo "Ошибок не найдено"
echo ""

# Health checks
echo "🏥 Health статусы:"
echo -n "Backend: "
curl -sf http://localhost:5000/health > /dev/null && echo "✅ OK" || echo "❌ FAIL"
echo -n "Frontend: "
curl -sf http://localhost:3000 > /dev/null && echo "✅ OK" || echo "❌ FAIL"
echo ""

# Размер БД
echo "💾 Размер базы данных:"
docker exec montaj-postgres-prod psql -U postgres -d montaj -c "\
SELECT pg_size_pretty(pg_database_size('montaj')) AS size;"
echo ""

# Место на диске
echo "💿 Свободное место на диске:"
df -h / | tail -1
echo ""

# Бэкапы
echo "📋 Последние бэкапы:"
ls -lht /var/backups/montaj/montaj_backup_*.sql.gz 2>/dev/null | head -5 || echo "Бэкапы не найдены"
echo ""

echo "================================"
echo "✅ Мониторинг завершён"

