import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, verifySessionTokenSignature } from '@/lib/admin-session-token'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Страница логина доступна без сессии
  if (pathname === '/admin/login') return NextResponse.next()

  const token = request.cookies.get(ADMIN_COOKIE)?.value
  if (await verifySessionTokenSignature(token)) return NextResponse.next()

  // API - 401, страницы - редирект на логин
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const loginUrl = new URL('/admin/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
