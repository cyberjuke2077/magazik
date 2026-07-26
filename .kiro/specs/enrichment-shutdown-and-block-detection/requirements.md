# Requirements Document

Багфикс: shutdown CloakBrowser-процессов и ложноположительный детект блокировки ChipDip в обогатителе.

## Introduction

Под одной спекой закрываются два связанных бага в обогатителе (`pnpm enrichment:run`), оба сидят в одном модуле `src/lib/enrichment/sources/chipdip-client.ts` и в его соседях по `src/lib/enrichment/`:

- **Бaг A — браузер висит после остановки процесса.** Когда оператор останавливает обогатитель через Ctrl+C (`SIGINT`) или процесс падает по `uncaughtException`, дочерние Chromium-процессы, запущенные `cloakbrowser`, остаются висеть в системе и продолжают есть RAM/CPU. Подтверждено пользователем: «браузер висит после остановки процесса». В коде уже есть `src/lib/enrichment/browser-registry.ts` (`registerBrowser`/`unregisterBrowser`/`closeAllBrowsers`/`installExitHandlers`) и обработчики `SIGINT`/`SIGTERM` в оркестраторе (`shutdown_requested` → флаг `shutdownRequested = true`), но сейчас в реальности между событием `shutdown_requested` и моментом, когда Node действительно завершается, `browser.close()` не успевает выполниться или зависает на 30+ секунд из-за подключённого CDP. `process.exit` либо вызывается раньше срока, либо не вызывается вовсе, и Chromium теряет связь с родительским процессом. Промежуточный `syncForceClose` в `browser-registry` пытается слать SIGKILL через приватное поле `_process`, но это unreliable (поле не публичное и может отсутствовать).

- **Баг B — ложноположительный детект блокировки ChipDip.** Функция `isBlocked(status, html)` в `chipdip-client.ts` объявляет страницу заблокированной, если в HTML где угодно встретилось слово `captcha` или `access denied`:

  ```ts
  function isBlocked(status: number, html: string): boolean {
    if (status === 403) return true
    const lower = html.toLowerCase()
    return lower.includes('captcha') || lower.includes('access denied')
  }
  ```

  На реальных страницах chipdip.ru эти слова легитимно встречаются: в футере, в SEO-блоках, в названиях/описаниях товаров (модули с CAPTCHA-функциональностью, статьи в каталоге). При HTTP 200 на нормальной странице парсер ставит `isBlocked = true`, дальше срабатывает retry → relaunchWithProxy → в худшем случае статус `chipdip_blocked` в `EnrichmentJournal` без реальной блокировки. Пользователь жалуется: «статус blocked появляется больно часто, хотя на чипдипе я разблокирован». В журнале сегодня 2 записи `chipdip_blocked` — субъективно их должно быть меньше или ноль.

Оба бага — в одном клиенте, поэтому идут одной спекой; реализация может быть в одном PR или раздельно.

После фикса бага B в БД останется до 4 записей `chipdip_blocked`, часть из которых, вероятно, ложные. План дозабора входит в скоуп: SQL-сброс таких записей в `pending` для повторного прогона через `pnpm enrichment:run --resume`.

Не путать с `fix-chipdip-specs-extraction` — там про `extractSpecifications` в `product-parser.ts`, отдельный, никак не связанный баг.

## Glossary

