'use client'

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { updateProductPricing } from '../../actions'

export interface PricingRowProduct {
  id: string
  partNumber: string
  name: string
  manufacturer: string
  category: string
  price: string | null
  priceWholesale: string | null
  stockCount: number
  inStock: boolean
}

export function ProductPricingRow({ product }: { product: PricingRowProduct }) {
  const [price, setPrice] = useState(product.price ?? '')
  const [wholesale, setWholesale] = useState(product.priceWholesale ?? '')
  const [stock, setStock] = useState(String(product.stockCount))
  const [inStock, setInStock] = useState(product.inStock)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const dirty =
    price !== (product.price ?? '') ||
    wholesale !== (product.priceWholesale ?? '') ||
    stock !== String(product.stockCount) ||
    inStock !== product.inStock

  const save = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateProductPricing(product.id, {
        price,
        priceWholesale: wholesale,
        stockCount: stock,
        inStock,
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError(res.error ?? 'Ошибка')
      }
    })
  }

  const inputCls =
    'w-24 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900/10'

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2.5">
        <div className="font-mono text-xs text-gray-600">{product.partNumber}</div>
        <div className="text-sm text-gray-900 truncate max-w-[280px]" title={product.name}>
          {product.name}
        </div>
        <div className="text-xs text-gray-400">
          {product.manufacturer} · {product.category}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="-"
          inputMode="decimal"
          className={inputCls}
          aria-label="Розничная цена"
        />
      </td>
      <td className="px-3 py-2.5">
        <input
          value={wholesale}
          onChange={(e) => setWholesale(e.target.value)}
          placeholder="-"
          inputMode="decimal"
          className={inputCls}
          aria-label="Оптовая цена"
        />
      </td>
      <td className="px-3 py-2.5">
        <input
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          inputMode="numeric"
          className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          aria-label="Остаток"
        />
      </td>
      <td className="px-3 py-2.5 text-center">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
          className="w-4 h-4 accent-gray-900"
          aria-label="В наличии"
        />
      </td>
      <td className="px-3 py-2.5 w-28">
        {error ? (
          <span className="text-xs text-red-600" title={error}>
            Ошибка
          </span>
        ) : saved ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-600">
            <Check className="w-3.5 h-3.5" /> Сохранено
          </span>
        ) : (
          <button
            onClick={save}
            disabled={!dirty || pending}
            className="px-3 py-1 bg-gray-900 text-white rounded text-xs font-medium hover:bg-gray-800 disabled:opacity-30 transition-colors"
          >
            {pending ? '…' : 'Сохранить'}
          </button>
        )}
      </td>
    </tr>
  )
}
