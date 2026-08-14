/**
 * Cloudflare R2 client for product image storage.
 *
 * R2 is S3-compatible — we use @aws-sdk/client-s3 with a custom endpoint.
 * Images are downloaded once at enrichment time, transcoded to WebP via
 * sharp, and uploaded to R2. The public URL stored in ProductImage.imageUrl
 * points at the R2.dev subdomain (or a custom domain if configured).
 *
 * Why R2: $0 egress (forever), 10 GB free storage, S3 API. For 100k SKUs ×
 * 3-4 images at WebP q=80 600px ≈ 6 GB — fits in free tier.
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import crypto from 'node:crypto'

const ENDPOINT = process.env.R2_ENDPOINT
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const BUCKET = process.env.R2_BUCKET
const PUBLIC_URL = process.env.R2_PUBLIC_URL

let cachedClient: S3Client | null = null

/**
 * True when storage credentials are present. Public URL is a separate
 * concern — see isR2PublicUrlConfigured(). Callers writing to storage
 * only need this; readers building <img src=…> need the public URL too.
 */
export function isR2Configured(): boolean {
  return Boolean(ENDPOINT && ACCESS_KEY_ID && SECRET_ACCESS_KEY && BUCKET)
}

/**
 * True when a public URL base is set. Without it, uploaded objects can
 * still be written, but their imageUrl in the DB is a placeholder
 * (`r2://<bucket>/<key>`) until the operator enables Public Development
 * URL or attaches a custom domain and reruns the rewrite step.
 */
export function isR2PublicUrlConfigured(): boolean {
  return Boolean(PUBLIC_URL)
}

export function requireR2PublicUrl(): string {
  if (!PUBLIC_URL) {
    throw new Error('R2 public URL is not configured. Set R2_PUBLIC_URL.')
  }
  return PUBLIC_URL.replace(/\/+$/, '')
}

function requireConfig(): {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
} {
  if (!isR2Configured()) {
    throw new Error(
      'R2 not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.',
    )
  }
  return {
    endpoint: ENDPOINT!,
    accessKeyId: ACCESS_KEY_ID!,
    secretAccessKey: SECRET_ACCESS_KEY!,
    bucket: BUCKET!,
  }
}

function client(): S3Client {
  if (cachedClient) return cachedClient
  const { endpoint, accessKeyId, secretAccessKey } = requireConfig()
  cachedClient = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })
  return cachedClient
}

/**
 * Stable storage key for an upstream image URL. Uses the SHA-1 of the
 * source URL plus a size suffix so the same source maps to the same key
 * (idempotent uploads, free deduplication).
 */
export function storageKey(sourceUrl: string, variant: 'main' | 'thumb' = 'main'): string {
  const hash = crypto.createHash('sha1').update(sourceUrl).digest('hex')
  return `products/${hash.slice(0, 2)}/${hash}-${variant}.webp`
}

/**
 * Public URL for a stored object. Falls back to a `r2://` placeholder
 * when no public base is configured — operator must run a rewrite pass
 * after enabling Public Development URL or attaching a custom domain.
 */
export function publicUrl(key: string): string {
  const { bucket } = requireConfig()
  if (!PUBLIC_URL) return `r2://${bucket}/${key}`
  return `${PUBLIC_URL.replace(/\/+$/, '')}/${key}`
}

export interface UploadedImage {
  key: string
  url: string
  bytes: number
  variant: 'main' | 'thumb'
  alreadyExisted: boolean
}

export interface UploadedObject {
  key: string
  url: string
  bytes: number
  alreadyExisted: boolean
}

/**
 * Check whether an object already exists. R2 returns 404 → throws
 * NoSuchKey / NotFound; we map that to false. Anything else propagates.
 */
async function objectExists(bucket: string, key: string): Promise<boolean> {
  try {
    await client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch (err: unknown) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode
    if (status === 404) return false
    const name = (err as { name?: string })?.name
    if (name === 'NotFound' || name === 'NoSuchKey') return false
    throw err
  }
}

