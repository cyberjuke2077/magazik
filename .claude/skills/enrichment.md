# Скилл: Enrichment-пайплайн

## Запуск

```bash
# Полный прогон (с Ink TUI)
npm run enrichment:run

# С опциями
npm run enrichment:run -- --input-dir /path/to/excels --batch-size 50
npm run enrichment:run -- --resume           # продолжить с места остановки
npm run enrichment:run -- --dry-run --limit 3 --no-tui # только вход, без БД/API
npm run enrichment:run -- --skip-chipdip     # начать с LCSC
npm run enrichment:run -- --skip-lcsc        # после ChipDip перейти в Mouser
npm run enrichment:run -- --skip-mouser      # пропустить Mouser
npm run enrichment:run -- --mouser-only      # только Mouser
npm run enrichment:run -- --force-refresh    # игнорировать freshness cache
npm run enrichment:run -- --no-tui           # legacy-логи вместо Ink TUI

# Статус и мониторинг
npm run enrichment:status
npm run enrichment:watch
```

Входная директория с `.xlsx`, `.xls` и `.csv` задаётся через
`ENRICHMENT_INPUT_DIR` в `.env`. Обязателен MPN, бренд необязателен. Dry-run
завершается после import, normalization и deduplication, не требует
`DATABASE_URL` и не обращается к источникам.

## Безопасность входных файлов

- Excel-импорт является локальным служебным инструментом и не входит в production runtime.
- Принимать только доверенные файлы, которые владелец проекта получил от согласованного поставщика и проверил до запуска.
- Не подключать `xlsx`-парсер к публичной форме загрузки: у npm-пакета `xlsx` нет исправленной версии для опубликованных advisory по prototype pollution и ReDoS.
- Для неизвестных файлов использовать изолированное окружение или предварительно конвертировать их в проверенный CSV.

## Источники данных (приоритет)

1. **ChipDip** - stealth Chromium через cloakbrowser, русское описание и самый
   сильный приоритет полей.
2. **LCSC** - SPA и JSON-LD через cloakbrowser, английский fallback.
3. **Mouser API** - REST API, требует `MOUSER_API_KEY`, лимит один запрос в
   секунду и 1000 в сутки.

Каждый источник обязан вернуть точный нормализованный MPN. Блокировка или
явный skip переводит журнал к следующему источнику. Английская карточка остаётся
`partial` до локализации.

## Расположение кода

```
src/lib/enrichment/
├── ingest/
│   ├── excel-importer.ts      # парсинг .xlsx/.xls/.csv, авто-детект заголовков
│   ├── mpn-normalizer.ts      # нормализация MPN
│   └── brand-mapper.ts        # маппинг брендов
├── sources/
│   ├── mouser-client.ts       # Mouser REST API client
│   ├── lcsc-client.ts         # LCSC SPA + JSON-LD
│   └── chipdip-client.ts      # ChipDip stealth Chromium
├── persistence/               # запись результатов в Postgres
├── observability/
│   ├── event-bus.ts           # события пайплайна
│   ├── dashboard-state.ts     # состояние для Ink TUI
│   └── logger.ts
├── orchestrator.ts            # главный пайплайн
└── browser-registry.ts        # учёт Chromium-процессов
```

## orchestrator.ts

Главный файл пайплайна:
1. Читает Excel-файлы из `ENRICHMENT_INPUT_DIR`
2. Нормализует MPN через `mpn-normalizer.ts`
3. Для каждого уникального `(brand, mpn)` создаёт запись в `EnrichmentJournal`
4. Прогоняет каскад ChipDip -> LCSC -> Mouser
5. Сохраняет результат до перевода статуса журнала на следующий этап
6. При block или skip двигает все незавершённые записи к следующему источнику
7. Флаг `--resume` продолжает последний незавершённый `runId`

## EnrichmentJournal (модель в Prisma)

```
EnrichmentJournal {
  runId          # ID текущего прогона
  canonicalBrand # нормализованное название бренда
  canonicalMpn   # нормализованный MPN
  originalMpn    # оригинальный MPN из Excel
  status         # pending | chipdip_* | lcsc_* | mouser_* | unresolved
  errorMessage   # причина block, skip или ошибки
  attempts       # число попыток
  mouserDay      # дата последнего Mouser-запроса (для квоты)
}
```

## browser-registry.ts

Хранит ссылки на все запущенные Chromium-процессы. При Ctrl+C или SIGTERM закрывает все браузеры перед выходом - без него процессы зависают в фоне.

## Типичные проблемы

- **ChipDip block** - текущая и оставшиеся позиции переходят в LCSC, многочасовой
  sleep внутри прогона не используется.
- **LCSC 403/429** - клиент бросает `LcscBlockedError`, оставшиеся позиции
  переходят в Mouser или unresolved finalizer.
- **Mouser квота** - 1000 запросов/сутки. `mouserDay` в журнале трекает дату, чтобы не превысить.
- **MPN-only miss** - если ни один источник не определил производителя, запись
  остаётся unresolved в журнале без фиктивной товарной карточки.
- **ChipDip зависание** - если браузер завис, `browser-registry.ts` убивает процесс при следующем graceful shutdown.
