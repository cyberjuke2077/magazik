# Design Document

Дизайн: обогащение данных о товарах (product-data-enrichment)

## Overview

Фича реализует CLI-пайплайн обогащения товарных данных для **69 116 артикулов** из 11 файлов (10 xlsx + 1 csv) китайского поставщика. Пайплайн работает как автономный Node.js-скрипт (не часть Next.js runtime), запускаемый через `pnpm tsx`.

Ключевые принципы:
- **Три источника**: ChipDip (основной, русские данные) → LCSC (вторичный, английские данные) → Mouser API (третичный, английские данные для не найденных ни на ChipDip, ни на LCSC).
- **CloakBrowser без прокси** — основной режим для ChipDip и LCSC. Прокси — опциональный fallback только для ChipDip при блокировке (403).
- **Антидетекция**: рандомизация viewport, блокировка ресурсов (images/fonts/stylesheets), ротация User-Agent, лимит 180 req/hr на IP для ChipDip.
- **Переиспользование кода**: существующий `product-parser.ts` (Cheerio), `proxy-manager.ts`, `rate-limiter.ts`.
- **Идемпотентность**: повторный запуск не дублирует и не портит данные.
- **Провенанс**: каждое поле помечено источником; более сильный источник не перезаписывается слабым (ChipDip (4) > LCSC (3) > Mouser (2) > supplier-stub (1)).
- **Устойчивость**: остановка/возобновление через per-MPN журнал статусов. Полный цикл ≈ 3-4 недели.
- **Безопасность**: секреты только из `.env`, никогда в логах.

**Nexar API НЕ используется** (бесплатный тариф ≈ 10 запросов, непригоден для 69k артикулов).

## Architecture

### Диаграмма компонентов

```mermaid
graph TB
    subgraph CLI["CLI Entry Points"]
        RUN["enrichment-run.ts"]
        STATUS["enrichment-status.ts"]
    end

    subgraph Core["Core Pipeline"]
        ORCH["Orchestrator"]
        JOURNAL["EnrichmentJournal"]
    end

    subgraph Ingest["Ingest Layer"]
        EXCEL["ExcelImporter"]
        NORM["MpnNormalizer"]
        BRAND["BrandMapper"]
        DEDUP["Deduplicator"]
    end

    subgraph Sources["Data Sources"]
        CHIPDIP["ChipDipClient\n(CloakBrowser, без прокси по умолчанию)"]
        LCSC["LcscClient\n(CloakBrowser, без прокси)"]
        MOUSER["MouserClient\n(REST API, 1000/day)"]
    end

    subgraph Persist["Persistence Layer"]
        PERSIST["PersistenceService"]
        PROV["ProvenanceMerger"]
        HEAD["HeadValidator"]
    end

    subgraph Infra["Infrastructure (reused)"]
        PROXY["proxy-manager.ts"]
        RATE["rate-limiter.ts"]
        PARSER["product-parser.ts"]
        LOG["Logger"]
        PROGRESS["ProgressReporter"]
    end

    RUN --> ORCH
    STATUS --> JOURNAL
    STATUS --> PROGRESS

    ORCH --> EXCEL
    EXCEL --> NORM
    EXCEL --> BRAND
    NORM --> DEDUP
    DEDUP --> JOURNAL

    ORCH --> CHIPDIP
    ORCH --> LCSC
    ORCH --> MOUSER
    ORCH --> PERSIST

    CHIPDIP --> PROXY
    CHIPDIP --> PARSER
    LCSC --> RATE
    MOUSER --> RATE

    PERSIST --> PROV
    PERSIST --> HEAD

    CHIPDIP --> LOG
    LCSC --> LOG
    MOUSER --> LOG
    ORCH --> JOURNAL
    ORCH --> PROGRESS
```

### Диаграмма потока данных

```mermaid
flowchart LR
    A["Excel/CSV\n11 файлов\n69 116 строк"] --> B["ExcelImporter\n(автодетект заголовков)"]
    B --> C["MpnNormalizer\n+ BrandMapper"]
    C --> D["Deduplicator\n(brand + mpn)"]
    D --> E["EnrichmentJournal\n(pending)"]

    E --> F["ChipDip Queue\n(concurrency 1-3\njitter 15-30s\nбез прокси)"]
    F -->|found| G["product-parser.ts\n(Cheerio extraction)"]
    F -->|not found| H["chipdip_not_found"]

    G --> I["EnrichmentResult\n(source: chipdip)"]
    H --> J["LCSC Queue\n(concurrency 1\njitter 5-10s\nбез прокси)"]

    J -->|found| K["lcsc-parser.ts\n(Cheerio extraction)"]
    J -->|not found| L["lcsc_not_found"]

    K --> M["EnrichmentResult\n(source: lcsc)"]
    L --> N["Mouser Queue\n(sequential, 1/sec\n1000/day)"]

    N -->|found + brand match| O["EnrichmentResult\n(source: mouser)"]
    N -->|not found| P["unresolved"]

    I --> Q["HeadValidator\n(datasheets only)"]
    M --> R["HeadValidator\n(images + datasheets)"]
    O --> S["HeadValidator\n(images + datasheets)"]

    Q --> T["ProvenanceMerger"]
    R --> T
    S --> T
    P --> T

    T --> U["PersistenceService\n(batch upsert 50/txn)"]
    U --> V[("PostgreSQL\nPrisma models")]
```

