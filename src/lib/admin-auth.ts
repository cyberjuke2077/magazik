/**
 * Авторизация админ-панели: один администратор, пароль в env,
 * сессия — подписанный HMAC-SHA256 токен в httpOnly-cookie.
 *
 * Web Crypto API — работает и в edge-middleware, и в server actions.
 *
 * Env:
 *   ADMIN_PASSWORD        — пароль входа в /admin
 *   ADMIN_SESSION_SECRET  — ключ подписи сессионных токенов (random 32+ байт)
 */

export const ADMIN_COOKIE = 'emg_admin'
export const SESSION_TTL_HOURS = 24 * 7 // неделя

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s) throw new Error('ADMIN_SESSION_SECRET не задан')
  return s
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  // base64url без Buffer — edge-runtime-совместимо
  const bytes = new Uint8Array(sig)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Создать токен сессии: "exp.signature" */
export async function createSessionToken(): Promise<string> {
  const exp = Date.now() + SESSION_TTL_HOURS * 3600_000
  const payload = `admin.${exp}`
  return `${exp}.${await hmac(payload)}`
}

/** Проверить токен: подпись + срок действия. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot < 1) return false
  const exp = Number(token.slice(0, dot))
  if (!Number.isFinite(exp) || exp < Date.now()) return false
  const expected = await hmac(`admin.${exp}`)
  const actual = token.slice(dot + 1)
  if (expected.length !== actual.length) return false
  // constant-time сравнение
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ actual.charCodeAt(i)
  return diff === 0
}

/** Проверка пароля админа. */
export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return password === expected
}
