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
| GitHub `cyberjuke2077/magazik` | Исходный код, ветки, PR | `cyberjuke2077` | Write для Lunar, review и merge для владельца | `verified`: storefront PR #11 слит владельцем merge-коммитом `fd042cf`; runtime commit `770416a` находится в `main`; docs handoff дошел до `246e121` | Lunar работает через `feat/*`, `fix/*` или `docs/*`; Codex через `codex/*`; всё сливается PR |
| Vercel `cyberjuke2077s-projects/magazik-94yr`, project `prj_zfRDrMz1kwxJ7JPvt1xx84BeGZVy` | Production deploy | Аккаунт `cyberjuke2077` | Owner текущего Hobby team | `verified`: storefront deployment `dpl_y6TViwh3DSJDvsGJsdBdZDX3vxMX` и следующий docs-only deployment `dpl_FqedX7gvJaqTZpDxjqEK6hS2eMYK` получили `Ready`; production alias `https://magazik-94yr.vercel.app`; `/`, `/best`, `/catalog`, `/api/catalog/categories` отвечают 200 | PR Lunar сливает `cyberjuke2077` merge commit; Preview не подключать к production DB |
| Supabase `37Lunar's Org / 37Lunar's Project`, ref `dbumwpnbtvixfusxnggn` | Production PostgreSQL, заявки и лиды | Owner `37Lunar`, Administrator `cyberjuke2077` | Свои аккаунты без передачи credentials | `verified`: Vercel production подключён; `/api/health` вернул `database: ok` без записи данных; env официальной интеграции выданы только Production | Отдельно проверить backup policy, RLS и стратегию Preview branches |
| Локальный PostgreSQL | Источник правды каталога перед публикацией | Оператор enrichment | Локальный Docker | `verified`: 8 миграций применены; детерминированный MVP seed содержит 3 товара, 6 характеристик и 2 datasheet | Использовать `dev:local`, `build:local`, `test:e2e:local` и не подменять локальную БД Supabase |
| Cloudflare R2 | Изображения товаров и документы | Владелец Electromagaz | Новый bucket и ограниченный S3 token | `blocked`: доступ к прежнему bucket потерян, нужен новый target | Создать новый bucket, выдать token только на него, настроить public domain и выполнить smoke-тест |
| Telegram Bot API | Уведомления менеджеру о заявках | Владелец Electromagaz | Bot token и chat ID | `deferred`: владелец настроит самостоятельно позже | После настройки выполнить безопасное тестовое уведомление без данных покупателя |
| Email-провайдер | Подтверждения покупателю и статусы заявки | `[УТОЧНИТЬ]` | API или SMTP, доступ к DNS домена | `blocked`: провайдер не выбран | Выбрать провайдера, настроить SPF, DKIM и DMARC |
| DNS и регистратор `electromagaz.ru` | Основной домен | `[УТОЧНИТЬ]` | Управление DNS | `blocked`: DNS-записи отсутствуют | Указать владельца, добавить записи Vercel, проверить HTTPS |
| PostgreSQL FTS | Поиск MVP по каталогу | Код и Supabase | Доступ к БД и миграциям | `verified`: `/api/search` вернул ожидаемые позиции для трёх LIVE MPN 2026-07-31 | Повторять контрольные запросы в каждом Preview и Production smoke-test |
| Meilisearch | Возможный post-MVP поиск | Не требуется для MVP | Нет | `deferred`: зависимости и runtime отсутствуют, production-контур не создаётся | Возвращаться только по LIVE-метрикам качества и задержки PostgreSQL FTS |
| Mouser API | Третий источник enrichment | `[УТОЧНИТЬ]` | Рабочий Search API key | `blocked`: локальное значение является dummy-заглушкой, контрольный запрос вернул 403 | Получить рабочий key и повторить пилот одного MPN |
| LCSC | Источник enrichment | Оператор enrichment | Публичный источник и разрешённая частота | `partial`: клиент реализован | Проверить health перед пилотом, остановиться при блокировке |
| ChipDip | Источник enrichment | Оператор enrichment | Прокси, браузер и rate limit | `not-configured`: локальный proxy env пуст | Настроить перед пилотом, не выполнять массовый сбор |
| CAPTCHA provider | Поддержка enrichment при challenge | `[УТОЧНИТЬ]` | API key и бюджет | `not-configured`: URL есть, ключ пуст | Подключать только при подтверждённой необходимости |

Решение владельца от 2026-08-14: для наполнения каталога нужен новый Cloudflare
R2 bucket, потому что доступ к прежнему потерян. Создание и подключение нового
target выполняется отдельным контролируемым шагом после локального media-пилота.

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
- Preview сейчас намеренно не получает production database credentials.
- Красный PR Preview из-за невалидного `DATABASE_URL` не является падением
  Production. Не исправлять его подключением боевой БД; создать отдельный sandbox,
  если Preview станет acceptance-средой.

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
