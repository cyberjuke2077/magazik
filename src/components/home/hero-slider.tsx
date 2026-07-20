import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, FileText, PackageSearch } from 'lucide-react'

const quickLinks = [
  {
    image: '/photos/cat-2.jpg',
    title: 'Микроконтроллеры',
    description: 'STM32, AVR, ESP32 и модули',
    href: '/catalog?category=mikrokontrollery',
  },
  {
    image: '/photos/cat-3.jpg',
    title: 'Питание и преобразователи',
    description: 'DC-DC, стабилизаторы, контроллеры',
    href: '/catalog?category=pitanie',
  },
]

export function HeroSlider({ totalProducts }: { totalProducts: number }) {
  return (
    <section className="bg-canvas pb-3 pt-4">
      <div className="mx-auto grid max-w-[1440px] gap-3 px-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative min-h-[360px] overflow-hidden rounded-[var(--radius-panel)] bg-[#18202d]">
          <Image
            src="/photos/hero.jpg"
            alt="Электронные компоненты и печатная плата"
            fill
            priority
            className="object-cover opacity-60"
            sizes="(max-width: 1024px) 100vw, 1050px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#151c28] via-[#151c28]/85 to-transparent" />
          <div className="relative flex min-h-[360px] max-w-2xl flex-col justify-center p-6 text-white sm:p-10">
            <h1 className="max-w-xl text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-[40px]">
              Электронные компоненты для разработки и производства
            </h1>
            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-white/75 sm:text-base">
              Ищите по MPN, сравнивайте характеристики и отправляйте спецификацию на расчёт.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/catalog" className="ui-btn ui-btn-primary">
                <PackageSearch size={18} />
                Открыть каталог
              </Link>
              <Link href="/request-quote" className="ui-btn border border-white/35 bg-white/10 text-white hover:bg-white/15">
                <FileText size={18} />
                Запросить КП
              </Link>
            </div>
            <div className="mt-6 text-sm text-white/65">
              <span className="price text-white">{totalProducts.toLocaleString('ru-RU')}</span> позиций в каталоге
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative min-h-[170px] overflow-hidden rounded-[var(--radius-card)] bg-white"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 50vw, 360px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#151c28]/90 via-[#151c28]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <div className="text-sm font-bold sm:text-base">{item.title}</div>
                <div className="mt-1 hidden text-xs text-white/70 sm:block">{item.description}</div>
                <ArrowRight size={17} className="mt-2 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
