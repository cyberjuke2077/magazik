import Link from 'next/link'

export const ADMIN_PAGE_SIZE = 50
export function adminPage(value?: string) {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? Math.min(number, 100000) : 1
}

export function AdminPagination({ page, total, href }: { page: number; total: number; href: string }) {
  const last = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))
  const url = (number: number) => `${href}${href.includes('?') ? '&' : '?'}page=${number}`
  return <nav aria-label="Страницы заявок" className="flex flex-wrap gap-4 text-sm">
    <span>Всего: {total}. Страница {page} из {last}</span>
    {page > 1 && <Link href={url(page - 1)} className="underline">Назад</Link>}
    {page < last && <Link href={url(page + 1)} className="underline">Далее</Link>}
    {page > last && <Link href={url(last)} className="underline">К последней странице</Link>}
  </nav>
}
