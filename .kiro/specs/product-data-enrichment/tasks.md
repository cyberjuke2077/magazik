# Implementation Plan: Product Data Enrichment

## Overview

CLI-пайплайн обогащения 69 116 артикулов из Excel/CSV-файлов поставщика. Три источника в каскаде: ChipDip (основной, CloakBrowser без прокси, прокси — fallback) → LCSC (вторичный, CloakBrowser без прокси) → Mouser API (третичный, 1000/день). Реализация на TypeScript, Prisma, Vitest, fast-check. Переиспользуются существующие модули: `product-parser.ts`, `proxy-manager.ts`, `rate-limiter.ts`.

## Tasks

- [x] 1. Prisma schema migration, seed category, core types and config
  - [x] 1.1 Update Prisma schema and run migration
    - Add fields to `Product`: `mpnNormalized`, `lifecycle`, `package`, `lastEnrichedAt`, `enrichmentStatus`, `enrichmentMeta`
    - Add `@@unique([manufacturerId, mpnNormalized])` composite index
    - Add `nameNeedsReview` to `Category`
    - Create `EnrichmentJournal` model with statuses: `pending`, `chipdip_done`, `chipdip_not_found`, `chipdip_blocked`, `lcsc_done`, `lcsc_not_found`, `lcsc_blocked`, `mouser_queued`, `mouser_done`, `mouser_not_found`, `mouser_failed`, `mouser_brand_mismatch`, `done`, `unresolved`
    - Run `pnpm prisma migrate dev --name add-enrichment-fields`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [x] 1.2 Create seed script for "Без категории" category
    - Create `prisma/seed-enrichment.ts` that upserts Category with slug `uncategorized`, name `Без категории`
    - Ensure idempotent (Prisma upsert)
    - _Requirements: 5.6, 6.8_

  - [x] 1.3 Create enrichment types and interfaces
    - Create `src/lib/enrichment/types.ts` with: `DataSource` (chipdip | lcsc | mouser | stub), `SOURCE_PRIORITY` (chipdip=4, lcsc=3, mouser=2, stub=1), `EnrichmentItemStatus`, `SupplierRow`, `PartIdentity`, `EnrichmentResult`, `FieldProvenance`, `EnrichmentMeta`, `EnrichmentConfig`
    - _Requirements: 5.12, 5.13_

  - [x] 1.4 Create enrichment config loader
    - Create `src/lib/enrichment/config.ts` that reads and validates env vars: `CHIPDIP_PROXY_TEMPLATE` (optional), `CHIPDIP_PROXY_USER_RANGE`, `CHIPDIP_CONCURRENCY`, `MOUSER_API_KEY`, `ENRICHMENT_BATCH_SIZE`, `ENRICHMENT_PERSIST_BATCH`, `ENRICHMENT_INPUT_DIR`, `DATABASE_URL`
    - Proxy is OPTIONAL — do NOT fail if proxy vars are missing
    - Fail fast only if `MOUSER_API_KEY` is missing
    - _Requirements: 9.1, 2.5_

  - [x] 1.5 Create constants: brand-map and mpn-suffixes
    - Create `src/lib/enrichment/constants/brand-map.ts` with mapping dictionary (MAXIM→Maxim Integrated, TI→Texas Instruments, ST→STMicroelectronics, ATMEL→Microchip Technology, ADI→Analog Devices, XILINX→AMD (Xilinx), QUALCOMM→Qualcomm, etc.)
    - Create `src/lib/enrichment/constants/mpn-suffixes.ts` with suffix list: `+`, `-T`, `-TR`, `-RL`, `/NOPB`, `/TR`, `/REEL`, `/T7`
    - _Requirements: 1.5, 1.6_

  - [x] 1.6 Create index.ts re-exports
    - Create `src/lib/enrichment/index.ts` with barrel exports for all modules
    - _Requirements: (structural)_

