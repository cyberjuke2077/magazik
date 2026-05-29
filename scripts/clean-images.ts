/**
 * Cleans LCSC-watermarked product images: removes the blue ruler/grid
 * background, drops the LCSC branding, and re-uploads to R2 on a new
 * key. The DB row's imageUrl is then flipped to the cleaned variant.
 *
 * Pipeline per image:
 *   1. Download the current ProductImage URL from R2
 *   2. Center-crop to 78% of the smaller dimension (strips the ruler
 *      and "LCSC" text that sit on the frame edges, keeps the chip)
 *   3. PNG-encode + wrap in a Blob — imgly's format sniffer rejects
 *      raw Buffer/WebP input
 *   4. @imgly/background-removal-node 'medium' model → PNG with alpha
 *   5. sharp: trim transparency → resize 600×600 contain on white →
 *      flatten any residual alpha → WebP q=85
 *   6. Upload to R2 under products/<2>/<sha1>-clean.webp (deterministic)
 *   7. Update ProductImage.imageUrl to the new public URL
 *
 * Resume semantics: an image whose URL already ends in `-clean.webp`
 * is skipped, so re-running the script after a crash is free. Source
 * objects are left in R2 (not deleted) — if the cleaned output ever
 * looks wrong we can roll back by reverting the URL.
 *
 * Usage:
 *   pnpm tsx scripts/clean-images.ts [--limit N] [--dry-run]
 */
import './_load-env'

import crypto from 'node:crypto'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { removeBackground, type Config } from '@imgly/background-removal-node'
import sharp from 'sharp'

import { prisma } from '../src/lib/prisma'

const ENDPOINT = process.env.R2_ENDPOINT!
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const BUCKET = process.env.R2_BUCKET!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!.replace(/\/+$/, '')

const IMGLY_CONFIG: Config = {
  model: 'medium',
  output: { format: 'image/png', quality: 1.0 },
}

const CROP_RATIO = 0.78
const FINAL_SIZE = 600
const WEBP_QUALITY = 85

function parseArgs(): { limit: number | null; dryRun: boolean } {
  const args = process.argv.slice(2)
  let limit: number | null = null
  let dryRun = false
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = Number.parseInt(args[++i]!, 10)
    } else if (args[i] === '--dry-run') {
      dryRun = true
    }
  }
  return { limit, dryRun }
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
})

function cleanedKey(originalUrl: string): string {
  const hash = crypto.createHash('sha1').update(originalUrl).digest('hex')
  return `products/${hash.slice(0, 2)}/${hash}-clean.webp`
}

async function downloadImage(url: string): Promise<Buffer> {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`fetch ${url} → HTTP ${resp.status}`)
  return Buffer.from(await resp.arrayBuffer())
}

async function cleanImage(inputBuffer: Buffer): Promise<Buffer> {
  const meta = await sharp(inputBuffer).metadata()
  const w = meta.width ?? 0
  const h = meta.height ?? 0
  if (!w || !h) throw new Error('image has no dimensions')

  const cropSize = Math.floor(Math.min(w, h) * CROP_RATIO)
  const left = Math.floor((w - cropSize) / 2)
  const top = Math.floor((h - cropSize) / 2)
  const croppedPng = await sharp(inputBuffer)
    .extract({ left, top, width: cropSize, height: cropSize })
    .png()
    .toBuffer()

  // imgly's Node entry rejects raw Buffer + WebP — wrap in a typed Blob
  const pngBlob = new Blob([new Uint8Array(croppedPng)], { type: 'image/png' })
  const bgRemovedBlob = await removeBackground(pngBlob, IMGLY_CONFIG)
  const bgRemovedBuffer = Buffer.from(await bgRemovedBlob.arrayBuffer())

  return await sharp(bgRemovedBuffer)
    .trim({ threshold: 10 })
    .resize(FINAL_SIZE, FINAL_SIZE, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}

async function uploadCleaned(key: string, body: Buffer): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
}

async function main(): Promise<void> {
  const { limit, dryRun } = parseArgs()

  // Skip already-cleaned rows so re-running is free
  const candidates = await prisma.productImage.findMany({
    where: {
      imageUrl: { startsWith: 'https://pub-' },
      NOT: { imageUrl: { endsWith: '-clean.webp' } },
    },
    select: { id: true, imageUrl: true },
    ...(limit !== null && { take: limit }),
  })

  console.log(`Found ${candidates.length} images to clean`)
  if (dryRun) console.log('DRY RUN — no R2 uploads, no DB updates')
  console.log()

  let ok = 0
  let failed = 0
  let skipped = 0
  const startMs = Date.now()

  for (let i = 0; i < candidates.length; i++) {
    const row = candidates[i]!
    const prefix = `[${i + 1}/${candidates.length}]`
    try {
      const newKey = cleanedKey(row.imageUrl)
      const newUrl = `${PUBLIC_URL}/${newKey}`

      if (row.imageUrl === newUrl) {
        skipped++
        continue
      }

      const input = await downloadImage(row.imageUrl)
      const cleaned = await cleanImage(input)

      if (!dryRun) {
        await uploadCleaned(newKey, cleaned)
        await prisma.productImage.update({
          where: { id: row.id },
          data: { imageUrl: newUrl },
        })
      }

      ok++
      const sizeKb = (cleaned.length / 1024).toFixed(1)
      console.log(`${prefix} OK  ${sizeKb}KB  ${newUrl}`)
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`${prefix} FAIL  ${row.imageUrl} — ${msg}`)
    }
  }

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1)
  console.log()
  console.log('Summary')
  console.log(`  cleaned: ${ok}`)
  console.log(`  skipped: ${skipped}`)
  console.log(`  failed:  ${failed}`)
  console.log(`  elapsed: ${elapsed}s`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
