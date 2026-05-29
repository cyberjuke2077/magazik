import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { classifyImage, computeFeatures, contentHash } from './image-classifier'

const FIXTURE_DIR = resolve(__dirname, '__fixtures__')
const fixture = (name: string): Buffer => readFileSync(resolve(FIXTURE_DIR, name))

/** Синтетика: сплошное белое поле с тёмным прямоугольником по центру. */
async function syntheticCleanChip(): Promise<Buffer> {
  return sharp({
    create: { width: 200, height: 200, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([
      {
        input: {
          create: { width: 90, height: 60, channels: 3, background: { r: 30, g: 30, b: 30 } },
        },
        top: 70,
        left: 55,
      },
    ])
    .webp()
    .toBuffer()
}

/** Синтетика: чип на сплошном синем «ruler»-фоне (как LCSC watermark). */
async function syntheticWatermark(): Promise<Buffer> {
  return sharp({
    create: { width: 200, height: 200, channels: 3, background: { r: 150, g: 180, b: 230 } },
  })
    .webp()
    .toBuffer()
}

describe('image-classifier', () => {
  describe('synthetic', () => {
    it('classifies a chip on white as clean', async () => {
      const res = await classifyImage(await syntheticCleanChip())
      expect(res.verdict).toBe('clean')
      expect(res.features.edgeBlue).toBeLessThan(0.04)
    })

    it('classifies a blue-background image as watermark', async () => {
      const res = await classifyImage(await syntheticWatermark())
      expect(res.verdict).toBe('watermark')
      expect(res.features.edgeBlue).toBeGreaterThan(0.04)
    })
  })

  describe('real fixtures', () => {
    it('passes genuine clean photos', async () => {
      expect((await classifyImage(fixture('clean-1.webp'))).verdict).toBe('clean')
      expect((await classifyImage(fixture('clean-2.webp'))).verdict).toBe('clean')
    })

    it('rejects watermarked photos', async () => {
      expect((await classifyImage(fixture('watermark-1.webp'))).verdict).toBe('watermark')
      expect((await classifyImage(fixture('watermark-2.webp'))).verdict).toBe('watermark')
    })

    it('rejects the LCSC no-image box (junk)', async () => {
      // junk-коробка по метрикам синевы попадает в watermark — и отбрасывается.
      expect((await classifyImage(fixture('junk-box.webp'))).verdict).toBe('watermark')
    })
  })

  describe('contentHash', () => {
    it('is stable and content-addressed', () => {
      const a = fixture('junk-box.webp')
      expect(contentHash(a)).toBe(contentHash(Buffer.from(a)))
      expect(contentHash(a)).not.toBe(contentHash(fixture('clean-1.webp')))
    })
  })

  describe('computeFeatures', () => {
    it('returns ratios in [0,1]', async () => {
      const f = await computeFeatures(await syntheticCleanChip())
      for (const v of [f.blueWm, f.white, f.dark, f.edgeBlue]) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    })
  })
})
