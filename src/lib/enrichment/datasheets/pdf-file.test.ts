import { describe, expect, it } from 'vitest'

import {
  datasheetStorageKey,
  downloadPdfBytes,
  isPublicIpAddress,
  validatePdfBytes,
} from './pdf-file'

const PDF = Buffer.from('%PDF-1.7\nexample\n%%EOF')
const publicDns = async (): Promise<string[]> => ['93.184.216.34']

describe('PDF validation', () => {
  it('creates a stable content-addressed R2 key', () => {
    expect(datasheetStorageKey(PDF)).toMatch(/^datasheets\/[a-f0-9]{2}\/[a-f0-9]{64}\.pdf$/)
    expect(datasheetStorageKey(PDF)).toBe(datasheetStorageKey(Buffer.from(PDF)))
  })

  it('rejects HTML disguised as a PDF', () => {
    expect(() => validatePdfBytes(Buffer.from('<html>blocked</html>'))).toThrow('PDF signature')
  })
})

describe('network safety', () => {
  it('rejects private and loopback addresses', () => {
    expect(isPublicIpAddress('127.0.0.1')).toBe(false)
    expect(isPublicIpAddress('10.0.0.1')).toBe(false)
    expect(isPublicIpAddress('192.168.1.2')).toBe(false)
    expect(isPublicIpAddress('::1')).toBe(false)
    expect(isPublicIpAddress('93.184.216.34')).toBe(true)
  })

  it('downloads a valid PDF and follows only validated redirects', async () => {
    const calls: string[] = []
    const fetchImpl = async (input: string | URL): Promise<Response> => {
      calls.push(input.toString())
      if (calls.length === 1) {
        return new Response(null, { status: 302, headers: { location: '/final.pdf' } })
      }
      return new Response(PDF, { headers: { 'content-type': 'application/pdf' } })
    }

    const result = await downloadPdfBytes('https://example.com/start', { fetchImpl, resolveHost: publicDns })
    expect(result.bytes).toEqual(PDF)
    expect(result.finalUrl).toBe('https://example.com/final.pdf')
    expect(calls).toHaveLength(2)
  })

  it('rejects HTML even when its body starts like a PDF', async () => {
    const fetchImpl = async (): Promise<Response> => new Response(PDF, {
      headers: { 'content-type': 'text/html' },
    })
    await expect(downloadPdfBytes('https://example.com/file', {
      fetchImpl,
      resolveHost: publicDns,
    })).rejects.toThrow('Content-Type')
  })

  it('rejects a host resolving to the local network before fetch', async () => {
    let fetched = false
    const fetchImpl = async (): Promise<Response> => {
      fetched = true
      return new Response(PDF, { headers: { 'content-type': 'application/pdf' } })
    }
    await expect(downloadPdfBytes('https://internal.example/file.pdf', {
      fetchImpl,
      resolveHost: async () => ['192.168.1.10'],
    })).rejects.toThrow('forbidden address')
    expect(fetched).toBe(false)
  })
})
