const OPERATION_PREFIX = 'electromagaz_submission_'
const DRAFT_PREFIX = 'electromagaz_submission_draft_'
const STATE_CHANGED_EVENT_PREFIX = 'electromagaz:submission-state-changed:'
const STATE_EXPIRED_EVENT_PREFIX = 'electromagaz:submission-state-expired:'

export const SUBMISSION_STATE_TTL_MS = 2 * 60 * 60 * 1000

interface StoredOperation {
  version: 2
  hash: string
  key: string
  expiresAt: number
  payload: unknown
}

interface StoredDraft {
  version: 1
  expiresAt: number
  data: unknown
}

const memory = new Map<string, StoredOperation>()

export class SubmissionPayloadChangedError extends Error {
  constructor(
    readonly operationKey: string,
    readonly originalPayload: unknown,
  ) {
    super('Предыдущая отправка могла сохраниться, а данные формы изменились.')
    this.name = 'SubmissionPayloadChangedError'
  }
}

function operationStorageKey(scope: string) {
  return `${OPERATION_PREFIX}${scope}`
}

function draftStorageKey(scope: string) {
  return `${DRAFT_PREFIX}${scope}`
}

function stateChangedEvent(scope: string) {
  return `${STATE_CHANGED_EVENT_PREFIX}${scope}`
}

function stateExpiredEvent(scope: string) {
  return `${STATE_EXPIRED_EVENT_PREFIX}${scope}`
}

function notifyStateChanged(scope: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(stateChangedEvent(scope)))
}

function notifyStateExpired(scope: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(stateExpiredEvent(scope)))
}

function isStoredDraft(value: unknown): value is StoredDraft {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<StoredDraft>
  return item.version === 1 && typeof item.expiresAt === 'number'
    && Number.isSafeInteger(item.expiresAt)
    && Object.prototype.hasOwnProperty.call(item, 'data')
}

function isStoredOperation(value: unknown): value is StoredOperation {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<StoredOperation>
  return item.version === 2 && typeof item.hash === 'string'
    && typeof item.key === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.key)
    && typeof item.expiresAt === 'number'
    && Number.isSafeInteger(item.expiresAt)
    && Object.prototype.hasOwnProperty.call(item, 'payload')
}

function removeStoredOperation(scope: string, expired = false) {
  memory.delete(scope)
  try { sessionStorage.removeItem(operationStorageKey(scope)) }
  catch { console.warn('[submission] Unable to clear retry key') }
  notifyStateChanged(scope)
  if (expired) notifyStateExpired(scope)
}

function readOperation(scope: string): StoredOperation | null {
  let operation = memory.get(scope) ?? null
  try {
    const raw = sessionStorage.getItem(operationStorageKey(scope))
    if (raw) operation = JSON.parse(raw)
  } catch {
    try { sessionStorage.removeItem(operationStorageKey(scope)) } catch { /* unavailable */ }
    console.warn('[submission] Session storage unavailable; retry key kept in memory')
  }
  const now = Date.now()
  if (
    !isStoredOperation(operation)
    || operation.expiresAt <= now
    || operation.expiresAt > now + SUBMISSION_STATE_TTL_MS
  ) {
    if (operation) removeStoredOperation(scope, true)
    return null
  }
  memory.set(scope, operation)
  return operation
}

function writeOperation(scope: string, operation: StoredOperation) {
  memory.set(scope, operation)
  try { sessionStorage.setItem(operationStorageKey(scope), JSON.stringify(operation)) }
  catch { console.warn('[submission] Unable to persist retry key') }
  notifyStateChanged(scope)
}

function readDraft(scope: string): StoredDraft | null {
  try {
    const raw = sessionStorage.getItem(draftStorageKey(scope))
    if (!raw) return null
    const draft: unknown = JSON.parse(raw)
    const now = Date.now()
    if (
      isStoredDraft(draft)
      && draft.expiresAt > now
      && draft.expiresAt <= now + SUBMISSION_STATE_TTL_MS
    ) return draft
    sessionStorage.removeItem(draftStorageKey(scope))
    notifyStateChanged(scope)
    notifyStateExpired(scope)
  } catch {
    try { sessionStorage.removeItem(draftStorageKey(scope)) } catch { /* unavailable */ }
    console.warn('[submission] Unable to restore form draft')
  }
  return null
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    return JSON.stringify(Object.fromEntries(Object.entries(value)
      .filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, canonical(item)])))
  }
  return JSON.stringify(value) ?? 'null'
}

