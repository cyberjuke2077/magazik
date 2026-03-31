import Link from 'next/link'
import { ChevronRight, ExternalLink, Search } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

interface Brand {
  id: string
  name: string
  country: string
  flag: string
  description: string
  categories: string[]
  productCount: number
  featured: boolean
  color: string
}

const brands: Brand[] = [
  {
    id: 'yageo',
    name: 'Yageo',
    country: 'Тайвань',
    flag: '🇹🇼',
    description: 'Крупнейший мировой производитель пассивных компонентов: резисторы, конденсаторы, индуктивности.',
    categories: ['Резисторы', 'Конденсаторы', 'Индуктивности'],
    productCount: 48200,
    featured: true,
    color: 'from-[#0066cc]/8 to-[#0066cc]/3',
  },
  {
    id: 'murata',
    name: 'Murata',
    country: 'Япония',
    flag: '🇯🇵',
    description: 'Ведущий производитель керамических конденсаторов, фильтров и модулей беспроводной связи.',
    categories: ['Конденсаторы', 'Фильтры', 'Модули'],
    productCount: 31500,
    featured: true,
    color: 'from-[#0066cc]/8 to-[#0066cc]/3',
  },
  {
    id: 'stmicroelectronics',
    name: 'STMicroelectronics',
    country: 'Швейцария',
    flag: '🇨🇭',
    description: 'Один из крупнейших производителей полупроводников: микроконтроллеры STM32, силовые устройства.',
    categories: ['Микроконтроллеры', 'Силовые устройства', 'Датчики'],
    productCount: 12400,
    featured: true,
    color: 'from-[#0066cc]/8 to-[#0066cc]/3',
  },
  {
    id: 'infineon',
    name: 'Infineon',
    country: 'Германия',
    flag: '🇩🇪',
    description: 'Мировой лидер в силовой электронике: MOSFET, IGBT, драйверы, микроконтроллеры для автомобилей.',
    categories: ['Транзисторы', 'Диоды', 'Микросхемы'],
    productCount: 18700,
    featured: true,
    color: 'from-[#0066cc]/8 to-[#0066cc]/3',
  },
  {
    id: 'texas-instruments',
    name: 'Texas Instruments',
    country: 'США',
    flag: '🇺🇸',
    description: 'Широкий спектр аналоговых и цифровых ИС: операционные усилители, АЦП, ЦАП, микроконтроллеры.',
    categories: ['Микросхемы', 'Операционные усилители', 'АЦП/ЦАП'],
    productCount: 24600,
    featured: true,
    color: 'from-[#f97316]/8 to-[#f97316]/3',
  },
  {
    id: 'espressif',
    name: 'Espressif',
    country: 'Китай',
    flag: '🇨🇳',
    description: 'Производитель популярных IoT-модулей ESP8266 и ESP32 с WiFi и Bluetooth.',
    categories: ['Контроллеры', 'Модули WiFi', 'Модули BT'],
    productCount: 4200,
    featured: true,
    color: 'from-[#0066cc]/8 to-[#0066cc]/3',
  },
  {
    id: 'vishay',
    name: 'Vishay',
    country: 'США',
    flag: '🇺🇸',
    description: 'Один из крупнейших производителей дискретных полупроводников и пассивных компонентов.',
    categories: ['Диоды', 'Резисторы', 'Конденсаторы'],
    productCount: 45000,
    featured: false,
    color: 'from-[#0066cc]/8 to-[#0066cc]/3',
  },
  {
    id: 'analog-devices',
    name: 'Analog Devices',
    country: 'США',
    flag: '🇺🇸',
    description: 'Специализируется на высокопроизводительных аналоговых, смешанных и цифровых ИС.',
    categories: ['Датчики', 'АЦП/ЦАП', 'Усилители'],
    productCount: 6700,
    featured: false,
    color: 'from-[#0066cc]/8 to-[#0066cc]/3',
  },
  {
    id: 'worldsemi',
    name: 'WorldSemi',
    country: 'Китай',
    flag: '🇨🇳',
    description: 'Производитель адресных светодиодов WS2812B и других RGB-компонентов.',
    categories: ['Светодиоды', 'RGB-матрицы'],
    productCount: 28000,
    featured: false,
    color: 'from-[#f97316]/8 to-[#f97316]/3',
  },
  {
    id: 'songle',
    name: 'Songle',
    country: 'Китай',
    flag: '🇨🇳',
    description: 'Производитель электромеханических реле для промышленной автоматики и бытовой техники.',
    categories: ['Реле'],
    productCount: 4200,
    featured: false,
    color: 'from-[#0066cc]/8 to-[#0066cc]/3',
  },
  {
    id: 'gct',
    name: 'GCT',
    country: 'США',
    flag: '🇺🇸',
    description: 'Производитель высококачественных разъёмов: USB, аудио, питание, промышленные.',
    categories: ['Разъёмы', 'USB', 'Клеммы'],
    productCount: 12300,
    featured: false,
    color: 'from-[#0066cc]/8 to-[#0066cc]/3',
  },
  {
    id: 'sharp',
    name: 'Sharp',
    country: 'Япония',
    flag: '🇯🇵',
    description: 'Производитель оптоэлектронных компонентов: оптопары, фотодиоды, ИК-датчики.',
    categories: ['Оптопары', 'Фотодиоды', 'Датчики'],
    productCount: 34000,
    featured: false,
    color: 'from-[#0066cc]/8 to-[#0066cc]/3',
  },
]

