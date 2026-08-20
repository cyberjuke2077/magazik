# Пересоздание Vercel и безопасное подключение общей Supabase

## 1. Задача

Создать новый Vercel project, подключить репозиторий и существующую общую
Supabase-базу без создания второй базы и без передачи сайту общего пароля.

## 2. Как решали

- Проверили точные Vercel team и project, Supabase ref и текущую авторизацию CLI.
- Подтвердили, что в `cyberjuke2077s-projects` нет Marketplace installations и resources.
- Сверили текущую документацию Supabase и справку Vercel CLI 59.3.0.
- Подтвердили, что production database уже общая с Lunar и находится в
  `37Lunar's Org`, поэтому Marketplace provisioning к ней неприменим.
- Попытка `integration accept-terms` была остановлена самим Vercel до каких-либо
  изменений. После уточнения владельца этот путь исключён.
- Создали Vercel project `electromagaz-production` с ID
  `prj_RkTeKu3bIIkImfBTfU11zTzpw8bm` и подключили GitHub-репозиторий.
- Нашли schema drift: в production отсутствовала миграция
  `20260731190000_add_submission_rate_limit`. Применили её и записали checksum
  `7bcfc80051a51073470346d957c438b74405d841c109e2754076c2204a4cdbd6` в
  `_prisma_migrations`.
- По явному согласию владельца создали роль `electromagaz_app` с минимальными
  правами на текущие таблицы. Подключение роли через Prisma прошло успешно.
- Сохранили `DATABASE_URL`, `DIRECT_URL`, admin env и `NEXT_PUBLIC_SITE_URL`
  только в Vercel Production. Значения секретов не выводились и не попали в Git.

## 3. Результат: частично

Новая база, organization или Marketplace resource не создавались. Общий Supabase
project остаётся единственной production-базой. Новый Vercel project и Production
env настроены, Prisma runtime-доступ проверен.

Остаётся слить PR #14 владельцем, дождаться Production deployment из `main` и
выполнить HTTP smoke-test. До этого новый target нельзя считать принятым.

## 4. Что можно было лучше

Агент не удержал главное ограничение: база общая с Lunar и не должна переходить
в Vercel Marketplace lifecycle. Сначала был дан неверный порядок действий, затем
предложен `accept-terms`, который тоже относится к чужому recovery-пути.

## 5. Изменения во втором мозге

- В service inventory записана граница общей Supabase-базы.
- В collaboration protocol добавлен отдельный troubleshooting-сценарий.
- Добавлен feedback, запрещающий Marketplace provisioning для общей базы.
- Добавлен feedback о сверке production schema до выдачи runtime-прав.
