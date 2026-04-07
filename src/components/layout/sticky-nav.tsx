'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { ShoppingCart, Search, User, Package, Eye, EyeOff, Mail, Lock, Phone, Building2, Heart, Clock, Settings, Bell, CreditCard, MapPin, HelpCircle, LogOut } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { categories } from '@/lib/mock-data'
import { CategoryIcon } from '@/components/ui/component-icons'

export function StickyNav() {
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { items, totalPrice, mounted: cartMounted } = useCart()
  const cartCount = items.length
  const { user, mounted: authMounted, logout } = useAuth()
  const catalogRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) {
        setCatalogOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (authModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [authModalOpen])

  const formattedTotal = cartMounted
    ? totalPrice.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
    : ''

  return (
    <div className="sticky top-0 z-50">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="flex items-center h-[68px] rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.12),_0_4px_12px_rgba(0,102,204,0.15)] bg-white">

          {/* Catalog button */}
          <div ref={catalogRef} className="relative shrink-0">
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              className={`flex items-center gap-3 h-[68px] px-7 font-bold transition-all rounded-l ${
                catalogOpen
                  ? 'bg-[#0052a3] text-white'
                  : 'bg-[#0066cc] text-white hover:bg-[#0052a3]'
              }`}
            >
              <div className="grid grid-cols-3 gap-[2px] shrink-0">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="size-[4px] bg-white/90" />
                ))}
              </div>
              <span className="text-[16px]">Каталог</span>
            </button>

            {/* Mega menu */}
            {catalogOpen && (
              <div className="absolute top-full left-0 mt-0 w-[600px] bg-white border border-gray-200 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden animate-slide-down z-50">
                <div className="p-3 grid grid-cols-2 gap-0.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/catalog?category=${cat.slug}`}
                      onClick={() => setCatalogOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex size-8 items-center justify-center bg-[#e8f4ff] shrink-0">
                        <CategoryIcon slug={cat.slug} size={20} className="text-[#0066cc]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-gray-800 group-hover:text-[#0066cc] transition-colors truncate">
                          {cat.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{cat.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-500">500 000+ позиций</span>
                    <Link
                      href="/catalog"
                      onClick={() => setCatalogOpen(false)}
                      className="text-xs font-semibold text-[#0066cc] hover:underline"
                    >
                    Весь каталог →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Search — с тремя точками справа */}
          <div className="flex-1">
            <div className="relative bg-white h-[68px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Поиск среди 500 000 товаров"
                className="w-full h-full pl-12 pr-4 text-[16px] bg-transparent text-gray-900 placeholder-gray-400 outline-none"
              />
              {/* Три точки — декоративный элемент */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-[3px]">
                <div className="w-1 h-1 rounded-full bg-gray-400" />
                <div className="w-1 h-1 rounded-full bg-gray-400" />
                <div className="w-1 h-1 rounded-full bg-gray-400" />
              </div>
            </div>
          </div>

          {/* Right icons — постоянный серый фон */}
          <div className="hidden lg:flex items-stretch shrink-0 bg-gray-100 h-[68px] rounded-r">
            {authMounted && (
              user ? (
                <div ref={profileRef} className="relative">
                  <button
                    onMouseEnter={() => setProfileDropdownOpen(true)}
                    className="flex flex-col items-center justify-center gap-1.5 px-6 text-gray-600 hover:text-[#0066cc] transition-colors h-full"
                  >
                    <div className="flex size-7 items-center justify-center rounded-full bg-[#0066cc] text-white text-[11px] font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[13px] leading-none whitespace-nowrap">{user.name.split(' ')[0]}</span>
                  </button>

                  {profileDropdownOpen && (
                    <div
                      onMouseEnter={() => setProfileDropdownOpen(true)}
                      onMouseLeave={() => setProfileDropdownOpen(false)}
                      className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-slide-down"
                    >
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-[#0066cc] text-white text-sm font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{user.name}</div>
                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                          </div>
                        </div>
                      </div>

                      {/* Main menu items */}
                      <div className="py-1">
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <User size={18} className="text-gray-400" />
                          <span>Личный кабинет</span>
                        </Link>
                        
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Package size={18} className="text-gray-400" />
                          <span>Мои заказы</span>
                        </Link>

                        <Link
                          href="/account/favorites"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Heart size={18} className="text-gray-400" />
                          <span>Избранное</span>
                        </Link>

                        <Link
                          href="/account/history"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Clock size={18} className="text-gray-400" />
                          <span>История просмотров</span>
                        </Link>
                      </div>

                      {/* Settings section */}
                      <div className="border-t border-gray-100 py-1">
                        <Link
                          href="/account/notifications"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Bell size={18} className="text-gray-400" />
                          <span>Уведомления</span>
                        </Link>

                        <Link
                          href="/account/payment"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <CreditCard size={18} className="text-gray-400" />
                          <span>Способы оплаты</span>
                        </Link>

                        <Link
                          href="/account/addresses"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <MapPin size={18} className="text-gray-400" />
                          <span>Адреса доставки</span>
                        </Link>

                        <Link
                          href="/account/settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Settings size={18} className="text-gray-400" />
                          <span>Настройки</span>
                        </Link>
                      </div>

                      {/* Help section */}
                      <div className="border-t border-gray-100 py-1">
                        <Link
                          href="/help"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <HelpCircle size={18} className="text-gray-400" />
                          <span>Помощь</span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={() => {
                            logout()
                            setProfileDropdownOpen(false)
                            window.location.reload()
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                        >
                          <LogOut size={18} />
                          <span>Выйти</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-1.5 px-6 text-gray-600 hover:text-[#0066cc] transition-colors"
                >
                  <User size={26} strokeWidth={1.5} />
                  <span className="text-[13px] leading-none">Вход</span>
                </button>
              )
            )}

            <Link
              href="/account"
              className="flex flex-col items-center justify-center gap-1.5 px-6 text-gray-600 hover:text-[#0066cc] transition-colors"
            >
              <Package size={26} strokeWidth={1.5} />
              <span className="text-[13px] leading-none">Статус заказа</span>
            </Link>

            <Link
              href="/cart"
              className="flex flex-col items-center justify-center gap-1.5 px-6 text-gray-600 hover:text-[#0066cc] transition-colors relative"
            >
              <div className="relative">
                <ShoppingCart size={26} strokeWidth={1.5} />
                <span className="absolute -top-2 -right-2.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-[#f97316] text-white leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              </div>
              <span className="text-[13px] leading-none font-bold text-gray-800">
                {cartMounted && totalPrice > 0 ? `${formattedTotal} ₽` : 'Запрос'}
              </span>
            </Link>
          </div>

          {/* Mobile cart */}
          <Link href="/cart" className="lg:hidden relative flex items-center justify-center size-9 text-gray-600">
            <ShoppingCart size={20} />
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full text-[9px] font-bold bg-[#f97316] text-white">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          </Link>
        </div>
      </div>

      {/* Auth Modal */}
      {authModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={() => setAuthModalOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-2xl z-[100] overflow-hidden">
            <AuthModalContent onClose={() => setAuthModalOpen(false)} />
          </div>
        </>
      )}
    </div>
  )
}

function AuthModalContent({ onClose }: { onClose: () => void }) {
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {authTab === 'login' ? 'Вход' : 'Регистрация'}
        </h2>
      </div>

      {authTab === 'login' ? (
        <LoginFormModal onClose={onClose} onSwitchToRegister={() => setAuthTab('register')} />
      ) : (
        <RegisterFormModal onClose={onClose} onSwitchToLogin={() => setAuthTab('login')} />
      )}
    </div>
  )
}

function LoginFormModal({ onClose, onSwitchToRegister }: { onClose: () => void; onSwitchToRegister: () => void }) {
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
        onClose()
        window.location.reload()
      }
    }, 400)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1.5">Email</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Введите email"
            required
            className="w-full h-10 px-3 text-sm border border-gray-300 rounded text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1.5">Пароль</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              className="w-full h-10 px-3 pr-10 text-sm border border-gray-300 rounded text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 text-sm font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] disabled:opacity-50 rounded transition-colors"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <span className="font-semibold text-gray-900">Нет аккаунта?</span>{' '}
        <button
          onClick={onSwitchToRegister}
          className="text-gray-600 hover:text-[#f97316] transition-colors underline"
        >
          Зарегистрироваться
        </button>
      </div>
    </>
  )
}

function RegisterFormModal({ onClose, onSwitchToLogin }: { onClose: () => void; onSwitchToLogin: () => void }) {
  const { register } = useAuth()
  const [userType, setUserType] = useState<'individual' | 'self-employed' | 'legal-entity'>('individual')
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    phone: '', 
    companyName: '', 
    inn: '', 
    position: '' 
  })
  const [showPw, setShowPw] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [termsError, setTermsError] = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setTermsError(false)
    
    if (!agreedToTerms) {
      setTermsError(true)
      setTimeout(() => setTermsError(false), 2000)
      return
    }
    
    if (form.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    if (userType !== 'individual' && !form.inn) {
      setError('ИНН обязателен для юридических лиц и ИП')
      return
    }
    
    setLoading(true)
    setTimeout(() => {
      const result = register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        userType,
        companyName: form.companyName,
        inn: form.inn,
        position: form.position,
      })
      if (!result.success) {
        setError(result.error ?? 'Ошибка регистрации')
        setLoading(false)
      } else {
        setLoading(false)
        onClose()
        window.location.reload()
      }
    }, 400)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Type Selection */}
        <div>
          <label className="block text-sm text-gray-700 mb-2">Тип покупателя</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setUserType('individual')}
              className={`px-3 py-2 text-xs border rounded transition-colors ${
                userType === 'individual'
                  ? 'border-[#0066cc] text-[#0066cc] font-medium'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              Физ. лицо
            </button>
            <button
              type="button"
              onClick={() => setUserType('self-employed')}
              className={`px-3 py-2 text-xs border rounded transition-colors ${
                userType === 'self-employed'
                  ? 'border-[#0066cc] text-[#0066cc] font-medium'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              ИП
            </button>
            <button
              type="button"
              onClick={() => setUserType('legal-entity')}
              className={`px-3 py-2 text-xs border rounded transition-colors ${
                userType === 'legal-entity'
                  ? 'border-[#0066cc] text-[#0066cc] font-medium'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              Юр. лицо
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1.5">Имя</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Иван Петров"
            required
            className="w-full h-10 px-3 text-sm border border-gray-300 rounded text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="email@example.com"
            required
            className="w-full h-10 px-3 text-sm border border-gray-300 rounded text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1.5">Пароль</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="Минимум 6 символов"
              required
              className="w-full h-10 px-3 pr-10 text-sm border border-gray-300 rounded text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1.5">Телефон</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+7 (999) 123-45-67"
            className="w-full h-10 px-3 text-sm border border-gray-300 rounded text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] transition-colors"
          />
        </div>

        {/* Company fields - only for non-individual */}
        {userType !== 'individual' && (
          <>
            <div>
              <label className="block text-sm text-gray-700 mb-1.5">
                {userType === 'legal-entity' ? 'Название компании' : 'Название ИП'}
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                placeholder={userType === 'legal-entity' ? 'ООО "Электроника"' : 'ИП Иванов И.И.'}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1.5">ИНН *</label>
              <input
                type="text"
                value={form.inn}
                onChange={(e) => set('inn', e.target.value)}
                placeholder={userType === 'legal-entity' ? '7707083893' : '123456789012'}
                required
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1.5">Должность</label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => set('position', e.target.value)}
                placeholder="Инженер"
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] transition-colors"
              />
            </div>
          </>
        )}

        <div className={`flex items-start gap-3 pt-2 p-3 rounded transition-all ${termsError ? 'bg-red-50 animate-shake' : ''}`}>
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className={`mt-1 w-6 h-6 rounded focus:ring-[#0066cc] transition-colors cursor-pointer ${termsError ? 'border-red-500' : 'text-[#0066cc] border-gray-300'}`}
          />
          <label htmlFor="terms" className={`text-sm transition-colors ${termsError ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
            Я согласен с{' '}
            <a href="#" className={`hover:underline ${termsError ? 'text-red-600' : 'text-[#0066cc]'}`}>политикой конфиденциальности</a>
            {' '}и{' '}
            <a href="#" className={`hover:underline ${termsError ? 'text-red-600' : 'text-[#0066cc]'}`}>условиями использования</a>
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 text-sm font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] disabled:opacity-50 rounded transition-colors"
        >
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <span className="font-semibold text-gray-900">Уже есть аккаунт?</span>{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-gray-600 hover:text-[#f97316] transition-colors underline"
        >
          Войти
        </button>
      </div>
    </>
  )
}
