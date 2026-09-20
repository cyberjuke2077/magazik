import { NextResponse } from 'next/server'
import { getProductsByIds } from '@/lib/queries/products'

const MAX_CART_PRODUCTS = 100

function parseIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_CART_PRODUCTS) return null
  if (!value.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 128)) {
    return null
  }
  return [...new Set(value)]
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    if (typeof body !== 'object' || body === null || !('ids' in body)) {
      return NextResponse.json({ error: 'Некорректный список товаров' }, { status: 400 })
    }
    const ids = parseIds(body.ids)
    if (!ids) {
      return NextResponse.json({ error: 'Некорректный список товаров' }, { status: 400 })
    }
    return NextResponse.json({ products: await getProductsByIds(ids) })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 })
    }
    console.error('[cart products] failed to refresh products:', error)
    return NextResponse.json({ error: 'Каталог временно недоступен' }, { status: 503 })
  }
}
