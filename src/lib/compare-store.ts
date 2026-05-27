/**
 * LocalStorage-backed list for product comparison.
 * Limit: 4 products. Stored only as IDs and minimal display info.
 */

const STORAGE_KEY = 'electromagaz:compare'
const MAX_COMPARE = 4

export interface CompareItem {
  id: string
  slug: string
  name: string
  partNumber: string
  manufacturer: string
  categorySlug: string
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function emit() {
  if (!isBrowser()) return
  window.dispatchEvent(new Event('compare:change'))
}

export function getCompareList(): CompareItem[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CompareItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function isInCompare(id: string): boolean {
  return getCompareList().some((i) => i.id === id)
}

/**
 * Add or remove product from compare list. Returns the new state ('added' or 'removed').
 * If list is full, returns 'full' without modifying.
 */
export function toggleCompare(item: CompareItem): 'added' | 'removed' | 'full' {
  if (!isBrowser()) return 'removed'
  try {
    const list = getCompareList()
    const idx = list.findIndex((i) => i.id === item.id)
    if (idx >= 0) {
      list.splice(idx, 1)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
      emit()
      return 'removed'
    }
    if (list.length >= MAX_COMPARE) return 'full'
    list.push(item)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    emit()
    return 'added'
  } catch {
    return 'removed'
  }
}

export function removeFromCompare(id: string): void {
  if (!isBrowser()) return
  try {
    const list = getCompareList().filter((i) => i.id !== id)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    emit()
  } catch {
    // ignore
  }
}

export function clearCompare(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    emit()
  } catch {
    // ignore
  }
}

export const COMPARE_LIMIT = MAX_COMPARE
