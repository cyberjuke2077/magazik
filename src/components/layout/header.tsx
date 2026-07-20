'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Check, Mail, MapPin, Menu, Phone, Search, X } from 'lucide-react'
import { COMPANY } from '@/lib/company'

const cities = [
  { name: 'Москва', region: 'Московская область' },
  { name: 'Санкт-Петербург', region: 'Ленинградская область' },
  { name: 'Новосибирск', region: 'Новосибирская область' },
  { name: 'Екатеринбург', region: 'Свердловская область' },
  { name: 'Казань', region: 'Республика Татарстан' },
  { name: 'Нижний Новгород', region: 'Нижегородская область' },
  { name: 'Челябинск', region: 'Челябинская область' },
  { name: 'Самара', region: 'Самарская область' },
  { name: 'Омск', region: 'Омская область' },
  { name: 'Ростов-на-Дону', region: 'Ростовская область' },
  { name: 'Уфа', region: 'Республика Башкортостан' },
  { name: 'Воронеж', region: 'Воронежская область' },
  { name: 'Волгоград', region: 'Волгоградская область' },
  { name: 'Красноярск', region: 'Красноярский край' },
  { name: 'Пермь', region: 'Пермский край' },
  { name: 'Тюмень', region: 'Тюменская область' },
  { name: 'Саратов', region: 'Саратовская область' },
  { name: 'Краснодар', region: 'Краснодарский край' },
  { name: 'Ижевск', region: 'Удмуртская Республика' },
  { name: 'Ульяновск', region: 'Ульяновская область' },
  { name: 'Владивосток', region: 'Приморский край' },
  { name: 'Ярославль', region: 'Ярославская область' },
  { name: 'Иркутск', region: 'Иркутская область' },
  { name: 'Хабаровск', region: 'Хабаровский край' },
  { name: 'Архангельск', region: 'Архангельская область' },
  { name: 'Белгород', region: 'Белгородская область' },
  { name: 'Брянск', region: 'Брянская область' },
  { name: 'Владимир', region: 'Владимирская область' },
  { name: 'Калуга', region: 'Калужская область' },
  { name: 'Курск', region: 'Курская область' },
  { name: 'Липецк', region: 'Липецкая область' },
  { name: 'Мурманск', region: 'Мурманская область' },
  { name: 'Пенза', region: 'Пензенская область' },
  { name: 'Псков', region: 'Псковская область' },
  { name: 'Рязань', region: 'Рязанская область' },
  { name: 'Смоленск', region: 'Смоленская область' },
  { name: 'Тамбов', region: 'Тамбовская область' },
  { name: 'Тверь', region: 'Тверская область' },
  { name: 'Тула', region: 'Тульская область' },
  { name: 'Астрахань', region: 'Астраханская область' },
  { name: 'Барнаул', region: 'Алтайский край' },
  { name: 'Кемерово', region: 'Кемеровская область' },
  { name: 'Киров', region: 'Кировская область' },
  { name: 'Махачкала', region: 'Республика Дагестан' },
  { name: 'Новокузнецк', region: 'Кемеровская область' },
  { name: 'Сочи', region: 'Краснодарский край' },
  { name: 'Ставрополь', region: 'Ставропольский край' },
  { name: 'Набережные Челны', region: 'Республика Татарстан' },
  { name: 'Чебоксары', region: 'Чувашская Республика' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cityModalOpen, setCityModalOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState('Москва')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (cityModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [cityModalOpen])

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.region.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName)
    setCityModalOpen(false)
    setSearchQuery('')
  }

  return (
    <header className="w-full border-b border-[var(--border)] bg-white">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6">
          <div className="flex h-[52px] items-center gap-5 lg:h-10">

            {/* Logo */}
            <Link href="/" className="shrink-0 lg:hidden">
              <div className="text-[22px] font-extrabold leading-none tracking-tight text-ink">
                electro<span className="text-azure">magaz</span><span className="text-azure">.</span>
              </div>
            </Link>

            {/* Address */}
            <div className="hidden items-center lg:flex">
              <button 
                onClick={() => setCityModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-ink-2 transition-colors hover:text-azure"
              >
                <MapPin size={14} className="text-azure" />
                {selectedCity}
              </button>
            </div>

            {/* Phone */}
            <div className="hidden items-center lg:flex">
              <a href={`tel:${COMPANY.phone.raw}`} className="flex items-center gap-1.5 text-xs font-semibold text-ink-2 transition-colors hover:text-azure">
                <Phone size={14} className="text-azure" />
                {COMPANY.phone.display}
              </a>
            </div>

            {/* Nav links */}
            <nav className="ml-auto hidden items-center gap-6 text-xs font-medium text-ink-3 lg:flex">
              <Link href="/wholesale" className="transition-colors hover:text-azure">Оптовым клиентам</Link>
              <Link href="/delivery" className="hover:text-azure transition-colors">Доставка</Link>
              <Link href="/brands"   className="hover:text-azure transition-colors">Бренды</Link>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-1.5 hover:text-azure transition-colors">
                <Mail size={14} />
                Написать
              </a>
            </nav>

            {/* Mobile burger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="ml-auto flex size-9 items-center justify-center rounded-[var(--radius-control)] text-ink-3 transition-colors hover:bg-surface-muted lg:hidden"
              aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-b border-[var(--border)] bg-white lg:hidden">
          <div className="mx-auto max-w-[1440px] space-y-1 px-3 py-3">
            <Link href="/catalog"  onClick={() => setMobileOpen(false)} className="flex items-center rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-ink-2 hover:bg-azure-light hover:text-azure">Каталог</Link>
            <Link href="/wholesale" onClick={() => setMobileOpen(false)} className="flex items-center rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-ink-2 hover:bg-azure-light hover:text-azure">Оптовым клиентам</Link>
            <Link href="/brands"   onClick={() => setMobileOpen(false)} className="flex items-center rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-ink-2 hover:bg-azure-light hover:text-azure">Бренды</Link>
            <Link href="/delivery" onClick={() => setMobileOpen(false)} className="flex items-center rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-ink-2 hover:bg-azure-light hover:text-azure">Доставка</Link>
          </div>
        </div>
      )}

      {/* City Modal */}
      {cityModalOpen && (
        <>
          <div
            className="fixed inset-0 z-[var(--layer-overlay)] bg-black/45"
            onClick={() => setCityModalOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[var(--layer-overlay)] max-h-[min(620px,90dvh)] w-[calc(100%-24px)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--radius-panel)] bg-white shadow-[var(--shadow-xl)]">
            <div className="p-4 border-b border-[var(--border)]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                <input
                  type="text"
                  placeholder="Поиск города"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full h-10 pl-9 pr-3 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:border-azure"
                />
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[400px]">
              {filteredCities.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCities.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleCitySelect(city.name)}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all ${
                        selectedCity === city.name
                          ? 'bg-azure-light text-azure font-semibold ring-2 ring-azure'
                          : 'hover:bg-[#fafafa] text-ink-2'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{city.name}</div>
                        <div className="text-xs text-ink-4 truncate">{city.region}</div>
                      </div>
                      {selectedCity === city.name && (
                        <Check size={18} className="text-azure shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-ink-4 text-sm">
                  Город не найден
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  )
}
