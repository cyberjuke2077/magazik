# Codex: первый запуск и совместная работа

Этот протокол нужен, чтобы второй разработчик работал с этим же private-репозиторием предсказуемо, а Codex автоматически получал те же проектные правила. Он не копирует чужие аккаунты, секреты или права доступа - каждый участник использует свой GitHub и свой Codex.

## Что Codex подхватывает автоматически

После клонирования и открытия корня репозитория Codex находит `.git`, root `AGENTS.md` и `.codex/config.toml`. `AGENTS.md` требует прочитать бизнес-контекст, правила проекта и документы зоны задачи. Поэтому не надо переносить личные настройки владельца или вручную вставлять весь контекст в каждый task.

В Git versioned общий контекст: `docs/business/`, `ai-clone/`, `plans/`, `retrospectives/`, `.agents/`, `.claude/` и `.codex/`. Не переносятся и не должны попадать в Git: `.env`, API-ключи, личные сессии Codex, доступы GitHub, Vercel, Supabase, Cloudflare R2, Telegram и production-данные.

## Однократная настройка разработчика

1. Владелец добавляет соразработчика в private-репозиторий GitHub с правом записи.
2. Соразработчик клонирует репозиторий и проходит [onboarding](developer-onboarding.md): Node.js, npm, Docker, локальный `.env` из `.env.example` и PostgreSQL.
3. Соразработчик входит в Codex под своим аккаунтом и открывает именно корень папки `magazik` в Codex App либо запускает `codex` из этого каталога.
4. Для Git push используется личная авторизация GitHub соразработчика. Если push получает `403`, это не проблема Codex - нужно выдать или проверить GitHub write access.

## Текущий командный контур

Перед любой production-задачей сверяй не только название, но и точный target:

| Контур | Текущий target | Права |
| --- | --- | --- |
| GitHub | `cyberjuke2077/magazik`, ветка `main` | `cyberjuke2077` - владелец, Lunar - соразработчик |
| Vercel | `cyberjuke2077s-projects/magazik-94yr`, project ID `prj_zfRDrMz1kwxJ7JPvt1xx84BeGZVy` | аккаунт `cyberjuke2077`, Hobby team |
| Supabase | `37Lunar's Org / 37Lunar's Project`, ref `dbumwpnbtvixfusxnggn` | `37Lunar` - Owner, `cyberjuke2077` - Administrator |
| Production | `https://magazik-94yr.vercel.app` | deploy только из `main` |

Подробный живой реестр находится в [service-inventory.md](operations/service-inventory.md). Старые названия `electromagaz`, другие Supabase organization или похожие Vercel projects не считаются target этого репозитория.

## Первый prompt для Codex

В новом task сначала отправь Codex это сообщение:

```text
Прочитай AGENTS.md, docs/developer-onboarding.md и docs/codex-collaboration.md.
Проверь git status -sb, git remote -v и актуальность origin/main.
Назови краткий план работы. Ничего не меняй, не коммить и не пушь, пока я не подтвержу план.
```

После подтверждения Codex следует правилам из `AGENTS.md` автоматически. Если задача длится больше часа, он сначала создаёт план в `plans/`.

## Безопасный цикл одной задачи

Перед началом рабочее дерево должно быть чистым. Если нет - не удаляй, не stash и не коммить чужие изменения. Сначала покажи их владельцу.

```bash
git status -sb
git fetch origin
git switch main
git pull --ff-only
git switch -c feat/короткое-название-задачи
```

Во время работы:

1. Одна задача - одна ветка. Разработчик использует `feat/*`, `fix/*` или `docs/*`. Codex использует `codex/*`.
2. Добавляй файлы только поимённо, например `git add src/app/page.tsx`.
3. Делай небольшие Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
4. Запускай релевантные проверки. Перед обычным code push нужны как минимум `npm run lint` и `npm run build`, если окружение позволяет. Причину непройденной проверки надо явно передать в handoff.
5. При изменении бизнес-логики, архитектуры или правил обновляй соответствующий документ второго мозга и ретроспективу сессии.

Перед push:

```bash
git status -sb
git log origin/main..HEAD --oneline
git push -u origin feat/короткое-название-задачи
```

После push открывай Pull Request из своей ветки в `main`. `main` сливает владелец после review и локальных проверок. Прямой push в `main` допустим только если владелец дал явное указание для конкретной операции.

## Обязательное завершение сессии

Если в сессии появились материальные изменения, локальный commit без push не
считается завершением. Перед handoff нужно:

1. Обновить относящиеся к задаче документы второго мозга и ретроспективу.
2. Запустить релевантные проверки и явно записать все непроверенные контуры.
3. Добавить измененные файлы поимённо и сделать Conventional Commit.
4. Проверить `git log origin/main..HEAD --oneline`, чтобы не отправить чужие commit.
5. Отправить текущую task-ветку и создать или обновить один draft PR в `main`.
6. Проверить remote SHA и состояние PR, затем передать ссылку второму разработчику.

