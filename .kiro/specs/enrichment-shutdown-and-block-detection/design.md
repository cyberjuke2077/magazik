# Enrichment Shutdown & Block Detection — Bugfix Design

## Overview

Под одной спекой исправляются два независимых, но связанных общим компонентом (`chipdip-client.ts`) бага в обогатителе:

- **Бaг A (shutdown):** при `SIGINT`/`SIGTERM`/`uncaughtException` дочерние Chromium-процессы не убиваются — `browser.close()` зависает или не успевает выполниться, и Node завершается раньше. Фикс — расширить `closeAllBrowsers(timeoutMs)` per-browser таймаутом и SIGKILL-фоллбеком через публичный `browser.process()?.pid`; в orchestrator реализовать оформленный shutdown-пайплайн (флаг → ожидание in-flight ≤10 сек → `closeAllBrowsers(5000)` → `process.exit`); в `installExitHandlers` использовать тот же пайплайн вместо «выстрелили и забыли» `closeAllBrowsers().then(exit)`.
- **Баг B (block detection):** `isBlocked` через `lower.includes('captcha' | 'access denied')` ловит ложные срабатывания на легитимных страницах. Фикс — переписать через явные индикаторы: HTTP-статус, `cf-*`-заголовки, cheerio-селекторы (`form#challenge-form`, `div#cf-challenge-running`, `iframe[src*="captcha"]`, `iframe[src*="cloudflare"]`), title-маркеры, редирект на `/cdn-cgi/`. Возвращать структурированный `reason` для логирования.

Стратегия:

1. Сначала пишем падающие exploration-тесты, которые закрепляют оба бага. Для бага A — child-процессный тест с реальным запуском обогатителя в child, отправкой SIGINT, проверкой `ps`/`pgrep`. Для бага B — property-based тест на коллекции HTML-фикстур легитимных chipdip-страниц со словами `captcha`/`access denied` в безобидных местах.
2. Пишем preservation property-тесты для не-buggy входов: штатное завершение пайплайна, реальные блокировки (HTTP 403, cloudflare-challenge), пустой HTML.
3. Применяем фиксы в трёх файлах: `browser-registry.ts`, `orchestrator.ts`, `chipdip-client.ts`.
4. Документируем SQL-скрипт дозабора 4 уже существующих `chipdip_blocked`-записей.

Фиксы изолированы в трёх файлах и не трогают парсер, persistence, очередь и LCSC/Mouser-каскад.

## Glossary

- **Bug_Condition_A (`C_A`)**: Node-процесс обогатителя получил `SIGINT`/`SIGTERM` или упал по `uncaughtException`/`unhandledRejection`, и после его завершения в системе остались дочерние Chromium/cloakbrowser-процессы (orphaned, ppid = 1 или указывает на завершённый Node).
- **Bug_Condition_B (`C_B`)**: вызов `isBlocked(status, html)` для легитимной chipdip-страницы (status 200, нет cloudflare-маркеров) вернул `true` потому, что в HTML где-то встретилось слово `captcha` или `access denied`.
- **Property_A (`P_A`)**: после завершения родительского Node-процесса по любому пути в системе нет orphaned-процессов с командной строкой, содержащей `chrome`/`chromium`/`Chromium Helper`/`cloakbrowser`, относящихся к этой сессии.
- **Property_B (`P_B`)**: `isBlocked(status, html)` возвращает `true` тогда и только тогда, когда есть надёжный сигнал блокировки (см. список индикаторов в Requirements 2.6).
- **Preservation_A (`¬C_A`)**: штатное завершение пайплайна (без SIGINT, очередь отработала) — все браузеры закрываются за разумное время, существующие тесты orchestrator-а не ломаются.
- **Preservation_B (`¬C_B`)**: реальные блокировки (HTTP 403, страница `<form id="challenge-form">`, title `Just a moment...`, редирект `/cdn-cgi/`) корректно детектятся как blocked. `isBlocked(200, '')` возвращает `false`.
- **F**: текущая (unfixed) реализация. `closeAllBrowsers` без таймаута и без SIGKILL через публичный API; `isBlocked` через `lower.includes`; orchestrator при SIGINT только выставляет флаг.
- **F'**: реализация после фикса. `closeAllBrowsers(timeoutMs)` с per-browser SIGKILL-фоллбеком; orchestrator с оформленным shutdown-пайплайном; `isBlocked` через явные индикаторы и cheerio.
- **`browser-registry.ts`**: `src/lib/enrichment/browser-registry.ts`. Текущий публичный API: `registerBrowser`, `unregisterBrowser`, `getActiveBrowserCount`, `closeAllBrowsers`, `installExitHandlers`. Расширяется опциональным параметром `timeoutMs` у `closeAllBrowsers`.
- **`chipdip-client.ts`**: `src/lib/enrichment/sources/chipdip-client.ts`. Содержит `isBlocked`, `spawn`, `teardown`, `searchMpn`, `relaunchWithProxy`, `rotateSession`. После фикса `isBlocked` возвращает `{ blocked: boolean; reason?: BlockReason }` (или объект с дополнительным полем — точная сигнатура решается на этапе фикса с учётом call-sites).
- **`orchestrator.ts`**: `src/lib/enrichment/orchestrator.ts`. Содержит `runEnrichmentPipeline`, `handleShutdown`, три loop-функции. Расширяется shutdown-пайплайном с in-flight-таймаутом и явным `process.exit`.
- **CloakBrowser**: пакет `cloakbrowser`, drop-in Playwright со stealth-Chromium. Возвращаемый `Browser` экспонирует `browser.process()?.pid` (наследовано от Playwright).
- **In-flight операция**: текущий `await` в loop-функции (типично — `client.searchMpn`, который внутри делает `page.goto({ waitUntil: 'networkidle', timeout: 60_000 })` + `sleep(getJitterMs())` 20–45 сек). Может удерживать поток до ~75 сек.
- **`reason`-код**: одно из `'http-403' | 'http-503-cf' | 'cf-challenge-form' | 'cf-challenge-running' | 'cf-iframe' | 'title-match' | 'cdn-cgi-redirect'`. Записывается в `EnrichmentJournal.errorMessage` при `chipdip_blocked` для дальнейшей диагностики.

