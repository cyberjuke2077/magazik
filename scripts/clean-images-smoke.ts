/**
 * Background-removal smoke test on 5 sample images from R2.
 *
 * For each image:
 *   1. Download from R2
 *   2. Run @imgly/background-removal-node (medium model) → PNG with alpha
 *   3. sharp trim + composite onto white + resize 600x600 → WebP
 *   4. Save before/after pairs to .tmp/clean-images-smoke/ for visual review
 *
 * No DB writes, no R2 uploads — purely a quality check before committing
 * to a full batch.
 */
import './_load-env'

import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { removeBackground, type Config } from '@imgly/background-removal-node'
import sharp from 'sharp'

import { prisma } from '../src/lib/prisma'

const OUTPUT_DIR = '.tmp/clean-images-smoke'
const SAMPLE_LIMIT = 5

const IMGLY_CONFIG: Config = {
  model: 'medium',
  output: { format: 'image/png', quality: 1.0 },
}

interface SampleImage {
  id: string
  partNumber: string
  imageUrl: string
}

async function fetchSamples(): Promise<SampleImage[]> {
  const rows = await prisma.productImage.findMany({
    where: { imageUrl: { startsWith: 'https://pub-' } },
    take: SAMPLE_LIMIT,
    select: {
      id: true,
      imageUrl: true,
      product: { select: { partNumber: true } },
    },
  })
  return rows.map((r) => ({
    id: r.id,
    partNumber: r.product?.partNumber ?? 'unknown',
    imageUrl: r.imageUrl,
  }))
}

async function downloadImage(url: string): Promise<Buffer> {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`fetch ${url} → HTTP ${resp.status}`)
  return Buffer.from(await resp.arrayBuffer())
}

async function process(sample: SampleImage): Promise<void> {
  const safeName = sample.partNumber.replace(/[^a-zA-Z0-9_-]/g, '_')
  const beforePath = join(OUTPUT_DIR, `${safeName}_before.webp`)
  const afterPath = join(OUTPUT_DIR, `${safeName}_after.webp`)
  const maskPath = join(OUTPUT_DIR, `${safeName}_mask.png`)
  const cropPath = join(OUTPUT_DIR, `${safeName}_cropped.webp`)

  console.log(`\n[${sample.partNumber}]`)
  console.log(`  downloading ${sample.imageUrl}`)
  const inputBuffer = await downloadImage(sample.imageUrl)
  console.log(`  input bytes: ${(inputBuffer.length / 1024).toFixed(1)} KB`)

  // Save unchanged input for visual diff
  await sharp(inputBuffer).webp({ quality: 80 }).toFile(beforePath)

  // LCSC always shoots components against a blue grid with a metric ruler
  // either at the bottom or wrapping along one edge. Crop a centered square
  // covering ~75% of the smaller dimension before running bg removal — this
  // strips the ruler/scale text out of the model's view so it can't get
  // attached to the foreground mask. The fitness function: keep the chip
  // visible (chips fill ~25-40% of the LCSC frame, always centered).
  const meta = await sharp(inputBuffer).metadata()
  const w = meta.width ?? 0
  const h = meta.height ?? 0
  const cropSize = Math.floor(Math.min(w, h) * 0.78)
  const left = Math.floor((w - cropSize) / 2)
  const top = Math.floor((h - cropSize) / 2)
  const croppedPng = await sharp(inputBuffer)
    .extract({ left, top, width: cropSize, height: cropSize })
    .png()
    .toBuffer()
  await sharp(croppedPng).webp({ quality: 80 }).toFile(cropPath)
  console.log(`  cropped: ${w}x${h} → ${cropSize}x${cropSize} center`)

  console.log('  running background removal…')
  const startMs = Date.now()
  // imgly's Node.js entry expects Blob/ArrayBuffer/URL — a raw Buffer with
  // WebP bytes triggers "Unsupported format". Wrap PNG bytes in a Blob with
  // explicit type so the format sniffer is happy.
  const pngBlob = new Blob([new Uint8Array(croppedPng)], { type: 'image/png' })
  const bgRemovedBlob = await removeBackground(pngBlob, IMGLY_CONFIG)
  const bgRemovedBuffer = Buffer.from(await bgRemovedBlob.arrayBuffer())
  const elapsedSec = ((Date.now() - startMs) / 1000).toFixed(1)
  console.log(`  bg removal: ${elapsedSec}s, ${(bgRemovedBuffer.length / 1024).toFixed(1)} KB PNG`)

  // Save the alpha mask so we can see what got cut
  await sharp(bgRemovedBuffer).toFile(maskPath)

  // Trim transparent borders, then center on a 600x600 white canvas as WebP.
  const finalBuffer = await sharp(bgRemovedBuffer)
    .trim({ threshold: 10 })
    .resize(600, 600, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .webp({ quality: 85 })
    .toBuffer()

  await writeFile(afterPath, finalBuffer)
  console.log(`  final: ${(finalBuffer.length / 1024).toFixed(1)} KB WebP → ${afterPath}`)
}

async function main(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true })
  console.log(`output dir: ${OUTPUT_DIR}`)
  console.log(`model: ${IMGLY_CONFIG.model}\n`)

  const samples = await fetchSamples()
  console.log(`Processing ${samples.length} samples`)

  const totalStart = Date.now()
  for (const s of samples) {
    try {
      await process(s)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`  FAIL: ${msg}`)
    }
  }
  console.log(`\nDone in ${((Date.now() - totalStart) / 1000).toFixed(1)}s total`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
