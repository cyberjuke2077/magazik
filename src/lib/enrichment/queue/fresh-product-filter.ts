import { prisma } from '../../prisma'
import { type PartIdentity } from '../types'

const QUERY_CHUNK_SIZE = 500

interface ProductMemory {
  mpnNormalized: string | null
  enrichmentStatus: string
  lastEnrichedAt: Date | null
  manufacturer: { name: string }
}

export function productMemoryKey(brand: string, mpn: string): string {
  return `${brand.trim().toLowerCase()}\u0000${mpn.trim().toUpperCase()}`
}

export function isFreshCompleteProduct(
  product: ProductMemory,
  cutoff: Date,
): boolean {
  return (
    product.enrichmentStatus === 'complete' &&
    product.lastEnrichedAt !== null &&
    product.lastEnrichedAt >= cutoff
  )
}

export async function filterFreshProducts(
  parts: PartIdentity[],
  freshnessDays: number,
): Promise<{ pending: PartIdentity[]; skipped: number }> {
  if (parts.length === 0) return { pending: [], skipped: 0 }

  const cutoff = new Date(Date.now() - freshnessDays * 24 * 60 * 60 * 1000)
  const freshKeys = new Set<string>()

  for (let offset = 0; offset < parts.length; offset += QUERY_CHUNK_SIZE) {
    const chunk = parts.slice(offset, offset + QUERY_CHUNK_SIZE)
    const products = await prisma.product.findMany({
      where: {
        mpnNormalized: { in: chunk.map((part) => part.canonicalMpn) },
      },
      select: {
        mpnNormalized: true,
        enrichmentStatus: true,
        lastEnrichedAt: true,
        manufacturer: { select: { name: true } },
      },
    })

    for (const product of products) {
      if (
        product.mpnNormalized &&
        isFreshCompleteProduct(product, cutoff)
      ) {
        freshKeys.add(
          productMemoryKey(product.manufacturer.name, product.mpnNormalized),
        )
      }
    }
  }

  const pending = parts.filter(
    (part) =>
      !freshKeys.has(
        productMemoryKey(part.canonicalBrand, part.canonicalMpn),
      ),
  )

  return { pending, skipped: parts.length - pending.length }
}
