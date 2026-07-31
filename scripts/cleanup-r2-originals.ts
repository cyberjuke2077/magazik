/**
 * Removes orphaned `-main.webp` (LCSC-watermarked source) objects from R2
 * once `clean-images.ts` has flipped every ProductImage row to a `-clean.webp`
 * variant. Lists all objects, computes which keys are no longer referenced
 * by the DB, and deletes them in batches.
 *
 * Safe to re-run: any -main.webp still pointed at by a row is preserved.
 *
 * Run AFTER `npm exec tsx -- scripts/clean-images.ts` finishes successfully on
 * the entire dataset.
 *
 * Usage:
 *   npm exec tsx -- scripts/cleanup-r2-originals.ts [--dry-run]
 */
import './_load-env'

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3'

import { prisma } from '../src/lib/prisma'

const ENDPOINT = process.env.R2_ENDPOINT!
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const BUCKET = process.env.R2_BUCKET!
const PUBLIC_URL = process.env.R2_PUBLIC_URL!.replace(/\/+$/, '')

const dryRun = process.argv.includes('--dry-run')

const s3 = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
})

async function listAllKeys(): Promise<string[]> {
  const keys: string[] = []
  let token: string | undefined
  do {
    const resp = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: 'products/',
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    )
    for (const obj of resp.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key)
    }
    token = resp.NextContinuationToken
  } while (token)
  return keys
}

async function loadReferencedKeys(): Promise<Set<string>> {
  const rows = await prisma.productImage.findMany({
    where: { imageUrl: { startsWith: PUBLIC_URL } },
    select: { imageUrl: true },
  })
  const set = new Set<string>()
  for (const r of rows) {
    const key = r.imageUrl.slice(PUBLIC_URL.length + 1)
    if (key) set.add(key)
  }
  return set
}

async function deleteBatch(keys: string[]): Promise<number> {
  if (!keys.length) return 0
  const resp = await s3.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }),
  )
  return resp.Deleted?.length ?? keys.length
}

async function main(): Promise<void> {
  console.log('Listing R2 objects under products/…')
  const allKeys = await listAllKeys()
  console.log(`  found ${allKeys.length} keys`)

  console.log('Loading referenced keys from DB…')
  const referenced = await loadReferencedKeys()
  console.log(`  found ${referenced.size} referenced`)

  const orphans = allKeys.filter((k) => !referenced.has(k))
  console.log(`Orphans to delete: ${orphans.length}`)

  if (dryRun) {
    console.log('\nDRY RUN — listing first 10 orphans:')
    for (const k of orphans.slice(0, 10)) console.log(`  ${k}`)
    await prisma.$disconnect()
    return
  }

  if (!orphans.length) {
    console.log('Nothing to delete.')
    await prisma.$disconnect()
    return
  }

  // R2/S3 DeleteObjects supports up to 1000 per call
  let deleted = 0
  for (let i = 0; i < orphans.length; i += 1000) {
    const batch = orphans.slice(i, i + 1000)
    deleted += await deleteBatch(batch)
    console.log(`  deleted ${deleted}/${orphans.length}`)
  }

  console.log(`\nDone — removed ${deleted} orphan objects`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
