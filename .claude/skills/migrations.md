# Скилл: миграции Prisma

## Стандартный процесс

```bash
# 1. Изменить схему
# Редактируй prisma/schema.prisma

# 2. Создать и применить миграцию
npm run db:migrate
# Prisma спросит имя миграции - дать осмысленное имя на английском
# например: add_product_weight, add_quote_status_index

# 3. Обновить Prisma-клиент
npm run db:generate

# 4. Проверить что приложение собирается
npm run build
```

## Важно

- Никогда не редактировать SQL в папке `migrations/` руками - только через Prisma
- Никогда не менять схему в Supabase напрямую - только через `npm run db:migrate`
- После `db:migrate` обязательно `db:generate`, иначе TypeScript не увидит новые поля
- После миграции запустить `npm run build` чтобы поймать type-ошибки до коммита

## Основные модели

| Модель | Назначение |
|---|---|
| `Category` | Иерархия категорий (parentId -> children) |
| `Manufacturer` | Производители компонентов |
| `Product` | Товары (mpnNormalized, lifecycle, package, searchVector) |
| `ProductImage` | Ссылки на картинки в R2 |
| `Specification` | Key-value характеристики товара |
| `Datasheet` | PDF даташиты |
| `ProductAnalog` | Many-to-many аналоги (self-relation на Product) |
| `ImportProgress` | Прогресс фонового импорта |
| `EnrichmentJournal` | Статус обогащения по каждому (brand, mpn) |
| `QuoteRequest` | Заявки на КП (только в проде, не публикуются) |
| `QuoteRequestItem` | Позиции в заявках |

## searchVector

`Product.searchVector` - это `Unsupported("tsvector")` - Prisma не управляет им напрямую.
Столбец создаётся через raw SQL в миграции и автообновляется триггером.
Если нужно добавить поле в поисковый индекс - смотри существующие миграции с tsvector.

## Осторожно при изменении схемы в проде

Supabase - прод с реальными данными. `npm run db:migrate` применяет миграции к локальному Docker.
В Supabase миграции прилетают через `npm run db:publish` (который тоже применяет миграции).
Деструктивные миграции (DROP COLUMN, DROP TABLE) - согласовать с пользователем.
