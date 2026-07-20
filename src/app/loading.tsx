export default function StorefrontLoading() {
  return (
    <div className="min-h-screen bg-canvas" aria-label="Загрузка страницы" aria-live="polite">
      <div className="bg-white">
        <div className="mx-auto hidden h-12 max-w-[1380px] items-center justify-between lg:flex">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-3 w-[520px]" />
          <div className="skeleton h-3 w-32" />
        </div>
        <div className="mx-auto flex h-24 max-w-[1380px] items-center gap-4">
          <div className="skeleton h-16 w-[280px]" />
          <div className="skeleton h-16 flex-1" />
          <div className="hidden h-16 w-[327px] gap-2 lg:flex">
            <div className="skeleton flex-1" />
            <div className="skeleton flex-1" />
            <div className="skeleton flex-1" />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-[1380px] px-4 py-7 lg:px-0">
        <div className="skeleton mb-6 h-8 w-72" />
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="skeleton hidden h-[560px] lg:block" />
          <div className="space-y-3">
            <div className="skeleton h-14" />
            {[1, 2, 3].map((item) => (
              <div key={item} className="skeleton h-[220px]" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
