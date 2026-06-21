'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, ChevronUp, ChevronDown, Copy, Check, FileText } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'
import { flyToCart } from '@/lib/fly-to-cart'
import { TrackRecentlyViewed } from '@/components/catalog/track-recently-viewed'
import { RecentlyViewed } from '@/components/catalog/recently-viewed'
import { StickyAddBar } from '@/components/product/sticky-add-bar'
import { CompareToggleBtn } from '@/components/catalog/compare-toggle-btn'
import { fallbackImageForProduct } from '@/lib/enrichment/images/package-image'
import { type Product } from '@/lib/queries/products'

interface ProductClientProps {
  product: Product
  related: Product[]
}

type Tab = 'description' | 'specs' | 'docs'

export function ProductClientChipDip({ product, related }: ProductClientProps) {
  const [quantity, setQuantity] = useState(product.minOrder)
  const [activeTab, setActiveTab] = useState<Tab>('description')
  const [activePhoto, setActivePhoto] = useState(0)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const { addItem } = useCart()
  const addBtnRef = useRef<HTMLButtonElement>(null)

  // Real product images from DB (R2-hosted, classified clean). When the
  // product has no real photo, fall back to a generic SVG of its package
  // family (or the neutral placeholder if the package is unknown), so the
  // UI is never blank and stays on-brand.
  const photos =
    product.images.length > 0
      ? product.images
      : [
          fallbackImageForProduct({
            package: product.package,
            partNumber: product.partNumber,
            name: product.name,
          }),
        ]

  function handleAddToCart() {
    addItem(product, quantity)
    flyToCart(addBtnRef.current)
  }

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'description', label: 'Описание' },
    { id: 'specs', label: 'Характеристики' },
    { id: 'docs', label: 'Документация' },
  ]

  // Get first 8 specs for preview
  const previewSpecs = Object.entries(product.specs).slice(0, 8)

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />
      <TrackRecentlyViewed
        slug={product.slug}
        name={product.name}
        partNumber={product.partNumber}
        manufacturer={product.manufacturer}
        categorySlug={product.categorySlug}
        price={product.price}
      />
      
      <main>
        {/* Breadcrumbs */}
        <div className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-[1400px] px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-ink-3">
              <Link href="/" className="hover:text-ink">Главная</Link>
              <span>›</span>
              <Link href="/catalog" className="hover:text-ink">Каталог</Link>
              <span>›</span>
              <Link href={`/catalog?category=${product.categorySlug}`} className="hover:text-ink">{product.category}</Link>
              <span>›</span>
              <span className="text-ink font-semibold">{product.name}</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4">
          {/* Title */}
          <div className="py-6">
            <h1 className="text-[28px] font-bold text-ink leading-tight">{product.name}</h1>
          </div>

          {/* Product Main Section */}
          <div className="flex gap-12 mb-10">
            {/* Photo Gallery */}
            <div className="flex-shrink-0">
              <div className="flex gap-6">
                {/* Thumbnails with scroll buttons */}
                <div className="flex flex-col gap-2 w-[80px]">
                  <button
                    onClick={() => setActivePhoto(Math.max(0, activePhoto - 1))}
                    disabled={activePhoto === 0}
                    className={`h-[28px] border rounded-sm flex items-center justify-center transition-all ${
                      activePhoto === 0
                        ? 'border-white opacity-30 cursor-default'
                        : 'border-white hover:border-ink'
                    }`}
                  >
                    <ChevronUp size={18} className="text-ink" />
                  </button>

                  <div className="flex flex-col gap-2 max-h-[400px] overflow-hidden">
                    {photos.slice(0, 5).map((imageUrl, i) => {
                      const photoIndex = activePhoto + i
                      if (photoIndex >= photos.length) return null
                      return (
                        <button
                          key={photoIndex}
                          onClick={() => setActivePhoto(photoIndex)}
                          className={`w-[80px] h-[80px] border flex items-center justify-center overflow-hidden transition-all ${
                            activePhoto === photoIndex
                              ? 'border-[var(--border-2)] bg-white'
                              : 'border-[var(--border)] bg-white hover:border-[var(--border-2)]'
                          }`}
                        >
                          <Image
                            src={photos[photoIndex]}
                            alt={`${product.name} - фото ${photoIndex + 1}`}
                            width={80}
                            height={80}
                            className="w-full h-full object-contain"
                            unoptimized={photos[photoIndex].startsWith('/')}
                          />
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setActivePhoto(Math.min(photos.length - 1, activePhoto + 1))}
                    disabled={activePhoto >= photos.length - 5}
                    className={`h-[28px] border rounded-sm flex items-center justify-center transition-all ${
                      activePhoto >= photos.length - 5
                        ? 'border-white opacity-30 cursor-default'
                        : 'border-white hover:border-ink'
                    }`}
                  >
                    <ChevronDown size={18} className="text-ink" />
                  </button>
                </div>

                {/* Main Photo */}
                <div>
                  <div className="w-[400px] h-[400px] border border-[var(--border)] flex items-center justify-center bg-white cursor-pointer mb-3 relative">
                    <Image
                      src={photos[activePhoto]}
                      alt={`${product.name} - фото ${activePhoto + 1}`}
                      width={400}
                      height={400}
                      priority
                      className="w-full h-full object-contain p-4"
                      unoptimized={photos[activePhoto].startsWith('/')}
                    />
                  </div>
                  <div className="text-center text-xs text-ink-4 leading-tight max-w-[400px]">
                    Изображения служат только для ознакомления,<br />
                    <span className="whitespace-nowrap">см. техническую документацию</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product IDs */}
            <div className="flex-grow min-w-[300px]">
              <div className="space-y-4 text-sm">
                <div className="flex items-baseline gap-3">
                  <span className="text-ink-4 text-xs block max-w-[62%]">Артикул</span>
                  <div className="flex items-center gap-2">
                    <span className="text-ink font-bold text-sm">{product.partNumber}</span>
                    <button
                      onClick={() => handleCopy(product.partNumber, 'partNumber')}
                      className="relative opacity-50 hover:opacity-100 transition-opacity"
                      title="Копировать"
                    >
                      {copiedField === 'partNumber' ? (
                        <Check size={14} className="text-stock" />
                      ) : (
                        <Copy size={14} className="text-ink-3" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-baseline gap-3">
                  <span className="text-ink-4 text-xs block max-w-[62%]">Бренд</span>
                  <Link href={`/catalog?manufacturer=${product.manufacturer}`} className="text-ink font-bold text-sm hover:underline">
                    {product.manufacturer}
                  </Link>
                </div>

                {/* Preview specs */}
                {previewSpecs.map(([key, value]) => (
                  <div key={key} className="flex items-baseline gap-3">
                    <span className="text-ink-4 text-xs block max-w-[62%]">{key}</span>
                    <span className="text-ink font-bold text-sm">{value}</span>
                  </div>
                ))}

                {Object.keys(product.specs).length > 8 && (
                  <div>
                    <button
                      onClick={() => setActiveTab('specs')}
                      className="text-ink text-sm hover:underline cursor-pointer"
                    >
                      Все параметры
                    </button>
                  </div>
                )}

                {/* Weight */}
                <div className="flex items-baseline gap-3 pt-2 border-t border-[var(--border)]">
                  <span className="text-ink-4 text-xs block max-w-[62%]">Вес</span>
                  <span className="text-ink font-bold text-sm">
                    {product.weight ? `${product.weight} г` : '-'}
                  </span>
                </div>

                {product.datasheets.length > 0 && (
                  <div className="border border-[var(--border)] rounded-sm p-4 mt-6 inline-block bg-white">
                    <div className="text-xs text-ink-4 mb-3">Техническая документация:</div>
                    {product.datasheets.slice(0, 2).map((ds) => (
                      <a
                        key={ds.id}
                        href={ds.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 mb-2 last:mb-0 group"
                      >
                        <FileText size={20} className="text-azure flex-shrink-0" />
                        <div>
                          <div className="text-azure text-sm font-semibold group-hover:underline">
                            {ds.title}
                          </div>
                          <div className="text-xs text-ink-4">pdf</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {product.datasheets.length > 2 && (
                  <div className="mt-2">
                    <button
                      onClick={() => setActiveTab('docs')}
                      className="text-azure text-sm hover:underline cursor-pointer"
                    >
                      Все документы
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Ordering Controls */}
            <div className="flex-shrink-0 w-[400px]" data-add-to-cart-block>
              <div className="border-l border-[var(--border)] pl-12">
                {/* Price */}
                <div className="flex items-center gap-6 pt-4 pb-6">
                  <div className="price text-[32px]">
                    {formatPrice(product.price)}
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-6 py-6">
                  <div className="flex items-center text-lg">
                    <button
                      onClick={() => setQuantity(Math.max(product.minOrder, quantity - 1))}
                      disabled={quantity <= product.minOrder}
                      className={`w-9 h-9 flex items-center justify-center border border-[var(--border-2)] text-ink-2 font-bold ${
                        quantity <= product.minOrder
                          ? 'bg-[#fafafa] text-ink-4 cursor-default'
                          : 'bg-[#f8fafc] hover:bg-white hover:text-black'
                      }`}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(product.minOrder, parseInt(e.target.value) || product.minOrder))}
                      className="w-[72px] h-9 text-center border-t border-b border-[var(--border-2)] font-bold text-lg outline-none"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center bg-[#f8fafc] border border-[var(--border-2)] text-ink-2 hover:bg-white hover:text-black font-bold"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="text-sm text-ink-3">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-3" fill="none" viewBox="0 0 15 11">
                        <path d="M1 5.5L5.5 10L14 1" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>{quantity} шт.</span>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <div className="pt-4 space-y-2">
                  <button
                    ref={addBtnRef}
                    onClick={handleAddToCart}
                    className="w-full py-3 px-6 bg-azure text-white rounded-lg font-medium hover:bg-azure-hover transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={20} />
                    <span>Добавить в корзину</span>
                  </button>
                  <CompareToggleBtn
                    item={{
                      id: product.id,
                      slug: product.slug,
                      name: product.name,
                      partNumber: product.partNumber,
                      manufacturer: product.manufacturer,
                      categorySlug: product.categorySlug,
                    }}
                    variant="full"
                  />
                </div>

                {/* Additional Links */}
                <div className="pt-6 space-y-3 text-sm">
                  <div>
                    <a href="#other-offers" className="text-ink font-bold hover:underline">Другие предложения</a>
                    <div className="text-xs text-ink-4">Этот же товар с другими ценами и сроками поставки</div>
                  </div>
                  <div>
                    <a href="#analogs" className="text-ink font-bold hover:underline">Аналоги</a>
                    <div className="text-xs text-ink-4">Товары со схожими характеристиками</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Content */}
          <div className="flex gap-6 mb-10">
            {/* Main Content (65%) */}
            <div className="flex-grow max-w-[850px]">
              {/* Tabs */}
              <div className="flex gap-4 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-2 text-lg transition-all border-b-[3px] ${
                      activeTab === tab.id
                        ? 'border-azure font-bold text-ink'
                        : 'border-transparent text-ink-3 hover:border-[var(--border)]'
                    }`}
                  >
                    <h2 className="inline">{tab.label}</h2>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="text-sm leading-relaxed">
                {activeTab === 'description' && (
                  <div className="text-ink">
                    <p className="mb-4">{product.description || 'Описание товара отсутствует.'}</p>
                    
                    {product.tags.length > 0 && (
                      <div className="mt-6">
                        <div className="text-xs text-ink-4 mb-2">Теги:</div>
                        <div className="flex flex-wrap gap-2">
                          {product.tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 text-xs bg-[#f8fafc] text-ink-3 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div>
                    {Object.keys(product.specs).length > 0 ? (
                      <table className="w-full">
                        <tbody>
                          {Object.entries(product.specs).map(([key, value], i) => (
                            <tr key={key} className="border-b border-[var(--border)]">
                              <td className="py-2 pr-12 text-ink-3 align-top w-1/3">{key}</td>
                              <td className="py-2 text-ink align-top">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-ink-4">Характеристики отсутствуют.</p>
                    )}
                  </div>
                )}

                {activeTab === 'docs' && (
                  <div>
                    {product.datasheets.length > 0 ? (
                      <div className="space-y-4">
                        <div className="text-ink font-semibold mb-3">Техническая документация</div>
                        {product.datasheets.map((datasheet) => (
                          <a
                            key={datasheet.id}
                            href={datasheet.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 group"
                          >
                            <FileText size={24} className="text-azure flex-shrink-0 mt-1" />
                            <div>
                              <div className="text-azure text-sm font-semibold group-hover:underline mb-1">
                                {datasheet.title}
                              </div>
                              <div className="text-xs text-ink-4">PDF документ</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-ink-4">Документация отсутствует.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar (35%) */}
            <div className="flex-shrink-0 w-[450px]">
              {/* Other Offers */}
              <div className="mb-6" id="other-offers">
                <h3 className="text-base font-bold text-ink mb-4">Другие предложения</h3>
                <div className="border border-[var(--border)] rounded">
                  <div className="p-4 text-center text-sm text-ink-4">
                    Другие предложения для этого товара отсутствуют
                  </div>
                </div>
              </div>

              {/* Analogs */}
              <div className="mb-6" id="analogs">
                <h3 className="text-base font-bold text-ink mb-4">Аналоги</h3>
                <div className="border border-[var(--border)] rounded">
                  {related.length > 0 ? (
                    <div className="divide-y divide-[var(--border)]">
                      {related.slice(0, 3).map((analog) => (
                        <Link
                          key={analog.id}
                          href={`/product/${analog.slug}`}
                          className="block p-4 hover:bg-[#fafafa] transition-colors"
                        >
                          <div className="text-sm text-ink font-semibold mb-1 hover:underline">
                            {analog.name}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-ink-3">{analog.manufacturer}</span>
                            <span className="text-sm font-bold text-ink">{formatPrice(analog.price)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-ink-4">
                      Аналоги для этого товара отсутствуют
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-[#f8fafc] p-4 rounded">
                <h3 className="text-sm font-bold text-ink mb-3">Информация о товаре</h3>
                <div className="text-xs text-ink-3 space-y-2">
                  <div className="flex justify-between py-1 border-b border-[var(--border)]">
                    <span>Минимальный заказ:</span>
                    <span className="font-bold text-ink">{product.minOrder} {product.unit}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Валюта:</span>
                    <span className="font-bold text-ink">{product.currency}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recently viewed */}
          <div className="mb-10">
            <RecentlyViewed excludeSlug={product.slug} variant="product" />
          </div>
        </div>
      </main>

      <StickyAddBar
        productName={product.name}
        partNumber={product.partNumber}
        manufacturer={product.manufacturer}
        price={product.price}
        unit={product.unit}
        minOrder={product.minOrder}
        inStock={product.inStock}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
      />

      <Footer />
    </div>
  )
}
