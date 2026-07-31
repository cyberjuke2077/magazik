# Реестр внешних сервисов Electromagaz

Дата проверки: 2026-07-31

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
| GitHub `cyberjuke2077/magazik` | Исходный код, ветки, PR | Владелец репозитория | Write для разработчика, review для владельца | `verified`: remote настроен | Работать через `codex/*`, PR и review |
| Vercel | Preview и Production deploy | `[УТОЧНИТЬ]` | Project Developer или выше | `blocked`: CLI отсутствует, checkout не связан с Vercel project | Выдать доступ, связать проект, проверить production deployment и env |
| Supabase | Production PostgreSQL, заявки и лиды | `[УТОЧНИТЬ]` | Developer без billing и удаления проекта | `partial`: 7 миграций актуальны; `DATABASE_URL` и `DIRECT_URL` настроены, `PUBLISH_DATABASE_URL` пуст; read-only проверка session pooler прошла 2026-07-31 | Подтвердить владельца, настроить отдельную publication-цель, backup policy и тест восстановления |
| Локальный PostgreSQL | Источник правды каталога перед публикацией | Оператор enrichment | Локальный Docker | `partial`: конфигурация есть, Docker не был запущен при аудите | Поднять контейнер, проверить health и локальную Prisma-схему |
| Cloudflare R2 | Изображения товаров и документы | `[УТОЧНИТЬ]` | Ограниченный S3 token для целевого bucket | `not-configured`: локальные R2 env пусты | Подтвердить bucket, public URL и тестовую загрузку |
| Telegram Bot API | Уведомления менеджеру о заявках | `[УТОЧНИТЬ]` | Bot token и chat ID | `not-configured`: локальные env пусты | Настроить и отправить тестовое уведомление |
| Email-провайдер | Подтверждения покупателю и статусы заявки | `[УТОЧНИТЬ]` | API или SMTP, доступ к DNS домена | `blocked`: провайдер не выбран | Выбрать провайдера, настроить SPF, DKIM и DMARC |
| DNS и регистратор `electromagaz.ru` | Основной домен | `[УТОЧНИТЬ]` | Управление DNS | `blocked`: DNS-записи отсутствуют | Указать владельца, добавить записи Vercel, проверить HTTPS |
| PostgreSQL FTS | Текущий поиск по каталогу | Код и Supabase | Доступ к БД и миграциям | `verified`: публичный API поиска отвечает | Добавить контрольные MPN в release checklist |
| Meilisearch | Возможный опечатко-устойчивый поиск | `[УТОЧНИТЬ]` | Хост, ключи, индексатор | `decision-required`: заявлен в документации, runtime не настроен | Официально внедрить или удалить как неиспользуемый контур |
| Mouser API | Источник enrichment | `[УТОЧНИТЬ]` | API key | `not-configured`: локальный ключ пуст | Получить ключ только перед утверждённым прогоном |
| LCSC | Источник enrichment | Оператор enrichment | Публичный источник и разрешённая частота | `partial`: клиент реализован | Проверить health перед пилотом, остановиться при блокировке |
| ChipDip | Источник enrichment | Оператор enrichment | Прокси, браузер и rate limit | `not-configured`: локальный proxy env пуст | Настроить перед пилотом, не выполнять массовый сбор |
| CAPTCHA provider | Поддержка enrichment при challenge | `[УТОЧНИТЬ]` | API key и бюджет | `not-configured`: URL есть, ключ пуст | Подключать только при подтверждённой необходимости |

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

- [ ] Владелец Vercel project.
- [ ] Владелец Supabase project и backup policy.
- [ ] Владелец домена и регистратора.
- [ ] Владелец Cloudflare account и R2 bucket.
- [ ] Получатель Telegram-уведомлений.
- [ ] Выбранный email-провайдер.
- [ ] Ответственный за enrichment и внешние API.
