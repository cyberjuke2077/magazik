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
      color: 'text-gray-600',
      bg: 'bg-gray-50',
    },
    {
      label: 'Всего заказов',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
    },
    {
      label: 'Клиентов',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
    },
    {
      label: 'Средний чек',
      value: `${Math.round(stats.averageOrderValue).toLocaleString('ru-RU')} ₽`,
      icon: TrendingUp,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="p-5 bg-white border border-gray-200 rounded-lg"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex size-10 items-center justify-center rounded ${stat.bg}`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
            <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart (simple bar chart) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Выручка по дням</h3>
        <div className="space-y-3">
          {stats.revenueByDay.map((day) => {
            const maxRevenue = Math.max(...stats.revenueByDay.map((d) => d.revenue))
            const widthPercent = (day.revenue / maxRevenue) * 100
            return (
              <div key={day.date} className="flex items-center gap-3">
                <div className="text-sm text-gray-600 w-20 shrink-0">
                  {new Date(day.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                </div>
                <div className="flex-1 h-9 bg-gray-100 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-[#0066cc]"
                    style={{ width: `${widthPercent}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-sm font-medium text-white mix-blend-difference">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Заказы по статусам</h3>
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
                processing: 'bg-orange-500',
                shipped: 'bg-blue-500',
                delivered: 'bg-green-500',
                cancelled: 'bg-gray-400',
              }
              return (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`size-2.5 rounded-full ${statusColors[item.status]}`} />
                    <span className="text-sm text-gray-700">{statusLabels[item.status]}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрая статистика</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded bg-gray-50">
                <Package size={18} className="text-gray-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Товаров в каталоге</div>
                <div className="text-base font-semibold text-gray-900">12 позиций</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded bg-gray-50">
                <Clock size={18} className="text-gray-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Активных заказов</div>
                <div className="text-base font-semibold text-gray-900">
                  {stats.ordersByStatus.filter((s) => ['pending', 'processing', 'shipped'].includes(s.status)).reduce((sum, s) => sum + s.count, 0)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded bg-gray-50">
                <TrendingUp size={18} className="text-gray-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Конверсия</div>
                <div className="text-base font-semibold text-gray-900">87.5%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
