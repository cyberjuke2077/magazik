# Подготовка всей ветки к main, 2026-09-20

## Решение и состояние

Владелец выбрал сначала закончить зависимости всей ветки, затем выполнить
ранее разрешённые push и merge. Принятая компактная главная сохраняется.
Девять PNG уже опубликованы в R2 с отдельного разрешения и проверены по SHA-256.

Ветка: `codex/adversarial-review-20260917`. Финальный проверенный кандидат:
`9f4cfb58e1385827611fa909af84cd405aef8769`, опубликован в origin.
Принятый код с R2: `37cba51`; исправления release-проверок: `d9bf95b` и `9f4cfb5`.
Следующие commits второго мозга могут менять только документы. Результаты
CI ниже относятся именно к `9f4cfb5`, не автоматически к следующей вершине PR.
База main после свежего fetch: `2bd5d94480eb24e359a0bba10c232699ab5b88b5`.
Merge и новый production deployment не выполнены.
Ветка опубликована, открыт [draft PR #26](https://github.com/cyberjuke2077/magazik/pull/26).
GitHub web и Windows smoke прошли. Vercel checks подтверждают Preview-сборки,
не production-приёмку; Supabase Preview штатно пропущен.
При завершении проверки локальный preview на порту 3000 отвечал 200,
использовал только `emg_readiness` с отключёнными уведомлениями.

## Проверенные targets

Повторная сверка при продолжении 2026-09-20: рабочее дерево чистое,
HEAD и origin ветки совпадают на `528ddbeffc28268d98e2b3f14c7e92a791ef39cf`.
После fetch main остаётся на `2bd5d94480eb24e359a0bba10c232699ab5b88b5`.
PR #26 открыт как draft. На `528ddbe` успешно завершились
[web CI](https://github.com/cyberjuke2077/magazik/actions/runs/35535609731)
и [Windows smoke](https://github.com/cyberjuke2077/magazik/actions/runs/35535609703).
Отличия от `9f4cfb5` затрагивают только документы.
Read-only запрос подтвердил ACTIVE_HEALTHY target, PostgreSQL 17.6,
9 записей Prisma и отсутствие трёх новых таблиц. SHA-256 миграций повторно
сверены с таблицей ниже. Запросы разрешений на backup/миграции и
secrets/scheduler повторно показаны владельцу; ответа пока нет.
Production-изменения в этой сверке не выполнялись.

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
- Финальный [GitHub Storefront CI](https://github.com/cyberjuke2077/magazik/actions/runs/35532031992)
  на `9f4cfb5`: SUCCESS, 63 E2E passed / 1 expected skip, без визуальных тестов.
  Проверены audit, миграции и seed тестовой БД, lint, unit, tsc, readiness,
  production build и браузерные сценарии на `next start`.
- [Windows parser smoke](https://github.com/cyberjuke2077/magazik/actions/runs/35532031985)
  на том же SHA: SUCCESS. Это CI, не физический пилот на компьютере оператора.
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

Первый web CI на `e4bf3af` упал на неоднозначном `main` в streaming HTML;
дополнительно обнаружил обращение к `cart.items` до завершения преобразования
legacy storage. Оба ожидания исправлены, два сценария проверены по три раза
на desktop и mobile: 12 passed. Последующий полный CI `9f4cfb5` завершился
успешно, ссылки выше. Первый неуспешный запуск остаётся историей диагностики.

Предупреждения инструментов: Vitest сообщает о будущей смене загрузчика config;
Playwright/Next выводят конфликт NO_COLOR/FORCE_COLOR. Проверки не отключались.
Локально Turbopack и физический Windows-пилот в этом проходе не проверялись.

## Точные миграции

Все файлы находятся в `prisma/migrations/<name>/migration.sql`.

| Migration | SHA-256 |
| --- | --- |
| `20260917021149_submission_outbox` | `bf5e4d7e57317944166d5129c0595691db35c5b70a00fefe3dc77758372b65a1` |
| `20260917230000_add_admin_sessions` | `2bbe99bc363bda8cdb4555a0c50c96a0844ed36e57c6119ff7164ac5b3eaa0c3` |
| `20260917233000_ensure_runtime_role_grants` | `4cc9c80c2d66d97775f7a66137e1993f8707da9e64761c1bb80711dff00feb35` |

После явного подтверждения владельца backup public schema/data создан вне Git
с mode 0600 и восстановлен в изолированной PostgreSQL 17. Первая попытка DDL
полностью откатилась: Supabase запрещает лишний `ALTER ROLE ... NOSUPERUSER`.
Третья, ещё не применённая в production миграция исправлена: безопасная роль
не требует ALTER, небезопасные атрибуты не игнорируются. Поэтому её checksum
изменён относительно исторического handoff 18 сентября. Повторная репетиция
на реальном backup под администратором без SUPERUSER/BYPASSRLS прошла:
rollback, commit, runtime CRUD и anonymous denial. Локальные БД со старым
checksum требуют отдельного пересоздания из seed; production history не переписывалась.

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

Первый шаг - получить ответы на два уже отправленных запроса. Подтверждающих
ответов пока нет; просьба обновить второй мозг не закрывает эти разрешения.

1. Локальный backup схемы и данных приложения из `dbumwpnbtvixfusxnggn` в
   `/Users/lux/Desktop/projects/electromagaz/.tmp/release-preflight/production-*`
   вне Git, доступ только владельцу; проверка восстановления и применение
   трёх миграций из таблицы выше. В запросе можно выбрать только backup/restore.
2. Передача текущих `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`, нового
   `CRON_SECRET` в Vercel `electromagaz-production`; тот же cron secret в Vault
   проекта `dbumwpnbtvixfusxnggn`. После deployment - минутный scheduler.
   Одно служебное тестовое сообщение в настроенный Telegram-чат без ПДн
   включено в основной вариант ответа; предусмотрен вариант без сообщения.

После разрешений: backup/restore, три миграции с runtime-проверками,
настройки уведомлений и выключенный scheduler. Только после этого перевести
PR #26 из draft; после зелёного GitHub CI разрешённый merge в main,
проверка точного deployment SHA,
публичных маршрутов и admin session, включение cron и проверка HTTP-ответа.
Реальное тестовое Telegram-сообщение требует явного разрешения.

## Локальная точка восстановления работы

- Preview: `http://127.0.0.1:3000/`, production `next start`, не dev.
- БД E2E: контейнер `electromagaz-audit2-20260917`, порт 55434,
  база `emg_readiness`. Enrichment в неё не запускать.
- Репетиция PostgreSQL 17: контейнер `electromagaz-release-20260920`, без
  сети и открытых портов, только синтетические `emg_release` / `emg_restore`.
- Локальный wrapper `/private/tmp/emg-ui-20260920/run-local.mjs` задаёт
  тестовые env и отключает Telegram. Временные файлы могут исчезнуть; перед
  повторным запуском проверить их наличие, не подставлять production env.
- Логи текущего прохода: `.tmp/release-preflight/`; исходники PNG вне Git.
  Изображения сайта уже доступны по versioned R2 URL.
- CLI Vercel и Supabase авторизованы штатно. Наличие авторизации не заменяет
  ожидаемые разрешения на конкретные операции и не подтверждает применение.

Операционные темы вне этого merge: перенос в РФ, юридические реквизиты и
исходники поставщика остаются отдельными открытыми задачами. Не объявлять
готовность коммерческого запуска по результатам локального тестирования.

Источники для scheduler:
[Supabase pg_net](https://supabase.com/docs/guides/database/extensions/pg_net),
[Vault + cron](https://supabase.com/docs/guides/functions/schedule-functions),
[управление jobs](https://supabase.com/docs/guides/troubleshooting/pgcron-debugging-guide-n1KTaz).
