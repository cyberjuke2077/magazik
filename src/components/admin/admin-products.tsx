'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Plus, Edit2, Trash2, Eye } from 'lucide-react'

interface Product {
  id: string
  name: string
  partNumber: string
  category: string
  manufacturer: string
  slug: string
  description: string | null
  weight: number | null
}

export function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('/api/admin/products')
        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error('Failed to load products:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Управление товарами</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0066cc] text-white rounded-lg hover:bg-[#0052a3] transition-colors">
          <Plus size={18} />
          Добавить товар
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, артикулу, производителю..."
            className="w-full h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter size={16} />
          Фильтры
        </button>
      </div>

      {/* Products table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Загрузка товаров...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Товар</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Артикул</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Категория</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Производитель</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      {products.length === 0 ? 'Товары не найдены. Импортируйте товары из ChipDip.' : 'Товары не найдены'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">{product.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">{product.partNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">{product.category}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">{product.manufacturer}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <a
                            href={`/product/${product.slug}`}
                            target="_blank"
                            className="p-1.5 text-gray-600 hover:text-[#0066cc] hover:bg-blue-50 rounded transition-colors"
                            title="Просмотр"
                          >
                            <Eye size={16} />
                          </a>
                          <button
                            className="p-1.5 text-gray-600 hover:text-[#0066cc] hover:bg-blue-50 rounded transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Удалить"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      {!loading && products.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Показано {filteredProducts.length} из {products.length} товаров
          </div>
        </div>
      )}
    </div>
  )
}
