import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'

export async function requireAdminPageSession(): Promise<void> {
  const store = await cookies()
  if (!(await verifySessionToken(store.get(ADMIN_COOKIE)?.value))) {
    redirect('/admin/login')
  }
}
