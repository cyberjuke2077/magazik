/**
 * @vitest-environment happy-dom
 */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { parseCartStorage, CART_KEY } from '@/lib/cart-storage'
import type { Product } from '@/types'
import { AddToCartBtn } from './add-to-cart-btn'
import { BulkSelectCheckbox, BulkSelectWrapper } from './bulk-select-panel'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/lib/fly-to-cart', () => ({ flyToCart: vi.fn() }))

const product: Product = {
  id: 'product-1', slug: 'product-1', name: 'Product', partNumber: 'MPN-1',
  category: 'Test', manufacturer: 'Maker', price: 10, currency: 'RUB',
  inStock: true, stockCount: 5, unit: 'шт', minOrder: 2, description: '',
  specs: {}, tags: [], images: [],
}
const reactEnvironment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }

beforeEach(() => {
  localStorage.clear()
  reactEnvironment.IS_REACT_ACT_ENVIRONMENT = true
  vi.stubGlobal('navigator', {
    locks: { request: (_name: string, operation: () => unknown) => Promise.resolve().then(operation) },
  })
})

afterEach(() => {
  reactEnvironment.IS_REACT_ACT_ENVIRONMENT = false
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

it('adds a catalog row only once on a double click while storage is pending', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => root.render(
    <BulkSelectWrapper products={[product]}>
      <AddToCartBtn product={product} />
    </BulkSelectWrapper>,
  ))

  const add = container.querySelector<HTMLButtonElement>('[aria-label="Добавить в корзину"]')
  await act(async () => { add?.click(); add?.click() })

  await vi.waitFor(() => expect(parseCartStorage(localStorage.getItem(CART_KEY))[0]?.quantity).toBe(2))
  await act(async () => root.unmount())
})

it('runs a bulk add only once on a double click', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => root.render(
    <BulkSelectWrapper products={[product]}>
      <BulkSelectCheckbox productId={product.id} />
    </BulkSelectWrapper>,
  ))
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Выбрать товар"]')?.click())
  const add = [...container.querySelectorAll<HTMLButtonElement>('button')]
    .find((button) => button.textContent?.includes('Добавить в корзину'))

  await act(async () => { add?.click(); add?.click() })

  await vi.waitFor(() => expect(parseCartStorage(localStorage.getItem(CART_KEY))[0]?.quantity).toBe(2))
  await act(async () => root.unmount())
})
