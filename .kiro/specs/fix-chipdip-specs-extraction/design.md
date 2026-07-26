# Fix ChipDip Specs Extraction — Bugfix Design

## Overview

Парсер `extractSpecifications` в `src/lib/parser/product-parser.ts` не извлекает технические характеристики с реальных страниц chipdip.ru: его селекторы рассчитаны на абстрактные форматы (`dl.specifications`, `table.specifications`, `.property`, `.spec-item`), которых на актуальной разметке chipdip.ru нет. В результате весь обогатитель «тихо» проходит этап ChipDip без записи specs: 264 артикула с `chipdip_done`, но 0 записей в `Specification` и все товары застревают в `enrichmentStatus = 'partial'`.

Стратегия фикса:

1. **Закрепить дефект тестом.** Скачать 1–2 живые страницы товаров chipdip.ru (например, `STM32F103C8T6`, `ATMEGA328P-PU`) через CloakBrowser, сохранить как реальные фикстуры в `src/lib/parser/__fixtures__/chipdip/`, написать property-based-тест на `extractSpecifications`. На текущем коде этот тест ОБЯЗАН падать.
2. **Изучить актуальную разметку chipdip.ru.** Открыть фикстуру в `cheerio` REPL, найти DOM-узлы с реальным блоком характеристик, выписать селекторы.
3. **Расширить `extractSpecifications` chipdip-специфическими селекторами как дополнительной попыткой.** Существующие селекторы остаются как fallback для синтетических тестов и других возможных источников.
4. **Организовать дозабор для уже обработанных артикулов.** Написать одноразовый CLI-скрипт `scripts/enrichment-resync-specs.ts` либо документированный SQL для сброса `chipdip_done → pending` для тех журналов, чьи продукты сейчас без specs.

Фикс минимальный по объёму кода (одна функция парсера), но с обязательной фикстурой реального HTML и тестом, который бы навсегда ловил регрессию.

## Glossary

- **Bug_Condition (C)**: HTML реальной страницы товара chipdip.ru, у которой в DOM присутствует блок «Технические параметры» с непустым набором key/value, передан в `extractSpecifications($)`.
- **Property (P)**: возвращаемый `Record<string, string>` непуст и содержит ожидаемые ключи параметра товара (например, `Тактовая частота` для МК), очищенные от лишних пробелов и `\u00A0`.
- **Preservation (¬C)**: HTML с синтетической разметкой существующих unit-тестов, HTML без блока характеристик, HTML других источников (LCSC/Mouser) — для всех них `extractSpecifications` возвращает то же, что возвращала до фикса.
- **F**: текущая реализация `extractSpecifications` (строки 239–278 в `product-parser.ts`).
- **F'**: расширенная реализация после фикса с дополнительными chipdip-селекторами.
- **`extractSpecifications($)`**: функция в `src/lib/parser/product-parser.ts`, принимающая `cheerio.CheerioAPI` и возвращающая `Record<string, string>`.
- **`parseProductPage(html)`**: фасад в том же файле, который вызывает все extract-функции и собирает `ParsedProduct`.
- **`chipdip-client.ts`**: `src/lib/enrichment/sources/chipdip-client.ts`, маппит `parsed.specifications` в `EnrichmentResult.specs[]` (строка 362).
- **`persistence-service.ts`**: `src/lib/enrichment/persistence/persistence-service.ts`, пишет `Specification` записи только если `result.specs.length > 0` (строка 275).
- **CloakBrowser**: npm-пакет `cloakbrowser`, drop-in замена Playwright со stealth-Chromium. Используется для скачивания живых HTML-фикстур.
- **Фикстура реального HTML**: файлы `src/lib/parser/__fixtures__/chipdip/<MPN>.html`, скачанные руками или скриптом `scripts/fetch-chipdip-fixture.ts`.
- **Дозабор specs**: операция, после которой все артикулы с `EnrichmentJournal.status = 'chipdip_done'`, у которых в `Specification` нет записей, получают свои characteristics.

