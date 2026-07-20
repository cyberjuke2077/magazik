import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ScrubText } from '@/components/motion/scrub-text'

export function SearchPromise() {
  return (
    <section className="bg-white py-8 lg:py-12" data-motion-reveal>
      <div className="mx-auto grid max-w-[1380px] items-center gap-6 overflow-hidden rounded-2xl bg-azure-dim px-5 py-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-9 lg:py-9">
        <div>
          <h2 className="max-w-6xl text-balance text-2xl font-bold tracking-[-0.035em] text-ink lg:text-[34px]">
            Ищите компонент по точному
            <span className="mx-2 inline-block h-8 w-20 overflow-hidden rounded-full align-middle lg:h-10 lg:w-28">
              <Image src="/storefront/category-mcu.jpg" alt="Микросхемы" width={112} height={40} className="h-full w-full object-cover" />
            </span>
            MPN
          </h2>
          <ScrubText className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-3 lg:text-base">
            Поиск понимает маркировку производителя, а каталог сразу показывает корпус, наличие, документацию и минимальную партию.
          </ScrubText>
        </div>
        <Link href="/catalog" className="group flex min-h-20 items-center justify-between rounded-xl bg-white px-5 text-sm font-bold text-azure shadow-[var(--shadow-azure-sm)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-azure-md)] active:translate-y-0">
          Перейти к поиску по каталогу
          <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
}
