# Реестр внешних сервисов Electromagaz

Дата проверки: 2026-08-10

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
| GitHub `cyberjuke2077/magazik` | Исходный код, ветки, PR | `cyberjuke2077` | Write для Lunar, review и merge для владельца | `verified`: `origin/main` на `41569a5`; hotfix `2be3067` запушен в `codex/fix-new-vercel-deploy`, draft PR #14; большой enrichment PR #13 остаётся отдельным | Сначала слить минимальный PR #14 после review; PR #13 не смешивать с восстановлением deploy |
| Vercel `cyberjuke2077s-projects/magazik`, project `prj_dkYS0wmbtfKB5XR6mGECxbtSAuBQ` | Production deploy | Аккаунт `cyberjuke2077` | Owner текущего Hobby team | `partial`: PR #14 Preview получил `Ready`; на 2026-08-20 команда `integration installations` вернула `No marketplace installations found`, а production env отсутствуют | Владелец принимает Supabase Marketplace terms командой `vercel integration accept-terms supabase --scope cyberjuke2077s-projects`, затем подключает существующий Supabase project только к Production |
| Supabase `37Lunar's Org / 37Lunar's Project`, ref `dbumwpnbtvixfusxnggn` | Production PostgreSQL, заявки и лиды | Owner `37Lunar`, Administrator `cyberjuke2077` | Свои аккаунты без передачи credentials | `verified`: project `ACTIVE_HEALTHY`; Vercel integration не установлена на team, поэтому Supabase закономерно не находит Vercel project | Сначала установить integration на стороне Vercel без создания ресурса, затем в Supabase Dashboard связать project с `cyberjuke2077s-projects/magazik` |
| Локальный PostgreSQL | Источник правды каталога перед публикацией | Оператор enrichment | Локальный Docker | `verified`: 8 миграций применены; детерминированный MVP seed содержит 3 товара, 6 характеристик и 2 datasheet | Использовать `dev:local`, `build:local`, `test:e2e:local` и не подменять локальную БД Supabase |
| Cloudflare R2 | Изображения товаров и документы | `[УТОЧНИТЬ]` | Ограниченный S3 token для целевого bucket | `deferred`: владелец отложил подключение 2026-08-09 | Не включать в текущий бесплатный пакет; вернуться перед наполнением каталога |
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
- Для существующего Supabase project сначала устанавливается team-level integration
  на стороне Vercel через `integration accept-terms`. Только после этого Supabase
  Dashboard увидит Vercel team и project для внешнего подключения.
- `vercel integration add supabase` здесь запрещён: команда создаёт новый Supabase
  resource. Нужный production project `dbumwpnbtvixfusxnggn` уже существует.
- Vercel CLI запрещает AI-агенту принимать Marketplace terms. Эту команду один раз
  выполняет владелец в своём терминале, остальные проверки продолжает Codex.

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
