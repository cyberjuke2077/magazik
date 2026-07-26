# Implementation Plan: Enrichment Live Observability

## Overview

Фича добавляет к `pnpm enrichment:run` живой TUI-дашборд (ink + React) и расширяет
`pnpm enrichment:status` режимами `--watch`, `--brand`, `--unresolved`, `--source-stats`.
Реализация делится на чистое ядро метрик и in-memory state (модули `observability/metrics.ts`,
`ring-buffer.ts`, `cli-args.ts`, `event-bus.ts`, `dashboard-state.ts`), TUI-компоненты на
`ink` (`src/components/enrichment-tui/`), а также точечные правки существующих модулей
(`logger.ts`, `progress-reporter.ts`, `orchestrator.ts`).

JSON-логи в `logs/enrichment-YYYY-MM-DD.log` остаются без изменений формата (req 13).
Spec НЕ реализует graceful shutdown и block-detection — только подключается к
существующему `shutdownWithCleanup()` (см. соседнюю спеку `enrichment-shutdown-and-block-detection`).

Property-based тесты (fast-check) применяются к чистым функциям метрик, ring buffer,
парсеру CLI, event-bus, dashboard-state. Для TUI-рендера используются snapshot-тесты
через `ink-testing-library`.

## Tasks

- [x] 1. Установить зависимости TUI и подготовить каталоги
  - Проверить совместимость `ink@5` с React 18 vs текущей версией React в `package.json`
    (Next.js 15 / React 19). При конфликте — поставить `react@18` как отдельную ветку
    зависимостей через `pnpm add` ИЛИ использовать `pnpm aliasing` так, чтобы Next.js
    продолжал работать со своей версией. Зафиксировать выбранный вариант в
    комментарии PR (риск отмечен в `design.md → Risks`).
  - `pnpm add -D ink@^5.0.1 react@^18.3.1 @types/react@^18.3.5 ink-testing-library@^3.0.0`
  - Зафиксировать точные установленные версии в `package.json`.
  - Если каталога нет — создать `src/lib/enrichment/observability/` (большая часть
    уже есть: `logger.ts`, `progress-reporter.ts`).
  - Создать пустой `src/components/enrichment-tui/` для TUI-компонентов.
  - Создать `src/lib/enrichment/constants/observability.ts` с
    `export const EXCEL_TOTAL_DEFAULT = 69_116`.
  - _Requirements: 1.1, 12.4, 12.5_

