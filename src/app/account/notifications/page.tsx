'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Check, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { useAuth } from '@/hooks/use-auth'

type Notification = {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'order' | 'promo' | 'system'
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Заказ доставлен',
    message: 'Ваш заказ ORD-2024-001 успешно доставлен',
    time: '2 часа назад',
    read: false,
    type: 'order',
  },
  {
    id: '2',
    title: 'Специальное предложение',
    message: 'Скидка 15% на все резисторы до конца недели',
    time: '5 часов назад',
    read: false,
    type: 'promo',
  },
  {
    id: '3',
    title: 'Товар снова в наличии',
    message: 'Микроконтроллер ATmega328P-PU теперь доступен для заказа',
    time: 'Вчера',
    read: true,
    type: 'system',
  },
  {
    id: '4',
    title: 'Изменение статуса заказа',
    message: 'Заказ ORD-2024-002 передан в службу доставки',
    time: '2 дня назад',
    read: true,
    type: 'order',
  },
]

const typeColors = {
  order: 'bg-blue-50 text-blue-600',
  promo: 'bg-orange-50 text-orange-600',
  system: 'bg-gray-50 text-gray-600',
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(mockNotifications)

  if (!user) {
    return (
      <>
        <Header />
        <StickyNav />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Войдите в аккаунт</h2>
              <p className="text-gray-500 mb-4">Чтобы увидеть уведомления</p>
              <Link
                href="/account"
                className="inline-block px-6 py-2.5 bg-[#0066cc] text-white rounded hover:bg-[#0052a3] transition-colors"
              >
                Войти
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <Header />
      <StickyNav />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-[1400px] px-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-[#0066cc]">Главная</Link>
            <span>/</span>
            <Link href="/account" className="hover:text-[#0066cc]">Личный кабинет</Link>
            <span>/</span>
            <span className="text-gray-900">Уведомления</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell size={24} className="text-[#0066cc]" />
              <h1 className="text-2xl font-bold text-gray-900">Уведомления</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-[#0066cc] hover:underline"
              >
                Прочитать все
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded p-12 text-center">
              <Bell size={48} className="mx-auto text-gray-300 mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Нет уведомлений</h2>
              <p className="text-sm text-gray-500">Здесь будут важные уведомления</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${typeColors[notification.type]}`}>
                        <Bell size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <div className="text-xs text-gray-400 mt-2">{notification.time}</div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 text-[#0066cc] hover:bg-blue-50 rounded transition-colors"
                                title="Отметить как прочитанное"
                              >
                                <Check size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Удалить"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
