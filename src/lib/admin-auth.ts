/**
 * Авторизация админ-панели: один администратор, пароль в env,
 * сессия — подписанный HMAC-SHA256 токен в httpOnly-cookie.
 *
 * Web Crypto API — работает и в edge-middleware, и в server actions.
 *
 * Env:
 *   ADMIN_USERNAME        — логин входа в /admin (по умолчанию "admin")
 *   ADMIN_PASSWORD        — пароль входа в /admin
 *   ADMIN_SESSION_SECRET  — ключ подписи сессионных токенов (random 32+ байт)
 */

export const ADMIN_COOKIE = 'emg_admin'
export const SESSION_TTL_HOURS = 24 * 7 // неделя

function getSigningKey(): string {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s) throw new Error('ADMIN_SESSION_SECRET не задан')
  if (new TextEncoder().encode(s).length < 32) {
    throw new Error('ADMIN_SESSION_SECRET должен содержать не менее 32 байт')
  }
  // Пароль в материале ключа: смена ADMIN_PASSWORD инвалидирует все
  // активные сессии (старые подписи перестают сходиться).
  return `${s}:${process.env.ADMIN_PASSWORD ?? ''}`
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSigningKey()),
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

/** Constant-time сравнение строк равной длины. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
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
  return timingSafeEqual(expected, token.slice(dot + 1))
}

/**
 * Проверка логина и пароля админа. Хэшируем логин и пароль раздельно
 * и сравниваем constant-time — без утечки длины и без short-circuit.
 */
export async function checkAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const expectedPassword = process.env.ADMIN_PASSWORD
  const expectedUsername = process.env.ADMIN_USERNAME ?? 'admin'
  if (!expectedPassword) return false
  const userOk = timingSafeEqual(await hmac(username), await hmac(expectedUsername))
  const passOk = timingSafeEqual(await hmac(password), await hmac(expectedPassword))
  return userOk && passOk
}