- [x] 2. Реализовать чистое ядро метрик (`metrics.ts`)
  - [x] 2.1 Реализовать `computeExcelRemaining`, `computeEtaSeconds`, `resolveExcelTotal`
    - Создать `src/lib/enrichment/observability/metrics.ts`
    - `computeExcelRemaining({ excelTotal, doneCount, unresolvedCount })`:
      `remaining = max(0, excelTotal - doneCount - unresolvedCount)`,
      `processed = doneCount + unresolvedCount`,
      `percent = excelTotal > 0 ? round(processed / excelTotal * 100) : 0`
    - `computeEtaSeconds(remaining, speedPerMin)`:
      если `speedPerMin <= 0` → `null`; если `remaining === 0` → `0`;
      иначе `round(remaining / speedPerMin * 60)`
    - `resolveExcelTotal(progress)`:
      если `progress?.totalProducts > 0` → `progress.totalProducts`,
      иначе `EXCEL_TOTAL_DEFAULT`
    - Чистые функции без I/O. Стиль `AGENTS.md` (одинарные кавычки, 2 пробела,
      без точек с запятой, max 100 символов).
    - _Requirements: 2.1, 2.2, 2.4, 12.4, 12.5_

  - [ ]* 2.2 Property-based тесты для прогрессовой арифметики
    - **Property 1: computeExcelRemaining консистентен**
    - **Validates: Requirements 2.1, 2.2**
    - **Property 2: ETA согласован со скоростью и остатком**
    - **Validates: Requirements 2.4**
    - **Property 16: `resolveExcelTotal` выбирается по приоритету**
    - **Validates: Requirements 12.4, 12.5**
    - Файл `src/lib/enrichment/observability/metrics.test.ts`,
      `numRuns: 100`, fast-check `fc.assert`.

  - [x] 2.3 Реализовать `computeSpeedShort`, `computeSpeedLong`
    - В том же `metrics.ts`:
      `computeSpeedShort(events, now, windowMs = 5*60_000)` —
      число событий с `ts ∈ [now - windowMs, now]`, делённое на `windowMs / 60_000`.
      `computeSpeedLong(processed, startedAt, now)` —
      `processed / ((now - startedAt) / 3_600_000)` для `now > startedAt`,
      иначе `0`.
    - _Requirements: 2.5_

  - [ ]* 2.4 Property-based тесты для скорости
    - **Property 3: Скорость в скользящем окне корректна**
    - **Validates: Requirements 2.5**
    - 100+ итераций с генерацией массивов timestamps.

  - [x] 2.5 Реализовать `computeSourcesPercent`, `computeHitRate`, `computeDurationStats`
    - `computeSourcesPercent({ chipdip, lcsc, mouser })`:
      сумма = 0 → `{ chipdip: 0, lcsc: 0, mouser: 0 }`;
      иначе округление каждого до целого процента.
      Допустимый диапазон суммы [99, 101] из-за округлений.
    - `computeHitRate({ done, notFound, blocked, failed })`:
      `total = done + notFound + (blocked ?? 0) + (failed ?? 0)`,
      `total === 0` → `0`, иначе `done / total ∈ [0, 1]`.
    - `computeDurationStats(durations: number[])`:
      пустой массив → `null`;
      возвращает `{ avg, median, p95, min, max }`.
    - _Requirements: 3.3, 10.2, 10.3, 15.2_

  - [ ]* 2.6 Property-based тесты для долей и hit rate
    - **Property 5: Сумма процентов по источникам равна 100 ± 1**
    - **Validates: Requirements 3.3, 15.2**
    - **Property 14: Hit rate в [0, 1], stats монотонны**
    - **Validates: Requirements 10.2, 10.3**
    - 500 итераций для P-5 (критично для UI).

- [x] 3. Реализовать `ring-buffer.ts` — типизированный фиксированный буфер
  - [x] 3.1 `RingBuffer<T>` с push / size / toArray
    - Создать `src/lib/enrichment/observability/ring-buffer.ts`
    - `class RingBuffer<T>(capacity: number)`:
      - `push(item: T): void`
      - `size: number` (геттер)
      - `toArray(): T[]` — возвращает элементы в порядке от нового к старому
    - Циклический массив фиксированного размера. При `capacity = 0` — `push` no-op.
    - _Requirements: 4.1, 14.3_

  - [ ]* 3.2 Property-based тесты для ring buffer
    - **Property 6: Ring buffer сохраняет только последние N**
    - **Validates: Requirements 4.1, 14.3**
    - 100+ итераций со случайной длиной push'ей и capacity.

- [x] 4. Реализовать `cli-args.ts` — парсер флагов для run и status
  - [x] 4.1 `parseRunArgs(argv)` и `parseStatusArgs(argv)`
    - Создать `src/lib/enrichment/observability/cli-args.ts`
    - `parseRunArgs(argv)` возвращает `RunCliFlags` с полем `noTui: boolean` —
      `true` если в `argv` есть `--no-tui` или `--log-mode`.
      Прочие существующие флаги обогатителя (`--input-dir`, `--batch-size`,
      `--resume`, `--dry-run`, `--skip-mouser`, `--skip-lcsc`, `--mouser-only`)
      поддерживаются без изменения их семантики.
    - `parseStatusArgs(argv)` возвращает `StatusCliFlags` с полями
      `watch`, `brand`, `unresolved`, `json`, `sourceStats`, `period`.
      Несовместимые комбинации (например `--unresolved --source-stats`,
      `--json` без `--unresolved`) → бросить ошибку с usage-сообщением.
    - Без сторонних библиотек (`commander`, `yargs`) — простой свитч.
    - _Requirements: 1.6, 7.1, 8.1, 9.1, 9.5, 10.1, 10.3_

  - [ ]* 4.2 Property-based тесты для парсера CLI
    - **Property 8: Парсер CLI распознаёт --no-tui / --log-mode**
    - **Validates: Requirements 1.6**
    - Дополнительно — example-тесты на несовместимые комбинации `parseStatusArgs`.

