'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CircleHelp, GitCompareArrows, Grid3X3, Home, MessageSquare, ShoppingCart, UserRound } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { LiveSearchDropdown } from '@/components/ui/live-search-dropdown'

export function StickyNav() {
  const pathname = usePathname()
  const { items, totalPrice, mounted: cartMounted } = useCart()
  const cartCount = items.length

  const formattedTotal = cartMounted
    ? totalPrice.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
    : ''

  return (
    <div className="sticky top-0 z-[var(--layer-header)] bg-white shadow-[var(--shadow-xs)]">
      <div className="relative mx-auto max-w-[1380px]">
        <div className="flex h-12 items-center gap-2 px-4 lg:grid lg:h-[76px] lg:grid-cols-[280px_minmax(0,1fr)_327px] lg:gap-4 lg:px-0">
          <div className="storefront-brand-panel hidden h-14 items-center overflow-hidden rounded-2xl bg-azure lg:flex">
            <Link href="/" className="flex h-full w-36 shrink-0 items-center px-4">
              <span className="text-[21px] font-extrabold leading-none tracking-[-0.055em] text-white">
                electro<span className="text-white/88">magaz</span><span className="text-white">.</span>
              </span>
            </Link>
            <div className="relative flex flex-1 justify-center">
              <Link
                href="/catalog"
                className="flex h-11 w-[124px] items-center justify-center gap-2 rounded-xl bg-white/14 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/22 active:translate-y-0 active:scale-[0.98]"
              >
                <Grid3X3 size={17} />
                <span>Каталог</span>
              </Link>
            </div>
          </div>

          <LiveSearchDropdown />

          <Link
            href="/contacts"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f7f7f7] text-ink-3 transition-colors hover:text-azure lg:hidden"
            aria-label="Связаться с нами"
          >
            <MessageSquare size={18} strokeWidth={1.7} />
          </Link>

          <div className="hidden h-14 grid-cols-[90px_90px_90px_57px] lg:grid">
            <HeaderAction href="/compare" label="Сравнение" icon={GitCompareArrows} active={pathname === '/compare'} />
            <HeaderAction href="/account" label="Профиль" icon={UserRound} active={pathname.startsWith('/account')} />
            <HeaderAction
              href="/cart"
              label={cartMounted && totalPrice > 0 ? `${formattedTotal} ₽` : 'Корзина'}
              icon={ShoppingCart}
              count={cartCount}
              cart
              active={pathname === '/cart' || pathname.startsWith('/request-')}
            />
            <HeaderAction href="/help" label="Помощь" icon={CircleHelp} compact active={pathname === '/help'} />
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-[var(--layer-header)] grid h-16 grid-cols-5 border-t border-[var(--border)] bg-white px-1 lg:hidden">
        <MobileNavItem href="/" label="Главная" icon={Home} active={pathname === '/'} />
        <MobileNavItem href="/catalog" label="Каталог" icon={Grid3X3} active={pathname.startsWith('/catalog')} />
        <MobileNavItem href="/compare" label="Сравнить" icon={GitCompareArrows} active={pathname === '/compare'} />
        <MobileNavItem href="/cart" label="Корзина" icon={ShoppingCart} active={pathname === '/cart' || pathname.startsWith('/request-')} />
        <MobileNavItem href="/account" label="Профиль" icon={UserRound} active={pathname.startsWith('/account')} />
      </nav>
    </div>
  )
}

function HeaderAction({
  href,
  label,
  icon: Icon,
  count,
  cart = false,
  compact = false,
  active = false,
}: {
  href: string
  label: string
  icon: typeof Home
  count?: number
  cart?: boolean
  compact?: boolean
  active?: boolean
}) {
  return (
    <Link
      href={href}
      data-cart-icon={cart ? true : undefined}
      aria-current={active ? 'page' : undefined}
      className={`relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition duration-200 hover:-translate-y-0.5 hover:bg-surface-muted hover:text-azure active:translate-y-0 ${
        active ? 'bg-azure-light text-azure' : 'text-ink-2'
      } ${
        compact ? 'w-[57px]' : 'w-[90px]'
      }`}
    >
      <span className="relative">
        <Icon size={21} strokeWidth={1.6} />
        {typeof count === 'number' && count > 0 && (
          <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 animate-bounce-in items-center justify-center rounded-full bg-azure px-1 text-[9px] font-bold leading-none text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
      <span className="max-w-full truncate px-1">{label}</span>
    </Link>
  )
}

function MobileNavItem({
  href,
  label,
  icon: Icon,
  active = false,
}: {
  href: string
  label: string
  icon: typeof Home
  active?: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${active ? 'text-azure' : 'text-ink-3 hover:text-azure'}`}
    >
      {active && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-azure" />}
      <Icon size={20} strokeWidth={1.8} />
      <span className="truncate">{label}</span>
    </Link>
  )
}
