'use server'

import { getProductsByIds, type Product } from '@/lib/queries/products'

export async function fetchCompareProducts(ids: string[]): Promise<Product[]> {
  if (!Array.isArray(ids) || ids.length === 0) return []
  // Guard against malicious huge arrays
  const safeIds = ids.slice(0, 4)
  return getProductsByIds(safeIds)
}