## Bug Details

### Bug Condition

Баг проявляется на любой странице товара chipdip.ru, в DOM которой присутствует блок «Технические параметры» с key/value-парами. Селекторы из текущей реализации не покрывают актуальную разметку chipdip.ru: ни `dl.specifications`, ни `table.specifications`, ни `.property/.spec-item` на этих страницах не встречаются (это подтверждается тем, что 264 успешно обработанных артикула за последний прогон дали 0 записей в `Specification`).

**Formal Specification:**

```
FUNCTION isBugCondition(input)
  INPUT: input of type ChipDipProductHtml
  OUTPUT: boolean

  $ ← cheerio.load(input.html)

  RETURN input.source = 'chipdip.ru'
         AND hasRealSpecificationsBlock($)        // в DOM есть блок «Технические параметры» с >= 1 key/value
         AND isEmpty(extractSpecifications($))    // текущая F возвращает {}
END FUNCTION
```

`hasRealSpecificationsBlock($)` — оракул, реализованный в тесте: ищет любые узлы, чей текст эквивалентен `Технические параметры` (заголовок раздела), и проверяет, что в их DOM-окрестности есть таблица/список с непустыми парами `<th>/<td>` или `<dt>/<dd>` или подобной структурой.

### Examples

- `STM32F103C8T6`: на странице `https://www.chipdip.ru/product/stm32f103c8t6` присутствуют параметры `Тактовая частота: 72 МГц`, `Объём Flash: 64 КБ`, `Корпус: LQFP48`. Ожидаем, что `extractSpecifications` вернёт объект минимум с этими тремя ключами. Сейчас возвращает `{}`.
- `ATMEGA328P-PU`: на странице присутствуют `Корпус: DIP-28`, `Тактовая частота: 20 МГц`, `Объём Flash: 32 КБ`. Сейчас `{}`.
- Edge case: страница `https://www.chipdip.ru/product/<товар-без-параметров>` (если такие есть) — ожидаем `{}` и после фикса (поведение для пустого блока сохраняется).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- Извлечение имени (`extractProductName`), описания (`extractDescription`), datasheets (`extractDatasheets`), категории (`extractCategory`) — без изменений (требование 2.11 из `product-data-enrichment`).
- `extractImages` для ChipDip продолжает возвращать `[]` — by design, требование 7.7.
- Все три ветви существующих селекторов в `extractSpecifications` (`dl`, `table`, `.property/.spec-item`) сохраняются как fallback.
- `chipdip-client.ts` маппит `parsed.specifications` в `EnrichmentResult.specs[]` без изменений.
- `persistence-service.ts` применяет delete-then-insert и правила provenance (`shouldOverwrite`) без изменений.
- `computeStatus` определяет `complete` как `name && description && specs.length > 0` без изменений.

**Scope:**

Все входы, не удовлетворяющие Bug Condition (HTML без блока характеристик, синтетический HTML тестов, HTML других источников), должны давать на F' ровно тот же результат, что и на F. Конкретно:

- Синтетические фикстуры из `product-parser.test.ts` (5 существующих тестов в `describe('extractSpecifications')`).
- HTML LCSC, Mouser — на нашем коде они не вызывают `extractSpecifications` (у них собственные парсеры), но если бы вызвали, поведение должно сохраниться.
- Любой HTML без блока «Технические параметры» — возвращается `{}`.

## Hypothesized Root Cause

Из поведения системы (264 успешных `chipdip_done` и 0 записей в `Specification`) и из инспекции кода `extractSpecifications` следуют следующие гипотезы корневой причины, в порядке убывания вероятности:

