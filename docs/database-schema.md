# Database Schema Design

## Overview

The Electromagaz database schema is designed to handle large-scale electronics catalogs (2M+ products) with complex relationships, flexible specifications, and optimized search performance.

## Design Principles

### 1. Scalability First
- Indexed fields for fast lookups on 2M+ products
- Composite indexes for common query patterns
- Normalized structure to minimize data duplication
- Efficient many-to-many relationships

### 2. Flexibility
- Key-value specifications (not rigid columns) - electronics have vastly different specs
- Multiple images per product
- Multiple datasheets per product
- Product analogs (alternative/compatible parts)

### 3. Data Integrity
- Cascade deletes to maintain referential integrity
- Required relationships (product must have category and manufacturer)
- Unique constraints on business keys (slug, SKU, part number combinations)

## Core Models

### Category
Hierarchical category structure with parent/child relationships.

```prisma
model Category {
  id          String    @id @default(cuid())
  slug        String    @unique
  name        String
  icon        String?
  description String?
  color       String?
  
  parentId    String?
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Category[] @relation("CategoryHierarchy")
  
  products    Product[]
  
  @@index([slug])
  @@index([parentId])
}
```

**Why hierarchical?** Electronics categories are naturally nested: "Electronic Components" → "Semiconductors" → "Microcontrollers" → "ARM Cortex-M". This allows breadcrumb navigation and filtering by parent categories.

**Indexes:**
- `slug` - Fast category lookup by URL slug
- `parentId` - Efficient child category queries

### Manufacturer
Electronics manufacturers (ST Microelectronics, Texas Instruments, etc.)

```prisma
model Manufacturer {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?
  website     String?
  
  products    Product[]
  
  @@index([slug])
  @@index([name])
}
```

**Why separate model?** Manufacturers are referenced frequently in search/filters. Normalizing prevents data duplication and enables manufacturer-level queries (e.g., "all STM32 products").

**Indexes:**
- `slug` - URL-friendly manufacturer pages
- `name` - Autocomplete in search filters

### Product
Core product data with pricing, stock, and metadata.

```prisma
model Product {
  id                String    @id @default(cuid())
  slug              String    @unique
  name              String
  partNumber        String
  sku               String?   @unique
  description       String?   @db.Text
  
  price             Decimal?  @db.Decimal(10, 2)
  priceWholesale    Decimal?  @db.Decimal(10, 2)
  currency          String    @default("RUB")
  
  inStock           Boolean   @default(false)
  stockCount        Int       @default(0)
  unit              String    @default("шт")
  minOrder          Int       @default(1)
  
  categoryId        String
  category          Category       @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  manufacturerId    String
  manufacturer      Manufacturer   @relation(fields: [manufacturerId], references: [id], onDelete: Cascade)
  
  images            ProductImage[]
  specifications    Specification[]
  datasheets        Datasheet[]
  analogs           ProductAnalog[] @relation("ProductToAnalog")
  analogOf          ProductAnalog[] @relation("AnalogToProduct")
  
  tags              String[]
  featured          Boolean   @default(false)
  
  @@index([slug])
  @@index([partNumber])
  @@index([sku])
  @@index([categoryId])
  @@index([manufacturerId])
  @@index([partNumber, manufacturerId])
}
```

**Key design decisions:**

1. **slug vs partNumber vs sku**: 
   - `slug` - URL-friendly identifier (e.g., "stm32f103c8t6")
   - `partNumber` - Manufacturer's part number (e.g., "STM32F103C8T6")
   - `sku` - ChipDip's internal ID (optional, for tracking source)

2. **Pricing fields**: User-managed (not from parser). Supports retail and wholesale pricing.

3. **Stock fields**: User-managed. Parser doesn't import stock data.

4. **description as Text**: Electronics descriptions can be lengthy (technical specs, applications, features).

5. **Composite index [partNumber, manufacturerId]**: Common search pattern - "find STM32F103C8T6 by ST Microelectronics".

### ProductImage
Multiple images per product (gallery support).

```prisma
model ProductImage {
  id          String   @id @default(cuid())
  imageUrl    String
  altText     String?
  order       Int      @default(0)
  
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([productId])
}
```

**Why store URLs only?** Initial implementation uses ChipDip CDN URLs. No local storage needed for 100-product test. Can migrate to local storage later if needed.

**order field**: Maintains image sequence for product galleries.

### Specification
Flexible key-value specifications (not rigid columns).

```prisma
model Specification {
  id          String   @id @default(cuid())
  key         String
  value       String   @db.Text
  order       Int      @default(0)
  
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([productId])
  @@index([key])
}
```

