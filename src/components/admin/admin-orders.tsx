'use client'

import { useState } from 'react'
import { Search, Filter, Eye, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react'
import { mockOrders } from '@/lib/admin-mock-data'
import { type OrderStatus } from '@/types'

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Ожидает оплаты', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: Clock },
  processing: { label: 'В обработке', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: Package },
  shipped: { label: 'В пути', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Truck },
  delivered: { label: 'Доставлен', color: 'text-[#0066cc] bg-[#e8f4ff] border-[#0066cc]/20', icon: CheckCircle },
  cancelled: { label: 'Отменён', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: XCircle },
}

export function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const selectedOrderData = selectedOrder ? mockOrders.find((o) => o.id === selectedOrder) : null

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по номеру, клиенту, email..."
            className="w-full h-10 pl-9 pr-4 text-sm bg-white border border-black/8 rounded text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="h-10 pl-9 pr-8 text-sm bg-white border border-black/8 rounded text-[#1c1917] outline-none focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/10 transition-all appearance-none cursor-pointer"
          >
            <option value="all">Все статусы</option>
            {Object.entries(statusConfig).map(([status, config]) => (
              <option key={status} value={status}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white border border-black/8 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-black/8">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#44403c]">Номер заказа</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#44403c]">Клиент</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#44403c]">Дата</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#44403c]">Статус</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#44403c]">Сумма</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[#44403c]">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#78716c]">
                    Заказы не найдены
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const config = statusConfig[order.status]
                  const StatusIcon = config.icon
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-[#1c1917]">{order.orderNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-[#1c1917]">{order.customerName}</div>
                        <div className="text-xs text-[#a8a29e]">{order.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-[#44403c]">
                          {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border ${config.color}`}>
                          <StatusIcon size={12} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-semibold text-[#1c1917]">
                          {order.total.toLocaleString('ru-RU')} ₽
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedOrder(order.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0066cc] hover:bg-[#e8f4ff] rounded transition-colors"
                        >
                          <Eye size={12} />
                          Детали
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order details modal */}
      {selectedOrderData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-black/8 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1c1917]">Детали заказа {selectedOrderData.orderNumber}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#78716c] hover:text-[#1c1917] transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer info */}
              <div>
                <h4 className="text-sm font-semibold text-[#1c1917] mb-3">Информация о клиенте</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#78716c]">Имя:</span>
                    <span className="font-medium text-[#1c1917]">{selectedOrderData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#78716c]">Email:</span>
                    <span className="font-medium text-[#1c1917]">{selectedOrderData.customerEmail}</span>
                  </div>
                  {selectedOrderData.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-[#78716c]">Телефон:</span>
                      <span className="font-medium text-[#1c1917]">{selectedOrderData.customerPhone}</span>
                    </div>
                  )}
                  {selectedOrderData.shippingAddress && (
                    <div className="flex justify-between">
                      <span className="text-[#78716c]">Адрес:</span>
                      <span className="font-medium text-[#1c1917] text-right">{selectedOrderData.shippingAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order items */}
              <div>
                <h4 className="text-sm font-semibold text-[#1c1917] mb-3">Товары</h4>
                <div className="space-y-2">
                  {selectedOrderData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#1c1917]">{item.product.name}</div>
                        <div className="text-xs text-[#a8a29e]">{item.product.partNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-[#1c1917]">
                          {item.quantity} × {item.priceAtOrder.toLocaleString('ru-RU')} ₽
                        </div>
                        <div className="text-xs text-[#78716c]">
                          = {(item.quantity * item.priceAtOrder).toLocaleString('ru-RU')} ₽
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order summary */}
              <div className="border-t border-black/8 pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#78716c]">Товары:</span>
                    <span className="font-medium text-[#1c1917]">{selectedOrderData.subtotal.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#78716c]">Доставка:</span>
                    <span className="font-medium text-[#1c1917]">{selectedOrderData.shipping.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-black/6">
                    <span className="font-semibold text-[#1c1917]">Итого:</span>
                    <span className="text-lg font-bold text-[#1c1917]">{selectedOrderData.total.toLocaleString('ru-RU')} ₽</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
