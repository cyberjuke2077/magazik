'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'

/** Защита server actions (в дополнение к middleware). */
async function requireAdmin(): Promise<void> {
  const store = await cookies()
  const ok = await verifySessionToken(store.get(ADMIN_COOKIE)?.value)
  if (!ok) throw new Error('Unauthorized')
}

const REQUEST_STATUSES = ['new', 'in_progress', 'quoted', 'rejected'] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!REQUEST_STATUSES.includes(status)) return { ok: false, error: 'Неизвестный статус' }
    await prisma.quoteRequest.update({ where: { id: requestId }, data: { status } })
    revalidatePath('/admin/requests')
    revalidatePath(`/admin/requests/${requestId}`)
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export interface ProductPricingInput {
  price: string // '' = убрать цену
  priceWholesale: string
  stockCount: string
  inStock: boolean
}

function parseDecimal(raw: string): number | null {
  const t = raw.trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0 || n > 99_999_999) {
    throw new Error(`Некорректная цена: ${raw}`)
  }
  return Math.round(n * 100) / 100
}

export async function updateProductPricing(
  productId: string,
  input: ProductPricingInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    const stockCount = input.stockCount.trim() === '' ? 0 : parseInt(input.stockCount, 10)
    if (!Number.isFinite(stockCount) || stockCount < 0) {
      return { ok: false, error: 'Некорректный остаток' }
    }
    await prisma.product.update({
      where: { id: productId },
      data: {
        price: parseDecimal(input.price),
        priceWholesale: parseDecimal(input.priceWholesale),
        stockCount,
        inStock: input.inStock,
      },
    })
    revalidatePath('/admin/products')
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}
