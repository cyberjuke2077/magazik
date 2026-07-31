import { type DataSource, type EnrichmentMeta, type FieldProvenance, SOURCE_PRIORITY } from '../types'

/**
 * Fields in EnrichmentMeta that carry provenance information.
 * Excludes operational fields like `flags` and `descriptionLanguage`.
 */
type ProvenanceField = keyof Omit<
  EnrichmentMeta,
  'flags' | 'descriptionLanguage' | 'sourceCategoryPath'
>

/**
 * Determines whether a new source should overwrite an existing field value
 * based on the source priority rules.
 *
 * Priority rules:
 * - If existingMeta is null/undefined or field not present → write (return true)
 * - If new source priority > existing → stronger overwrites (return true)
 * - If equal priority → last write wins (return true)
 * - If new source priority < existing → weaker never overwrites (return false)
 *
 * Priority values: ChipDip (4) > LCSC (3) > Mouser (2) > supplier-stub (1)
 *
 * @param existingMeta - Current enrichment metadata (may be null/undefined)
 * @param field - The field to check for overwrite eligibility
 * @param newSource - The data source attempting to write
 * @returns true if the new source should overwrite the existing value
 *
 * @example
 * // No existing meta → always write
 * shouldOverwrite(null, 'name', 'mouser') // → true
 *
 * @example
 * // Stronger source overwrites weaker
 * shouldOverwrite({ name: { source: 'mouser', fetchedAt: '...' } }, 'name', 'chipdip') // → true
 *
 * @example
 * // Weaker source never overwrites stronger
 * shouldOverwrite({ name: { source: 'chipdip', fetchedAt: '...' } }, 'name', 'mouser') // → false
 */
export function shouldOverwrite(
  existingMeta: EnrichmentMeta | null | undefined,
  field: ProvenanceField,
  newSource: DataSource,
): boolean {
  // No existing metadata → always write
  if (!existingMeta) {
    return true
  }

  const existingProvenance = existingMeta[field] as FieldProvenance | undefined

  // Field not present in existing meta → write
  if (!existingProvenance) {
    return true
  }

  const existingPriority = SOURCE_PRIORITY[existingProvenance.source]
  const newPriority = SOURCE_PRIORITY[newSource]

  // Higher or equal priority → overwrite (last write wins for equal)
  if (newPriority >= existingPriority) {
    return true
  }

  // Lower priority → never overwrite
  return false
}
