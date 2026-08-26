/**
 * Persistence Service Module
 *
 * Batch upserts enrichment results into the database using Prisma transactions.
 * Handles: Manufacturer, Category, Product, Specifications, Datasheets, ProductImages.
 * Applies provenance merge rules to avoid overwriting stronger sources.
 */

import { type Prisma } from '@prisma/client'

import { prisma } from '../../prisma'
import {
  canReplacePendingDatasheetSource,
  normalizeDatasheetCandidates,
} from '../datasheets/datasheet-candidates'
import {
  canReplacePendingImageSource,
  normalizeImageCandidates,
} from '../images/image-candidates'
import { extractPackageFamily } from '../images/package-extractor'
import {
  type DataSource,
  type EnrichmentMeta,
  type EnrichmentResult,
  type FieldProvenance,
  type PartIdentity,
} from '../types'
import { shouldOverwrite } from './provenance-merger'
import { generateSlug } from './slug-generator'
import { resolveManufacturerName } from './manufacturer-resolver'
import {
  FALLBACK_SECTION_SLUG,
  classifyProduct,
  isJunkLeafName,
  normalizeLeafName,
  sectionBySlug,
  toSlug,
} from '../../catalog/taxonomy'

type JsonValue = Prisma.InputJsonValue

export interface PersistBatchResult {
  persisted: number
  failed: number
  errors: Array<{ mpn: string; error: string }>
}

/**
 * Determines enrichment status based on available fields.
 * - 'complete': has name + description + specs
 * - 'partial': has some fields but not all three
 * - 'unresolved': no result at all
 */
export function determineEnrichmentStatus(result: EnrichmentResult | null): string {
  if (!result) return 'unresolved'

  const hasName = !!result.name
  const hasDescription = !!result.description
  const hasSpecs = !!result.specs && result.specs.length > 0

  const hasLocalizedDescription = result.descriptionLanguage !== 'en'
  if (hasName && hasDescription && hasSpecs && hasLocalizedDescription) {
    return 'complete'
  }
  if (hasName || hasDescription || hasSpecs) return 'partial'
  return 'unresolved'
}

/**
 * Generates a manufacturer slug from a brand name.
 * Lowercase, replace non-alphanumeric with dashes, collapse, trim.
 */
function manufacturerSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Builds provenance metadata for a field.
 */
function buildProvenance(source: DataSource): FieldProvenance {
  return {
    source,
    fetchedAt: new Date().toISOString(),
  }
}

/**
 * Persists a batch of enrichment results into the database.
 * Uses a single Prisma transaction for the entire batch.
 *
 * For each item:
 * 1. Upserts Manufacturer by slug
 * 2. Resolves Category (upsert or use uncategorized)
 * 3. Upserts Product by (manufacturerId, mpnNormalized)
 * 4. Applies provenance merge before writing fields
 * 5. Replaces Specifications if provenance allows
 * 6. Queues datasheet URLs for validation and R2 storage
 * 7. Queues image URLs for validation, cleanup and R2 storage
 *
 * @param items - Array of identity + result pairs to persist
 * @returns Summary of persisted/failed counts and errors
 */
export async function persistBatch(
  items: Array<{ identity: PartIdentity; result: EnrichmentResult | null }>,
): Promise<PersistBatchResult> {
  const errors: Array<{ mpn: string; error: string }> = []
  let persisted = 0
  let failed = 0

  try {
    await prisma.$transaction(
      async (tx) => {
        for (const { identity, result } of items) {
          try {
            await persistItem(tx, identity, result)
            persisted++
          } catch (err) {
            failed++
            errors.push({
              mpn: identity.canonicalMpn,
              error: err instanceof Error ? err.message : String(err),
            })
          }
        }
      },
      {
        maxWait: 30_000,
        timeout: 60_000,
      },
    )
  } catch (err) {
    // Transaction-level failure — all items failed
    const txError = err instanceof Error ? err.message : String(err)
    for (const { identity } of items) {
      if (!errors.find((e) => e.mpn === identity.canonicalMpn)) {
        errors.push({ mpn: identity.canonicalMpn, error: txError })
      }
    }
    failed = items.length
    persisted = 0
  }

  return { persisted, failed, errors }
}