- [x] 2. Ingest layer: ExcelImporter, MpnNormalizer, BrandMapper, Deduplicator
  - [x] 2.1 Implement MpnNormalizer
    - Create `src/lib/enrichment/ingest/mpn-normalizer.ts`
    - Implement `normalize(mpn: string): string`: uppercase, replace Cyrillic homoglyphs (А→A, В→B, С→C, Е→E, К→K, М→M, Н→H, О→O, Р→P, Т→T, Х→X), strip packaging suffixes from dictionary, trim whitespace
    - Preserve original MPN separately for `Product.partNumber`
    - _Requirements: 1.5, 1.8_

  - [ ]* 2.2 Write property test: MPN normalization idempotency
    - **Property 1: Идемпотентность нормализации MPN**
    - Test `normalize(normalize(s)) === normalize(s)` for 200+ random strings (ASCII, Cyrillic, Chinese, whitespace, empty)
    - Use `fast-check` with `fc.string()` and custom arbitraries
    - **Validates: Requirements 1.8**

  - [x] 2.3 Implement BrandMapper
    - Create `src/lib/enrichment/ingest/brand-mapper.ts`
    - Implement `mapBrand(raw: string): { name: string; unmapped: boolean }`
    - Lookup in brand-map dictionary (case-insensitive, trim)
    - If not found: return original value with `unmapped: true`
    - _Requirements: 1.6, 1.7_

  - [ ]* 2.4 Write property test: Brand mapping totality
    - **Property 2: Тотальность маппинга брендов**
    - Test that for any non-empty string, `mapBrand` returns `{ name: non-empty-string, unmapped: boolean }` and never throws
    - Use `fast-check` with `fc.string({ minLength: 1 })`, 200 iterations
    - **Validates: Requirements 1.6, 1.7**

  - [x] 2.5 Implement ExcelImporter
    - Create `src/lib/enrichment/ingest/excel-importer.ts`
    - Read `.xlsx`, `.xls`, `.csv` files from input directory
    - Auto-detect headers: Chinese headers (`型号`, `品牌`, `封装`, `批号` with variations) vs no-header files (first row matches MPN pattern: Latin+digits, 3-30 chars, no Chinese in first cell)
    - Positional fallback for headerless files: col1→MPN, col2→brand, col3→package
    - Skip files without recognizable MPN column, log reason
    - Return `SupplierRow[]` with `sourceFile` field
    - Use streaming/generator approach for memory efficiency
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.10_

  - [x] 2.6 Implement Deduplicator
    - Create `src/lib/enrichment/ingest/deduplicator.ts`
    - Implement `deduplicate(rows: SupplierRow[]): PartIdentity[]`
    - Key: `(canonicalBrand, canonicalMpn)`
    - Merge `packages` and `dateCodes` arrays for duplicates
    - _Requirements: 1.9_

  - [ ]* 2.7 Write property test: Deduplication stability
    - **Property 3: Стабильность дедупликации**
    - Test `deduplicate(rows)` equals `deduplicate(deduplicate(rows))` and `|result| <= |input|`
    - Use `fast-check` with arrays of generated SupplierRow objects, 200 iterations
    - **Validates: Requirements 1.9**

  - [ ]* 2.8 Write unit tests for ExcelImporter
    - Test reading fixture with Chinese headers (型号（必填）, 品牌（必填）)
    - Test auto-detect headerless file (first row is MPN data)
    - Test skipping file without MPN column
    - Test skipping rows with empty MPN
    - _Requirements: 12.5, 12.8_

