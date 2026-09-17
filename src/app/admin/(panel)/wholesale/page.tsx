import Link from 'next/link'
import { AdminPagination, ADMIN_PAGE_SIZE, adminPage } from '@/components/admin-pagination'
import { WholesaleStatusSelect } from './status-select'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminWholesalePage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const params = await searchParams
  const page = adminPage(params.page)
  const status = typeof params.status === 'string' && ['new', 'in_progress', 'closed'].includes(params.status) ? params.status : ''
  const where = status ? { status } : {}
  const leads = await prisma.wholesaleLead.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: ADMIN_PAGE_SIZE,
    skip: (page - 1) * ADMIN_PAGE_SIZE,
  })

  const total = await prisma.wholesaleLead.count({ where })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Оптовые заявки</h1>
        <p className="text-sm text-gray-500 mt-1">Лиды со страницы «Оптом» (/wholesale)</p>
      </div>

      <nav aria-label="Фильтр оптовых заявок" className="flex flex-wrap gap-4 text-sm">
        {Object.entries({ '': 'Все', new: 'Новые', in_progress: 'В работе', closed: 'Закрытые' }).map(([value, label]) =>
          <Link key={value} className={status === value ? 'font-bold' : 'underline'} href={`/admin/wholesale${value ? `?status=${value}` : ''}`}>{label}</Link>)}
      </nav>
      <AdminPagination page={page} total={total} href={status ? `/admin/wholesale?status=${status}` : '/admin/wholesale'} />
      {leads.length === 0 ? (
        <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-8 text-center">
          Заявок нет
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Контакт</th>
                <th className="px-4 py-3 font-medium">Сообщение</th>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map((l) => {
                return (
                  <tr key={l.id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{l.name}</div>
                      {l.company && <div className="text-xs text-gray-400">{l.company}</div>}
                      <div className="text-xs text-gray-500 mt-1">
                        <a href={`tel:${l.phone}`} className="hover:underline">
                          {l.phone}
                        </a>
                      </div>
                      <div className="text-xs text-gray-500">
                        <a href={`mailto:${l.email}`} className="hover:underline">
                          {l.email}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-md">
                      {l.message ? (
                        <span className="whitespace-pre-wrap">{l.message}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {l.createdAt.toLocaleString('ru-RU', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <WholesaleStatusSelect id={l.id} current={l.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
