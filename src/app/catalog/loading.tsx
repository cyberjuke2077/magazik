import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

function SkeletonCard() {
  return (
    <div className="flex flex-col bg-white border border-black/8 rounded overflow-hidden shadow-sm">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 w-20 skeleton rounded" />
        <div className="h-3.5 w-full skeleton rounded" />
        <div className="h-3.5 w-3/4 skeleton rounded" />
        <div className="h-3 w-16 skeleton rounded" />
        <div className="pt-2 border-t border-black/6 flex items-center justify-between">
          <div className="h-5 w-20 skeleton rounded" />
          <div className="size-8 skeleton rounded" />
        </div>
      </div>
    </div>
  )
}

export default function CatalogLoading() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#fffaf7]">
        {/* Page header skeleton */}
        <div className="border-b border-black/8 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="h-3 w-32 skeleton rounded mb-3" />
            <div className="h-6 w-40 skeleton rounded mb-1" />
            <div className="h-3 w-24 skeleton rounded" />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex gap-6">
            {/* Sidebar skeleton */}
            <aside className="hidden lg:block w-64 shrink-0 space-y-2">
              <div className="h-3 w-20 skeleton rounded mb-3" />
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-9 skeleton rounded" />
              ))}
              <div className="mt-6 pt-6 border-t border-black/6 space-y-2">
                <div className="h-3 w-16 skeleton rounded mb-3" />
                <div className="h-9 skeleton rounded" />
              </div>
            </aside>

            {/* Grid skeleton */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-24 skeleton rounded" />
                <div className="h-9 flex-1 max-w-sm skeleton rounded" />
                <div className="ml-auto h-9 w-32 skeleton rounded" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
