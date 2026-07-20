interface CatalogStatsProps {
  totalProducts: number
  totalManufacturers: number
  totalCategories: number
}

export function CatalogStats({
  totalProducts,
  totalManufacturers,
  totalCategories,
}: CatalogStatsProps) {
  const fmt = (n: number) => n.toLocaleString('ru-RU')

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-4">
      <span>{fmt(totalProducts)} товаров</span>
      <span>{fmt(totalManufacturers)} производителей</span>
      <span>{fmt(totalCategories)} категорий</span>
    </div>
  )
}
