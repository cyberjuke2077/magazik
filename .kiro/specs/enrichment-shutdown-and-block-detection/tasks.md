# Implementation Plan: Enrichment Shutdown & Block Detection

## Overview

Багфикс двух связанных проблем в `src/lib/enrichment/`:

- **Бaг A:** при SIGINT/SIGTERM/uncaughtException Chromium-процессы остаются висеть. Фикс — расширить `closeAllBrowsers(timeoutMs)` и добавить SIGKILL-fallback через публичный `browser.process()?.pid`; в orchestrator реализовать оформленный shutdown-пайплайн.
- **Баг B:** `isBlocked` ловит ложноположительные срабатывания через `String.includes('captcha' | 'access denied')`. Фикс — переписать на cheerio-селекторы и явные индикаторы (cf-headers, challenge-form, title-match, /cdn-cgi/) с возвратом `reason`-кода.

Задачи следуют bug-condition методологии: сначала закрепляем оба бага падающими exploration-тестами на UNFIXED коде, затем фиксим, затем верифицируем. Дополнительно — SQL-скрипт для дозабора 4 уже существующих `chipdip_blocked`-записей.

Баги изолированы по файлам: фикс A живёт в `browser-registry.ts` + `orchestrator.ts`, фикс B — в `chipdip-client.ts`. Их можно делать в одном PR или разнести — по усмотрению автора. Граф зависимостей отражает, что exploration A и exploration B независимы.

## Tasks

- [x] 1. Подготовить инфраструктуру для интеграционного теста shutdown (Bug A exploration prerequisite)
  - Завести каталог `tests/integration/` (если его нет в проекте) и `vitest.integration.config.ts` с пометкой `tags: ['@integration']`, чтобы интеграционные тесты не подмешивались в `pnpm test`
  - Добавить в `package.json` команду `"test:integration": "vitest --run --config vitest.integration.config.ts"`
  - Завести helper `tests/integration/helpers/process-snapshot.ts` с функциями `snapshotChromiumPids(): Promise<number[]>` (через `pgrep -lf 'chrome|chromium|cloakbrowser'`) и `diffOrphans(before: number[], after: number[]): number[]`
  - Не запускать никакие тесты в этой задаче — только инфраструктура
  - _Requirements: 1.1, 1.2_

- [x] 2. Подготовить HTML-фикстуры легитимных chipdip-страниц для Bug B exploration
  - Создать каталог `src/lib/enrichment/sources/__fixtures__/chipdip-legitimate/`
  - Скачать через CloakBrowser/DevTools и закоммитить минимум 4 HTML-фикстуры:
    - `arduino-captcha-shield.html` — реальная страница товара ChipDip с CAPTCHA-функциональностью (слово `captcha` в `<title>`, `<h1>`, описании)
    - `module-access-control.html` — товар с `access denied` в SEO/описании/alt-тексте
    - `chipdip-page-with-recaptcha-footer.html` — обычная страница со скриптом Google reCAPTCHA в форме обратной связи (упоминание `captcha` в footer)
    - `page-with-captcha-in-meta.html` — страница с `captcha` в meta-description или в названии товара
  - Если CloakBrowser не доступен локально — допустимо ручное «Save as HTML» из браузера, опционально вырезать только секции с триггерными словами + минимальный обвес `<html><body>`
  - Sanity-grep: убедиться, что в каждой фикстуре действительно встречается `captcha` или `access denied` в текстовом содержимом (не только в комментариях/скриптах cloudflare)
  - Sanity-grep: убедиться, что НИ В ОДНОЙ из фикстур нет `form#challenge-form`, `div#cf-challenge-running`, `iframe[src*="cloudflare"]`, title с `Just a moment` — эти фикстуры по определению легитимны
  - Не запускать парсер на этих фикстурах в этой задаче — только подготовить файлы
  - Дополнительно создать каталог `src/lib/enrichment/sources/__fixtures__/chipdip-blocked/` и положить туда минимум 2 HTML-фикстуры реальной блокировки (можно сгенерировать вручную):
    - `cf-challenge-form.html` — `<html><head><title>Just a moment...</title></head><body><form id="challenge-form" action="/cdn-cgi/...">...</form></body></html>`
    - `cf-iframe.html` — `<html><body><iframe src="https://challenges.cloudflare.com/captcha"></iframe></body></html>`
  - _Requirements: 1.5, 1.6, 1.7_