- **`chipdip-client.ts`** — `src/lib/enrichment/sources/chipdip-client.ts`. Содержит `createChipDipClient`, `spawn`, `teardown`, `isBlocked`. Запускает CloakBrowser один раз и держит его живым всю сессию обогащения.
- **`browser-registry.ts`** — `src/lib/enrichment/browser-registry.ts`. Регистр всех живых `Browser`-инстансов: `registerBrowser`, `unregisterBrowser`, `closeAllBrowsers`, `installExitHandlers`. Текущий `installExitHandlers` подписан на `uncaughtException`, `unhandledRejection`, `exit`, но не на `SIGINT`/`SIGTERM` — эти сигналы перехватывает оркестратор.
- **`orchestrator.ts`** — `src/lib/enrichment/orchestrator.ts`. Регистрирует обработчики `SIGINT`/`SIGTERM` (выставляют `shutdownRequested = true`), вызывает `installExitHandlers` и в `finally` делает `closeAllBrowsers()`. Между сигналом и `finally` есть окно, в котором in-flight операции могут долго ждать (rate-limit `getJitterMs` 20–45 сек).
- **CloakBrowser** — npm-пакет `cloakbrowser`, drop-in замена Playwright со stealth-Chromium. У возвращаемого `Browser` есть `browser.process()?.pid` (унаследовано от Playwright), который позволяет послать сигнал самому Chromium-процессу.
- **Bug Condition A (`C_A`)** — пользователь посылает Node-процессу обогатителя `SIGINT` или процесс падает по `uncaughtException`/`unhandledRejection`, и в системе ОСТАЮТСЯ дочерние процессы `chrome`/`chromium`/`Chromium Helper`/`cloakbrowser` после того, как родительский Node-процесс завершился.
- **Bug Condition B (`C_B`)** — `isBlocked(status, html)` возвращает `true` для пары `(status, html)`, в которой `status` НЕ является признаком блокировки (любой 2xx) и в `html` нет признаков реальной блокировки (нет cf-challenge form, нет редиректа `/cdn-cgi/`, нет cloudflare-iframe, нет совпадения по селекторам/тайтлу), но при этом в HTML где-то встретилась подстрока `captcha` или `access denied` (в футере, в названии товара, в SEO-блоке).
- **Property A (`P_A`)** — после завершения родительского Node-процесса (по любому пути: SIGINT, SIGTERM, нормальное завершение, uncaughtException) в системе нет живых дочерних Chromium/cloakbrowser-процессов, относящихся к этой сессии.
- **Property B (`P_B`)** — `isBlocked(status, html)` возвращает `true` тогда и только тогда, когда есть надёжный сигнал блокировки: HTTP 403, или HTTP 503 с cloudflare-маркерами, или cloudflare-challenge в DOM (`form#challenge-form`, `div#cf-challenge-running`, iframe от cloudflare/captcha), или title страницы соответствует cloudflare/access-denied, или есть редирект на `/cdn-cgi/`.
- **Preservation A (`¬C_A`)** — happy-path: пайплайн нормально завершает работу по окончании очереди (без SIGINT), все браузеры закрываются без зависаний, `closeAllBrowsers` отрабатывает быстро, существующие тесты orchestrator-а зелёные.
- **Preservation B (`¬C_B`)** — реальная блокировка (HTTP 403, страница cloudflare-challenge) продолжает корректно детектиться как `blocked`. Поведение `isBlocked(403, ...) = true` сохраняется. Поведение для пустого/любого HTML без признаков блокировки и со статусом 200 — `false`.
- **F** — текущая реализация (unfixed): `closeAllBrowsers` без таймаута и SIGKILL-fallback, `isBlocked` через `indexOf`.
- **F'** — после фикса: `closeAllBrowsers(timeoutMs)` с `Promise.allSettled` + per-browser `SIGKILL` через `browser.process()?.pid`, оркестратор в shutdown-pipeline ждёт in-flight операции до 10 сек и только потом `process.exit`; `isBlocked` через явные индикаторы и cheerio-селекторы плюс возврат `reason`-кода для логирования.
- **Дозабор blocked-записей** — одноразовый SQL-сброс записей `EnrichmentJournal.status = 'chipdip_blocked'`, у которых `errorMessage` не содержит явного 403, обратно в `pending` с последующим `pnpm enrichment:run --resume`.

## Requirements

### Требование 1: Текущее (дефектное) поведение

**User Story:** Как разработчик, поддерживающий обогатитель, я хочу зафиксировать наблюдаемое некорректное поведение в shutdown-пайплайне и в детекторе блокировки, чтобы у багфикса был воспроизводимый baseline.