/**
 * Persists a single item within a transaction context.
 */
async function persistItem(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  identity: PartIdentity,
  result: EnrichmentResult | null,
): Promise<void> {
  const source: DataSource = result?.source ?? 'supplier-stub'
  const now = new Date()
  const manufacturerName = resolveManufacturerName(identity, result)

  // 1. Upsert Manufacturer
  const mfgSlug = manufacturerSlug(manufacturerName)
  const manufacturer = await tx.manufacturer.upsert({
    where: { slug: mfgSlug },
    create: {
      name: manufacturerName,
      slug: mfgSlug,
    },
    update: {},
  })

  // 2. Resolve Category
  const categoryId = await resolveCategory(tx, identity, result, source)

  // 3. Upsert Product
  const slug = generateSlug(manufacturerName, identity.canonicalMpn)
  const enrichmentStatus = determineEnrichmentStatus(result)

  // Check existing product for provenance merge
  const existingProduct = await tx.product.findUnique({
    where: {
      manufacturer_mpn_normalized: {
        manufacturerId: manufacturer.id,
        mpnNormalized: identity.canonicalMpn,
      },
    },
    select: { id: true, enrichmentMeta: true, slug: true, price: true },
  })

  const existingMeta = existingProduct?.enrichmentMeta as EnrichmentMeta | null

  // Build new enrichment meta
  const newMeta: EnrichmentMeta = { ...(existingMeta ?? {}) }
  const flags = new Set(newMeta.flags ?? [])

  const sourceCategoryPath = [
    ...(result?.categoryPath ?? []),
    ...(result?.categoryName ? [result.categoryName] : []),
  ].filter((value, index, values) => value && values.indexOf(value) === index)
  if (sourceCategoryPath.length > 0) {
    newMeta.sourceCategoryPath = sourceCategoryPath
    const classifiedSection = classifyProduct({
      categoryPath: result?.categoryPath,
      categoryName: result?.categoryName,
      productName: result?.name,
      mpn: identity.canonicalMpn,
      package: result?.package,
    })
    if (classifiedSection === FALLBACK_SECTION_SLUG) {
      flags.add('category_needs_review')
    } else {
      flags.delete('category_needs_review')
    }
  }

  if (result?.description && result.descriptionLanguage === 'en') {
    flags.add('translation_pending')
  } else if (result?.descriptionLanguage === 'ru') {
    flags.delete('translation_pending')
  }
  newMeta.flags = Array.from(flags)

  // Determine field values with provenance checks
  const productName = result?.name ?? `${manufacturerName} ${identity.originalMpn}`
  const productDescription = result?.description ?? (result ? undefined : 'Нет данных')

  // Apply provenance for name
  const writeName = shouldOverwrite(existingMeta, 'name', source)
  if (writeName) {
    newMeta.name = buildProvenance(source)
  }

  // Apply provenance for description
  const writeDescription = shouldOverwrite(existingMeta, 'description', source)
  if (writeDescription && productDescription !== undefined) {
    newMeta.description = buildProvenance(source)
    if (result?.descriptionLanguage) {
      newMeta.descriptionLanguage = result.descriptionLanguage
    }
  }

  // Apply provenance for category
  const writeCategory = shouldOverwrite(existingMeta, 'category', source)
  if (writeCategory) {
    newMeta.category = buildProvenance(source)
  }

  // A price without provenance is managed manually by the store and must
  // never be overwritten by enrichment. Parser-managed prices may refresh
  // according to the normal source-priority rules.
  const hasManualPrice =
    existingProduct?.price !== null &&
    existingProduct?.price !== undefined &&
    !existingMeta?.price
  const hasSupportedSourcePrice =
    result?.price !== undefined &&
    result.price > 0 &&
    (result.currency === undefined || result.currency === 'RUB')
  const writePrice =
    hasSupportedSourcePrice &&
    !hasManualPrice &&
    shouldOverwrite(existingMeta, 'price', source)
  if (writePrice) {
    newMeta.price = buildProvenance(source)
  }

  // Resolve package: prefer the source's raw package string (e.g. "SOIC-8").
  // When absent, derive a package family from the MPN/name so the column
  // is populated for catalog faceting and the generic-image fallback.
  // The frontend extractor accepts both raw strings and family slugs.
  const resolvedPackage =
    result?.package ??
    extractPackageFamily(null, identity.originalMpn, result?.name) ??
    undefined

  // Build upsert data
  const productData = {
    slug,
    name: writeName ? productName : undefined,
    partNumber: identity.originalMpn,
    mpnNormalized: identity.canonicalMpn,
    enrichmentStatus,
    enrichmentMeta: newMeta as unknown as JsonValue,
    lastEnrichedAt: now,
    ...(writeCategory ? { categoryId } : {}),
    ...(result?.lifecycle ? { lifecycle: result.lifecycle } : {}),
    ...(resolvedPackage ? { package: resolvedPackage } : {}),
    ...(result?.sku ? { sku: result.sku } : {}),
    ...(result?.weight !== undefined ? { weight: result.weight } : {}),
    ...(writePrice ? { price: result?.price, currency: 'RUB' } : {}),
    ...(writeDescription && productDescription !== undefined
      ? { description: productDescription }
      : {}),
  }

  // Use existing slug if product already exists (slug is unique, avoid conflicts)
  const upsertSlug = existingProduct?.slug ?? slug

  const product = await tx.product.upsert({
    where: {
      manufacturer_mpn_normalized: {
        manufacturerId: manufacturer.id,
        mpnNormalized: identity.canonicalMpn,
      },
    },
    create: {
      ...productData,
      slug: upsertSlug,
      name: productName,
      partNumber: identity.originalMpn,
      description: productDescription ?? 'Нет данных',
      categoryId,
      manufacturerId: manufacturer.id,
      mpnNormalized: identity.canonicalMpn,
      enrichmentStatus,
      enrichmentMeta: newMeta as unknown as JsonValue,
      lastEnrichedAt: now,
      ...(result?.lifecycle ? { lifecycle: result.lifecycle } : {}),
      ...(result?.package ? { package: result.package } : {}),
      ...(result?.sku ? { sku: result.sku } : {}),
      ...(result?.weight !== undefined ? { weight: result.weight } : {}),
      ...(writePrice ? { price: result?.price, currency: 'RUB' } : {}),
    },
    update: {
      ...(writeName ? { name: productName } : {}),
      ...(writeDescription && productDescription !== undefined
        ? { description: productDescription }
        : {}),
      ...(writeCategory ? { categoryId } : {}),
      ...(result?.lifecycle ? { lifecycle: result.lifecycle } : {}),
      ...(result?.package ? { package: result.package } : {}),
      ...(result?.sku ? { sku: result.sku } : {}),
      ...(result?.weight !== undefined ? { weight: result.weight } : {}),
      ...(writePrice ? { price: result?.price, currency: 'RUB' } : {}),
      enrichmentStatus,
      enrichmentMeta: newMeta as unknown as JsonValue,
      lastEnrichedAt: now,
    },
  })

  // 5. Replace Specifications (if result has specs AND provenance allows)
  if (result?.specs && result.specs.length > 0 && shouldOverwrite(existingMeta, 'specs', source)) {
    await tx.specification.deleteMany({ where: { productId: product.id } })
    await tx.specification.createMany({
      data: result.specs.map((spec, idx) => ({
        productId: product.id,
        key: spec.key,
        value: spec.value,
        order: idx,
      })),
    })
    newMeta.specs = buildProvenance(source)
    await tx.product.update({
      where: { id: product.id },
      data: { enrichmentMeta: newMeta as unknown as JsonValue },
    })
  }

  // 6. Queue upstream PDF URLs. Existing Datasheet rows remain readable until
  // the worker has validated and uploaded at least one replacement to R2.
  if (
    result?.datasheetUrls &&
    result.datasheetUrls.length > 0 &&
    shouldOverwrite(existingMeta, 'datasheets', source) &&
    canReplacePendingDatasheetSource(existingMeta?.datasheetPipeline?.source, source)
  ) {
    const candidates = normalizeDatasheetCandidates(
      result.datasheetUrls,
      source,
      identity.canonicalMpn,
    )
    if (candidates.length > 0) {
      newMeta.datasheetCandidates = candidates
      newMeta.datasheetPipeline = {
        status: 'pending',
        source,
        queuedAt: now.toISOString(),
      }
      await tx.product.update({
        where: { id: product.id },
        data: { enrichmentMeta: newMeta as unknown as JsonValue },
      })
    }
  }

  // 7. Queue upstream URLs. ProductImage remains untouched until the local
  // media worker has cleaned, verified and uploaded the replacement to R2.
  if (
    result?.imageUrls &&
    result.imageUrls.length > 0 &&
    (source === 'chipdip' || source === 'lcsc' || source === 'mouser') &&
    shouldOverwrite(existingMeta, 'images', source) &&
    canReplacePendingImageSource(existingMeta?.imagePipeline?.source, source)
  ) {
    const candidates = normalizeImageCandidates(result.imageUrls, source)
    if (candidates.length > 0) {
      newMeta.imageCandidates = candidates
      newMeta.imagePipeline = {
        status: 'pending',
        source,
        queuedAt: now.toISOString(),
      }
      await tx.product.update({
        where: { id: product.id },
        data: { enrichmentMeta: newMeta as unknown as JsonValue },
      })
    }
  }
}

