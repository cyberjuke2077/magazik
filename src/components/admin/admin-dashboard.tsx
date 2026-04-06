'use client'

import { TrendingUp, ShoppingBag, Users, DollarSign, Package, Clock } from 'lucide-react'
import { mockAdminStats } from '@/lib/admin-mock-data'

export function AdminDashboard() {
  const stats = mockAdminStats

  const statCards = [
    {
      label: 'Общая выручка',
      value: `${stats.totalRevenue.toLocaleString('ru-RU')} ₽`,
      icon: DollarSign,
      color: 'text-[#0066cc]',
      bg: 'bg-[#e8f4ff]',
    },
    {
      label: 'Всего заказов',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'text-[#f97316]',
      bg: 'bg-orange-50',
    },
    {
      label: 'Клиентов',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-[#0066cc]',
      bg: 'bg-[#e8f4ff]',
    },
    {
      label: 'Средний чек',
      value: `${Math.round(stats.averageOrderValue).toLocaleString('ru-RU')} ₽`,
      icon: TrendingUp,
      color: 'text-[#0066cc]',
      bg: 'bg-[#e8f4ff]',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="flex items-start gap-4 p-5 bg-white border border-black/8 rounded shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`flex size-12 items-center justify-center rounded ${stat.bg} shrink-0`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div>
              <div className="text-xs text-[#78716c] mb-1">{stat.label}</div>
              <div className="text-xl font-bold text-[#1c1917]">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart (simple bar chart) */}
      <div className="bg-white border border-black/8 rounded shadow-sm p-6">
        <h3 className="text-sm font-semibold text-[#1c1917] mb-4">Выручка по дням</h3>
        <div className="space-y-3">
          {stats.revenueByDay.map((day) => {
            const maxRevenue = Math.max(...stats.revenueByDay.map((d) => d.revenue))
            const widthPercent = (day.revenue / maxRevenue) * 100
            return (
              <div key={day.date} className="flex items-center gap-3">
                <div className="text-xs text-[#78716c] w-20 shrink-0">
                  {new Date(day.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                </div>
                <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-[#0066cc] transition-all duration-500"
                    style={{ width: `${widthPercent}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs font-medium text-white mix-blend-difference">
                      {day.revenue.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Orders by status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-black/8 rounded shadow-sm p-6">
          <h3 className="text-sm font-semibold text-[#1c1917] mb-4">Заказы по статусам</h3>
          <div className="space-y-3">
            {stats.ordersByStatus.map((item) => {
              const statusLabels: Record<string, string> = {
                pending: 'Ожидает оплаты',
                processing: 'В обработке',
                shipped: 'В пути',
                delivered: 'Доставлен',
                cancelled: 'Отменён',
              }
              const statusColors: Record<string, string> = {
                pending: 'bg-yellow-500',
                processing: 'bg-[#f97316]',
                shipped: 'bg-blue-500',
                delivered: 'bg-[#0066cc]',
                cancelled: 'bg-gray-400',
              }
              return (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`size-3 rounded-sm ${statusColors[item.status]}`} />
                    <span className="text-sm text-[#44403c]">{statusLabels[item.status]}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1c1917]">{item.count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-white border border-black/8 rounded shadow-sm p-6">
          <h3 className="text-sm font-semibold text-[#1c1917] mb-4">Быстрая статистика</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded bg-[#e8f4ff] shrink-0">
                <Package size={16} className="text-[#0066cc]" />
              </div>
              <div>
                <div className="text-xs text-[#78716c]">Товаров в каталоге</div>
                <div className="text-sm font-semibold text-[#1c1917]">12 позиций</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded bg-orange-50 shrink-0">
                <Clock size={16} className="text-[#f97316]" />
              </div>
              <div>
                <div className="text-xs text-[#78716c]">Активных заказов</div>
                <div className="text-sm font-semibold text-[#1c1917]">
                  {stats.ordersByStatus.filter((s) => ['pending', 'processing', 'shipped'].includes(s.status)).reduce((sum, s) => sum + s.count, 0)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded bg-[#e8f4ff] shrink-0">
                <TrendingUp size={16} className="text-[#0066cc]" />
              </div>
              <div>
                <div className="text-xs text-[#78716c]">Конверсия</div>
                <div className="text-sm font-semibold text-[#1c1917]">87.5%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