- [x] 5. Реализовать `event-bus.ts` — типизированный EventEmitter
  - [x] 5.1 `createEnrichmentEvents()` с try/catch-обёрткой подписчиков
    - Создать `src/lib/enrichment/observability/event-bus.ts`
    - Экспортировать типы: `EnrichmentSourceKind`, `EnrichmentPhase`,
      `EnrichmentJournalStatus`, `EnrichmentEventMap`, `EnrichmentEvents`.
    - `createEnrichmentEvents()`:
      - Внутри использует `node:events.EventEmitter`, `setMaxListeners(50)`.
      - `on(event, handler)` оборачивает handler в `try/catch`:
        при исключении подписчика — `process.stderr.write` (не silent-логгер,
        не падать), вернуть `unsubscribe`.
      - `emit(event, payload)` — синхронный.
      - `off(event, handler)` — снять конкретный handler.
    - _Requirements: 12.1, 12.2, 12.6, 12.7_

  - [ ]* 5.2 Property-based тест на изоляцию падения подписчика
    - **Property 17: Event-bus изолирует падение подписчика**
    - **Validates: Requirements 12.6, 15.3**
    - 500 итераций: handler с произвольным `throw new Error(...)`,
      второй handler не должен пострадать, `bus.emit` не выкидывает наружу.

- [x] 6. Реализовать `dashboard-state.ts` — in-memory агрегатор
  - [x] 6.1 Тип `DashboardState` и API `DashboardStateAPI`
    - Создать `src/lib/enrichment/observability/dashboard-state.ts`
    - Экспортировать тип `DashboardState` (см. design.md → Components).
    - `createDashboardState()` возвращает `DashboardStateAPI`:
      - `getState()` — readonly snapshot
      - `applyEvent(event, payload)` — синхронно мутирует state по типу события
      - `applySnapshot(snapshot)` — заменяет агрегированные поля
        (для watch-mode polling)
      - `applyCoverage(coverage)` — обновляет coverage и `updatedAt`
      - `subscribe(listener)` — re-render trigger; возвращает unsubscribe
    - Все обработчики `applyEvent` синхронны и неблокирующие.
    - Внутри использовать `RingBuffer<RecentEvent>(16)` и
      `RingBuffer<NotFoundEntry>(5)`.
    - `brandStats` — `Map<string, { done, remaining }>` с LRU-eviction до top-10
      по `total = done + remaining`.
    - `notify` через micro-batching: один `setImmediate(flush)` на N событий
      или каждые 100 мс — что наступит раньше.
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.4, 12.1, 12.7, 14.5_

  - [ ]* 6.2 Property-based тесты для счётчиков и hotkey-toggle
    - **Property 4: Счётчики статусов консистентны с потоком событий**
    - **Validates: Requirements 3.1, 12.7**
    - **Property 9: Hotkey toggle обладает round-trip-свойством**
    - **Validates: Requirements 5.3, 5.5**
    - **Property 10: Неизвестные клавиши не меняют state и не выкидывают исключений**
    - **Validates: Requirements 5.6**

- [x] 7. Реализовать `coverage-probe.ts` — Prisma-агрегаты coverage
  - [x] 7.1 `loadCoverage()` и `startCoverageProbe(api, intervalMs)`
    - Создать `src/lib/enrichment/observability/coverage-probe.ts`
    - `loadCoverage(): Promise<CoverageMetrics | null>`:
      `prisma.$transaction([...5 count'ов...])` по `enrichmentStatus IN ('complete','partial')`.
      `withDescription` — непустая строка ≠ `'Нет данных'`.
      `withSpecs` — `specifications: { some: {} }`.
      `withDatasheet` — `datasheets: { some: {} }`.
      `withCategory` — `NOT { category: { slug: 'uncategorized' } }`.
      `total === 0` → `null`.
    - `startCoverageProbe(api, intervalMs = 30_000)`:
      `setInterval` опрашивает `loadCoverage`, при ошибке — счётчик подряд-ошибок,
      после 3 подряд неудач помечает `coverage = null` и логирует
      `event: 'coverage_probe_failed'` в существующий logger.
      Возвращает функцию-стоп.
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 14.4_

  - [ ]* 7.2 Property-based тест на coverage-метрики
    - **Property 15: Coverage-метрики лежат в [0, 1]**
    - **Validates: Requirements 11.1, 11.4**
    - 100+ итераций с генерацией `CoverageMetrics`.

