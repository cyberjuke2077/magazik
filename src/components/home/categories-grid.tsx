import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/component-icons'
import { SectionHeader } from './section-header'
import { Reveal } from './reveal'
import { type CatalogSectionView } from '@/lib/queries/categories'

const CATEGORY_PHOTOS = [
  '/photos/cat-1.jpg', '/photos/cat-2.jpg', '/photos/cat-3.jpg',
  '/photos/cat-4.jpg', '/photos/cat-5.jpg', '/photos/cat-6.jpg',
]

export function CategoriesGrid({ sections }: { sections: CatalogSectionView[] }) {
  const cats = sections.slice(0, 6)
  return (
    <section className="section-pad bg-white">
      <div className="mx-auto max-w-[1400px] px-4">
        <SectionHeader
          eyebrow="Каталог"
          title="Категории компонентов"
          description="Полупроводники, пассивные компоненты, питание, датчики и интерфейсы — всё под параметрический подбор."
          href="/catalog"
          linkLabel="Все категории"
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {cats.map((cat, i) => (
            <Reveal key={cat.id} delay={(i % 3) * 80}>
              <Link
                href={`/catalog?category=${cat.slug}`}
                className="group ui-card ui-card-hover relative block aspect-[5/4] overflow-hidden"
              >
                <Image
                  src={CATEGORY_PHOTOS[i % CATEGORY_PHOTOS.length]}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />

                <span className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-[var(--radius-control)] bg-white/95 text-azure backdrop-blur">
                  <CategoryIcon slug={cat.icon ?? cat.slug} size={22} />
                </span>

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-lg font-bold leading-tight text-white">{cat.name}</h3>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-sm text-white/75">
                      <span className="tnum">{cat.productCount.toLocaleString('ru-RU')}</span> позиций
                    </span>
                    <ArrowUpRight
                      size={20}
                      className="text-white/80 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
