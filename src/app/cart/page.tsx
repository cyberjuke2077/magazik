'use client'

import Link from 'next/link'
import {
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Truck,
  Shield,
  Package2,
  ChevronRight,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartItemRow } from '@/components/ui/cart-item'
import { ProductCard } from '@/components/catalog/product-card'
import { useCart } from '@/hooks/use-cart'
import { featuredProducts } from '@/lib/mock-data'
import { formatPrice } from '@/lib/utils'

const DELIVERY_PRICE = 350
const DELIVERY_FREE_FROM = 5000

export default function CartPage() {
  const { items, mounted, totalItems, totalPrice, totalWholesale, removeItem, updateQuantity, clearCart } =
    useCart()

  const deliveryFree = totalPrice >= DELIVERY_FREE_FROM
  const finalPrice = totalPrice + (deliveryFree ? 0 : DELIVERY_PRICE)

  // Skeleton while hydrating
  if (!mounted) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#fffaf7]">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="h-6 w-48 skeleton rounded-lg mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 skeleton rounded-xl" />
                ))}
              </div>
              <div className="h-64 skeleton rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#fffaf7]">
          <div className="border-b border-black/8 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-3">
              <nav className="flex items-center gap-1.5 text-xs text-[#a8a29e]">
                <Link href="/" className="hover:text-[#78716c] transition-colors">Главная</Link>
                <ChevronRight size={10} />
                <span className="text-[#78716c]">Корзина</span>
              </nav>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-16 text-center">
            <div className="inline-flex items-center justify-center size-24 rounded-3xl bg-[#fef3e8] border border-black/8 mb-6">
              <ShoppingCart size={40} className="text-[#166534] opacity-40" />
            </div>
            <h1 className="text-2xl font-bold text-[#1c1917] mb-2">Корзина пуста</h1>
            <p className="text-[#78716c] mb-8 max-w-sm mx-auto">
              Добавьте компоненты из каталога, чтобы оформить заказ
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 h-11 px-6 text-sm font-semibold text-white bg-[#166534] hover:bg-[#15803d] rounded-xl transition-all btn-primary shadow-sm"
            >
              Перейти в каталог
              <ArrowRight size={15} />
            </Link>

            <div className="mt-16 text-left">
              <h2 className="text-base font-bold text-[#1c1917] mb-4">Популярные товары</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredProducts.slice(0, 4).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="flex-1 bg-[#fffaf7]">
        {/* Breadcrumb */}
        <div className="border-b border-black/8 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-[#a8a29e]">
              <Link href="/" className="hover:text-[#78716c] transition-colors">Главная</Link>
              <ChevronRight size={10} />
              <span className="text-[#78716c]">Корзина</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-[#1c1917]">Корзина</h1>
              <p className="text-sm text-[#78716c] mt-0.5">
                {totalItems} {totalItems === 1 ? 'товар' : totalItems < 5 ? 'товара' : 'товаров'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/catalog"
                className="hidden sm:flex items-center gap-1.5 text-sm text-[#78716c] hover:text-[#166534] transition-colors"
              >
                <ArrowLeft size={14} />
                Продолжить покупки
              </Link>
              <button
                onClick={clearCart}
                className="flex items-center gap-1.5 text-sm text-[#a8a29e] hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Очистить</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Cart items ── */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <CartItemRow
                  key={item.product.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* ── Order summary ── */}
            <div className="space-y-4">
              <div className="bg-white border border-black/8 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-black/6">
                  <h2 className="text-sm font-bold text-[#1c1917]">Итого</h2>
                </div>

                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#78716c]">Товары ({totalItems} шт.)</span>
                    <span className="font-medium text-[#1c1917]">{formatPrice(totalPrice)}</span>
                  </div>

                  {totalWholesale < totalPrice && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#78716c]">Оптовая скидка</span>
                      <span className="font-medium text-[#f97316]">
                        −{formatPrice(totalPrice - totalWholesale)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#78716c]">Доставка</span>
                    {deliveryFree ? (
                      <span className="font-medium text-[#166534]">Бесплатно</span>
                    ) : (
                      <span className="font-medium text-[#1c1917]">{formatPrice(DELIVERY_PRICE)}</span>
                    )}
                  </div>

                  <div className="border-t border-black/6 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-[#1c1917]">К оплате</span>
                      <span className="text-xl font-bold text-[#1c1917]">{formatPrice(finalPrice)}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <Link
                    href="/checkout"
                    className="flex items-center justify-center gap-2 w-full h-12 text-sm font-semibold text-white bg-[#166534] hover:bg-[#15803d] rounded-xl transition-all btn-primary shadow-sm"
                  >
                    Оформить заказ
                    <ArrowRight size={15} />
                  </Link>
                  <p className="text-center text-[10px] text-[#a8a29e] mt-2">
                    Нажимая кнопку, вы соглашаетесь с условиями
                  </p>
                </div>
              </div>

              {/* Trust badges */}
              <div className="bg-white border border-black/8 rounded-xl shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-3 text-xs text-[#78716c]">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[#166534]/8 shrink-0">
                    <Truck size={13} className="text-[#166534]" />
                  </div>
                  <span>Отправка в день заказа до 15:00</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#78716c]">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[#f97316]/8 shrink-0">
                    <Shield size={13} className="text-[#f97316]" />
                  </div>
                  <span>Оригинальные компоненты с сертификатами</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#78716c]">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[#166534]/8 shrink-0">
                    <Package2 size={13} className="text-[#166534]" />
                  </div>
                  <span>Возврат в течение 14 дней</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