1. **Несовпадение селекторов с актуальной разметкой chipdip.ru.** Самая вероятная причина. Селекторы в `extractSpecifications` (`dl.specifications`, `table.specifications`, `.property`, `.spec-item`) — это родовые имена, не основанные на реальной разметке chipdip. Скорее всего на chipdip используется собственный класс таблицы (например, `.product__group`, `.product-params`, `.tech-params`, `.parameters` или табличная разметка без отличительных классов внутри `<section id="info">`). Подтвердится после инспекции живой фикстуры.

2. **Псевдо-таблица на уровне `<div>` без `<table>`.** Возможно, chipdip рисует характеристики через `<div class="row"><div class="cell">Ключ</div><div class="cell">Значение</div></div>` без `<table>`/`<dl>` совсем — тогда ни одна из трёх веток текущего парсера не сработает.

3. **Параметры внутри `<table>` без отличительного класса**, лежащей внутри блока `<h2>Технические параметры</h2><table>...</table>`. Текущий парсер ищет `table.specifications` или `.specifications table` — без этих классов он промахивается.

4. **Лишние whitespace/`\u00A0` в ключах**, которые не отрезаются `text().trim()` корректно (маловероятно как первопричина, но как вторичный фактор после правильного селектора — реален).

5. **Контент рендерится JS уже после первого HTML.** Маловероятно — chipdip-страницы товаров отдают характеристики в server-rendered HTML (это видно из того, что `extractDescription` и `extractDatasheets` уже работают корректно, а они работают с тем же HTML).

Финальный root cause фиксируется в задаче exploration: после анализа реальной фикстуры в дизайне обновляются конкретные селекторы.

### Подтверждённая разметка (after task 1 fixture inspection)

Скачивание живого HTML chipdip.ru через `scripts/fetch-chipdip-fixture.ts` подтвердило **root cause №1** (несовпадение селекторов) и **частично №3** (table без отличительного `.specifications`-класса):

```html
<h2 class="like-header_3" id="tech_params">Технические параметры</h2>
<div class="clear">
  <div class="product__params-w">
    <div class="showhide">
      <table class="product__params  ptext" id="productparams">
        <tbody>
          <tr>
            <td class="product__param-name">Серия</td>
            <td class="product__param-value">avr atmega</td>
            <td class="product__param-checkbox">…</td>
          </tr>
          <tr>
            <td class="product__param-name">Ядро</td>
            <td class="product__param-value">avr</td>
            …
          </tr>
          …
```

**Точные селекторы для chipdip.ru** (используем в task 4.2):

- `table#productparams tr` — самая надёжная точка входа (id уникален).
- `table.product__params tr` — альтернативный (на случай, если id отсутствует на каких-то страницах).
- Внутри строки: `td.product__param-name` (ключ) + `td.product__param-value` (значение). Третья ячейка `td.product__param-checkbox` игнорируется.

Проверенные ключи в фикстурах: `Серия`, `Ядро`, `Ширина шины данных`, `Тактовая частота, МГц`, `Количество входов/выходов`, `Объем памяти программ`, `Тип памяти программ`, `Объем EEPROM`, `Объем RAM`, `Наличие АЦП/ЦАП`, `Встроенные интерфейсы`, `Встроенная периферия`, `Напряжение питания`, и т.д. Никакого `Корпус` или `Объём Flash` — это были ошибочные предположения в раннем дизайне.

## Correctness Properties

Property 1: Bug Condition — Specs извлекаются из реального HTML chipdip.ru

_For any_ HTML страницы товара chipdip.ru, содержащей непустой блок «Технические параметры» (`isBugCondition` истинно), фиксированная функция `extractSpecifications($)` SHALL возвращать непустой объект `Record<string, string>`, содержащий минимум все key/value-пары из этого блока, очищенные от лишних пробелов и неразрывных пробелов `\u00A0`, с непустыми ключами и непустыми значениями.

**Validates: Requirements 2.1, 2.2, 2.4**

Property 2: Preservation — Старая разметка и пустые страницы дают тот же результат

