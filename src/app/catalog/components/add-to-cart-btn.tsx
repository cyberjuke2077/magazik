'use client'

import { useEffect, useRef, useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import {
  addToRequestList,
  getRequestList,
  isInRequestList,
  updateRequestListQuantity,
} from '@/lib/request-list-store'
import { QuantityStepper } from './quantity-stepper'
import { flyToCart } from '@/lib/fly-to-cart'

interface AddToCartBtnProps {
  productId: string
  partNumber: string
  name: string
  manufacturer: string
  minOrder: number
  price: number | null
  highlightOnCardHover?: boolean
}

/**
 * Add-to-cart button used in catalog rows. Writes to the unified
 * `electromagaz_cart` storage via the request-list-store adapter so the
 * header cart counter, /cart page and /request-list page all see the same
 * items.
 */
export function AddToCartBtn({
  productId,
  partNumber,
  name,
  manufacturer,
  minOrder,
  price,
  highlightOnCardHover = false,
}: AddToCartBtnProps) {
  const [quantity, setQuantity] = useState(minOrder)
  const [inCart, setInCart] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // hydration from localStorage — required after mount
    const exists = isInRequestList(productId)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInCart(exists)
    if (exists) {
      const item = getRequestList().find((i) => i.productId === productId)
      if (item) setQuantity(item.quantity)
    }
  }, [productId])

  function handleAdd() {
    addToRequestList({
      productId,
      partNumber,
      name,
      manufacturer,
      minOrder,
      price,
      quantity,
    })
    setInCart(true)
    flyToCart(buttonRef.current)
  }

  function handleQuantityChange(newQty: number) {
    setQuantity(newQty)
    if (inCart || isInRequestList(productId)) {
      updateRequestListQuantity(productId, newQty)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <QuantityStepper
        value={quantity}
        minOrder={minOrder}
        onChange={handleQuantityChange}
      />
      <button
        ref={buttonRef}
        onClick={handleAdd}
        data-catalog-cart-button={highlightOnCardHover ? true : undefined}
        aria-label={inCart ? 'Товар в корзине' : 'Добавить в корзину'}
        className={`flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] ${
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
