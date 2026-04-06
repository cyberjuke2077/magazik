'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CreditCard, Plus, Trash2, Check } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { useAuth } from '@/hooks/use-auth'

type PaymentMethod = {
  id: string
  type: 'card' | 'bank'
  name: string
  details: string
  isDefault: boolean
}

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    name: 'Visa',
    details: '**** 4242',
    isDefault: true,
  },
  {
    id: '2',
    type: 'card',
    name: 'Mastercard',
    details: '**** 8888',
    isDefault: false,
  },
]

export default function PaymentPage() {
  const { user } = useAuth()
  const [methods, setMethods] = useState(mockPaymentMethods)
  const [showAddForm, setShowAddForm] = useState(false)

  if (!user) {
    return (
      <>
        <Header />
        <StickyNav />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="text-center py-12">
              <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Войдите в аккаунт</h2>
              <p className="text-gray-500 mb-4">Чтобы управлять способами оплаты</p>
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
    setMethods(methods.map(m => ({ ...m, isDefault: m.id === id })))
  }

  const deleteMethod = (id: string) => {
    setMethods(methods.filter(m => m.id !== id))
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
            <span className="text-gray-900">Способы оплаты</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CreditCard size={24} className="text-[#0066cc]" />
              <h1 className="text-2xl font-bold text-gray-900">Способы оплаты</h1>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-[#0066cc] text-white text-sm rounded hover:bg-[#0052a3] transition-colors"
            >
              Добавить карту
            </button>
          </div>

          <div className="space-y-3">
            {methods.map((method) => (
              <div key={method.id} className="bg-white border border-gray-200 rounded p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center">
                      <CreditCard size={20} className="text-[#0066cc]" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.details}</div>
                      {method.isDefault && (
                        <div className="inline-flex items-center gap-1 mt-1 text-green-600 text-xs">
                          <Check size={12} />
                          По умолчанию
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => setDefault(method.id)}
                        className="px-3 py-1.5 text-sm text-[#0066cc] hover:bg-blue-50 rounded transition-colors"
                      >
                        Основная
                      </button>
                    )}
                    <button
                      onClick={() => deleteMethod(method.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showAddForm && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center" onClick={() => setShowAddForm(false)}>
              <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Добавить карту</h2>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5">Номер карты</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full h-10 px-3 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">Срок действия</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full h-10 px-3 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full h-10 px-3 text-sm border border-gray-300 rounded"
                      />
                    </div>
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
