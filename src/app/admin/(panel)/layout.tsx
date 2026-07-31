import Link from 'next/link'
import type { ReactNode } from 'react'
import { LayoutDashboard, Inbox, Building2, Package, LogOut, ExternalLink } from 'lucide-react'
import { logoutAdmin } from '../login/actions'

export const metadata = { title: 'Админ-панель - Electromagaz' }

const NAV = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/admin/requests', label: 'Заявки', icon: Inbox },
  { href: '/admin/wholesale', label: 'Оптовые заявки', icon: Building2 },
  { href: '/admin/products', label: 'Товары и цены', icon: Package },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-56 shrink-0 min-h-screen bg-white border-r border-gray-200 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <Link href="/admin" className="font-semibold text-gray-900">
              Electromagaz
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">Панель управления</p>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-400" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-100 space-y-1">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
              Открыть сайт
            </Link>
            <form action={logoutAdmin}>
              <button
                type="submit"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4 text-gray-400" />
                Выйти
              </button>
            </form>
          </div>
        </aside>
        <main className="flex-1 p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
  )
}
