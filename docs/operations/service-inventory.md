# Реестр внешних сервисов Electromagaz

Дата проверки: 2026-08-27

## Назначение

Этот документ фиксирует границы внешних сервисов, необходимые доступы и способ
проверки. Секреты, токены, пароли, connection string и production-данные здесь
не хранятся.

Статусы:

- `verified` - состояние подтверждено в текущей сессии;
- `partial` - подтверждена только часть контура;
- `blocked` - для продолжения нужен доступ или решение владельца;
- `not-configured` - локальная конфигурация отсутствует;
- `decision-required` - сначала нужно принять архитектурное решение.

## Реестр

| Сервис | Назначение | Владелец доступа | Нужный доступ | Текущее состояние | Следующий шаг |
|---|---|---|---|---|---|
| GitHub `cyberjuke2077/magazik` | Исходный код, ветки, PR | `cyberjuke2077` | Write для Lunar, review и merge для владельца | `verified`: MPN importer/dry-run слит через PR #17 (`71381a6`), source fallbacks через PR #19 (`e4ab6f9`), media candidate queue через PR #21 (`9c0c585`); старый PR #13 остаётся отдельным конфликтующим draft | Image/datasheet workers и Windows launcher переносить отдельными task branch и PR; не сливать PR #13 целиком |
| Vercel `cyberjuke2077s-projects/electromagaz-production`, project `prj_RkTeKu3bIIkImfBTfU11zTzpw8bm` | Production deploy | Аккаунт `cyberjuke2077` | Owner текущего Hobby team | `verified`: deployment `SrVU71EuwKXSn7pj7T93YVXGBRH6` для merge `9c0c585` завершился `success`; root, catalog, health и карточка проверены 2026-08-27 | Сохранять Production env только на этом target; старый `magazik` не удалять до отдельной cleanup-задачи |
| Supabase `37Lunar's Org / 37Lunar's Project`, ref `dbumwpnbtvixfusxnggn` | Общая Production PostgreSQL, заявки и лиды | Owner `37Lunar`, Administrator `cyberjuke2077` | Свои аккаунты без передачи credentials | `verified`: база `ACTIVE_HEALTHY`; применены миграции rate limit и RLS; роль `electromagaz_app` без superuser и bypass RLS видит 51 товар и 22 категории | Будущие таблицы выдавать runtime-роли только явным GRANT и RLS policy после миграции |
| Локальный PostgreSQL | Источник правды каталога перед публикацией | Оператор enrichment | Локальный Docker | `verified`: 8 миграций применены; детерминированный MVP seed содержит 3 товара, 6 характеристик и 2 datasheet | Использовать `dev:local`, `build:local`, `test:e2e:local` и не подменять локальную БД Supabase |
| Cloudflare R2 | Изображения товаров и документы | `[УТОЧНИТЬ]` | Ограниченный S3 token для целевого bucket | `deferred`: parser ставит URL в pending-очередь без R2-записей; владелец отложил подключение 2026-08-09 | Отдельно перенести и проверить image/datasheet workers перед любым R2 upload |
| Telegram Bot API | Уведомления менеджеру о заявках | Владелец Electromagaz | Bot token и chat ID | `deferred`: владелец настроит самостоятельно позже | После настройки выполнить безопасное тестовое уведомление без данных покупателя |
| Email-провайдер | Подтверждения покупателю и статусы заявки | `[УТОЧНИТЬ]` | API или SMTP, доступ к DNS домена | `blocked`: провайдер не выбран | Выбрать провайдера, настроить SPF, DKIM и DMARC |
| DNS и регистратор `electromagaz.ru` | Основной домен | `[УТОЧНИТЬ]` | Управление DNS | `blocked`: DNS-записи отсутствуют | Указать владельца, добавить записи Vercel, проверить HTTPS |
| PostgreSQL FTS | Поиск MVP по каталогу | Код и Supabase | Доступ к БД и миграциям | `verified`: `/api/search` вернул ожидаемые позиции для трёх LIVE MPN 2026-07-31 | Повторять контрольные запросы в каждом Preview и Production smoke-test |
| Meilisearch | Возможный post-MVP поиск | Не требуется для MVP | Нет | `deferred`: зависимости и runtime отсутствуют, production-контур не создаётся | Возвращаться только по LIVE-метрикам качества и задержки PostgreSQL FTS |
| Mouser API | Источник enrichment | `[УТОЧНИТЬ]` | API key | `not-configured`: локальный ключ пуст | Получить ключ только перед утверждённым прогоном |
| LCSC | Источник enrichment | Оператор enrichment | Публичный источник и разрешённая частота | `partial`: клиент реализован | Проверить health перед пилотом, остановиться при блокировке |
| ChipDip | Источник enrichment | Оператор enrichment | Прокси, браузер и rate limit | `not-configured`: локальный proxy env пуст | Настроить перед пилотом, не выполнять массовый сбор |
| CAPTCHA provider | Поддержка enrichment при challenge | `[УТОЧНИТЬ]` | API key и бюджет | `not-configured`: URL есть, ключ пуст | Подключать только при подтверждённой необходимости |

