import { afterEach, expect, it, vi } from 'vitest'
import { lookupQuoteRequest, submitQuoteRequest } from '@/app/request-list/actions'
import { validateQuoteInput } from '@/lib/validate-quote-input'

const { receiptLookup, save, attemptLimit } = vi.hoisted(() => ({
  receiptLookup: vi.fn(), save: vi.fn(), attemptLimit: vi.fn(),
}))
vi.mock('@/lib/save-submission', () => ({
  lookupSubmission: receiptLookup,
  saveSubmission: save,
  SubmissionConflictError: class extends Error {},
}))
vi.mock('@/lib/submission-rate-limit', () => ({
  enforceSubmissionAttemptRateLimit: attemptLimit,
  enforceSubmissionRateLimit: vi.fn(),
  SubmissionRateLimitExceededError: class extends Error {},
}))
vi.mock('next/server', () => ({ after: vi.fn() }))
afterEach(() => { vi.useRealTimers(); vi.resetAllMocks() })

function quoteInput() {
  return {
    submissionKey: 'aaf13420-aeca-4d46-a923-d811c353014d',
    companyName: 'Audit', contactPerson: 'Buyer', phone: '79990000000',
    email: 'test@example.invalid', consent: true, desiredDeliveryDate: '2026-09-18',
    items: [{ productId: 'test', partNumber: 'MPN', name: 'Test', quantity: 10 }],
  }
}

it('returns the original receipt on lookup and replay across Moscow midnight', async () => {
  const input = quoteInput()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-18T20:59:00Z'))
  expect(validateQuoteInput(input).valid).toBe(true)
  receiptLookup.mockResolvedValue('already-saved-request')
  expect(await lookupQuoteRequest(input)).toEqual({ success: true, requestId: 'already-saved-request' })
  receiptLookup.mockClear()
  vi.setSystemTime(new Date('2026-09-18T21:01:00Z'))
  expect(await lookupQuoteRequest(input)).toEqual({ success: true, requestId: 'already-saved-request' })
  expect(await submitQuoteRequest(input)).toEqual({ success: true, requestId: 'already-saved-request' })
  expect(save).not.toHaveBeenCalled()
})

it('still rejects a new request with a past delivery date', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-18T21:01:00Z'))
  receiptLookup.mockResolvedValue(null)
  expect(await lookupQuoteRequest(quoteInput())).toEqual({ success: true, requestId: null })
  expect(await submitQuoteRequest(quoteInput())).toMatchObject({ success: false, discardOperation: true })
  expect(save).not.toHaveBeenCalled()
})

it('rejects malformed payloads before looking up a receipt', async () => {
  const input = { ...quoteInput(), desiredDeliveryDate: '2026-02-30' }
  expect(await lookupQuoteRequest(input)).toEqual({ success: true, requestId: null })
  expect(await submitQuoteRequest(input)).toMatchObject({ success: false, discardOperation: true })
  expect(receiptLookup).not.toHaveBeenCalled()
  expect(save).not.toHaveBeenCalled()
})

it('keeps the attempt limiter ahead of receipt reads', async () => {
  attemptLimit.mockRejectedValue(new Error('unavailable'))
  expect(await lookupQuoteRequest(quoteInput())).toMatchObject({ success: false })
  expect(await submitQuoteRequest(quoteInput())).toMatchObject({ success: false })
  expect(receiptLookup).not.toHaveBeenCalled()
  expect(save).not.toHaveBeenCalled()
})
