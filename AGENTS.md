# Electromagaz - навигация по проекту

Интернет-магазин микроэлектроники. Каталог электронных компонентов с поиском по MPN,
enrichment-пайплайном обогащения данных, корзиной и заявками.
Подробности: `docs/business/INDEX.md`

## Порядок чтения в начале сессии

1. `docs/business/INDEX.md` - что за проект, аудитория, продукт
2. `ai-clone/INDEX.md` - кто я, мой тон, выученные правила
3. `AGENTS.md` (этот файл) - структура, роутинг, правила
4. Зона задачи: нужный файл из `src/`, `plans/`, `docs/`

## Стек

Next.js 16 (App Router) + React 19, TypeScript strict, Tailwind CSS v4,
PostgreSQL 16 + Prisma 5 (Docker локально, Supabase прод),
Meilisearch, Vercel, Cloudflare R2 (картинки).
Пакетный менеджер: npm (не pnpm, не yarn).
Тесты: Vitest (unit) + Playwright (e2e) + fast-check (property).

## Структура репозитория

```
src/
├── app/              # Next.js App Router, страницы
├── components/
│   └── enrichment-tui/  # Ink TUI для enrichment
├── lib/
│   ├── enrichment/   # весь пайплайн обогащения
│   │   ├── ingest/   # Excel-импортер, MPN-нормализатор
│   │   ├── sources/  # mouser-api, lcsc-client, chipdip-client
│   │   ├── persistence/
│   │   ├── observability/
│   │   └── orchestrator.ts
│   ├── proxy/        # Webshare residential proxy
│   └── queries/      # Prisma-запросы для UI
├── scripts/
│   ├── enrichment-run.ts
│   └── enrichment-status.ts
prisma/
├── schema.prisma
└── migrations/
docs/
├── business/         # бизнес-контекст
└── database-schema.md
plans/                # планы фич (YYYY-MM-DD-название.md)
retrospectives/       # итоги сессий (YYYY-MM-DD_название.md)
.agents/skills/        # repo-skills для Codex
.claude/skills/        # локальные workflow-документы Claude Code
.codex/config.toml     # локальные настройки Codex
```

## Где что искать

| Что нужно | Куда смотреть |
|---|---|
| Описание проекта, аудитория | `docs/business/INDEX.md` |
| Архитектурные решения | `docs/business/architecture.md` |
| Схема БД | `docs/database-schema.md`, `prisma/schema.prisma` |
| Enrichment-пайплайн | `.claude/skills/enrichment.md` |
| Публикация в прод | `.claude/skills/db-publish.md` |
| Миграции Prisma | `.claude/skills/migrations.md` |
| Текущие планы | `plans/` |
| Итоги прошлых сессий | `retrospectives/` |
| Кто я, мой стиль, принципы | `ai-clone/INDEX.md` |
| Живые метрики каталога и заявок | `live-metrics.md` |
| Обновление второго мозга | `.agents/skills/brain-update/SKILL.md` |

## Команды

```bash
npm run dev              # dev-сервер
npm run build            # сборка (запускать перед push)
npm test                 # unit-тесты (Vitest)
npm run test:integration # интеграционные тесты
npm run lint             # линтинг
npm run db:migrate       # миграции
npm run db:generate      # генерация Prisma-клиента
npm run db:studio        # Prisma Studio
npm run db:publish       # публикация каталога в Supabase
npm run enrichment:run   # запуск enrichment
npm run enrichment:status
```

## Принципы и правила

1. `npm` - только npm, не pnpm/yarn. lock-файл: `package-lock.json`
2. TypeScript strict - без `any`. Если edge-case - `unknown` + type guard
3. Server Components по умолчанию. `'use client'` только при необходимости
4. Без silent fallbacks - ошибки явные, с контекстом (`throw new Error(...)`)
5. `git add` поимённо. Никогда `git add .`
6. Перед `npm run build` проверить что собирается без ошибок
7. `.env` не читать целиком: `grep "^VAR=" .env`
8. Картинки в Cloudflare R2, не в репо и не в Supabase Storage
9. Изменения схемы БД только через миграции: `npm run db:migrate`
   - Локально нет `DIRECT_URL` (только прод). Подставить из `DATABASE_URL`:
     `export DIRECT_URL="$(grep '^DATABASE_URL=' .env | cut -d= -f2- | sed -E 's/^"//; s/"$//')"`
   - `prisma migrate dev` тащит мусорные `DROP INDEX Product_searchVector_idx` +
     `ALTER COLUMN searchVector DROP DEFAULT` (generated-колонка под raw SQL) -
     вычистить из migration.sql вручную, оставить только нужный DDL
   - На прод-Supabase миграции `db:publish` НЕ катит. Применять через Supabase MCP
     `execute_sql` транзакцией: ALTER + INSERT в `_prisma_migrations` с checksum от
     `shasum -a 256 migration.sql`. Pooler не дружит с `prisma migrate deploy`
10. Enrichment запускается локально, результат публикуется через `npm run db:publish`
11. Парсер товарной базы живёт локально на Mac, вне этого репо. Не искать, не трогать, не воссоздавать. Данные из него попадают в локальную БД - затем `npm run db:publish` - Supabase
12. Контакты и реквизиты компании - только из `src/lib/company.ts`. Не хардкодить
    телефон/email/ИНН/ОГРН в компонентах и страницах. Числовые реквизиты -
    плейсхолдеры `[ЗАПОЛНИТЬ]`; перед прод-анонсом добиться `hasPlaceholders() === false`

## Большая фича = план

Задача дольше часа - создать план в `plans/YYYY-MM-DD-название.md`:
- Разбить на фазы со статусом `[ ]` / `[x]`
- В конце плана: что реализовано, что осталось

## Рефлексия в конце сессии

Сохранить в `retrospectives/YYYY-MM-DD_название.md`:
1. Задача
2. Как решали
3. Решили: да/нет/частично
4. Что можно было лучше
5. Что изменить в AGENTS.md (если были грабли)

## Самообновление второго мозга

Запускать `brain-update` автоматически, когда:
- Принято архитектурное или продуктовое решение, которого нет в `docs/business/`
- Агент сделал ошибку, для которой нет правила в `ai-clone/feedback/`
- Изменилась бизнес-логика, цель, аудитория или экономика
- Пользователь просит «запомни», «зафиксируй итоги» или «обнови второй мозг»
- Сессия завершается

Второй мозг локальный и намеренно игнорируется git. Не форсить его в публичный репозиторий.

## Язык

Всегда отвечать на русском. Только дефис, не длинное тире.
