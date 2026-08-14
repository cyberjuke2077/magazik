/**
 * Core types and interfaces for the product data enrichment pipeline.
 *
 * Defines data sources, priority rules, statuses, and structures
 * used across the ingest → source → persistence layers.
 */

/** Supported data sources for enrichment, ordered by priority */
export type DataSource = 'chipdip' | 'lcsc' | 'mouser' | 'supplier-stub'

/**
 * Priority map for data sources.
 * Higher value = stronger source. A field from a stronger source
 * is never overwritten by a weaker one.
 */
export const SOURCE_PRIORITY: Record<DataSource, number> = {
  chipdip: 4,
  lcsc: 3,
  mouser: 2,
  'supplier-stub': 1,
} as const

/**
 * Per-item status in the enrichment journal.
 * Tracks which stage each MPN has reached in the cascade.
 */
export type EnrichmentItemStatus =
  | 'pending'
  | 'chipdip_done'
  | 'chipdip_not_found'
  | 'chipdip_blocked'
  | 'lcsc_done'
  | 'lcsc_not_found'
  | 'lcsc_blocked'
  | 'mouser_queued'
  | 'mouser_done'
  | 'mouser_not_found'
  | 'mouser_failed'
  | 'mouser_brand_mismatch'
  | 'done'
  | 'unresolved'

/** A single row read from a supplier Excel/CSV file */
export interface SupplierRow {
  /** MPN as-is from the file (before normalization) */
  originalMpn: string
  /** MPN after normalization (uppercase, stripped suffixes, no homoglyphs) */
  canonicalMpn: string
  /** Brand as-is from the file */
  originalBrand: string
  /** Brand after mapping through the brand dictionary */
  canonicalBrand: string
  /** Package/footprint (e.g. SOIC-8), optional */
  package?: string
  /** Date/batch code, optional */
  dateCode?: string
  /** Source file path for traceability */
  sourceFile: string
}

/**
 * Deduplicated part identity — one entry per unique (canonicalBrand, canonicalMpn).
 * Aggregates package and dateCode variants from duplicate rows.
 */
export interface PartIdentity {
  canonicalBrand: string
  canonicalMpn: string
  originalMpn: string
  originalBrand: string
  /** All distinct package variants found across duplicates */
  packages: string[]
  /** All distinct date codes found across duplicates */
  dateCodes: string[]
}

/**
 * Result returned by any data source after fetching product info.
 * Normalized structure shared across ChipDip, LCSC, and Mouser.
 */
export interface EnrichmentResult {
  /** Which source produced this result */
  source: DataSource
  /** MPN used for the search */
  mpn: string
  /** Brand/manufacturer name */
  brand: string
  /** Product name/title */
  name?: string
  /** Product description text */
  description?: string
  /** Source-specific SKU, when available */
  sku?: string
  /** Product weight in grams */
  weight?: number
  /** Public source price for one unit */
  price?: number
  /** ISO 4217 currency for price */
  currency?: string
  /** Language of the description field */
  descriptionLanguage?: 'ru' | 'en'
  /** Category name from the source */
  categoryName?: string
  /** Full category breadcrumb path (general → specific), для классификации в таксономию */
  categoryPath?: string[]
  /** Technical specifications (key-value pairs) */
  specs?: Array<{ key: string; value: string }>
  /** URLs of product images */
  imageUrls?: string[]
  /** URLs of datasheet PDFs */
  datasheetUrls?: string[]
  /** Lifecycle status (e.g. Active, EOL, NRND) */
  lifecycle?: string
  /** Package/footprint (e.g. QFP-144) */
  package?: string
  /** Mouser-specific part number (for Mouser source only) */
  mouserPartNumber?: string
}

/**
 * Provenance record for a single field — tracks which source
 * provided the value and when it was fetched.
 */
export interface FieldProvenance {
  /** Data source that provided this field value */
  source: DataSource
  /** ISO 8601 datetime when the value was fetched */
  fetchedAt: string
}

export interface ImageCandidate {
  url: string
  source: Exclude<DataSource, 'supplier-stub'>
}

export interface ImagePipelineState {
  status: 'pending' | 'processing' | 'complete' | 'failed'
  source: Exclude<DataSource, 'supplier-stub'>
  queuedAt: string
  startedAt?: string
  completedAt?: string
  uploaded?: number
  cleaned?: number
  error?: string
}

export interface DatasheetCandidate {
  url: string
  source: DataSource
  title?: string
  language: 'ru' | 'en'
}

export interface DatasheetPipelineState {
  status: 'pending' | 'processing' | 'complete' | 'failed'
  source: DataSource
  queuedAt: string
  startedAt?: string
  completedAt?: string
  uploaded?: number
  error?: string
}

/**
 * Field-level provenance metadata stored in Product.enrichmentMeta (JSON).
 * Tracks the origin of each enriched field for conflict resolution.
 */
export interface EnrichmentMeta {
  /** Provenance for the product name */
  name?: FieldProvenance
  /** Provenance for the description */
  description?: FieldProvenance
  /** Provenance for the category assignment */
  category?: FieldProvenance
  /** Provenance for the specs list */
  specs?: FieldProvenance
  /** Provenance for the images list */
  images?: FieldProvenance
  /** Provenance for the datasheets list */
  datasheets?: FieldProvenance
  /** Provenance for a parser-managed public price */
  price?: FieldProvenance
  /** Operational flags (e.g. brand_unmapped, multiplePackages) */
  flags?: string[]
  /** Raw source breadcrumb retained for taxonomy review and new rules */
  sourceCategoryPath?: string[]
  /** Language of the stored description */
  descriptionLanguage?: 'ru' | 'en'
  /** Upstream URLs waiting for local validation and watermark removal */
  imageCandidates?: ImageCandidate[]
  /** State of the local image processing pipeline */
  imagePipeline?: ImagePipelineState
  /** Upstream PDF URLs waiting for validation and upload to R2 */
  datasheetCandidates?: DatasheetCandidate[]
  /** State of the datasheet storage pipeline */
  datasheetPipeline?: DatasheetPipelineState
}

/**
 * Runtime configuration for the enrichment pipeline.
 * Values are loaded from environment variables at startup.
 */
export interface EnrichmentConfig {
  /** Directory containing supplier Excel/CSV files */
  inputDir: string
  /**
   * Proxy URL template for ChipDip with `{N}` placeholder.
   * Example: `http://user-{N}:pass@proxy.host:port`
   * Optional — pipeline works without proxy by default.
   */
  chipdipProxyTemplate?: string
  /**
   * Direct proxy URL for ChipDip (alternative to template).
   * Optional — pipeline works without proxy by default.
   */
  chipdipProxyUrl?: string
  /** Range [min, max] for the `{N}` placeholder in proxy template */
  chipdipProxyUserRange: [number, number]
  /** Number of concurrent CloakBrowser sessions for ChipDip (1-3) */
  chipdipConcurrency: number
  /** Skip complete products enriched within freshnessDays */
  skipFreshProducts: boolean
  /** Age after which a complete product becomes eligible for refresh */
  freshnessDays: number
  /** Random delay between ChipDip products */
  chipdipRequestDelayRange: [number, number]
  /** Random delay between pages within one ChipDip lookup */
  chipdipPageDelayRange: [number, number]
  /** Mouser Search API key */
  mouserApiKey: string
  /** Number of items per processing batch (default 500) */
  batchSize: number
  /** Number of items per DB write transaction (default 50) */
  persistBatchSize: number
  /** PostgreSQL connection string */
  databaseUrl: string
}
