const memory = new Map<string, { hash: string; key: string }>()

// Store only a digest and an opaque key, never contact details.
export async function submissionKey(scope: string, payload: unknown): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)))
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  const storageKey = `electromagaz_submission_${scope}`
  let previous = memory.get(scope)
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (raw) previous = JSON.parse(raw)
  } catch { console.warn('[submission] Session storage unavailable; retry key kept in memory') }
  if (previous?.hash === hash && typeof previous.key === 'string') return previous.key
  const next = { hash, key: crypto.randomUUID() }
  memory.set(scope, next)
  try { sessionStorage.setItem(storageKey, JSON.stringify(next)) }
  catch { console.warn('[submission] Unable to persist retry key') }
  return next.key
}
