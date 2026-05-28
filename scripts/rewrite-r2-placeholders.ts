/**
 * Rewrite `r2://<bucket>/<key>` placeholder URLs in ProductImage to
 * proper public URLs once R2_PUBLIC_URL is configured. Idempotent —
 * rows that already point at the public base are left alone.
 */
import './_load-env'

import { isR2PublicUrlConfigured, publicUrl } from '../src/lib/storage/r2-client'
import { prisma } from '../src/lib/prisma'

async function main() {
  if (!isR2PublicUrlConfigured()) {
    console.error('R2_PUBLIC_URL is not set in .env.local')
    process.exit(1)
  }

  const placeholders = await prisma.productImage.findMany({
    where: { imageUrl: { startsWith: 'r2://' } },
    select: { id: true, imageUrl: true },
  })

  console.log(`Found ${placeholders.length} placeholder rows`)
  if (placeholders.length === 0) {
    await prisma.$disconnect()
    return
  }

  let updated = 0
  for (const row of placeholders) {
    // `r2://<bucket>/<key>` — strip the scheme + bucket prefix to recover key.
    const match = row.imageUrl.match(/^r2:\/\/[^/]+\/(.+)$/)
    if (!match) {
      console.warn(`  skip ${row.id}: malformed ${row.imageUrl}`)
      continue
    }
    const key = match[1]
    const newUrl = publicUrl(key)
    await prisma.productImage.update({
      where: { id: row.id },
      data: { imageUrl: newUrl },
    })
    updated++
  }

  console.log(`Rewrote ${updated} URLs`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
