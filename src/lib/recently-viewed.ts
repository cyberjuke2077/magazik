/**
 * LocalStorage-backed store for recently-viewed products.
 * Used on the home page and product page to surface relevant items.
 */

const STORAGE_KEY = 'electromagaz:recently-viewed'
const MAX_ITEMS = 12

export interface RecentlyViewedItem {
  slug: string
  name: string
  partNumber: string
  manufacturer: string
  categorySlug: string
  price: number
  viewedAt: number
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentlyViewedItem[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function addRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>): void {
  if (!isBrowser()) return
  try {
    const list = getRecentlyViewed().filter((i) => i.slug !== item.slug)
    list.unshift({ ...item, viewedAt: Date.now() })
    const trimmed = list.slice(0, MAX_ITEMS)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage may be full or disabled; silently ignore
  }
}

export function clearRecentlyViewed(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
