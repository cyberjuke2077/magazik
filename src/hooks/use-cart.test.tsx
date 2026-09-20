/**
 * @vitest-environment happy-dom
 */
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useCart } from './use-cart'
import {
  CART_CHANGES_KEY,
  CART_KEY,
  mutateCartItems,
  parseCartStorage,
  serializeCartStorage,
} from '@/lib/cart-storage'
import type { Product } from '@/types'

const product: Product = {
  id: 'product-1', slug: 'product-1', name: 'Product', partNumber: 'MPN-1',
  category: 'Test', manufacturer: 'Maker', price: 10, currency: 'RUB',
  inStock: true, stockCount: 5, unit: 'шт', minOrder: 2, description: '',
  specs: {}, tags: [], images: [],
}
const reactEnvironment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }

function Harness({ refreshProducts }: { refreshProducts: boolean }) {
  const { addItem, getQuantity, mounted } = useCart({ refreshProducts })
  return (
    <button onClick={() => { void addItem(product, 2) }}>
      {mounted ? getQuantity(product.id) : 'loading'}
    </button>
  )
}

function NoticeHarness() {
  const { changes, dismissChanges, isRefreshing } = useCart({ refreshProducts: true })
  return <button onClick={dismissChanges}>{isRefreshing ? 'loading' : changes.length}</button>
}

function MutationResultHarness() {
  const { addItem, getQuantity } = useCart()
  const [result, setResult] = useState('idle')
  return (
    <button onClick={() => { void addItem(product, 2).then((ok) => setResult(String(ok))) }}>
      {getQuantity(product.id)}:{result}
    </button>
  )
}

function RefreshHarness() {
  const { isRefreshing, refresh } = useCart()
  return (
    <button onClick={() => { void refresh(); void refresh() }}>
      {isRefreshing ? 'refreshing' : 'idle'}
    </button>
  )
}

beforeEach(() => {
  localStorage.clear()
  reactEnvironment.IS_REACT_ACT_ENVIRONMENT = true
  vi.stubGlobal('fetch', vi.fn(async () => new Response(
    JSON.stringify({ products: [product] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )))
})

afterEach(() => {
  reactEnvironment.IS_REACT_ACT_ENVIRONMENT = false
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

it('keeps hook order stable and synchronizes quantity after an option change', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  await act(async () => root.render(<Harness refreshProducts={false} />))
  await act(async () => root.render(<Harness refreshProducts />))
  expect(container.textContent).toBe('0')

  await act(async () => container.querySelector('button')?.click())
  await vi.waitFor(() => expect(container.textContent).toBe('2'))
  await act(async () => root.unmount())
})

it('deduplicates concurrent refresh calls and keeps the busy state until completion', async () => {
  localStorage.setItem(CART_KEY, serializeCartStorage([{ product, quantity: 2 }]))
  let resolveFetch: ((response: Response) => void) | undefined
  const pending = new Promise<Response>((resolve) => { resolveFetch = resolve })
  const fetchMock = vi.fn(() => pending)
  vi.stubGlobal('fetch', fetchMock)

  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => root.render(<RefreshHarness />))
  await act(async () => container.querySelector('button')?.click())

  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(container.textContent).toBe('refreshing')

  await act(async () => resolveFetch?.(new Response(
    JSON.stringify({ products: [product] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )))
  await vi.waitFor(() => expect(container.textContent).toBe('idle'))
  await act(async () => root.unmount())
})

it('revalidates cart snapshots changed by another browser tab', async () => {
  localStorage.setItem(CART_KEY, serializeCartStorage([{ product, quantity: 2 }]))
  const fetchMock = vi.mocked(fetch)
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  await act(async () => root.render(<Harness refreshProducts />))
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

  localStorage.setItem(CART_KEY, serializeCartStorage([{ product, quantity: 3 }]))
  await act(async () => window.dispatchEvent(new StorageEvent('storage', {
    key: CART_KEY,
    storageArea: localStorage,
  })))

  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  await act(async () => root.unmount())
})

it('keeps reconciliation changes across a reload until the buyer acknowledges them', async () => {
  const changed = { ...product, price: 20, minOrder: 5 }
  localStorage.setItem(CART_KEY, serializeCartStorage([{ product, quantity: 2 }]))
  vi.stubGlobal('fetch', vi.fn(async () => new Response(
    JSON.stringify({ products: [changed] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )))
  const container = document.createElement('div')
  document.body.append(container)

  const firstRoot = createRoot(container)
  await act(async () => firstRoot.render(<NoticeHarness />))
  await vi.waitFor(() => expect(container.textContent).toBe('2'))
  expect(localStorage.getItem(CART_CHANGES_KEY)).not.toBeNull()
  await act(async () => firstRoot.unmount())

  const secondRoot = createRoot(container)
  await act(async () => secondRoot.render(<NoticeHarness />))
  await vi.waitFor(() => expect(container.textContent).toBe('2'))
  await act(async () => container.querySelector('button')?.click())
  expect(container.textContent).toBe('0')
  expect(localStorage.getItem(CART_CHANGES_KEY)).toBeNull()
  await act(async () => secondRoot.unmount())
})

it('does not confirm a cart mutation when local storage rejects the write', async () => {
  const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
    throw new DOMException('Quota exceeded', 'QuotaExceededError')
  })
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  await act(async () => root.render(<MutationResultHarness />))
  await act(async () => container.querySelector('button')?.click())
  await vi.waitFor(() => expect(container.textContent).toBe('0:false'))
  expect(localStorage.getItem(CART_KEY)).toBeNull()
  setItem.mockRestore()
  await act(async () => root.unmount())
})

it('adds a product only once when the same control is double-clicked while storage is pending', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  await act(async () => root.render(<Harness refreshProducts={false} />))
  await act(async () => {
    container.querySelector('button')?.click()
    container.querySelector('button')?.click()
  })

  await vi.waitFor(() => expect(container.textContent).toBe('2'))
  expect(parseCartStorage(localStorage.getItem(CART_KEY))[0]?.quantity).toBe(2)
  await act(async () => root.unmount())
})

it('uses the browser lock to serialize mutations from cooperating tabs', async () => {
  let queue: Promise<unknown> = Promise.resolve()
  const request = vi.fn((_name: string, operation: () => unknown) => {
    const result = queue.then(operation)
    queue = result.then(() => undefined, () => undefined)
    return result
  })
  vi.stubGlobal('navigator', { locks: { request } })
  const second = { ...product, id: 'product-2', slug: 'product-2' }

  await Promise.all([
    mutateCartItems((items) => [...items, { product, quantity: 2 }]),
    mutateCartItems((items) => [...items, { product: second, quantity: 2 }]),
  ])

  expect(request).toHaveBeenCalledTimes(2)
  expect(parseCartStorage(localStorage.getItem(CART_KEY)).map((item) => item.product.id))
    .toEqual(['product-1', 'product-2'])
})

it('serializes mutations with the storage lease when browser locks are unavailable', async () => {
  vi.stubGlobal('navigator', {})
  const second = { ...product, id: 'product-2', slug: 'product-2' }

  await Promise.all([
    mutateCartItems((items) => [...items, { product, quantity: 2 }]),
    mutateCartItems((items) => [...items, { product: second, quantity: 2 }]),
  ])

  expect(parseCartStorage(localStorage.getItem(CART_KEY)).map((item) => item.product.id))
    .toEqual(['product-1', 'product-2'])
})
