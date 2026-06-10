import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { RequestStatusBadge, REQUEST_STATUS_OPTIONS } from './status-badge'

export const dynamic = 'force-dynamic'

const FILTERS = [{ value: '', label: 'Все' }, ...REQUEST_STATUS_OPTIONS]

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const where = status ? { status } : {}
  const requests = await prisma.quoteRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { _count: { select: { items: true } } },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Заявки</h1>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/requests?status=${f.value}` : '/admin/requests'}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              (status ?? '') === f.value
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-8 text-center">
          Заявок нет
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Компания</th>
                <th className="px-4 py-3 font-medium">Контакт</th>
                <th className="px-4 py-3 font-medium">Позиций</th>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/requests/${r.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {r.companyName}
                    </Link>
                    {r.inn && <div className="text-xs text-gray-400">ИНН {r.inn}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{r.contactPerson}</div>
                    <div className="text-xs text-gray-400">{r.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r._count.items}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {r.createdAt.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <RequestStatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
