'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Trash2, Edit2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { useAuth } from '@/hooks/use-auth'

type Address = {
  id: string
  name: string
  address: string
  city: string
  postalCode: string
  phone: string
  isDefault: boolean
}

const mockAddresses: Address[] = [
  {
    id: '1',
    name: 'Дом',
    address: 'ул. Ленина, д. 10, кв. 25',
    city: 'Москва',
    postalCode: '123456',
    phone: '+7 (999) 123-45-67',
    isDefault: true,
  },
  {
    id: '2',
    name: 'Офис',
    address: 'Проспект Мира, д. 50, офис 301',
    city: 'Москва',
    postalCode: '654321',
    phone: '+7 (999) 765-43-21',
    isDefault: false,
  },
]

export default function AddressesPage() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState(mockAddresses)
  const [showAddForm, setShowAddForm] = useState(false)

  if (!user) {
    return (
      <>
        <Header />
        <StickyNav />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="text-center py-12">
              <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Войдите в аккаунт</h2>
              <p className="text-gray-500 mb-4">Чтобы управлять адресами доставки</p>
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

  const setDefault = (id: string) => {
    setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })))
  }

  const deleteAddress = (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id))
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
            <span className="text-gray-900">Адреса доставки</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MapPin size={24} className="text-[#0066cc]" />
              <h1 className="text-2xl font-bold text-gray-900">Адреса доставки</h1>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-[#0066cc] text-white text-sm rounded hover:bg-[#0052a3] transition-colors"
            >
              Добавить адрес
            </button>
          </div>

          <div className="space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className="bg-white border border-gray-200 rounded p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-[#0066cc] mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{address.name}</h3>
                        {address.isDefault && (
                          <span className="text-green-600 text-xs">
                            ✓ По умолчанию
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-0.5">
                        <div>{address.address}</div>
                        <div>{address.city}, {address.postalCode}</div>
                        <div>{address.phone}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => setDefault(address.id)}
                        className="px-3 py-1.5 text-sm text-[#0066cc] hover:bg-blue-50 rounded transition-colors"
                      >
                        Основной
                      </button>
                    )}
                    <button
                      className="p-2 text-gray-400 hover:text-[#0066cc] transition-colors"
                      title="Редактировать"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteAddress(address.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showAddForm && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center" onClick={() => setShowAddForm(false)}>
              <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Добавить адрес</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5">Название</label>
                    <input
                      type="text"
                      placeholder="Дом, Офис, и т.д."
                      className="w-full h-10 px-3 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5">Адрес</label>
                    <input
                      type="text"
                      placeholder="Улица, дом, квартира"
                      className="w-full h-10 px-3 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">Город</label>
                      <input
                        type="text"
                        placeholder="Москва"
                        className="w-full h-10 px-3 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">Индекс</label>
                      <input
                        type="text"
                        placeholder="123456"
                        className="w-full h-10 px-3 text-sm border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5">Телефон</label>
                    <input
                      type="tel"
                      placeholder="+7 (999) 123-45-67"
                      className="w-full h-10 px-3 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-[#0066cc] text-white rounded hover:bg-[#0052a3] transition-colors"
                    >
                      Добавить
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