- [x] 3. Написать exploration test для Bug A (shutdown orphan detection) — BEFORE fix
  - **Property 1: Bug Condition** — Graceful Shutdown Kills All Chromium
  - **CRITICAL**: тест ОБЯЗАН падать на текущем (unfixed) коде — падение подтверждает баг
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: surface counterexamples (orphaned Chromium-процессы после SIGINT)
  - **Scoped PBT Approach**: для детерминированного бага property-based-генератор берёт малое число сценариев из `fc.constantFrom('SIGINT', 'SIGTERM')` × `fc.constantFrom(1, 2)` (mpnsCount), `numRuns: 3` — это конкретные failing cases, не множить
  - Создать файл `tests/integration/enrichment-shutdown.test.ts`
  - Структура теста:
    ```ts
    it('SIGINT during enrichment leaves no orphaned Chromium processes', async () => {
      const before = await snapshotChromiumPids()
      const child = spawn('pnpm', ['tsx', 'src/scripts/enrichment-run.ts',
        '--limit', '2', '--source', 'chipdip', '--skip-mouser', '--skip-lcsc'])
      await waitForLog(child, 'chipdip_healthcheck_ok')
      await sleep(5000)
      child.kill('SIGINT')
      await waitForExit(child, 30_000)
      const after = await snapshotChromiumPids()
      expect(diffOrphans(before, after)).toEqual([])
    })
    ```
  - Дополнительно: `it('SIGTERM also leaves no orphans')`, `it('double SIGINT still completes shutdown')`
  - Property test: `fc.assert(fc.property(fc.constantFrom('SIGINT', 'SIGTERM'), fc.constantFrom(1, 2), async (signal, mpnsCount) => {...}), { numRuns: 3 })`
  - Запустить `pnpm test:integration tests/integration/enrichment-shutdown.test.ts`
  - **EXPECTED OUTCOME**: тест ПАДАЕТ (это корректно — это доказывает баг). Записать в комментарий тест-файла или в `design.md` конкретные orphan-pid'ы и их `ps -fp <pid>` для понимания root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.9_

- [x] 4. Написать exploration test для Bug B (false positive isBlocked) — BEFORE fix
  - **Property 2: Bug Condition** — Block Detection Uses Structural Indicators Only
  - **CRITICAL**: тест ОБЯЗАН падать на текущем (unfixed) коде
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: surface counterexamples (легитимные страницы со словами captcha/access denied, на которых текущий isBlocked даёт true)
  - **Scoped PBT Approach**: property-based-генератор берёт фикстуры через `fc.constantFrom(...legitimateFixtures)` — это конкретные failing cases
  - В файле `src/lib/enrichment/sources/chipdip-client.test.ts` (создать, если ещё нет, или дописать к существующему) добавить блок `describe('isBlocked / detectBlock - legitimate pages')`
  - Property test:
    ```ts
    const legitimateFixtures = [
      'arduino-captcha-shield.html',
      'module-access-control.html',
      'chipdip-page-with-recaptcha-footer.html',
      'page-with-captcha-in-meta.html',
    ]
    it('returns false for legitimate chipdip pages with substring captcha/access-denied', () => {
      fc.assert(
        fc.property(fc.constantFrom(...legitimateFixtures), (file) => {
          const html = readFileSync(`src/lib/enrichment/sources/__fixtures__/chipdip-legitimate/${file}`, 'utf-8')
          // Тест вызывает текущий isBlocked напрямую (если он экспортирован) или через
          // временный экспорт. На F вернёт true → тест упадёт.
          expect(isBlocked(200, html)).toBe(false)
        }),
        { numRuns: 50 },
      )
    })
    ```
  - Если `isBlocked` сейчас не экспортирован — временно экспортировать его из `chipdip-client.ts` ИЛИ написать тест через прокси (например, через `searchMpn` с замоканным `page.goto`, возвращающим фикстуру). Предпочтителен прямой экспорт `isBlocked` (минимальное изменение, рефактор приватной функции в экспортируемую — не меняет поведение)
  - Дополнительно — точечные unit-кейсы для каждой фикстуры с понятным описанием
  - Запустить `pnpm test src/lib/enrichment/sources/chipdip-client.test.ts -t "legitimate"`
  - **EXPECTED OUTCOME**: новые тесты ПАДАЮТ для всех 4 фикстур. Существующие тесты `chipdip-client.test.ts` (если есть) — зелёные. Записать counterexamples (для каждой фикстуры — где встретилось триггерное слово)
  - Mark task complete when test is written, run, and failures documented
  - _Requirements: 1.5, 1.6, 1.7, 2.6, 2.8_

