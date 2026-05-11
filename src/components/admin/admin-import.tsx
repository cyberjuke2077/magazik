'use client'

import { useState, useEffect } from 'react'
import { Play, Square, ChevronDown, ChevronRight, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface ImportLog {
  id: number
  timestamp: string
  level: 'success' | 'error' | 'warning' | 'info'
  message: string
}

interface ImportStats {
  totalCategories: number
  processedCategories: number
  currentCategory: string | null
  currentCategoryName: string | null
  totalProducts: number
  imported: number
  updated: number
  failed: number
  duration: number
  isRunning: boolean
  estimatedTimeRemaining: number | null
  importSpeed: number | null
  progressPercent: number
}

interface ImportSettings {
  selectedCategorySlugs: string[]
  updateExisting: boolean
  loadSpecs: boolean
}

interface Level2Category {
  id: string
  name: string
  slug: string
  productCount: number
}

interface Level1Category {
  id: string
  name: string
  slug: string
  children: Level2Category[]
}

export function AdminImport() {
  const [stats, setStats] = useState<ImportStats>({
    totalCategories: 0,
    processedCategories: 0,
    currentCategory: null,
    currentCategoryName: null,
    totalProducts: 0,
    imported: 0,
    updated: 0,
    failed: 0,
    duration: 0,
    isRunning: false,
    estimatedTimeRemaining: null,
    importSpeed: null,
    progressPercent: 0,
  })
  const [logs, setLogs] = useState<ImportLog[]>([])
  const [categoriesTree, setCategoriesTree] = useState<Level1Category[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [settings, setSettings] = useState<ImportSettings>({
    selectedCategorySlugs: [],
    updateExisting: true,
    loadSpecs: true,
  })

  // Load categories tree on mount
  useEffect(() => {
    fetch('/api/admin/categories-tree')
      .then(res => res.json())
      .then(data => setCategoriesTree(data || []))
      .catch(err => console.error('Failed to load categories:', err))
  }, [])

  // Poll status every 2 seconds when import is running
  useEffect(() => {
    if (!stats.isRunning) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/admin/import')
        const data = await response.json()
        setStats(data.stats)
        setLogs(data.logs)
      } catch (error) {
        console.error('Failed to fetch import status:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [stats.isRunning])

  const handleStartImport = async () => {
    if (selectedCategories.size === 0) {
      alert('Выберите хотя бы одну категорию для импорта')
      return
    }

    try {
      const importSettings: ImportSettings = {
        selectedCategorySlugs: Array.from(selectedCategories),
        updateExisting: settings.updateExisting,
        loadSpecs: settings.loadSpecs,
      }

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', settings: importSettings }),
      })

      if (response.ok) {
        setStats(prev => ({ ...prev, isRunning: true }))
      }
    } catch (error) {
      console.error('Failed to start import:', error)
    }
  }

  const handleStopImport = async () => {
    try {
      await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      })
    } catch (error) {
      console.error('Failed to stop import:', error)
    }
  }

  const toggleLevel1 = (level1Id: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(level1Id)) {
      newExpanded.delete(level1Id)
    } else {
      newExpanded.add(level1Id)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleLevel2 = (level2Slug: string) => {
    const newSelected = new Set(selectedCategories)
    if (newSelected.has(level2Slug)) {
      newSelected.delete(level2Slug)
    } else {
      newSelected.add(level2Slug)
    }
    setSelectedCategories(newSelected)
  }

  const toggleAllLevel2InLevel1 = (level1: Level1Category) => {
    const newSelected = new Set(selectedCategories)
    const allSelected = level1.children.every(child => newSelected.has(child.slug))
    
    if (allSelected) {
      // Deselect all
      level1.children.forEach(child => newSelected.delete(child.slug))
    } else {
      // Select all
      level1.children.forEach(child => newSelected.add(child.slug))
    }
    
    setSelectedCategories(newSelected)
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}ч ${minutes}м ${secs}с`
    } else if (minutes > 0) {
      return `${minutes}м ${secs}с`
    } else {
      return `${secs}с`
    }
  }

  const formatETA = (seconds: number | null): string => {
    if (seconds === null || seconds <= 0) return 'Расчёт...'
    return formatDuration(seconds)
  }

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success': return <CheckCircle className="size-4 text-green-500" />
      case 'error': return <AlertCircle className="size-4 text-red-500" />
      case 'warning': return <AlertCircle className="size-4 text-orange-500" />
      default: return <Clock className="size-4 text-blue-500" />
    }
  }

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'warning': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const categoryProgress = stats.totalCategories > 0
    ? Math.floor((stats.processedCategories / stats.totalCategories) * 100)
    : 0

  const productProgress = stats.totalProducts > 0
    ? Math.floor(((stats.imported + stats.updated + stats.failed) / stats.totalProducts) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Импорт товаров</h2>
          <p className="text-sm text-gray-500 mt-1">
            Импорт товаров из ChipDip.ru
          </p>
        </div>
        <div className="flex gap-3">
          {!stats.isRunning ? (
            <button
              onClick={handleStartImport}
              disabled={selectedCategories.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#0066cc] text-white rounded-lg hover:bg-[#0052a3] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="size-4" />
              Запустить импорт
            </button>
          ) : (
            <button
              onClick={handleStopImport}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Square className="size-4" />
              Остановить
            </button>
          )}
        </div>
      </div>

      {/* Progress Section */}
      {stats.isRunning && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Progress */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Категории</span>
              <span className="text-sm text-gray-500">{categoryProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-[#0066cc] h-2 rounded-full transition-all"
                style={{ width: `${categoryProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {stats.processedCategories} / {stats.totalCategories}
            </p>
            {stats.currentCategoryName && (
              <p className="text-xs text-gray-600 mt-1">
                Текущая: {stats.currentCategoryName}
              </p>
            )}
          </div>

          {/* Product Progress */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Товары</span>
              <span className="text-sm text-gray-500">{productProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${productProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {stats.imported + stats.updated + stats.failed} / {stats.totalProducts}
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats.isRunning && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="size-4 text-[#0066cc] animate-spin" />
              <span className="text-xs text-gray-500">Скорость</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {stats.importSpeed ? `${stats.importSpeed.toFixed(1)} тов/мин` : '—'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="size-4 text-gray-400" />
              <span className="text-xs text-gray-500">Осталось</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {formatETA(stats.estimatedTimeRemaining)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Прошло: {formatDuration(stats.duration)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <span className="text-xs text-gray-500">Импортировано</span>
            <p className="text-lg font-semibold text-green-600">{stats.imported}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <span className="text-xs text-gray-500">Обновлено</span>
            <p className="text-lg font-semibold text-blue-600">{stats.updated}</p>
          </div>
        </div>
      )}

      {/* Settings and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Tree */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Выбор категорий ({selectedCategories.size} выбрано)
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {categoriesTree.map((level1) => {
              const isExpanded = expandedCategories.has(level1.id)
              const allChildrenSelected = level1.children.every(child => 
                selectedCategories.has(child.slug)
              )
              const someChildrenSelected = level1.children.some(child => 
                selectedCategories.has(child.slug)
              )

              return (
                <div key={level1.id} className="border border-gray-200 rounded-lg">
                  {/* Level 1 Header */}
                  <div className="flex items-center gap-2 p-3 bg-gray-50">
                    <button
                      onClick={() => toggleLevel1(level1.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>
                    <input
                      type="checkbox"
                      checked={allChildrenSelected}
                      ref={input => {
                        if (input) {
                          input.indeterminate = someChildrenSelected && !allChildrenSelected
                        }
                      }}
                      onChange={() => toggleAllLevel2InLevel1(level1)}
                      className="size-4 text-[#0066cc] rounded"
                    />
                    <span className="font-medium text-gray-900">
                      {level1.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({level1.children.length} подкатегорий)
                    </span>
                  </div>

                  {/* Level 2 Children */}
                  {isExpanded && (
                    <div className="p-2 space-y-1">
                      {level1.children.map((level2) => (
                        <label
                          key={level2.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.has(level2.slug)}
                            onChange={() => toggleLevel2(level2.slug)}
                            className="size-4 text-[#0066cc] rounded ml-6"
                          />
                          <span className="text-sm text-gray-700">{level2.name}</span>
                          <span className="text-xs text-gray-400">
                            ({level2.productCount} товаров)
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Настройки</h3>
          
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.updateExisting}
                onChange={(e) => setSettings({ ...settings, updateExisting: e.target.checked })}
                className="size-4 text-[#0066cc] rounded"
              />
              <span className="text-sm text-gray-700">Обновлять существующие товары</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.loadSpecs}
                onChange={(e) => setSettings({ ...settings, loadSpecs: e.target.checked })}
                className="size-4 text-[#0066cc] rounded"
              />
              <span className="text-sm text-gray-700">Загружать характеристики</span>
            </label>
          </div>

          {stats.failed > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-xs text-red-600">Ошибок: {stats.failed}</span>
            </div>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white p-5 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Логи импорта</h3>
        
        <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Логи появятся после запуска импорта</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded">
                {getLogIcon(log.level)}
                <span className="text-gray-400">{log.timestamp}</span>
                <span className={getLogColor(log.level)}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
