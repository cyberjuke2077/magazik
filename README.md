# Electromagaz

Интернет-магазин микроэлектроники и промышленной автоматики. Каталог электронных компонентов с поиском по MPN, корзиной, заказами и enrichment-системой обогащения данных от поставщиков.

## Технологический стек

- **Framework:** Next.js 16 (App Router) + React 19
- **Язык:** TypeScript (strict mode)
- **Стили:** Tailwind CSS v4
- **БД:** PostgreSQL 16 + Prisma 5
- **Поиск:** Postgres FTS (tsvector, веса A/B/C) + Meilisearch
- **Enrichment:** TS pipeline (Mouser API, LCSC, ChipDip)
- **Браузерная автоматизация:** cloakbrowser + playwright-core
- **Тесты:** Vitest + Playwright + fast-check
- **TUI:** Ink (React for CLI)

## Быстрый старт

### 1. Установка

```bash
pnpm install
```

### 2. БД

Скопируйте `.env.example` в `.env` и заполните `DATABASE_URL`, затем:

```bash
docker-compose up -d postgres
pnpm prisma migrate dev
pnpm prisma generate
```

### 3. Dev-сервер

```bash
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Enrichment-пайплайн

Обогащение каталога из Excel-файлов поставщиков (.xlsx/.xls/.csv с китайскими заголовками 型号/品牌/封装/批号 или auto-detect MPN).

```bash
# Полный прогон
pnpm enrichment:run

# С опциями
pnpm enrichment:run --input-dir /path/to/excels --batch-size 50
pnpm enrichment:run --resume
pnpm enrichment:run --dry-run         # без API-вызовов
pnpm enrichment:run --skip-mouser     # отключить Mouser
pnpm enrichment:run --mouser-only     # только Mouser
pnpm enrichment:run --no-tui          # legacy-логи вместо Ink TUI

# Статус
pnpm enrichment:status
pnpm enrichment:watch
```

Вход: `ENRICHMENT_INPUT_DIR` в `.env`. Источники по приоритету: Mouser (API) → LCSC (scraping) → ChipDip (stealth Chromium).

## Структура проекта

```
src/
├── app/                          # Next.js App Router
├── components/
│   └── enrichment-tui/           # Ink-дашборд для enrichment
├── lib/
│   ├── enrichment/
│   │   ├── ingest/               # Excel-импортер, MPN-нормализатор, brand-mapper
│   │   ├── sources/              # mouser-api, lcsc-client, chipdip-client
│   │   ├── persistence/          # запись в Postgres (Product, EnrichmentJournal)
│   │   ├── observability/        # event-bus, dashboard-state, logger
│   │   ├── orchestrator.ts       # главный пайплайн
│   │   └── browser-registry.ts   # учёт Chromium-процессов, graceful shutdown
│   ├── proxy/                    # proxy-manager (Webshare residential)
│   ├── queries/                  # Prisma-запросы для UI
│   └── prisma.ts
└── scripts/
    ├── enrichment-run.ts         # CLI-runner
    └── enrichment-status.ts      # отчёт прогресса

prisma/
├── schema.prisma                 # Product, Manufacturer, Category, EnrichmentJournal, QuoteRequest
└── migrations/

scripts/                          # утилиты диагностики БД
docs/database-schema.md           # описание схемы
```

## Команды

```bash
# Dev
pnpm dev
pnpm build
pnpm start

# Тесты
pnpm test                          # unit (Vitest)
pnpm test:integration              # с реальными внешними системами
pnpm test:coverage

# Линтинг
pnpm lint

# Prisma
pnpm db:migrate
pnpm db:studio
pnpm db:generate

# Enrichment
pnpm enrichment:run [flags]
pnpm enrichment:status
pnpm enrichment:watch
```

## БД

Основные модели: `Category` (иерархия), `Manufacturer`, `Product` (с `mpnNormalized`, `lifecycle`, `package`, `searchVector` tsvector), `ProductImage`, `Specification`, `Datasheet`, `ProductAnalog`, `EnrichmentJournal`, `QuoteRequest`/`QuoteRequestItem`.

Подробнее: [docs/database-schema.md](docs/database-schema.md).

## Конвенции кода

- TypeScript strict, без `any` (используйте `unknown`).
- Именование: `camelCase` функции, `PascalCase` компоненты, `kebab-case` файлы.
- Импорты: внешние → `@/` → относительные.
- Без преждевременных абстракций. Без silent fallbacks — ошибки явные, с контекстом.

См. [AGENTS.md](AGENTS.md).

## Лицензия

MIT.
