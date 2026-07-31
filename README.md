# Electromagaz

Интернет-магазин микроэлектроники и промышленной автоматики. Каталог электронных компонентов с поиском по MPN, корзиной, заказами и enrichment-системой обогащения данных от поставщиков.

## Технологический стек

- **Framework:** Next.js 16 (App Router) + React 19
- **Язык:** TypeScript (strict mode)
- **Стили:** Tailwind CSS v4
- **БД:** PostgreSQL 16 + Prisma 5 (локально — Docker, прод — Supabase)
- **Хостинг:** Vercel (авто-деплой из `main`), картинки — Cloudflare R2
- **Поиск:** PostgreSQL FTS (tsvector, веса A/B/C)
- **Enrichment:** TS pipeline (Mouser API, LCSC, ChipDip)
- **Браузерная автоматизация:** cloakbrowser + playwright-core
- **Тесты:** Vitest + Playwright + fast-check
- **TUI:** Ink (React for CLI)

## Быстрый старт

Полный runbook для нового разработчика: [docs/developer-onboarding.md](docs/developer-onboarding.md).

### 1. Установка

```bash
npm install
```

> Пакетный менеджер проекта — **npm** (lock-файл: `package-lock.json`). Vercel собирает через npm (`vercel.json`).

### 2. Локальная конфигурация и БД

Скопируйте `.env.example` в `.env`, замените local passwords и `ADMIN_SESSION_SECRET`, затем:

```bash
cp .env.example .env
docker compose up -d postgres
npm run db:migrate
npm run db:generate
```

### 3. Dev-сервер

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Enrichment-пайплайн

Обогащение каталога из Excel-файлов поставщиков (.xlsx/.xls/.csv с китайскими заголовками 型号/品牌/封装/批号 или auto-detect MPN).

```bash
# Полный прогон
npm run enrichment:run

# С опциями
npm run enrichment:run -- --input-dir /path/to/excels --batch-size 50
npm run enrichment:run -- --input-dir /path/to/supplier-files --limit 3 --no-tui # пробный прогон трёх MPN
npm run enrichment:run -- --resume
npm run enrichment:run -- --dry-run         # без API-вызовов
npm run enrichment:run -- --force-refresh   # обновить даже свежие карточки
npm run enrichment:run -- --skip-mouser     # отключить Mouser
npm run enrichment:run -- --mouser-only     # только Mouser
npm run enrichment:run -- --no-tui          # legacy-логи вместо Ink TUI

# Статус
npm run enrichment:status
npm run enrichment:watch
```

  Вход: `ENRICHMENT_INPUT_DIR` в `.env`. Несекретные интервалы и срок
  свежести хранятся в `config/enrichment.json`. По умолчанию товары
  `complete`, обновлённые за последние 90 дней, не запрашиваются повторно.
  Источники обрабатываются каскадом ChipDip → LCSC → Mouser.

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

scripts/                          # утилиты: db-publish (каталог → прод), диагностика БД
docs/database-schema.md           # описание схемы
```

## Команды

```bash
# Dev
npm run dev
npm run build
npm run start

# Тесты
npm test                           # unit (Vitest)
npm run test:integration           # с реальными внешними системами
npm run test:coverage

# Линтинг
npm run lint

# Prisma
npm run db:migrate
npm run db:studio
npm run db:generate

# Enrichment
npm run enrichment:run -- [flags]
npm run enrichment:status
npm run enrichment:watch

# Публикация каталога в прод
npm run db:publish -- --dry-run    # показать diff local ↔ prod
npm run db:publish                 # опубликовать каталог в Supabase
```

## Деплой и публикация данных

Архитектура «две БД»:

```
┌──────────────────────────┐         ┌──────────────────────────────┐
│  ЛОКАЛЬНО (Mac)          │         │  ПРОД                        │
│                          │         │                              │
│  Парсер / enrichment     │         │  Vercel (Next.js)            │
│        ↓                 │ db:     │        ↓                     │
│  PostgreSQL в Docker     │ publish │  Supabase PostgreSQL         │
│  (источник правды        │ ──────► │  (каталог — копия local,     │
│   по каталогу)           │         │   + заявки клиентов)         │
└──────────────────────────┘         └──────────────────────────────┘
```

- **Код:** Vercel деплоит только если проект подключён к этому GitHub-репозиторию и Environment Variables настроены в Vercel. Push сам по себе не является доказательством production deploy.
- **Каталог:** парсер наполняет локальную БД → `npm run db:publish` зеркалирует каталожные таблицы в Supabase одной транзакцией (без блокировки читателей).
- **Заявки клиентов** (`QuoteRequest`/`QuoteRequestItem`) живут только в проде и при публикации не трогаются.
- **Картинки** хранятся в Cloudflare R2 — общие для local и prod, публикация не нужна.

Прод: https://electromagaz.vercel.app

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