_For any_ HTML, не удовлетворяющего Bug Condition (синтетический HTML существующих unit-тестов, HTML без блока характеристик, HTML других источников), фиксированная функция `extractSpecifications($)` SHALL возвращать ровно тот же `Record<string, string>`, что и оригинальная функция, сохраняя извлечение через старые селекторы (`dl.specifications`, `table.specifications`, `.property`, `.spec-item`) и возвращение `{}` при отсутствии данных.

**Validates: Requirements 3.1, 3.2, 3.7**

## Fix Implementation

### Changes Required

Предполагая, что подтвердится root cause №1 (расхождение селекторов), потребуются следующие изменения. Точный список селекторов уточняется на этапе exploration.

**File**: `src/lib/parser/product-parser.ts`

**Function**: `extractSpecifications($)` (строка 239)

**Specific Changes**:

1. **Добавить chipdip-специфическую ветку перед существующими**: попытаться извлечь characteristics из таблицы внутри блока «Технические параметры». Реализация — найти заголовок (`h1`, `h2`, `h3`, `.section-title`) с текстом, начинающимся на `Технические параметры` или `Параметры`, взять следующий sibling (или ближайший потомок-`table`/`dl`), пройти по строкам.

2. **Добавить селекторы по реальным классам chipdip.ru** (подтверждены в task 1):
   - `table#productparams tr` — основной селектор (id блока характеристик)
   - `table.product__params tr` — альтернативный
   - Внутри: `td.product__param-name` → ключ, `td.product__param-value` → значение
   - `td.product__param-checkbox` игнорируется
   - Заголовок раздела: `h2#tech_params` (текст «Технические параметры») — для sanity-проверки в тестах

3. **Нормализовать ключи и значения**: применить `.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()` к ключу и значению перед записью в `specs`, чтобы устранить неразрывные пробелы и переносы строк (это решает 2.4).

4. **Дедупликация ключей**: если один и тот же ключ встретился через несколько веток селекторов, выбирается значение из первой непустой ветки (первая запись побеждает). Это поведение совместимо с текущим (Object property assignment), но фиксируется явно в комментарии.

5. **Не трогать `extractProductName`, `extractDescription`, `extractDatasheets`, `extractCategory`, `extractImages`** — изменения изолированы в `extractSpecifications`.

**File**: `src/lib/parser/__fixtures__/chipdip/`

**New Files**:

- `stm32f103c8t6.html` — фикстура реальной страницы товара. Скачивается один раз, коммитится в репо.
- `atmega328p-pu.html` — вторая фикстура для подтверждения общности селекторов.

Опционально — вспомогательный скрипт `scripts/fetch-chipdip-fixture.ts`, который через `cloakbrowser` скачивает HTML по MPN и сохраняет в `__fixtures__/chipdip/`. Скрипт нужен для воспроизводимого обновления фикстур, не для CI.

**File**: `src/lib/parser/product-parser.test.ts`

**Additions** (без изменения существующих тестов):

- Новый `describe('extractSpecifications - chipdip real HTML')` блок:
  - Property-based test (`fast-check`) — генератор выбирает одну из реальных фикстур, утверждает непустой результат и присутствие минимального набора ожидаемых ключей.
  - Несколько обычных юнит-тестов — точечная проверка конкретных ключей для `STM32F103C8T6` и `ATMEGA328P-PU`.

### Дозабор specs (минимальный путь — SQL-сброс)

После фикса остаётся 264 артикула с `EnrichmentJournal.status = 'chipdip_done'`, у которых в `Specification` нет ни одной записи. Минимальный путь дозабора — сбросить эти журналы в `pending` и прогнать обогатитель повторно:

```sql
UPDATE "EnrichmentJournal" ej
SET status = 'pending', "errorMessage" = NULL, attempts = 0
WHERE ej.status = 'chipdip_done'
  AND NOT EXISTS (
    SELECT 1 FROM "Product" p
    JOIN "Specification" s ON s."productId" = p.id
    WHERE p."mpnNormalized" = ej."canonicalMpn"
  );
```

