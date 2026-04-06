'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Mail, MapPin, Phone, Menu, X, Search, Check } from 'lucide-react'

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
    <header className="w-full">
      <div className="mx-auto max-w-[1400px] px-4">
          <div className="flex items-center gap-8 h-[70px]">

            {/* Logo */}
            <Link href="/" className="shrink-0">
              <div className="text-[2.2rem] font-extrabold text-gray-900 tracking-tight leading-none">
                electro<span className="text-[#0066cc]">magaz</span><span className="text-[#0066cc]">.</span>
              </div>
            </Link>

            {/* Address */}
            <div className="hidden lg:flex flex-col leading-snug gap-1">
              <button 
                onClick={() => setCityModalOpen(true)}
                className="flex items-center gap-1.5 text-[15px] font-extrabold text-gray-900 hover:text-[#0066cc] transition-colors"
              >
                <MapPin size={15} className="text-[#0066cc]" />
                {selectedCity}
              </button>
              <span className="text-[12px] text-gray-400 pl-[22px]">Магазины и оптовые отделы</span>
            </div>

            {/* Phone */}
            <div className="hidden lg:flex flex-col leading-snug gap-1">
              <a href="tel:+78005553535" className="flex items-center gap-1.5 text-[15px] font-extrabold text-gray-900 hover:text-[#0066cc] transition-colors">
                <Phone size={15} className="text-[#0066cc]" />
                8 (800) 555-35-35
              </a>
              <a href="mailto:info@electromagaz.ru" className="text-[12px] text-gray-400 pl-[22px] hover:text-[#0066cc] transition-colors">
                info@electromagaz.ru
              </a>
            </div>

            {/* Nav links */}
            <nav className="hidden lg:flex items-center gap-6 ml-auto text-[14px] font-semibold text-gray-700">
              <Link href="/delivery" className="hover:text-[#0066cc] transition-colors">Доставка</Link>
              <Link href="/brands"   className="hover:text-[#0066cc] transition-colors">Бренды</Link>
              <a href="mailto:info@electromagaz.ru" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                <Mail size={14} />
                Написать
              </a>
            </nav>

            {/* Mobile burger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden ml-auto flex items-center justify-center size-9 text-gray-600 hover:bg-gray-100 transition-all"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-gray-200 bg-white animate-slide-down">
          <div className="mx-auto max-w-[1400px] px-4 py-3 space-y-1">
            <Link href="/catalog"  onClick={() => setMobileOpen(false)} className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Каталог</Link>
            <Link href="/brands"   onClick={() => setMobileOpen(false)} className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Бренды</Link>
            <Link href="/delivery" onClick={() => setMobileOpen(false)} className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Доставка</Link>
          </div>
        </div>
      )}

      {/* City Modal */}
      {cityModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={() => setCityModalOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white rounded-lg shadow-2xl z-[100] max-h-[500px] overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск города"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full h-10 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0066cc]"
                />
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[400px]">
              {filteredCities.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {filteredCities.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleCitySelect(city.name)}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all ${
                        selectedCity === city.name
                          ? 'bg-[#e8f4ff] text-[#0066cc] font-semibold ring-2 ring-[#0066cc]'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{city.name}</div>
                        <div className="text-xs text-gray-400 truncate">{city.region}</div>
                      </div>
                      {selectedCity === city.name && (
                        <Check size={18} className="text-[#0066cc] shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
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
