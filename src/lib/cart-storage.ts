import type { CartChange } from '@/lib/cart-reconciliation'
import type { CartItem, Product } from '@/types'

export const CART_KEY = 'electromagaz_cart'
export const CART_UPDATED_EVENT = 'electromagaz:cart-updated'
export const CART_CHANGES_KEY = 'electromagaz_cart_pending_changes'
export const CART_CHANGES_UPDATED_EVENT = 'electromagaz:cart-changes-updated'
export const CART_STORAGE_VERSION = 1
export const MAX_CART_ITEMS = 100
export const MAX_CART_QUANTITY = 1_000_000
const MAX_STOCK_COUNT = 2_147_483_647
const CART_LOCK_NAME = 'electromagaz-cart'
const CART_FALLBACK_LOCK_KEY = 'electromagaz_cart_lock'
const MAX_WRITE_ATTEMPTS = 4
const MAX_PENDING_CHANGES = 200
const FALLBACK_LOCK_LEASE_MS = 2_000
const FALLBACK_LOCK_SETTLE_MS = 12
const FALLBACK_LOCK_TIMEOUT_MS = 1_500

export class CartStorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CartStorageError'
  }
}

interface StoredCartItem {
  productId: string
  quantity: number
  snapshot: Product
}

interface StoredCart {
  version: typeof CART_STORAGE_VERSION
  items: StoredCartItem[]
}

interface StoredCartChanges {
  version: 1
  changes: CartChange[]
}

interface StoredCartLock {
  owner: string
  expiresAt: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isSpecs(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'string')
}

function hasValidCommercialFields(value: Record<string, unknown>): boolean {
  return typeof value.price === 'number' && Number.isFinite(value.price) && value.price >= 0
    && (value.priceWholesale === undefined
      || (typeof value.priceWholesale === 'number'
        && Number.isFinite(value.priceWholesale) && value.priceWholesale >= 0))
    && typeof value.inStock === 'boolean'
    && Number.isSafeInteger(value.stockCount) && Number(value.stockCount) >= 0
    && Number(value.stockCount) <= MAX_STOCK_COUNT
    && Number.isSafeInteger(value.minOrder) && Number(value.minOrder) > 0
    && Number(value.minOrder) <= MAX_CART_QUANTITY
}

export function normalizeCartQuantity(value: number, minOrder: number): number {
  const safeMinimum = Number.isSafeInteger(minOrder) && minOrder > 0
    ? Math.min(minOrder, MAX_CART_QUANTITY)
    : 1
  if (!Number.isSafeInteger(value) || value <= 0) return safeMinimum
  return Math.max(safeMinimum, Math.min(value, MAX_CART_QUANTITY))
}

function hasValidOptionalFields(value: Record<string, unknown>): boolean {
  return (value.categorySlug === undefined || typeof value.categorySlug === 'string')
    && (value.featured === undefined || typeof value.featured === 'boolean')
    && (value.createdAt === undefined || typeof value.createdAt === 'string')
    && (value.package === undefined || value.package === null || typeof value.package === 'string')
}

function compactProductSnapshot(product: Product): Product {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    partNumber: product.partNumber,
    category: product.category,
    categorySlug: product.categorySlug,
    manufacturer: product.manufacturer,
    price: product.price,
    priceWholesale: product.priceWholesale,
    currency: product.currency,
    inStock: product.inStock,
    stockCount: product.stockCount,
    unit: product.unit,
    minOrder: product.minOrder,
    description: '',
    specs: {},
    tags: [],
    featured: product.featured,
    createdAt: product.createdAt,
    images: product.images?.slice(0, 1),
    package: product.package,
  }
}

export function isStoredProduct(value: unknown): value is Product {
  if (!isRecord(value) || !hasValidCommercialFields(value) || !hasValidOptionalFields(value)) return false
  const requiredStrings = ['id', 'slug', 'name', 'partNumber', 'category', 'manufacturer',
    'currency', 'unit', 'description']
  return requiredStrings.every((key) => typeof value[key] === 'string')
    && isSpecs(value.specs)
    && isStringArray(value.tags)
    && (value.images === undefined || isStringArray(value.images))
}

