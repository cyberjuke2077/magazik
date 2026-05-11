# Electromagaz

Интернет-магазин микроэлектроники и промышленной автоматики. Большой каталог электронных компонентов с поиском по маркировке, корзиной, заказами и личным кабинетом.

## Технологический стек

- **Framework:** Next.js 15 (App Router)
- **Язык:** TypeScript (strict mode)
- **Стили:** Tailwind CSS
- **База данных:** PostgreSQL
- **ORM:** Prisma
- **Поиск:** Meilisearch
- **Парсинг:** Cheerio

## Быстрый старт

### 1. Установка зависимостей

```bash
pnpm install
```

### 2. Настройка базы данных

Создайте файл `.env` на основе `.env.example`:

```bash
DATABASE_URL="postgresql://electromagaz:password@localhost:5432/electromagaz"
```

Запустите PostgreSQL через Docker:

```bash
docker-compose up -d postgres
```

Примените миграции:

```bash
pnpm prisma migrate dev
```

### 3. Импорт продуктов из ChipDip

Импортируйте тестовую партию из 100 продуктов:

```bash
pnpm tsx src/scripts/import-chipdip.ts
```

Подробнее: [docs/import-guide.md](docs/import-guide.md)

### 4. Запуск dev-сервера

```bash
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## Структура проекта

```
/
├── src/
│   ├── app/              # Next.js App Router (страницы)
│   ├── components/       # React компоненты
│   ├── lib/
│   │   ├── parser/       # ChipDip парсер (Cheerio)
│   │   ├── queries/      # Prisma запросы
│   │   └── prisma.ts     # Prisma клиент
│   └── scripts/
│       └── import-chipdip.ts  # Скрипт импорта
├── prisma/
│   ├── schema.prisma     # Схема БД
│   └── migrations/       # Миграции
├── docs/
│   ├── database-schema.md      # Дизайн схемы БД
│   ├── parser-architecture.md  # Архитектура парсера
│   └── import-guide.md         # Руководство по импорту
└── AGENTS.md             # Инструкции для AI-агентов
```

## База данных

### Схема

Основные модели:
- **Category** - Категории с иерархией (parent/child)
- **Manufacturer** - Производители электроники
- **Product** - Товары (название, артикул, описание)
- **ProductImage** - Изображения (URL, без локального хранения)
- **Specification** - Характеристики (key-value пары)
- **Datasheet** - Ссылки на PDF даташиты
- **ProductAnalog** - Аналоги/альтернативы (many-to-many)

Подробнее: [docs/database-schema.md](docs/database-schema.md)

### Prisma команды

```bash
# Применить миграции
pnpm prisma migrate dev

# Открыть Prisma Studio (GUI для БД)
pnpm prisma studio

# Сгенерировать Prisma клиент
pnpm prisma generate

# Сбросить БД (удалить все данные)
pnpm prisma migrate reset
```

## Импорт продуктов

### Быстрый импорт (100 продуктов)

```bash
pnpm tsx src/scripts/import-chipdip.ts
```

Время: ~2 минуты

### Настройка импорта

Отредактируйте `src/scripts/import-chipdip.ts`:

```typescript
await importProducts({
  maxProducts: 100,     // Количество продуктов
  batchSize: 10,        // Размер батча
  catalogUrl: 'https://www.chipdip.ru/catalog/microcontrollers',
})
```

### Масштабирование до 2M продуктов

Подробное руководство: [docs/import-guide.md](docs/import-guide.md)

**Стратегии:**
- Параллельный импорт (несколько категорий одновременно)
- Увеличение rate limit (если ChipDip разрешает)
- Оптимизация размера батчей
- Ночной импорт (cron jobs)

## Разработка

### Команды

```bash
# Dev-сервер
pnpm dev

# Сборка
pnpm build

# Продакшн-сервер
pnpm start

# Линтинг
pnpm lint

# Форматирование
pnpm format

# Тесты
pnpm test

# E2E тесты
pnpm test:e2e
```

### Стиль кода

Следуйте инструкциям в [AGENTS.md](AGENTS.md):
- TypeScript strict mode
- Именование: camelCase (функции), PascalCase (компоненты), kebab-case (файлы)
- Импорты: группировка по (1) внешние библиотеки, (2) @/ алиасы, (3) относительные пути
- Обработка ошибок: всегда явная, с контекстом
- Без `any` типов - используйте `unknown`

## Документация

- **[docs/database-schema.md](docs/database-schema.md)** - Дизайн схемы БД, индексы, отношения
- **[docs/parser-architecture.md](docs/parser-architecture.md)** - Архитектура парсера, модули, data flow
- **[docs/import-guide.md](docs/import-guide.md)** - Импорт продуктов, troubleshooting, масштабирование
- **[AGENTS.md](AGENTS.md)** - Инструкции для AI-агентов, конвенции проекта

## Архитектура парсера

Модульная система на чистых функциях:

- **product-parser.ts** - Извлечение данных из HTML страниц продуктов
- **catalog-scraper.ts** - Извлечение URL продуктов из каталога
- **http-client.ts** - HTTP запросы с retry логикой
- **rate-limiter.ts** - Rate limiting (1 req/sec по умолчанию)

Подробнее: [docs/parser-architecture.md](docs/parser-architecture.md)

## Деплой

### Docker

```bash
# Сборка образа
docker build -t electromagaz .

# Запуск контейнера
docker-compose up -d
```

### VPS

1. Клонировать репозиторий
2. Настроить `.env` с production DATABASE_URL
3. Запустить PostgreSQL
4. Применить миграции: `pnpm prisma migrate deploy`
5. Собрать проект: `pnpm build`
6. Запустить: `pnpm start`

## Лицензия

MIT

## Поддержка

- GitHub Issues - баги и feature requests
- Discussions - вопросы и обсуждения