async function payloadHash(payload: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonical(payload))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function createOperation(scope: string, payload: unknown): Promise<string> {
  const operation: StoredOperation = {
    version: 2,
    hash: await payloadHash(payload),
    key: crypto.randomUUID(),
    expiresAt: Date.now() + SUBMISSION_STATE_TTL_MS,
    payload,
  }
  writeOperation(scope, operation)
  return operation.key
}

// Reuse a key only while the result of the same operation is unknown.
export async function submissionKey(scope: string, payload: unknown): Promise<string> {
  const previous = readOperation(scope)
  if (!previous) return createOperation(scope, payload)
  if (previous.hash !== await payloadHash(payload)) {
    throw new SubmissionPayloadChangedError(previous.key, previous.payload)
  }
  return previous.key
}

// Changed data becomes a new operation only after an explicit user choice.
export async function newSubmissionKey(scope: string, payload: unknown): Promise<string> {
  removeStoredOperation(scope)
  return createOperation(scope, payload)
}

export function loadPendingSubmission<T>(
  scope: string,
  validate: (value: unknown) => value is T,
): { key: string; payload: T } | null {
  const operation = readOperation(scope)
  if (!operation) return null
  if (!validate(operation.payload)) {
    removeStoredOperation(scope, true)
    return null
  }
  return { key: operation.key, payload: operation.payload }
}

export function finishSubmission(scope: string, key: string) {
  const operation = readOperation(scope)
  if (operation?.key === key) removeStoredOperation(scope)
}

export function saveSubmissionDraft(scope: string, data: unknown) {
  const previous = readDraft(scope)
  const draft: StoredDraft = {
    version: 1,
    expiresAt: previous?.expiresAt ?? Date.now() + SUBMISSION_STATE_TTL_MS,
    data,
  }
  try { sessionStorage.setItem(draftStorageKey(scope), JSON.stringify(draft)) }
  catch { console.warn('[submission] Unable to save form draft') }
  notifyStateChanged(scope)
}

export function loadSubmissionDraft<T>(scope: string, validate: (value: unknown) => value is T): T | null {
  const draft = readDraft(scope)
  if (draft && validate(draft.data)) return draft.data
  if (draft) clearSubmissionDraft(scope)
  return null
}

export function clearSubmissionDraft(scope: string) {
  try { sessionStorage.removeItem(draftStorageKey(scope)) }
  catch { console.warn('[submission] Unable to clear form draft') }
  notifyStateChanged(scope)
}

function nextExpiry(scope: string): number | null {
  const expiries = [readOperation(scope)?.expiresAt, readDraft(scope)?.expiresAt]
    .filter((value): value is number => typeof value === 'number')
  return expiries.length ? Math.min(...expiries) : null
}

export function watchSubmissionStateExpiry(scope: string): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => undefined
  let timer: ReturnType<typeof setTimeout> | null = null
  let scheduling = false
  const purgeAndSchedule = () => {
    if (scheduling) return
    scheduling = true
    if (timer) clearTimeout(timer)
    const expiresAt = nextExpiry(scope)
    timer = expiresAt === null
      ? null
      : setTimeout(purgeAndSchedule, Math.max(0, expiresAt - Date.now() + 1))
    scheduling = false
  }
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') purgeAndSchedule()
  }
  window.addEventListener('focus', purgeAndSchedule)
  window.addEventListener(stateChangedEvent(scope), purgeAndSchedule)
  document.addEventListener('visibilitychange', handleVisibility)
  purgeAndSchedule()
  return () => {
    if (timer) clearTimeout(timer)
    window.removeEventListener('focus', purgeAndSchedule)
    window.removeEventListener(stateChangedEvent(scope), purgeAndSchedule)
    document.removeEventListener('visibilitychange', handleVisibility)
  }
}

export function onSubmissionStateExpired(scope: string, callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  const eventName = stateExpiredEvent(scope)
  window.addEventListener(eventName, callback)
  return () => window.removeEventListener(eventName, callback)
}
