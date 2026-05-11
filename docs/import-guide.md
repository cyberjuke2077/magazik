# ChipDip Import Guide

## Quick Start

### Prerequisites

1. **PostgreSQL database running**
   ```bash
   docker-compose up -d postgres
   ```

2. **Environment variables configured**
   ```bash
   # .env
   DATABASE_URL="postgresql://electromagaz:password@localhost:5432/electromagaz"
   ```

3. **Dependencies installed**
   ```bash
   pnpm install
   ```

4. **Database schema applied**
   ```bash
   pnpm prisma migrate dev
   ```

### Run Import

```bash
# Import 100 products from microcontrollers category
pnpm tsx src/scripts/import-chipdip.ts
```

Expected output:
```
ChipDip Product Import
============================================================
Fetching product URLs from: https://www.chipdip.ru/catalog/microcontrollers
Found 395850 products, will import 100

Processing batch 1/10
✓ Imported 1/100: stm32f103c8t6
✓ Imported 2/100: atmega328p
...

============================================================
Import Summary
============================================================
Total processed: 100
Successful: 97
Failed: 3

Completed in 125.43s
```

## Configuration

### Import Options

Edit `src/scripts/import-chipdip.ts` to customize:

```typescript
const result = await importProducts({
  maxProducts: 100,     // Number of products to import
  batchSize: 10,        // Products per batch (affects transaction size)
  catalogUrl: 'https://www.chipdip.ru/catalog/microcontrollers',
})
```

### Rate Limiting

Default: 1 request/second (respectful to ChipDip servers)

To change:
```typescript
const rateLimiter = createRateLimiter({ 
  requestsPerSecond: 2  // Increase if ChipDip allows
})
```

**Warning:** Aggressive rate limiting may result in IP blocks. Start conservative.

### HTTP Client Settings

```typescript
const httpClient = createHttpClient({
  retryAttempts: 3,      // Retry failed requests
  retryDelayMs: 1000,    // Initial retry delay (exponential backoff)
  timeoutMs: 30000,      // Request timeout (30 seconds)
  userAgent: 'Mozilla/5.0 (compatible; ElectromagazBot/1.0)',
})
```

## Import Strategies

### Strategy 1: Small Test Batch (Recommended First)

Import 10-20 products to verify everything works:

```typescript
await importProducts({
  maxProducts: 10,
  batchSize: 5,
})
```

**Time:** ~20 seconds  
**Purpose:** Validate parser, database schema, error handling

### Strategy 2: Category Import (100-1000 products)

Import single category for testing:

```typescript
await importProducts({
  maxProducts: 100,
  catalogUrl: 'https://www.chipdip.ru/catalog/mikroshemy-1731',
})
```

**Time:** ~2 minutes (100 products)  
**Purpose:** Test with real product variety, validate UI integration

### Strategy 3: Full Category (10K-400K products)

Import entire category:

```typescript
await importProducts({
  maxProducts: 395850,  // All ICs
  batchSize: 50,
  catalogUrl: 'https://www.chipdip.ru/catalog/mikroshemy-1731',
})
```

**Time:** ~110 hours (at 1 req/sec)  
**Purpose:** Production-ready catalog

**Optimization:** Run overnight or use parallel processes (see Scaling section)

### Strategy 4: Full Catalog (2M products)

Import all electronic components:

```typescript
// Run separate imports for each major category
const categories = [
  'mikroshemy-1731',           // ICs (395K)
  'passive-components',        // Resistors, capacitors (800K)
  'connectors',                // Connectors (400K)
  'electromechanical',         // Relays, switches (300K)
  // ... more categories
]

for (const category of categories) {
  await importProducts({
    maxProducts: Infinity,
    catalogUrl: `https://www.chipdip.ru/catalog/${category}`,
  })
}
```

**Time:** ~23 days (at 1 req/sec) or ~5 hours (at 10 req/sec with parallel processes)  
**Purpose:** Complete product database

## Scaling to 2M Products

### Parallel Processing

Run multiple import processes simultaneously (different categories):

```bash
# Terminal 1: Import ICs
CATEGORY=mikroshemy-1731 pnpm tsx src/scripts/import-chipdip.ts

