import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { IncomingMessage } from 'node:http'
import { createServer, type RequestOptions, type Server } from 'node:https'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TLSSocket } from 'node:tls'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { requestPinnedImage } from '@/lib/storage/pinned-image-request'

// Only the local port and ephemeral test CA change; Node's TLS, DNS callback,
// Host generation, certificate verification and socket lifecycle remain real.
const local = vi.hoisted(() => ({ port: 0, ca: undefined as string | undefined }))
vi.mock('node:https', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:https')>()
  return { ...actual, request: (
    url: URL, options: RequestOptions, callback: (response: IncomingMessage) => void,
  ) => actual.request(url, { ...options, port: local.port, ca: local.ca }, callback) }
})

let server: Server
let directory: string
let certificate: string
let observed: { host: string | undefined; sni: string | false | null } | null = null
const addresses = [{ address: '127.0.0.1', family: 4 }]

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'emg-image-tls-'))
  const config = join(directory, 'openssl.cnf')
  writeFileSync(config, '[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=ext\n[dn]\nCN=assets.lcsc.com\n[ext]\nsubjectAltName=DNS:assets.lcsc.com\nbasicConstraints=critical,CA:TRUE\n')
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes',
    '-keyout', join(directory, 'key.pem'), '-out', join(directory, 'cert.pem'),
    '-days', '1', '-config', config], { stdio: 'ignore' })
  certificate = readFileSync(join(directory, 'cert.pem'), 'utf8')
  local.ca = certificate
  server = createServer({ key: readFileSync(join(directory, 'key.pem')), cert: certificate }, (req, res) => {
    observed = { host: req.headers.host, sni: (req.socket as TLSSocket).servername }
    if (req.url === '/slow-headers') return
    res.writeHead(200)
    if (req.url === '/slow-body') { res.write('partial'); return }
    res.end('image')
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  local.port = (server.address() as AddressInfo).port
})

afterAll(async () => {
  if (server) {
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
  if (directory) rmSync(directory, { recursive: true, force: true })
})

async function body(response: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of response) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString()
}

it('connects to the pinned IP while preserving the original hostname and SNI', async () => {
  const response = await requestPinnedImage(new URL('https://assets.lcsc.com/image'), addresses, AbortSignal.timeout(2000))
  expect(response.socket.remoteAddress).toBe('127.0.0.1')
  expect(await body(response)).toBe('image')
  expect(observed).toEqual({ host: `assets.lcsc.com:${local.port}`, sni: 'assets.lcsc.com' })
})

it('rejects a trusted certificate for a different hostname', async () => {
  await expect(requestPinnedImage(new URL('https://www.mouser.com/image'), addresses, AbortSignal.timeout(2000)))
    .rejects.toMatchObject({ code: 'ERR_TLS_CERT_ALTNAME_INVALID' })
})

it('does not trust an unknown certificate authority', async () => {
  local.ca = undefined
  try {
    await expect(requestPinnedImage(new URL('https://assets.lcsc.com/image'), addresses, AbortSignal.timeout(2000)))
      .rejects.toMatchObject({ code: 'DEPTH_ZERO_SELF_SIGNED_CERT' })
  } finally { local.ca = certificate }
})

it('times out a server that never sends response headers', async () => {
  await expect(requestPinnedImage(new URL('https://assets.lcsc.com/slow-headers'), addresses, AbortSignal.timeout(100)))
    .rejects.toMatchObject({ name: 'AbortError' })
})

it('cancels an unfinished response body after headers have arrived', async () => {
  const controller = new AbortController()
  const response = await requestPinnedImage(new URL('https://assets.lcsc.com/slow-body'), addresses, controller.signal)
  const pending = body(response)
  controller.abort()
  await expect(pending).rejects.toThrow()
  expect(response.destroyed).toBe(true)
})
