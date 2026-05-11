'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ExternalLink, Search } from 'lucide-react'

interface Manufacturer {
  id: string
  name: string
  slug: string
  description?: string
  website?: string
  productCount: number
}

export function AdminManufacturers() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadManufacturers()
  }, [])

  const loadManufacturers = async () => {
    try {
      const response = await fetch('/api/admin/manufacturers')
      const data = await response.json()
      setManufacturers(data)
    } catch (error) {
      console.error('Failed to load manufacturers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredManufacturers = manufacturers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Загрузка производителей...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Управление производителями</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0066cc] text-white rounded-lg hover:bg-[#0052a3] transition-colors">
          <Plus size={18} />
          Добавить производителя
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск по названию или slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-transparent"
        />
      </div>

      {/* Manufacturers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredManufacturers.length === 0 ? (
          <div className="col-span-3 p-8 text-center text-gray-500">
            {searchQuery ? 'Производители не найдены' : 'Производители не найдены. Импортируйте товары из ChipDip.'}
          </div>
        ) : (
          filteredManufacturers.map((manufacturer) => (
            <div key={manufacturer.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{manufacturer.name}</h3>
                  <p className="text-xs text-gray-500">{manufacturer.slug}</p>
                </div>
                <div className="flex items-center gap-1">
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
              </div>

              {manufacturer.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{manufacturer.description}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-sm text-gray-600">{manufacturer.productCount} товаров</div>
                {manufacturer.website && (
                  <a
                    href={manufacturer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-[#0066cc] hover:text-[#0052a3] transition-colors"
                  >
                    Сайт
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Всего производителей</div>
          <div className="text-2xl font-semibold text-gray-900">{manufacturers.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Всего товаров</div>
          <div className="text-2xl font-semibold text-gray-900">
            {manufacturers.reduce((sum, m) => sum + m.productCount, 0)}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Средний размер каталога</div>
          <div className="text-2xl font-semibold text-gray-900">
            {manufacturers.length > 0 ? Math.round(manufacturers.reduce((sum, m) => sum + m.productCount, 0) / manufacturers.length) : 0}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">С веб-сайтом</div>
          <div className="text-2xl font-semibold text-gray-900">
            {manufacturers.filter((m) => m.website).length}
          </div>
        </div>
      </div>
    </div>
  )
}
