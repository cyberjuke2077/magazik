import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.lcsc.com' },
      { protocol: 'https', hostname: '*.lcsc.com' },
      { protocol: 'https', hostname: 'www.mouser.com' },
      { protocol: 'https', hostname: '*.mouser.com' },
      { protocol: 'https', hostname: 'static.chipdip.ru' },
    ],
  },
}

export default nextConfig
