export const REQUEST_HISTORY_KEY = 'electromagaz_request_history'
export interface SavedRequest { id: string; createdAt: string }

export function loadRequestHistory(): SavedRequest[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(REQUEST_HISTORY_KEY) ?? '[]')
    if (!Array.isArray(data)) return []
    return data.filter((item): item is SavedRequest => !!item && typeof item === 'object'
      && typeof item.id === 'string' && /^[a-z0-9]{20,40}$/.test(item.id)
      && typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt))).slice(0, 20)
  } catch { return [] }
}

export function rememberRequest(id: string) {
  const requests = [{ id, createdAt: new Date().toISOString() }, ...loadRequestHistory().filter((item) => item.id !== id)].slice(0, 20)
  try { localStorage.setItem(REQUEST_HISTORY_KEY, JSON.stringify(requests)) }
  catch { console.warn('[requests] Unable to save local request history') }
}
