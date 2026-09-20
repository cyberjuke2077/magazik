import { buildContainsLikePattern, buildPrefixTsQuery, normalizeSearchQuery } from '@/lib/search-query'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/search?q=STM32
 *
 * Live-search endpoint for the sticky nav autocomplete.
 * Returns up to 7 products + matching categories + manufacturers via PostgreSQL FTS.
 * Fast response (<100ms) for instant dropdown.
 */
export async function GET(request: NextRequest) {
  const q = normalizeSearchQuery(request.nextUrl.searchParams.get('q') ?? '')

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], categories: [], manufacturers: [] })
  }

  try {
    // Build prefix-matching tsquery: "STM32" → "STM32:*"
    const tsqueryStr = buildPrefixTsQuery(q)

    if (!tsqueryStr) {
      return NextResponse.json({ products: [], categories: [], manufacturers: [] })
    }

    // ILIKE pattern for category/manufacturer name matching
    const ilikePattern = buildContainsLikePattern(q)

    // Run all three queries in parallel
    const [products, categories, manufacturers] = await Promise.all([
      // Products via FTS
      prisma.$queryRaw<
        Array<{
          id: string
          slug: string
          name: string
          partNumber: string
          manufacturer: string
          categorySlug: string
          categoryName: string
        }>
      >`
        SELECT
          p.id,
          p.slug,
          p.name,
          p."partNumber",
          m.name as manufacturer,
          c.slug as "categorySlug",
          c.name as "categoryName"
        FROM "Product" p
        JOIN "Manufacturer" m ON p."manufacturerId" = m.id
        JOIN "Category" c ON p."categoryId" = c.id
        WHERE p."searchVector" @@ to_tsquery('simple', ${tsqueryStr})
          OR m.name ILIKE ${ilikePattern}
        ORDER BY GREATEST(
          ts_rank(p."searchVector", to_tsquery('simple', ${tsqueryStr})),
          CASE WHEN m.name ILIKE ${ilikePattern} THEN 1 ELSE 0 END
        ) DESC, p.id ASC
        LIMIT 7
      `,

      // Categories matching by name
      prisma.$queryRaw<
        Array<{
          id: string
          slug: string
          name: string
          productCount: bigint
        }>
      >`
        SELECT
          c.id,
          c.slug,
          c.name,
          COUNT(p.id) as "productCount"
        FROM "Category" c
        LEFT JOIN "Product" p ON p."categoryId" = c.id
        WHERE c.name ILIKE ${ilikePattern}
        GROUP BY c.id, c.slug, c.name
        ORDER BY COUNT(p.id) DESC, c.id ASC
        LIMIT 3
      `,

      // Manufacturers matching by name
      prisma.$queryRaw<
        Array<{
          id: string
          slug: string
          name: string
          productCount: bigint
        }>
      >`
        SELECT
          m.id,
          m.slug,
          m.name,
          COUNT(p.id) as "productCount"
        FROM "Manufacturer" m
        LEFT JOIN "Product" p ON p."manufacturerId" = m.id
        WHERE m.name ILIKE ${ilikePattern}
        GROUP BY m.id, m.slug, m.name
        ORDER BY COUNT(p.id) DESC, m.id ASC
        LIMIT 3
      `,
    ])

    return NextResponse.json({
      products,
      categories: categories.map((c) => ({ ...c, productCount: Number(c.productCount) })),
      manufacturers: manufacturers.map((m) => ({ ...m, productCount: Number(m.productCount) })),
    })
  } catch (error) {
    console.error('[search API] error:', error)
    return NextResponse.json({ error: 'Поиск временно недоступен' }, { status: 503 })
  }
}
