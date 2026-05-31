import { NextResponse } from 'next/server'
import { getCategoriesWithChildren } from '@/lib/queries/categories'

/**
 * Публичное дерево разделов каталога для мега-меню в шапке.
 * Используется StickyNav на страницах, где категории не переданы пропсом.
 */
export async function GET() {
  try {
    const categories = await getCategoriesWithChildren()
    return NextResponse.json(categories, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