- [x] 5. Написать preservation property-тесты для Bug A — BEFORE fix
  - **Property 3: Preservation** — Happy-Path Shutdown Behavior
  - **IMPORTANT**: следовать observation-first methodology — наблюдать поведение F на не-buggy входе (штатное завершение), затем утверждать то же поведение для F'
  - В том же `tests/integration/enrichment-shutdown.test.ts` добавить блок `describe('happy-path shutdown')`
  - Test 1: `it('normal completion exits with code 0 within budget')` — запустить пайплайн с `--limit 1` (или `--dry-run`), без SIGINT, дождаться `exit`, утверждать `exitCode === 0` и `durationMs < 30_000`
  - Test 2: `it('normal completion leaves no orphaned processes')` — тот же сценарий, после exit — snapshot pids, `diffOrphans` пустой
  - Property test: `fc.assert(fc.property(fc.constantFrom(1, 2), async (mpnsCount) => {...}), { numRuns: 2 })` — несколько мелких happy-path сценариев
  - Дополнительно: `it('existing orchestrator tests still pass')` — запустить `pnpm test src/lib/enrichment/orchestrator.test.ts` если такой существует, убедиться, что зелёные
  - Запустить `pnpm test:integration` + `pnpm test src/lib/enrichment/`
  - **EXPECTED OUTCOME**: все preservation-тесты проходят на UNFIXED коде. Тест из task 3 продолжает падать
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 6. Написать preservation property-тесты для Bug B — BEFORE fix
  - **Property 4: Preservation** — Real Blocks Still Detected
  - **IMPORTANT**: observation-first — наблюдаем `isBlocked` для positive cases на UNFIXED коде, фиксируем как baseline
  - В `chipdip-client.test.ts` добавить блок `describe('isBlocked - real blocks preserved')`
  - Test 1: `it('returns true for HTTP 403')` — `expect(isBlocked(403, anyHtml)).toBe(true)`
  - Test 2: `it('returns true for cloudflare challenge form')` — фикстура `cf-challenge-form.html` из task 2 → `expect(isBlocked(200, html)).toBe(true)` (на UNFIXED коде это тоже даёт true — через слово `captcha` в challenge-странице, случайно правильно. Фиксируем baseline)
  - Test 3: `it('returns true for cf-iframe page')` — фикстура `cf-iframe.html` → true
  - Test 4: `it('returns false for empty html')` — `expect(isBlocked(200, '')).toBe(false)`
  - Property test (synthetic non-blocked): генерировать HTML без cloudflare-DOM-маркеров через `fc.string()` + опционально подмешанные `captcha`/`access denied`. ВАЖНО: на UNFIXED коде этот property-test ПАДАЕТ (потому что `lower.includes` ловит подмешанные слова) — поэтому здесь preservation НЕ через автогенерацию синтетики, а только через 4 ручных positive case'а выше + `it('returns false for empty html')`. Property-test для синтетических non-blocked страниц переедет в task 9 как валидация фикса (поведение F' для таких входов; от F мы здесь ничего не наследуем, потому что F багует именно на этих входах)
  - Запустить `pnpm test src/lib/enrichment/sources/chipdip-client.test.ts`
  - **EXPECTED OUTCOME**: все 4 preservation-теста проходят на UNFIXED коде (фиксируют baseline для positive cases). Тесты из task 4 продолжают падать
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 7. Фикс A: Расширить `closeAllBrowsers(timeoutMs)` и SIGKILL-fallback в `browser-registry.ts`

  - [x] 7.1 Реализовать `closeAllBrowsers(timeoutMs = 5000)` с SIGKILL-fallback
    - Открыть `src/lib/enrichment/browser-registry.ts`
    - Расширить сигнатуру: `export async function closeAllBrowsers(timeoutMs = 5000): Promise<void>`
    - Реализация:
      - snapshot `Array.from(activeBrowsers)`, `activeBrowsers.clear()`
      - для каждого `browser` запустить `Promise.race([browser.close().then(() => 'closed'), sleep(timeoutMs).then(() => 'timeout')])`
      - `Promise.allSettled` всех гонок
      - для тех, у кого результат `'timeout'` — попытаться `browser.process()?.kill('SIGKILL')`; если `pid` отсутствует — `console.warn('[browser-registry] could not SIGKILL: no pid')`
      - все ошибки `browser.close()` логировать через `console.warn` (не глотать молча), но не выбрасывать
      - функция идемпотентна, exception-free
    - Заменить `syncForceClose` на использование публичного `browser.process()?.kill('SIGKILL')` вместо приватного `(browser as any)._process`
    - Обратная совместимость: вызов `closeAllBrowsers()` без параметра использует дефолт 5000 мс — это эквивалентно для штатного happy-path
    - Стиль: одинарные кавычки, 2 пробела, без точек с запятой, max 100 символов (`AGENTS.md`)
    - Запустить `pnpm lint src/lib/enrichment/browser-registry.ts`
    - _Bug_Condition: isBugConditionA — SIGINT/SIGTERM/uncaughtException → orphans_
    - _Expected_Behavior: Property 1 — все Chromium завершаются за конечное время через close или SIGKILL_
    - _Preservation: штатный close (rotateSession/relaunchWithProxy/нормальное завершение) укладывается в 5000 мс_
    - _Requirements: 2.1, 2.4, 2.5, 3.7_

  - [x] 7.2 Опционально: вынести единый shutdown-pipeline `shutdownWithCleanup(opts)` в browser-registry
    - В `browser-registry.ts` экспортировать функцию:
      ```ts
      export async function shutdownWithCleanup(opts: {
        signal?: string
        code?: number
        inFlightTimeoutMs?: number
        closeTimeoutMs?: number
        waitInFlight?: () => Promise<void>
      }): Promise<void>
      ```
    - Реализация:
      - если `waitInFlight` задан: `await Promise.race([waitInFlight(), sleep(opts.inFlightTimeoutMs ?? 10_000)])`
      - `await closeAllBrowsers(opts.closeTimeoutMs ?? 5000)`
      - `process.exit(opts.code ?? 0)`
    - Идемпотентность: использовать модульный флаг `isShuttingDown`, второй вызов сокращает таймауты до 1000 мс и пропускает in-flight wait
    - Эта задача опциональна (`[ ]*`) — orchestrator может реализовать pipeline у себя; но единая точка снижает дублирование и упрощает тестирование
    - _Requirements: 2.2, 2.3_

  - [x] 7.3 Обновить `installExitHandlers` чтобы использовать новый pipeline
    - В `installExitHandlers`:
      - `uncaughtException` / `unhandledRejection` → вызывать `shutdownWithCleanup({ code: 1, signal: reason })` (или прямой эквивалент, если task 7.2 пропущена: `closeAllBrowsers(5000).then(() => process.exit(1))`)
      - `process.on('exit')` → синхронный путь: для каждого `browser` сделать `browser.process()?.kill('SIGKILL')` через публичный API. Не использовать приватное `_process`
    - _Requirements: 2.3, 2.4_

  - [x] 7.4 Написать unit-тесты для `closeAllBrowsers` с mock-браузерами
    - Создать `src/lib/enrichment/browser-registry.test.ts` (если нет)
    - Mock `Browser`: `{ close: vi.fn().mockResolvedValue(undefined), process: vi.fn().mockReturnValue({ kill: vi.fn(), pid: 12345 }) }`
    - Test 1: «closes fast browsers within timeout» — все mock-браузеры закрылись, `kill` не вызван
    - Test 2: «SIGKILLs hanging browser after timeout» — mock-браузер с `close.mockReturnValue(new Promise(() => {}))` (never resolves), таймаут 100 мс, после таймаута `kill('SIGKILL')` вызван
    - Test 3: «idempotent: second call does nothing» — двойной вызов не падает
    - Test 4: «no pid → warn but no throw» — mock с `process.mockReturnValue(undefined)`, проверить через spy на `console.warn`
    - Запустить `pnpm test src/lib/enrichment/browser-registry.test.ts`
    - _Requirements: 2.5_