- [x] 8. Расширить `logger.ts` флагом `silent`
  - [x] 8.1 Добавить `CreateLoggerOptions { silent?: boolean }`
    - Открыть `src/lib/enrichment/observability/logger.ts`.
    - Расширить фабрику: при `silent: true` пропускать
      `console.log/warn/error`, файловую запись (`fs.appendFileSync`)
      ОСТАВИТЬ без изменений.
    - Формат JSON-записи в файл НЕ меняется (`timestamp`, `level`, `mpn`,
      `brand`, `source`, `event`, `durationMs`, `error?`, `proxyN?`).
    - Добавить новое событие `'tui_init_failed'` в whitelist допустимых
      `event`-значений (если такой whitelist есть).
    - _Requirements: 1.4, 1.8, 13.1, 13.2, 13.3, 13.4_

  - [ ]* 8.2 Property-based тест на silent-режим
    - **Property 7: Logger в режиме silent подавляет console, но не файл**
    - **Validates: Requirements 1.4, 13.3, 13.4**
    - Mock `console.log/warn/error` через `vi.spyOn`, mock `fs.appendFileSync`.

- [x] 9. Расширить `progress-reporter.ts` флагом `silentConsole`
  - [x] 9.1 Добавить `CreateProgressReporterOptions { silentConsole?: boolean }`
    - Открыть `src/lib/enrichment/observability/progress-reporter.ts`.
    - При `silentConsole: true` 60-секундная сводка в консоль НЕ печатается;
      БД-апдейт `ImportProgress` каждые 30 секунд продолжает работать.
    - _Requirements: 13.5_

  - [ ]* 9.2 Unit-тест на silentConsole
    - Mock `console.log`, fake timers (`vi.useFakeTimers`).
    - Убедиться, что после 60 с в `silentConsole: true` `console.log` не вызван,
      но БД-апдейт через 30 с произошёл.

- [x] 10. Интегрировать event-bus в `orchestrator.ts`
  - [x] 10.1 Принять `config.bus?: EnrichmentEvents`, эмитить события в ключевых точках
    - Открыть `src/lib/enrichment/orchestrator.ts`.
    - Расширить сигнатуру `runEnrichmentPipeline(config)`:
      добавить опциональное `config.bus`. Если `bus` не передан —
      использовать `no-op`-эмиттер (для тестов и dry-run).
    - Эмитить события:
      - перед `searchMpn(mpn)` → `mpn_started`
      - после `searchMpn` + persist → `mpn_completed` с финальным
        `EnrichmentJournalStatus` и `durationMs`
      - переход между очередями ChipDip/LCSC/Mouser → `phase_changed`
      - каждый запрос к Mouser API → `mouser_quota_used`
      - hotkey `p` или внешняя пауза → `paused` / `resumed`
      - получение SIGINT/Ctrl+C → `shutdown_initiated`
    - НЕ менять существующую логику обогащения, journal'а, persistence.
    - _Requirements: 12.1, 12.2, 12.7_

  - [ ]* 10.2 Unit-тест на эмиссию событий через мок-bus
    - Создать мок `EnrichmentEvents` (через `vi.fn`).
    - Прогнать одну итерацию обогащения с мок-источниками,
      проверить порядок и payload событий.

- [x] 11. Реализовать `db-poller.ts` — источник данных для watch-mode
  - [x] 11.1 `loadDashboardSnapshot(prisma)` и `startDbPoller(api, intervalMs)`
    - Создать `src/lib/enrichment/observability/db-poller.ts`.
    - `loadDashboardSnapshot(prisma): Promise<DashboardSnapshot>`:
      - `prisma.importProgress.findFirst({ orderBy: { createdAt: 'desc' } })`
      - `prisma.enrichmentJournal.groupBy({ by: ['status'], _count: { status: true } })`
      - топ-10 брендов через `groupBy({ by: ['brand', 'status'], ... })` +
        агрегация в коде
      - последние 16 событий через
        `findMany({ orderBy: { updatedAt: 'desc' }, take: 16 })`
      - последние 5 not_found через
        `findMany({ where: { status: { in: [...] } }, orderBy, take: 5 })`
      - Mouser-квота на сегодня
        (`count` записей с `mouserDay = today`)
    - `startDbPoller(api, intervalMs = 2000)`:
      `setInterval` → `loadDashboardSnapshot` → `api.applySnapshot(...)`.
      При ошибке БД — счётчик подряд-ошибок, после 3 подряд неудач
      помечает в state «БД недоступна», логирует `event: 'db_poll_failed'`.
      Возвращает функцию-стоп.
    - _Requirements: 7.2, 12.3, 12.5, 14.4_

  - [ ]* 11.2 Unit-тест с моком Prisma
    - Mock `@/lib/prisma` через `vi.mock`.
    - Тест: пустая БД → дефолтный snapshot (req 6.3, 7.3, 12.5).
    - Тест: 3 подряд ошибки → state помечен «БД недоступна»,
      logger вызван с `event: 'db_poll_failed'`.

