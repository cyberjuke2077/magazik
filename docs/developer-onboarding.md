# Onboarding для соразработчика

Этот документ позволяет поднять проект, понять контекст и начать работу без передачи чужих секретов. Работай из private GitHub-репозитория `cyberjuke2077/magazik` и никогда не копируй production credentials в Git.

## 1. Что нужно получить до старта

1. Доступ к private GitHub-репозиторию.
2. Node.js 20 или новее, npm и Docker Desktop.
3. Codex App или Codex CLI, если работаешь с Codex.
4. Отдельные доступы к Vercel, Supabase, Cloudflare R2, Telegram и API поставщиков только для задач, где они действительно нужны.

Для локальной разработки каталога достаточно Docker PostgreSQL. Production access не нужен и не выдаётся по умолчанию.

Текущий production target - `37Lunar's Org / 37Lunar's Project`, ref
`dbumwpnbtvixfusxnggn`. Owner проекта - `37Lunar`, `cyberjuke2077` имеет роль
Administrator. Каждый участник использует свой Supabase account.

Production Supabase не используется как локальная БД. Для обычной разработки
достаточно Docker PostgreSQL. Доступ к Supabase нужен только для согласованной
production-задачи, а connection string, пароль и полный URL не отправляются в
Git, чат, issue или PR.

## 2. Клонирование и установка

```bash
git clone https://github.com/cyberjuke2077/magazik.git
cd magazik
npm install
cp .env.example .env
```

В `.env` обязательно замени `ADMIN_SESSION_SECRET` на уникальное значение:

```bash
openssl rand -hex 32
```

`.env` локальный. Не коммить его, не вставляй в issue, чат, PR или лог.

## 3. Локальная база данных и запуск сайта

```bash
docker compose up -d postgres
npm run db:migrate:local
npm run db:generate
npm run db:seed:local-mvp
npm run dev:local
```

Если старый Docker volume использует прежний пароль роли, один раз выполни
`npm run db:sync-local-password`, затем повтори миграции. Команда изменяет только
локальную PostgreSQL и не подключается к Supabase.

Открой `http://localhost:3000`. Проверить базу можно так:

```bash
docker compose ps
npm run db:studio
npm run db:stats:local
npm run db:check:local-mvp
```

### Что будет в чистом окружении

Миграции создадут структуру PostgreSQL, но полный production-каталог автоматически не появится. В репозитории есть только небольшие parsed CSV в `data/parsed/`. Для тестовой разработки этого достаточно, для работы с реальным каталогом нужен отдельный согласованный импорт или доступ к sandbox-дампу.

Не используй production Supabase как локальную базу и не публикуй в production «для проверки».

## 4. Проверки перед коммитом

```bash
npm test
npm run test:integration
npm run lint
npm run build:local
npm run test:e2e:local
npm run check:db-failure:local
```

`test:e2e:local` сам запускает временный dev-сервер и Chromium на локальной БД.
`check:db-failure:local` запускается после сборки и проверяет безопасную страницу
ошибки с намеренно недоступной тестовой БД. Enrichment и внешние сервисы в этот
локальный набор не входят.

## 5. Работа с Codex и вторым мозгом

Открой папку проекта в Codex и начни новый task с контекстом задачи. Root [AGENTS.md](../AGENTS.md) автоматически задаёт правила проекта. Он требует сначала прочитать:

1. [docs/business/INDEX.md](business/INDEX.md) - что за продукт и какие ограничения бизнеса.
2. [ai-clone/INDEX.md](../ai-clone/INDEX.md) - тон, принципы и выученные правила.
3. `AGENTS.md` - команды, Git-flow и ограничения.
4. Документы конкретной зоны задачи.

В Git также лежат `plans/`, `retrospectives/`, `.agents/`, `.claude/`, `.codex/` и `.kiro/`. Это переносимый проектный контекст. Personal account settings, подключённые приложения и доступы к внешним сервисам не переносятся из GitHub - каждый разработчик подключает их в своём Codex отдельно.

