export const REQUEST_HISTORY_KEY = 'electromagaz_request_history'
export type RequestKind = 'quote' | 'wholesale'
export interface SavedRequest { id: string; createdAt: string; kind: RequestKind }

function isRequestKind(value: unknown): value is RequestKind {
  return value === 'quote' || value === 'wholesale'
}

function parseSavedRequest(value: unknown): SavedRequest | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Partial<SavedRequest>
  if (typeof item.id !== 'string' || !/^[a-z0-9]{20,40}$/.test(item.id)) return null
  if (typeof item.createdAt !== 'string' || Number.isNaN(Date.parse(item.createdAt))) return null
  if (item.kind !== undefined && !isRequestKind(item.kind)) return null
  return { id: item.id, createdAt: item.createdAt, kind: item.kind ?? 'quote' }
}

export function loadRequestHistory(): SavedRequest[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(REQUEST_HISTORY_KEY) ?? '[]')
    if (!Array.isArray(data)) return []
    return data.map(parseSavedRequest).filter((item): item is SavedRequest => item !== null).slice(0, 20)
  } catch { return [] }
}

export function rememberRequest(id: string, kind: RequestKind = 'quote') {
  const requests = [
    { id, kind, createdAt: new Date().toISOString() },
    ...loadRequestHistory().filter((item) => item.id !== id || item.kind !== kind),
  ].slice(0, 20)
  try { localStorage.setItem(REQUEST_HISTORY_KEY, JSON.stringify(requests)) }
  catch { console.warn('[requests] Unable to save local request history') }
}

export function requestStatusPath(request: Pick<SavedRequest, 'id' | 'kind'>) {
  return request.kind === 'wholesale'
    ? `/wholesale/status/${request.id}`
    : `/request-quote/status/${request.id}`
}
