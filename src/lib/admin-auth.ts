/**
 * Авторизация админ-панели: один администратор, пароль в env,
 * сессия - подписанный HMAC-SHA256 токен в httpOnly-cookie и запись в БД.
 *
 * Web Crypto API работает в Node.js proxy и server actions.
 *
 * Env:
 *   ADMIN_USERNAME        — логин входа в /admin (по умолчанию "admin")
 *   ADMIN_PASSWORD        — пароль входа в /admin
 *   ADMIN_SESSION_SECRET  — ключ подписи сессионных токенов (random 32+ байт)
 */

import { prisma } from '@/lib/prisma'

export const ADMIN_COOKIE = 'emg_admin'
export const SESSION_TTL_HOURS = 24

interface AdminSessionInput {
  id: string
  expiresAt: Date
}

export interface AdminSessionStore {
  create(input: AdminSessionInput): Promise<void>
  exists(id: string, now: Date): Promise<boolean>
  delete(id: string): Promise<void>
  deleteExpired(now: Date): Promise<void>
}

const prismaSessionStore: AdminSessionStore = {
  async create(input) {
    await prisma.adminSession.create({ data: input })
  },
  async exists(id, now) {
    const session = await prisma.adminSession.findFirst({
      where: { id, expiresAt: { gt: now } },
      select: { id: true },
    })
    return session !== null
  },
  async delete(id) {
    await prisma.adminSession.deleteMany({ where: { id } })
  },
  async deleteExpired(now) {
    await prisma.adminSession.deleteMany({ where: { expiresAt: { lte: now } } })
  },
}

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
  // base64url без Buffer.
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

interface ParsedSessionToken {
  id: string
  exp: number
  signature: string
}

function parseSessionToken(token: string | undefined): ParsedSessionToken | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [id, rawExp, signature] = parts
  const exp = Number(rawExp)
  if (!/^[a-f0-9-]{36}$/i.test(id) || !Number.isSafeInteger(exp) || !signature) return null
  return { id, exp, signature }
}

/** Создать токен сессии: "id.exp.signature". */
export async function createSessionToken(
  store: AdminSessionStore = prismaSessionStore,
): Promise<string> {
  const id = crypto.randomUUID()
  const exp = Date.now() + SESSION_TTL_HOURS * 3600_000
  const signature = await hmac(`admin.${id}.${exp}`)
  await store.deleteExpired(new Date())
  await store.create({ id, expiresAt: new Date(exp) })
  return `${id}.${exp}.${signature}`
}

/** Проверить подпись, срок и наличие серверной сессии. */
export async function verifySessionToken(
  token: string | undefined,
  store: AdminSessionStore = prismaSessionStore,
): Promise<boolean> {
  const parsed = parseSessionToken(token)
  const now = Date.now()
  if (!parsed || parsed.exp <= now) return false
  const expected = await hmac(`admin.${parsed.id}.${parsed.exp}`)
  if (!timingSafeEqual(expected, parsed.signature)) return false
  return store.exists(parsed.id, new Date(now))
}

/** Отозвать конкретную сессию, чтобы старая cookie больше не работала. */
export async function revokeSessionToken(
  token: string | undefined,
  store: AdminSessionStore = prismaSessionStore,
): Promise<boolean> {
  const parsed = parseSessionToken(token)
  if (!parsed || !(await verifySessionToken(token, store))) return false
  await store.delete(parsed.id)
  return true
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
