'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { Zap, Wind, Package, Sparkles } from 'lucide-react'
import { SA_CONTENT } from '@/lib/constants'
import { fulfillmentLabel, getProductInventory } from '@/lib/inventory'
import type { CatalogProduct } from '@/lib/catalog/types'
import { formatZarPrice } from '@/lib/catalog'

interface ProductsClientProps {
  initialProducts: CatalogProduct[]
  initialCategory?: string
}

export default function ProductsClient({
  initialProducts,
  initialCategory = 'all',
}: ProductsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const { addItem } = useCartStore()
  const { addItem: addToWishlist, items: wishlistItems } = useWishlistStore()

  const accessoryCategories = [
    'batteries',
    'wings',
    'parts',
    'apparel',
    'accessories',
    'Batteries',
    'Wings',
    'Parts',
    'Apparel',
    'Accessories',
  ]
  const hiddenFromShop = ['Board Only', 'Apparel', 'boards', 'Service']

  const filteredProducts =
    selectedCategory === 'all'
      ? initialProducts.filter(
          (p) => !hiddenFromShop.includes(p.categoryTag || p.category || '')
        )
      : selectedCategory === 'accessories'
        ? initialProducts.filter((p) =>
            accessoryCategories.includes(p.categoryTag || p.category || '')
          )
        : initialProducts.filter(
            (p) =>
              p.categoryTag === selectedCategory || p.category === selectedCategory
          )

  const isInWishlist = (id: string) => wishlistItems.some((item) => item.id === id)

  const mainCategories = [
    { id: 'all', name: 'All Products', icon: Sparkles, description: 'Browse our complete collection' },
    { id: 'jetboards', name: 'Jetboards', icon: Zap, description: 'High-speed surface riding' },
    { id: 'efoils', name: 'eFoils', icon: Wind, description: 'Fly above the water' },
    {
      id: 'accessories',
      name: 'Gear & Accessories',
      icon: Package,
      description: 'Complete your setup',
    },
  ]

  return (
    <>
      <div className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4">
        {mainCategories.map((category) => {
          const Icon = category.icon
          const isActive =
            selectedCategory === category.id ||
            (category.id === 'accessories' &&
              ['batteries', 'wings', 'parts', 'apparel'].includes(selectedCategory))

          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`group relative flex-shrink-0 flex items-center gap-2 sm:flex-col sm:items-start px-4 py-3 sm:p-5 rounded-xl sm:rounded-2xl text-left transition-all duration-300 overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-br from-accent-primary to-accent-secondary text-awake-black shadow-lg shadow-accent-primary/25'
                  : 'bg-awake-gray hover:bg-awake-gray/80 text-white'
              }`}
            >
              <Icon
                className={`w-5 h-5 sm:w-7 sm:h-7 sm:mb-2 flex-shrink-0 ${isActive ? 'text-awake-black' : 'text-accent-primary'}`}
              />
              <span
                className={`font-semibold text-sm sm:text-base whitespace-nowrap ${isActive ? 'text-awake-black' : 'text-white'}`}
              >
                {category.name}
              </span>
              <p
                className={`hidden sm:block text-xs mt-0.5 ${isActive ? 'text-awake-black/70' : 'text-gray-400'}`}
              >
                {category.description}
              </p>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
        {filteredProducts.map((product) => (
          <article
            key={product.id}
            className="bg-awake-gray rounded-xl overflow-hidden group hover:ring-2 hover:ring-accent-primary transition-all"
          >
            <Link href={`/products/${product.id}`}>
              <div className="relative h-44 sm:h-56 md:h-64 overflow-hidden cursor-pointer">
                {product.image && (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                {product.badge && (
                  <div className="absolute top-4 left-4 bg-accent-primary text-awake-black px-3 py-1 rounded-full text-xs font-bold z-10">
                    {product.badge}
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    addToWishlist({
                      id: product.id,
                      name: product.name,
                      price: product.price ?? 0,
                      image: product.image || '/images/awake-default.jpg',
                    })
                  }}
                  className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10 ${
                    isInWishlist(product.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/10 backdrop-blur text-white hover:bg-white/20'
                  }`}
                  aria-label="Add to wishlist"
                >
                  ♥
                </button>
              </div>
            </Link>
            <div className="p-3 sm:p-6">
              <div className="mb-2">
                <div className="text-xs text-accent-primary font-medium mb-0.5 truncate">
                  {product.categoryTag}
                </div>
                <h2 className="text-sm sm:text-lg font-bold leading-tight">{product.name}</h2>
                {product.skillLevel && (
                  <div className="mt-1.5">
                    <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-xs font-medium rounded-full">
                      {product.skillLevel}
                    </span>
                  </div>
                )}
                <div className="mt-2">
                  <div className="text-base sm:text-xl font-bold text-accent-primary">
                    {product.priceDisplay}
                  </div>
                  {!product.contactForPricing && product.priceExVAT != null && (
                    <div className="text-xs text-gray-500 hidden sm:block">
                      {formatZarPrice(product.priceExVAT)} ex-VAT
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {fulfillmentLabel(getProductInventory(product.id))}
                  </p>
                </div>
              </div>

              {product.description && (
                <p className="text-gray-400 text-xs sm:text-sm mb-3 hidden sm:block line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    disabled={product.contactForPricing}
                    onClick={() =>
                      addItem({
                        id: product.id,
                        name: product.name,
                        price: product.price ?? 0,
                        image: product.image || '/images/awake-default.jpg',
                        quantity: 1,
                      })
                    }
                    className="flex-1 bg-accent-primary text-awake-black py-2 sm:py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors text-xs sm:text-sm disabled:opacity-50"
                  >
                    {product.contactForPricing ? 'Contact Sales' : 'Add to Cart'}
                  </button>
                  <Link
                    href={`/products/${product.id}`}
                    className="px-2.5 sm:px-4 py-2 sm:py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-xs sm:text-sm whitespace-nowrap"
                  >
                    Details
                  </Link>
                </div>
                <a
                  href={`https://wa.me/${SA_CONTENT.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in the ${product.name}. Can you help?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2 sm:py-2.5 rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-colors text-xs sm:text-sm font-medium"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-xl font-bold mb-2">No products in this category yet</h3>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className="px-6 py-3 bg-accent-primary text-awake-black rounded-lg font-bold"
          >
            View All Products
          </button>
        </div>
      )}
    </>
  )
}
