import { mapBrand } from '../ingest/brand-mapper'
import { type EnrichmentResult, type PartIdentity } from '../types'

export function resolveManufacturerName(
  identity: PartIdentity,
  result: EnrichmentResult | null,
): string {
  const sourceBrand = result?.brand.trim() ?? ''
  const inputBrand = identity.canonicalBrand.trim()
  const manufacturer = sourceBrand || inputBrand

  if (!manufacturer) {
    throw new Error(
      `Cannot persist ${identity.canonicalMpn}: manufacturer was not resolved`,
    )
  }

  return mapBrand(manufacturer).name
}

export function hasResolvedManufacturer(
  identity: PartIdentity,
  result: EnrichmentResult | null,
): boolean {
  return Boolean(result?.brand.trim() || identity.canonicalBrand.trim())
}
