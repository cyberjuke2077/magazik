# Requirements Document

Багфикс: извлечение технических характеристик с chipdip.ru (`extractSpecifications`)

## Introduction

Обогатитель (`pnpm enrichment:run`) штатно обрабатывает MPN с ChipDip: за последний прогон 264 артикула получили статус `chipdip_done` в `EnrichmentJournal`, в `Product` записаны имена, описания и `Datasheet` (439 записей). Однако таблица `Specification` содержит **0 записей** — ни одна техническая характеристика не сохранена.

Воспроизводимая картина в БД:

- `Product`: 470, `Datasheet`: 841, **`Specification`: 0**, `ProductImage`: 0
- `EnrichmentJournal` со статусом `chipdip_done`: 264 за последний прогон, 414 всего
- Все 201 обогащённых `Product` имеют `enrichmentStatus = 'partial'`, ни один не `complete` (по правилу из `persistence-service.ts` товар становится `complete` только при наличии specs)

Цепочка кода уже на месте и вызывается:

- `src/lib/enrichment/sources/chipdip-client.ts` вызывает `parseProductPage(html)`, читает `parsed.specifications` и маппит результат в `EnrichmentResult.specs[]`.
- `src/lib/enrichment/persistence/persistence-service.ts` пишет специи только при `result.specs.length > 0` (строка 275).
- Парсер `extractSpecifications` в `src/lib/parser/product-parser.ts` (строка 239) ищет селекторы `dl.specifications`, `table.specifications`, `.property`, `.spec-item` и т.п. Существующие unit-тесты (`describe('extractSpecifications')`) ЗЕЛЁНЫЕ, потому что используют синтетические HTML-фикстуры с этой разметкой, которой на реальном chipdip.ru нет.

Гипотеза root cause: селекторы в `extractSpecifications` не соответствуют актуальной разметке chipdip.ru — на реальной странице блок «Технические параметры» имеет другие классы/структуру, поэтому функция возвращает `{}`, в результате `result.specs.length === 0`, и persistence просто пропускает запись. Ошибки в логах нет — это «тихий» баг.

ProductImage = 0 от ChipDip — by design (требование 7.7 в `product-data-enrichment` запрещает извлекать изображения с ChipDip из-за водяных знаков). Эта спека про specs и только specs.

После фикса остаётся 264 записи `chipdip_done` без specs. Их нужно либо переобработать (сбросить в `pending` и прогнать `--resume`), либо собрать specs отдельным дозабором — план миграции данных тоже входит в скоуп этой спеки.

## Glossary

- **`extractSpecifications($)`** — функция в `src/lib/parser/product-parser.ts` (строка 239), которая по `cheerio.CheerioAPI` страницы товара возвращает `Record<string, string>` с техническими характеристиками.
- **Bug Condition (C)** — условие, при котором проявляется баг: `extractSpecifications` вызвана на HTML реальной страницы товара chipdip.ru, в DOM присутствует блок «Технические параметры» с непустым набором key/value, а функция возвращает `{}`.
- **Property (P)** — желаемое поведение для buggy-входов: возвращаемый объект непустой и содержит ожидаемые ключи (например, для `STM32F103C8T6` — `Тактовая частота`, `Объём Flash` и т.п.).
- **Preservation (¬C)** — поведение для не-buggy-входов: синтетические фикстуры существующих unit-тестов, страницы без блока характеристик, нерелевантные источники — должны давать ровно тот же результат, что и до фикса.
- **F** — текущая (unfixed) реализация `extractSpecifications`.
- **F'** — реализация после фикса.
- **Реальная фикстура** — HTML живой страницы товара chipdip.ru, скачанный через CloakBrowser и закоммиченный в `src/lib/parser/__fixtures__/chipdip/`.
- **Синтетическая фикстура** — рукописный HTML внутри `product-parser.test.ts`, который покрывает форматы `dl/dt/dd`, `table/tr/th/td`, `.property/.spec-item`.
- **Дозабор specs** — операция повторной выгрузки characteristics для тех MPN, у которых `EnrichmentJournal.status = 'chipdip_done'`, но в `Specification` нет записей для соответствующего `Product`.

## Requirements

### Требование 1: Текущее (дефектное) поведение

**User Story:** Как разработчик, поддерживающий обогатитель, я хочу зафиксировать наблюдаемое некорректное поведение `extractSpecifications` на реальном HTML chipdip.ru, чтобы у багфикса был воспроизводимый baseline.

#### Acceptance Criteria

1.1 WHEN ChipDip-клиент получает HTML реальной страницы товара chipdip.ru, содержащей блок «Технические параметры» с непустым набором характеристик, THEN `extractSpecifications($)` возвращает пустой объект `{}`.

1.2 WHEN `extractSpecifications($)` возвращает `{}`, THEN `chipdip-client` формирует `EnrichmentResult.specs = []`, и persistence-слой пропускает запись (`result.specs.length > 0` ложно), не создавая ни одной записи в таблице `Specification`.

1.3 WHEN артикул обработан без specs, THEN `Product.enrichmentStatus` остаётся `partial` (правило `complete` требует одновременно `name`, `description` и `specs`), хотя ChipDip как источник вернул всё, что обещал.

