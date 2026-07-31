import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STATUS_META: Record<string, { label: string; cls: string }> = {
  new: { label: 'Новая', cls: 'bg-amber-100 text-amber-800' },
  in_progress: { label: 'В работе', cls: 'bg-blue-100 text-blue-800' },
  closed: { label: 'Закрыта', cls: 'bg-gray-100 text-gray-600' },
}

export default async function AdminWholesalePage() {
  const leads = await prisma.wholesaleLead.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Оптовые заявки</h1>
        <p className="text-sm text-gray-500 mt-1">Лиды со страницы «Оптом» (/wholesale)</p>
      </div>

      {leads.length === 0 ? (
        <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-8 text-center">
          Заявок нет
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
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
                const meta =
                  STATUS_META[l.status] ?? { label: l.status, cls: 'bg-gray-100 text-gray-600' }
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
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {l.createdAt.toLocaleString('ru-RU', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}
                      >
                        {meta.label}
                      </span>
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
