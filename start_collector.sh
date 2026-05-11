#!/bin/bash
set -e

echo "=== Electromagaz Collector Setup ==="
echo ""

# Check Docker
echo "1. Checking Docker..."
if ! /Applications/Docker.app/Contents/Resources/bin/docker ps > /dev/null 2>&1; then
    echo "❌ Docker не запущен!"
    echo "   Запустите Docker Desktop вручную и повторите попытку"
    exit 1
fi
echo "✅ Docker запущен"

# Start PostgreSQL
echo ""
echo "2. Запуск PostgreSQL..."
cd /Users/lux/Desktop/projects/electromagaz
/Applications/Docker.app/Contents/Resources/bin/docker-compose up -d postgres
echo "✅ PostgreSQL запущен"

# Wait for PostgreSQL
echo ""
echo "3. Ожидание готовности PostgreSQL (30 сек)..."
sleep 30
echo "✅ PostgreSQL готов"

# Initialize database from Excel
echo ""
echo "4. Инициализация БД из Excel файлов..."
EXCEL_DIR="/Users/lux/Downloads/–Њ∆ђ≤њЈ÷њвіж"
if [ -d "$EXCEL_DIR" ]; then
    echo "   Найдено файлов: $(ls "$EXCEL_DIR"/*.xlsx 2>/dev/null | wc -l)"
    python3 scripts/init_collector_db.py "$EXCEL_DIR"
    echo "✅ БД инициализирована"
else
    echo "⚠️  Excel файлы не найдены в $EXCEL_DIR"
    exit 1
fi

echo ""
echo "=== Готово к запуску! ==="
echo ""
echo "Запустите collector командой:"
echo "  python3 -m scripts.collector.main config.yaml"
echo ""
