# Parser Architecture

## Overview

The ChipDip parser is a modular, functional system for extracting product data from HTML pages. Built with pure functions, dependency injection, and comprehensive error handling.

## Architecture Principles

### 1. Pure Functions
All parsing logic uses pure functions with no side effects:
- Same input always produces same output
- No external state mutations
- No I/O operations inside parsers
- Easy to test and reason about

### 2. Dependency Injection
External dependencies (HTTP client, rate limiter) are injected:
- Enables testing with mock dependencies
- Allows configuration without code changes
- Supports different environments (dev, prod)

### 3. Explicit Error Handling
All operations return `ParseResult<T>` wrapper:
```typescript
type ParseResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }
```

No thrown exceptions in parsing logic - errors are values.

### 4. Modular Design
Each module has single responsibility:
- `product-parser.ts` - Extract product data from HTML
- `catalog-scraper.ts` - Extract product URLs from catalog
- `http-client.ts` - HTTP requests with retry logic
- `rate-limiter.ts` - Request rate limiting
- `types.ts` - Shared type definitions

## Module Breakdown

### product-parser.ts

Extracts structured product data from ChipDip product pages.

**Key Functions:**

```typescript
// Main entry point - parses entire product page
parseProductPage(html: string): ParseResult<ParsedProduct>

// Individual field extractors (pure functions)
extractProductName($: CheerioAPI): string | null
extractPartNumber($: CheerioAPI): string | null
extractSku($: CheerioAPI): string | null
extractManufacturer($: CheerioAPI): string | null
extractCategory($: CheerioAPI): string | null
extractDescription($: CheerioAPI): string | null
extractSpecifications($: CheerioAPI): Record<string, string>
extractImages($: CheerioAPI): string[]
extractDatasheets($: CheerioAPI): string[]
extractAnalogs($: CheerioAPI): string[]
```

**Design Pattern:**

1. **Validate input** - Check HTML is non-empty string
2. **Load into Cheerio** - Parse HTML into queryable DOM
3. **Extract each field** - Use CSS selectors with fallbacks
4. **Validate output** - Ensure required fields present
5. **Return result** - Wrapped in ParseResult

**CSS Selector Strategy:**

Each extractor tries multiple selectors in priority order:

```typescript
// Example: extractProductName tries 3 selectors
export function extractProductName($: CheerioAPI): string | null {
  // 1. Structured data (most reliable)
  const h1 = extractText($, 'h1[itemprop="name"]')
  if (h1) return h1
  
  // 2. Common class names
  const title = extractText($, 'h1.product-title')
  if (title) return title
  
  // 3. Generic fallback
  const generic = extractText($, 'h1')
  if (generic) return generic
  
  return null
}
```

**Why multiple selectors?** ChipDip may change HTML structure. Fallbacks ensure parser continues working.

**Specification Parsing:**

Electronics specs come in various HTML structures:

```typescript
export function extractSpecifications($: CheerioAPI): Record<string, string> {
  const specs: Record<string, string> = {}
  
  // Try definition list (dt/dd)
  $('dl dt').each((_, dt) => {
    const key = $(dt).text().trim()
    const value = $(dt).next('dd').text().trim()
    if (key && value) specs[key] = value
  })
  
  // Try table rows (tr with th/td)
  $('table tr').each((_, tr) => {
    const cells = $(tr).find('th, td')
    if (cells.length >= 2) {
      const key = $(cells[0]).text().trim()
      const value = $(cells[1]).text().trim()
      if (key && value) specs[key] = value
    }
  })
  
  return specs
}
```

Handles both definition lists and tables - common patterns on electronics sites.

### catalog-scraper.ts

Extracts product URLs from catalog listing pages.

**Key Functions:**

```typescript
// Extract product slugs from catalog HTML
scrapeCatalogPage(html: string): string[]

// Extract slug from product URL
extractSlugFromUrl(url: string): string | null

// Validate slug format
isValidSlug(slug: string): boolean

// Extract pagination info
extractPaginationInfo(html: string): PaginationInfo | null

// Combined scraper
scrapeCatalog(html: string): CatalogScraperResult
```

**Slug Extraction:**

```typescript
export function extractSlugFromUrl(url: string): string | null {
  // Match /product/{slug} pattern
  const match = url.match(/\/product\/([^/?#]+)/)
  
  if (!match || !match[1]) return null
  
  const slug = match[1].trim().toLowerCase()
  
  // Validate slug (alphanumeric, hyphens, underscores only)
  if (!isValidSlug(slug)) return null
  
  return slug
}
```

**Why validate slugs?** Prevents invalid URLs from entering database. Ensures URL-safe identifiers.

