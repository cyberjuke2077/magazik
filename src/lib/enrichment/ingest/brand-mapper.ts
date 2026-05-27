import { BRAND_MAP } from '../constants/brand-map'

/**
 * Result of brand name mapping through the canonical dictionary.
 */
export interface BrandMapResult {
  /** Canonical brand name (mapped value or original if unmapped) */
  name: string
  /** Whether the brand was NOT found in the dictionary */
  unmapped: boolean
}

/**
 * Maps a raw brand string from supplier data to a canonical brand name.
 *
 * Performs case-insensitive lookup in the brand dictionary after trimming whitespace.
 * If the brand is found, returns the canonical name with `unmapped: false`.
 * If not found, returns the trimmed original value with `unmapped: true`.
 *
 * Never throws an exception. Never returns an empty `name`.
 *
 * @param raw - Raw brand string from supplier file
 * @returns Mapped brand result with canonical name and unmapped flag
 *
 * @example
 * mapBrand('TI')           // → { name: 'Texas Instruments', unmapped: false }
 * mapBrand('  st  ')       // → { name: 'STMicroelectronics', unmapped: false }
 * mapBrand('Unknown Brand') // → { name: 'Unknown Brand', unmapped: true }
 */
export function mapBrand(raw: string): BrandMapResult {
  const trimmed = raw.trim()
  const key = trimmed.toUpperCase()

  const mapped = BRAND_MAP[key]

  if (mapped) {
    return { name: mapped, unmapped: false }
  }

  // If input is empty after trim, return original raw value to avoid empty name
  if (trimmed === '') {
    return { name: raw, unmapped: true }
  }

  return { name: trimmed, unmapped: true }
}
