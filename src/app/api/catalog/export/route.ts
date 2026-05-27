import { NextRequest, NextResponse } from 'next/server'

import { getProductsForExport } from '@/lib/queries/products'
import { type SortOption } from '@/lib/catalog-utils'

const VALID_SORTS: SortOption[] = ['name', 'partNumber', 'date', 'manufacturer']

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const query = searchParams.get('q') || null
  const categorySlug = searchParams.get('category') || null
  const manufacturerSlug = searchParams.get('manufacturer') || null
  const rawSort = searchParams.get('sort') || 'date'
  const sort: SortOption = VALID_SORTS.includes(rawSort as SortOption)
    ? (rawSort as SortOption)
    : 'date'

  try {
    const products = await getProductsForExport({
      query,
      categorySlug,
      manufacturerSlug,
      sort,
    })

    // CSV header
    const header = ['Артикул', 'Наименование', 'Производитель', 'Категория', 'Корпус', 'Цена']

    // CSV rows
    const rows = products.map((p) => [
      escapeCsvField(p.partNumber),
      escapeCsvField(p.name),
      escapeCsvField(p.manufacturer),
      escapeCsvField(p.category),
      escapeCsvField(p.package || ''),
      p.price ? String(p.price) : '',
    ])

    // Build CSV with BOM for Excel Cyrillic compatibility
    const bom = '\uFEFF'
    const csv = bom + [
      header.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\r\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="catalog-export.csv"',
      },
    })
  } catch (error) {
    console.error('CSV export failed:', error)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 },
    )
  }
}
