/**
 * Авторизация админ-панели: один администратор, пароль в env,
 * сессия - подписанный HMAC-SHA256 токен в httpOnly-cookie и запись в БД.
 *
 * Proxy проверяет только подпись через admin-session-token без запроса к БД.
 * Страницы и server actions дополнительно проверяют серверную запись сессии.
 *
 * Env:
 *   ADMIN_USERNAME        — логин входа в /admin (по умолчанию "admin")
 *   ADMIN_PASSWORD        — пароль входа в /admin
 *   ADMIN_SESSION_SECRET  — ключ подписи сессионных токенов (random 32+ байт)
 */

import { prisma } from '@/lib/prisma'
import {
  ADMIN_COOKIE,
  SESSION_TTL_HOURS,
  parseSessionToken,
  signAdminPayload,
  timingSafeEqualString,
  verifySessionTokenSignature,
} from '@/lib/admin-session-token'

export { ADMIN_COOKIE, SESSION_TTL_HOURS, verifySessionTokenSignature }

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

/** Создать токен сессии: "id.exp.signature". */
export async function createSessionToken(
  store: AdminSessionStore = prismaSessionStore,
): Promise<string> {
  const id = crypto.randomUUID()
  const exp = Date.now() + SESSION_TTL_HOURS * 3600_000
  const signature = await signAdminPayload(`admin.${id}.${exp}`)
  await store.deleteExpired(new Date())
  await store.create({ id, expiresAt: new Date(exp) })
  return `${id}.${exp}.${signature}`
}

/** Проверить подпись, срок и наличие серверной сессии. */
export async function verifySessionToken(
  token: string | undefined,
  store: AdminSessionStore = prismaSessionStore,
): Promise<boolean> {
  if (!(await verifySessionTokenSignature(token))) return false
  const parsed = parseSessionToken(token)
  const now = new Date()
  if (!parsed) return false
  return store.exists(parsed.id, now)
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
  const userOk = timingSafeEqualString(
    await signAdminPayload(username),
    await signAdminPayload(expectedUsername),
  )
  const passOk = timingSafeEqualString(
    await signAdminPayload(password),
    await signAdminPayload(expectedPassword),
  )
  return userOk && passOk
}