- [x] 8. Фикс A: Реализовать shutdown-pipeline в `orchestrator.ts`

  - [x] 8.1 Реализовать `gracefulShutdown(signal)` в `runEnrichmentPipeline`
    - В `orchestrator.ts` внутри `runEnrichmentPipeline` (или как extracted-функцию):
      ```
      async function gracefulShutdown(signal: string): Promise<void> {
        if (shuttingDown) {
          // повторный SIGINT — сокращаем таймауты
          await closeAllBrowsers(1000)
          process.exit(signal === 'SIGINT' ? 130 : 1)
        }
        shuttingDown = true
        shutdownRequested = true
        logger.info({ event: 'shutdown_step', step: 'flag_set', durationMs: 0 })
        await Promise.race([Promise.allSettled(activeLoops), sleep(IN_FLIGHT_TIMEOUT_MS)])
        logger.info({ event: 'shutdown_step', step: 'in_flight_drained' })
        await closeAllBrowsers(CLOSE_TIMEOUT_MS)
        logger.info({ event: 'shutdown_step', step: 'browsers_closed' })
        progress.stop()
        process.exit(signal === 'SIGINT' ? 130 : 0)
      }
      ```
    - Где `IN_FLIGHT_TIMEOUT_MS = 10_000`, `CLOSE_TIMEOUT_MS = 5_000`
    - Трекать `activeLoops: Promise<void>[]` — это массив, который сейчас собирается перед `await Promise.all(loops)`. Сохранить ссылку, чтобы `gracefulShutdown` мог дождаться их завершения после shutdown-флага
    - `handleShutdown('SIGINT' | 'SIGTERM')` теперь вызывает `gracefulShutdown(signal)` (через `void` — обработчик синхронный)
    - В `finally`-блоке `runEnrichmentPipeline` — оставить только `closeAllBrowsers(5000)` как safety-net, а основной cleanup вынесен в `gracefulShutdown`. Альтернатива: `finally` тоже вызывает `gracefulShutdown('normal-completion')`, чтобы оба пути шли через один pipeline
    - Стиль `AGENTS.md`. `pnpm lint src/lib/enrichment/orchestrator.ts`
    - _Bug_Condition: isBugConditionA — SIGINT во время in-flight операции_
    - _Expected_Behavior: Property 1 — закончить все loops с таймаутом 10 сек, потом закрыть браузеры с таймаутом 5 сек, потом process.exit_
    - _Preservation: штатное завершение по окончании очереди продолжает работать через тот же pipeline_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.6_

  - [x] 8.2 Обновить unit-тесты orchestrator (если есть `orchestrator.test.ts`)
    - Если `src/lib/enrichment/orchestrator.test.ts` существует — добавить тест на `gracefulShutdown`: установить флаг shutdown, дождаться завершения loops, проверить порядок логов `shutdown_step`
    - Mock `process.exit` через `vi.spyOn(process, 'exit').mockImplementation(...)`
    - Запустить `pnpm test src/lib/enrichment/orchestrator.test.ts`
    - _Requirements: 2.2, 3.5, 3.6_

