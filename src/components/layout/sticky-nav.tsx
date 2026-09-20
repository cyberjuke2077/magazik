'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CircleHelp, GitCompareArrows, Grid3X3, Home, MessageSquare, ShoppingCart, UserRound } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { LiveSearchDropdown } from '@/components/ui/live-search-dropdown'
import { formatPrice } from '@/lib/utils'

export function StickyNav() {
  const pathname = usePathname()
  const { items, totalPrice, unpricedItems, mounted: cartMounted } = useCart()
  const cartCount = items.length

  const formattedTotal = cartMounted
    ? formatPrice(totalPrice)
    : ''

  return (
    <div className="sticky top-0 z-[var(--layer-header)] border-b border-[var(--border)] bg-white">
      <div className="storefront-container">
        <div className="flex min-h-16 items-center gap-3 py-2 lg:min-h-[88px] lg:gap-5">
          <Link href="/" aria-label="Electromagaz - главная" className="brand-wordmark hidden shrink-0 text-[27px] font-extrabold tracking-[-0.04em] text-ink lg:block">
            electro<span className="text-azure">magaz.</span>
          </Link>
          <Link href="/catalog" className="hidden h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-azure px-5 text-sm font-semibold text-white transition-colors hover:bg-azure-hover lg:flex">
            <Grid3X3 size={19} aria-hidden="true" /> Каталог
          </Link>

          <LiveSearchDropdown />

          <Link
            href="/contacts"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f7f7f7] text-ink-3 transition-colors hover:text-azure lg:hidden"
            aria-label="Связаться с нами"
          >
            <MessageSquare size={18} strokeWidth={1.7} />
          </Link>

          <div className="hidden h-14 items-center gap-1 lg:flex">
            <HeaderAction href="/compare" label="Сравнение" icon={GitCompareArrows} active={pathname === '/compare'} />
            <HeaderAction href="/account" label="Заявки" icon={UserRound} active={pathname.startsWith('/account')} />
            <HeaderAction
              href="/cart"
              label={cartMounted && unpricedItems === 0 && totalPrice > 0 ? formattedTotal : 'Корзина'}
              icon={ShoppingCart}
              count={cartCount}
              cart
              active={pathname === '/cart' || pathname.startsWith('/request-')}
            />
            <HeaderAction href="/help" label="Помощь" icon={CircleHelp} compact active={pathname === '/help'} />
          </div>
        </div>
      </div>

      <nav aria-label="Основная навигация" className="mobile-storefront-nav fixed inset-x-0 bottom-0 z-[var(--layer-header)] grid grid-cols-5 border-t border-[var(--border)] bg-white px-1 lg:hidden">
        <MobileNavItem href="/" label="Главная" icon={Home} active={pathname === '/'} />
        <MobileNavItem href="/catalog" label="Каталог" icon={Grid3X3} active={pathname.startsWith('/catalog')} />
        <MobileNavItem href="/compare" label="Сравнить" icon={GitCompareArrows} active={pathname === '/compare'} />
        <MobileNavItem href="/cart" label="Корзина" count={cartCount} icon={ShoppingCart} active={pathname === '/cart' || pathname.startsWith('/request-')} />
        <MobileNavItem href="/account" label="Заявки" icon={UserRound} active={pathname.startsWith('/account')} />
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
      className={`relative flex h-14 rounded-xl flex-col items-center justify-center gap-1 text-[11px] font-medium transition duration-200 hover:-translate-y-0.5 hover:bg-surface-muted hover:text-azure active:translate-y-0 ${
        active ? 'bg-azure-light text-azure' : 'text-ink-2'
      } ${
        compact ? 'w-[60px]' : 'w-[72px]'
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
  count,
  active = false,
}: {
  href: string
  label: string
  icon: typeof Home
  count?: number
  active?: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      data-cart-icon={href === '/cart' ? true : undefined}
      className={`relative flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${active ? 'text-azure' : 'text-ink-3 hover:text-azure'}`}
    >
      {active && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-azure" />}
      <span className="relative"><Icon size={20} strokeWidth={1.8} />{count != null && count > 0 && <span className="absolute -right-3 -top-1.5 rounded-full bg-azure px-1 text-[10px] leading-4 text-white">{count > 99 ? '99+' : count}</span>}</span>
      <span className="truncate">{label}</span>
    </Link>
  )
}