- [ ] 3. Checkpoint - Ensure ingest layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. ChipDip client: CloakBrowser, anti-detection, MPN search, product-parser integration
  - [ ] 4.1 Implement ChipDipClient
    - Create `src/lib/enrichment/sources/chipdip-client.ts`
    - Use `import { launch } from 'cloakbrowser'` WITHOUT proxy by default (NOT plain Playwright)
    - Anti-detection measures: randomize viewport size per session, block resource loading (images/fonts/stylesheets), rotate User-Agent per session
    - Implement `buildProxyCredentials(template, range)` for Webshare residential rotator (optional fallback)
    - Implement `createChipDipSession(config)` → browser + page, proxy only if configured AND direct fails
    - Implement `healthCheck(page)` → verify search results on STM32F469ZIT6
    - Implement `searchMpn(page, mpn)` → navigate to search, find product link, go to product page
    - Integrate with existing `parseProductPage(html)` from `src/lib/parser/product-parser.ts`
    - Map `ParsedProduct` → `EnrichmentResult` (source: chipdip)
    - Implement jitter delay (15-30s between requests)
    - Handle 403/CAPTCHA: if proxy configured → rotate N, pause 30 min; if no proxy → pause ChipDip queue 2-4 hours, retry without proxy
    - Support `CHIPDIP_CONCURRENCY` (1-3 sessions)
    - Reuse `src/lib/proxy/proxy-manager.ts` for proxy health tracking (when proxy is used)
    - Rate limit: max 180 requests/hour per IP
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 2.15, 2.16_

  - [ ]* 4.2 Write unit tests for ChipDipClient
    - Test HTML fixture parsing via product-parser.ts (mock page.content())
    - Test health-check success (HTML with results)
    - Test health-check failure (403/CAPTCHA detection)
    - Test proxy credential building from template
    - Test anti-detection: viewport randomization, resource blocking config
    - _Requirements: 12.7, 2.6, 2.7, 2.9_

- [ ] 5. LCSC client: CloakBrowser, MPN search, HTML parser for LCSC pages
  - [ ] 5.1 Implement LCSC HTML parser
    - Create `src/lib/enrichment/sources/lcsc-parser.ts`
    - Parse LCSC product page HTML (Cheerio) to extract: description, datasheet URLs, image URLs, specs (key/value), package, lifecycle status
    - Handle edge cases: missing fields, multiple datasheets, no images
    - _Requirements: 3.5_

  - [ ] 5.2 Implement LcscClient
    - Create `src/lib/enrichment/sources/lcsc-client.ts`
    - Use `import { launch } from 'cloakbrowser'` WITHOUT proxy (confirmed: LCSC accessible without proxy)
    - Implement `searchMpn(page, mpn)` → navigate to `https://www.lcsc.com/search?q={MPN}`, find product link, go to product page
    - Integrate with `lcsc-parser.ts` for data extraction
    - Map parsed data → `EnrichmentResult` (source: lcsc, descriptionLanguage: 'en')
    - Implement jitter delay (5-10s between requests)
    - Concurrency: 1 session only
    - Handle 403/block: mark `lcsc_blocked`, pause LCSC queue 1 hour, retry
    - Rate: ~360 items/hour
    - Log each connection (URL, status, body length)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_

  - [ ]* 5.3 Write unit tests for LcscClient
    - Test LCSC HTML fixture parsing (description, datasheets, images, specs extraction)
    - Test search page with no results → `lcsc_not_found`
    - Test 403 handling → `lcsc_blocked`
    - _Requirements: 12.9_

- [ ] 6. Mouser client: REST API, brand matching, quota tracking
  - [ ] 6.1 Implement MouserClient
    - Create `src/lib/enrichment/sources/mouser-client.ts`
    - POST to `https://api.mouser.com/api/v1/search/partnumber?apiKey={key}`
    - Implement `searchByPartNumber(mpn, canonicalBrand)` → `EnrichmentResult | null`
    - Brand matching: first result where `Manufacturer` (normalized) matches canonical brand
    - Map `MouserPart` → `EnrichmentResult` (source: mouser, descriptionLanguage: 'en')
    - Implement daily quota tracking (in-memory + journal recovery on restart)
    - Retry logic: 429 → stop queue; 5xx → retry 3x (5/15/45s); network error → retry 3x
    - Sequential execution (concurrency=1), 1s delay between requests (reuse rate-limiter.ts)
    - Mask API key in logs (first 4 chars + ***)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13_

  - [ ]* 6.2 Write unit tests for MouserClient
    - Mock `fetch` for: successful response with brand match, 429 (queue stop), empty result (mouser_not_found), brand mismatch, 5xx retry logic, quota tracking (1000/day)
    - _Requirements: 12.6, 4.4, 4.6, 4.7, 4.8, 4.9, 4.10, 4.13_