- [x] 12. Реализовать TUI-компоненты на ink
  - [x] 12.1 `<App>` — root-компонент с режимами live/watch/snapshot
    - Создать `src/components/enrichment-tui/app.tsx`.
    - Props: `mode: 'live' | 'watch' | 'snapshot'`,
      `bus?: EnrichmentEvents`, `state: DashboardState | DashboardStateAPI`.
    - В `mode='live'`: подписка на `bus` через `EventSubscriber`.
    - В `mode='watch'`: запуск `startDbPoller` + `startCoverageProbe`.
    - В `mode='snapshot'`: фиксированный state, без подписок.
    - Хук `useDashboardSelector(selector)` для узких подписок per-компонент
      (re-render только изменившегося блока, req 1.3).
    - Layout — `<Static>` для `Header`, `<Box flexDirection="column">` для остальных.
    - При `process.stdout.columns < 80 || process.stdout.rows < 20` —
      компактный layout: только ProgressBar + CurrentTask + StatusCounters +
      предупреждающая строка (req 1.7).
    - При `NO_COLOR=1` или non-TTY — отключить цвета (`chalk.level = 0`).
    - _Requirements: 1.1, 1.2, 1.3, 1.7, 4.3_

  - [x] 12.2 Базовые блоки прогресса и текущей задачи
    - В `src/components/enrichment-tui/`:
      - `header.tsx` — runId, режим, фаза, индикатор паузы
      - `progress-bar.tsx` — `X / Y MPN, Z%` + графический бар
      - `excel-remainder.tsx` — `Осталось из Excel: A / 69116 (B%)`,
        отображает `? / 69116` если `excelTotal` неизвестен
      - `current-task.tsx` — MPN, бренд, время старта в `HH:MM:SS`
      - `speed-panel.tsx` — speedShort/speedLong/uptime/ETA
    - Каждый компонент — функциональный, использует
      `useDashboardSelector`.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 12.5_

  - [x] 12.3 Блоки счётчиков и разбивок
    - В `src/components/enrichment-tui/`:
      - `status-counters.tsx` — счётчики `chipdip_done`, `chipdip_not_found`,
        `chipdip_blocked`, `lcsc_done`, `lcsc_not_found`, `mouser_done`,
        `mouser_not_found`, `unresolved` (абсолютные числа)
      - `sources-breakdown.tsx` — `%ChipDip / %LCSC / %Mouser`
        через `computeSourcesPercent`
      - `brands-breakdown.tsx` — топ-10 брендов: `done X / rem Y`
      - `mouser-quota.tsx` — `X / 1000 на сегодня`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 12.4 Coverage, лента событий и not-found
    - В `src/components/enrichment-tui/`:
      - `coverage.tsx` — description / specs / datasheet / category в %.
        При `coverage === null` рендерит «Coverage: нет обработанных товаров»
        либо «Coverage: недоступно» при 3+ подряд неудачах probe.
      - `event-log.tsx` — последние 10–20 строк (берём из `RingBuffer(16)`),
        формат: `<icon> HH:MM:SS  MPN  brand  status`,
        цвета: зелёный для `*_done`, красный для `*_not_found`/`unresolved`,
        жёлтый для `*_blocked`/`*_failed`. При non-TTY/NO_COLOR — без цветов.
      - `not-found-list.tsx` — последние 5 со статусами
        `chipdip_not_found`/`lcsc_not_found`/`mouser_not_found`/`unresolved`
        с указанием бренда и источника.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 11.1, 11.2, 11.4_

  - [ ]* 12.5 Footer и HelpOverlay
    - `footer.tsx` — `q: quit  p: pause/resume  ?: help`.
    - `help-overlay.tsx` — overlay со списком всех hotkeys.
      Видимость — из `state.helpVisible` (toggled через `?`).
    - Тривиальная логика → snapshot-тесты опциональны.

  - [x] 12.6 Hotkey-handler через `useInput`
    - Создать `src/components/enrichment-tui/hotkeys.tsx` или встроить в `<App>`.
    - `useInput((input, key) => { ... })`:
      - `key.ctrl && input === 'c'` → `triggerShutdown()`
      - `input === 'q'` → `triggerShutdown()`
      - `input === 'p'`:
        в `mode === 'watch'` — игнорировать (req 7.5);
        иначе `togglePause()` (эмит `paused`/`resumed` в bus)
      - `input === '?'` → `toggleHelp()`
      - любая другая клавиша — silently ignored, без падения
    - `triggerShutdown()`:
      в `mode === 'live'` — вызов `shutdownWithCleanup()` из
      `browser-registry.ts` (соседняя спека) ИЛИ синхронный
      `bus.emit('shutdown_initiated', ...)` (если `shutdownWithCleanup`
      ещё не подключён);
      в `mode === 'watch'` — `process.exit(0)`.
    - Обработчик НЕ блокирует — никаких `await`, `setTimeout`.
    - `shutdownInitiated`-флаг для idempotency: повторный `q`/`Ctrl+C` — no-op.
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.5_

  - [ ]* 12.7 Snapshot-тесты TUI-компонентов
    - Использовать `ink-testing-library`.
    - Тесты в `src/components/enrichment-tui/`:
      - `app.snapshot.test.tsx` — фиксированный state, проверка `lastFrame()`
      - `current-task.snapshot.test.tsx`
      - `event-log.snapshot.test.tsx` — с цветами и без (NO_COLOR=1)
      - `help-overlay.snapshot.test.tsx`
      - компактный layout при `columns < 80`
    - **Property 11: Snapshot без TTY не содержит ANSI-escape-кодов**
    - **Validates: Requirements 4.3, 6.4**

