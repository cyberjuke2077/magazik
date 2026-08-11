import Image from 'next/image'
import Link from 'next/link'

const serviceCards = [
  {
    image: '/storefront/category-mcu.jpg',
    href: '/catalog',
    title: 'Поиск по MPN',
    description: 'Точный артикул, корпус и производитель',
    tone: 'bg-[#e6efff]',
  },
  {
    image: '/storefront/category-interfaces.jpg',
    href: '/request-quote',
    title: 'Подбор аналогов',
    description: 'Совместимая замена для дефицитной позиции',
    tone: 'bg-[#e4f8ef]',
  },
  {
    image: '/storefront/category-converters.jpg',
    href: '/catalog?category=atsp-tsap',
    title: 'Документация',
    description: 'Характеристики, корпуса и datasheet',
    tone: 'bg-[#fff0cf]',
  },
  {
    image: '/storefront/hero-embedded.jpg',
    href: '/wholesale',
    title: 'Серийные поставки',
    description: 'Комплектация BOM и коммерческое предложение',
    tone: 'bg-[#eee5ff]',
  },
  {
    image: '/storefront/hero-xilinx.jpg',
    href: '/brands',
    title: 'Производители',
    description: 'Компоненты ведущих мировых брендов',
    tone: 'bg-[#e2f4fb]',
  },
]

export function HeroSlider() {
  return (
    <section className="bg-white pb-6 pt-5 lg:pb-8 lg:pt-6" data-motion-reveal>
      <div className="no-scrollbar mx-auto flex max-w-[1380px] gap-3 overflow-x-auto px-4 pb-1 lg:gap-4 lg:px-0">
        <Link
          href="/request-quote"
          className="group relative h-[238px] w-[292px] shrink-0 overflow-hidden rounded-2xl bg-[#dcecff] p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-azure-sm)] active:translate-y-0 lg:w-[310px]"
        >
          <Image
            src="/storefront/hero-components.jpg"
            alt="Электронные компоненты для комплектации спецификации"
            fill
            loading="eager"
            fetchPriority="high"
            className="object-cover opacity-38 saturate-[1.08] transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="310px"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#dcecff] via-[#dcecff]/90 to-[#dcecff]/12" />
          <div className="relative flex h-full flex-col">
            <span className="text-[11px] font-semibold text-azure">Для инженеров и снабжения</span>
            <h1 className="mt-2 max-w-[14ch] text-[25px] font-bold leading-[1.02] tracking-[-0.035em] text-ink text-balance">
              Соберем корзину по спецификации
            </h1>
            <p className="mt-3 max-w-[30ch] text-[13px] leading-[1.45] text-ink-3">
              Пришлите список MPN. Проверим наличие, сроки и предложим аналоги.
            </p>
            <span className="mt-auto inline-flex h-9 w-fit items-center rounded-xl bg-azure px-4 text-xs font-bold text-white shadow-[var(--shadow-button)] transition-colors group-hover:bg-azure-hover">
              Отправить список
            </span>
          </div>
        </Link>

        {serviceCards.map((card, index) => (
          <Link
            key={card.title}
            href={card.href}
            className={`group relative h-[238px] w-[210px] shrink-0 overflow-hidden rounded-2xl p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-azure-sm)] active:translate-y-0 lg:min-w-0 lg:flex-1 ${card.tone}`}
          >
            <div className="relative z-[1] grid grid-rows-[2.5rem_auto]">
              <h2 className="max-w-[13ch] self-start text-[18px] font-bold leading-[1.08] tracking-[-0.02em] text-ink">
                {card.title}
              </h2>
              <p className="mt-2 max-w-[20ch] self-start text-[12px] leading-[1.35] text-ink-3">
                {card.description}
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[47%] overflow-hidden">
              <Image
                src={card.image}
                alt={card.title}
                fill
                loading={index < 2 ? 'eager' : 'lazy'}
                fetchPriority={index < 2 ? 'high' : 'auto'}
                className="object-cover opacity-95 saturate-[1.08] contrast-[1.03] transition-transform duration-700 ease-out group-hover:scale-105"
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
