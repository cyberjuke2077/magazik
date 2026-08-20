# Исправление порядка подключения Supabase к Vercel

## 1. Задача

Разобраться, почему существующий Supabase project не находит новый Vercel project,
и дать безопасный путь без создания второй базы.

## 2. Как решали

- Проверили точные Vercel team и project, Supabase ref и текущую авторизацию CLI.
- Подтвердили, что в `cyberjuke2077s-projects` нет Marketplace installations и resources.
- Сверили текущую документацию Supabase и справку Vercel CLI 59.3.0.
- Отделили установку team-level integration от создания нового database resource.
- Запустили безопасную команду `integration accept-terms`; Vercel подтвердил, что
  AI-агент не может принять Marketplace terms за владельца.

## 3. Результат: частично

Причина найдена. Supabase не мог показать Vercel project, потому что integration
не была установлена на Vercel team. Никакая новая база не создана, env и production
данные не изменены.

Один внешний шаг остаётся за владельцем: выполнить в терминале
`vercel integration accept-terms supabase --scope cyberjuke2077s-projects`
и лично подтвердить terms. После этого Codex проверяет installation, подключение
существующего project `dbumwpnbtvixfusxnggn`, production env и deployment.

## 4. Что можно было лучше

Агент дал неверный порядок действий и отправил владельца в Supabase Dashboard
до установки интеграции в Vercel. Перед UI-инструкцией надо было сначала проверить
`vercel integration installations` и актуальную CLI-справку.

## 5. Изменения во втором мозге

- В service inventory записан правильный порядок подключения.
- В collaboration protocol добавлен отдельный troubleshooting-сценарий.
- Добавлен feedback, запрещающий `integration add` для уже существующей базы.
