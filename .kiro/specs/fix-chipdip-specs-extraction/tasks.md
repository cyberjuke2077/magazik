# Implementation Plan: Fix ChipDip Specs Extraction

## Overview

Багфикс `extractSpecifications` в `src/lib/parser/product-parser.ts`: функция не извлекает технические характеристики с реальных страниц chipdip.ru, в результате 264 артикула за последний прогон обогатителя имеют статус `chipdip_done`, но 0 записей в `Specification`. Задачи следуют bug-condition методологии: сначала закрепляем баг падающим тестом на реальной фикстуре, затем фиксим селекторы, затем обеспечиваем дозабор для уже обработанных артикулов.

## Tasks

- [x] 1. Скачать и закоммитить реальные HTML-фикстуры страниц товаров chipdip.ru
  - Создать каталог `src/lib/parser/__fixtures__/chipdip/`
  - Скачать через CloakBrowser страницы товаров `STM32F103C8T6` и `ATMEGA328P-PU` с `https://www.chipdip.ru/product/<slug>` и сохранить как `stm32f103c8t6.html` и `atmega328p-pu.html`
  - Опционально (`[ ]*`): создать вспомогательный скрипт `scripts/fetch-chipdip-fixture.ts` для воспроизводимого обновления фикстур по `--mpn`
  - Проверить, что в скачанных HTML действительно присутствует заголовок `Технические параметры` и хотя бы одна пара ключ/значение (быстрый sanity-grep)
  - Не запускать парсер на этих фикстурах в этой задаче — только скачать и зафиксировать
  - _Requirements: 1.1_

- [x] 2. Написать тест Bug Condition на реальных фикстурах chipdip.ru (BEFORE fix)
  - **Property 1: Bug Condition** — Specs извлекаются из реального HTML chipdip.ru
  - **CRITICAL**: тест ОБЯЗАН падать на текущем (unfixed) коде — падение подтверждает баг
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: surface counterexamples, демонстрирующие, что `extractSpecifications` возвращает `{}` на реальной разметке chipdip.ru
  - **Scoped PBT Approach**: для детерминированного бага property-based-генератор берёт фикстуры из `fc.constantFrom('stm32f103c8t6.html', 'atmega328p-pu.html')` — это конкретные failing cases
  - В файле `src/lib/parser/product-parser.test.ts` добавить блок `describe('extractSpecifications - chipdip real HTML')`
  - Property test: `fc.assert(fc.property(fc.constantFrom(...fixtures), (file) => { const $ = cheerio.load(read(file)); const specs = extractSpecifications($); expect(Object.keys(specs).length).toBeGreaterThan(0) }))`
  - Дополнительно — два точечных юнит-теста: для `STM32F103C8T6` ожидать ключи `Тактовая частота`, `Объём Flash`, `Корпус`; для `ATMEGA328P-PU` — `Корпус`, `Тактовая частота`, `Объём Flash`. Точные имена ключей сверить с фикстурой
  - Sanity-проверка фикстуры: убедиться, что в DOM есть `h1/h2/h3:contains("Технические параметры")` и >= 1 key/value-пара (отдельный assert до вызова `extractSpecifications`, чтобы исключить «битую» фикстуру как причину падения)
  - Запустить `pnpm test src/lib/parser/product-parser.test.ts`
  - **EXPECTED OUTCOME**: новые тесты ПАДАЮТ (это корректно — это доказывает баг). Существующие тесты `describe('extractSpecifications')` остаются зелёными
  - Записать counterexample-наблюдение: какие именно ключи ожидались, какие селекторы не сработали (это вход в task 3.1)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 2.1, 2.4_

- [x] 3. Написать preservation property-тесты (BEFORE fix)
  - **Property 2: Preservation** — Старая разметка и пустые страницы дают тот же результат
  - **IMPORTANT**: следовать observation-first methodology — сначала наблюдаем поведение F на не-buggy входах, потом утверждаем то же поведение для F'
  - В том же `product-parser.test.ts` добавить блок `describe('extractSpecifications - preservation')`
  - Property test 1 (synthetic dl): `fc.record({ keys: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }), values: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }) })` — собрать из них `<dl class="specifications"><dt>k</dt><dd>v</dd>...</dl>`, наблюдать результат на текущем коде, утверждать совпадение
  - Property test 2 (synthetic table): аналогично для `<table class="specifications">...<tr><th>k</th><td>v</td></tr>...</table>`
  - Property test 3 (synthetic .property): аналогично для `.property` / `.spec-item`
  - Property test 4 (empty pages): `fc.string()` — для произвольного HTML без характеристик `extractSpecifications` возвращает `{}`
  - Все 4 property-теста запускаются — на UNFIXED коде должны ПРОХОДИТЬ (фиксируют baseline preservation)
  - Существующие 5 unit-тестов в `describe('extractSpecifications')` НЕ трогать — они уже служат preservation-baseline'ом
  - Запустить `pnpm test src/lib/parser/product-parser.test.ts`
  - **EXPECTED OUTCOME**: новые preservation-тесты ПРОХОДЯТ (фиксируют baseline). Тесты из task 2 продолжают падать
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.7_