- [x] 9. Фикс B: Переписать `isBlocked` на структурный детект через cheerio
  - В `src/lib/enrichment/sources/chipdip-client.ts`:
    - Добавить тип:
      ```ts
      type BlockReason =
        | 'http-403'
        | 'http-503-cf'
        | 'cf-challenge-form'
        | 'cf-challenge-running'
        | 'cf-iframe'
        | 'title-match'
        | 'cdn-cgi-redirect'

      interface BlockResult { blocked: boolean; reason?: BlockReason }
      ```
    - Реализовать новую функцию (экспортировать для тестов):
      ```ts
      export function detectBlock(args: {
        status: number
        html: string
        headers?: Record<string, string>
        finalUrl?: string
      }): BlockResult
      ```
    - Логика (первый матч побеждает, в строгом порядке):
      1. `status === 403` → `{ blocked: true, reason: 'http-403' }`
      2. `status === 503` И в `headers` есть любой ключ, начинающийся с `cf-` (case-insensitive) → `'http-503-cf'`
      3. `finalUrl?.includes('/cdn-cgi/')` → `'cdn-cgi-redirect'`
      4. `cheerio.load(html)`:
         - `$('form#challenge-form').length > 0` → `'cf-challenge-form'`
         - `$('div#cf-challenge-running').length > 0` → `'cf-challenge-running'`
         - `$('iframe[src*="captcha"], iframe[src*="cloudflare"]').length > 0` → `'cf-iframe'`
         - `$('title').text().toLowerCase()` matches `/cloudflare|just a moment|access denied|доступ ограничен/` → `'title-match'`
      5. иначе → `{ blocked: false }`
    - Удалить старую `isBlocked` (или оставить как тонкий wrapper `isBlocked(status, html) = detectBlock({status, html}).blocked` для обратной совместимости с существующими тестами — на усмотрение, проще удалить и переписать call-sites)
    - Обновить call-sites в `searchMpn` и `healthCheck`:
      - `const headers = response.headers()` (Playwright API)
      - `const finalUrl = response.url()`
      - `const block = detectBlock({ status, html, headers, finalUrl })`
      - При `block.blocked`:
        - `throw new Error(`ChipDip blocked (403/CAPTCHA): ${block.reason}`)` — формат ошибки сохраняет regex-match `'ChipDip blocked (403/CAPTCHA)'` в orchestrator
        - в orchestrator при `chipdip_blocked`: `logger.warn({ event: 'chipdip_blocked', ..., reason: block.reason })` и в `journal.updateStatus(..., 'chipdip_blocked', `reason=${block.reason}`)` (передаём reason в `errorMessage`)
    - Не трогать `spawn`, `teardown`, `relaunchWithProxy`, `rotateSession`, остальную логику
    - Стиль `AGENTS.md`. `pnpm lint src/lib/enrichment/sources/chipdip-client.ts`
    - _Bug_Condition: isBugConditionB — HTML 200 с словом captcha/access-denied без cf-маркеров_
    - _Expected_Behavior: Property 2 — detectBlock возвращает false для всех таких входов; reason возвращается для positive cases_
    - _Preservation: HTTP 403 → true с reason='http-403'; cloudflare-challenge → true с правильным reason; пустой HTML → false_
    - _Requirements: 2.6, 2.7, 2.8, 3.2, 3.3, 3.4_