Если GitHub недоступен, авторизация сломана или в ветке обнаружены чужие commit,
нельзя молча оставить работу локально. В handoff фиксируются точный blocker,
локальная ветка, SHA и первая команда для продолжения.

Одинаковое состояние у двух разработчиков означает один и тот же слитый `main`.
Push task-ветки сохраняет работу на GitHub, но друг получает ее только после merge
PR и `git pull --ff-only` своего локального `main`.

В общий Git попадают код и versioned второй мозг: `AGENTS.md`, `docs/`,
`ai-clone/`, `plans/`, `retrospectives/`, `.agents/`, `.claude/` и безопасные
`.codex/` настройки. Секреты, `.env`, локальные модели и кэши, БД, browser
profiles, логи и исходные файлы заказчика остаются вне Git.

## Как Lunar работает с репозиторием

1. Перед новой задачей Lunar обновляет локальный `main` через `git pull --ff-only` и создаёт новую ветку.
2. В ветку попадают только файлы текущей задачи. `.env`, токены, дампы БД и чужие незакоммиченные изменения не трогаются.
3. Lunar запускает релевантные тесты, `npm run lint` и `npm run build:local`, затем открывает PR в `main` с кратким handoff.
4. `cyberjuke2077` делает review и сливает PR через GitHub merge commit. Это важно для текущего Vercel Hobby: private-repo deployment от commit, автор которого не входит в Vercel team, блокируется.
5. Merge в `main` запускает Production deployment. После статуса `Ready` проверяются `/`, `/best`, `/catalog` и `/api/catalog/categories`.
6. Если production deployment упал, PR не переписывают force push. Сначала читают build log и исправляют причину отдельным commit или PR.

Preview для PR сейчас не является acceptance-средой: Supabase credentials выданы только Production, а Supabase Preview отключен. Это ожидаемая конфигурация. Нельзя подключать Preview напрямую к production DB. Если команде нужны рабочие Preview, сначала создаётся отдельная Supabase branch или sandbox и отдельные Preview env.

## Правила работы с Supabase

- Обычная разработка и тесты идут на локальном PostgreSQL из Docker.
- Перед production-операцией надо вслух подтвердить `37Lunar's Org / 37Lunar's Project`, ref `dbumwpnbtvixfusxnggn`.
- Каждый участник входит под своим аккаунтом. Connection strings, пароли и токены не передаются через Git, чат, issue или PR.
- Изменения schema идут через `prisma/schema.prisma` и migration-файл. Порядок применения production migration описан в `AGENTS.md` и требует отдельной задачи.
- `npm run db:publish` не является проверкой кода. Его запускают только после dry-run, проверки diff и явного согласования.

## Что Codex не делает сам

- Не читает и не выводит `.env` целиком, не коммитит секреты, локальные БД, логи и generated artifacts.
- Не выполняет `npm run db:publish`, миграции production Supabase, Vercel deploy или операции с R2 без явной задачи, нужных доступов и проверки target environment.
- Не подключает `tools/collector-legacy` к production. Актуальный enrichment находится в `src/lib/enrichment/`.
- Не делает force push, reset, переписывание истории или переименование общей ветки.
- Не трогает чужие незакоммиченные файлы. При конфликте с обновившимся `main` останавливается и показывает конфликт владельцу.

## Handoff между вами

В конце task Codex должен отдать короткий отчёт в таком виде:

```text
Ветка: codex/название-задачи
Commit: abc1234
Сделано: что изменилось
Проверки: npm run lint, npm run build
Не проверено: причина или «нет»
Следующий шаг: открыть PR в main / проверить preview / запросить production access
```

Git push означает только, что коммиты попали на GitHub. Он не подтверждает Vercel deploy, миграцию Supabase, публикацию каталога или работу production-сайта.

Vercel получает только файлы, не исключенные через `.vercelignore`. Кроме этого,
`vercel.json` пропускает deployment для commit, где не менялись runtime-пути
`src`, `public`, `prisma` и корневые build-конфиги. Поэтому изменение только
документов второго мозга сохраняется в GitHub, но не тратит отдельную сборку
Vercel. Изменение `package.json`, lock-файла или build-конфига всегда собирается.

## Если что-то не сходится

| Симптом | Действие |
| --- | --- |
| `git status` не чистый | Не менять чужие файлы, показать вывод владельцу. |
| `git pull --ff-only` не проходит | Не делать merge или rebase наугад, сначала синхронизироваться с владельцем. |
| `git push` получает `403` | Проверить, что GitHub account соразработчика добавлен в private repo с правом записи. |
| Не хватает переменной окружения | Запросить минимально необходимый доступ или использовать sandbox. Не искать чужой `.env`. |
| Vercel блокирует автора commit | Не добавлять production DB в Preview. Владелец сливает PR merge commit в `main`, затем проверяет Production deployment. |
| Нужны production-данные | Не копировать базу и credentials. Согласовать sandbox-дамп или отдельный доступ. |