- [x] 4. Фикс: расширить `extractSpecifications` селекторами под актуальную разметку chipdip.ru

  - [x] 4.1 Инспекция реальной разметки и обновление списка селекторов в дизайне
    - Открыть скачанные фикстуры в `cheerio` REPL или просто в браузере (`pnpm tsx -e "import { load } from 'cheerio'; const $ = load(readFileSync('...')); ..."`)
    - Найти DOM-узел блока «Технические параметры»: его контейнер, теги внутри (`table`, `tr`, `th`, `td`, `dl`, `div`-сетка), классы
    - Зафиксировать в `design.md` (раздел `Hypothesized Root Cause` → дополнить разделом «Подтверждённая разметка») точные селекторы для chipdip — например: `#product-spec table tr`, `.product__params .row`, конкретные классы по факту
    - Обновить раздел `Fix Implementation → Specific Changes → пункт 2` точным списком селекторов
    - _Requirements: 2.1, 2.4_

  - [x] 4.2 Реализовать фикс в `src/lib/parser/product-parser.ts`
    - В `extractSpecifications` добавить ПЕРЕД существующими ветками новую chipdip-специфическую ветку: найти заголовок раздела (`h1, h2, h3, .section-title` с текстом, начинающимся на `Технические параметры` или `Параметры`), пройти по ближайшему `table`/`dl`/контейнеру с key/value
    - Добавить chipdip-специфические селекторы из task 4.1 как явные case'ы (например, `$('#product-spec table tr')`, `$('.product__params .params__item')` — по факту инспекции)
    - Добавить вспомогательную функцию `normalizeSpecText(s: string): string` — `s.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()`
    - Применить `normalizeSpecText` к ключу и значению во всех ветках
    - Дедупликация: первая непустая запись для ключа побеждает (текущее поведение через `if (!(key in specs))` явный guard, чтобы не затирать)
    - Не трогать `extractProductName`, `extractDescription`, `extractDatasheets`, `extractCategory`, `extractImages`
    - Стиль: одинарные кавычки, 2 пробела, без точек с запятой, max 100 символов (см. `AGENTS.md`)
    - Запустить `pnpm lint src/lib/parser/product-parser.ts`
    - _Bug_Condition: isBugCondition(input) where input.source = 'chipdip.ru' AND hasRealSpecificationsBlock($) AND isEmpty(extractSpecifications($))_
    - _Expected_Behavior: Property 1 из design.md — непустой результат с ожидаемыми ключами и нормализованными значениями_
    - _Preservation: все ветки старых селекторов остаются как fallback, синтетические тесты не меняются_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 4.3 Verify Bug Condition test now passes
    - **Property 1: Expected Behavior** — Specs извлекаются из реального HTML chipdip.ru
    - **IMPORTANT**: re-run the SAME test from task 2 — do NOT write a new test
    - Запустить `pnpm test src/lib/parser/product-parser.test.ts -t "chipdip real HTML"`
    - **EXPECTED OUTCOME**: тесты ПРОХОДЯТ (баг устранён)
    - Зафиксировать конкретные ключи/значения, которые теперь извлекаются для `STM32F103C8T6` и `ATMEGA328P-PU`
    - _Requirements: 2.1, 2.4_

  - [x] 4.4 Verify preservation tests still pass
    - **Property 2: Preservation** — Старая разметка и пустые страницы дают тот же результат
    - **IMPORTANT**: re-run the SAME tests from task 3 — do NOT write new tests
    - Запустить весь файл: `pnpm test src/lib/parser/product-parser.test.ts`
    - **EXPECTED OUTCOME**: все тесты проходят — и новые из task 2 и 3, и все 5 существующих в `describe('extractSpecifications')`, и тесты для остальных extract-функций
    - Подтвердить отсутствие регрессий
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 5. Дозабор specs для уже обработанных 264 артикулов
  - [x] 5.1 Документировать в `design.md` SQL-команду сброса (минимальный путь)
    - В разделе «Fix Implementation» зафиксировать готовый SQL для PostgreSQL:
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
    - Добавить инструкцию: запустить SQL в `psql`, затем `pnpm enrichment:run --resume`
    - Указать ожидаемое количество затронутых строк: ~264 (за последний прогон) или до 414 (всего `chipdip_done` за всё время — на усмотрение оператора, в зависимости от выбранного фильтра по `runId`)
    - _Requirements: 2.5_

  - [ ]* 5.2 Опциональный CLI-скрипт `scripts/enrichment-resync-specs.ts`
    - Создать TypeScript-скрипт, который вместо сброса journal заново скачивает страницы для целевых MPN и записывает только specs
    - Использовать существующий `chipdip-client.fetchProductPage` (или его публичный аналог) и `persistence-service` с новым опциональным флагом `specsOnly: true`, который пропускает обновление `name`, `description`, `datasheets`, `category`
    - Добавить команду в `package.json`: `enrichment:resync-specs`
    - Эта задача помечена как опциональная (`[ ]*`) — вариант 5.1 уже решает проблему дозабора. Скрипт нужен, только если оператор не хочет трогать `EnrichmentJournal` или хочет точечно дозабрать specs без всех остальных полей
    - _Requirements: 2.5_

