# Разбиение PR #13 и перенос enrichment

Дата: 2026-08-26
Статус: importer/dry-run и source fallbacks перенесены отдельными срезами

## Цель

Перенести полезные изменения из draft PR #13 на свежий `main` небольшими
проверяемыми PR, не смешивая импорт MPN, внешние источники, R2, datasheet,
watermark worker, Windows launcher и Vercel build.

## Исходная точка

- Исходный `main`: `4b62ff49ba52acdd43bc50cfbf7e57fe68bd4fd8`.
- PR #13 открыт как draft, имеет статус `CONFLICTING` и `DIRTY`.
- В PR #13 находятся 20 коммитов, 96 файлов и несколько независимых задач.
- Production, Supabase, R2 и внешний enrichment в этой задаче не изменяются.

## Фазы

- [x] Проверить Git refs, состояние PR #13 и конфликт с текущим `main`.
- [x] Перенести MPN-only importer, нормализацию, дедупликацию и безопасный dry-run.
- [x] Запустить целевые unit-тесты импортера и orchestration.
- [x] Запустить TypeScript, lint и production build через Webpack fallback при
  sandbox-ошибке Turbopack.
- [x] Зафиксировать commit `5b321b4` и открыть PR #17 только для importer/dry-run.
- [x] Слить PR #17 merge-коммитом `71381a6` и проверить Production.
- [x] Отдельно оценить и перенести source fallbacks без media/R2 зависимостей.
- [ ] Отдельно оценить media/datasheet/R2 pipeline.
- [ ] Отдельно оценить Windows launcher.

## Стоп-условия

- Не выполнять реальную запись enrichment в БД.
- Не обращаться к внешним источникам с платными ключами или proxy.
- Не писать в Cloudflare R2.
- Не запускать `db:publish` и не изменять production Supabase/Vercel.
- Не переписывать историю и не force-push старого PR #13.

## Результат первого среза

- PR #17 слит в `main` merge-коммитом
  `71381a6e3f63a947492035b71e88b5b874c75bd8`.
- Vercel check текущего target `electromagaz-production` завершился `success`:
  deployment `FLnRR4ZaPMsqxWAuLjgds85AyWYc`.
- Production smoke подтвердил HTTP 200 для `/`, `/catalog`, `/api/health`,
  `/api/catalog/categories`, карточки товара и CSV export.
- Каталог отрисовал 51 позицию, export вернул заголовок и 51 строку товаров,
  `/api/health` вернул `status: ok`, `database: ok`.
- Реальный enrichment, запись в БД/R2 и `db:publish` не запускались.
- Следующая точка - новый task по parser/enrichment, начиная с отдельного аудита
  source fallbacks из старого draft PR #13.

## Результат второго среза

- PR #19 слит в `main` merge-коммитом
  `e4ab6f9a9dc72a69a48dfb5bf368f72342d8e94e`.
- Vercel check целевого `electromagaz-production` для merge завершился
  `success`: deployment `3NbdaF7ZtJcrWvcBPaKxojvZqrL5`.
- Source fallback перенесён вручную без cherry-pick старого смешанного коммита.
- Каскад ChipDip -> LCSC -> Mouser продолжает работу при health-check failure,
  runtime-block и явном пропуске источника.
- `--skip-chipdip`, `--skip-lcsc` и `--mouser-only` переводят записи журнала на
  следующий этап без зависания между очередями.
- LCSC и Mouser требуют точного совпадения нормализованного MPN.
- MPN-only карточка получает производителя только из однозначного результата;
  unresolved MPN без производителя не создаёт пустую товарную карточку.
- Английский fallback остаётся `partial` с флагом `translation_pending`.
- 287 unit-тестов, TypeScript, lint, input-only dry-run и Webpack build прошли.
- Реальные enrichment-источники, запись в БД, R2 и `db:publish` не вызывались.
- Публичный production smoke подтвердил root, catalog, health, categories,
  CSV export и карточку `ADUC7061BCPZ32-RL`.
- Следующая точка - отдельный аудит media/datasheet/R2 pipeline.
