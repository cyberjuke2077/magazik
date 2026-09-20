import Image from 'next/image'
import Link from 'next/link'

const serviceCards = [
  {
    image: '/storefront/editorial-v1/mpn.png',
    href: '/catalog',
    title: 'Поиск по MPN',
    description: 'Точный артикул, корпус и производитель',
    tone: 'bg-[#edf0f3]',
  },
  {
    image: '/storefront/editorial-v1/alternatives.png',
    href: '/wholesale#request-form',
    title: 'Подбор аналогов',
    description: 'Совместимая замена для дефицитной позиции',
    tone: 'bg-[#e8edf3]',
  },
  {
    image: '/storefront/editorial-v1/datasheet.png',
    href: '/catalog?category=atsp-tsap',
    title: 'Документация',
    description: 'Характеристики, корпуса и datasheet',
    tone: 'bg-[#f1f0ec]',
  },
  {
    image: '/storefront/editorial-v1/supply.png',
    href: '/wholesale',
    title: 'Серийные поставки',
    description: 'Комплектация BOM и коммерческое предложение',
    tone: 'bg-[#eaecef]',
  },
  {
    image: '/storefront/editorial-v1/makers.png',
    href: '/brands',
    title: 'Производители',
    description: 'Компоненты ведущих мировых брендов',
    tone: 'bg-[#e7edf0]',
  },
]

export function HeroSlider() {
  return (
    <section className="bg-white pb-6 pt-5 lg:pb-8 lg:pt-6" data-motion-reveal>
      <div className="no-scrollbar mx-auto flex max-w-[1380px] gap-3 overflow-x-auto px-4 pb-1 lg:gap-4 lg:px-0">
        <Link
          href="/wholesale#request-form"
          className="group relative h-[238px] w-[292px] shrink-0 overflow-hidden rounded-2xl bg-[#172536] p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-azure-sm)] active:translate-y-0 lg:w-[310px]"
        >
          <Image
            src="/storefront/editorial-v1/bom.png"
            alt="Электронные компоненты для комплектации спецификации"
            fill
            loading="eager"
            fetchPriority="high"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="310px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#102033]/95 via-[#102033]/85 to-[#102033]/35" />
          <div className="relative flex h-full flex-col">
            <span className="text-[11px] font-semibold text-[#b9d8ff]">Для инженеров и снабжения</span>
            <h1 className="mt-2 max-w-[14ch] text-[25px] font-bold leading-[1.02] tracking-[-0.035em] text-white text-balance">
              Соберем корзину по спецификации
            </h1>
            <p className="mt-3 max-w-[30ch] text-[13px] leading-[1.45] text-white/85">
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
            className={`group relative h-[238px] w-[210px] shrink-0 overflow-hidden rounded-2xl p-5 ring-1 ring-inset ring-black/5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-azure-sm)] active:translate-y-0 lg:min-w-0 lg:flex-1 ${card.tone}`}
          >
            <div className="relative z-[1] -mx-5 -mt-5 grid min-h-[130px] grid-rows-[2.5rem_auto] border-b border-white/60 bg-white/80 px-5 pb-4 pt-5 backdrop-blur-md">
              <h2 className="max-w-[13ch] self-start text-[18px] font-bold leading-[1.08] tracking-[-0.02em] text-ink">
                {card.title}
              </h2>
              <p className="mt-2 max-w-[20ch] self-start text-[12px] leading-[1.35] text-[#4b5563]">
                {card.description}
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[55%] overflow-hidden">
              <Image
                src={card.image}
                alt={card.title}
                fill
                loading={index < 2 ? 'eager' : 'lazy'}
                fetchPriority={index < 2 ? 'high' : 'auto'}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="210px"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
