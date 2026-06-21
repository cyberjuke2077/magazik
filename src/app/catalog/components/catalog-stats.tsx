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
    <p className="text-xs text-ink-4 mb-3">
      {fmt(totalProducts)} товаров · {fmt(totalManufacturers)} производителей · {fmt(totalCategories)} категорий
    </p>
  )
}
