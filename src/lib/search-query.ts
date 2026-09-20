export const MAX_SEARCH_LENGTH = 200
const MAX_SEARCH_TERMS = 20

export function normalizeSearchQuery(value: string): string {
  return value.trim().slice(0, MAX_SEARCH_LENGTH)
}

export function buildContainsLikePattern(value: string): string {
  const escaped = normalizeSearchQuery(value).replace(/[\\%_]/g, '\\$&')
  return `%${escaped}%`
}

/** Quote each lexeme; punctuation-only input must never become a bare :*. */
export function buildPrefixTsQuery(value: string): string | null {
  const terms = normalizeSearchQuery(value).split(/\s+/)
    .map((term) => term.replace(/[!&|()<>:*'\\]/g, ''))
    .filter((term) => /[\p{L}\p{N}]/u.test(term))
    .slice(0, MAX_SEARCH_TERMS)
  return terms.length ? terms.map((term) => `'${term}':*`).join(' & ') : null
}
