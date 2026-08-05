# GitHub, Vercel, Supabase и командный workflow

## 1. Задача

Перенести проект со старой связи `electromagaz` на репозиторий
`cyberjuke2077/magazik`, подключить правильную Supabase database, получить
рабочий Vercel production и зафиксировать безопасный процесс совместной работы
`cyberjuke2077` и Lunar.

## 2. Что сделали

- Проверили remote и синхронизировали локальный репозиторий с
  `https://github.com/cyberjuke2077/magazik.git`.
- Подтвердили production Supabase target: `37Lunar's Org / 37Lunar's Project`,
  ref `dbumwpnbtvixfusxnggn`. Owner - `37Lunar`, Administrator -
  `cyberjuke2077`.
- Подключили официальный Supabase integration к единственному Vercel project
  `cyberjuke2077s-projects/magazik-94yr`.
- Подтвердили Vercel project ID `prj_zfRDrMz1kwxJ7JPvt1xx84BeGZVy`, GitHub repo
  `cyberjuke2077/magazik` и production branch `main`.
- Исправили Prisma runtime в PR #5: `DATABASE_URL` и `DIRECT_URL` получают
  fallback из `POSTGRES_PRISMA_URL` и `POSTGRES_URL_NON_POOLING` официальной
  Vercel integration.
- Слили PR #5 merge commit `147eead` и PR #6 merge commit `82b7c6d`.
- Проверили deployment `dpl_GAe5zaVhXPfdHyUykdrAfHUBc22s`: статус `Ready`,
  `/`, `/best`, `/catalog` и `/api/catalog/categories` отвечают HTTP 200.
- Обновили README, onboarding, GitHub workflow, Codex collaboration protocol и
  реестр внешних сервисов.

## 3. Итоговая схема

| Сервис | Target | Ответственный |
| --- | --- | --- |
| GitHub | `cyberjuke2077/magazik` | `cyberjuke2077` - owner, Lunar - collaborator |
| Vercel | `cyberjuke2077s-projects/magazik-94yr` | `cyberjuke2077` |
| Supabase | `37Lunar's Org / 37Lunar's Project`, ref `dbumwpnbtvixfusxnggn` | `37Lunar` - Owner, `cyberjuke2077` - Administrator |
| Production | `https://magazik-94yr.vercel.app` | deploy из `main` |

## 4. Как Lunar работает дальше

1. Обновляет `main` через `git pull --ff-only`.
2. Создаёт `feat/*`, `fix/*` или `docs/*` ветку.
3. Работает на локальном Docker PostgreSQL, не на production Supabase.
4. Запускает релевантные тесты, lint и build.
5. Пушит ветку и открывает PR в `main`.
6. `cyberjuke2077` делает review и сливает PR merge commit.
7. После merge проверяются Vercel `Ready` и production smoke-test.

Этот порядок нужен из-за Vercel Hobby: private-repo deployment от автора
commit, которого нет в Vercel team, блокируется. Production credentials не
выдаются Preview. Для рабочих Preview нужна отдельная Supabase branch или
sandbox.

## 5. Что осталось

- Подтвердить Supabase backup policy и RLS audit.
- Принять отдельное решение о Preview database и стоимости Supabase branches.
- Настроить основной домен и DNS.
- Настроить Cloudflare R2, Telegram и email provider.

Эти хвосты не блокируют текущий production deployment и командную работу через
GitHub PR.

## 6. Что не повторять

- Не считать локальный `.vercel/project.json` доказательством правильного
  remote target.
- Не создавать новый пустой Vercel project только из-за `403` старого target.
- Не передавать production database credentials в Preview ради зелёного build.
- Не считать Git push доказательством deployment или подключения БД.
