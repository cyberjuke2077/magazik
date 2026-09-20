import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { SourcingMotion } from '@/components/motion/sourcing-motion'

const services = [
  { title: 'Соберем корзину по спецификации', text: 'Пришлите MPN и количество. Уточним производителя, корпус и условия поставки для каждой позиции.', image: '/storefront/hero-components.jpg', href: '/wholesale#request-form', action: 'Отправить спецификацию' },
  { title: 'Найдём совместимую замену', text: 'Укажите исходный компонент и важные параметры. Проверим возможные аналоги под вашу задачу.', image: '/storefront/category-interfaces.jpg', href: '/wholesale#request-form', action: 'Запросить подбор' },
  { title: 'Поможем с серийной поставкой', text: 'Обсудим объём, график закупок и документы. Цену и срок подтвердим в коммерческом предложении.', image: '/storefront/hero-embedded.jpg', href: '/wholesale', action: 'Обсудить поставку' },
]

export function SourcingHelp() {
  return (
    <section className="storefront-container py-12 sm:py-20" aria-labelledby="sourcing-title">
      <SourcingMotion>
        <div className="mb-7 max-w-3xl">
          <h2 id="sourcing-title" className="text-2xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">От списка <span className="relative mx-1 inline-block h-8 w-16 overflow-hidden rounded-full align-middle sm:h-10 sm:w-20"><Image src="/storefront/category-mcu.jpg" alt="" fill sizes="80px" className="object-cover" /></span> к поставке.</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2" data-sourcing-copy>Поможем разобраться с компонентами, чтобы вы могли сосредоточиться на своём проекте.</p>
        </div>
        <div className="grid gap-3 lg:flex" data-sourcing-panels>
          {services.map((service) => (
            <Link key={service.title} href={service.href} data-sourcing-card className="group relative flex min-h-[280px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-6 transition-[flex-grow,border-color] duration-500 hover:border-azure/30 focus-visible:border-azure lg:min-h-[340px] lg:hover:grow-[1.25] lg:focus-visible:grow-[1.25]">
              <h3 className="relative z-10 max-w-[20ch] text-xl font-semibold leading-tight text-ink">{service.title}</h3>
              <p className="relative z-10 mt-3 max-w-[34ch] text-sm leading-relaxed text-ink-3">{service.text}</p>
              <div className="absolute inset-x-0 bottom-0 h-[42%] overflow-hidden"><Image src={service.image} alt="" fill sizes="(max-width: 1024px) 100vw, 460px" className="object-cover opacity-45 transition-transform duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-b from-white to-white/20" /></div>
              <span className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-9 text-sm font-semibold text-azure">{service.action}<ArrowUpRight size={19} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      </SourcingMotion>
    </section>
  )
}