- [ ] 7. Checkpoint - Ensure all source client tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Persistence layer: HeadValidator, ProvenanceMerger, slug generator, PersistenceService
  - [ ] 8.1 Implement HeadValidator
    - Create `src/lib/enrichment/persistence/head-validator.ts`
    - Implement `filterImageUrls(urls: string[]): Promise<string[]>` — HTTP HEAD, keep only status 200 + Content-Type `image/*`
    - Implement `filterDatasheetUrls(urls: string[]): Promise<string[]>` — HTTP HEAD, keep only status 200 + Content-Type `application/pdf`
    - Timeout per HEAD request: 10s
    - _Requirements: 7.4, 7.6_

  - [ ]* 8.2 Write property test: HEAD-filter soundness
    - **Property 6: HEAD-filter soundness**
    - Mock HTTP HEAD responses with various status codes (200/301/403/404/500) and Content-Types
    - Verify: after `filterImageUrls`, all remaining URLs have status 200 + `image/*`; after `filterDatasheetUrls`, all remaining have status 200 + `application/pdf`
    - Use `fast-check` to generate arrays of URL+response pairs, 200 iterations
    - **Validates: Requirements 7.4, 7.6**

  - [ ] 8.3 Implement ProvenanceMerger
    - Create `src/lib/enrichment/persistence/provenance-merger.ts`
    - Implement `shouldOverwrite(existingMeta, field, newSource): boolean`
    - Priority: ChipDip(4) > LCSC(3) > Mouser(2) > supplier-stub(1)
    - Equal priority: last write wins
    - Lower priority: never overwrites
    - _Requirements: 5.12, 5.13_

  - [ ]* 8.4 Write property test: Provenance monotonicity
    - **Property 5: Монотонность provenance**
    - For any existing field with source priority P_existing and new source with P_new < P_existing, `shouldOverwrite` returns false
    - Use `fast-check` to generate source combinations, 200 iterations
    - **Validates: Requirements 5.13**

  - [ ] 8.5 Implement slug generator
    - Create utility function `generateSlug(canonicalBrand: string, canonicalMpn: string): string`
    - Deterministic: lowercase, replace non-alphanumeric with `-`, trim leading/trailing dashes
    - Place in `src/lib/enrichment/persistence/slug-generator.ts`
    - _Requirements: 5.14_

  - [ ]* 8.6 Write property test: Slug determinism
    - **Property 7: Детерминированность генерации slug**
    - For any (brand, mpn) pair, `generateSlug(brand, mpn)` always returns same result, contains only `[a-z0-9-]`, no leading/trailing dashes
    - Use `fast-check` with string pairs, 200 iterations
    - **Validates: Requirements 5.14**

  - [ ] 8.7 Implement PersistenceService
    - Create `src/lib/enrichment/persistence/persistence-service.ts`
    - Implement batch upsert (50 items per transaction):
      - Upsert Manufacturer (slug = lower-kebab)
      - Upsert Category (or use uncategorized seed); for LCSC/Mouser categories set `nameNeedsReview = true`
      - Upsert Product by `@@unique([manufacturerId, mpnNormalized])`
      - Replace Specifications (delete + createMany)
      - Replace Datasheets (delete + createMany, title fallback: `${MPN} Datasheet`, language: `ru` for ChipDip, `en` for LCSC/Mouser)
      - Replace ProductImages (from LCSC or Mouser, max 10, ordered)
    - Apply provenance merge rules before writing
    - Set `enrichmentStatus`: complete/partial/unresolved
    - Set `lastEnrichedAt`, `enrichmentMeta`
    - Handle unresolved products: name=`${Brand} ${MPN}`, description=`Нет данных`, categoryId=uncategorized
    - DO NOT write: price, weight, inStock, stockCount, featured, tags, minOrder
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.13, 5.14, 5.15_

  - [ ]* 8.8 Write property test: Persistence idempotency
    - **Property 4: Идемпотентность persistence**
    - For any valid EnrichmentResult, calling persist twice yields same DB state as calling once (same record count, same field values)
    - Requires test database; use Prisma with test schema
    - Use `fast-check` to generate EnrichmentResult objects, 200 iterations
    - **Validates: Requirements 5.2, 5.15**