- [x] 10. Verify Bug A exploration test now passes
  - **Property 1: Expected Behavior** — Graceful Shutdown Kills All Chromium
  - **IMPORTANT**: re-run the SAME test from task 3 — do NOT write a new test
  - Запустить `pnpm test:integration tests/integration/enrichment-shutdown.test.ts`
  - **EXPECTED OUTCOME**: все тесты ПРОХОДЯТ — после SIGINT/SIGTERM/double-SIGINT в системе нет orphan'ов
  - Если тест всё ещё падает — НЕ маскировать, а вернуться к task 7 или 8: либо `browser.process()?.pid` недоступен в текущей версии cloakbrowser (тогда нужен другой fallback — например, отслеживать `pid` сразу после spawn), либо in-flight-таймаут срабатывает раньше, чем браузер успевает реально стартовать
  - Зафиксировать наблюдение: общее время shutdown в худшем случае
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.9_

- [x] 11. Verify Bug B exploration test now passes
  - **Property 2: Expected Behavior** — Block Detection Uses Structural Indicators Only
  - **IMPORTANT**: re-run the SAME test from task 4 — do NOT write a new test
  - Запустить `pnpm test src/lib/enrichment/sources/chipdip-client.test.ts -t "legitimate"`
  - **EXPECTED OUTCOME**: все 4 фикстуры проходят — `detectBlock(200, html).blocked === false`
  - Зафиксировать наблюдение: какие индикаторы реально присутствуют в фикстурах (для подтверждения, что они действительно легитимны и не содержат скрытых cloudflare-маркеров)
  - _Requirements: 2.6, 2.8_

