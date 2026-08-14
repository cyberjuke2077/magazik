import crypto from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const MAX_PDF_BYTES = 25 * 1024 * 1024
const MAX_REDIRECTS = 4
const DEFAULT_TIMEOUT_MS = 30_000
const PDF_SIGNATURE = Buffer.from('%PDF-')

type FetchImplementation = (input: string | URL, init?: RequestInit) => Promise<Response>
type ResolveHost = (hostname: string) => Promise<string[]>

export interface DownloadPdfDependencies {
  fetchImpl?: FetchImplementation
  resolveHost?: ResolveHost
}

export interface DownloadedPdf {
  bytes: Buffer
  finalUrl: string
}

export function datasheetStorageKey(bytes: Buffer): string {
  const hash = crypto.createHash('sha256').update(bytes).digest('hex')
  return `datasheets/${hash.slice(0, 2)}/${hash}.pdf`
}

export function validatePdfBytes(bytes: Buffer): void {
  if (bytes.length === 0) throw new Error('PDF is empty')
  if (bytes.length > MAX_PDF_BYTES) {
    throw new Error(`PDF is too large: ${bytes.length} > ${MAX_PDF_BYTES}`)
  }
  if (bytes.subarray(0, 1024).indexOf(PDF_SIGNATURE) === -1) {
    throw new Error('Downloaded file has no PDF signature')
  }
}

export function isPublicIpAddress(address: string): boolean {
  const kind = isIP(address)
  if (kind === 4) return isPublicIpv4(address)
  if (kind !== 6) return false

  const value = address.toLowerCase()
  if (value === '::' || value === '::1') return false
  if (value.startsWith('fc') || value.startsWith('fd')) return false
  if (/^fe[89ab]/.test(value)) return false
  if (value.startsWith('::ffff:')) return isPublicIpAddress(value.slice(7))
  return true
}

export async function downloadPdfBytes(
  sourceUrl: string,
  dependencies: DownloadPdfDependencies = {},
): Promise<DownloadedPdf> {
  const fetchImpl = dependencies.fetchImpl ?? fetch
  const resolveHost = dependencies.resolveHost ?? resolvePublicAddresses
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    let current = new URL(sourceUrl)
    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
      await assertSafeRemoteUrl(current, resolveHost)
      const response = await fetchImpl(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'electromagaz-datasheets/1.0' },
      })

      if (isRedirect(response.status)) {
        const location = response.headers.get('location')
        if (!location) throw new Error(`Redirect from ${current.hostname} has no Location`)
        if (redirect === MAX_REDIRECTS) throw new Error('Too many PDF redirects')
        current = new URL(location, current)
        continue
      }

      if (!response.ok) throw new Error(`PDF fetch failed: HTTP ${response.status}`)
      validateContentType(response.headers.get('content-type'))
      validateDeclaredLength(response.headers.get('content-length'))
      const bytes = await readLimitedBody(response)
      validatePdfBytes(bytes)
      return { bytes, finalUrl: current.toString() }
    }
    throw new Error('Too many PDF redirects')
  } finally {
    clearTimeout(timeout)
  }
}

async function assertSafeRemoteUrl(url: URL, resolveHost: ResolveHost): Promise<void> {
  if (url.protocol !== 'https:') throw new Error('Datasheet URL must use HTTPS')
  if (url.username || url.password) throw new Error('Datasheet URL must not contain credentials')
  if (url.hostname.toLowerCase() === 'localhost') throw new Error('Local datasheet host is forbidden')

  const addresses = await resolveHost(url.hostname)
  if (addresses.length === 0 || addresses.some((address) => !isPublicIpAddress(address))) {
    throw new Error(`Datasheet host resolves to a forbidden address: ${url.hostname}`)
  }
}

async function resolvePublicAddresses(hostname: string): Promise<string[]> {
  if (isIP(hostname)) return [hostname]
  const addresses = await lookup(hostname, { all: true, verbatim: true })
  return addresses.map(({ address }) => address)
}

function isPublicIpv4(address: string): boolean {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false
  }
  const [a, b] = parts
  if (a === 0 || a === 10 || a === 127) return false
  if (a === 100 && b >= 64 && b <= 127) return false
  if (a === 169 && b === 254) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && b === 168) return false
  if (a === 192 && b === 0) return false
  if (a === 198 && (b === 18 || b === 19)) return false
  if (a >= 224) return false
  return true
}

function validateContentType(value: string | null): void {
  const contentType = value?.split(';', 1)[0]?.trim().toLowerCase()
  const allowed = ['application/pdf', 'application/x-pdf', 'application/octet-stream']
  if (!contentType || !allowed.includes(contentType)) {
    throw new Error(`Unexpected PDF Content-Type: ${contentType ?? 'missing'}`)
  }
}

function validateDeclaredLength(value: string | null): void {
  if (!value) return
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes < 0) throw new Error('Invalid PDF Content-Length')
  if (bytes > MAX_PDF_BYTES) {
    throw new Error(`PDF is too large: ${bytes} > ${MAX_PDF_BYTES}`)
  }
}

async function readLimitedBody(response: Response): Promise<Buffer> {
  if (!response.body) throw new Error('PDF response body is empty')
  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_PDF_BYTES) {
      await reader.cancel('PDF exceeds size limit')
      throw new Error(`PDF is too large: more than ${MAX_PDF_BYTES}`)
    }
    chunks.push(Buffer.from(value))
  }
  return Buffer.concat(chunks, total)
}

function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308
}
