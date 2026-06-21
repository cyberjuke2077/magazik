'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import {
  addToRequestList,
  getRequestList,
  isInRequestList,
  updateRequestListQuantity,
} from '@/lib/request-list-store'
import { QuantityStepper } from './quantity-stepper'

interface AddToCartBtnProps {
  productId: string
  partNumber: string
  name: string
  manufacturer: string
  minOrder: number
  price: number | null
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
}: AddToCartBtnProps) {
  const [quantity, setQuantity] = useState(minOrder)
  const [inCart, setInCart] = useState(false)

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
        onClick={handleAdd}
        className={`flex items-center gap-1.5 h-8 px-3 text-xs font-bold rounded-[var(--radius-control)] transition-colors whitespace-nowrap ${
          inCart
            ? 'bg-azure-light text-azure border border-azure/30'
            : 'bg-azure text-white hover:bg-azure-hover'
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