/**
 * Resolves the category ID for a product based on the enrichment result.
 * - ChipDip: upsert with Russian name, slug from transliteration
 * - LCSC/Mouser: upsert with English name, nameNeedsReview = true
 * - No category: use seed "uncategorized" category
 */
/**
 * Определяет categoryId товара, выстраивая 2-уровневую иерархию каталога:
 * РАЗДЕЛ (фикс. таксономия, parentId=null) → подкатегория (товарная).
 * Новые товары с парсера автоматически попадают в то же чистое дерево.
 */
async function resolveCategory(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  identity: PartIdentity,
  result: EnrichmentResult | null,
  source: DataSource,
): Promise<string> {
  const sectionSlug = classifyProduct({
    categoryPath: result?.categoryPath ?? null,
    categoryName: result?.categoryName ?? null,
    productName: result?.name ?? null,
    mpn: identity.canonicalMpn,
    package: result?.package ?? null,
  })
  const section = sectionBySlug(sectionSlug)
  if (!section) {
    throw new Error(`Unknown catalog section: ${sectionSlug}`)
  }

  const sectionCategory = await tx.category.upsert({
    where: { slug: section.slug },
    create: {
      slug: section.slug,
      name: section.name,
      icon: section.icon,
      parentId: null,
      nameNeedsReview: false,
    },
    update: {},
  })

  const leafNameRaw = result?.categoryName
  if (!leafNameRaw || isJunkLeafName(leafNameRaw)) {
    return sectionCategory.id
  }

  const leafName = normalizeLeafName(leafNameRaw)
  const leafSlug = toSlug(leafName)
  if (!leafSlug || leafSlug === section.slug) {
    return sectionCategory.id
  }

  const leaf = await tx.category.upsert({
    where: { slug: leafSlug },
    create: {
      slug: leafSlug,
      name: leafName,
      parentId: sectionCategory.id,
      nameNeedsReview: source !== 'chipdip',
    },
    update: { parentId: sectionCategory.id },
  })
  return leaf.id
}