1.4 WHEN `EnrichmentJournal` получает статус `chipdip_done`, THEN журнал не отражает факт отсутствия specs — состояние «`chipdip_done` без сохранённых specs» наблюдаемо только косвенно (через JOIN с `Specification`).

1.5 WHEN запускаются существующие unit-тесты `describe('extractSpecifications')` в `product-parser.test.ts`, THEN они проходят зелёными на синтетических фикстурах (`<dl class="specifications">`, `<table class="specifications">`), маскируя реальный баг — на актуальной разметке chipdip.ru эти селекторы не срабатывают.

### Требование 2: Ожидаемое (корректное) поведение

**User Story:** Как владелец магазина, я хочу, чтобы при каждом успешном обогащении с ChipDip технические характеристики попадали в БД, чтобы карточки товаров были информативными и переходили в статус `complete`.

#### Acceptance Criteria

2.1 WHEN ChipDip-клиент получает HTML реальной страницы товара chipdip.ru, содержащей блок «Технические параметры» с непустым набором характеристик, THEN `extractSpecifications($)` SHALL возвращать непустой объект `Record<string, string>`, в котором ключи — это названия параметров (например, `Тактовая частота`, `Объём Flash`, `Корпус`), а значения — соответствующие значения с реальной страницы.

2.2 WHEN `extractSpecifications($)` возвращает непустой объект, THEN `chipdip-client` SHALL формировать `EnrichmentResult.specs[]` с сохранением порядка пар, и persistence-слой SHALL вставлять записи в таблицу `Specification` (delete-then-insert, как описано в требовании 7.7 из `product-data-enrichment`).

2.3 WHEN артикул успешно обогащён с ChipDip и persistence записал specs, THEN `Product.enrichmentStatus` SHALL переходить в `complete` при наличии `name`, `description` и непустого набора specs (поведение `persistence-service.computeStatus` не меняется — баг устраняется только в парсере).

2.4 WHEN на реальной странице chipdip.ru присутствует таблица «Технические параметры», THEN `extractSpecifications($)` SHALL извлекать минимум все строки (key/value) этой таблицы, очищая пустые ключи и пустые значения; функция SHALL быть устойчива к лишним пробелам, символам неразрывного пробела `\u00A0` и переносам строк внутри значений.

2.5 WHEN существующие 264 записи `EnrichmentJournal` со статусом `chipdip_done` за последний прогон относятся к товарам без записей в `Specification`, THEN THE Система SHALL предоставить документированный механизм дозабора характеристик: либо одноразовый SQL-сброс соответствующих journal-записей в `pending` для повторного прогона через `pnpm enrichment:run --resume`, либо отдельный CLI-скрипт `pnpm enrichment:resync-specs`, который заново скачивает страницы и записывает только specs, не трогая остальные поля.

### Требование 3: Сохранение существующего поведения (regression prevention)

**User Story:** Как разработчик, я хочу, чтобы багфикс не сломал ни синтетические unit-тесты, ни уже работающие части обогатителя.

#### Acceptance Criteria

3.1 WHEN HTML страницы содержит синтетическую разметку из существующих unit-тестов (`<dl class="specifications">`, `<table class="specifications">`, `.property` / `.spec-item`), THEN `extractSpecifications($)` SHALL CONTINUE TO извлекать характеристики через эти селекторы — то есть существующие селекторы остаются как fallback, и все тесты в `describe('extractSpecifications')` продолжают проходить без изменений.

3.2 WHEN HTML страницы не содержит ни одной поддерживаемой разметки характеристик, THEN `extractSpecifications($)` SHALL CONTINUE TO возвращать пустой объект `{}` без выброса исключений (поведение «нет данных — нет ошибки» сохраняется).

3.3 WHEN ChipDip-клиент извлекает имя, описание, datasheets и категорию (требование 2.11 в `product-data-enrichment`), THEN THE Система SHALL CONTINUE TO извлекать эти поля без изменений — фикс затрагивает только специи.

3.4 WHEN ChipDip-клиент работает с разметкой страницы, THEN THE Система SHALL CONTINUE TO НЕ извлекать изображения (`extractImages` для ChipDip возвращает `[]` — by design, требование 7.7).

3.5 WHEN обогатитель пишет результат в БД, THEN persistence-слой SHALL CONTINUE TO применять delete-then-insert для `Specification` и правила provenance (`shouldOverwrite`) — поведение `persistence-service.ts` не меняется.

3.6 WHEN persistence-слой определяет статус товара через `computeStatus`, THEN правило «`complete` требует name + description + непустой набор specs» SHALL CONTINUE TO действовать без изменений — переход `partial → complete` после фикса происходит сам собой за счёт того, что specs наконец появляются.

3.7 WHEN запускается существующий тест-сьют `pnpm test src/lib/parser/product-parser.test.ts`, THEN все ранее проходившие тесты SHALL CONTINUE TO проходить (синтетические фикстуры не трогаем, новые селекторы добавляются как дополнение, а не как замена).
