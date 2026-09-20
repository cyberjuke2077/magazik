export const ADMIN_COOKIE = 'emg_admin'
export const SESSION_TTL_HOURS = 24

export interface ParsedSessionToken {
  id: string
  exp: number
  signature: string
}

function getSigningKey(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET не задан')
  if (new TextEncoder().encode(secret).length < 32) {
    throw new Error('ADMIN_SESSION_SECRET должен содержать не менее 32 байт')
  }
  return `${secret}:${process.env.ADMIN_PASSWORD ?? ''}`
}

export async function signAdminPayload(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSigningKey()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const bytes = new Uint8Array(signature)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function timingSafeEqualString(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

export function parseSessionToken(token: string | undefined): ParsedSessionToken | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [id, rawExp, signature] = parts
  const exp = Number(rawExp)
  if (!/^[a-f0-9-]{36}$/i.test(id) || !Number.isSafeInteger(exp) || !signature) return null
  return { id, exp, signature }
}

export async function verifySessionTokenSignature(token: string | undefined): Promise<boolean> {
  const parsed = parseSessionToken(token)
  if (!parsed || parsed.exp <= Date.now()) return false
  const expected = await signAdminPayload(`admin.${parsed.id}.${parsed.exp}`)
  return timingSafeEqualString(expected, parsed.signature)
}