- [x] 13. Чекпоинт — модули observability собраны и протестированы
  - Запустить `pnpm test src/lib/enrichment/observability/`,
    `pnpm test src/components/enrichment-tui/`, `pnpm tsc --noEmit`,
    `pnpm lint`. Все зелёные.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Интегрировать TUI в `enrichment-run.ts`
  - [x] 14.1 Подключить `parseRunArgs`, isTTY-детект, mount ink
    - Открыть `src/scripts/enrichment-run.ts`.
    - В начале:
      ```
      const flags = parseRunArgs(process.argv)
      const tuiEnabled = process.stdout.isTTY && !flags.noTui &&
                         process.env.NO_TUI !== '1'
      const logger = createLogger({ silent: tuiEnabled })
      const progress = createProgressReporter({ silentConsole: tuiEnabled })
      const bus = createEnrichmentEvents()
      ```
    - Запустить `runEnrichmentPipeline({ bus, logger, progress, ... })`.
    - Если `tuiEnabled`:
      ```
      try {
        const { render } = await import('ink')
        const { App } = await import('@/components/enrichment-tui/app')
        render(<App mode='live' bus={bus} state={dashboardState} />)
      } catch (err) {
        logger.warn({ event: 'tui_init_failed', error: String(err) })
        // Fallback: ничего не делаем, обогатитель и logger в legacy уже работают.
        // Переключить logger.silent → false можно через recreate, но проще оставить
        // file-only — пользователь увидит ошибку через `logs/`. Документировать.
      }
      ```
    - При non-TTY ИЛИ `--no-tui` ИЛИ `NO_TUI=1` — TUI не монтируется,
      logger в обычном режиме (`silent: false`), progress печатает сводку
      каждые 60 с (legacy-режим).
    - SIGINT/SIGTERM — пробрасывать на существующий механизм
      `installExitHandlers`/`shutdownWithCleanup` из соседней спеки;
      hotkey `q`/`Ctrl+C` ink → тот же путь.
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.8, 13.3, 13.4, 13.5_

  - [ ]* 14.2 Интеграционный smoke-тест запуска с TUI и без
    - Через `child_process.spawn` запустить `pnpm tsx src/scripts/enrichment-run.ts
      --dry-run --no-tui` → убедиться, что в stdout идёт legacy JSON.
    - `--dry-run` без `--no-tui` под non-TTY pipe → также legacy
      (auto-fallback, req 1.5).
    - _Requirements: 1.5, 1.6_