**Why key-value?** Electronics have vastly different specifications:
- Resistor: Resistance, Tolerance, Power Rating, Temperature Coefficient
- Microcontroller: Core, Frequency, Flash, RAM, GPIO, Peripherals, Package
- Capacitor: Capacitance, Voltage, Tolerance, Temperature Range, ESR

Rigid columns would require hundreds of nullable fields. Key-value is flexible and efficient.

**Index on key**: Enables filtering by specific specs (e.g., "all products with Flash >= 64KB").

### Datasheet
PDF datasheet links (multiple per product).

```prisma
model Datasheet {
  id          String   @id @default(cuid())
  title       String
  url         String
  fileSize    String?
  language    String   @default("ru")
  
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([productId])
}
```

**Why separate model?** Products often have multiple datasheets (different languages, revisions, application notes).

### ProductAnalog
Many-to-many self-relation for alternative/compatible products.

```prisma
model ProductAnalog {
  id          String   @id @default(cuid())
  
  productId   String
  product     Product  @relation("ProductToAnalog", fields: [productId], references: [id], onDelete: Cascade)
  
  analogId    String
  analog      Product  @relation("AnalogToProduct", fields: [analogId], references: [id], onDelete: Cascade)
  
  note        String?
  
  @@unique([productId, analogId])
  @@index([productId])
  @@index([analogId])
}
```

**Why many-to-many?** Product A can be analog of Product B, and vice versa. Example: STM32F103C8T6 ↔ GD32F103C8T6 (pin-compatible alternatives).

**Unique constraint**: Prevents duplicate analog relationships.

## Index Strategy

### Search Performance
For 2M products, indexes are critical:

1. **Single-column indexes**: Fast lookups by slug, SKU, part number
2. **Composite indexes**: Optimize common queries (part number + manufacturer)
3. **Foreign key indexes**: Speed up joins (categoryId, manufacturerId)
4. **Specification key index**: Enable spec-based filtering

### Query Patterns
Common queries and their indexes:

```typescript
// Find product by slug - uses index on slug
await prisma.product.findUnique({ where: { slug: 'stm32f103c8t6' } })

// Find products by category - uses index on categoryId
await prisma.product.findMany({ where: { categoryId: 'cat123' } })

// Find products by manufacturer - uses index on manufacturerId
await prisma.product.findMany({ where: { manufacturerId: 'mfr456' } })

// Find product by part number and manufacturer - uses composite index
await prisma.product.findFirst({
  where: {
    partNumber: 'STM32F103C8T6',
    manufacturerId: 'st-microelectronics'
  }
})

// Find products with specific spec - uses index on Specification.key
await prisma.product.findMany({
  where: {
    specifications: {
      some: {
        key: 'Core',
        value: { contains: 'ARM Cortex-M3' }
      }
    }
  }
})
```

## Scaling Considerations

### Current Scale (100 products)
- All queries are fast (<10ms)
- No optimization needed

### Target Scale (2M products)
- Indexes ensure queries remain fast (<100ms)
- Pagination required for large result sets
- Measure PostgreSQL FTS relevance and latency before adding another search service
- Batch imports use transactions for data integrity

### Future Optimizations
If performance degrades at scale:
1. Add materialized views for common aggregations
2. Implement caching layer (Redis)
3. Partition large tables by category
4. Use read replicas for search queries

## Migration Strategy

### Initial Setup
```bash
# Create database
docker-compose up -d postgres

# Run migrations
pnpm prisma migrate dev

# Verify schema
pnpm prisma studio
```

### Adding New Fields
Always use migrations (never manual schema edits):

```bash
# Edit schema.prisma
# Then create migration
pnpm prisma migrate dev --name add_product_weight

# Apply to production
pnpm prisma migrate deploy
```

### Data Integrity
- Use transactions for multi-table operations
- Cascade deletes maintain referential integrity
- Unique constraints prevent duplicates
- Required fields enforce business rules

## Example Queries

### Get product with all relations
```typescript
const product = await prisma.product.findUnique({
  where: { slug: 'stm32f103c8t6' },
  include: {
    category: true,
    manufacturer: true,
    images: { orderBy: { order: 'asc' } },
    specifications: { orderBy: { order: 'asc' } },
    datasheets: true,
    analogs: {
      include: {
        analog: {
          include: { manufacturer: true }
        }
      }
    }
  }
})
```

### Search products by part number
```typescript
const products = await prisma.product.findMany({
  where: {
    partNumber: { contains: 'STM32', mode: 'insensitive' }
  },
  include: {
    category: true,
    manufacturer: true,
    images: { take: 1, orderBy: { order: 'asc' } }
  },
  take: 20
})
```

### Get category hierarchy
```typescript
const category = await prisma.category.findUnique({
  where: { slug: 'microcontrollers' },
  include: {
    parent: true,
    children: true,
    products: {
      take: 10,
      include: { manufacturer: true }
    }
  }
})
```