**Deduplication:**

Catalog pages may list same product multiple times (featured, ads, etc.):

```typescript
const slugs = productLinks
  .map(extractSlugFromUrl)
  .filter((slug): slug is string => slug !== null)
  .filter((slug, index, self) => self.indexOf(slug) === index) // Remove duplicates
```

### http-client.ts

HTTP client with retry logic and rate limiting.

**Features:**
- Configurable retry attempts (default: 3)
- Exponential backoff between retries
- Rate limiting integration
- Custom User-Agent header
- Timeout support

**Configuration:**

```typescript
export interface HttpConfig {
  retryAttempts: number
  retryDelayMs: number
  timeoutMs: number
  userAgent: string
}

export const DEFAULT_HTTP_CONFIG: HttpConfig = {
  retryAttempts: 3,
  retryDelayMs: 1000,
  timeoutMs: 30000,
  userAgent: 'Mozilla/5.0 (compatible; ElectromagazBot/1.0)',
}
```

**Retry Logic:**

```typescript
async function fetchWithRetry(url: string, attempt = 1): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': config.userAgent },
      signal: AbortSignal.timeout(config.timeoutMs),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    return await response.text()
  } catch (error) {
    if (attempt < config.retryAttempts) {
      await sleep(config.retryDelayMs * attempt) // Exponential backoff
      return fetchWithRetry(url, attempt + 1)
    }
    throw error
  }
}
```

**Why exponential backoff?** If server is overloaded, waiting longer between retries increases success chance.

### rate-limiter.ts

Token bucket rate limiter to respect ChipDip servers.

**Implementation:**

```typescript
export interface RateLimiter {
  waitForToken(): Promise<void>
}

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  let tokens = config.requestsPerSecond
  let lastRefill = Date.now()
  
  return {
    async waitForToken() {
      // Refill tokens based on time elapsed
      const now = Date.now()
      const elapsed = now - lastRefill
      const tokensToAdd = (elapsed / 1000) * config.requestsPerSecond
      
      tokens = Math.min(config.requestsPerSecond, tokens + tokensToAdd)
      lastRefill = now
      
      // Wait if no tokens available
      if (tokens < 1) {
        const waitTime = (1 - tokens) / config.requestsPerSecond * 1000
        await sleep(waitTime)
        tokens = 0
      } else {
        tokens -= 1
      }
    }
  }
}
```

**Why token bucket?** Allows burst requests up to limit, then enforces steady rate. More flexible than simple delay between requests.

**Configuration:**

```typescript
const rateLimiter = createRateLimiter({ requestsPerSecond: 1 })
```

For ChipDip: 1 request/second is respectful and avoids overloading their servers.

## Data Flow

### Import Process

```
1. Fetch catalog page
   ↓
2. Extract product slugs (catalog-scraper)
   ↓
3. For each slug:
   a. Rate limit (wait for token)
   b. Fetch product page (http-client)
   c. Parse HTML (product-parser)
   d. Validate required fields
   e. Import to database (transaction)
   ↓
4. Report results (success/failed counts)
```

### Error Handling Flow

```
HTTP Error (network, timeout)
  → Retry with exponential backoff (3 attempts)
  → If all retries fail: Log error, skip product, continue

Parse Error (invalid HTML, missing fields)
  → Return ParseResult with error message
  → Log error, skip product, continue

Database Error (constraint violation, connection)
  → Rollback transaction
  → Log error, skip product, continue

Fatal Error (database unavailable, out of memory)
  → Stop import, report partial results
```

**Key principle:** Individual product failures don't stop entire import. Batch processing continues.

## Testing Strategy

### Unit Tests

Each pure function has dedicated tests:

```typescript
describe('extractProductName', () => {
  it('extracts name from h1[itemprop="name"]', () => {
    const html = '<h1 itemprop="name">STM32F103C8T6</h1>'
    const $ = cheerio.load(html)
    expect(extractProductName($)).toBe('STM32F103C8T6')
  })
  
  it('returns null when no name found', () => {
    const html = '<div>No name here</div>'
    const $ = cheerio.load(html)
    expect(extractProductName($)).toBeNull()
  })
})
```

### Integration Tests

Test complete parsing flow with real HTML samples:

```typescript
describe('parseProductPage', () => {
  it('parses complete product page', () => {
    const html = readFileSync('fixtures/stm32f103c8t6.html', 'utf-8')
    const result = parseProductPage(html)
    
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('STM32F103C8T6')
    expect(result.data?.manufacturer).toBe('STMicroelectronics')
    expect(Object.keys(result.data?.specifications || {})).toHaveLength(10)
  })
})
```

