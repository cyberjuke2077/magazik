'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ChevronRight, Folder } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  productCount: number
  parentId: string | null
  children?: Category[]
}

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      
      // Build tree structure
      const categoryMap = new Map<string, Category>()
      const rootCategories: Category[] = []
      
      // First pass: create all categories
      data.forEach((cat: Category) => {
        categoryMap.set(cat.id, { ...cat, children: [] })
      })
      
      // Second pass: build tree
      data.forEach((cat: Category) => {
        const category = categoryMap.get(cat.id)!
        if (cat.parentId) {
          const parent = categoryMap.get(cat.parentId)
          if (parent) {
            parent.children = parent.children || []
            parent.children.push(category)
          }
        } else {
          rootCategories.push(category)
        }
      })
      
      setCategories(rootCategories)
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCategories(newExpanded)
  }

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)

    return (
      <div key={category.id}>
        <div
          className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleCategory(category.id)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronRight
                  size={16}
                  className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </button>
            ) : (
              <div className="w-6" />
            )}
            
            <div className="flex items-center gap-2 flex-1">
              {category.icon ? (
                <span className="text-lg">{category.icon}</span>
              ) : (
                <Folder size={18} className="text-gray-400" />
              )}
              <div>
                <div className="font-medium text-gray-900 text-sm">{category.name}</div>
                <div className="text-xs text-gray-500">{category.slug}</div>
              </div>
            </div>

            <div className="text-sm text-gray-600">{category.productCount} товаров</div>
          </div>

          <div className="flex items-center gap-2 ml-4">
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

        {hasChildren && isExpanded && (
          <div>
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const countAllCategories = (cats: Category[]): number => {
    return cats.reduce((sum, cat) => {
      return sum + 1 + (cat.children ? countAllCategories(cat.children) : 0)
    }, 0)
  }

  const countAllProducts = (cats: Category[]): number => {
    return cats.reduce((sum, cat) => {
      return sum + cat.productCount + (cat.children ? countAllProducts(cat.children) : 0)
    }, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Загрузка категорий...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Управление категориями</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0066cc] text-white rounded-lg hover:bg-[#0052a3] transition-colors">
          <Plus size={18} />
          Добавить категорию
        </button>
      </div>

      {/* Categories tree */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-gray-600">КАТЕГОРИЯ</div>
            <div className="text-xs font-semibold text-gray-600">ДЕЙСТВИЯ</div>
          </div>
        </div>
        <div>
          {categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Категории не найдены. Импортируйте категории из ChipDip.
            </div>
          ) : (
            categories.map((category) => renderCategory(category))
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Всего категорий</div>
          <div className="text-2xl font-semibold text-gray-900">
            {countAllCategories(categories)}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Родительских категорий</div>
          <div className="text-2xl font-semibold text-gray-900">{categories.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Всего товаров</div>
          <div className="text-2xl font-semibold text-gray-900">
            {countAllProducts(categories)}
          </div>
        </div>
      </div>
    </div>
  )
}