#### Acceptance Criteria

1.1 WHEN пользователь посылает обогатителю `SIGINT` (Ctrl+C) во время активной обработки очереди, THEN после завершения родительского Node-процесса в системе остаются дочерние процессы `chrome`/`chromium`/`Chromium Helper`/`cloakbrowser`, не привязанные ни к какому живому ppid, и продолжают потреблять RAM.

1.2 WHEN происходит `uncaughtException` или `unhandledRejection` в Node-процессе обогатителя, THEN текущая реализация `installExitHandlers` пытается асинхронно вызвать `closeAllBrowsers()`, но `process.exit(1)` может быть вызван раньше, чем `browser.close()` успеет завершить рукопожатие с CDP, в результате чего хвостовые Chromium-процессы остаются в системе.

1.3 WHEN оркестратор получает `SIGINT`, THEN `handleShutdown` только выставляет флаг `shutdownRequested = true`, и in-flight операция (например, `page.goto` с `waitUntil: 'networkidle'` и таймаутом 60 сек, плюс `sleep(getJitterMs())` 20–45 сек) продолжает выполняться, удерживая `await client.searchMpn`. Между моментом получения сигнала и выходом в `finally` (где `closeAllBrowsers`) проходит до ~75 секунд, в течение которых пользователь может ещё раз нажать Ctrl+C, и Node-процесс завершится `process.exit(130)` БЕЗ вызова `closeAllBrowsers`.

1.4 WHEN `chipdip-client.teardown(browser)` вызывает `browser.close()` в try/catch, THEN при зависшем CDP вызов может ждать до 30+ секунд; эта ошибка глотается, и если в этот момент происходит SIGKILL родительского Node, Chromium остаётся живым.

1.5 WHEN страница chipdip.ru возвращает HTTP 200 с легитимным HTML, в теле которого встречается слово `captcha` (в футере, в SEO-описании, в названии товара) или `access denied` (например, в статье о программных решениях), THEN `isBlocked(200, html)` возвращает `true`, что приводит к ложному срабатыванию shutdown-логики ChipDip и/или к статусу `chipdip_blocked` в `EnrichmentJournal`.

1.6 WHEN происходит ложное срабатывание `isBlocked` на странице товара (а не на странице поиска), THEN `chipdip-client.searchMpn` возвращает `null` (товар «не найден на ChipDip»), статус артикула в журнале становится `chipdip_not_found`, и товар уходит в LCSC/Mouser-каскад впустую — обогащение с ChipDip потеряно без реальной блокировки.

1.7 WHEN происходит ложное срабатывание `isBlocked` на странице поиска (после двух retry с rotateSession), THEN клиент бросает `ChipDip blocked (403/CAPTCHA)`, оркестратор пишет статус `chipdip_blocked`, и весь ChipDip-цикл уходит в паузу `CHIPDIP_BLOCK_PAUSE_MS` (2–4 часа) без реальной блокировки.

1.8 WHEN `EnrichmentJournal.errorMessage` записывается в момент `chipdip_blocked`, THEN сейчас в нём нет структурированного поля «причина детекта» (например, `reason: 'http-403' | 'lower-includes-captcha' | 'lower-includes-access-denied'`), и при разборе будущих жалоб оператор не может отличить реальный 403 от ложного срабатывания по слову.

### Требование 2: Ожидаемое (корректное) поведение

**User Story:** Как оператор обогатителя, я хочу, чтобы Ctrl+C гарантированно убивал все Chromium-процессы, и чтобы статус `chipdip_blocked` ставился только при настоящей блокировке, чтобы не терять зря обогащение и не тратить часы на ложные паузы.

#### Acceptance Criteria

