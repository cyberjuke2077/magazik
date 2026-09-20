import Image from 'next/image'
import Link from 'next/link'

const serviceCards = [
  {
    image: '/storefront/objects-v2/mpn.png',
    href: '/catalog',
    title: 'Поиск по MPN',
    description: 'Точный артикул, корпус и производитель',
    tone: 'bg-[#e5efff]',
  },
  {
    image: '/storefront/objects-v2/alternatives.png',
    href: '/wholesale#request-form',
    title: 'Подбор аналогов',
    description: 'Совместимая замена для дефицитной позиции',
    tone: 'bg-[#e4f5ec]',
  },
  {
    image: '/storefront/objects-v2/datasheet.png',
    href: '/catalog?category=atsp-tsap',
    title: 'Документация',
    description: 'Характеристики, корпуса и datasheet',
    tone: 'bg-[#fff0df]',
  },
  {
    image: '/storefront/objects-v2/supply.png',
    href: '/wholesale',
    title: 'Серийные поставки',
    description: 'Комплектация BOM и коммерческое предложение',
    tone: 'bg-[#e6f4fb]',
  },
  {
    image: '/storefront/objects-v2/makers.png',
    href: '/brands',
    title: 'Производители',
    description: 'Компоненты ведущих мировых брендов',
    tone: 'bg-[#f0e9fc]',
  },
]

export function HeroSlider() {
  return (
    <section className="bg-white pb-6 pt-5 lg:pb-8 lg:pt-6" data-motion-reveal>
      <div className="no-scrollbar mx-auto flex max-w-[1380px] gap-3 overflow-x-auto px-4 pb-1 lg:gap-4 lg:px-0">
        <Link
          href="/wholesale#request-form"
          className="group relative h-[238px] w-[292px] shrink-0 overflow-hidden rounded-2xl bg-[#fff4d6] p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-azure-sm)] active:translate-y-0 lg:w-[310px]"
        >
          <div className="pointer-events-none absolute -bottom-6 -right-3 h-[112px] w-[128px]">
            <Image
              src="/storefront/objects-v2/bom.png"
              alt="Электронные компоненты для комплектации спецификации"
              fill
              loading="eager"
              fetchPriority="high"
              className="object-contain transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-105"
              sizes="128px"
            />
          </div>
          <div className="relative flex h-full flex-col">
            <span className="text-[11px] font-semibold text-[#6a5320]">Для инженеров и снабжения</span>
            <h1 className="mt-2 max-w-[14ch] text-[25px] font-bold leading-[1.02] tracking-[-0.035em] text-ink text-balance">
              Соберем корзину по спецификации
            </h1>
            <p className="mt-3 max-w-[30ch] text-[13px] leading-[1.45] text-[#4b4f56]">
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
            className={`group relative h-[238px] w-[210px] shrink-0 overflow-hidden rounded-2xl p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-azure-sm)] active:translate-y-0 lg:min-w-[180px] lg:flex-1 ${card.tone}`}
          >
            <div className="relative z-[1] grid grid-rows-[2.5rem_auto]">
              <h2 className="max-w-[13ch] self-start text-[18px] font-bold leading-[1.08] tracking-[-0.02em] text-ink">
                {card.title}
              </h2>
              <p className="mt-2 max-w-[20ch] self-start text-[12px] leading-[1.35] text-[#4b5563]">
                {card.description}
              </p>
            </div>
            <div className="pointer-events-none absolute -bottom-5 -right-4 h-[148px] w-[174px]">
              <Image
                src={card.image}
                alt={card.title}
                fill
                loading={index < 2 ? 'eager' : 'lazy'}
                fetchPriority={index < 2 ? 'high' : 'auto'}
                className="object-contain transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-105"
                sizes="174px"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
