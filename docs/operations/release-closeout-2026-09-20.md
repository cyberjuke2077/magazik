# Выпуск всей ветки, 2026-09-20

## Текущее состояние

[PR #26](https://github.com/cyberjuke2077/magazik/pull/26) слит merge commit
`ae1f7322fcde38525576a27387573836e4b68108`. Кодовый кандидат: `12403b0`.
Production deployment `dpl_7MeL3vd8cknDWG56oNXq1EHW8QPA` получил READY,
его Git SHA и alias `electromagaz-production.vercel.app` сверены через Vercel API.
Target: `cyberjuke2077s-projects/electromagaz-production`, project ID
`prj_RkTeKu3bIIkImfBTfU11zTzpw8bm`. Исходная ветка сохранена.

Главная, каталог, поиск `!!` и `STM32F103C8T6`, `/best`, категории API,
экспорт, `/wholesale`, `/request-list`, login и карточка
`/product/analog-devices-aduc7061bcpz32` вернули 200. `/api/health`:
`status: ok`, `database: ok`. Браузер подтвердил принятую главную, загрузку
изображений из R2 и отсутствие горизонтального overflow на desktop.

## База и backup

С явного разрешения владельца public schema/data проекта
`37Lunar's Org / 37Lunar's Project`, ref `dbumwpnbtvixfusxnggn`, сохранены
в локальные ignored-файлы `.tmp/release-preflight/production-schema.sql`
и `production-data.sql`, mode 0600. Пароли и содержимое backup в Git не входят.
Это backup приложения, не полный backup Supabase Auth, Storage или Vault.

Backup восстановлен в PostgreSQL 17 контейнера `electromagaz-release-20260920`
без сети/открытых портов, БД `emg_production_restore_20260920_v2`.
Снимок: 51 товар, 0 заявок и лидов. Репетиция трёх миграций под владельцем
объектов без SUPERUSER/BYPASSRLS прошла с rollback и commit, runtime CRUD и
anonymous denial.

В production теперь 12 Prisma migrations. Три добавленных checksum:

| Migration | SHA-256 |
| --- | --- |
| `20260917021149_submission_outbox` | `bf5e4d7e57317944166d5129c0595691db35c5b70a00fefe3dc77758372b65a1` |
| `20260917230000_add_admin_sessions` | `2bbe99bc363bda8cdb4555a0c50c96a0844ed36e57c6119ff7164ac5b3eaa0c3` |
| `20260917233000_ensure_runtime_role_grants` | `4cc9c80c2d66d97775f7a66137e1993f8707da9e64761c1bb80711dff00feb35` |

DDL и Prisma history применены вместе через migration endpoint. Production
runtime CRUD и anonymous denial проверены отдельной транзакцией с ROLLBACK;
тестовые записи не сохранены. Для SET ROLE временно внутри этой транзакции
разрешён SET postgres -> electromagaz_app; после rollback снова `set_option=false`.
Постоянного расширения прав не осталось. Runtime не имеет доступа к Vault.
Security advisor: только 3 INFO для намеренно закрытых служебных таблиц
`EnrichmentJournal`, `ImportProgress`, `_prisma_migrations`.

Первая DDL-попытка полностью откатилась из-за запрета лишнего
`ALTER ROLE ... NOSUPERUSER`. Исправление `12403b0` оставляет безопасную роль
без ALTER. Небезопасная роль не игнорируется. Исходный checksum этой ещё не
применённой production-миграции изменён; локальные тестовые БД со старым
checksum пересоздавать из seed, production history не переписывать.
Правило: [репетиция с правами target](../../ai-clone/feedback/rehearse-migrations-with-target-privileges.md).

## Уведомления и админка

В Vercel Production добавлены sensitive `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`,
`CRON_SECRET` и публичный `R2_PUBLIC_URL`. Тот же cron secret сохранён в Vault
под именем `electromagaz_notifications_cron`. Значения не публиковались.
Supabase `pg_cron` и `pg_net` включены; job `electromagaz-notifications` создан
с расписанием раз в минуту, но пока выключен. SQL: [подготовка scheduler](sql/prepare-notification-cron.sql).

Без авторизации `/api/cron/notifications` возвращает 401. Проверочный вызов
с секретом отклонён автоматической проверкой: он может обработать реальные
заявки, тогда как отдельно подтверждено одно тестовое сообщение. Запрошено
уточнение разрешения на штатную обработку очереди; до ответа job выключен,
тестовое сообщение не отправлено.

Вход в production-админку проверен браузером: создана одна AdminSession,
доступен dashboard с каталогом. Logout удалил сессию (активных снова 0);
повторное открытие `/admin` перенаправило на `/admin/login`.
Экспорт admin-cookie для replay-теста отклонён автоматической проверкой;
cookie не экспортировалась, replay в production не проверен.

## Проверки кода

- [Web CI на 12403b0](https://github.com/cyberjuke2077/magazik/actions/runs/35536688381):
  420 unit, 9 readiness, 63 E2E / 1 expected skip, lint, TypeScript, audit и build.
- [Windows smoke на 12403b0](https://github.com/cyberjuke2077/magazik/actions/runs/35536688384): success.
- После исправления миграции локальные ESLint и webpack build прошли;
  целевой Vercel deployment собран Turbopack.
- Ранее на той же функциональности: 71 локальный E2E / 1 expected skip,
  включая восемь визуальных сценариев, и 5 TLS integration. В этой сессии
  локальные визуальные эталоны не менялись и этот полный прогон не повторялся.

Дополнительное сравнение хэшей production-строк через MCP отклонено
автоматической проверкой и не выполнялось. Содержимое backup не выгружалось
в чат; восстановление, количество записей и runtime-поведение проверены.

## Следующий шаг и граница

Получить ответ на уточнение штатной обработки очереди. При разрешении:
проверить авторизованный endpoint, включить job и подтвердить ровно одно
служебное сообщение без ПДн через очередь, `sent` и HTTP 200 от pg_net.

Вне этого технического выпуска остаются российская инфраструктура и trusted
ingress, юридические реквизиты, основной домен, email-провайдер, физический
Windows-пилот и исходники поставщика. `db:publish` и enrichment не запускались.
Технический выпуск не является приёмкой коммерческого запуска.

При rollback сначала выключить scheduler. Новые таблицы, очередь и историю
миграций сохранить; не выполнять DROP. Предыдущий deployment:
`dpl_v4G1akZzcvmnPySkerm2sAxaePA2`, Git SHA `2bd5d94`.
