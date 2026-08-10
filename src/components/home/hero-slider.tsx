import Image from 'next/image'
import Link from 'next/link'

const serviceCards = [
  {
    image: '/storefront/category-mcu.jpg',
    href: '/catalog',
    title: 'Поиск по MPN',
    description: 'Точный артикул, корпус и производитель',
    tone: 'bg-[#f2f6ff]',
  },
  {
    image: '/storefront/category-interfaces.jpg',
    href: '/request-quote',
    title: 'Подбор аналогов',
    description: 'Совместимая замена для дефицитной позиции',
    tone: 'bg-[#eef9f5]',
  },
  {
    image: '/storefront/category-converters.jpg',
    href: '/catalog?category=atsp-tsap',
    title: 'Документация',
    description: 'Характеристики, корпуса и datasheet',
    tone: 'bg-[#fff7e9]',
  },
  {
    image: '/storefront/hero-embedded.jpg',
    href: '/wholesale',
    title: 'Серийные поставки',
    description: 'Комплектация BOM и коммерческое предложение',
    tone: 'bg-[#f6f1ff]',
  },
  {
    image: '/storefront/hero-xilinx.jpg',
    href: '/brands',
    title: 'Производители',
    description: 'Компоненты ведущих мировых брендов',
    tone: 'bg-[#eef7fb]',
  },
]

export function HeroSlider() {
  return (
    <section className="bg-white pb-6 pt-5 lg:pb-8 lg:pt-6" data-motion-reveal>
      <div className="no-scrollbar mx-auto flex max-w-[1380px] gap-3 overflow-x-auto px-4 pb-1 lg:gap-4 lg:px-0">
        <Link
          href="/request-quote"
          className="group relative h-[238px] w-[292px] shrink-0 overflow-hidden rounded-2xl bg-[#eaf3ff] p-5 transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 lg:w-[310px]"
        >
          <Image
            src="/storefront/hero-components.jpg"
            alt="Электронные компоненты для комплектации спецификации"
            fill
            loading="eager"
            fetchPriority="high"
            className="object-cover opacity-30 transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="310px"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#eaf3ff] via-[#eaf3ff]/92 to-[#eaf3ff]/20" />
          <div className="relative flex h-full flex-col">
            <span className="text-[11px] font-semibold text-azure">Для инженеров и снабжения</span>
            <h1 className="mt-2 max-w-[14ch] text-[25px] font-bold leading-[1.02] tracking-[-0.035em] text-ink text-balance">
              Соберем корзину по спецификации
            </h1>
            <p className="mt-3 max-w-[30ch] text-[13px] leading-[1.45] text-ink-3">
              Пришлите список MPN. Проверим наличие, сроки и предложим аналоги.
            </p>
            <span className="mt-auto inline-flex h-9 w-fit items-center rounded-xl bg-white px-4 text-xs font-bold text-ink shadow-[var(--shadow-button)] transition-colors group-hover:bg-azure group-hover:text-white">
              Отправить список
            </span>
          </div>
        </Link>

        {serviceCards.map((card, index) => (
          <Link
            key={card.title}
            href={card.href}
            className={`group relative h-[238px] w-[210px] shrink-0 overflow-hidden rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 lg:min-w-0 lg:flex-1 ${card.tone}`}
          >
            <div className="relative z-[1]">
              <h2 className="max-w-[13ch] text-[18px] font-bold leading-[1.08] tracking-[-0.02em] text-ink">
                {card.title}
              </h2>
              <p className="mt-2 max-w-[20ch] text-[12px] leading-[1.35] text-ink-3">
                {card.description}
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[53%] overflow-hidden">
              <Image
                src={card.image}
                alt={card.title}
                fill
                loading={index < 2 ? 'eager' : 'lazy'}
                fetchPriority={index < 2 ? 'high' : 'auto'}
                className="object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="210px"
              />
              <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10 ${card.tone} opacity-10`} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
