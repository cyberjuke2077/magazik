'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  Eye,
  EyeOff,
  LogOut,
  ChevronRight,
  ShoppingBag,
  Settings,
  Check,
  AlertCircle,
  LayoutDashboard,
  Package,
  BarChart3,
  Heart,
  MapPin,
  Gift,
  CreditCard,
  FileText,
  Bell,
  Clock,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { useAuth } from '@/hooks/use-auth'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { AdminOrders } from '@/components/admin/admin-orders'
import { AdminAnalytics } from '@/components/admin/admin-analytics'
import { AdminUsers } from '@/components/admin/admin-users'

type AuthTab = 'login' | 'register'
type AdminTab = 'dashboard' | 'orders' | 'analytics' | 'users'

// Mock recent orders
const recentOrders = [
  {
    id: 'ORD-2024-003',
    date: '28 марта 2024',
    status: 'shipped',
    statusLabel: 'В пути',
    total: 2100,
    items: 2,
  },
  {
    id: 'ORD-2024-002',
    date: '22 марта 2024',
    status: 'processing',
    statusLabel: 'В обработке',
    total: 12300,
    items: 7,
  },
]

const statusColors: Record<string, string> = {
  delivered: 'text-[#0066cc] bg-[#0066cc]/8 border-[#0066cc]/15',
  processing: 'text-[#f97316] bg-[#f97316]/8 border-[#f97316]/15',
  shipped: 'text-[#0066cc] bg-[#e8f4ff] border-[#0066cc/15]',
}

const quickLinks = [
  { icon: Package, label: 'Мои заказы', href: '/account', badge: '2' },
  { icon: Heart, label: 'Избранное', href: '/account/favorites', badge: '5' },
  { icon: Clock, label: 'История', href: '/account/history' },
  { icon: Bell, label: 'Уведомления', href: '/account/notifications', badge: '3' },
  { icon: CreditCard, label: 'Оплата', href: '/account/payment' },
  { icon: MapPin, label: 'Адреса', href: '/account/addresses' },
  { icon: Settings, label: 'Настройки', href: '/account/settings' },
  { icon: Gift, label: 'Бонусы', href: '/account' },
]

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const result = login(email, password)
      if (!result.success) {
        setError(result.error ?? 'Ошибка входа')
        setLoading(false)
      } else {
        setLoading(false)
        window.location.reload()
      }
    }, 400)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Введите Email"
          required
          className="w-full h-11 px-3 text-sm border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль</label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            required
            className="w-full h-11 px-3 pr-10 text-sm border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] disabled:opacity-60 rounded-md transition-all"
      >
        {loading ? 'Входим...' : 'Войти в аккаунт'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Нет аккаунта?{' '}
        <button type="button" onClick={onSwitch} className="text-[#0066cc] hover:underline font-medium">
          Зарегистрироваться
        </button>
      </p>
    </form>
  )
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { register } = useAuth()
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    phone: '', 
    userType: 'individual' as const,
    companyName: '',
    inn: '',
    position: ''
  })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }
    setLoading(true)
    setTimeout(() => {
      const result = register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        userType: form.userType,
        companyName: form.companyName,
        inn: form.inn,
        position: form.position,
      })
      if (!result.success) {
        setError(result.error ?? 'Ошибка регистрации')
        setLoading(false)
      } else {
        setLoading(false)
        window.location.reload()
      }
    }, 400)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Имя *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Иван Петров"
          required
          className="w-full h-11 px-3 text-sm border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="email@example.com"
          required
          className="w-full h-11 px-3 text-sm border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль *</label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="Минимум 6 символов"
            required
            className="w-full h-11 px-3 pr-10 text-sm border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Телефон</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+7 (999) 123-45-67"
          className="w-full h-11 px-3 text-sm border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] disabled:opacity-60 rounded-md transition-all"
      >
        {loading ? 'Регистрируем...' : 'Создать аккаунт'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Уже есть аккаунт?{' '}
        <button type="button" onClick={onSwitch} className="text-[#0066cc] hover:underline font-medium">
          Войти
        </button>
      </p>
    </form>
  )
}

