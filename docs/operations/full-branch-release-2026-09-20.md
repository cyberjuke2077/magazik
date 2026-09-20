# Подготовка всей ветки к main, 2026-09-20

## Решение и состояние

Владелец выбрал сначала закончить зависимости всей ветки, затем выполнить
ранее разрешённые push и merge. Принятая компактная главная сохраняется.
Девять PNG уже опубликованы в R2 с отдельного разрешения и проверены по SHA-256.

Ветка: `codex/adversarial-review-20260917`. Последний кодовый commit:
`d9bf95b5a973c50feb0d84dd1227bb46110961a4` (проверки релиза).
База main после свежего fetch: `2bd5d94480eb24e359a0bba10c232699ab5b88b5`.
Merge и новый production deployment не выполнены.

## Проверенные targets

| Контур | Target |
| --- | --- |
| GitHub | `cyberjuke2077/magazik` |
| Vercel | `cyberjuke2077s-projects/electromagaz-production` |
| Project ID | `prj_RkTeKu3bIIkImfBTfU11zTzpw8bm` |
| Supabase | `37Lunar's Org / 37Lunar's Project`, `dbumwpnbtvixfusxnggn` |
| PostgreSQL | Production 17.6; локальная репетиция 17 |
| Runtime role | `electromagaz_app`, LOGIN, без SUPERUSER/BYPASSRLS, членств и владения объектами |

Read-only снимок перед выпуском: 51 товар, 0 заявок, 0 строк заявок,
0 оптовых лидов. Это снимок проверки, не постоянная метрика.
В production записаны девять старых Prisma migrations; три новые таблицы
`SubmissionReceipt`, `NotificationJob`, `AdminSession` отсутствуют.

Локальный `PUBLISH_DATABASE_URL` указывает на другой, старый Supabase ref.
Не использовать его для этой задачи и не запускать `db:publish`.
Значения credentials не копировать в документы, Git или вывод команд.

## Проверки кандидата

- 420 unit tests, 52 файла.
- 14 integration tests: readiness (9) и image transport (5), только локальные
  данные и тестовый TLS. Live enrichment shutdown suite не запускался.
- Полный E2E на production-сборке: **71 passed, 1 expected mobile skip**,
  включая восемь визуальных сценариев. Эталоны не обновлялись.
- ESLint, TypeScript, `git diff --check`, webpack production build прошли.
- Проверка недоступной БД: понятная ошибка, внутренние данные не раскрыты.
- `npm audit --omit=dev` и полный audit: 0 известных уязвимостей.
- PostgreSQL 17: девять старых миграций восстановлены из синтетического
  schema backup в отдельную БД. Три новые миграции, runtime CRUD и запрет доступа
  к служебным таблицам проверены с ROLLBACK, затем с COMMIT; итог 12 миграций.

Начальные прогоны выявили гонки тестов. Теперь очередь получает явно наступивший
`nextAttempt`; E2E ждёт готовый каталог вместо CSS locator для двух streamed
шапок, завершение навигации и запись количества до reload. CI использует
`next start` после сборки. Код интерфейса этим проходом не менялся.

Предупреждения инструментов: Vitest сообщает о будущей смене загрузчика config;
Playwright/Next выводят конфликт NO_COLOR/FORCE_COLOR. Проверки не отключались.
Turbopack и физический Windows-пилот в этом проходе не проверялись.

## Точные миграции

Все файлы находятся в `prisma/migrations/<name>/migration.sql`.

| Migration | SHA-256 |
| --- | --- |
| `20260917021149_submission_outbox` | `bf5e4d7e57317944166d5129c0595691db35c5b70a00fefe3dc77758372b65a1` |
| `20260917230000_add_admin_sessions` | `2bbe99bc363bda8cdb4555a0c50c96a0844ed36e57c6119ff7164ac5b3eaa0c3` |
| `20260917233000_ensure_runtime_role_grants` | `0592395ee19c607c0e5d50b6a32c2d20db684f09dfe8f6c26fe231262b8eaac7` |

Изменения добавляют таблицы и права приложения, не удаляют существующие данные.
После применения обязательны записи `_prisma_migrations` с этими checksum,
проверки CRUD под runtime-ролью и сохранности старых разрешений/строк.
При откате приложения новые таблицы и накопленную очередь сохранять, не DROP.

## Production-подготовка ещё не выполнена

1. **Backup:** Dashboard подтвердил Free Plan без автоматических backups.
   Репетиция выше использовала синтетическую схему, не production dump.
   Штатный Supabase CLI авторизован, но попытка выгрузить public schema
   отклонена автоматической проверкой: нет отдельного подтверждения payload
   и локального destination `.tmp/release-preflight/production-schema.sql`.
   Копия не создана. Нужны разрешение, локальный backup схемы/данных приложения
   вне Git с mode 0600 и проверка восстановления до production DDL.
2. **Настройки:** в Vercel Production пока шесть старых переменных. Отсутствуют
   `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `CRON_SECRET`, `R2_PUBLIC_URL`.
   Попытка добавить их отклонена автоматической проверкой: требуется отдельное
   разрешение передать Telegram token/chat ID и новый CRON_SECRET в этот
   Vercel project. Команда не исполнялась, настройки не изменены.
3. **Миграции:** Supabase `execute_sql` возвращает read-only transaction для
   DDL. Пробная транзакция ничего не изменила. `apply_migration` ещё не
   вызывался: сначала требуется реальный backup и проверка восстановления.
4. **Scheduler:** Vercel Hobby не подходит для минутного cron. Подготовлен
   [SQL для выключенного Supabase cron](sql/prepare-notification-cron.sql),
   использующего `pg_cron`, `pg_net` и секрет из Vault. Расширения ещё не
   включены, SQL не применялся. Runtime приложения не получает доступ к Vault.
   Job вызывает endpoint только при готовых или зависших заданиях; секрет
   не записывается строкой в cron command. Включение только после deployment.
5. **Telegram:** `getMe` и `getChat` подтвердили доступность текущего бота и
   приватного чата. Сообщений не отправлено. Доставка end-to-end не проверена.

Подготовленные временные скрипты и логи находятся в ignored
`.tmp/release-preflight/`. Они не являются versioned артефактами релиза.
Не обходить отказ автоматической проверки другим инструментом.

## Следующий шаг и критерий слияния

Получить отдельное разрешение на два заблокированных направления: backup
production в локальную ignored-папку и передачу перечисленных секретов в
Vercel/Vault. Затем backup/restore, три миграции с runtime-проверками,
настройки уведомлений и выключенный scheduler. Только после этого и зелёного
GitHub CI разрешённый merge в main, проверка точного deployment SHA,
публичных маршрутов и admin session, включение cron и проверка HTTP-ответа.
Реальное тестовое Telegram-сообщение требует явного разрешения.

Операционные темы вне этого merge: перенос в РФ, юридические реквизиты и
исходники поставщика остаются отдельными открытыми задачами. Не объявлять
готовность коммерческого запуска по результатам локального тестирования.

Источники для scheduler:
[Supabase pg_net](https://supabase.com/docs/guides/database/extensions/pg_net),
[Vault + cron](https://supabase.com/docs/guides/functions/schedule-functions),
[управление jobs](https://supabase.com/docs/guides/troubleshooting/pgcron-debugging-guide-n1KTaz).