const featuredBrands = brands.filter((b) => b.featured)
// Китайские бренды первыми, затем остальные по алфавиту
const allBrands = [...brands].sort((a, b) => {
  const aChinese = a.country === 'Китай' ? 0 : 1
  const bChinese = b.country === 'Китай' ? 0 : 1
  if (aChinese !== bChinese) return aChinese - bChinese
  return a.name.localeCompare(b.name)
})

export default function BrandsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />

      <main>
        {/* Breadcrumb */}
        <div className="border-b border-black/8 bg-white">
          <div className="mx-auto max-w-[1400px] px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-[#a8a29e]">
              <Link href="/" className="hover:text-[#78716c] transition-colors">Главная</Link>
              <ChevronRight size={10} />
              <span className="text-[#78716c]">Бренды</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-white border-b border-black/8">
          <div className="mx-auto max-w-[1400px] px-4 py-10">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1c1917] mb-2">Бренды</h1>
            <p className="text-[#78716c] max-w-xl">
              Работаем только с официальными дистрибьюторами ведущих мировых производителей.
              Все компоненты оригинальные, с сертификатами качества.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-10 space-y-12">

          {/* Featured brands */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1c1917]">Топ производители</h2>
              <span className="text-sm text-[#a8a29e]">{featuredBrands.length} брендов</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/catalog?brand=${brand.id}`}
                  className="group relative flex flex-col bg-white border border-black/8 rounded p-5 shadow-sm card-hover overflow-hidden"
                >
                  {/* Gradient bg */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${brand.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{brand.flag}</span>
                          <span className="text-xs text-[#a8a29e]">{brand.country}</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#1c1917] group-hover:text-[#0066cc] transition-colors">
                          {brand.name}
                        </h3>
                      </div>
                      <ExternalLink size={14} className="text-[#a8a29e] group-hover:text-[#0066cc] transition-colors mt-1 shrink-0" />
                    </div>

                    <p className="text-xs text-[#78716c] leading-relaxed mb-4 line-clamp-2">
                      {brand.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {brand.categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 text-[10px] text-[#78716c] bg-[#e8f4ff] border border-black/6 rounded-sm"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-black/6">
                      <span className="text-xs text-[#a8a29e]">
                        {brand.productCount.toLocaleString('ru-RU')} позиций
                      </span>
                      <span className="text-xs font-medium text-[#0066cc] group-hover:underline">
                        Смотреть товары →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* All brands A-Z */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1c1917]">Все бренды</h2>
              <span className="text-sm text-[#a8a29e]">{allBrands.length} производителей</span>
            </div>
            <div className="bg-white border border-black/8 rounded shadow-sm overflow-hidden">
              {allBrands.map((brand, i) => (
                <Link
                  key={brand.id}
                  href={`/catalog?brand=${brand.id}`}
                  className={`flex items-center justify-between px-5 py-3.5 hover:bg-[#e8f4ff] transition-colors group ${
                    i !== 0 ? 'border-t border-black/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{brand.flag}</span>
                    <div>
                      <span className="text-sm font-medium text-[#1c1917] group-hover:text-[#0066cc] transition-colors">
                        {brand.name}
                      </span>
                      <span className="text-xs text-[#a8a29e] ml-2">{brand.country}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-wrap gap-1">
                      {brand.categories.slice(0, 2).map((cat) => (
                        <span key={cat} className="text-[10px] text-[#a8a29e] bg-[#e8f4ff] px-1.5 py-0.5 rounded border border-black/6">
                          {cat}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-[#a8a29e] shrink-0">
                      {brand.productCount.toLocaleString('ru-RU')} поз.
                    </span>
                    <ChevronRight size={14} className="text-[#a8a29e] group-hover:text-[#0066cc] transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[#0066cc] rounded p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }}
            />
            <div className="relative">
              <h2 className="text-xl font-bold text-white mb-2">Нет нужного бренда?</h2>
              <p className="text-white/70 text-sm mb-5 max-w-md mx-auto">
                Мы работаем с более чем 200 производителями. Напишите нам — найдём нужные компоненты.
              </p>
              <a
                href="mailto:info@electromagaz.ru"
                className="inline-flex items-center gap-2 h-10 px-6 text-sm font-semibold text-[#0066cc] bg-white hover:bg-white rounded transition-all btn-primary shadow-sm"
              >
                Написать запрос
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
