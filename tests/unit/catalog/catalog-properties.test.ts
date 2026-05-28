/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'

import { formatPrice, parseCatalogParams } from '@/lib/catalog-utils'
import {
  addToRequestList,
  getRequestList,
  clearRequestList,
  updateRequestListQuantity,
} from '@/lib/request-list-store'
import { validateQuoteInput, isValidQuoteStatus, VALID_STATUSES } from '@/lib/validate-quote-input'

/**
 * Property 1: Форматирование цены
 * Validates: Requirements 1.2, 1.3
 */
describe('Property 1: formatPrice', () => {
  it('for any price > 0, result contains "₽" and is a non-empty string', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1_000_000_000, noNaN: true }),
        (price) => {
          const result = formatPrice(price)
          expect(result).toContain('₽')
          expect(result.length).toBeGreaterThan(0)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('for null price, result is "Цена по запросу"', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        (price) => {
          const result = formatPrice(price)
          expect(result).toBe('Цена по запросу')
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Property 2: Корректность пагинации (offset и clamping)
 * Validates: Requirements 2.3, 2.5, 2.6
 */
describe('Property 2: parseCatalogParams pagination clamping', () => {
  it('for any page >= 1, limit >= 1, total >= 0: page is clamped correctly and limit is bounded', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 0, max: 100000 }),
        (page, limit, total) => {
          const params = parseCatalogParams(
            { page: String(page), limit: String(limit) },
            total,
          )

          // limit is clamped to [1, 100]
          expect(params.limit).toBeGreaterThanOrEqual(1)
          expect(params.limit).toBeLessThanOrEqual(100)

          // page >= 1
          expect(params.page).toBeGreaterThanOrEqual(1)

          // page <= totalPages (or 1 if total=0)
          const totalPages = total === 0 ? 1 : Math.ceil(total / params.limit)
          expect(params.page).toBeLessThanOrEqual(totalPages)
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Property 7: Round-trip URL-параметров каталога
 * Validates: Requirements 8.1, 8.3
 */
describe('Property 7: URL params round-trip', () => {
  it('serialize to searchParams → parse with parseCatalogParams → values match', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0), { nil: undefined }),
        fc.option(fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0), { nil: undefined }),
        fc.option(fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0), { nil: undefined }),
        (page, limit, q, category, manufacturer) => {
          // Use a large total so page is never clamped
          const total = 1_000_000

          const searchParams: Record<string, string | undefined> = {
            page: String(page),
            limit: String(limit),
            q,
            category,
            manufacturer,
          }

          const parsed = parseCatalogParams(searchParams, total)

          // page should match (limit clamped to max 100, so page stays valid with large total)
          expect(parsed.page).toBe(page)

          // limit clamped to [1, 100]
          const expectedLimit = Math.min(Math.max(limit, 1), 100)
          expect(parsed.limit).toBe(expectedLimit)

          // query round-trips (trimmed)
          if (q) {
            expect(parsed.query).toBe(q.trim())
          } else {
            expect(parsed.query).toBeNull()
          }

          // category round-trips (trimmed)
          if (category) {
            expect(parsed.categorySlug).toBe(category.trim())
          } else {
            expect(parsed.categorySlug).toBeNull()
          }

          // manufacturer round-trips (trimmed)
          if (manufacturer) {
            expect(parsed.manufacturerSlug).toBe(manufacturer.trim())
          } else {
            expect(parsed.manufacturerSlug).toBeNull()
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

/**
 * Property 4: Round-trip списка запроса
 * Validates: Requirements 5.2, 5.5
 */
describe('Property 4: RequestList round-trip', () => {
  beforeEach(() => {
    clearRequestList()
  })

  it('for any array of items: add all → getRequestList returns all with correct fields', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            productId: fc.uuid(),
            partNumber: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            manufacturer: fc.string({ minLength: 1, maxLength: 30 }),
            minOrder: fc.integer({ min: 1, max: 100 }),
            price: fc.option(fc.double({ min: 0.01, max: 100000, noNaN: true }), { nil: null }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (items) => {
          clearRequestList()

          // Add items with unique productIds
          const uniqueItems = items.filter(
            (item, idx, arr) => arr.findIndex((i) => i.productId === item.productId) === idx,
          )

          for (const item of uniqueItems) {
            addToRequestList({
              productId: item.productId,
              partNumber: item.partNumber,
              name: item.name,
              manufacturer: item.manufacturer,
              minOrder: item.minOrder,
              price: item.price,
              quantity: item.minOrder,
            })
          }

          const stored = getRequestList()
          expect(stored.length).toBe(uniqueItems.length)

          for (const original of uniqueItems) {
            const found = stored.find((s) => s.productId === original.productId)
            expect(found).toBeDefined()
            expect(found!.partNumber).toBe(original.partNumber)
            expect(found!.name).toBe(original.name)
            expect(found!.manufacturer).toBe(original.manufacturer)
            expect(found!.minOrder).toBe(original.minOrder)
            expect(found!.price).toBe(original.price)
            // quantity >= minOrder (invariant enforced by store)
            expect(found!.quantity).toBeGreaterThanOrEqual(original.minOrder)
          }
        },
      ),
      { numRuns: 50 },
    )
  })
})

/**
 * Property 5: Инвариант минимального заказа
 * Validates: Requirements 5.4
 */
describe('Property 5: minOrder invariant', () => {
  beforeEach(() => {
    clearRequestList()
  })

  it('for any item with minOrder M and any quantity Q < M, stored quantity is >= M', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.uuid(),
        (minOrder, quantity, productId) => {
          clearRequestList()

          // Add item first
          addToRequestList({
            productId,
            partNumber: 'TEST-001',
            name: 'Test Product',
            manufacturer: 'TestCorp',
            minOrder,
            price: 100,
            quantity: minOrder,
          })

          // Try to update with arbitrary quantity (could be less than minOrder)
          updateRequestListQuantity(productId, quantity)

          const stored = getRequestList()
          const item = stored.find((i) => i.productId === productId)
          expect(item).toBeDefined()
          expect(item!.quantity).toBeGreaterThanOrEqual(minOrder)
        },
      ),
      { numRuns: 50 },
    )
  })
})

/**
 * Property 6: Валидация QuoteRequest
 * Validates: Requirements 6.3, 7.2
 */
describe('Property 6: QuoteRequest validation', () => {
  it('input with empty required fields returns invalid', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Empty companyName
          fc.record({
            companyName: fc.constant(''),
            contactPerson: fc.string({ minLength: 1, maxLength: 30 }),
            phone: fc.string({ minLength: 1, maxLength: 15 }),
            email: fc.string({ minLength: 1, maxLength: 30 }),
            items: fc.array(
              fc.record({
                productId: fc.uuid(),
                partNumber: fc.string({ minLength: 1, maxLength: 20 }),
                name: fc.string({ minLength: 1, maxLength: 30 }),
                quantity: fc.integer({ min: 1, max: 100 }),
              }),
              { minLength: 1, maxLength: 3 },
            ),
          }),
          // Empty contactPerson
          fc.record({
            companyName: fc.string({ minLength: 1, maxLength: 30 }),
            contactPerson: fc.constant(''),
            phone: fc.string({ minLength: 1, maxLength: 15 }),
            email: fc.string({ minLength: 1, maxLength: 30 }),
            items: fc.array(
              fc.record({
                productId: fc.uuid(),
                partNumber: fc.string({ minLength: 1, maxLength: 20 }),
                name: fc.string({ minLength: 1, maxLength: 30 }),
                quantity: fc.integer({ min: 1, max: 100 }),
              }),
              { minLength: 1, maxLength: 3 },
            ),
          }),
          // Empty phone
          fc.record({
            companyName: fc.string({ minLength: 1, maxLength: 30 }),
            contactPerson: fc.string({ minLength: 1, maxLength: 30 }),
            phone: fc.constant(''),
            email: fc.string({ minLength: 1, maxLength: 30 }),
            items: fc.array(
              fc.record({
                productId: fc.uuid(),
                partNumber: fc.string({ minLength: 1, maxLength: 20 }),
                name: fc.string({ minLength: 1, maxLength: 30 }),
                quantity: fc.integer({ min: 1, max: 100 }),
              }),
              { minLength: 1, maxLength: 3 },
            ),
          }),
          // Empty email
          fc.record({
            companyName: fc.string({ minLength: 1, maxLength: 30 }),
            contactPerson: fc.string({ minLength: 1, maxLength: 30 }),
            phone: fc.string({ minLength: 1, maxLength: 15 }),
            email: fc.constant(''),
            items: fc.array(
              fc.record({
                productId: fc.uuid(),
                partNumber: fc.string({ minLength: 1, maxLength: 20 }),
                name: fc.string({ minLength: 1, maxLength: 30 }),
                quantity: fc.integer({ min: 1, max: 100 }),
              }),
              { minLength: 1, maxLength: 3 },
            ),
          }),
          // Empty items
          fc.record({
            companyName: fc.string({ minLength: 1, maxLength: 30 }),
            contactPerson: fc.string({ minLength: 1, maxLength: 30 }),
            phone: fc.string({ minLength: 1, maxLength: 15 }),
            email: fc.string({ minLength: 1, maxLength: 30 }),
            items: fc.constant([] as Array<{ productId: string; partNumber: string; name: string; quantity: number }>),
          }),
        ),
        (input) => {
          const result = validateQuoteInput(input)
          expect(result.valid).toBe(false)
          expect(result.error).toBeDefined()
        },
      ),
      { numRuns: 50 },
    )
  })

  it('all valid statuses are recognized', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_STATUSES),
        (status) => {
          expect(isValidQuoteStatus(status)).toBe(true)
        },
      ),
      { numRuns: 50 },
    )
  })

  it('random strings that are not valid statuses are rejected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(
          (s) => !['new', 'in_progress', 'quoted', 'rejected'].includes(s),
        ),
        (status) => {
          expect(isValidQuoteStatus(status)).toBe(false)
        },
      ),
      { numRuns: 50 },
    )
  })
})
