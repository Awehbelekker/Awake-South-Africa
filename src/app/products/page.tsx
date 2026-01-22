'use client'

import { useState, Suspense, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useProductsStore } from '@/store/products'

function ProductsContent() {
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get('category')
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'all')
  const { addItem } = useCartStore()
  const { addItem: addToWishlist, items: wishlistItems } = useWishlistStore()
  const { products: allProducts } = useProductsStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Loading products...</div>
    </div>
  }

  const filteredProducts = selectedCategory === 'all' 
    ? allProducts.filter(p => p.inStock)
    : allProducts.filter(p => p.inStock && (p.categoryTag === selectedCategory || p.category === selectedCategory));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const isInWishlist = (id: string) => wishlistItems.some(item => item.id === id)

  // Get unique categories from products
  const categoryTags = Array.from(new Set(allProducts.map(p => p.categoryTag || p.category)))
  
  const categories = [
    { id: 'all', name: 'All Products', count: allProducts.filter(p => p.inStock).length },
    ...categoryTags.map(tag => ({
      id: tag,
      name: tag.charAt(0).toUpperCase() + tag.slice(1),
      count: allProducts.filter(p => p.inStock && (p.categoryTag === tag || p.category === tag)).length
    }))
  ].filter(c => c.count > 0)

  const jetboardsCount = allProducts.filter(p => p.inStock && (p.categoryTag === 'jetboards' || p.category === 'Jetboards')).length
  const efoilsCount = allProducts.filter(p => p.inStock && (p.categoryTag === 'efoils' || p.category === 'eFoils')).length
  const wingsCount = allProducts.filter(p => p.inStock && (p.categoryTag === 'wings' || p.category === 'Wings')).length

  return (
    <>
      {/* Category Filter - Simplified */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-accent-primary text-awake-black shadow-lg shadow-accent-primary/20'
                : 'bg-awake-gray text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            {category.name}
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
                  src={product.image || '/images/awake-default.jpg'}
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
                      image: product.image || '/images/awake-default.jpg',
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
              </div>
            </Link>
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
                      image: product.image || '/images/awake-default.jpg',
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
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Explore Our Collection</h1>
        <p className="text-xl text-gray-400 text-center mb-12">
          Premium electric watersports with South African support
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