- [x] 15. Расширить `enrichment-status.ts` (snapshot + watch + brand + unresolved + source-stats)
  - [x] 15.1 Dispatch по флагам и режим snapshot
    - Открыть `src/scripts/enrichment-status.ts`.
    - Заменить логику на dispatch через `parseStatusArgs`:
      ```
      if (flags.watch && !flags.brand)        return runWatchMode(flags)
      if (flags.brand)                         return runBrandReport(flags)
      if (flags.unresolved)                    return runUnresolvedReport(flags)
      if (flags.sourceStats)                   return runSourceStatsReport(flags)
      const snapshot = await loadDashboardSnapshot(prisma)
      const coverage = await loadCoverage()
      printSnapshot({ snapshot, coverage }, { color: process.stdout.isTTY })
      ```
    - `printSnapshot` рендерит через `ink.render(<App mode='snapshot' .../>)`
      и `waitUntilExit`. При `!isTTY` — strip ANSI.
    - Если нет активного `ImportProgress(status='running')` →
      header «Обогатитель не запущен», но ленту/счётчики/coverage
      показываем по последним накопленным данным.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 11.1, 11.2_

  - [x] 15.2 `runWatchMode` — TUI-watcher
    - `runWatchMode(flags)`:
      `ink.render(<App mode='watch' state={...} />)`,
      внутри `<App>` стартуют `startDbPoller(api, 2000)` и
      `startCoverageProbe(api, 30_000)`.
    - При `q`/`Ctrl+C` — `process.exit(0)` (не трогаем работающий обогатитель).
    - Поддержать комбинацию `--watch --brand <name>`:
      внутри watcher фильтровать данные по канонический бренду
      (case-insensitive).
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.5_

  - [x] 15.3 `runBrandReport` — детальный отчёт по бренду
    - `runBrandReport({ brand, watch })`:
      найти `Manufacturer` по `name ILIKE` (case-insensitive).
      Если не найден — `console.error('Бренд не найден')`, exit 1.
    - Вывести: общее число MPN, число `done`, число `unresolved`,
      разбивку по статусам `EnrichmentJournal`,
      список последних 10 ошибок (`status ∈ {*_blocked, *_failed, *_not_found}`,
      DESC по `updatedAt`) с MPN, статусом, timestamp, error message.
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 15.4 Property-based тесты для `runBrandReport`
    - **Property 12: Поиск по бренду регистронезависим**
    - **Validates: Requirements 8.1**
    - **Property 13: Списки ошибок корректно фильтруются, сортируются и лимитируются**
    - **Validates: Requirements 8.3, 9.1, 9.3, 9.4, 9.5**
    - Через мок `prisma` (vi.mock).

  - [x] 15.5 `runUnresolvedReport`
    - `runUnresolvedReport({ json })`:
      `prisma.enrichmentJournal.findMany({ where: { status: 'unresolved' },
      orderBy: { updatedAt: 'desc' } })`.
    - Без `--json`: показать первые 100, при `count > 100` —
      сообщение «показано 100 из N, используйте экспорт для полного списка».
    - С `--json`: вывести полный массив через `JSON.stringify` без обрезки.
    - Для каждой записи: canonicalMpn, originalMpn, canonicalBrand,
      lastSource, updatedAt.
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 15.6 `runSourceStatsReport`
    - `runSourceStatsReport({ period })`:
      - Hit rate из `prisma.enrichmentJournal.groupBy({ by: ['status'] })`
        для каждого источника (см. `computeHitRate`).
      - Длительности — стримовое чтение JSON-логов
        `logs/enrichment-YYYY-MM-DD.log` через `readline.createInterface`
        (НЕ `fs.readFileSync` — может быть большой);
        фильтр по `period` (по умолчанию — текущий день);
        агрегация через `computeDurationStats`.
      - Если лог за период недоступен — `'нет данных'` для среднего/медианы/p95,
        НЕ падать (req 10.4).
      - Вывести таблицу: source / hitRate / avg / median / p95 / blocked-rate / failed-rate.
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 15.7 Integration-тесты с моком Prisma
    - Файл `src/scripts/enrichment-status.integration.test.ts`.
    - `vi.mock('@/lib/prisma', ...)`.
    - Покрыть: snapshot без флагов, `--brand <name>` (включая ненайденный
      бренд → exit 1), `--unresolved` (с обрезкой и `--json`),
      `--source-stats` без лога за период, `--source-stats` с моком readline.
    - _Requirements: 15.5_

