import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { type CatalogSectionView } from '@/lib/queries/categories'

const CATEGORY_PHOTOS = [
  '/photos/cat-1.jpg',
  '/photos/cat-2.jpg',
  '/photos/cat-3.jpg',
  '/photos/cat-4.jpg',
  '/photos/cat-5.jpg',
  '/photos/cat-6.jpg',
]

export function CategoriesGrid({ sections }: { sections: CatalogSectionView[] }) {
  return (
    <section className="bg-canvas py-5">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Категории компонентов</h2>
          <Link href="/catalog" className="inline-flex items-center gap-1 text-sm font-semibold text-azure hover:underline">
            Весь каталог
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.slice(0, 6).map((section, index) => (
            <Link
              key={section.id}
              href={`/catalog?category=${section.slug}`}
              className="group grid min-h-[116px] grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white transition-colors hover:border-[var(--border-2)]"
            >
              <div className="relative">
                <Image
                  src={CATEGORY_PHOTOS[index]}
                  alt={section.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
              <div className="flex min-w-0 flex-col justify-center p-3">
                <h3 className="text-sm font-bold leading-snug text-ink transition-colors group-hover:text-azure">
                  {section.name}
                </h3>
                <span className="mt-1 text-xs text-ink-4">
                  {section.productCount.toLocaleString('ru-RU')} позиций
                </span>
                <span className="mt-2 line-clamp-1 text-xs text-ink-3">
                  {section.children.slice(0, 2).map((child) => child.name).join(', ')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