## Bug Details

### Bug Condition A (Shutdown)

Текущий код в `browser-registry.ts`:

```ts
export async function closeAllBrowsers(): Promise<void> {
  const browsers = Array.from(activeBrowsers)
  activeBrowsers.clear()
  await Promise.all(
    browsers.map(async (b) => {
      try { await b.close() } catch { /* ignore */ }
    }),
  )
}
```

— нет таймаута. Если CDP-канал «подвис», `browser.close()` может ждать ~30 секунд. В это же окно `process.on('SIGINT')` в orchestrator только выставляет флаг и возвращается, но текущая итерация в `runChipDipLoop` уже сидит в `await client.searchMpn(...)`, внутри которого `await sleep(getJitterMs())` (20–45 сек) — пользователь жмёт Ctrl+C ещё раз, Node ловит default-handler `SIGINT` и завершается без шанса дойти до `finally`/`closeAllBrowsers`. Chromium остаётся orphaned.

`syncForceClose` в `process.on('exit')` пытается достать процесс через приватное `(browser as any)._process` — это поле может не существовать в текущей версии Playwright/cloakbrowser, поэтому SIGKILL не уходит.

**Formal Specification:**

```
FUNCTION isBugConditionA(input)
  INPUT: input of type ShutdownScenario
    .signal:   'SIGINT' | 'SIGTERM' | 'uncaughtException' | 'unhandledRejection'
    .inFlight: boolean   // была ли активная in-flight операция в момент сигнала
  OUTPUT: boolean

  // F (unfixed) допускает orphan-процессы Chromium при следующих условиях:
  RETURN input.signal IN { 'SIGINT', 'SIGTERM' }
         AND input.inFlight = true
         AND afterParentExit_orphanedChromiumProcessesExist()
END FUNCTION
```

