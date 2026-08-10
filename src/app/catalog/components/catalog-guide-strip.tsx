import Image from 'next/image'
import Link from 'next/link'

const guides = [
  {
    title: 'Как проверить точный MPN',
    image: '/storefront/category-mcu.jpg',
    href: '/contacts',
    tone: 'bg-[#eaf8f3]',
  },
  {
    title: 'Подбор совместимого аналога',
    image: '/storefront/category-interfaces.jpg',
    href: '/request-quote',
    tone: 'bg-[#f2f4ff]',
  },
  {
    title: 'Корпус и тип монтажа',
    image: '/storefront/category-amplifiers.jpg',
    href: '/catalog',
    tone: 'bg-[#fff7dc]',
  },
  {
    title: 'Компоненты для серийного BOM',
    image: '/storefront/hero-components.jpg',
    href: '/wholesale',
    tone: 'bg-[#eff9e9]',
  },
  {
    title: 'Проверка сроков поставки',
    image: '/storefront/category-power.jpg',
    href: '/delivery',
    tone: 'bg-[#fff0f3]',
  },
]

export function CatalogGuideStrip() {
  return (
    <div className="no-scrollbar mb-3 flex h-[108px] gap-3 overflow-x-auto" data-motion-reveal>
      {guides.map((guide, index) => (
        <Link
          key={guide.title}
          href={guide.href}
          className={`group relative min-w-[190px] flex-1 overflow-hidden rounded-2xl transition-colors duration-300 hover:ring-1 hover:ring-azure/15 ${guide.tone}`}
        >
          <div className="absolute inset-y-0 right-0 w-[48%] overflow-hidden">
            <Image
              src={guide.image}
              alt=""
              fill
              className="object-cover opacity-75 transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-105"
              sizes="120px"
              loading={index < 4 ? 'eager' : 'lazy'}
              fetchPriority={index < 4 ? 'high' : 'auto'}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/55 to-transparent" />
          <div className="relative flex h-full max-w-[16ch] items-center p-4 text-[13px] font-bold leading-[1.2] text-ink">
            {guide.title}
          </div>
        </Link>
      ))}
    </div>
  )
}