**Инструкция оператору:**

1. Запустить SQL в `psql` напрямую:
   ```bash
   psql "$DATABASE_URL" -f resync.sql
   ```
   либо в Docker (postgres крутится в контейнере `electromagaz_db`):
   ```bash
   docker exec electromagaz_db psql -U postgres -d electromagaz -c "<SQL выше одной строкой>"
   ```
2. Убедиться, что число затронутых строк примерно соответствует ожиданию (ориентир — ~264 за последний прогон, до ~414 если не фильтровать по `runId`).
3. Запустить повторный обогатитель:
   ```bash
   pnpm enrichment:run --resume
   ```

Этот вариант — основной. Опциональный CLI-скрипт `scripts/enrichment-resync-specs.ts` (см. ниже) нужен, только если оператор не хочет трогать `EnrichmentJournal`.

### Опциональный CLI-скрипт `scripts/enrichment-resync-specs.ts`

CLI-скрипт для дозабора specs без сброса journal:

- Читает все `EnrichmentJournal` со `status = 'chipdip_done'` и `runId` за последний прогон (или с произвольным фильтром через флаги CLI).
- Для каждого джойнит `Product` по `(canonicalBrand, canonicalMpn)`. Если у продукта нет связанных `Specification` записей — переоткрывает страницу chipdip и записывает specs через тот же `persistence-service`, но с флагом `specsOnly=true`, чтобы не трогать `name`, `description`, `datasheets`, `category`.
- Помечен как опциональная задача в `tasks.md` (`[ ]*`).

## Testing Strategy

### Validation Approach

Двухфазный подход: сперва закрепляем баг падающим тестом на реальной фикстуре, затем фиксим селекторы и проверяем, что (а) новый тест зеленеет и (б) ни один существующий тест не сломался. Параллельно property-based-тест на синтетических фикстурах гарантирует, что preservation-инвариант держится для всего домена «не chipdip».

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Подтвердить или опровергнуть гипотезу о расхождении селекторов. Если гипотеза не подтвердится — понять реальную причину и обновить `Hypothesized Root Cause`.

**Test Plan**: Скачать 1–2 живые страницы товаров chipdip.ru через CloakBrowser, сохранить как фикстуры. Написать тест, который: (а) утверждает, что в DOM фикстуры действительно присутствует блок «Технические параметры» с >= 1 key/value-парой (sanity check фикстуры), (б) вызывает `extractSpecifications($)`, (в) утверждает, что результат непустой и содержит ожидаемые ключи. Запустить на UNFIXED коде — наблюдать падение.

**Test Cases**:

1. **STM32F103C8T6 fixture test** (property-based): загрузить `__fixtures__/chipdip/stm32f103c8t6.html`, в DOM-оракуле найти `h2:contains("Технические параметры")` и убедиться, что рядом есть key/value, затем `extractSpecifications` должен вернуть непустой объект, содержащий минимум ключи `Тактовая частота`, `Объём Flash`, `Корпус`. На UNFIXED коде упадёт.
2. **ATMEGA328P-PU fixture test**: аналогично, ожидаем минимум `Корпус`, `Тактовая частота`, `Объём Flash`. На UNFIXED коде упадёт.
3. **Property test (real fixtures domain)**: `fc.constantFrom(...availableChipDipFixtures)`, для каждой утверждаем `Object.keys(extractSpecifications($)).length > 0`. На UNFIXED коде упадёт на первом же примере.
4. **Edge case (sanity)**: если есть товар без характеристик — фикстура называется `<mpn>-no-params.html`, тест утверждает `{}`. Этот тест должен проходить и до, и после фикса (это уже preservation-кейс).

**Expected Counterexamples**:

