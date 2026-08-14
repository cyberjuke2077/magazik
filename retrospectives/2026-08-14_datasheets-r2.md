# Datasheets to Cloudflare R2

## 1. Задача

Убрать зависимость товарных карточек от нестабильных внешних PDF-ссылок и
гарантировать, что бинарные даташиты хранятся отдельно от PostgreSQL.

## 2. Как решали

- Persistence перестал напрямую заменять `Datasheet` внешними URL и ставит
  кандидатов в типизированную очередь `enrichmentMeta`.
- Добавлен локальный worker для старых внешних ссылок и новых кандидатов.
- Загрузчик принимает только HTTPS, проверяет DNS и каждый redirect, ограничивает
  время и размер 25 МБ, проверяет Content-Type и сигнатуру PDF.
- Валидный файл получает content-addressed SHA-256 ключ и загружается в R2.
- Запись `Datasheet` заменяется только после успешной загрузки. При ошибке старая
  ссылка остаётся в БД, а кандидат сохраняется для повтора.
- В Windows launcher добавлены просмотр очереди и пакет до 100 PDF, а также
  отдельная настройка R2 без сохранения секретов в Git.

## 3. Результат: да

- Smoke-тест R2 подтвердил чтение, запись и удаление тестового объекта.
- Dry-run локальной БД нашёл очередь старых внешних ссылок без изменений данных.
- Живой пилот `TLV70033DCKR` загрузил PDF размером 1 294 728 байт.
- Публичный R2 URL ответил HTTP 200 с `Content-Type: application/pdf`.
- Повторный dry-run пропустил обработанный товар и перешёл к следующему.
- Unit: 300/300, lint, TypeScript и production build с локальной БД прошли.
- Production Supabase не изменялась. Массовый backfill не запускался.

## 4. Что можно было лучше

- Первый патч архитектурного документа использовал неточный соседний контекст и
  штатно не применился. Следующий патч был построен по фактическим строкам файла.
- Физический запуск нового меню на чистой Windows ещё требует проверки на целевой
  машине.

## 5. Изменения во втором мозге

- `docs/business/architecture.md` закрепляет очередь, проверки PDF, R2 и правило
  атомарной замены ссылки.
- `docs/database-schema.md` явно запрещает хранить PDF bytes или base64 в БД.
- `docs/windows-parser-setup.md` описывает настройку R2 и безопасный пакетный
  запуск для человека без опыта командной строки.
- `docs/operations/service-inventory.md` хранит проверенные GitHub, Vercel и R2
  targets без credentials.
- `plans/2026-08-14-production-catalog-enrichment.md` отделяет завершённый
  PDF-контур от незавершённых image, proxy, localization и publication фаз.

## 6. Финальный handoff

### Git и доставка

- Репозиторий: `cyberjuke2077/magazik`.
- Ветка: `codex/mpn-catalog-enrichment`.
- База PR: `main`.
- Implementation commit: `76d0a072707a58d2d65c750fb8d051dafd5fc744`.
- Pull Request: `https://github.com/cyberjuke2077/magazik/pull/13`.
- Состояние на закрытии: `OPEN`, `DRAFT`, `MERGEABLE`.
- Vercel check implementation commit: `SUCCESS`.
- Supabase Preview: `SKIPPED` по принятой схеме без production DB в Preview.

### Что подтверждено

- Новый enrichment-контур находится в `src/lib/enrichment/`, legacy collector не
  подключался к production.
- Входные 11 файлов дают 75 706 строк, 17 пропусков и 67 200 уникальных MPN.
- Парсер, TUI, локальная запись карточек, ChipDip pilot и LCSC fallback проверены
  в предыдущих фазах этой ветки.
- Datasheet worker и Windows launcher входят в тот же PR.
- Финальные проверки реализации: 300/300 unit, lint, TypeScript и Next.js
  production build через webpack с локальной PostgreSQL.
- R2 S3 smoke: ListObjects, PutObject и DeleteObject прошли.
- Пилотный PDF `TLV70033DCKR`: 1 294 728 байт, публичный ответ `HTTP 200`,
  `Content-Type: application/pdf`, immutable cache.

### Что намеренно не делали

- Не запускали полный enrichment на 67 200 MPN.
- Не запускали массовый datasheet backfill.
- Не запускали массовый image worker и не загружали непроверенные фото.
- Не выполняли `db:publish` и не изменяли production Supabase.
- Не подключали production DB credentials к Vercel Preview.
- Не проверяли новый launcher физически на целевой Windows-машине.
- Не продолжали Mouser без рабочего Search API key.

### Точные хвосты

1. Владелец проверяет diff и checks PR #13 и решает, переводить ли его из draft.
2. На чистой Windows выполняются `INSTALL.cmd`, `SETUP-R2.cmd`, dry-run файлов,
   один ChipDip pilot и пункт 9 для dry-run очереди PDF.
3. После проверки результата запускается только малый PDF-пакет через пункт 10.
4. Отдельно проводится ручной QA очищенных изображений перед image worker.
5. Для английских LCSC fallback-карточек нужен процесс локализации.
6. Для Mouser нужен настоящий Search API key.
7. Только после проверки каталога отдельно согласуется `db:publish` в production.

### Первый шаг следующей сессии

Не начинать новый код. Сначала открыть PR #13, проверить его актуальный head и
checks, затем выбрать один из двух независимых контуров: физический Windows-pilot
или review и подготовка PR к merge. Массовый запуск не является первым шагом.
