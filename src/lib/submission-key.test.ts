import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearSubmissionDraft,
  finishSubmission,
  loadSubmissionDraft,
  newSubmissionKey,
  saveSubmissionDraft,
  submissionKey,
  SubmissionPayloadChangedError,
  SUBMISSION_STATE_TTL_MS,
  watchSubmissionStateExpiry,
} from './submission-key'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return Array.from(this.values.keys())[index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const isDraft = (value: unknown): value is { email: string } => (
  !!value && typeof value === 'object' && typeof (value as { email?: unknown }).email === 'string'
)

describe('submission operation lifecycle', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: new MemoryStorage() })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    Reflect.deleteProperty(globalThis, 'window')
    Reflect.deleteProperty(globalThis, 'document')
  })

  it('reuses one operation for an unknown result and rotates it only after confirmed success', async () => {
    const scope = `retry-${crypto.randomUUID()}`
    const payload = { email: 'buyer@example.invalid', message: 'STM32 x 10' }
    const first = await submissionKey(scope, payload)

    expect(await submissionKey(scope, payload)).toBe(first)
    finishSubmission(scope, first)
    expect(await submissionKey(scope, payload)).not.toBe(first)
  })

  it('blocks changed data until the user explicitly starts a new operation', async () => {
    const scope = `changed-${crypto.randomUUID()}`
    const original = { phone: '79990000000', comment: '10 шт.' }
    const first = await submissionKey(scope, original)

    const changed = submissionKey(scope, { ...original, phone: '79990000001' })
    await expect(changed).rejects.toMatchObject({
      operationKey: first,
      originalPayload: original,
    } satisfies Partial<SubmissionPayloadChangedError>)
    expect(await submissionKey(scope, original)).toBe(first)
    expect(await newSubmissionKey(scope, { ...original, phone: '79990000001' })).not.toBe(first)
  })

  it.each([
    ['comment', { comment: '10 шт.', items: [{ quantity: 10 }] }, { comment: '20 шт.', items: [{ quantity: 10 }] }],
    ['quantity', { comment: '10 шт.', items: [{ quantity: 10 }] }, { comment: '10 шт.', items: [{ quantity: 20 }] }],
  ])('does not rotate the key after an ambiguous result when %s changes', async (_field, original, changed) => {
    const scope = `changed-${crypto.randomUUID()}`
    const first = await submissionKey(scope, original)
    await expect(submissionKey(scope, changed)).rejects.toMatchObject({ operationKey: first })
    expect(await submissionKey(scope, original)).toBe(first)
  })

  it('treats reordered object properties as the same payload', async () => {
    const scope = `canonical-${crypto.randomUUID()}`
    const first = await submissionKey(scope, { email: 'a@example.invalid', quantity: 10 })
    expect(await submissionKey(scope, { quantity: 10, email: 'a@example.invalid' })).toBe(first)
  })

  it('restores a short-lived draft and removes it after expiry or success', () => {
    const scope = `draft-${crypto.randomUUID()}`
    const now = 1_800_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    saveSubmissionDraft(scope, { email: 'draft@example.invalid' })
    expect(loadSubmissionDraft(scope, isDraft)).toEqual({ email: 'draft@example.invalid' })

    vi.spyOn(Date, 'now').mockReturnValue(now + SUBMISSION_STATE_TTL_MS + 1)
    expect(loadSubmissionDraft(scope, isDraft)).toBeNull()
    saveSubmissionDraft(scope, { email: 'another@example.invalid' })
    clearSubmissionDraft(scope)
    expect(loadSubmissionDraft(scope, isDraft)).toBeNull()
  })

  it('does not extend a draft TTL when restored data is saved on mount', () => {
    vi.useFakeTimers()
    const scope = `fixed-ttl-${crypto.randomUUID()}`
    const now = 1_800_000_000_000
    vi.setSystemTime(now)
    saveSubmissionDraft(scope, { email: 'draft@example.invalid' })

    vi.setSystemTime(now + SUBMISSION_STATE_TTL_MS / 2)
    saveSubmissionDraft(scope, { email: 'draft@example.invalid' })
    vi.setSystemTime(now + SUBMISSION_STATE_TTL_MS + 1)

    expect(loadSubmissionDraft(scope, isDraft)).toBeNull()
  })

  it('actively removes draft and operation payloads when their fixed TTL expires', async () => {
    vi.useFakeTimers()
    const scope = `active-expiry-${crypto.randomUUID()}`
    const browserWindow = new EventTarget()
    const browserDocument = new EventTarget()
    Object.defineProperty(browserDocument, 'visibilityState', { value: 'visible' })
    Object.defineProperty(globalThis, 'window', { configurable: true, value: browserWindow })
    Object.defineProperty(globalThis, 'document', { configurable: true, value: browserDocument })
    vi.setSystemTime(1_800_000_000_000)

    await submissionKey(scope, { email: 'buyer@example.invalid' })
    saveSubmissionDraft(scope, { email: 'buyer@example.invalid' })
    const stopWatching = watchSubmissionStateExpiry(scope)
    await vi.advanceTimersByTimeAsync(SUBMISSION_STATE_TTL_MS + 2)

    expect(sessionStorage.getItem(`electromagaz_submission_${scope}`)).toBeNull()
    expect(sessionStorage.getItem(`electromagaz_submission_draft_${scope}`)).toBeNull()
    stopWatching()
  })

  it('arms expiry when state is written after the global watcher mounts', async () => {
    vi.useFakeTimers()
    const scope = `late-write-${crypto.randomUUID()}`
    const browserWindow = new EventTarget()
    const browserDocument = new EventTarget()
    Object.defineProperty(browserDocument, 'visibilityState', { value: 'visible' })
    Object.defineProperty(globalThis, 'window', { configurable: true, value: browserWindow })
    Object.defineProperty(globalThis, 'document', { configurable: true, value: browserDocument })
    vi.setSystemTime(1_800_000_000_000)

    const stopWatching = watchSubmissionStateExpiry(scope)
    await submissionKey(scope, { email: 'buyer@example.invalid' })
    saveSubmissionDraft(scope, { email: 'buyer@example.invalid' })
    await vi.advanceTimersByTimeAsync(SUBMISSION_STATE_TTL_MS + 2)

    expect(sessionStorage.getItem(`electromagaz_submission_${scope}`)).toBeNull()
    expect(sessionStorage.getItem(`electromagaz_submission_draft_${scope}`)).toBeNull()
    stopWatching()
  })

  it('purges expired state when the tab regains focus', async () => {
    vi.useFakeTimers()
    const scope = `focus-expiry-${crypto.randomUUID()}`
    const browserWindow = new EventTarget()
    const browserDocument = new EventTarget()
    Object.defineProperty(browserDocument, 'visibilityState', { value: 'visible' })
    Object.defineProperty(globalThis, 'window', { configurable: true, value: browserWindow })
    Object.defineProperty(globalThis, 'document', { configurable: true, value: browserDocument })
    const now = 1_800_000_000_000
    vi.setSystemTime(now)
    await submissionKey(scope, { email: 'buyer@example.invalid' })
    saveSubmissionDraft(scope, { email: 'buyer@example.invalid' })
    const stopWatching = watchSubmissionStateExpiry(scope)

    vi.setSystemTime(now + SUBMISSION_STATE_TTL_MS + 1)
    browserWindow.dispatchEvent(new Event('focus'))

    expect(sessionStorage.getItem(`electromagaz_submission_${scope}`)).toBeNull()
    expect(sessionStorage.getItem(`electromagaz_submission_draft_${scope}`)).toBeNull()
    stopWatching()
  })

  it('ignores corrupted and legacy operation state', async () => {
    const scope = `corrupt-${crypto.randomUUID()}`
    sessionStorage.setItem(`electromagaz_submission_${scope}`, '{broken')
    await expect(submissionKey(scope, { value: 1 })).resolves.toMatch(/^[0-9a-f-]{36}$/)

    sessionStorage.setItem(`electromagaz_submission_draft_${scope}`, '{broken')
    expect(loadSubmissionDraft(scope, isDraft)).toBeNull()
  })

  it.each(['1e400', String(1_800_000_000_000 + SUBMISSION_STATE_TTL_MS + 1)])(
    'rejects an operation and draft with unsafe expiry %s',
    async (expiresAt) => {
      const scope = `unsafe-expiry-${crypto.randomUUID()}`
      const now = 1_800_000_000_000
      vi.spyOn(Date, 'now').mockReturnValue(now)
      const fixedKey = '00000000-0000-4000-8000-000000000001'
      sessionStorage.setItem(`electromagaz_submission_${scope}`, `{"version":2,"hash":"old","key":"${fixedKey}","expiresAt":${expiresAt},"payload":{"value":1}}`)
      sessionStorage.setItem(`electromagaz_submission_draft_${scope}`, `{"version":1,"expiresAt":${expiresAt},"data":{"email":"old@example.invalid"}}`)

      expect(loadSubmissionDraft(scope, isDraft)).toBeNull()
      expect(await submissionKey(scope, { value: 1 })).not.toBe(fixedKey)
    },
  )
})