- [x] 6. Checkpoint — Ensure all tests pass
  - Запустить полный набор тестов парсера: `pnpm test src/lib/parser/product-parser.test.ts`
  - Запустить `pnpm test` — все unit-тесты проекта зелёные
  - Запустить `pnpm lint` — без ошибок
  - Запустить `pnpm tsc --noEmit` — strict-режим без ошибок типов
  - Ручная верификация (опционально): `pnpm enrichment:run --limit 5 --source chipdip` на тестовом наборе MPN, проверить, что в `Specification` появились записи и `Product.enrichmentStatus` для них переходит в `complete`
  - Если возникают вопросы (например, найдена другая разметка, чем ожидалось) — задать оператору и не двигаться дальше до подтверждения


## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2", "3"] },
    { "id": 2, "tasks": ["4.1"] },
    { "id": 3, "tasks": ["4.2"] },
    { "id": 4, "tasks": ["4.3", "4.4"] },
    { "id": 5, "tasks": ["5.1", "5.2"] },
    { "id": 6, "tasks": ["6"] }
  ]
}
```

- Wave 0 — task 1 без зависимостей: скачать реальные HTML-фикстуры.
- Wave 1 — tasks 2 и 3 параллельны, обе требуют завершённый task 1 (нужны фикстуры).
- Wave 2 — task 4.1 требует tasks 2 и 3 (падающий baseline и проходящий preservation-baseline).
- Wave 3 — task 4.2 (сам фикс) после 4.1.
- Wave 4 — tasks 4.3 и 4.4 параллельны: re-run уже написанных тестов.
- Wave 5 — task 5.1 (обязательная, SQL сброс) и task 5.2 (опциональная, `[ ]*`) после фикса.
- Wave 6 — финальный checkpoint.

## Notes

- Стиль кода: одинарные кавычки, 2 пробела, без точек с запятой, max 100 символов (`AGENTS.md`).
- Не реализовывать в `chipdip-client.ts` или `persistence-service.ts` ничего нового — фикс изолирован в `extractSpecifications`. Исключение: опциональный task 5.2, где может потребоваться флаг `specsOnly` в persistence.
- ProductImage = 0 от ChipDip не трогаем — это by design (требование 7.7 в `product-data-enrichment`).
- Скачивание реальных HTML-фикстур должно происходить через CloakBrowser, а не через `fetch` — chipdip отдаёт CloudFlare-challenge для голого HTTP-клиента. Если CloakBrowser недоступен в локальном окружении — допустимо ручное сохранение страницы из браузера через DevTools → "Save as HTML".
- При обновлении фикстур в будущем (если chipdip изменит вёрстку) — повторить task 1, при необходимости расширить селекторы в task 4.2.
- В property-тестах preservation использовать одинаковый seed (`fc.assert(..., { seed: 42 })`) для воспроизводимости snapshot'ов, либо просто сравнивать F и F' напрямую — F можно импортировать из git-снапшота через мок, либо вычислить snapshot на UNFIXED коде один раз и зафиксировать в тесте.
- Если в task 4.1 окажется, что разметка chipdip уже использует один из существующих селекторов (`.specifications`, `.specs` и т.п.) — root cause не №1, и нужно вернуться к списку гипотез в `design.md` и обновить дизайн перед тем, как двигаться к 4.2.