function decodeItem(value: unknown): CartItem | null {
  if (!isRecord(value)) return null
  const product = value.snapshot ?? value.product
  if (!isStoredProduct(product) || !Number.isSafeInteger(value.quantity)) return null
  if (Number(value.quantity) <= 0 || Number(value.quantity) > MAX_CART_QUANTITY) return null
  if (typeof value.productId === 'string' && value.productId !== product.id) return null
  const safeSnapshot: Product = {
    ...product,
    // Remote images are restored from the catalog API. Do not pass a locally
    // forged host to next/image before the cart refresh has completed.
    images: product.images?.filter((source) => source.startsWith('/') && !source.startsWith('//')),
  }
  return { product: safeSnapshot, quantity: normalizeCartQuantity(Number(value.quantity), product.minOrder) }
}

function decodeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return []
  const byProduct = new Map<string, CartItem>()
  for (const rawItem of value.slice(0, MAX_CART_ITEMS)) {
    const item = decodeItem(rawItem)
    if (!item) continue
    const existing = byProduct.get(item.product.id)
    if (!existing) {
      byProduct.set(item.product.id, item)
      continue
    }
    existing.quantity = normalizeCartQuantity(
      Math.min(existing.quantity + item.quantity, MAX_CART_QUANTITY),
      existing.product.minOrder,
    )
  }
  return [...byProduct.values()]
}

export function parseCartStorage(raw: string | null): CartItem[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) return decodeItems(parsed)
    if (!isRecord(parsed) || parsed.version !== CART_STORAGE_VERSION) return []
    return decodeItems(parsed.items)
  } catch {
    return []
  }
}

export function serializeCartStorage(items: CartItem[]): string {
  if (items.length > MAX_CART_ITEMS) {
    throw new CartStorageError(`В корзине может быть не более ${MAX_CART_ITEMS} позиций`)
  }
  const stored: StoredCart = {
    version: CART_STORAGE_VERSION,
    items: items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      snapshot: compactProductSnapshot(item.product),
    })),
  }
  return JSON.stringify(stored)
}

export function readCartItems(): CartItem[] {
  if (typeof window === 'undefined') return []
  try { return parseCartStorage(window.localStorage.getItem(CART_KEY)) }
  catch { return [] }
}

export function readCartSnapshot(): { raw: string | null; items: CartItem[] } {
  if (typeof window === 'undefined') return { raw: null, items: [] }
  try {
    const raw = window.localStorage.getItem(CART_KEY)
    return { raw, items: parseCartStorage(raw) }
  } catch {
    throw new CartStorageError('Не удалось прочитать корзину из хранилища браузера')
  }
}

export function writeCartItems(items: CartItem[]): void {
  if (typeof window === 'undefined') throw new CartStorageError('Хранилище корзины недоступно')
  const serialized = serializeCartStorage(items)
  try {
    window.localStorage.setItem(CART_KEY, serialized)
    queueMicrotask(() => window.dispatchEvent(new Event(CART_UPDATED_EVENT)))
  } catch {
    throw new CartStorageError('Не удалось сохранить корзину в браузере. Освободите место и повторите действие')
  }
}

function isCartChange(value: unknown): value is CartChange {
  if (!isRecord(value)) return false
  const type = value.type
  return (type === 'price' || type === 'minimum' || type === 'removed')
    && typeof value.productId === 'string' && value.productId.length <= 128
    && typeof value.partNumber === 'string' && value.partNumber.length <= 200
    && typeof value.message === 'string' && value.message.length <= 1000
    && (value.searchHref === undefined
      || (typeof value.searchHref === 'string' && value.searchHref.startsWith('/catalog?')))
}

