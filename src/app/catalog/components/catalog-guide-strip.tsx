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
    <div className="no-scrollbar mb-3 flex h-[112px] gap-3 overflow-x-auto">
      {guides.map((guide) => (
        <Link
          key={guide.title}
          href={guide.href}
          className="group relative min-w-[190px] flex-1 overflow-hidden rounded-xl border border-[var(--border)] bg-white"
        >
          <Image
            src={guide.image}
            alt=""
            fill
            className="object-cover opacity-62 transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.025]"
            sizes="220px"
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
