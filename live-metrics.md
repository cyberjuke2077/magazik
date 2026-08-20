# Live Metrics - Electromagaz

Агент читает этот файл когда в других файлах встречает маркер LIVE.
Выполняй запросы через Supabase MCP (execute_sql) или npm run db:studio.

> SQL выверен под актуальную `prisma/schema.prisma`. Если меняешь схему - синхронизируй запросы.

## Последний подтвержденный публичный snapshot

Проверено 2026-08-20 после merge PR #14 и применения runtime RLS policies:

- Vercel Production `https://electromagaz-production.vercel.app` имеет статус `Ready`;
- `/`, `/best`, `/catalog` и `/api/catalog/categories` вернули HTTP 200;
- первая страница каталога отрисовала 50 товарных строк;
- CSV export вернул 51 товар, карточка `AD1580ARTZ-REEL7` вернула HTTP 200;
- API категорий вернул 8 корневых и 14 дочерних категорий;
- `/best` не отрисовал товары, потому что его выборка требует `priceWholesale`.
- `/api/health` вернул `status: ok` и `database: ok`;
- SQL snapshot: 51 товар, 22 категории, 8 производителей, 10 изображений,
  97 datasheet, 4 товара с розничной ценой, 0 с оптовой ценой и 0 в наличии;
- заявки и оптовые лиды: 0.

Это публичный smoke, а не полный снимок БД. Актуальные totals, покрытие ценами,
заявки и enrichment получать SQL-запросами ниже.

## Каталог

```sql
-- Товаров всего
SELECT COUNT(*) AS total FROM "Product";

-- Товаров по категориям (топ-10)
SELECT c.name, COUNT(p.id) AS count
FROM "Product" p
JOIN "Category" c ON c.id = p."categoryId"
GROUP BY c.name ORDER BY count DESC LIMIT 10;

-- Производителей всего
SELECT COUNT(*) AS total FROM "Manufacturer";

-- Покрытие ценами и наличием
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE price IS NOT NULL) AS with_retail_price,
       COUNT(*) FILTER (WHERE "priceWholesale" IS NOT NULL) AS with_wholesale_price,
       COUNT(*) FILTER (WHERE "inStock") AS in_stock
FROM "Product";

-- Товары без картинок (требуют внимания)
SELECT COUNT(*) AS without_images
FROM "Product" p
WHERE NOT EXISTS (
  SELECT 1 FROM "ProductImage" pi WHERE pi."productId" = p.id
);
```

## Enrichment

`EnrichmentJournal` - per-MPN журнал (одна строка = один MPN в рамках runId),
а не таблица прогонов. Поэтому агрегируем по `runId`.

```sql
-- Последние прогоны enrichment (агрегат по runId)
SELECT "runId",
       COUNT(*) AS positions,
       MIN("createdAt") AS started,
       MAX("updatedAt") AS last_update
FROM "EnrichmentJournal"
GROUP BY "runId"
ORDER BY MAX("updatedAt") DESC
LIMIT 5;

-- Статусы позиций в самом свежем прогоне
SELECT status, COUNT(*) AS count
FROM "EnrichmentJournal"
WHERE "runId" = (
  SELECT "runId" FROM "EnrichmentJournal" ORDER BY "updatedAt" DESC LIMIT 1
)
GROUP BY status ORDER BY count DESC;

-- Товары без обогащённых данных (ни даташита, ни характеристик)
SELECT COUNT(*) AS not_enriched
FROM "Product" p
WHERE NOT EXISTS (SELECT 1 FROM "Datasheet" d WHERE d."productId" = p.id)
  AND NOT EXISTS (SELECT 1 FROM "Specification" s WHERE s."productId" = p.id);

-- Покрытие enrichment по статусам товаров
-- (в Datasheet нет колонки source, поэтому смотрим Product.enrichmentStatus)
SELECT "enrichmentStatus", COUNT(*) AS count
FROM "Product"
GROUP BY "enrichmentStatus" ORDER BY count DESC;

-- Даташиты по языку
SELECT language, COUNT(*) AS count
FROM "Datasheet"
GROUP BY language ORDER BY count DESC;
```

## B2B / Заявки

```sql
-- Заявки за последние 30 дней
SELECT COUNT(*) AS total
FROM "QuoteRequest"
WHERE "createdAt" >= NOW() - INTERVAL '30 days';

-- Заявки по статусам
SELECT status, COUNT(*) AS count
FROM "QuoteRequest"
GROUP BY status ORDER BY count DESC;

-- Последние 5 заявок
SELECT id, "createdAt", status, "companyName"
FROM "QuoteRequest"
ORDER BY "createdAt" DESC LIMIT 5;

-- Оптовые лиды за последние 30 дней
SELECT COUNT(*) AS total
FROM "WholesaleLead"
WHERE "createdAt" >= NOW() - INTERVAL '30 days';

-- Оптовые лиды по статусам
SELECT status, COUNT(*) AS count
FROM "WholesaleLead"
GROUP BY status ORDER BY count DESC;
```