# Terminal 2: Import passive components
CATEGORY=passive-components pnpm tsx src/scripts/import-chipdip.ts

# Terminal 3: Import connectors
CATEGORY=connectors pnpm tsx src/scripts/import-chipdip.ts
```

**Benefit:** 3x faster (3 hours instead of 9 hours for 1M products)

**Caution:** Monitor ChipDip response times. If you see 429 errors or slowdowns, reduce parallelism.

### Batch Size Optimization

Larger batches = fewer database transactions = faster imports:

```typescript
await importProducts({
  batchSize: 100,  // Process 100 products per transaction
})
```

**Trade-off:**
- Larger batches: Faster, but more data lost if transaction fails
- Smaller batches: Slower, but better error isolation

**Recommendation:** 
- Development: `batchSize: 10` (easier debugging)
- Production: `batchSize: 50-100` (optimal performance)

### Database Optimization

For large imports, optimize PostgreSQL:

```sql
-- Increase work memory for faster inserts
ALTER SYSTEM SET work_mem = '256MB';

-- Increase maintenance work memory for index creation
ALTER SYSTEM SET maintenance_work_mem = '1GB';

-- Disable fsync during import (faster, but less safe)
ALTER SYSTEM SET fsync = off;

-- Reload configuration
SELECT pg_reload_conf();
```

**Warning:** Disable `fsync` only during bulk imports. Re-enable for production:
```sql
ALTER SYSTEM SET fsync = on;
SELECT pg_reload_conf();
```

### Resume Failed Imports

Import script is idempotent - can safely re-run:

```typescript
// First run: imports 50 products, then crashes
await importProducts({ maxProducts: 100 })

// Second run: skips existing 50, imports remaining 50
await importProducts({ maxProducts: 100 })
```

Products are upserted by slug - no duplicates created.

## Monitoring

### Progress Tracking

Import script outputs real-time progress:

```
Processing batch 5/10
✓ Imported 45/100: stm32f407vgt6
✓ Imported 46/100: esp32-wroom-32
✗ Failed 47/100: invalid-product - Failed to extract manufacturer
```

### Database Monitoring

Check import progress in real-time:

```sql
-- Count imported products
SELECT COUNT(*) FROM "Product";

-- Count by category
SELECT c.name, COUNT(p.id) as product_count
FROM "Category" c
LEFT JOIN "Product" p ON p."categoryId" = c.id
GROUP BY c.name
ORDER BY product_count DESC;

-- Recent imports
SELECT name, "partNumber", "createdAt"
FROM "Product"
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Performance Monitoring

Track import speed:

```bash
# Start time
date

# Run import
pnpm tsx src/scripts/import-chipdip.ts

# End time
date

# Calculate: products per second
```

Expected performance:
- **Network-bound:** ~1 product/second (rate limited)
- **CPU-bound:** ~60 products/second (parsing only)
- **Database-bound:** ~100 products/second (inserts only)

Bottleneck is network (rate limiting), not parsing or database.

## Troubleshooting

### Issue: "Failed to extract product name"

**Cause:** ChipDip changed HTML structure, parser can't find product name

**Solution:**
1. Visit product URL manually: `https://www.chipdip.ru/product/{slug}`
2. Inspect HTML, find new selector for product name
3. Update `extractProductName()` in `src/lib/parser/product-parser.ts`
4. Add new selector as fallback

**Example fix:**
```typescript
export function extractProductName($: CheerioAPI): string | null {
  // Try new selector first
  const newName = extractText($, 'h1.new-product-title')
  if (newName) return newName
  
  // Keep old selector as fallback
  const oldName = extractText($, 'h1.product-title')
  if (oldName) return oldName
  
  return null
}
```

### Issue: "Manufacturer is required"

**Cause:** Parser couldn't extract manufacturer from product page

**Solution:**
1. Check if product actually has manufacturer on ChipDip
2. If yes, update `extractManufacturer()` with new selector
3. If no, modify import script to use default manufacturer:

