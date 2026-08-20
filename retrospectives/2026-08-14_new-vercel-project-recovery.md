# Восстановление deploy после пересоздания Vercel project

## 1. Задача

Разобраться с падением нового Vercel deployment на Prisma, запушить исправление
в общий GitHub и подготовить точный handoff без передачи секретов.

## 2. Как решали

- Сверили GitHub, Supabase и Vercel по точным ID, а не по похожим названиям.
- Подтвердили, что новый Vercel project `prj_dkYS0wmbtfKB5XR6mGECxbtSAuBQ`
  не содержит env и не подключён к Supabase integration.
- Убрали обращения каталожных страниц и `sitemap.xml` к PostgreSQL во время build.
- Исправили Prisma env fallback: отсутствующая переменная больше не превращается
  в строку `undefined`.
- Выделили минимальный hotfix от свежего `origin/main` в ветку
  `codex/fix-new-vercel-deploy`, commit `2be3067`, draft PR #14.
- Проверили unit, lint, TypeScript, локальный build без рабочей БД и Vercel Preview.

## 3. Результат: частично

Кодовая часть решена и запушена. `npm test` прошёл 253 теста, `npm run lint`,
`npm exec tsc -- --noEmit` и build с нерабочим PostgreSQL URL прошли.
Vercel Preview `dpl_8EycHqEbcP2Zy7SNrSpBesU6CJrL` получил `Ready`.

Production ещё не принят: новый Vercel project не имеет database env.
Подключить существующий Supabase project может только авторизованный пользователь
через Supabase Dashboard. До этого `/api/health` ожидаемо возвращает 503.

## 4. Что можно было лучше

- Не удалять рабочий Vercel project из-за изменений соразработчика. Общая работа
  решается ветками и PR, а удаление project уничтожает env и интеграции.
- Сразу использовать task-local npm cache при `EACCES`, не тратить попытку на
  сломанный глобальный cache.
- Shell-аргументы с `?` и glob всегда брать в кавычки. Это уже покрыто существующим
  feedback и нового дубликата не требует.

## 5. Изменения во втором мозге

- В collaboration protocol и service inventory записан новый Vercel project ID.
- В архитектуре зафиксирована request-time граница database queries при build.
- Добавлен feedback про безопасный task-local npm cache.
- Следующий шаг: в Supabase Dashboard подключить project `dbumwpnbtvixfusxnggn`
  к `cyberjuke2077s-projects/magazik` только для Production, затем слить PR #14
  и проверить Production `/`, `/best`, `/catalog`, `/api/catalog/categories`
  и `/api/health`.
