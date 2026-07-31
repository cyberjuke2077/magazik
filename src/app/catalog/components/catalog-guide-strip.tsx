import Image from 'next/image'
import Link from 'next/link'

const guides = [
  {
    title: 'Как проверить точный MPN',
    image: '/storefront/category-mcu.jpg',
    href: '/contacts',
  },
  {
    title: 'Подбор совместимого аналога',
    image: '/storefront/category-interfaces.jpg',
    href: '/request-quote',
  },
  {
    title: 'Корпус и тип монтажа',
    image: '/storefront/category-amplifiers.jpg',
    href: '/catalog',
  },
  {
    title: 'Компоненты для серийного BOM',
    image: '/storefront/hero-components.jpg',
    href: '/wholesale',
  },
  {
    title: 'Проверка сроков поставки',
    image: '/storefront/category-power.jpg',
    href: '/delivery',
  },
]

export function CatalogGuideStrip() {
  return (
    <div className="no-scrollbar mb-3 flex h-[116px] gap-3 overflow-x-auto" data-motion-reveal>
      {guides.map((guide, index) => (
        <Link
          key={guide.title}
          href={guide.href}
          className="group relative min-w-[190px] flex-1 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-xs)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-azure-sm)]"
        >
          <Image
            src={guide.image}
            alt=""
            fill
            className="object-cover opacity-62 transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-105"
            sizes="220px"
            loading={index === 0 ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/28" />
          <div className="relative flex h-full max-w-[17ch] items-center p-4 text-[14px] font-bold leading-[1.2] text-ink">
            {guide.title}
          </div>
        </Link>
      ))}
    </div>
  )
}