export async function uploadObjectBuffer(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<UploadedObject> {
  const { bucket } = requireConfig()
  if (await objectExists(bucket, key)) {
    return { key, url: publicUrl(key), bytes: body.length, alreadyExisted: true }
  }

  await client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }))
  return { key, url: publicUrl(key), bytes: body.length, alreadyExisted: false }
}

interface FetchOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

const MAX_BYTES = 8 * 1024 * 1024
const DEFAULT_TIMEOUT_MS = 20_000

/**
 * Fetch an upstream image into a Buffer. Caps payload size and time
 * so a hostile or hung CDN can't wedge the enrichment pipeline.
 */
async function fetchImageBytes(sourceUrl: string, opts: FetchOptions = {}): Promise<Buffer> {
  const ac = new AbortController()
  const timeout = setTimeout(() => ac.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  if (opts.signal) opts.signal.addEventListener('abort', () => ac.abort(), { once: true })
  try {
    const resp = await fetch(sourceUrl, {
      signal: ac.signal,
      headers: { 'User-Agent': 'electromagaz-enrichment/1.0' },
    })
    if (!resp.ok) throw new Error(`fetch ${sourceUrl} → HTTP ${resp.status}`)
    const ab = await resp.arrayBuffer()
    if (ab.byteLength > MAX_BYTES) {
      throw new Error(`image too large: ${ab.byteLength} > ${MAX_BYTES}`)
    }
    return Buffer.from(ab)
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Public wrapper over the internal fetch — lets callers (the enrichment
 * pipeline) download an image once, inspect/classify it, and then hand
 * the same bytes to {@link uploadImageBuffer} without a second fetch.
 */
export async function downloadImageBytes(
  sourceUrl: string,
  opts: { signal?: AbortSignal } = {},
): Promise<Buffer> {
  return fetchImageBytes(sourceUrl, opts)
}

interface TranscodeOptions {
  width?: number
  quality?: number
}

async function transcodeToWebp(input: Buffer, opts: TranscodeOptions = {}): Promise<Buffer> {
  const width = opts.width ?? 600
  const quality = opts.quality ?? 80
  return sharp(input)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer()
}

/**
 * Pull a remote image, transcode to WebP, upload to R2 if it isn't
 * already there, and return the public URL. Idempotent: rerunning on
 * the same source URL is a no-op besides a HEAD request.
 */
export async function uploadProductImage(
  sourceUrl: string,
  opts: { variant?: 'main' | 'thumb'; signal?: AbortSignal } = {},
): Promise<UploadedImage> {
  const { bucket } = requireConfig()
  const variant = opts.variant ?? 'main'
  const key = storageKey(sourceUrl, variant)

  if (await objectExists(bucket, key)) {
    return { key, url: publicUrl(key), bytes: 0, variant, alreadyExisted: true }
  }

  const raw = await fetchImageBytes(sourceUrl, { signal: opts.signal })
  return uploadImageBuffer(sourceUrl, raw, { variant })
}

/**
 * Upload already-downloaded image bytes under the stable key derived
 * from `sourceUrl`. Lets the pipeline fetch+classify once, then store
 * the same buffer without re-fetching. Same idempotency guarantee as
 * {@link uploadProductImage} — a HEAD check skips redundant puts.
 */
export async function uploadImageBuffer(
  sourceUrl: string,
  raw: Buffer,
  opts: { variant?: 'main' | 'thumb' } = {},
): Promise<UploadedImage> {
  const { bucket } = requireConfig()
  const variant = opts.variant ?? 'main'
  const key = storageKey(sourceUrl, variant)

  if (await objectExists(bucket, key)) {
    return { key, url: publicUrl(key), bytes: 0, variant, alreadyExisted: true }
  }

  const width = variant === 'thumb' ? 200 : 600
  const webp = await transcodeToWebp(raw, { width })

  await client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: webp,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )

  return { key, url: publicUrl(key), bytes: webp.length, variant, alreadyExisted: false }
}
