# ChipDip Full Import Guide

This guide walks you through running the full import of 100 products from ChipDip's Микросхемы (Microcontrollers) category.

---

## Pre-Flight Checklist

Before running the import, verify all prerequisites:

### 1. Database Running
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# If not running, start it
docker-compose up -d postgres
```

### 2. Environment Variables Configured
```bash
# Verify .env file exists and has DATABASE_URL
cat .env | grep DATABASE_URL

# Should output something like:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/electromagaz"
```

### 3. Database Schema Applied
```bash
# Check if migrations are applied
pnpm db:migrate

# Should show: "Database is up to date"
```

### 4. Dependencies Installed
```bash
# Ensure all packages are installed
pnpm install
```

### 5. Test Database Connection
```bash
# Quick connection test using Prisma Studio (optional)
pnpm db:studio
# Open http://localhost:5555 in browser, verify tables exist
# Press Ctrl+C to stop
```

---

## Running the Import

### Command
```bash
pnpm import:chipdip
```

This executes: `tsx src/scripts/import-chipdip.ts`

### Expected Behavior

**Duration**: ~100-120 seconds (rate limited to 1 request/second)

**Progress Output**:
```
ChipDip Product Import
============================================================
Fetching product URLs from: https://www.chipdip.ru/catalog/microcontrollers
Found 150 products, will import 100

Processing batch 1/10
✓ Imported 1/100: stm32f103c8t6
✓ Imported 2/100: atmega328p-pu
✓ Imported 3/100: esp32-wroom-32
...
✓ Imported 10/100: pic16f877a-i-p

Processing batch 2/10
✓ Imported 11/100: attiny85-20pu
...
```

**Success Indicators**:
- Progress counter increments: `✓ Imported X/100`
- No fatal errors that stop the script
- Final summary shows `Successful: 95+` (at least 95% success rate)

**Failure Handling**:
- Individual product failures are logged but don't stop import
- Failed products show: `✗ Failed X/100: slug - error message`
- Script continues processing remaining products

---

## Expected Results

### Minimum Success Criteria
- **At least 95 products** successfully imported (95% success rate)
- **No script crashes** (completes all 100 attempts)
- **Rate limiting enforced** (~1 second per product)
- **No duplicate products** created (upsert logic prevents duplicates)

### Data Completeness
Each successfully imported product should have:
- Product name, part number, SKU
- Manufacturer (auto-created if new)
- Category (auto-created if new)
- Images (1-5 images per product)
- Specifications (10-30 specs per product)
- Datasheets (1-3 datasheets per product)

---

## Post-Import Verification

After import completes, verify data in database:

### Option 1: Using pgAdmin
1. Open pgAdmin: http://localhost:5050
2. Login with credentials from `.env`
3. Navigate to: Servers → electromagaz → Schemas → public → Tables
4. Run queries from `scripts/verify-import.sql`

### Option 2: Using Prisma Studio
```bash
pnpm db:studio
```
Open http://localhost:5555 and browse:
- Products table (should have ~95-100 rows)
- Manufacturers table (should have ~10-20 rows)
- Categories table (should have 1 row: "Микросхемы")
- ProductImage, Specification, Datasheet tables (should have data)

### Option 3: Using psql CLI
```bash
docker exec -it electromagaz-postgres psql -U postgres -d electromagaz

# Run verification queries
SELECT COUNT(*) FROM "Product";
SELECT COUNT(*) FROM "Manufacturer";
SELECT COUNT(*) FROM "Category";
```

---

## Troubleshooting

### Issue: "Database connection failed"
**Solution**:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database
docker-compose restart postgres

# Verify DATABASE_URL in .env matches container config
```

### Issue: "Rate limit exceeded" or "Too many requests"
**Solution**:
- Script already has 1 req/sec rate limiting built-in
- If ChipDip blocks you, wait 5-10 minutes before retrying
- Consider reducing `maxProducts` in script if needed

### Issue: "Prisma Client not generated"
**Solution**:
```bash
pnpm db:generate
```

### Issue: Many products failing with "Parse error"
**Solution**:
- ChipDip may have changed their HTML structure
- Check one failing product manually in browser
- May need to update parser selectors in `src/lib/parser/product-parser.ts`

### Issue: Script hangs or freezes
**Solution**:
- Press Ctrl+C to stop
- Check network connectivity
- Verify ChipDip website is accessible: https://www.chipdip.ru
- Re-run script (idempotent, won't create duplicates)

### Issue: "Transaction failed" errors
**Solution**:
- Check database disk space
- Verify database isn't locked by another process
- Close Prisma Studio if open
- Restart PostgreSQL container

---

## Re-Running the Import

The import script is **idempotent** — safe to run multiple times:
- Existing products are updated (upsert logic)
- No duplicate products created
- Related data (images, specs, datasheets) is replaced, not duplicated

To re-import:
```bash
pnpm import:chipdip
```

---

## Import Configuration

To customize the import, edit `src/scripts/import-chipdip.ts`:

```typescript
const result = await importProducts({
  maxProducts: 100,        // Number of products to import
  batchSize: 10,           // Products per batch (for progress tracking)
  catalogUrl: 'https://www.chipdip.ru/catalog/microcontrollers',
})
```

**Available catalog URLs**:
- Microcontrollers: `/catalog/microcontrollers`
- Resistors: `/catalog/resistors`
- Capacitors: `/catalog/capacitors`
- Transistors: `/catalog/transistors`

---

## Next Steps

After successful import:
1. Run verification queries (see `scripts/verify-import.sql`)
2. Check data quality in Prisma Studio
3. Test product display in Next.js app
4. Consider importing more categories
5. Set up Meilisearch indexing for search functionality

---

**Last Updated**: 2026-04-17