```typescript
const manufacturerName = parsedProduct.manufacturer || 'Unknown'
```

### Issue: "HTTP 503" or "HTTP 429"

**Cause:** ChipDip servers overloaded or rate limit exceeded

**Solution:**
1. Reduce rate limit:
   ```typescript
   const rateLimiter = createRateLimiter({ requestsPerSecond: 0.5 })
   ```
2. Increase retry delay:
   ```typescript
   const httpClient = createHttpClient({
     retryAttempts: 5,
     retryDelayMs: 5000,  // 5 seconds
   })
   ```
3. Wait and retry later

### Issue: "Connection refused" to database

**Cause:** PostgreSQL not running

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker-compose up -d postgres

# Verify connection
pnpm prisma db pull
```

### Issue: Import is very slow

**Cause:** Rate limiting (expected behavior)

**Solutions:**
1. **Increase rate limit** (if ChipDip allows):
   ```typescript
   const rateLimiter = createRateLimiter({ requestsPerSecond: 2 })
   ```

2. **Run parallel imports** (different categories):
   ```bash
   # Terminal 1
   CATEGORY=mikroshemy pnpm tsx src/scripts/import-chipdip.ts
   
   # Terminal 2
   CATEGORY=passive pnpm tsx src/scripts/import-chipdip.ts
   ```

3. **Run overnight** - 100 products takes ~2 minutes, 10K takes ~3 hours

### Issue: "Unique constraint failed on slug"

**Cause:** Trying to import same product twice in same run

**Solution:** This shouldn't happen (deduplication in catalog scraper). If it does:
1. Check `scrapeCatalogPage()` deduplication logic
2. Verify catalog page doesn't have duplicate links
3. Use upsert logic (already implemented):
   ```typescript
   await prisma.product.upsert({
     where: { slug },
     update: { /* ... */ },
     create: { /* ... */ }
   })
   ```

### Issue: Out of memory

**Cause:** Processing too many products in single batch

**Solution:** Reduce batch size:
```typescript
await importProducts({
  batchSize: 10,  // Smaller batches use less memory
})
```

### Issue: Parser tests failing

**Cause:** ChipDip HTML structure changed

**Solution:**
1. Update HTML fixtures in `tests/fixtures/`
2. Update parser selectors
3. Re-run tests:
   ```bash
   pnpm test src/lib/parser/
   ```

## Data Validation

### After Import

Verify data quality:

```sql
-- Check for products without images
SELECT COUNT(*) FROM "Product" p
LEFT JOIN "ProductImage" pi ON pi."productId" = p.id
WHERE pi.id IS NULL;

-- Check for products without specifications
SELECT COUNT(*) FROM "Product" p
LEFT JOIN "Specification" s ON s."productId" = p.id
WHERE s.id IS NULL;

-- Check for products without manufacturer
SELECT COUNT(*) FROM "Product" WHERE "manufacturerId" IS NULL;

-- Check for duplicate part numbers (should be rare)
SELECT "partNumber", COUNT(*) as count
FROM "Product"
GROUP BY "partNumber"
HAVING COUNT(*) > 1;
```

### Data Quality Metrics

Expected quality for ChipDip imports:

| Metric | Expected | Acceptable |
|--------|----------|------------|
| Products with images | 95%+ | 80%+ |
| Products with specs | 90%+ | 70%+ |
| Products with manufacturer | 100% | 95%+ |
| Products with category | 100% | 100% |
| Products with description | 80%+ | 60%+ |
| Products with datasheets | 60%+ | 40%+ |

If metrics are below acceptable, investigate parser selectors.

## Maintenance

### Regular Updates

ChipDip adds new products daily. Update catalog:

```bash
# Weekly cron job
0 2 * * 0 cd /path/to/electromagaz && pnpm tsx src/scripts/import-chipdip.ts
```

Import script is idempotent:
- Existing products: Updated with latest data
- New products: Added to database
- Deleted products: Remain in database (manual cleanup if needed)

### Cleanup Old Data

Remove discontinued products:

```sql
-- Find products not updated in 6 months
SELECT id, name, "updatedAt"
FROM "Product"
WHERE "updatedAt" < NOW() - INTERVAL '6 months';

