import { describe, expect, it } from 'vitest'
import { serializeSubmissionLog } from './submission-log'

describe('submission log', () => {
  it('contains operational fields without contact data', () => {
    const value = serializeSubmissionLog({
      scope: 'quote_request',
      outcome: 'saved',
      durationMs: 12.6,
      requestId: 'request-1',
    })

    expect(JSON.parse(value)).toEqual({
      event: 'public_submission',
      scope: 'quote_request',
      outcome: 'saved',
      durationMs: 13,
      requestId: 'request-1',
    })
    expect(value).not.toContain('email')
    expect(value).not.toContain('phone')
    expect(value).not.toContain('company')
  })
})
