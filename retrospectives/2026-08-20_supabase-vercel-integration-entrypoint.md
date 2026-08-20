# Исправление порядка подключения Supabase к Vercel

## 1. Задача

Разобраться, почему существующий Supabase project не находит новый Vercel project,
и дать безопасный путь без создания второй базы.

## 2. Как решали

- Проверили точные Vercel team и project, Supabase ref и текущую авторизацию CLI.
- Подтвердили, что в `cyberjuke2077s-projects` нет Marketplace installations и resources.
- Сверили текущую документацию Supabase и справку Vercel CLI 59.3.0.
- Подтвердили, что production database уже общая с Lunar и находится в
  `37Lunar's Org`, поэтому Marketplace provisioning к ней неприменим.
- Попытка `integration accept-terms` была остановлена самим Vercel до каких-либо
  изменений. После уточнения владельца этот путь исключён.

## 3. Результат: частично

Никакая новая база, organization или Marketplace resource не созданы, env и
production данные не изменены. Общий Supabase project остаётся единственной
production-базой.

Остаётся восстановить external Vercel connection для существующего project либо
вручную добавить его connection strings только в Production env нового Vercel
project. Выбор зависит от доступности connection в Supabase Dashboard.

## 4. Что можно было лучше

Агент не удержал главное ограничение: база общая с Lunar и не должна переходить
в Vercel Marketplace lifecycle. Сначала был дан неверный порядок действий, затем
предложен `accept-terms`, который тоже относится к чужому recovery-пути.

## 5. Изменения во втором мозге

- В service inventory записана граница общей Supabase-базы.
- В collaboration protocol добавлен отдельный troubleshooting-сценарий.
- Добавлен feedback, запрещающий Marketplace provisioning для общей базы.
