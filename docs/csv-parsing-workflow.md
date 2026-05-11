# CSV Parsing Workflow

Парсинг в CSV намного быстрее чем прямой импорт в БД. Можно парсить миллионы товаров, а потом массово загрузить.

## Преимущества

- **Быстрее**: Нет overhead БД транзакций
- **Безопаснее**: Можно проверить данные перед загрузкой
- **Возобновляемо**: Если парсер упал, данные сохранены
- **Гибче**: Можно редактировать CSV перед импортом

## Workflow

### 1. Парсинг в CSV

```bash
# Парсить все категории
pnpm tsx scripts/parse-to-csv.ts

# Парсить конкретные категории
pnpm tsx scripts/parse-to-csv.ts mikrokontrollery-1738 dc-dc-preobrazovateli-2010

# Результат: data/parsed/*.csv
```

**Скорость:** ~30 товаров/мин (с текущим rate limit 0.5 req/sec)

**Для 2 млн товаров:** ~46 дней непрерывной работы

### 2. Импорт из CSV в БД

```bash
# Импортировать один файл
pnpm tsx scripts/import-from-csv.ts data/parsed/mikrokontrollery-1738.csv

# Импортировать все файлы
for file in data/parsed/*.csv; do
  pnpm tsx scripts/import-from-csv.ts "$file"
done
```

**Скорость:** ~1000-5000 товаров/мин

**Для 2 млн товаров:** 7-30 минут импорта

---

## Структура CSV

```csv
slug,name,partNumber,sku,manufacturer,manufacturerSlug,categorySlug,categoryName,description,weight,specifications,datasheets,images
stm32f103c8t6,"STM32F103C8T6, Микроконтроллер","STM32F103C8T6","STM32F103C8T6","STMicroelectronics","stmicroelectronics","mikrokontrollery-1738","Микроконтроллеры","32-bit ARM Cortex-M3",2.5,"[{""name"":""RAM"",""value"":""20KB""},{""name"":""Flash"",""value"":""64KB""}]","[{""title"":""Datasheet"",""url"":""https://...""}]","[]"
```

---

## Ускорение парсинга

### Вариант 1: Увеличить rate limit (рискованно)

Отредактировать `scripts/parse-to-csv.ts`:

```typescript
// Было:
const rateLimiter = createRateLimiter({ requestsPerSecond: 0.5 })

// Сделать:
const rateLimiter = createRateLimiter({ requestsPerSecond: 2 }) // 120 товаров/мин
```

⚠️ **Внимание:** ChipDip может заблокировать капчей!

### Вариант 2: Несколько VPS с разными IP

1. Арендовать 5-10 VPS ($5/мес каждый)
2. Запустить парсер на каждом VPS
3. Каждый парсит свою часть категорий

```bash
# VPS 1: категории 1-50
pnpm tsx scripts/parse-to-csv.ts category-1 category-2 ... category-50

# VPS 2: категории 51-100
pnpm tsx scripts/parse-to-csv.ts category-51 category-52 ... category-100
```

**Результат:** 10x скорость = ~5 дней на 2 млн товаров

### Вариант 3: ScraperAPI (платно)

Использовать сервис для обхода капчи:

```typescript
// В browser-client.ts добавить:
const scraperApiKey = process.env.SCRAPER_API_KEY
const url = `http://api.scraperapi.com/?api_key=${scraperApiKey}&url=${productUrl}`
```

**Цена:** $49-249/мес  
**Скорость:** 200-500 товаров/мин  
**Для 2 млн:** 3-7 дней

---

## Мониторинг прогресса

Парсер показывает статистику каждые 10 товаров:

```
📊 Stats: Total=100, Imported=95, Failed=5, Speed=28.5/min, Duration=3m 20s
```

CSV файлы сохраняются в `data/parsed/`:

```
data/parsed/
  mikrokontrollery-1738.csv          (21 товаров)
  dc-dc-preobrazovateli-2010.csv     (100 товаров)
  rms-dc-preobrazovateli-2675.csv    (35 товаров)
  ...
```

---

## Проверка данных перед импортом

```bash
# Посмотреть первые 10 строк
head -n 10 data/parsed/mikrokontrollery-1738.csv

# Посчитать количество товаров
wc -l data/parsed/*.csv

# Найти дубликаты
cut -d',' -f1 data/parsed/*.csv | sort | uniq -d

# Проверить на ошибки парсинга
grep -i "error\|failed" data/parsed/*.csv
```

---

## Очистка и дедупликация

```bash
# Удалить дубликаты (оставить последний)
sort -t',' -k1,1 -u data/parsed/all-products.csv > data/parsed/unique-products.csv

# Объединить все CSV в один
cat data/parsed/*.csv | grep -v "^slug," | sort -u > data/parsed/all-products.csv
```

---

## Backup

Перед импортом сделать backup БД:

```bash
# Backup
docker exec electromagaz_db pg_dump -U postgres electromagaz > backup.sql

# Restore (если что-то пошло не так)
docker exec -i electromagaz_db psql -U postgres electromagaz < backup.sql
```

---

## Рекомендации

1. **Начните с малого**: Сначала спарсите 1-2 категории для теста
2. **Проверьте данные**: Откройте CSV в Excel/LibreOffice, проверьте качество
3. **Импортируйте тест**: Загрузите тестовые данные в БД
4. **Масштабируйте**: Если всё ОК, парсите остальные категории

---

## Troubleshooting

**Проблема:** Парсер падает с ошибкой капчи  
**Решение:** Уменьшить rate limit или использовать ScraperAPI

**Проблема:** CSV файл поврежден  
**Решение:** Удалить файл и перезапустить парсинг категории

**Проблема:** Импорт в БД падает  
**Решение:** Проверить CSV на ошибки, уменьшить batch size

**Проблема:** Дубликаты товаров  
**Решение:** Использовать дедупликацию перед импортом