- [ ] 9. Checkpoint - Ensure persistence layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Queue and Journal: StatusJournal, Orchestrator (3 parallel queues)
  - [ ] 10.1 Implement StatusJournal
    - Create `src/lib/enrichment/queue/status-journal.ts`
    - CRUD operations on `EnrichmentJournal` model
    - `initJournal(runId, parts: PartIdentity[])` — create pending entries for new parts
    - `updateStatus(runId, brand, mpn, status, errorMessage?)` — transition status
    - `getNextBatch(runId, status, limit)` — fetch next batch for processing
    - `getResumableItems(runId)` — items with non-terminal status
    - `getMouserQuotaToday()` — count entries with `mouserDay = today`
    - `getLcscQueue(runId, limit)` — items with status `chipdip_not_found`
    - `getMouserQueue(runId, limit)` — items with status `lcsc_not_found`
    - Terminal statuses: `done`, `unresolved`
    - Supported statuses include: `lcsc_done`, `lcsc_not_found`, `lcsc_blocked`
    - _Requirements: 8.2, 8.3, 8.6_

  - [ ] 10.2 Implement Orchestrator (3 parallel queues)
    - Create `src/lib/enrichment/orchestrator.ts`
    - Main coordination logic:
      1. Load config, validate env
      2. Run ExcelImporter → MpnNormalizer → BrandMapper → Deduplicator
      3. Init journal (or resume from existing)
      4. Run ChipDip health-check (if fails without proxy → exit with recommendation to retry in 24h)
      5. Start THREE parallel queues:
         - **ChipDip queue**: all `pending` items, concurrency 1-3, jitter 15-30s, no proxy default
         - **LCSC queue**: items with `chipdip_not_found`, concurrency 1, jitter 5-10s, no proxy
         - **Mouser queue**: items with `lcsc_not_found`, sequential, 1/sec, 1000/day quota
      6. Cascade: ChipDip → LCSC → Mouser → unresolved
      7. ChipDip queue: handle 403 (pause 2-4h without proxy, or rotate proxy if configured)
      8. LCSC queue: handle 403 (pause 1h, retry)
      9. Mouser queue: stop at daily quota, resume next day
      10. Persist results via PersistenceService (batch 50)
      11. Update ImportProgress every 30s
      12. Graceful shutdown on SIGINT/SIGTERM
    - Support CLI flags: `--resume`, `--dry-run`, `--skip-mouser`, `--mouser-only`, `--skip-lcsc`, `--batch-size`
    - _Requirements: 10.1, 10.2, 10.3, 10.8, 8.1, 8.3, 8.4_

- [ ] 11. Observability: Logger, ProgressReporter
  - [ ] 11.1 Implement Logger
    - Create `src/lib/enrichment/observability/logger.ts`
    - JSON Lines format to `./logs/enrichment-YYYY-MM-DD.log`
    - Required fields: `timestamp`, `level`, `mpn`, `brand`, `source` (chipdip/lcsc/mouser), `event`, `durationMs`
    - Optional: `error`, `proxyN`
    - Secret masking: MOUSER_API_KEY → first 4 + `***`, proxy password → `***`
    - _Requirements: 11.1, 11.2, 9.2_

  - [ ] 11.2 Implement ProgressReporter
    - Create `src/lib/enrichment/observability/progress-reporter.ts`
    - Update `ImportProgress` in DB every 30 seconds
    - Console output every 60 seconds: processed/total, speed, ChipDip-done A, LCSC-done B, Mouser-done C, unresolved D, blocked E, Mouser-квота сегодня F/1000
    - Generate final report `./logs/enrichment-report-YYYY-MM-DD.json` on completion
    - _Requirements: 11.3, 11.4, 8.1, 8.4_

  - [ ]* 11.3 Write unit tests for Logger and ProgressReporter
    - Test secret masking (API key, proxy password never appear in full)
    - Test console output format matches spec (includes LCSC stats)
    - _Requirements: 9.2, 11.2, 11.3_