2.1 WHEN пользователь посылает `SIGINT` Node-процессу обогатителя, THEN THE Система SHALL гарантированно завершать все зарегистрированные `Browser`-инстансы (через `browser.close()`) в течение настраиваемого таймаута (по умолчанию 5000 мс на каждый), и для тех, что не закрылись за таймаут, SHALL посылать `SIGKILL` напрямую Chromium-процессу через `browser.process()?.pid` (Playwright API), и только после этого SHALL вызывать `process.exit`.

2.2 WHEN оркестратор получает `SIGINT`/`SIGTERM`, THEN THE Система SHALL: (а) выставить флаг shutdown, (б) дождаться завершения текущих in-flight операций с общим таймаутом не более 10 секунд (после чего in-flight отбрасываются), (в) вызвать `closeAllBrowsers(timeoutMs = 5000)`, (г) вызвать `process.exit(0)` при штатном shutdown или `process.exit(130)` при `SIGINT`. Этот пайплайн SHALL быть идемпотентен: повторный `SIGINT` во время shutdown SHALL не запускать второй параллельный shutdown, а во второй раз SHALL немедленно вызывать `closeAllBrowsers` с минимальным таймаутом и `process.exit`.

2.3 WHEN происходит `uncaughtException` или `unhandledRejection`, THEN `installExitHandlers` SHALL вызывать тот же shutdown-пайплайн (in-flight wait + `closeAllBrowsers` + `SIGKILL`-fallback), а не просто `closeAllBrowsers().then(exit)` без таймаута.

2.4 WHEN `process.on('exit', ...)` срабатывает (синхронный путь), THEN THE Система SHALL посылать `SIGKILL` всем зарегистрированным браузерам через `browser.process()?.pid` (публичный Playwright API), а не через приватное поле `_process`. Если `pid` недоступен — записывать предупреждение и продолжать (best-effort).

2.5 WHEN `closeAllBrowsers(timeoutMs)` вызвана, THEN THE Система SHALL параллельно вызывать `browser.close()` для всех зарегистрированных браузеров через `Promise.allSettled` с общим таймаутом `timeoutMs`. Если конкретный `browser.close()` не завершился к таймауту, SHALL послать `SIGKILL` его Chromium-процессу через `browser.process()?.pid`. Функция SHALL быть идемпотентна и SHALL не выкидывать исключений.

2.6 WHEN `isBlocked(status, html, headers?)` вызвана, THEN THE Система SHALL возвращать `true` тогда и только тогда, когда выполнено хотя бы одно из:
- `status === 403`
- `status === 503` И в `headers` есть какой-либо `cf-*` заголовок ИЛИ в `<title>` присутствует `cloudflare`
- DOM содержит селектор `form#challenge-form`
- DOM содержит селектор `div#cf-challenge-running`
- DOM содержит селектор `iframe[src*="captcha"]` ИЛИ `iframe[src*="cloudflare"]`
- `<title>` страницы (case-insensitive) содержит `cloudflare`, `доступ ограничен`, `access denied` ИЛИ `just a moment`
- Финальный URL ответа содержит `/cdn-cgi/` (если доступен)

2.7 WHEN `isBlocked` возвращает `true`, THEN THE Система SHALL также возвращать структурированный `reason` (одно из: `'http-403'`, `'http-503-cf'`, `'cf-challenge-form'`, `'cf-challenge-running'`, `'cf-iframe'`, `'title-match'`, `'cdn-cgi-redirect'`), и оркестратор SHALL включать этот `reason` в `EnrichmentJournal.errorMessage` (или в отдельное структурированное поле, если оно появится), чтобы при будущих жалобах было видно, что именно подняло флаг.

2.8 WHEN страница содержит подстроку `captcha` или `access denied` ТОЛЬКО внутри SEO/футера/названия товара/свободного текста (без cloudflare-маркеров в DOM, без 403/503, без cf-iframe, без challenge-form), THEN `isBlocked(200, html)` SHALL возвращать `false`.

