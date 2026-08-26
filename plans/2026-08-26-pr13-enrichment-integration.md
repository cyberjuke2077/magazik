# Разбиение PR #13 и перенос enrichment

Дата: 2026-08-26
Статус: в работе

## Цель

Перенести полезные изменения из draft PR #13 на свежий `main` небольшими
проверяемыми PR, не смешивая импорт MPN, внешние источники, R2, datasheet,
watermark worker, Windows launcher и Vercel build.

## Исходная точка

- `main` и `origin/main`: `4b62ff49ba52acdd43bc50cfbf7e57fe68bd4fd8`.
- PR #13 открыт как draft, имеет статус `CONFLICTING` и `DIRTY`.
- В PR #13 находятся 20 коммитов, 96 файлов и несколько независимых задач.
- Production, Supabase, R2 и внешний enrichment в этой задаче не изменяются.

## Фазы

- [x] Проверить Git refs, состояние PR #13 и конфликт с текущим `main`.
- [x] Перенести MPN-only importer, нормализацию, дедупликацию и безопасный dry-run.
- [x] Запустить целевые unit-тесты импортера и orchestration.
- [x] Запустить TypeScript, lint и production build через Webpack fallback при
  sandbox-ошибке Turbopack.
- [ ] Зафиксировать отдельный commit и подготовить PR только для importer/dry-run.
- [ ] Отдельно оценить перенос source fallbacks.
- [ ] Отдельно оценить media/datasheet/R2 pipeline.
- [ ] Отдельно оценить Windows launcher.

## Стоп-условия

- Не выполнять реальную запись enrichment в БД.
- Не обращаться к внешним источникам с платными ключами или proxy.
- Не писать в Cloudflare R2.
- Не запускать `db:publish` и не изменять production Supabase/Vercel.
- Не переписывать историю и не force-push старого PR #13.
