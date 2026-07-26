# Скилл: Enrichment-пайплайн

## Запуск

```bash
# Полный прогон (с Ink TUI)
npm run enrichment:run

# С опциями
npm run enrichment:run -- --input-dir /path/to/excels --batch-size 50
npm run enrichment:run -- --resume           # продолжить с места остановки
npm run enrichment:run -- --dry-run          # без реальных API-вызовов
npm run enrichment:run -- --skip-mouser      # пропустить Mouser
npm run enrichment:run -- --mouser-only      # только Mouser
npm run enrichment:run -- --no-tui           # legacy-логи вместо Ink TUI

# Статус и мониторинг
npm run enrichment:status
npm run enrichment:watch
```

Входная директория с Excel-файлами задаётся через `ENRICHMENT_INPUT_DIR` в `.env`.

## Источники данных (приоритет)

1. **Mouser API** - REST API, быстрый, надёжный, требует `MOUSER_API_KEY`. Квота: один запрос/сек, 1000/сутки.
2. **LCSC** - scraping через Axios + cheerio. Может давать soft-rate-limit (~17 запросов подряд). Источник реализует `isBlocked()` и early-stop heuristic.
3. **ChipDip** - stealth Chromium через cloakbrowser. Самый медленный, используется как fallback.

## Расположение кода

```
src/lib/enrichment/
├── ingest/
│   ├── excel-importer.ts      # парсинг .xlsx/.xls/.csv, авто-детект заголовков
│   ├── mpn-normalizer.ts      # нормализация MPN
│   └── brand-mapper.ts        # маппинг брендов
├── sources/
│   ├── mouser-api.ts          # Mouser REST API client
│   ├── lcsc-client.ts         # LCSC scraping
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
3. Для каждого уникального (brand, mpn) создаёт запись в `EnrichmentJournal`
4. Прогоняет по источникам в порядке приоритета (Mouser → LCSC → ChipDip)
5. При успехе обновляет `Product` в Postgres и помечает запись в журнале как `resolved`
6. При ошибке помечает `failed` с `errorMessage`, увеличивает `attempts`
7. Флаг `--resume` пропускает уже `resolved` записи текущего `runId`

## EnrichmentJournal (модель в Prisma)

```
EnrichmentJournal {
  runId          # ID текущего прогона (uuid)
  canonicalBrand # нормализованное название бренда
  canonicalMpn   # нормализованный MPN
  originalMpn    # оригинальный MPN из Excel
  status         # pending | resolved | failed | skipped
  errorMessage   # текст ошибки если failed
  attempts       # число попыток
  mouserDay      # дата последнего Mouser-запроса (для квоты)
}
```

## browser-registry.ts

Хранит ссылки на все запущенные Chromium-процессы. При Ctrl+C или SIGTERM закрывает все браузеры перед выходом - без него процессы зависают в фоне.

## Типичные проблемы

- **LCSC isBlocked()** - после ~17 успешных запросов источник возвращает soft-block. Пайплайн останавливает LCSC и переходит к ChipDip.
- **Mouser квота** - 1000 запросов/сутки. `mouserDay` в журнале трекает дату, чтобы не превысить.
- **ChipDip зависание** - если браузер завис, `browser-registry.ts` убивает процесс при следующем graceful shutdown.