Решение владельца от 2026-08-09: Cloudflare R2, Telegram и наполнение
production-каталога не входят в текущий бесплатный пакет сдачи. Это не означает,
что сервисы настроены или больше не нужны для финального коммерческого запуска.

## Подтверждённые границы

- Каталожные данные публикуются отдельно от production-заявок.
- `db:publish` не запускается как обычная проверка кода.
- Изображения должны храниться в R2, а не в Git или Supabase Storage.
- Production migrations, deploy, R2 maintenance и публикация каталога требуют
  явной задачи, проверки target environment и нужного доступа.
- `DATABASE_URL` используется приложением и как источник `db:publish`.
- `DIRECT_URL` предназначен для Prisma migration без transaction pooler.
- `PUBLISH_DATABASE_URL` является отдельной целью `db:publish` на session-порту
  5432. Скрипт отклоняет transaction pooler и совпадение источника с целью.
- После публикации скрипт сравнивает счётчики `QuoteRequest`,
  `QuoteRequestItem` и `WholesaleLead` и завершает проверку ошибкой при изменении.
- У каждого участника должны быть собственные доступы. Credentials владельца
  не копируются между машинами и не передаются в чате.
- Vercel Hobby блокирует private-repo deployment от автора commit, которого нет
  в Vercel team. Lunar открывает PR, а `cyberjuke2077` сливает его merge commit
  в `main` и проверяет Production deployment.
- Preview сейчас намеренно не получает production database credentials. Код
  не обращается к каталогу во время build, поэтому Preview может получить `Ready`,
  а database routes до подключения отдельного sandbox ожидаемо отвечают 503.
- Удаление Vercel project удаляет его env и привязки интеграций. Репозиторий GitHub
  их не хранит и не восстанавливает. Новый project нужно сверять по project ID.
- Production database уже существует в `37Lunar's Org` и используется совместно
  с Lunar. Не создавать для неё Vercel Marketplace organization, project или resource.
- `vercel integration add supabase` и `vercel integration accept-terms supabase`
  не являются текущим recovery-путём. Первый создаёт resource, второй относится
  к Marketplace installation и может создать отдельную Vercel-managed organization.
- Новый Vercel project подключён вручную к существующей базе через отдельную роль
  `electromagaz_app`. В Production заданы sensitive `DATABASE_URL` и `DIRECT_URL`.
  Роль не является superuser, не имеет DDL и получает права только на нужные
  текущие таблицы. Новые таблицы не доступны ей автоматически.
- На application-таблицах RLS остаётся включён. Миграция
  `20260820204000_add_runtime_role_rls_policies` создаёт 19 политик на 11 таблицах
  только для `electromagaz_app`. `EnrichmentJournal`, `ImportProgress` и
  `_prisma_migrations` runtime-роли недоступны.
- Пароль runtime-роли и готовые connection strings хранятся только в Vercel
  Production env. Общий пароль роли `postgres` сайту не передаётся.

## Проверка без вывода секретов

Перед запуском проверяется только наличие переменных:

```text
DATABASE_URL
DIRECT_URL
PUBLISH_DATABASE_URL
ADMIN_USERNAME
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
R2_ENDPOINT
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_PUBLIC_URL
NEXT_PUBLIC_SITE_URL
```

Значения переменных не добавляются в отчёты, логи, Git или документацию.

## Что нужно заполнить владельцу

- [x] Владелец нового Vercel project - аккаунт `cyberjuke2077`, team `cyberjuke2077s-projects`.
- [x] Владелец Supabase project - `37Lunar`; backup policy пока не подтверждена.
- [ ] Владелец домена и регистратора.
- [ ] Владелец Cloudflare account и R2 bucket.
- [ ] Получатель Telegram-уведомлений.
- [ ] Выбранный email-провайдер.
- [ ] Ответственный за enrichment и внешние API.
