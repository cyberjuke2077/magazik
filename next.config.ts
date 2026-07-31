import type { NextConfig } from 'next'

const r2PublicUrl = process.env.R2_PUBLIC_URL
const r2Hostname = (() => {
  if (!r2PublicUrl) return null
  try {
    return new URL(r2PublicUrl).hostname
  } catch {
    return null
  }
})()

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.lcsc.com' },
      { protocol: 'https', hostname: '*.lcsc.com' },
      { protocol: 'https', hostname: 'www.mouser.com' },
      { protocol: 'https', hostname: '*.mouser.com' },
      { protocol: 'https', hostname: 'static.chipdip.ru' },
      ...(r2Hostname ? [{ protocol: 'https' as const, hostname: r2Hostname }] : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/request-quote/status/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
    ]
  },
}

export default nextConfig
