'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Settings, Lock, Eye, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { useAuth } from '@/hooks/use-auth'

export default function SettingsPage() {
  const { user } = useAuth()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [promoNotifications, setPromoNotifications] = useState(true)

  if (!user) {
    return (
      <>
        <Header />
        <StickyNav />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="text-center py-12">
              <Settings size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Войдите в аккаунт</h2>
              <p className="text-gray-500 mb-4">Чтобы управлять настройками</p>
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
            <span className="text-gray-900">Настройки</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Settings size={24} className="text-[#0066cc]" />
            <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
          </div>

          <div className="space-y-4">
            {/* Profile Settings */}
            <div className="bg-white border border-gray-200 rounded p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Профиль</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Имя</label>
                  <input
                    type="text"
                    defaultValue={user.name}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Телефон</label>
                  <input
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded"
                  />
                </div>
                <button className="px-4 py-2 bg-[#0066cc] text-white text-sm rounded hover:bg-[#0052a3] transition-colors">
                  Сохранить
                </button>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white border border-gray-200 rounded p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Уведомления</h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm text-gray-900">Email уведомления</div>
                    <div className="text-xs text-gray-500">О заказах на email</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-5 h-5 text-[#0066cc] rounded"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm text-gray-900">SMS уведомления</div>
                    <div className="text-xs text-gray-500">О статусе доставки</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="w-5 h-5 text-[#0066cc] rounded"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm text-gray-900">Рекламные рассылки</div>
                    <div className="text-xs text-gray-500">Об акциях и скидках</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={promoNotifications}
                    onChange={(e) => setPromoNotifications(e.target.checked)}
                    className="w-5 h-5 text-[#0066cc] rounded"
                  />
                </label>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white border border-gray-200 rounded p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Безопасность</h2>
              <div className="space-y-2">
                <button className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors w-full">
                  <Lock size={18} />
                  Изменить пароль
                </button>
                <button className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors w-full">
                  <Eye size={18} />
                  Управление сеансами
                </button>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white border border-gray-200 rounded p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Конфиденциальность</h2>
              <div className="space-y-2">
                <button className="text-sm text-gray-700 hover:text-[#0066cc] px-3 py-2">
                  Скачать мои данные
                </button>
                <button className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 rounded px-3 py-2 w-full">
                  <Trash2 size={16} />
                  Удалить аккаунт
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
