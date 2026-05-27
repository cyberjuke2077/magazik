import { type SupplierRow, type PartIdentity } from '../types'

/**
 * Deduplicates supplier rows by (canonicalBrand, canonicalMpn) key.
 *
 * For each unique key (compared case-insensitively), produces one `PartIdentity`
 * that aggregates all distinct non-empty `package` and `dateCode` values
 * from the group. The first row in each group provides the canonical and
 * original brand/MPN values.
 *
 * Properties:
 * - Stable: `deduplicate(deduplicate(rows)) === deduplicate(rows)`
 *   (when PartIdentity[] is converted back to SupplierRow[])
 * - Reducing: `|deduplicate(rows)| <= |rows|`
 *
 * @param rows - Array of supplier rows (may contain duplicates)
 * @returns Deduplicated array of part identities
 *
 * @example
 * deduplicate([
 *   { canonicalBrand: 'TI', canonicalMpn: 'LM358', originalBrand: 'ti', originalMpn: 'lm358', package: 'SOIC-8', dateCode: '2301', sourceFile: 'a.xlsx' },
 *   { canonicalBrand: 'TI', canonicalMpn: 'LM358', originalBrand: 'TI', originalMpn: 'LM358', package: 'DIP-8', dateCode: '2301', sourceFile: 'b.xlsx' },
 * ])
 * // → [{ canonicalBrand: 'TI', canonicalMpn: 'LM358', originalBrand: 'ti', originalMpn: 'lm358', packages: ['SOIC-8', 'DIP-8'], dateCodes: ['2301'] }]
 */
export function deduplicate(rows: SupplierRow[]): PartIdentity[] {
  const groups = new Map<string, {
    first: SupplierRow
    packages: Set<string>
    dateCodes: Set<string>
  }>()

  for (const row of rows) {
    const key = `${row.canonicalBrand.toLowerCase()}\x00${row.canonicalMpn.toLowerCase()}`

    const existing = groups.get(key)
    if (existing) {
      if (row.package && row.package.trim() !== '') {
        existing.packages.add(row.package.trim())
      }
      if (row.dateCode && row.dateCode.trim() !== '') {
        existing.dateCodes.add(row.dateCode.trim())
      }
    } else {
      const packages = new Set<string>()
      const dateCodes = new Set<string>()

      if (row.package && row.package.trim() !== '') {
        packages.add(row.package.trim())
      }
      if (row.dateCode && row.dateCode.trim() !== '') {
        dateCodes.add(row.dateCode.trim())
      }

      groups.set(key, { first: row, packages, dateCodes })
    }
  }

  const result: PartIdentity[] = []

  groups.forEach(({ first, packages, dateCodes }) => {
    result.push({
      canonicalBrand: first.canonicalBrand,
      canonicalMpn: first.canonicalMpn,
      originalMpn: first.originalMpn,
      originalBrand: first.originalBrand,
      packages: Array.from(packages),
      dateCodes: Array.from(dateCodes),
    })
  })

  return result
}
