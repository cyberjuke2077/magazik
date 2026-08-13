import { describe, expect, it } from 'vitest'

import { normalizeMouserApiKey } from './config'

describe('normalizeMouserApiKey', () => {
  it.each([
    undefined,
    '',
    'dummy-mouser-key',
    'PLACEHOLDER',
    'change-me',
    'your_api_key',
    '[ЗАПОЛНИТЬ]',
  ])('disables placeholder value %s', (value) => {
    expect(normalizeMouserApiKey(value)).toBe('')
  })

  it('keeps a non-placeholder API key without logging it', () => {
    expect(normalizeMouserApiKey('  real-key-1234567890  ')).toBe('real-key-1234567890')
  })
})