2.9 WHEN сценарий проверки запускается с короткой очередью (1–2 MPN) в child-процессе, **получает SIGINT**, и родительский процесс завершается, THEN после завершения SHALL быть выполнено: в системе нет процессов с командной строкой, содержащей `chrome`/`chromium`/`cloakbrowser`/`Chromium Helper`, чьи родители — это завершившийся Node-процесс или `init/PID 1` (orphaned).

2.10 WHEN после фикса обнаружены 4 существующих записи `EnrichmentJournal.status = 'chipdip_blocked'`, THEN THE Система SHALL предоставить документированный SQL-скрипт, который сбрасывает в `pending` те записи, у которых `errorMessage` НЕ содержит явного маркера реальной блокировки (`http-403`, `cf-challenge-form` и т.п.). Если структурированного `errorMessage` ещё нет (для уже существующих записей) — SHALL быть допустим вариант сбросить все 4 в `pending` (пользователь это явно одобрил).

### Требование 3: Сохранение существующего поведения (regression prevention)

**User Story:** Как разработчик, я хочу, чтобы багфикс не сломал штатный happy-path и существующие тесты orchestrator-а.

#### Acceptance Criteria

3.1 WHEN обогатитель штатно завершает работу по окончании очереди (без SIGINT, все источники отработали), THEN `chipdip-client.close()` SHALL CONTINUE TO вызывать `teardown(browser)` без регрессий по времени (типичный штатный close — секунды, не минуты).

3.2 WHEN страница chipdip.ru возвращает HTTP 403, THEN `isBlocked(403, html)` SHALL CONTINUE TO возвращать `true` независимо от содержимого `html` — это надёжный сигнал блокировки.

3.3 WHEN страница содержит cloudflare-challenge (`form#challenge-form`, или title `Just a moment...`, или редирект на `/cdn-cgi/`), THEN `isBlocked` SHALL CONTINUE TO возвращать `true` — детект реальной блокировки сохраняется.

3.4 WHEN `isBlocked` вызвана с пустым HTML и статусом 200, THEN `isBlocked(200, '')` SHALL CONTINUE TO возвращать `false` (поведение «нет данных — не блокировка» сохраняется).

3.5 WHEN существующие unit-тесты `chipdip-client.test.ts`, `orchestrator.test.ts`, `browser-registry.test.ts` и любые другие тесты пакета `src/lib/enrichment/` запускаются после фикса, THEN они SHALL CONTINUE TO проходить без модификации (если только тест не утверждает старое неправильное поведение `isBlocked` через `indexOf` — такой тест допустимо обновить, но факт обновления зафиксировать в PR).

3.6 WHEN оркестратор обрабатывает остальные источники (LCSC, Mouser), THEN их код, обработка ошибок, `lcsc_blocked`-логика и квота Mouser SHALL CONTINUE TO работать без изменений — фикс затрагивает только ChipDip-клиент, browser-registry и shutdown-пайплайн в orchestrator.

3.7 WHEN `registerBrowser`/`unregisterBrowser`/`getActiveBrowserCount` используются в существующих тестах и существующем коде, THEN их публичная сигнатура SHALL CONTINUE TO быть совместимой; новая функция `closeAll(timeoutMs)` (или расширение существующей `closeAllBrowsers` параметром `timeoutMs`) SHALL быть обратно совместима — вызов без параметра SHALL работать как раньше (или с новым дефолтом 5000 мс, что эквивалентно для штатного happy-path).

3.8 WHEN происходит штатное `rotateSession` или `relaunchWithProxy` в `chipdip-client.ts`, THEN последовательность «закрыть старый — открыть новый» SHALL CONTINUE TO работать без регрессий, и новый таймаут на close SHALL не приводить к преждевременному SIGKILL для штатных переходов (5 сек таймаута достаточно для штатного close).

3.9 WHEN запускаются существующие тесты на парсер (`product-parser.test.ts`), персистентность (`persistence-service.test.ts`), очередь (`status-journal.test.ts`), THEN они SHALL CONTINUE TO проходить — фикс не трогает эти модули.
