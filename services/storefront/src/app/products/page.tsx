'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PRODUCTS } from '@/lib/constants'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'

// Flatten all products into a single array
const allProducts = [
  ...PRODUCTS.jetboards,
  ...PRODUCTS.limitedEdition,
  ...PRODUCTS.efoils,
  ...PRODUCTS.batteries,
  ...PRODUCTS.boardsOnly,
  ...PRODUCTS.wings,
  ...PRODUCTS.bags,
  ...PRODUCTS.safetyStorage,
  ...PRODUCTS.electronics,
  ...PRODUCTS.parts,
  ...PRODUCTS.apparel,
]

function ProductsContent() {
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get('category')
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'all')
  const { addItem } = useCartStore()
  const { addItem: addToWishlist, items: wishlistItems } = useWishlistStore()

  const filteredProducts = selectedCategory === 'all' 
    ? allProducts 
    : selectedCategory === 'jetboards' 
      ? [...PRODUCTS.jetboards, ...PRODUCTS.limitedEdition]
      : selectedCategory === 'efoils'
        ? PRODUCTS.efoils
        : selectedCategory === 'batteries'
          ? PRODUCTS.batteries
          : selectedCategory === 'wings'
            ? PRODUCTS.wings
            : selectedCategory === 'accessories'
              ? [...PRODUCTS.bags, ...PRODUCTS.safetyStorage, ...PRODUCTS.electronics, ...PRODUCTS.parts]
              : selectedCategory === 'apparel'
                ? PRODUCTS.apparel
                : allProducts.filter(p => p.category === selectedCategory);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const isInWishlist = (id: string) => wishlistItems.some(item => item.id === id)

  const categories = [
    { id: 'all', name: 'All Products', count: allProducts.length },
    { id: 'jetboards', name: 'Jetboards', count: PRODUCTS.jetboards.length + PRODUCTS.limitedEdition.length },
    { id: 'efoils', name: 'eFoils', count: PRODUCTS.efoils.length },
    { id: 'batteries', name: 'Batteries', count: PRODUCTS.batteries.length },
    { id: 'wings', name: 'Wings', count: PRODUCTS.wings.length },
    { id: 'accessories', name: 'Accessories', count: PRODUCTS.bags.length + PRODUCTS.safetyStorage.length + PRODUCTS.electronics.length + PRODUCTS.parts.length },
    { id: 'apparel', name: 'Apparel', count: PRODUCTS.apparel.length },
  ]

  return (
    <>
      {/* Stats Banner */}
      <div className="bg-awake-gray rounded-xl p-6 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-3xl font-bold text-accent-primary">{PRODUCTS.jetboards.length + PRODUCTS.limitedEdition.length}</div>
          <div className="text-sm text-gray-400">Jetboards</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-accent-primary">{PRODUCTS.efoils.length}</div>
          <div className="text-sm text-gray-400">eFoils</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-accent-primary">{PRODUCTS.wings.length}</div>
          <div className="text-sm text-gray-400">Wing Kits</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-accent-primary">{allProducts.length}</div>
          <div className="text-sm text-gray-400">Total Products</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-5 py-3 rounded-lg font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-accent-primary text-awake-black'
                : 'bg-awake-gray text-white hover:bg-awake-gray/80'
            }`}
          >
            {category.name} <span className="text-sm opacity-70">({category.count})</span>
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-awake-gray rounded-xl overflow-hidden group hover:ring-2 hover:ring-accent-primary transition-all"
          >
            <Link href={`/products/${product.id}`}>
              <div className="relative h-64 overflow-hidden cursor-pointer">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {'badge' in product && product.badge && (
                <div className="absolute top-4 left-4 bg-accent-primary text-awake-black px-3 py-1 rounded-full text-xs font-bold z-10">
                  {product.badge}
                </div>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  addToWishlist({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                  });
                }}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10 ${
                  isInWishlist(product.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-white/10 backdrop-blur text-white hover:bg-white/20'
                }`}
              >
                ♥
              </button>
            </Link>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-xs text-accent-primary font-medium mb-1">{product.categoryTag}</div>
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  {'battery' in product && product.battery && (
                    <div className="text-xs text-gray-500 mt-1">🔋 {product.battery}</div>
                  )}
                  {'skillLevel' in product && product.skillLevel && (
                    <div className="mt-2 inline-block">
                      <span className="px-2 py-1 bg-accent-primary/10 text-accent-primary text-xs font-medium rounded-full">
                        {product.skillLevel}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-xl font-bold text-accent-primary">
                    {formatPrice(product.price)}
                  </div>
                  {product.priceExVAT && (
                    <div className="text-xs text-gray-500">
                      {formatPrice(product.priceExVAT)} ex-VAT
                    </div>
                  )}
                </div>
              </div>
              
              {product.description && (
                <p className="text-gray-400 text-sm mb-4">{product.description}</p>
              )}
              
              {'specs' in product && product.specs && product.specs.length > 0 && (
                <ul className="text-sm text-gray-500 mb-4 space-y-1">
                  {product.specs.slice(0, 3).map((spec, i) => (
                    <li key={i}>• {spec}</li>
                  ))}
                </ul>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addItem({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                      quantity: 1,
                    });
                  }}
                  className="flex-1 bg-accent-primary text-awake-black py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors text-sm"
                >
                  Add to Cart
                </button>
                <Link
                  href={`/products/${product.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No products found in this category.</p>
        </div>
      )}

      {/* Finance CTA */}
      <div className="mt-16 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Finance Options Available</h2>
        <p className="text-gray-300 mb-6">
          Split your purchase with PayFast PayJustNow. 0% interest, 3 easy payments.
        </p>
        <Link
          href="/contact"
          className="inline-block bg-white text-awake-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
        >
          Enquire Now
        </Link>
      </div>

      {/* Price Info */}
      <div className="mt-8 bg-awake-gray rounded-xl p-6">
        <h3 className="font-bold mb-3 text-center">📋 Pricing Information</h3>
        <ul className="text-sm text-gray-400 space-y-2 max-w-2xl mx-auto">
          <li>✓ All prices include 15% VAT</li>
          <li>✓ Customs duties calculated per product category</li>
          <li>✓ Exchange rate: R19.85/EUR (December 2025)</li>
          <li>✓ Free standard shipping on complete boards</li>
        </ul>
      </div>
    </>
  )
}

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Complete Product Catalog</h1>
        <p className="text-xl text-gray-400 text-center mb-12">
          Official Awake products with South African pricing (December 2025)
        </p>

        <Suspense fallback={
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
            <p className="mt-4 text-gray-400">Loading products...</p>
          </div>
        }>
          <ProductsContent />
        </Suspense>
      </div>
    </main>
  )
}
