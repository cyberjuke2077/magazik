import { describe, expect, it } from 'vitest'
import { buildPrefixTsQuery, normalizeSearchQuery } from './search-query'

describe('search input', () => {
  it.each(['!!', '()', ':*', "'\\", '---', '  '])('ignores punctuation: %s', (query) => {
    expect(buildPrefixTsQuery(query)).toBeNull()
  })
  it('retains orderable part punctuation without exposing query operators', () => {
    expect(buildPrefixTsQuery('AD1580ARTZ-REEL7 !! OPA/123')).toBe("'AD1580ARTZ-REEL7':* & 'OPA/123':*")
    expect(buildPrefixTsQuery("STM32 | ' OR (foo)")).toBe("'STM32':* & 'OR':* & 'foo':*")
  })
  it('bounds both query length and term count', () => {
    expect(normalizeSearchQuery('x'.repeat(1000))).toHaveLength(200)
    expect(buildPrefixTsQuery('a '.repeat(100))?.split(' & ')).toHaveLength(20)
  })
})