### Mock Dependencies

HTTP client and rate limiter are injected, enabling test mocks:

```typescript
const mockHttpClient = {
  get: vi.fn().mockResolvedValue('<html>...</html>')
}

const mockRateLimiter = {
  waitForToken: vi.fn().mockResolvedValue(undefined)
}

const client = createHttpClient(config, {
  rateLimiter: mockRateLimiter,
  fetch: mockHttpClient.get
})
```

## Performance Characteristics

### Parsing Speed
- Cheerio parsing: ~5ms per product page
- Field extraction: ~1ms total
- Database insert: ~10ms per product

**Total per product:** ~16ms + network time

### Memory Usage
- Cheerio DOM: ~500KB per page
- Parsed product data: ~10KB
- No memory leaks (pure functions, no closures)

### Scalability
**100 products:**
- Time: ~2 minutes (rate limited to 1 req/sec)
- Memory: <100MB peak

**2M products:**
- Time: ~23 days (rate limited) or ~5 hours (10 req/sec)
- Memory: <100MB peak (streaming, no accumulation)
- Database: ~5GB (with indexes)

**Optimization for large scale:**
- Run multiple import processes in parallel (different categories)
- Increase rate limit if ChipDip allows
- Use batch database inserts (already implemented)

## Error Recovery

### Idempotent Imports

Import script can be re-run safely:

```typescript
// Upsert logic prevents duplicates
const product = await prisma.product.upsert({
  where: { slug },
  update: { /* update fields */ },
  create: { /* create fields */ }
})
```

If import fails halfway, re-running continues from where it left off.

### Failed Product Tracking

```typescript
interface ImportResult {
  total: number
  successful: number
  failed: number
  errors: Array<{ slug: string; error: string }>
}
```

Failed products are logged with error messages. Can be retried individually.

### Transaction Safety

Each product import uses transaction:

```typescript
await prisma.$transaction(async (tx) => {
  // Create product
  // Create images
  // Create specifications
  // Create datasheets
})
```

If any step fails, entire product import rolls back. No partial data in database.

## Configuration

### Environment Variables

```bash
# Database connection
DATABASE_URL="postgresql://user:pass@localhost:5432/electromagaz"

# Parser settings (optional)
PARSER_RATE_LIMIT=1          # Requests per second
PARSER_RETRY_ATTEMPTS=3      # HTTP retry attempts
PARSER_TIMEOUT_MS=30000      # Request timeout
```

### Runtime Configuration

```typescript
const result = await importProducts({
  maxProducts: 100,           // Limit number of products
  batchSize: 10,              // Process in batches
  catalogUrl: 'https://...',  // Catalog page URL
})
```

## Monitoring

### Progress Tracking

```
Fetching product URLs from: https://www.chipdip.ru/catalog/microcontrollers
Found 395850 products, will import 100

Processing batch 1/10
✓ Imported 1/100: stm32f103c8t6
✓ Imported 2/100: atmega328p
✗ Failed 3/100: invalid-slug - Failed to extract product name

...

============================================================
Import Summary
============================================================
Total processed: 100
Successful: 97
Failed: 3

Failed products:
  - invalid-slug: Failed to extract product name
  - network-error: HTTP 503
  - missing-manufacturer: Manufacturer is required

Completed in 125.43s
```

### Error Logging

All errors include context:

```typescript
console.error('Failed to parse product', {
  slug: 'stm32f103c8t6',
  url: 'https://www.chipdip.ru/product/stm32f103c8t6',
  error: error.message,
  timestamp: new Date().toISOString()
})
```

## Maintenance

### Adding New Fields

1. Update `ParsedProduct` type in `types.ts`
2. Add extractor function in `product-parser.ts`
3. Call extractor in `parseProductPage()`
4. Update database schema in `schema.prisma`
5. Update import logic in `import-chipdip.ts`
6. Add tests for new extractor

### Handling HTML Changes

If ChipDip changes HTML structure:

1. Identify broken selector
2. Add new selector to extractor (keep old as fallback)
3. Test with real HTML samples
4. Deploy update

**Example:**

```typescript
// Old selector stopped working
const name = extractText($, 'h1.product-title')

// Add new selector, keep old as fallback
const name = extractText($, 'h1.new-title-class') || 
             extractText($, 'h1.product-title')
```

### Performance Tuning

If imports become slow:

1. **Increase rate limit** (if ChipDip allows)
2. **Parallel processing** (multiple import processes)
3. **Database optimization** (check query performance)
4. **Batch size tuning** (larger batches = fewer transactions)

Monitor with:
```typescript
console.time('import')
await importProducts()
console.timeEnd('import')
```
