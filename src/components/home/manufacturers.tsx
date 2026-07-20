import Link from 'next/link'
import Image from 'next/image'
import { BRANDS } from '@/lib/brands'

export function Manufacturers() {
  const brands = BRANDS.filter((b) => b.featured && b.logo).slice(0, 12)
  if (brands.length === 0) return null
  return (
    <section className="bg-white py-[9px] lg:py-8">
      <div className="mx-auto max-w-[1380px] overflow-hidden px-4 lg:px-0">
        <div className="no-scrollbar flex gap-3 overflow-x-auto lg:gap-4">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={b.id === 'xilinx' ? '/brands#brand-xilinx' : `/catalog?manufacturer=${b.id}`}
              aria-label={b.name}
              className="group flex h-[58px] w-[112px] shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white p-3 transition-colors hover:border-[var(--border-2)] lg:h-[70px] lg:w-[132px]"
            >
              <div className="relative h-8 w-full opacity-70 grayscale transition-all duration-200 group-hover:opacity-100 group-hover:grayscale-0 motion-reduce:transition-none">
                <Image
                  src={b.logo!}
                  alt={b.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
