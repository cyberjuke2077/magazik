/**
 * Slug Generator Module
 *
 * Generates deterministic URL-safe slugs from brand and MPN pairs.
 * Used for `Product.slug` field in the database.
 */

/**
 * Generates a deterministic slug from a canonical brand and MPN.
 *
 * Algorithm:
 * 1. Combine: `${brand}-${mpn}`
 * 2. Lowercase
 * 3. Replace all non-alphanumeric chars with `-`
 * 4. Collapse multiple dashes to single
 * 5. Trim leading/trailing dashes
 *
 * The result always matches `/^[a-z0-9]+(-[a-z0-9]+)*$/` for non-empty inputs.
 * Same inputs always produce the same output (deterministic).
 *
 * @param canonicalBrand - Canonical brand name (e.g. "Texas Instruments")
 * @param canonicalMpn - Canonical MPN (e.g. "STM32F469ZIT6")
 * @returns URL-safe slug (e.g. "texas-instruments-stm32f469zit6")
 *
 * @example
 * generateSlug('Texas Instruments', 'LM358DR')
 * // → 'texas-instruments-lm358dr'
 *
 * @example
 * generateSlug('STMicroelectronics', 'STM32F469ZIT6')
 * // → 'stmicroelectronics-stm32f469zit6'
 */
export function generateSlug(canonicalBrand: string, canonicalMpn: string): string {
  return `${canonicalBrand}-${canonicalMpn}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
