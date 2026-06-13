'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  ADMIN_COOKIE,
  SESSION_TTL_HOURS,
  checkAdminCredentials,
  createSessionToken,
} from '@/lib/admin-auth'

export async function loginAdmin(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const username = String(formData.get('username') ?? '')
  const password = String(formData.get('password') ?? '')
  if (!checkAdminCredentials(username, password)) {
    return { error: 'Неверный логин или пароль' }
  }
  const store = await cookies()
  store.set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_HOURS * 3600,
  })
  const from = String(formData.get('from') ?? '') || '/admin'
  redirect(from.startsWith('/admin') ? from : '/admin')
}

export async function logoutAdmin(): Promise<void> {
  const store = await cookies()
  store.delete(ADMIN_COOKIE)
  redirect('/admin/login')
}