export function readPendingCartChanges(): CartChange[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(CART_CHANGES_KEY) ?? 'null')
    if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.changes)) return []
    return parsed.changes.filter(isCartChange).slice(0, MAX_PENDING_CHANGES)
  } catch {
    return []
  }
}

function notifyChangesUpdated() {
  queueMicrotask(() => window.dispatchEvent(new Event(CART_CHANGES_UPDATED_EVENT)))
}

export function persistPendingCartChanges(changes: CartChange[]): CartChange[] {
  const byKey = new Map(readPendingCartChanges().map((change) => (
    [`${change.type}:${change.productId}`, change]
  )))
  for (const change of changes) byKey.set(`${change.type}:${change.productId}`, change)
  const merged = [...byKey.values()].slice(-MAX_PENDING_CHANGES)
  const stored: StoredCartChanges = { version: 1, changes: merged }
  try {
    window.localStorage.setItem(CART_CHANGES_KEY, JSON.stringify(stored))
    notifyChangesUpdated()
    return merged
  } catch {
    throw new CartStorageError('Не удалось сохранить уведомление об изменениях корзины')
  }
}

export function clearPendingCartChanges(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(CART_CHANGES_KEY)
    notifyChangesUpdated()
  } catch {
    throw new CartStorageError('Не удалось подтвердить изменения корзины')
  }
}

function readFallbackLock(): StoredCartLock | null {
  try {
    const raw = window.localStorage.getItem(CART_FALLBACK_LOCK_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || typeof parsed.owner !== 'string'
      || typeof parsed.expiresAt !== 'number') return null
    return { owner: parsed.owner, expiresAt: parsed.expiresAt }
  } catch {
    throw new CartStorageError('Не удалось заблокировать корзину для безопасного обновления')
  }
}

function fallbackLockOwner(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}:${Math.random().toString(36).slice(2)}`
}

function waitForFallbackLock(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, FALLBACK_LOCK_SETTLE_MS))
}

async function acquireFallbackLock(owner: string): Promise<void> {
  const deadline = Date.now() + FALLBACK_LOCK_TIMEOUT_MS
  while (Date.now() < deadline) {
    const current = readFallbackLock()
    if (!current || current.expiresAt <= Date.now()) {
      const claim: StoredCartLock = { owner, expiresAt: Date.now() + FALLBACK_LOCK_LEASE_MS }
      try { window.localStorage.setItem(CART_FALLBACK_LOCK_KEY, JSON.stringify(claim)) }
      catch { throw new CartStorageError('Не удалось заблокировать корзину для безопасного обновления') }
      await waitForFallbackLock()
      if (readFallbackLock()?.owner === owner) return
    } else {
      await waitForFallbackLock()
    }
  }
  throw new CartStorageError('Корзина занята другой вкладкой. Повторите действие')
}

function releaseFallbackLock(owner: string): void {
  try {
    if (readFallbackLock()?.owner === owner) {
      window.localStorage.removeItem(CART_FALLBACK_LOCK_KEY)
    }
  } catch {
    // The cart write already has an explicit result; an expired lease is safe to reclaim.
  }
}

async function withFallbackCartLock<T>(operation: () => T): Promise<T> {
  const owner = fallbackLockOwner()
  await acquireFallbackLock(owner)
  try { return operation() }
  finally { releaseFallbackLock(owner) }
}

export async function withCartLock<T>(operation: () => T): Promise<T> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks
  if (locks?.request) return locks.request(CART_LOCK_NAME, () => operation())
  return withFallbackCartLock(operation)
}

export async function mutateCartItems(
  update: (items: CartItem[]) => CartItem[],
): Promise<CartItem[]> {
  return withCartLock(() => {
    for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
      const current = readCartSnapshot()
      const next = update(current.items)
      if (readCartSnapshot().raw !== current.raw) continue
      writeCartItems(next)
      return next
    }
    throw new CartStorageError('Корзина изменилась в другой вкладке. Повторите действие')
  })
}
