import { prisma } from '@/lib/prisma'
import { retryNotifications } from '../../actions'
import { AdminPagination, ADMIN_PAGE_SIZE, adminPage } from '@/components/admin-pagination'

export const dynamic = 'force-dynamic'
export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = adminPage((await searchParams).page)
  const where = { status: { not: 'sent' } }
  const [jobs, total] = await Promise.all([
    prisma.notificationJob.findMany({ where, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: ADMIN_PAGE_SIZE, skip: (page - 1) * ADMIN_PAGE_SIZE }),
    prisma.notificationJob.count({ where }),
  ])
  return <div className="space-y-5">
    <h1 className="text-2xl font-semibold">Очередь уведомлений</h1>
    <p>Сохранённые заявки не зависят от доставки уведомления. После восстановления связи можно повторить отправку.</p>
    <form action={retryNotifications}><button className="rounded bg-gray-900 px-4 py-2 text-white">Повторить недоставленные</button></form>
    <AdminPagination page={page} total={total} href="/admin/notifications" />
    <ul className="space-y-3">{jobs.map((job) => <li key={job.id} className="rounded border p-3">
      {job.kind} / {job.requestId}: {job.status}; попыток {job.attempts}; {job.lastError ?? 'ожидает отправки'}
    </li>)}</ul>
    {total === 0 && <p>Недоставленных уведомлений нет.</p>}
  </div>
}