- [ ] 12. CLI entry points: enrichment-run.ts, enrichment-status.ts
  - [ ] 12.1 Implement enrichment-run.ts
    - Create `src/scripts/enrichment-run.ts`
    - Parse CLI args: `--input-dir`, `--batch-size`, `--resume`, `--dry-run`, `--skip-mouser`, `--mouser-only`, `--skip-lcsc`
    - Load dotenv, instantiate Orchestrator, run pipeline
    - Register SIGINT/SIGTERM handlers for graceful shutdown
    - Add script to `package.json`: `"enrichment:run": "tsx src/scripts/enrichment-run.ts"`
    - _Requirements: 8.3_

  - [ ] 12.2 Implement enrichment-status.ts
    - Create `src/scripts/enrichment-status.ts`
    - Query `ImportProgress` and `EnrichmentJournal` for current run status
    - Display: status, progress X/Y, breakdown by status (including lcsc_done, lcsc_not_found, lcsc_blocked), Mouser quota today, ETA
    - Add script to `package.json`: `"enrichment:status": "tsx src/scripts/enrichment-status.ts"`
    - _Requirements: 8.5_

- [ ] 13. Checkpoint - Ensure full pipeline compiles and unit tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Configuration and final wiring
  - [ ] 14.1 Update .env.example with enrichment variables
    - Add: `CHIPDIP_PROXY_TEMPLATE=` (empty, optional), `CHIPDIP_PROXY_USER_RANGE=1..20000`, `CHIPDIP_CONCURRENCY=1`, `MOUSER_API_KEY=your_mouser_api_key`, `ENRICHMENT_BATCH_SIZE=500`, `ENRICHMENT_PERSIST_BATCH=50`, `ENRICHMENT_INPUT_DIR=`
    - _Requirements: 9.4_

  - [ ] 14.2 Update next.config.ts with remote image patterns
    - Add LCSC CDN domain and Mouser CDN domain to `images.remotePatterns`
    - _Requirements: 7.2, 7.3_

  - [x] 14.3 Install fast-check dependency
    - Run `pnpm add -D fast-check`
    - Verify vitest config supports it
    - _Requirements: 12.1_

- [ ] 15. Final checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (7 properties)
- Unit tests validate specific examples and edge cases
- The pipeline is a CLI tool (not part of Next.js runtime), run via `pnpm tsx`
- Existing modules reused: `product-parser.ts`, `proxy-manager.ts`, `rate-limiter.ts`
- All secrets from `.env` only, never in code or logs
- Cascade order: ChipDip → LCSC → Mouser → unresolved
- Provenance priority: ChipDip (4) > LCSC (3) > Mouser (2) > stub (1)
- Proxy is OPTIONAL for ChipDip (fallback only), not required for LCSC
- Performance: ChipDip ~180/hr, LCSC ~360/hr, Mouser 1000/day, total ≈ 3-4 weeks

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.5"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.6"] },
    { "id": 2, "tasks": ["2.1", "2.3", "14.3"] },
    { "id": 3, "tasks": ["2.2", "2.4", "2.5"] },
    { "id": 4, "tasks": ["2.6", "2.7", "2.8"] },
    { "id": 5, "tasks": ["4.1", "5.1", "6.1", "8.1", "8.5"] },
    { "id": 6, "tasks": ["4.2", "5.2", "6.2", "8.2", "8.6"] },
    { "id": 7, "tasks": ["5.3", "8.3"] },
    { "id": 8, "tasks": ["8.4", "8.7"] },
    { "id": 9, "tasks": ["8.8", "10.1"] },
    { "id": 10, "tasks": ["10.2", "11.1", "11.2"] },
    { "id": 11, "tasks": ["11.3", "12.1", "12.2"] },
    { "id": 12, "tasks": ["14.1", "14.2"] }
  ]
}
```
