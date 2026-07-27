import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  buildChipDipDescription,
  detectBlock,
  isBlocked,
  isMatchingChipDipProduct,
} from './chipdip-client'

const FIXTURE_DIR = resolve(
  __dirname,
  '__fixtures__',
  'chipdip-legitimate',
)

const legitimateFixtures = [
  'arduino-captcha-shield.html',
  'module-access-control.html',
  'chipdip-page-with-recaptcha-footer.html',
  'page-with-captcha-in-meta.html',
] as const

function loadFixture(file: string): string {
  return readFileSync(resolve(FIXTURE_DIR, file), 'utf-8')
}

describe('isBlocked / detectBlock - legitimate pages', () => {
  it('returns false for legitimate chipdip pages with substring captcha/access-denied', () => {
    fc.assert(
      fc.property(fc.constantFrom(...legitimateFixtures), (file) => {
        const html = loadFixture(file)
        expect(isBlocked(200, html)).toBe(false)
      }),
      { numRuns: 50 },
    )
  })

  it('returns false for arduino-captcha-shield.html (legit product with captcha in title/h1)', () => {
    const html = loadFixture('arduino-captcha-shield.html')
    expect(isBlocked(200, html)).toBe(false)
  })

  it('returns false for module-access-control.html (legit product with "Access Denied" LED)', () => {
    const html = loadFixture('module-access-control.html')
    expect(isBlocked(200, html)).toBe(false)
  })

  it('returns false for chipdip-page-with-recaptcha-footer.html (recaptcha widget in footer)', () => {
    const html = loadFixture('chipdip-page-with-recaptcha-footer.html')
    expect(isBlocked(200, html)).toBe(false)
  })

  it('returns false for page-with-captcha-in-meta.html (captcha in meta description/keywords)', () => {
    const html = loadFixture('page-with-captcha-in-meta.html')
    expect(isBlocked(200, html)).toBe(false)
  })
})

const BLOCKED_FIXTURE_DIR = resolve(
  __dirname,
  '__fixtures__',
  'chipdip-blocked',
)

function loadBlockedFixture(file: string): string {
  return readFileSync(resolve(BLOCKED_FIXTURE_DIR, file), 'utf-8')
}

describe('isBlocked - real blocks preserved', () => {
  it('returns true for HTTP 403', () => {
    expect(isBlocked(403, '<html><body>any</body></html>')).toBe(true)
  })

  it('returns true for cloudflare challenge form', () => {
    const html = loadBlockedFixture('cf-challenge-form.html')
    expect(isBlocked(200, html)).toBe(true)
  })

  it('returns true for cf-iframe page', () => {
    const html = loadBlockedFixture('cf-iframe.html')
    expect(isBlocked(200, html)).toBe(true)
  })

  it('returns false for empty html', () => {
    expect(isBlocked(200, '')).toBe(false)
  })
})

describe('detectBlock - synthetic non-blocked HTML (post-fix PBT)', () => {
  it('returns false for synthetic non-blocked HTML with random captcha mentions', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.option(fc.constantFrom('captcha', 'access denied')),
        fc.string(),
        (lead, mention, trail) => {
          const html = `<html><body>${lead}${mention ?? ''}${trail}</body></html>`
          expect(detectBlock({ status: 200, html }).blocked).toBe(false)
        },
      ),
      { numRuns: 200 },
    )
  })
})

describe('ChipDip product identity and description', () => {
  it('accepts only the requested normalized MPN', () => {
    expect(isMatchingChipDipProduct('HMC908LC5', 'hmc908lc5')).toBe(true)
    expect(isMatchingChipDipProduct('HMC908LC5', 'AL8843SP-13')).toBe(false)
    expect(isMatchingChipDipProduct('HMC908LC5', null)).toBe(false)
  })

  it('keeps a description collected from the matching product page', () => {
    expect(
      buildChipDipDescription({
        name: 'HMC908LC5, Конвертер',
        partNumber: 'HMC908LC5',
        sku: '8043939896',
        manufacturer: 'Analog Devices',
        category: 'Конвертеры',
        categoryPath: ['Радиокомпоненты', 'Конвертеры'],
        description: 'Описание именно HMC908LC5.',
        weight: null,
        price: null,
        currency: null,
        specifications: { Корпус: 'LC5' },
        images: [],
        datasheets: [],
        analogs: [],
      }),
    ).toBe('Описание именно HMC908LC5.')
  })

  it('builds a product-specific fallback from collected fields', () => {
    const description = buildChipDipDescription({
      name: 'HMC908LC5, Конвертер',
      partNumber: 'HMC908LC5',
      sku: null,
      manufacturer: 'Analog Devices',
      category: 'Конвертеры',
      categoryPath: ['Радиокомпоненты', 'Конвертеры'],
      description: null,
      weight: null,
      price: null,
      currency: null,
      specifications: {
        Корпус: 'LC5',
        Назначение: 'ВЧ демодулятор',
      },
      images: [],
      datasheets: [],
      analogs: [],
    })

    expect(description).toContain('MPN: HMC908LC5')
    expect(description).toContain('Производитель: Analog Devices')
    expect(description).toContain('Корпус: LC5')
    expect(description).toContain('Назначение: ВЧ демодулятор')
  })
})
