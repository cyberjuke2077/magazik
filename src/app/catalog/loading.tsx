import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 h-[60px] px-4 border-b border-gray-100">
      <div className="w-[140px] shrink-0 h-4 skeleton rounded" />
      <div className="flex-1 h-4 skeleton rounded" />
      <div className="w-[120px] shrink-0 h-3 skeleton rounded hidden md:block" />
      <div className="w-[90px] shrink-0 h-3 skeleton rounded hidden lg:block" />
      <div className="w-[130px] shrink-0 h-4 skeleton rounded" />
      <div className="w-[180px] shrink-0 h-8 skeleton rounded" />
    </div>
  )
}

export default function CatalogLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />

      {/* Breadcrumbs skeleton */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-2">
          <div className="h-4 w-40 skeleton rounded" />
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-4">
          {/* Title skeleton */}
          <div className="flex items-baseline gap-3 mb-4">
            <div className="h-7 w-32 skeleton rounded" />
            <div className="h-4 w-24 skeleton rounded" />
          </div>

          <div className="flex gap-5">
            {/* Sidebar skeleton */}
            <aside className="hidden lg:block w-[220px] shrink-0 space-y-2">
              <div className="h-4 w-20 skeleton rounded mb-3" />
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-8 skeleton rounded" />
              ))}
            </aside>

            {/* Content skeleton */}
            <div className="flex-1 min-w-0">
              {/* Toolbar skeleton */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                <div className="h-9 w-64 skeleton rounded" />
              </div>

              {/* Table skeleton */}
              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="flex items-center gap-4 h-[40px] px-4 bg-gray-50 border-b border-gray-200">
                  <div className="h-3 w-16 skeleton rounded" />
                  <div className="flex-1 h-3 skeleton rounded" />
                  <div className="h-3 w-20 skeleton rounded" />
                </div>
                {Array.from({ length: 15 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
