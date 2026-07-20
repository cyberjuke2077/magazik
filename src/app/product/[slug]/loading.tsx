import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

export default function ProductLoading() {
  return (
    <>
      <Header />
      <StickyNav />
      <main className="flex-1 bg-canvas">
        {/* Breadcrumb skeleton */}
        <div className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto max-w-[1440px] px-3 py-3 sm:px-6">
            <div className="h-3 w-56 skeleton rounded" />
          </div>
        </div>

        <div className="mx-auto max-w-[1440px] px-3 py-6 sm:px-6">
          <div className="h-4 w-32 skeleton rounded mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Image skeleton */}
            <div className="aspect-square skeleton rounded" />

            {/* Info skeleton */}
            <div className="flex flex-col gap-5">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-6 w-24 skeleton rounded" />
                  <div className="h-4 w-20 skeleton rounded" />
                </div>
                <div className="h-7 w-full skeleton rounded" />
                <div className="h-7 w-3/4 skeleton rounded" />
                <div className="h-8 w-32 skeleton rounded" />
              </div>

              <div className="h-12 skeleton rounded" />
              <div className="h-20 skeleton rounded" />

              <div className="flex gap-3">
                <div className="h-11 w-36 skeleton rounded" />
                <div className="h-11 flex-1 skeleton rounded" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 skeleton rounded" />
                <div className="h-12 skeleton rounded" />
              </div>
            </div>
          </div>

          {/* Specs skeleton */}
          <div className="mb-12">
            <div className="h-5 w-48 skeleton rounded mb-4" />
            <div className="bg-white border border-[var(--border)] rounded overflow-hidden shadow-sm">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex justify-between px-5 py-3 ${i !== 0 ? 'border-t border-[var(--border)]' : ''} ${i % 2 !== 0 ? 'bg-azure-light/40' : ''}`}
                >
                  <div className="h-4 w-28 skeleton rounded" />
                  <div className="h-4 w-24 skeleton rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
