'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Check } from 'lucide-react'
import type { Product } from '@/types'
import { useBulkSelect } from './bulk-select-panel'
import { QuantityStepper } from './quantity-stepper'
import { flyToCart } from '@/lib/fly-to-cart'

interface AddToCartBtnProps {
  product: Product
  highlightOnCardHover?: boolean
}

/** Catalog button backed by the shared cart context and storage. */
export function AddToCartBtn({
  product,
  highlightOnCardHover = false,
}: AddToCartBtnProps) {
  const router = useRouter()
  const cart = useBulkSelect()
  const [quantity, setQuantity] = useState(product.minOrder)
  const [isAdding, setIsAdding] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const addingRef = useRef(false)
  if (!cart) throw new Error('AddToCartBtn must be rendered inside BulkSelectWrapper')
  const { addItem, getQuantity, isInCart, updateQuantity } = cart
  const inCart = isInCart(product.id)
  const displayQuantity = inCart ? getQuantity(product.id) : quantity

  async function handleAdd() {
    if (addingRef.current) return
    if (inCart) {
      router.push('/cart')
      return
    }
    addingRef.current = true
    setIsAdding(true)
    try {
      if (!await addItem(product, quantity)) return
      flyToCart(buttonRef.current)
    } finally {
      addingRef.current = false
      setIsAdding(false)
    }
  }

  function handleQuantityChange(newQty: number) {
    setQuantity(newQty)
    if (inCart) void updateQuantity(product.id, newQty)
  }

  return (
    <div className="flex items-center gap-2">
      <QuantityStepper
        value={displayQuantity}
        minOrder={product.minOrder}
        onChange={handleQuantityChange}
      />
      <button
        ref={buttonRef}
        onClick={handleAdd}
        disabled={isAdding}
        aria-busy={isAdding}
        data-catalog-cart-button={highlightOnCardHover ? true : undefined}
        aria-label={inCart ? 'Перейти в корзину' : 'Добавить в корзину'}
        className={`flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:cursor-wait disabled:opacity-70 ${
          inCart
            ? 'bg-azure-light text-azure border border-azure/30'
            : highlightOnCardHover
              ? 'border border-[var(--border-2)] bg-white text-ink-2 shadow-[var(--shadow-button)] hover:border-azure hover:bg-azure hover:text-white group-hover:border-azure group-hover:bg-azure group-hover:text-white group-hover:shadow-[var(--shadow-button-hover)]'
              : 'bg-accent text-white hover:bg-accent-hover'
        }`}
      >
        {inCart ? (
          <>
            <Check size={12} />В корзине
          </>
        ) : (
          <>
            <ShoppingCart size={12} />В корзину
          </>
        )}
      </button>
    </div>
  )
}
