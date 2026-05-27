import { CYRILLIC_TO_LATIN, MPN_SUFFIXES } from '../constants/mpn-suffixes'

/**
 * Normalizes a Manufacturer Part Number (MPN) to a canonical form.
 *
 * Steps:
 * 1. Trim whitespace
 * 2. Convert to uppercase
 * 3. Replace Cyrillic homoglyphs with Latin equivalents
 * 4. Strip packaging suffixes (longest-first, last occurrence at end of string)
 * 5. Trim again after suffix removal
 *
 * The function is idempotent: `normalizeMpn(normalizeMpn(x)) === normalizeMpn(x)`
 * for any input string.
 *
 * @param mpn - Raw MPN string from supplier file
 * @returns Canonical MPN (uppercase, no suffixes, no homoglyphs)
 *
 * @example
 * normalizeMpn('stm32f469zit6')   // → 'STM32F469ZIT6'
 * normalizeMpn('MAX232ESE+')      // → 'MAX232ESE'
 * normalizeMpn('AT24C08B-TH-T')   // → 'AT24C08B-TH'
 * normalizeMpn('LM358N/NOPB')     // → 'LM358N'
 * normalizeMpn('  stm32  ')       // → 'STM32'
 * normalizeMpn('СТМ32')           // → 'CTM32' (Cyrillic → Latin)
 * normalizeMpn('')                // → ''
 */
export function normalizeMpn(mpn: string): string {
  // Step 1: Trim whitespace
  let result = mpn.trim()

  if (result === '') return ''

  // Step 2: Convert to uppercase
  result = result.toUpperCase()

  // Step 3: Replace Cyrillic homoglyphs with Latin equivalents
  for (const [cyrillic, latin] of Object.entries(CYRILLIC_TO_LATIN)) {
    result = result.split(cyrillic).join(latin)
  }

  // Step 4: Strip packaging suffixes repeatedly until stable (ensures idempotency)
  let stripped = true
  while (stripped) {
    stripped = false
    for (const suffix of MPN_SUFFIXES) {
      if (result.endsWith(suffix)) {
        result = result.slice(0, result.length - suffix.length)
        stripped = true
        break
      }
    }
  }

  // Step 5: Trim again after suffix removal
  result = result.trim()

  return result
}