- [x] 16. Обновить `package.json` и документацию
  - В `package.json`:
    - убедиться, что есть `"enrichment:run": "tsx src/scripts/enrichment-run.ts"`
      и `"enrichment:status": "tsx src/scripts/enrichment-status.ts"`.
    - При желании добавить алиас `"enrichment:watch": "tsx src/scripts/enrichment-status.ts --watch"`.
  - Никаких изменений в `next.config.ts`, в Prisma-схему, в БД-миграции
    эта спека НЕ вносит.
  - _Requirements: 1.1, 7.1_

- [x] 17. Финальный чекпоинт
  - Запустить:
    - `pnpm lint` — без ошибок
    - `pnpm tsc --noEmit` — strict-mode без ошибок типов
    - `pnpm test` — все unit/property тесты зелёные
    - `pnpm test src/lib/enrichment/observability/` отдельно
    - `pnpm test src/components/enrichment-tui/` отдельно
  - Ручная верификация (опционально):
    - `pnpm enrichment:run --dry-run` в TTY — убедиться, что TUI
      запустился, видны прогресс/счётчики, hotkeys работают (q/p/?).
    - `pnpm enrichment:run --dry-run --no-tui` — legacy JSON в stdout.
    - `pnpm enrichment:run --dry-run | cat` — auto-fallback на legacy.
    - `pnpm enrichment:status` — снапшот.
    - `pnpm enrichment:status --watch` в другом терминале одновременно —
      обновляется без падений.
    - `pnpm enrichment:status --brand "STMicroelectronics"`,
      `--unresolved`, `--source-stats`.
  - При появлении вопросов (например, конфликт ink с React 19) — задать
    оператору и не двигаться дальше до подтверждения.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` опциональны и могут быть пропущены для быстрого MVP.
- Каждая задача ссылается на конкретные требования.
- PBT (fast-check) применяется к чистым функциям метрик, ring buffer, парсеру CLI,
  event-bus, dashboard-state. Snapshot-тесты — для UI через `ink-testing-library`.
- JSON-лог `logs/enrichment-YYYY-MM-DD.log` пишется без изменений формата — req 13.
- Graceful shutdown и block-detection — в соседней спеке
  `enrichment-shutdown-and-block-detection`. Эта спека только подключается
  к существующему `shutdownWithCleanup()` через hotkey-handler.
- Стиль кода — `AGENTS.md`: одинарные кавычки, 2 пробела, без точек с запятой,
  max 100 символов.
- Если `ink@5` несовместим с React 19 проекта — fallback стратегия описана
  в task 1 (отдельная ветка зависимостей или aliasing).
- Бенчмарк CPU/RAM (req 14.1, 14.2) выполняется руками, не в CI;
  отдельный benchmark-скрипт не входит в эту спеку.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.5", "3.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.6", "3.2", "4.2", "5.1", "7.1"] },
    { "id": 3, "tasks": ["5.2", "6.1", "7.2", "8.1", "9.1", "11.1"] },
    { "id": 4, "tasks": ["6.2", "8.2", "9.2", "10.1", "11.2", "12.1"] },
    { "id": 5, "tasks": ["10.2", "12.2", "12.3", "12.4", "12.5", "12.6"] },
    { "id": 6, "tasks": ["12.7", "13"] },
    { "id": 7, "tasks": ["14.1", "15.1", "15.3", "15.5", "15.6"] },
    { "id": 8, "tasks": ["14.2", "15.2", "15.4", "15.7", "16"] },
    { "id": 9, "tasks": ["17"] }
  ]
}
```
