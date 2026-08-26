import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { EnrichmentResult, PartIdentity } from '../types'

const db = vi.hoisted(() => {
  const tx = {
    manufacturer: {
      upsert: vi.fn().mockResolvedValue({ id: 'manufacturer-1' }),
    },
    category: {
      upsert: vi.fn().mockResolvedValue({ id: 'category-1' }),
    },
    product: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({ id: 'product-1' }),
      update: vi.fn().mockResolvedValue({ id: 'product-1' }),
    },
    specification: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    datasheet: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    productImage: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  }

  return {
    tx,
    transaction: vi.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx)),
  }
})

vi.mock('../../prisma', () => ({
  prisma: { $transaction: db.transaction },
}))

import { determineEnrichmentStatus, persistBatch } from './persistence-service'

function completeResult(descriptionLanguage: 'ru' | 'en'): EnrichmentResult {
  return {
    source: descriptionLanguage === 'ru' ? 'chipdip' : 'lcsc',
    mpn: 'STM32F469ZIT6',
    brand: 'STMicroelectronics',
    name: 'STM32F469ZIT6',
    description: 'Описание',
    descriptionLanguage,
    specs: [{ key: 'Корпус', value: 'LQFP-144' }],
  }
}

describe('determineEnrichmentStatus', () => {
  it('marks a complete Russian card as complete', () => {
    expect(determineEnrichmentStatus(completeResult('ru'))).toBe('complete')
  })

  it('keeps an English fallback card partial until localization', () => {
    expect(determineEnrichmentStatus(completeResult('en'))).toBe('partial')
  })

  it('marks a missing result as unresolved', () => {
    expect(determineEnrichmentStatus(null)).toBe('unresolved')
  })
})

describe('persistBatch media boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('queues upstream media without replacing readable asset rows', async () => {
    const identity: PartIdentity = {
      canonicalBrand: 'Analog Devices',
      canonicalMpn: 'ADAU1701JSTZ',
      originalBrand: 'Analog Devices',
      originalMpn: 'ADAU1701JSTZ',
      packages: [],
      dateCodes: [],
    }
    const result: EnrichmentResult = {
      source: 'lcsc',
      mpn: identity.canonicalMpn,
      brand: identity.canonicalBrand,
      imageUrls: ['https://assets.example.com/product.jpg'],
      datasheetUrls: ['https://assets.example.com/datasheet.pdf'],
    }

    await expect(persistBatch([{ identity, result }])).resolves.toEqual({
      persisted: 1,
      failed: 0,
      errors: [],
    })

    expect(db.tx.productImage.deleteMany).not.toHaveBeenCalled()
    expect(db.tx.productImage.createMany).not.toHaveBeenCalled()
    expect(db.tx.datasheet.deleteMany).not.toHaveBeenCalled()
    expect(db.tx.datasheet.createMany).not.toHaveBeenCalled()

    const finalMeta = db.tx.product.update.mock.calls.at(-1)?.[0].data.enrichmentMeta
    expect(finalMeta).toMatchObject({
      imageCandidates: [{
        url: 'https://assets.example.com/product.jpg',
        source: 'lcsc',
      }],
      imagePipeline: { status: 'pending', source: 'lcsc' },
      datasheetCandidates: [{
        url: 'https://assets.example.com/datasheet.pdf',
        source: 'lcsc',
        title: 'ADAU1701JSTZ Datasheet',
        language: 'en',
      }],
      datasheetPipeline: { status: 'pending', source: 'lcsc' },
    })
  })
})
