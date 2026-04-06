'use client'

import { TrendingUp, Award, Package } from 'lucide-react'
import Link from 'next/link'
import { mockAdminStats } from '@/lib/admin-mock-data'

export function AdminAnalytics() {
  const stats = mockAdminStats

  return (
    <div className="space-y-6">
      {/* Top products */}
      <div className="bg-white border border-black/8 rounded shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#1c1917]">Топ продаваемых товаров</h3>
          <Award size={18} className="text-[#f97316]" />
        </div>
        <div className="space-y-3">
          {stats.topProducts.map((item, idx) => {
            const maxRevenue = Math.max(...stats.topProducts.map((p) => p.revenue))
            const widthPercent = (item.revenue / maxRevenue) * 100
            return (
              <div key={item.product.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex size-8 items-center justify-center rounded bg-[#e8f4ff] text-xs font-bold text-[#0066cc] shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="text-sm font-medium text-[#1c1917] hover:text-[#0066cc] transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <div className="text-xs text-[#a8a29e] mt-0.5">{item.product.partNumber}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-[#1c1917]">
                      {item.revenue.toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="text-xs text-[#78716c]">{item.soldCount} шт</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0066cc] to-[#0066cc]/70 transition-all duration-500"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-black/8 rounded shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1c1917]">Анализ выручки</h3>
            <TrendingUp size={18} className="text-[#0066cc]" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#e8f4ff] rounded">
              <div>
                <div className="text-xs text-[#78716c] mb-1">Средний чек</div>
                <div className="text-xl font-bold text-[#1c1917]">
                  {Math.round(stats.averageOrderValue).toLocaleString('ru-RU')} ₽
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#78716c] mb-1">Всего заказов</div>
                <div className="text-xl font-bold text-[#1c1917]">{stats.totalOrders}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#78716c]">Выручка на клиента:</span>
                <span className="font-semibold text-[#1c1917]">
                  {Math.round(stats.totalRevenue / stats.totalCustomers).toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#78716c]">Заказов на клиента:</span>
                <span className="font-semibold text-[#1c1917]">
                  {(stats.totalOrders / stats.totalCustomers).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/8 rounded shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1c1917]">Популярные категории</h3>
            <Package size={18} className="text-[#0066cc]" />
          </div>
          <div className="space-y-3">
            {[
              { name: 'Контроллеры', count: 13, revenue: 4160 },
              { name: 'Микросхемы', count: 15, revenue: 2775 },
              { name: 'Транзисторы', count: 30, revenue: 2040 },
              { name: 'Светодиоды', count: 100, revenue: 1800 },
            ].map((cat) => (
              <div key={cat.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="text-sm font-medium text-[#1c1917]">{cat.name}</div>
                  <div className="text-xs text-[#a8a29e]">{cat.count} продано</div>
                </div>
                <div className="text-sm font-bold text-[#1c1917]">
                  {cat.revenue.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance metrics */}
      <div className="bg-gradient-to-br from-[#e8f4ff] to-white border border-[#0066cc]/20 rounded shadow-sm p-6">
        <h3 className="text-sm font-semibold text-[#1c1917] mb-4">Показатели эффективности</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded shadow-sm">
            <div className="text-2xl font-bold text-[#0066cc] mb-1">87.5%</div>
            <div className="text-xs text-[#78716c]">Конверсия заказов</div>
          </div>
          <div className="text-center p-4 bg-white rounded shadow-sm">
            <div className="text-2xl font-bold text-[#0066cc] mb-1">2.2</div>
            <div className="text-xs text-[#78716c]">Товаров в заказе</div>
          </div>
          <div className="text-center p-4 bg-white rounded shadow-sm">
            <div className="text-2xl font-bold text-[#0066cc] mb-1">95%</div>
            <div className="text-xs text-[#78716c]">Успешных доставок</div>
          </div>
        </div>
      </div>
    </div>
  )
}