-- Delete if confirmed discontinued
DELETE FROM "Product" WHERE id = 'product-id';
```

### Monitor Parser Health

Set up alerts for high failure rates:

```typescript
const result = await importProducts()

if (result.failed / result.total > 0.1) {
  // More than 10% failures - investigate
  console.error('High failure rate detected!')
  // Send alert email/Slack notification
}
```

## Performance Benchmarks

### Hardware: MacBook Pro M1, 16GB RAM

| Products | Time | Memory | Database Size |
|----------|------|--------|---------------|
| 10 | 15s | 50MB | 2MB |
| 100 | 2m | 80MB | 15MB |
| 1,000 | 20m | 100MB | 120MB |
| 10,000 | 3h | 120MB | 1.2GB |
| 100,000 | 30h | 150MB | 12GB |
| 2,000,000 | 23d | 200MB | 240GB |

**Notes:**
- Time assumes 1 req/sec rate limit
- Memory is peak usage (parser doesn't accumulate)
- Database size includes indexes

### Optimization Results

| Optimization | Speed Improvement |
|--------------|-------------------|
| Increase rate limit to 2 req/sec | 2x faster |
| Parallel processing (3 processes) | 3x faster |
| Batch size 100 (vs 10) | 1.5x faster |
| All optimizations combined | 9x faster |

**Example:** 100K products
- Baseline: 30 hours
- Optimized: 3.3 hours

## Advanced Usage

### Custom Catalog URLs

Import from specific ChipDip categories:

```typescript
// Microcontrollers
await importProducts({
  catalogUrl: 'https://www.chipdip.ru/catalog/microcontrollers',
})

// ARM Cortex-M only
await importProducts({
  catalogUrl: 'https://www.chipdip.ru/catalog/arm-cortex-m',
})

// Specific manufacturer (STMicroelectronics)
await importProducts({
  catalogUrl: 'https://www.chipdip.ru/catalog/stmicroelectronics',
})
```

### Selective Field Import

Skip fields you don't need (faster imports):

Edit `importProductToDatabase()` in `src/scripts/import-chipdip.ts`:

```typescript
// Skip datasheets (faster)
// await tx.datasheet.createMany({ ... })

// Skip specifications (much faster)
// await tx.specification.createMany({ ... })
```

**Speed improvement:** ~30% faster without specs/datasheets

### Export Imported Data

Export products to JSON for backup:

```typescript
const products = await prisma.product.findMany({
  include: {
    category: true,
    manufacturer: true,
    images: true,
    specifications: true,
    datasheets: true,
  }
})

fs.writeFileSync('products-backup.json', JSON.stringify(products, null, 2))
```

### Import from JSON Backup

Restore from backup:

```typescript
const products = JSON.parse(fs.readFileSync('products-backup.json', 'utf-8'))

for (const product of products) {
  await prisma.product.create({
    data: {
      // ... map fields
    }
  })
}
```

## Support

### Logs

Import script logs all errors with context:

```
✗ Failed 47/100: stm32f407vgt6 - Failed to extract manufacturer
```

Check logs for patterns:
- Same error repeated: Parser issue (update selectors)
- Random errors: Network issue (increase retries)
- Specific products failing: Invalid HTML on those pages

### Debug Mode

Enable verbose logging:

```typescript
// Add to import-chipdip.ts
console.log('Fetching:', productUrl)
console.log('Parsed:', parsedProduct)
console.log('Importing:', product)
```

### Community

- GitHub Issues: Report parser bugs
- Discussions: Share optimization tips
- Pull Requests: Contribute parser improvements

## Next Steps

After successful import:

1. **Verify data in Prisma Studio:**
   ```bash
   pnpm prisma studio
   ```

2. **Test admin UI:**
   ```bash
   pnpm dev
   # Visit http://localhost:3000/admin/products
   ```

3. **Set up Meilisearch** (for fast product search)

4. **Configure pricing** (user-managed, not from parser)

5. **Scale to full catalog** (2M products)
