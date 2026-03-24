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
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuth } from '@/hooks/use-auth'

type AuthTab = 'login' | 'register'
type AccountTab = 'profile' | 'orders'

// Mock orders
const mockOrders = [
  {
    id: 'ORD-2024-001',
    date: '15 марта 2024',
    status: 'delivered',
    statusLabel: 'Доставлен',
    total: 4850,
    items: 3,
  },
  {
    id: 'ORD-2024-002',
    date: '22 марта 2024',
    status: 'processing',
    statusLabel: 'В обработке',
    total: 12300,
    items: 7,
  },
  {
    id: 'ORD-2024-003',
    date: '28 марта 2024',
    status: 'shipped',
    statusLabel: 'В пути',
    total: 2100,
    items: 2,
  },
]

const statusColors: Record<string, string> = {
  delivered: 'text-[#166534] bg-[#166534]/8 border-[#166534]/15',
  processing: 'text-[#f97316] bg-[#f97316]/8 border-[#f97316]/15',
  shipped: 'text-blue-600 bg-blue-50 border-blue-100',
}

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
      if (!result.success) setError(result.error ?? 'Ошибка входа')
      setLoading(false)
    }, 400)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#44403c] mb-1.5">Email</label>
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full h-10 pl-9 pr-4 text-sm bg-[#fef3e8] border border-black/8 rounded-lg text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/10 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#44403c] mb-1.5">Пароль</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full h-10 pl-9 pr-10 text-sm bg-[#fef3e8] border border-black/8 rounded-lg text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/10 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a29e] hover:text-[#78716c] transition-colors"
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 text-sm font-semibold text-white bg-[#166534] hover:bg-[#15803d] disabled:opacity-60 rounded-xl transition-all btn-primary shadow-sm"
      >
        {loading ? 'Входим...' : 'Войти'}
      </button>

      <p className="text-center text-sm text-[#78716c]">
        Нет аккаунта?{' '}
        <button type="button" onClick={onSwitch} className="text-[#166534] font-medium hover:underline">
          Зарегистрироваться
        </button>
      </p>
    </form>
  )
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', company: '' })
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
      const result = register(form)
      if (!result.success) setError(result.error ?? 'Ошибка регистрации')
      setLoading(false)
    }, 400)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#44403c] mb-1.5">Имя *</label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Иван Иванов"
              required
              className="w-full h-10 pl-9 pr-4 text-sm bg-[#fef3e8] border border-black/8 rounded-lg text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/10 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#44403c] mb-1.5">Телефон</label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className="w-full h-10 pl-9 pr-4 text-sm bg-[#fef3e8] border border-black/8 rounded-lg text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/10 transition-all"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#44403c] mb-1.5">Email *</label>
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full h-10 pl-9 pr-4 text-sm bg-[#fef3e8] border border-black/8 rounded-lg text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/10 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#44403c] mb-1.5">Компания</label>
        <div className="relative">
          <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
          <input
            type="text"
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            placeholder="ООО «Название»"
            className="w-full h-10 pl-9 pr-4 text-sm bg-[#fef3e8] border border-black/8 rounded-lg text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/10 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#44403c] mb-1.5">Пароль *</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
          <input
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="Минимум 6 символов"
            required
            className="w-full h-10 pl-9 pr-10 text-sm bg-[#fef3e8] border border-black/8 rounded-lg text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/10 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a29e] hover:text-[#78716c] transition-colors"
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 text-sm font-semibold text-white bg-[#166534] hover:bg-[#15803d] disabled:opacity-60 rounded-xl transition-all btn-primary shadow-sm"
      >
        {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
      </button>

      <p className="text-center text-sm text-[#78716c]">
        Уже есть аккаунт?{' '}
        <button type="button" onClick={onSwitch} className="text-[#166534] font-medium hover:underline">
          Войти
        </button>
      </p>
    </form>
  )
}

function ProfileTab() {
  const { user, updateProfile, logout } = useAuth()
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    company: user?.company ?? '',
  })
  const [saved, setSaved] = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    updateProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* User card */}
      <div className="flex items-center gap-4 p-5 bg-[#f0fdf4] border border-[#166534]/15 rounded-xl">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#166534] text-white text-xl font-bold shrink-0">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-[#1c1917]">{user?.name}</div>
          <div className="text-sm text-[#78716c]">{user?.email}</div>
          {user?.company && <div className="text-xs text-[#a8a29e] mt-0.5">{user.company}</div>}
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-4">
        <h3 className="text-sm font-semibold text-[#1c1917]">Личные данные</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#44403c] mb-1.5">Имя</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-sm bg-[#fef3e8] border border-black/8 rounded-lg text-[#1c1917] outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/10 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#44403c] mb-1.5">Телефон</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="w-full h-10 pl-9 pr-4 text-sm bg-[#fef3e8] border border-black/8 rounded-lg text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/10 transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#44403c] mb-1.5">Компания</label>
          <div className="relative">
            <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
            <input
              type="text"
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              placeholder="ООО «Название»"
              className="w-full h-10 pl-9 pr-4 text-sm bg-[#fef3e8] border border-black/8 rounded-lg text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/10 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className={`flex items-center gap-2 h-10 px-5 text-sm font-medium rounded-xl transition-all btn-primary shadow-sm ${
              saved
                ? 'bg-[#15803d] text-white'
                : 'bg-[#166534] text-white hover:bg-[#15803d]'
            }`}
          >
            {saved ? <><Check size={14} /> Сохранено</> : 'Сохранить изменения'}
          </button>
        </div>
      </form>

      {/* Logout */}
      <div className="pt-4 border-t border-black/6">
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-[#a8a29e] hover:text-red-500 transition-colors"
        >
          <LogOut size={14} />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  )
}

function OrdersTab() {
  return (
    <div className="space-y-3">
      {mockOrders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag size={40} className="mx-auto text-[#a8a29e] opacity-40 mb-3" />
          <p className="text-sm text-[#78716c]">Заказов пока нет</p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 mt-4 text-sm text-[#166534] font-medium hover:underline"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        mockOrders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-4 bg-white border border-black/8 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#fef3e8] shrink-0">
                <ShoppingBag size={16} className="text-[#166534]" />
              </div>
              <div>
                <div className="text-sm font-medium text-[#1c1917]">{order.id}</div>
                <div className="text-xs text-[#a8a29e] mt-0.5">{order.date} · {order.items} товара</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[order.status]}`}>
                {order.statusLabel}
              </span>
              <div className="text-right">
                <div className="text-sm font-bold text-[#1c1917]">{order.total.toLocaleString('ru-RU')} ₽</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default function AccountPage() {
  const { user, mounted } = useAuth()
  const [authTab, setAuthTab] = useState<AuthTab>('login')
  const [accountTab, setAccountTab] = useState<AccountTab>('profile')

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#fffaf7]">
          <div className="mx-auto max-w-lg px-4 py-16">
            <div className="h-8 w-48 skeleton rounded mb-8 mx-auto" />
            <div className="h-96 skeleton rounded-2xl" />
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#fffaf7]">
        {/* Breadcrumb */}
        <div className="border-b border-black/8 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-[#a8a29e]">
              <Link href="/" className="hover:text-[#78716c] transition-colors">Главная</Link>
              <ChevronRight size={10} />
              <span className="text-[#78716c]">Личный кабинет</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10">
          {!user ? (
            /* ── Auth forms ── */
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-[#166534] mb-4 shadow-sm">
                  <User size={24} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-[#1c1917]">Личный кабинет</h1>
                <p className="text-sm text-[#78716c] mt-1">Войдите или создайте аккаунт</p>
              </div>

              {/* Tab switcher */}
              <div className="flex bg-[#fef3e8] border border-black/8 rounded-xl p-1 mb-6">
                {(['login', 'register'] as AuthTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAuthTab(tab)}
                    className={`flex-1 h-9 text-sm font-medium rounded-lg transition-all ${
                      authTab === tab
                        ? 'bg-white text-[#1c1917] shadow-sm'
                        : 'text-[#78716c] hover:text-[#1c1917]'
                    }`}
                  >
                    {tab === 'login' ? 'Войти' : 'Регистрация'}
                  </button>
                ))}
              </div>

              <div className="bg-white border border-black/8 rounded-2xl p-6 shadow-sm">
                {authTab === 'login' ? (
                  <LoginForm onSwitch={() => setAuthTab('register')} />
                ) : (
                  <RegisterForm onSwitch={() => setAuthTab('login')} />
                )}
              </div>
            </div>
          ) : (
            /* ── Account dashboard ── */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <div className="bg-white border border-black/8 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-black/6 bg-[#f0fdf4]">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-[#166534] text-white font-bold shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#1c1917] truncate">{user.name}</div>
                        <div className="text-xs text-[#78716c] truncate">{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <nav className="p-2">
                    {([
                      { id: 'profile', label: 'Профиль', icon: Settings },
                      { id: 'orders', label: 'Мои заказы', icon: ShoppingBag },
                    ] as { id: AccountTab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setAccountTab(id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-all ${
                          accountTab === id
                            ? 'bg-[#166534]/8 text-[#166534] font-medium'
                            : 'text-[#78716c] hover:bg-black/4 hover:text-[#1c1917]'
                        }`}
                      >
                        <Icon size={15} />
                        {label}
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Content */}
              <div className="lg:col-span-3">
                <div className="bg-white border border-black/8 rounded-xl shadow-sm p-6">
                  <h2 className="text-base font-bold text-[#1c1917] mb-5">
                    {accountTab === 'profile' ? 'Профиль' : 'Мои заказы'}
                  </h2>
                  {accountTab === 'profile' ? <ProfileTab /> : <OrdersTab />}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