`afterParentExit_orphanedChromiumProcessesExist()` — оракул в exploration-тесте: запускает обогатитель в child-процессе с короткой очередью (1–2 MPN), посылает SIGINT, ждёт `child.on('exit')`, после этого делает `pgrep -f 'chrome|chromium|cloakbrowser'` и проверяет, что среди живых процессов нет тех, кто относится к этой сессии (по командной строке или по предварительно собранному списку pid'ов).

### Bug Condition B (Block Detection False Positive)

Текущий код в `chipdip-client.ts`:

```ts
function isBlocked(status: number, html: string): boolean {
  if (status === 403) return true
  const lower = html.toLowerCase()
  return lower.includes('captcha') || lower.includes('access denied')
}
```

— `indexOf` по всей нижне-кейсовой странице. Подстрока `captcha` встречается в:

- футерах (политика конфиденциальности, упоминания reCAPTCHA в формах обратной связи)
- SEO-блоках и meta-описаниях
- названиях/описаниях товаров (модули с CAPTCHA-функциональностью, например `arduino captcha shield`)
- скриптах Google reCAPTCHA, подключаемых формами на странице

Подстрока `access denied`:

- в SEO-блоках и описаниях товаров (модули контроля доступа)
- в текстах статей/гайдов

При этих ложных срабатываниях обогатитель идёт по retry → rotateSession → relaunchWithProxy → в худшем случае ставит `chipdip_blocked` и тормозит ChipDip-цикл на 2–4 часа без реальной блокировки.

**Formal Specification:**

```
FUNCTION isBugConditionB(input)
  INPUT: input of type (status: number, html: string, headers?: Headers)
  OUTPUT: boolean

  // F (unfixed) даёт ложноположительный true при следующих условиях:
  RETURN input.status BETWEEN 200 AND 299
         AND NOT hasRealBlockMarker(input.html, input.headers)
         AND (lower(input.html) CONTAINS 'captcha'
              OR lower(input.html) CONTAINS 'access denied')
END FUNCTION

FUNCTION hasRealBlockMarker(html, headers)
  $ ← cheerio.load(html)
  RETURN $('form#challenge-form').length > 0
         OR $('div#cf-challenge-running').length > 0
         OR $('iframe[src*="captcha"]').length > 0
         OR $('iframe[src*="cloudflare"]').length > 0
         OR titleMatchesBlocked($('title').text())
         OR (headers AND hasCloudflareHeader(headers))
END FUNCTION
```

### Examples

**Bug A — orphaned Chromium:**

- Сценарий: `pnpm enrichment:run --limit 2`, через 10 сек после старта `kill -SIGINT <pid>`. Текущее поведение: orchestrator печатает `shutdown_requested`, но `await sleep(getJitterMs())` ещё держит поток ~30 сек. Если пользователь ждёт — в `finally` выполняется `closeAllBrowsers()` без таймаута; если не ждёт и шлёт второй SIGINT — Node завершается, `chrome --type=renderer ...` остаётся в `ps`.
- Edge: при `uncaughtException` (например, network error в `page.goto`, не пойманный) `installExitHandlers` сейчас вызывает `closeAllBrowsers` без таймаута и потом `process.exit(1)` — но если сама `closeAllBrowsers` зависла, `process.exit` не выполнится; зато `process.on('exit')` отработает синхронно, вызовет `syncForceClose`, который попробует приватное `_process` — и промахнётся.

**Bug B — false positive isBlocked:**

- Страница товара `https://www.chipdip.ru/product/arduino-captcha-shield` (гипотетическая, но подобные есть): HTTP 200, в `<title>` название товара со словом `Captcha`, в `<h1>` тоже. Текущий `isBlocked(200, html) = true`. Ожидаем `false`.
- Страница товара с описанием «Модуль доступа с защитой от unauthorized access. Anti access denied feature.» (название может быть на русском, но в SEO-описании или alt-тексте слово встречается на английском): HTTP 200, в любом из meta/alt/text встречается `access denied`. Текущий `isBlocked = true`. Ожидаем `false`.
- Страница с подключённым Google reCAPTCHA-скриптом в форме обратной связи в футере: HTTP 200, в HTML где-то `<script src="https://www.google.com/recaptcha/...">` или текст «защищено reCAPTCHA». Сейчас `isBlocked = true`. Ожидаем `false`.
- Реальная блокировка cloudflare: HTTP 503, в HTML `<form id="challenge-form" action="/cdn-cgi/...">`, `<title>Just a moment...</title>`. Сейчас `isBlocked = true` (через слово `captcha` в challenge-странице — случайно правильно). После фикса `isBlocked = true` через `cf-challenge-form` или `title-match` — правильно по правильной причине, с `reason = 'cf-challenge-form'`.
- HTTP 403 с любым телом: сейчас `true`, после фикса `true` с `reason = 'http-403'`.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- `registerBrowser(browser)` / `unregisterBrowser(browser)` / `getActiveBrowserCount()` — публичная сигнатура и поведение без изменений. Используются в `chipdip-client.spawn` / `teardown`.
- `chipdip-client.spawn` — без изменений по логике (запускает CloakBrowser, регистрирует).
- `chipdip-client.teardown` — поведение «`browser.close()` в try/catch, потом `unregisterBrowser`» сохраняется как штатный путь. Новый таймаут/SIGKILL живёт в `closeAllBrowsers`, не в `teardown` per-call (чтобы не ломать штатный rotateSession/relaunchWithProxy).
- `parseProductPage`, `extractSpecifications` и весь парсер — не трогаем. Багфикс изолирован в shutdown и block-detection.
- `persistence-service.ts`, `status-journal.ts`, ingest, observability, queue — не трогаем.
- LCSC- и Mouser-loop'ы в orchestrator — не трогаем (только common shutdown-пайплайн обёрнет их так же, как ChipDip).
- `isBlocked(403, ...)` SHALL CONTINUE возвращать `true`.
- `isBlocked(200, html)` для cloudflare-challenge HTML SHALL CONTINUE возвращать `true` (через новые правильные индикаторы, а не через `lower.includes('captcha')`).
- `isBlocked(200, '')` возвращает `false`.

**Scope:**

Все входы, не удовлетворяющие Bug Condition A и B, должны давать на F' тот же результат, что и на F.

- Штатное завершение пайплайна по окончании очереди (без SIGINT) — все браузеры закрываются за секунды, как раньше.
- HTTP 403 — детектится как blocked.
- Cloudflare-challenge с `<form id="challenge-form">` — детектится как blocked.
- Пустой HTML — не блокировка.
- Существующие тесты orchestrator-а — зелёные.

## Hypothesized Root Cause

### Root Cause A (Shutdown)

В порядке убывания вероятности:

1. **Нет таймаута на `browser.close()`.** Самая вероятная корневая причина. CDP-канал может «подвисать» (особенно при обрыве сети или зависании страницы), `browser.close()` ждёт неопределённо долго. Текущий `closeAllBrowsers` не имеет таймаута.

2. **`process.exit` вызывается раньше, чем `closeAllBrowsers` успеет.** В `installExitHandlers` сейчас:
   ```ts
   const asyncCleanupAndExit = async (code, reason) => {
     try { await closeAllBrowsers() } catch {}
     process.exit(code)
   }
   ```
   — если `closeAllBrowsers` зависла, `process.exit` не отрабатывает; но если пользователь шлёт второй SIGINT, Node выполнит default-handler и завершится без cleanup.

3. **`syncForceClose` использует приватное поле `_process`.** В Playwright оно может отсутствовать или называться иначе. Публичный API — `browser.process()?.pid`.

4. **Orchestrator не делает явного shutdown-пайплайна.** При SIGINT он только выставляет флаг. In-flight операция (`page.goto` + `sleep`) удерживает поток до ~75 сек, и в это окно пользователь может прервать процесс жёстко.

5. **`installExitHandlers` не подписан на `SIGINT`/`SIGTERM`.** Эти сигналы перехватывает orchestrator. Но если поверх обогатителя кто-то его обёртывает (тесты, внешние раннеры) — сигнал может прийти в node и без обработчика orchestrator.

### Root Cause B (Block Detection)

1. **Использование `String.prototype.includes` по всей странице вместо структурного анализа DOM.** Самая вероятная и единственная нужная причина. На полях статей, в названиях товаров, в скриптах reCAPTCHA, в alt-тексте подстроки `captcha`/`access denied` встречаются легитимно.

2. **Отсутствие учёта HTTP-заголовков.** Cloudflare шлёт в ответ заголовки вида `cf-ray`, `cf-cache-status`, `cf-mitigated` — это надёжный сигнал. Сейчас не учитываются.

3. **Отсутствие проверки финального URL.** При cloudflare-challenge редирект уходит на `/cdn-cgi/...`. Сейчас не учитывается.

Финальный root cause фиксируется на этапе exploration: после прогона на коллекции легитимных chipdip-фикстур мы увидим конкретные конструкции, на которых текущий `isBlocked` ошибается.

## Correctness Properties

Property 1: Bug Condition — Graceful Shutdown Kills All Chromium

_For any_ сценарий завершения Node-процесса обогатителя (SIGINT, SIGTERM, uncaughtException, unhandledRejection, штатное завершение по окончании очереди), фиксированная реализация (`browser-registry.ts`, `orchestrator.ts`) SHALL гарантировать, что в течение конечного времени (≤ in_flight_timeout + close_timeout) все Chromium/cloakbrowser-процессы, запущенные этой сессией, завершаются — либо через `browser.close()`, либо через SIGKILL по `browser.process()?.pid`. После завершения родительского Node-процесса в системе нет orphaned-процессов этой сессии.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.9**

Property 2: Bug Condition — Block Detection Uses Structural Indicators Only

_For any_ HTML страницы chipdip.ru, в которой нет реальных индикаторов блокировки (ни HTTP 403/503-cf, ни `form#challenge-form`, ни `div#cf-challenge-running`, ни cloudflare/captcha-iframe, ни match по title, ни редиректа на `/cdn-cgi/`), фиксированная функция `isBlocked(status, html, headers?)` SHALL возвращать `false` независимо от того, встречаются ли в любом месте HTML подстроки `captcha` или `access denied`.

**Validates: Requirements 2.6, 2.7, 2.8**

Property 3: Preservation — Happy-Path Shutdown Behavior

_For any_ штатное завершение пайплайна (очередь отработала, SIGINT не послан), фиксированная реализация SHALL производить тот же наблюдаемый результат, что и оригинальная: все браузеры закрываются за разумное время (порядок секунд), `closeAllBrowsers` отрабатывает без выбрасывания исключений, существующие тесты orchestrator-а проходят.

**Validates: Requirements 3.1, 3.5, 3.6, 3.7, 3.8, 3.9**

Property 4: Preservation — Real Blocks Still Detected

_For any_ настоящая блокировка (HTTP 403; HTTP 503 + cloudflare-заголовки; HTML с `form#challenge-form`; HTML с title `Just a moment...`/`Cloudflare`/`Access Denied`/`Доступ ограничен`; редирект на `/cdn-cgi/`), фиксированная функция `isBlocked` SHALL возвращать `true` (с конкретным `reason`-кодом), и поведение `isBlocked(200, '')` SHALL продолжать возвращать `false`.

**Validates: Requirements 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Фикс затрагивает три файла. Состав конкретных правок уточняется на этапе exploration, но скелет такой:

**File**: `src/lib/enrichment/browser-registry.ts`

**Changes**:

1. Расширить `closeAllBrowsers` опциональным параметром `timeoutMs` (по умолчанию `5000`):
   ```ts
   export async function closeAllBrowsers(timeoutMs = 5000): Promise<void>
   ```
   Реализация:
   - снять snapshot `Array.from(activeBrowsers)`, очистить `activeBrowsers`
   - для каждого `browser` запустить `Promise.race([browser.close(), sleep(timeoutMs)])`
   - дождаться `Promise.allSettled` всех гонок
   - после таймаута для тех, кого не успели закрыть, попытаться `browser.process()?.kill('SIGKILL')`
   - все ошибки логировать через `console.warn` (не глотать молча — нужно для диагностики), но не выбрасывать.

2. Заменить `syncForceClose` на использование публичного API `browser.process()?.kill('SIGKILL')` вместо приватного `(browser as any)._process`. Если `pid` недоступен — `console.warn` и идём дальше.

3. `installExitHandlers`:
   - оставить идемпотентность.
   - подписаться дополнительно на `SIGINT`/`SIGTERM`, но только если orchestrator явно не зарегистрировал свои обработчики. Альтернатива: оркестратор сам вызывает общую функцию `shutdownWithCleanup(signal, code)` из browser-registry, которая делает: ждать in-flight ≤ `inFlightTimeoutMs`, вызвать `closeAllBrowsers(closeTimeoutMs)`, `process.exit(code)`. В этом случае `installExitHandlers` для `SIGINT`/`SIGTERM` не нужен — оркестратор отвечает за свои сигналы.

4. (опционально) Экспортировать новую функцию `shutdownWithCleanup(opts: { signal?: string; code?: number; inFlightTimeoutMs?: number; closeTimeoutMs?: number; waitInFlight?: () => Promise<void> }): Promise<void>` — точка единого pipeline'а, чтобы оркестратор и `installExitHandlers` использовали её одинаково.

**File**: `src/lib/enrichment/orchestrator.ts`

**Changes**:

1. В `runEnrichmentPipeline` добавить ссылку на «текущий in-flight-promise» каждой loop-функции (трекать через `Set<Promise<void>>` или через ref на текущую `searchMpn`-операцию). Это нужно, чтобы при SIGINT можно было «дождаться текущей итерации с таймаутом 10 сек».

2. `handleShutdown(signal)` SHALL:
   - первым вызовом: выставить `shutdownRequested = true`, запустить shutdown-пайплайн (`shutdownWithCleanup`).
   - повторными вызовами (второй SIGINT): сократить `closeTimeoutMs` до 1000 и пропустить in-flight-wait — пользователь явно нетерпелив.

3. Shutdown-пайплайн (внутри orchestrator):
   ```
   async function gracefulShutdown(signal):
     a. Выставить флаг
     b. Прекратить выдачу новых батчей в loops (loops уже проверяют isShutdown())
     c. await Promise.race([Promise.all(activeLoops), sleep(IN_FLIGHT_TIMEOUT_MS = 10_000)])
     d. await closeAllBrowsers(CLOSE_TIMEOUT_MS = 5_000)
     e. progress.stop()
     f. process.exit(signal === 'SIGINT' ? 130 : 0)
   ```

4. Снять `await closeAllBrowsers()` из `finally`-блока штатного завершения и переместить в общий `gracefulShutdown(reason='normal-completion')`, чтобы оба пути (штатный и сигнальный) шли через один pipeline.

5. Логировать каждый шаг через `logger.info({ event: 'shutdown_step', step: '...', durationMs })` для последующей диагностики.

**File**: `src/lib/enrichment/sources/chipdip-client.ts`

**Changes**:

1. Заменить `function isBlocked(status, html): boolean` на:
   ```ts
   type BlockReason =
     | 'http-403'
     | 'http-503-cf'
     | 'cf-challenge-form'
     | 'cf-challenge-running'
     | 'cf-iframe'
     | 'title-match'
     | 'cdn-cgi-redirect'

   interface BlockResult {
     blocked: boolean
     reason?: BlockReason
   }

   function detectBlock(args: {
     status: number
     html: string
     headers?: Record<string, string>
     finalUrl?: string
   }): BlockResult
   ```

2. Реализация `detectBlock` (строгий порядок проверок, первый матч побеждает):
   - `status === 403` → `{ blocked: true, reason: 'http-403' }`
   - `status === 503` И в `headers` есть любой `cf-*` → `{ blocked: true, reason: 'http-503-cf' }`
   - `finalUrl` содержит `/cdn-cgi/` → `{ blocked: true, reason: 'cdn-cgi-redirect' }`
   - cheerio: `$('form#challenge-form').length > 0` → `cf-challenge-form`
   - cheerio: `$('div#cf-challenge-running').length > 0` → `cf-challenge-running`
   - cheerio: `$('iframe[src*="captcha"], iframe[src*="cloudflare"]').length > 0` → `cf-iframe`
   - title: `lower($('title').text()).matches('cloudflare' | 'just a moment' | 'access denied' | 'доступ ограничен')` → `title-match`
   - иначе → `{ blocked: false }`

3. Обновить все call-sites `isBlocked(status, html)` → `detectBlock({ status, html, headers, finalUrl })`. Где `headers` доступны через `response.headers()` (Playwright API), `finalUrl` через `response.url()`.

4. Когда `detectBlock` возвращает `blocked: true`, бросать `Error('ChipDip blocked (403/CAPTCHA): ' + reason)` (формат сохраняется, чтобы в orchestrator regex-match на `'ChipDip blocked (403/CAPTCHA)'` продолжал работать), и в логе `chipdip_blocked` писать `reason` в `errorMessage` или в отдельное поле логгера.

5. Не трогать `searchMpn`, `spawn`, `teardown`, `relaunchWithProxy`, `rotateSession` по логике — только подменить вызовы `isBlocked` на новый `detectBlock` и пробросить `reason` в логи.

**Migration**: дозабор существующих `chipdip_blocked`-записей (см. ниже в задаче 5) — отдельный пункт в `tasks.md`.

### SQL для дозабора blocked-записей

После применения фикса в БД остаются 4 записи `chipdip_blocked`. Вариант минимального дозабора:

```sql
-- Опция 1 (точечная): сбросить только те, у кого нет явного маркера 403 в errorMessage
UPDATE "EnrichmentJournal"
SET status = 'pending', "errorMessage" = NULL, attempts = 0
WHERE status = 'chipdip_blocked'
  AND ("errorMessage" IS NULL OR "errorMessage" NOT ILIKE '%http-403%');

-- Опция 2 (грубая, явно одобрена пользователем): сбросить все 4
UPDATE "EnrichmentJournal"
SET status = 'pending', "errorMessage" = NULL, attempts = 0
WHERE status = 'chipdip_blocked';
```

После — `pnpm enrichment:run --resume`.

## Testing Strategy

### Validation Approach

Двухфазный подход для каждого бага: сначала падающий exploration-тест на UNFIXED коде, затем preservation-тесты на не-buggy входах, затем фикс, затем верификация. Для бага A exploration требует child-процессного теста с реальным spawn/SIGINT/pgrep — это интеграционный тест, не unit. Для бага B exploration — property-based на коллекции HTML-фикстур.

### Exploratory Bug Condition Checking

#### Test A — Shutdown Orphan Process Detection

**Goal**: Surface counterexamples that demonstrate orphaned Chromium processes after SIGINT. Подтвердить root cause №1 (`browser.close()` без таймаута).

**Test Plan**: написать integration-тест в `tests/integration/enrichment-shutdown.test.ts` (или в `src/lib/enrichment/__tests__/shutdown.integration.test.ts`):

1. Перед тестом: snapshot текущих процессов в системе с подстрокой `chrome|chromium|cloakbrowser` через `pgrep -lf`. Список pid'ов сохранить в `before`.
2. Запустить обогатитель в child-процессе через `child_process.spawn('pnpm', ['tsx', 'src/scripts/enrichment-run.ts', '--limit', '2', '--source', 'chipdip'], { detached: false })`. Дождаться, пока в логах появится событие `chipdip_healthcheck_ok` (это значит, что CloakBrowser реально стартовал).
3. Послать `child.kill('SIGINT')`.
4. Подождать `child.on('exit')` или таймаут 30 сек.
5. После выхода child — снова `pgrep -lf 'chrome|chromium|cloakbrowser'`. Список `after`.
6. ASSERT: `after \ before` пусто (не появилось новых живых процессов).

На UNFIXED коде тест ОБЯЗАН падать: список `after \ before` будет содержать orphaned-процессы Chromium.

**Property variant** (если делаем PBT поверх): `fc.constantFrom('SIGINT', 'SIGTERM')` — для каждого сигнала повторить сценарий и проверить отсутствие orphan'ов. Семья сценариев: `{ signal, mpnsCount: 1 | 2, killAfterMs: 5000 | 10000 }` через `fc.record`. Property-based с малым `numRuns` (3–5) — это интеграционный тест, не должен бегать тысячи раз.

**Test Cases**:

1. **SIGINT during searchMpn** (will fail on unfixed code): запуск с `--limit 2`, SIGINT после 10 сек, проверка отсутствия orphan'ов.
2. **SIGTERM during searchMpn** (will fail on unfixed code): аналогично, но `child.kill('SIGTERM')`.
3. **Double SIGINT** (will fail on unfixed code): два SIGINT с интервалом 1 сек — проверить, что и в этом сценарии shutdown отрабатывает (с минимальным таймаутом).
4. **uncaughtException** (will fail on unfixed code): инжектить ошибку в loop через monkey-patch или через окружение `THROW_AFTER_MS`, проверить отсутствие orphan'ов.

**Expected Counterexamples**:

- После SIGINT в `ps`/`pgrep` остаются процессы `chrome --type=renderer`, `Chromium Helper (GPU)`, `Chromium Helper (Renderer)`.
- Возможные причины: `browser.close()` зависла; `process.exit` пришёл раньше `closeAllBrowsers`; `syncForceClose` промахнулся по приватному полю.

#### Test B — Block Detection False Positive Surface

**Goal**: Surface counterexamples — легитимные chipdip-страницы, на которых `isBlocked` ошибочно возвращает `true`. Подтвердить root cause №1 (`String.includes` по всей странице).

**Test Plan**: создать каталог `src/lib/enrichment/sources/__fixtures__/chipdip-legitimate/` и закоммитить туда несколько HTML-фикстур легитимных страниц, в которых встречаются слова `captcha`/`access denied` в безобидных местах. Источники фикстур:

1. Страница товара с CAPTCHA-функциональностью (сохранить через CloakBrowser/DevTools): `arduino-captcha-shield.html` или эквивалент. Должна содержать слово `captcha` в `<title>`, `<h1>`, описании.
2. Страница со словом `access denied` в SEO/описании: `module-access-control.html` или эквивалент.
3. Страница с подключённым Google reCAPTCHA-скриптом в форме обратной связи: `chipdip-page-with-recaptcha-footer.html` (вырезать только секцию с reCAPTCHA + минимальный обвес).
4. Страница с упоминанием `captcha` в meta-description / alt-тексте.

Property test:

```ts
const legitimateFixtures = [
  'arduino-captcha-shield.html',
  'module-access-control.html',
  'chipdip-page-with-recaptcha-footer.html',
  'page-with-captcha-in-meta.html',
]

it('isBlocked returns false for legitimate chipdip pages with "captcha"/"access denied" substrings', () => {
  fc.assert(
    fc.property(fc.constantFrom(...legitimateFixtures), (file) => {
      const html = readFileSync(`__fixtures__/chipdip-legitimate/${file}`, 'utf-8')
      const result = detectBlock({ status: 200, html })
      expect(result.blocked).toBe(false)
    }),
    { numRuns: 50 }, // fc обойдёт все 4 фикстуры с запасом
  )
})
```

На UNFIXED коде (где `isBlocked` ещё через `lower.includes`) этот тест падает на первом же примере.

**Test Cases**:

1. **Captcha in product title** (will fail on unfixed code): фикстура `arduino-captcha-shield.html`, ожидаем `isBlocked(200, html) === false`.
2. **Access denied in description** (will fail on unfixed code): аналогично.
3. **reCAPTCHA in footer** (will fail on unfixed code): аналогично.
4. **Property over fixtures** (will fail on unfixed code): property test выше.

**Expected Counterexamples**:

- `isBlocked(200, html)` возвращает `true` для всех четырёх легитимных HTML.
- Причина: `lower.includes('captcha')` срабатывает на безобидных вхождениях.

### Fix Checking

#### Property 1A — Shutdown

**Pseudocode:**

```
FOR ALL scenario WHERE isBugConditionA(scenario) DO
  beforePids := pgrep('chrome|chromium|cloakbrowser')
  child := spawn(enrichment_run, scenario.args)
  waitForReady(child)
  child.kill(scenario.signal)
  await child.exit
  afterPids := pgrep('chrome|chromium|cloakbrowser')
  ASSERT (afterPids \ beforePids) == empty
END FOR
```

#### Property 1B — Block Detection

**Pseudocode:**

```
FOR ALL fixture IN legitimateFixtures DO
  result := detectBlock({ status: 200, html: read(fixture) })
  ASSERT result.blocked == false
END FOR

FOR ALL (status, html, headers, finalUrl) WHERE isBugConditionB({status, html}) DO
  // legitimate pages with substring 'captcha' or 'access denied'
  result := detectBlock_fixed({ status, html, headers, finalUrl })
  ASSERT result.blocked == false
END FOR
```

### Preservation Checking

#### Property 2A — Happy-Path Shutdown

**Pseudocode:**

```
FOR ALL scenario WHERE NOT isBugConditionA(scenario) DO
  // штатное завершение по окончании очереди
  child := spawn(enrichment_run, { limit: 2 })
  await child.exit       // нормальный exit code 0
  ASSERT child.exitCode == 0
  ASSERT durationMs < SHUTDOWN_BUDGET_MS  // например 30 сек
  afterPids := pgrep('chrome|chromium|cloakbrowser')
  ASSERT (afterPids \ beforePids) == empty
END FOR
```

#### Property 2B — Real Blocks Still Detected

**Pseudocode:**

```
FOR ALL (status, html, headers, finalUrl) WHERE NOT isBugConditionB({status, html, headers, finalUrl}) DO
  ASSERT detectBlock_fixed(...) results in same boolean as required by Property B
END FOR

// Конкретные positive cases:
ASSERT detectBlock({ status: 403, html: '<html></html>' }).blocked == true
ASSERT detectBlock({ status: 503, headers: { 'cf-ray': 'abc' }, html: '...' }).blocked == true
ASSERT detectBlock({ status: 200, html: '<form id="challenge-form">...</form>' }).blocked == true
ASSERT detectBlock({ status: 200, html: '<title>Just a moment...</title>...' }).blocked == true
ASSERT detectBlock({ status: 200, html: '', finalUrl: 'https://example.com/cdn-cgi/...' }).blocked == true

// Negative cases:
ASSERT detectBlock({ status: 200, html: '' }).blocked == false
```

**Testing Approach**: property-based testing рекомендован, потому что:

- Preservation — это универсальное свойство для всех не-buggy входов.
- Property-based testing генерирует множество HTML-кейсов автоматически.
- Ловит edge-cases (например, `<title>` в `<noscript>`, `iframe` без `src`, частичные совпадения cf-маркеров).

**Test Plan для preservation B**: написать property-test, который генерирует случайные HTML без cloudflare-индикаторов (через `fc.string` для произвольного текста + конкатенация с `<html><body>` и опционально подмешанным `captcha`/`access denied` в произвольный текст), утверждать `detectBlock(200, html).blocked === false`.

**Test Cases**:

1. **Synthetic non-blocked pages** (PBT): `fc.record({ leadIn: fc.string(), maybeCaptcha: fc.option(fc.constantFrom('captcha', 'access denied')), trail: fc.string() })` → склеить в HTML без cloudflare-DOM-маркеров. Утверждать `detectBlock(200, html).blocked === false`.
2. **Real-block fixtures**: 5–6 ручных HTML с разными cloudflare-маркерами. Утверждать `blocked === true` и правильный `reason`.
3. **HTTP 403 with arbitrary HTML** (PBT): `fc.string()` → утверждать `detectBlock(403, html).blocked === true && reason === 'http-403'`.
4. **Empty HTML** (PBT): `fc.constantFrom('', '<html></html>')` → `detectBlock(200, html).blocked === false`.

**Test Plan для preservation A**:

1. Запустить штатный сценарий (`--limit 1` без SIGINT) в child-процессе. Дождаться `exitCode === 0`. Проверить, что нет orphan'ов и общее время shutdown ≤ 30 сек.
2. Запустить существующие тесты orchestrator-а: `pnpm test src/lib/enrichment/`. Все зелёные.

### Unit Tests

- `browser-registry.test.ts`: 
  - `closeAllBrowsers(timeoutMs=100)` — закрыть быстро-закрывающиеся mock-браузеры; проверить, что все вызывали `.close()`.
  - `closeAllBrowsers(timeoutMs=100)` — для зависающего mock-браузера (`close()` возвращает never-resolving promise) проверить, что вызвался `process.kill('SIGKILL')` через mock `browser.process()`.
  - Идемпотентность: дважды `closeAllBrowsers()` подряд не падает.
- `chipdip-client.detectBlock.test.ts`: 
  - Все `reason`-кейсы (HTTP 403, 503+cf-header, challenge-form, cf-iframe, title-match, cdn-cgi).
  - Negative: HTTP 200 с произвольным безопасным HTML.
  - Negative: HTTP 200 с word `captcha` в `<title>` товара (без cloudflare-маркеров).
- `orchestrator.shutdown.test.ts`: 
  - Mock loop-функций; послать SIGINT в test-runner-friendly способе (через флаг shutdownRequested), проверить порядок вызовов: флаг → in-flight wait → `closeAllBrowsers` → `process.exit` (mock `process.exit`).

### Property-Based Tests

- **Property 1A (PBT)**: `fc.record({ signal, mpnsCount, killAfterMs })` — для каждой комбинации запустить child-сценарий, утверждать отсутствие orphan'ов. `numRuns: 3–5` (интеграционный, не множить).
- **Property 1B (PBT)**: `fc.constantFrom(...legitimateFixtures)` — для каждой фикстуры утверждать `detectBlock(200, html).blocked === false`.
- **Property 2A (PBT)**: штатное завершение в child-процессе, `numRuns: 2–3`, утверждать exit 0 и отсутствие orphan'ов.
- **Property 2B (PBT, synthetic)**: генерировать HTML без cloudflare-DOM-маркеров с произвольно подмешанными `captcha`/`access denied` в текст — утверждать `blocked === false`.
- **Property 2B (PBT, positive cases)**: генерировать HTML с одним из cloudflare-DOM-маркеров — утверждать `blocked === true` и правильный `reason`.

### Integration Tests

- **Shutdown integration test**: child-процесс + SIGINT + pgrep (см. Property 1A). Tag: `@integration`, не запускать в обычном `pnpm test` без флага. Команда: `pnpm test:integration`.
- **Real-page block detection** (опционально): живой запрос к chipdip.ru через CloakBrowser (только при наличии proxy/окружения), утверждать `detectBlock` на реальных ответах. Не для CI.
- **Orchestrator full-loop preservation**: запустить пайплайн с моком ChipDip-клиента, который возвращает результаты, проверить штатное завершение и отсутствие регрессий по времени.