- [x] 12. Verify preservation tests still pass
  - **Property 3: Preservation** — Happy-Path Shutdown Behavior
  - **Property 4: Preservation** — Real Blocks Still Detected
  - **IMPORTANT**: re-run the SAME tests from tasks 5 and 6 — do NOT write new tests
  - Запустить:
    - `pnpm test src/lib/enrichment/` — весь enrichment-пакет
    - `pnpm test:integration tests/integration/enrichment-shutdown.test.ts -t "happy-path"`
  - **EXPECTED OUTCOME**:
    - Happy-path shutdown: exit code 0, `durationMs < 30_000`, нет orphan'ов
    - HTTP 403 → blocked=true с reason='http-403'
    - cf-challenge-form → blocked=true с reason='cf-challenge-form'
    - cf-iframe → blocked=true с reason='cf-iframe'
    - empty html → blocked=false
    - Все остальные тесты `src/lib/enrichment/` зелёные
  - Дополнительно (PBT для F'): добавить в `chipdip-client.test.ts` property-тест:
    ```ts
    it('returns false for synthetic non-blocked HTML with random captcha mentions', () => {
      fc.assert(fc.property(
        fc.string(), fc.option(fc.constantFrom('captcha', 'access denied')), fc.string(),
        (lead, mention, trail) => {
          const html = `<html><body>${lead}${mention ?? ''}${trail}</body></html>`
          expect(detectBlock({ status: 200, html }).blocked).toBe(false)
        },
      ), { numRuns: 200 })
    })
    ```
    Этот PBT добавляется именно сейчас (после фикса) — на UNFIXED коде он бы падал. Он валидирует Property 2/4 на расширенном домене
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 13. Дозабор существующих 4 `chipdip_blocked`-записей
  - В `design.md` (раздел `Fix Implementation → SQL`) уже зафиксированы две опции SQL. Выбрать одну (по умолчанию — Опция 2, грубая, явно одобрена пользователем) и выполнить:
    ```sql
    UPDATE "EnrichmentJournal"
    SET status = 'pending', "errorMessage" = NULL, attempts = 0
    WHERE status = 'chipdip_blocked';
    ```
  - Альтернатива (если в `errorMessage` уже есть `reason`-маркеры от прошлых прогонов с фиксом): использовать Опцию 1 (точечную)
  - Запустить:
    ```bash
    psql $DATABASE_URL -c "UPDATE ..."
    pnpm enrichment:run --resume
    ```
  - Зафиксировать число затронутых строк (~4) и проверить через Prisma Studio (`pnpm db:studio`), что записи действительно перешли в `pending`
  - Не блокировать выполнение последующих задач, если оператор хочет дозабрать вручную позже
  - _Requirements: 2.10_

- [x] 14. Checkpoint — Ensure all tests pass
  - Запустить полный набор:
    - `pnpm lint` — без ошибок
    - `pnpm tsc --noEmit` — strict-mode без ошибок типов
    - `pnpm test src/lib/enrichment/` — все unit-тесты enrichment-пакета зелёные
    - `pnpm test` — все unit-тесты проекта зелёные
    - `pnpm test:integration tests/integration/enrichment-shutdown.test.ts` — все интеграционные тесты shutdown зелёные
  - Ручная верификация (опционально): `pnpm enrichment:run --limit 3 --skip-mouser --skip-lcsc`, после старта `Ctrl+C`, проверить через `pgrep -lf 'chrome|chromium|cloakbrowser'` — orphan'ов нет
  - Ручная верификация B (опционально): прогнать на 10–20 MPN и убедиться, что `chipdip_blocked` не появляется при отсутствии реальной блокировки; при ручной симуляции 403 (через прокси / VPN с заблокированной IP) — `chipdip_blocked` ставится с `reason='http-403'`
  - Если возникают вопросы (например, `browser.process()?.pid` недоступен на текущей версии cloakbrowser, или появилась новая разновидность cloudflare-страницы) — задать оператору и не двигаться дальше до подтверждения

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3", "4", "5", "6"] },
    { "id": 2, "tasks": ["7.1", "9"] },
    { "id": 3, "tasks": ["7.2", "7.3", "7.4"] },
    { "id": 4, "tasks": ["8.1"] },
    { "id": 5, "tasks": ["8.2", "10", "11"] },
    { "id": 6, "tasks": ["12"] },
    { "id": 7, "tasks": ["13"] },
    { "id": 8, "tasks": ["14"] }
  ]
}
```

- Wave 0 — tasks 1 и 2 параллельны без зависимостей: инфраструктура integration-тестов и HTML-фикстуры.
- Wave 1 — tasks 3, 4, 5, 6 параллельны после Wave 0 (3 и 5 нужен task 1; 4 и 6 нужен task 2). Все exploration- и preservation-тесты пишутся ДО фикса.
- Wave 2 — tasks 7.1 (расширить `closeAllBrowsers`) и 9 (переписать `isBlocked`) параллельны: фиксы независимы по файлам.
- Wave 3 — task 7.2 (опциональный shutdownWithCleanup), 7.3 (обновить installExitHandlers), 7.4 (unit-тесты browser-registry) параллельны после 7.1.
- Wave 4 — task 8.1 (gracefulShutdown в orchestrator) после 7.1/7.3 (нужен новый closeAllBrowsers).
- Wave 5 — task 8.2 (тесты orchestrator), 10 (verify Bug A passes), 11 (verify Bug B passes) параллельны после соответствующих фиксов.
- Wave 6 — task 12 (preservation re-run) после всех фиксов и verify.
- Wave 7 — task 13 (SQL-дозабор) после фикса B (логически — после fix B и подтверждения, что `chipdip_blocked` теперь ставится корректно).
- Wave 8 — финальный checkpoint.

## Notes

- Стиль кода: одинарные кавычки, 2 пробела, без точек с запятой, max 100 символов (`AGENTS.md`).
- Не трогать парсер, persistence, очередь, LCSC/Mouser-loop'ы по логике — фикс изолирован в `browser-registry.ts`, `orchestrator.ts`, `chipdip-client.ts`.
- Если `browser.process()?.pid` недоступен в текущей версии cloakbrowser (cloakbrowser обёртка может скрывать `process()`) — fallback: сохранять `pid` сразу после `spawn` через приватный API однажды, ИЛИ использовать `tree-kill`-стратегию по pgrep'у дочерних процессов Node-процесса. Решение фиксируется в task 7.1 на этапе реализации.
- В property-тестах для preservation B (синтетические HTML) использовать `numRuns: 200` для покрытия домена; для shutdown-тестов держать `numRuns: 3` — интеграционные тесты дорогие.
- Дополнительный `reason`-код в логах открывает путь к будущему мониторингу: можно построить дашборд по `chipdip_blocked.reason` и ловить регрессии block-detection заранее.
- Если task 13 (дозабор) делается до полного прогона в production — сначала убедиться, что фикс B уже в master и в production и `chipdip_blocked` теперь ставится корректно. Иначе после `--resume` те же артикулы снова попадут в `chipdip_blocked`.
- Эта спека НЕ закрывает спеку `fix-chipdip-specs-extraction` — это два разных бага в разных функциях. После завершения этой спеки `fix-chipdip-specs-extraction` остаётся актуальной.
- Если в task 3 окажется, что после SIGINT в системе orphan'ов нет (например, на macOS наследование сигналов через pnpm/tsx уже корректное) — root cause №1 не подтверждается, и нужно обновить дизайн (вернуться к разделу `Hypothesized Root Cause A`) и пересобрать гипотезу. Возможно, баг проявляется только на Linux/Docker.