`AGENTS.md` - правильное место для общих правил репозитория. Подробности о механике есть в [официальной документации Codex](https://learn.chatgpt.com/docs/agent-configuration/agents-md). Для совместной работы с владельцем проекта выполни [отдельный протокол Codex](codex-collaboration.md) до первой задачи.

## 6. Рабочий Git-flow

`main` - общая рабочая ветка. Для незавершённой задачи создай отдельную ветку:

```bash
git fetch origin
git switch main
git pull --ff-only
git switch -c feat/короткое-название-задачи
```

Дальше:

```bash
git status
git add src/конкретный-файл.ts
git commit -m "feat: короткое описание"
git push -u origin feat/короткое-название-задачи
```

Не используй `git add .` и не пушь незнакомые чужие изменения. Человек использует ветки `feat/*`, `fix/*` или `docs/*`, Codex - `codex/*`. Для каждой задачи открывай PR в `main`. Текущий Vercel Hobby блокирует private-repo deploy от автора commit, которого нет в Vercel team, поэтому PR Lunar сливает `cyberjuke2077` через merge commit. Подробное правило - в [docs/codex-collaboration.md](codex-collaboration.md).

## 7. Миграции и каталог

Изменение Prisma schema:

```bash
# Сначала меняешь prisma/schema.prisma
npm run db:migrate
npm run db:generate
npm run build
```

Миграции выполняй локально. В production Supabase ничего не меняй руками. В этом проекте `searchVector` - generated `tsvector`, поэтому перед созданием миграции прочитай правила в `AGENTS.md`: Prisma может добавить лишний DDL, который надо убрать из migration SQL.

Enrichment работает только при заданных `DATABASE_URL` и `ENRICHMENT_INPUT_DIR`:

```bash
npm run enrichment:run -- --dry-run
npm run enrichment:status
```

`tools/collector-legacy` - восстановленный архив старого collector. Не подключай его к production pipeline без отдельного аудита. Актуальный pipeline живёт в `src/lib/enrichment/`.

## 8. Production и внешние сервисы

| Задача | Что нужно | Правило |
| --- | --- | --- |
| Локальная разработка | Docker PostgreSQL и локальный `.env` | Без production credentials |
| Публикация каталога | `PUBLISH_DATABASE_URL` и подтверждённый diff | Сначала `npm run db:publish -- --dry-run` |
| Vercel deploy | `cyberjuke2077s-projects/magazik-94yr` | Merge в `main`, затем проверить статус `Ready` и smoke-test |
| Supabase production | `37Lunar's Org / 37Lunar's Project`, ref `dbumwpnbtvixfusxnggn` | Сначала подтвердить organization и ref |
| R2 maintenance | Отдельные R2 credentials | Не хранить в Git |
| Telegram notifications | Отдельный bot token и chat ID | Опционально для local |

Команда публикации каталога зеркалирует каталог в Supabase, но не трогает реальные заявки `QuoteRequest`. Запускай её только после явного согласования:

```bash
npm run db:publish -- --dry-run
npm run db:publish
```

## 9. Частые проблемы

### Prisma не подключается к БД

Проверь, что Docker запущен, сервис `postgres` healthy, а `DATABASE_URL` из `.env` использует те же логин, пароль и имя базы, что `POSTGRES_*`.

### `npm run build` падает на Google Fonts или PostgreSQL

Build зависит от сети для шрифтов и может обращаться к локальной БД. Сначала проверь сеть и Docker. Не называй это регрессией кода без воспроизводимого лога.

### Порт 3000 занят

Не запускай второй `npm run dev`. Найди уже работающий процесс и проверь, отвечает ли `http://localhost:3000`.

### Нужны production данные или доступы

Не ищи и не копируй чужой `.env`. Создай sandbox или запроси минимальный доступ к конкретному сервису. Для задач без production access используй локальную БД и безопасные тестовые данные.

### Vercel Preview падает без `DATABASE_URL`

Сейчас это ожидаемо: официальная Supabase integration выдаёт database env только
Production, а Preview отключен от production DB. Не копируй production
credentials в Preview. Для рабочих Preview нужна отдельная Supabase branch или
sandbox и отдельный набор Preview env.

## 10. Что считать готовой задачей

1. Изменение лежит в понятной ветке и состоит из осмысленных коммитов.
2. Релевантные тесты, линт и build запущены или явно зафиксирована причина, почему это невозможно.
3. Нет секретов, `.env`, локальных DB, логов и generated artifacts в staged files.
4. Для изменения бизнес-логики обновлены нужные документы второго мозга.
5. Для production задач отдельно подтверждены Vercel/Supabase результаты. Успешный Git push этого не подтверждает.