- `extractSpecifications` возвращает `{}` для всех реальных фикстур.
- Возможные причины: классы блока характеристик отличаются от ожидаемых; параметры внутри `<div>`-сетки, а не `<table>`/`<dl>`; параметры внутри безымянной `<table>` без класса.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**

```
FOR ALL input WHERE isBugCondition(input) DO
  $ ← cheerio.load(input.html)
  result := extractSpecifications_fixed($)
  ASSERT Object.keys(result).length > 0
  ASSERT FOR ALL (k, v) IN result: k.length > 0 AND v.length > 0
  ASSERT FOR ALL (k, v) IN result: k = normalizeWhitespace(k) AND v = normalizeWhitespace(v)
  ASSERT expectedKeys(input) IS_SUBSET_OF Object.keys(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**

```
FOR ALL input WHERE NOT isBugCondition(input) DO
  $ ← cheerio.load(input.html)
  ASSERT extractSpecifications_original($) = extractSpecifications_fixed($)
END FOR
```

**Testing Approach**: Property-based testing рекомендован для preservation, потому что:

- Preservation — это универсальное свойство («для всех не-buggy входов»).
- Property-based testing генерирует много кейсов автоматически.
- Ловит edge-кейсы, которые ручные тесты могут пропустить.
- Даёт более сильные гарантии, что поведение не изменилось.

**Test Plan**: Перед фиксом запустить существующие unit-тесты `describe('extractSpecifications')` на UNFIXED коде, зафиксировать выходы (это уже сделано — все 5 существующих тестов зелёные). Дополнительно: написать property-based-тест с генератором синтетических HTML по трём поддерживаемым форматам и зафиксировать, что F и F' совпадают (можно прямо сравнивать с импортированной до-фиксовой ветви через snapshot).

**Test Cases**:

1. **Synthetic fixtures preservation (property-based)**: генератор `fc` создаёт случайный HTML по одному из трёх поддерживаемых форматов (`dl`, `table`, `.property`), наблюдаем результат на UNFIXED коде, сохраняем как snapshot. После фикса утверждаем, что F'(input) = snapshot для всех сгенерированных кейсов.
2. **Empty page preservation**: HTML без блока характеристик → `{}` на UNFIXED, должно остаться `{}` на FIXED.
3. **Existing unit tests preservation**: все 5 существующих тестов в `describe('extractSpecifications')` продолжают проходить без изменений.
4. **Other extractors preservation**: запустить существующие тесты для `extractProductName`, `extractDescription`, `extractDatasheets`, `extractCategory`, `extractImages` — все должны остаться зелёными.

### Unit Tests

- Точечные тесты на конкретные ключи в фикстурах `stm32f103c8t6.html` и `atmega328p-pu.html`.
- Тест на нормализацию пробелов: ключ с `\u00A0` и переносом строки даёт чистый строчный ключ.
- Тест на дедупликацию: если ключ встречается в двух разных ветках селекторов, побеждает первая непустая.
- Все существующие 5 тестов в `describe('extractSpecifications')` продолжают проходить.

### Property-Based Tests

- **Property 1 (Bug Condition)**: для каждой реальной фикстуры в `__fixtures__/chipdip/` `extractSpecifications` возвращает непустой объект и содержит ожидаемые ключи.
- **Property 2 (Preservation)**: для случайно сгенерированных синтетических HTML результат совпадает со снапшотом, снятым на UNFIXED коде.

### Integration Tests

- Не обязательны для этого багфикса (фикс изолирован в чистой функции парсера, без I/O).
- Ручная верификация: после применения фикса локально запустить `pnpm enrichment:run --limit 5 --source chipdip` на 5 MPN, проверить, что в `Specification` появились записи и `Product.enrichmentStatus` для них = `complete`.
- Альтернатива integration-теста (опционально): `chipdip-client.test.ts`, в котором HTTP-слой замокан реальной фикстурой, и утверждаем, что `EnrichmentResult.specs.length > 0`.