export default function AccountPage() {
  const { user, logout, isAdmin } = useAuth()
  const [authTab, setAuthTab] = useState<AuthTab>('login')
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard')

  // Admin panel
  if (user && isAdmin) {
    return (
      <>
        <Header />
        <StickyNav />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="flex gap-6">
              {/* Admin Sidebar */}
              <div className="w-64 shrink-0">
                <div className="bg-white border border-gray-200 rounded p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      <User size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">Администратор</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                  <button
                    onClick={() => setAdminTab('dashboard')}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors ${
                      adminTab === 'dashboard'
                        ? 'bg-blue-50 text-[#0066cc] border-l-2 border-[#0066cc]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <LayoutDashboard size={18} />
                    Дашборд
                  </button>
                  <button
                    onClick={() => setAdminTab('orders')}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors ${
                      adminTab === 'orders'
                        ? 'bg-blue-50 text-[#0066cc] border-l-2 border-[#0066cc]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Package size={18} />
                    Заказы
                  </button>
                  <button
                    onClick={() => setAdminTab('analytics')}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors ${
                      adminTab === 'analytics'
                        ? 'bg-blue-50 text-[#0066cc] border-l-2 border-[#0066cc]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 size={18} />
                    Аналитика
                  </button>
                  <button
                    onClick={() => setAdminTab('users')}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors ${
                      adminTab === 'users'
                        ? 'bg-blue-50 text-[#0066cc] border-l-2 border-[#0066cc]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <User size={18} />
                    Пользователи
                  </button>
                  <button
                    onClick={() => {
                      logout()
                      window.location.reload()
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                  >
                    <LogOut size={18} />
                    Выйти
                  </button>
                </div>
              </div>

              {/* Admin Content */}
              <div className="flex-1">
                {adminTab === 'dashboard' && <AdminDashboard />}
                {adminTab === 'orders' && <AdminOrders />}
                {adminTab === 'analytics' && <AdminAnalytics />}
                {adminTab === 'users' && <AdminUsers />}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // User dashboard
  if (user) {
    return (
      <>
        <Header />
        <StickyNav />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="mx-auto max-w-[1400px] px-4">
            {/* Welcome Section with Verification Badge */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Привет, {user.name.split(' ')[0]}</h1>
                {user.verificationStatus === 'verified' && (
                  <span className="px-2 py-1 bg-green-50 text-green-700 text-xs border border-green-200 rounded">
                    Верифицирован
                  </span>
                )}
                {user.verificationStatus === 'pending' && (
                  <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs border border-yellow-200 rounded">
                    На проверке
                  </span>
                )}
                {user.verificationStatus === 'unverified' && (
                  <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs border border-gray-200 rounded">
                    Не верифицирован
                  </span>
                )}
                {user.verificationStatus === 'rejected' && (
                  <span className="px-2 py-1 bg-red-50 text-red-700 text-xs border border-red-200 rounded">
                    Отклонён
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                {user.verificationStatus === 'verified' 
                  ? 'Вот что происходит с вашими заказами'
                  : 'Для совершения покупок требуется верификация аккаунта'}
              </p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {quickLinks.map((link, idx) => (
                <Link
                  key={idx}
                  href={link.href}
                  className="bg-white border border-gray-200 rounded p-4 hover:border-[#0066cc] transition-colors relative group"
                >
                  <div className="flex items-center gap-3">
                    <link.icon size={20} className="text-gray-400 group-hover:text-[#0066cc] transition-colors" />
                    <span className="text-sm text-gray-700">{link.label}</span>
                    {link.badge && (
                      <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">
                        {link.badge}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white border border-gray-200 rounded p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Мои заказы</h2>
                <Link href="/account" className="text-sm text-[#0066cc] hover:underline">
                  Посмотреть все
                </Link>
              </div>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-gray-100 rounded hover:border-gray-200 transition-colors">
                    <div>
                      <div className="font-medium text-gray-900">{order.id}</div>
                      <div className="text-sm text-gray-500 mt-1">{order.date} • {order.items} товара</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded ${statusColors[order.status]}`}>
                        {order.statusLabel}
                      </span>
                      <div className="text-lg font-semibold text-gray-900">{order.total.toLocaleString()} ₽</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Info */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded p-5">
                <div className="text-sm text-gray-500 mb-1">Личная информация</div>
                <div className="space-y-2 mb-3">
                  <div className="text-sm text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
                <Link
                  href="/account/settings"
                  className="text-sm text-[#0066cc] hover:underline"
                >
                  Редактировать →
                </Link>
              </div>

              <div className="bg-white border border-gray-200 rounded p-5">
                <div className="text-sm text-gray-500 mb-3">Полезные ссылки</div>
                <div className="space-y-2">
                  <Link href="/catalog" className="block text-sm text-gray-700 hover:text-[#0066cc]">
                    Каталог товаров
                  </Link>
                  <Link href="/help" className="block text-sm text-gray-700 hover:text-[#0066cc]">
                    Центр помощи
                  </Link>
                  <Link href="/delivery" className="block text-sm text-gray-700 hover:text-[#0066cc]">
                    Доставка и оплата
                  </Link>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded p-5">
                <div className="text-sm text-gray-500 mb-3">Аккаунт</div>
                <button
                  onClick={() => {
                    logout()
                    window.location.reload()
                  }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Выйти из аккаунта
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Login/Register forms
  return (
    <>
      <Header />
      <StickyNav />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-md px-4">
          <div className="bg-white border border-gray-200 rounded p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {authTab === 'login' ? 'Вход' : 'Регистрация'}
            </h1>

            {authTab === 'login' ? (
              <LoginForm onSwitch={() => setAuthTab('register')} />
            ) : (
              <RegisterForm onSwitch={() => setAuthTab('login')} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
