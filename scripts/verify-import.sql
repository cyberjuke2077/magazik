-- ChipDip Import Verification Queries
-- Run these queries in pgAdmin or psql after import completes

-- ============================================================
-- 1. COUNT TOTAL PRODUCTS IMPORTED
-- ============================================================
-- Expected: ~95-100 products
SELECT COUNT(*) AS total_products
FROM "Product";

-- ============================================================
-- 2. CHECK MANUFACTURERS CREATED
-- ============================================================
-- Expected: ~10-20 manufacturers (STMicroelectronics, Atmel, etc.)
SELECT 
  id,
  name,
  slug,
  (SELECT COUNT(*) FROM "Product" WHERE "manufacturerId" = m.id) AS product_count
FROM "Manufacturer" m
ORDER BY product_count DESC;

-- ============================================================
-- 3. CHECK CATEGORIES CREATED
-- ============================================================
-- Expected: 1 category ("Микросхемы" or similar)
SELECT 
  id,
  name,
  slug,
  (SELECT COUNT(*) FROM "Product" WHERE "categoryId" = c.id) AS product_count
FROM "Category" c
ORDER BY product_count DESC;

-- ============================================================
-- 4. SAMPLE PRODUCT DATA
-- ============================================================
-- Shows first 10 products with full details
SELECT 
  p.id,
  p.slug,
  p.name,
  p."partNumber",
  p.sku,
  LEFT(p.description, 100) AS description_preview,
  m.name AS manufacturer,
  c.name AS category,
  p."createdAt"
FROM "Product" p
LEFT JOIN "Manufacturer" m ON p."manufacturerId" = m.id
LEFT JOIN "Category" c ON p."categoryId" = c.id
ORDER BY p."createdAt" DESC
LIMIT 10;

-- ============================================================
-- 5. SPECIFICATIONS COUNT
-- ============================================================
-- Expected: 10-30 specs per product
SELECT 
  p.slug,
  p.name,
  COUNT(s.id) AS spec_count
FROM "Product" p
LEFT JOIN "Specification" s ON p.id = s."productId"
GROUP BY p.id, p.slug, p.name
ORDER BY spec_count DESC
LIMIT 10;

-- ============================================================
-- 6. IMAGES COUNT
-- ============================================================
-- Expected: 1-5 images per product
SELECT 
  p.slug,
  p.name,
  COUNT(i.id) AS image_count
FROM "Product" p
LEFT JOIN "ProductImage" i ON p.id = i."productId"
GROUP BY p.id, p.slug, p.name
ORDER BY image_count DESC
LIMIT 10;

-- ============================================================
-- 7. DATASHEETS COUNT
-- ============================================================
-- Expected: 1-3 datasheets per product
SELECT 
  p.slug,
  p.name,
  COUNT(d.id) AS datasheet_count
FROM "Product" p
LEFT JOIN "Datasheet" d ON p.id = d."productId"
GROUP BY p.id, p.slug, p.name
ORDER BY datasheet_count DESC
LIMIT 10;

-- ============================================================
-- 8. DATA COMPLETENESS CHECK
-- ============================================================
-- Shows products missing critical data
SELECT 
  p.slug,
  p.name,
  CASE WHEN p.description IS NULL THEN '❌' ELSE '✅' END AS has_description,
  CASE WHEN p.sku IS NULL THEN '❌' ELSE '✅' END AS has_sku,
  CASE WHEN (SELECT COUNT(*) FROM "ProductImage" WHERE "productId" = p.id) > 0 THEN '✅' ELSE '❌' END AS has_images,
  CASE WHEN (SELECT COUNT(*) FROM "Specification" WHERE "productId" = p.id) > 0 THEN '✅' ELSE '❌' END AS has_specs,
  CASE WHEN (SELECT COUNT(*) FROM "Datasheet" WHERE "productId" = p.id) > 0 THEN '✅' ELSE '❌' END AS has_datasheets
FROM "Product" p
ORDER BY p."createdAt" DESC
LIMIT 20;

-- ============================================================
-- 9. PRODUCTS WITH NO IMAGES (POTENTIAL ISSUES)
-- ============================================================
-- Expected: 0-5 products (some products may legitimately have no images)
SELECT 
  p.slug,
  p.name,
  p."partNumber"
FROM "Product" p
WHERE NOT EXISTS (
  SELECT 1 FROM "ProductImage" WHERE "productId" = p.id
)
ORDER BY p."createdAt" DESC;

-- ============================================================
-- 10. PRODUCTS WITH NO SPECIFICATIONS (POTENTIAL ISSUES)
-- ============================================================
-- Expected: 0-5 products
SELECT 
  p.slug,
  p.name,
  p."partNumber"
FROM "Product" p
WHERE NOT EXISTS (
  SELECT 1 FROM "Specification" WHERE "productId" = p.id
)
ORDER BY p."createdAt" DESC;

-- ============================================================
-- 11. SAMPLE SPECIFICATIONS FOR ONE PRODUCT
-- ============================================================
-- Shows all specs for the first product (verify data quality)
SELECT 
  s.key,
  s.value,
  s."order"
FROM "Specification" s
WHERE s."productId" = (SELECT id FROM "Product" ORDER BY "createdAt" DESC LIMIT 1)
ORDER BY s."order";

-- ============================================================
-- 12. SAMPLE IMAGES FOR ONE PRODUCT
-- ============================================================
-- Shows all images for the first product
SELECT 
  i."imageUrl",
  i."order"
FROM "ProductImage" i
WHERE i."productId" = (SELECT id FROM "Product" ORDER BY "createdAt" DESC LIMIT 1)
ORDER BY i."order";

-- ============================================================
-- 13. DUPLICATE CHECK (SHOULD BE ZERO)
-- ============================================================
-- Verifies no duplicate products by slug
SELECT 
  slug,
  COUNT(*) AS duplicate_count
FROM "Product"
GROUP BY slug
HAVING COUNT(*) > 1;

-- ============================================================
-- 14. OVERALL IMPORT HEALTH SUMMARY
-- ============================================================
SELECT 
  'Products' AS entity,
  COUNT(*) AS total
FROM "Product"
UNION ALL
SELECT 
  'Manufacturers' AS entity,
  COUNT(*) AS total
FROM "Manufacturer"
UNION ALL
SELECT 
  'Categories' AS entity,
  COUNT(*) AS total
FROM "Category"
UNION ALL
SELECT 
  'Images' AS entity,
  COUNT(*) AS total
FROM "ProductImage"
UNION ALL
SELECT 
  'Specifications' AS entity,
  COUNT(*) AS total
FROM "Specification"
UNION ALL
SELECT 
  'Datasheets' AS entity,
  COUNT(*) AS total
FROM "Datasheet";

-- ============================================================
-- 15. AVERAGE DATA PER PRODUCT
-- ============================================================
SELECT 
  ROUND(AVG(image_count), 2) AS avg_images_per_product,
  ROUND(AVG(spec_count), 2) AS avg_specs_per_product,
  ROUND(AVG(datasheet_count), 2) AS avg_datasheets_per_product
FROM (
  SELECT 
    p.id,
    (SELECT COUNT(*) FROM "ProductImage" WHERE "productId" = p.id) AS image_count,
    (SELECT COUNT(*) FROM "Specification" WHERE "productId" = p.id) AS spec_count,
    (SELECT COUNT(*) FROM "Datasheet" WHERE "productId" = p.id) AS datasheet_count
  FROM "Product" p
) AS product_stats;
