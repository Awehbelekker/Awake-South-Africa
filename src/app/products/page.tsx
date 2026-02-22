'use client'

import { useState, Suspense, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useProducts } from '@/lib/medusa-hooks'
import { useProductsStore } from '@/store/products'
import { Zap, Wind, Package, Sparkles, Loader2 } from 'lucide-react'

function ProductsContent() {
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get('category')
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'all')
  const { addItem } = useCartStore()
  const { addItem: addToWishlist, items: wishlistItems } = useWishlistStore()

  // Try Medusa API first, fall back to local store
  const { data: medusaProducts, isLoading, error } = useProducts()
  const { products: localProducts } = useProductsStore()

  // Use Medusa products if available, otherwise fall back to local
  const allProducts = medusaProducts && medusaProducts.length > 0 ? medusaProducts : localProducts

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state only if mounted is false OR (isLoading AND no error AND no local products)
  // This ensures we fall back to local products if API fails
  if (!mounted) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent-primary animate-spin mb-4" />
        <div className="text-gray-400">Loading your adventure...</div>
      </div>
    )
  }

  // If still loading from API but we have local products, use them
  // Only show loading if we have no products at all
  if (isLoading && localProducts.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent-primary animate-spin mb-4" />
        <div className="text-gray-400">Loading your adventure...</div>
      </div>
    )
  }

  // Accessory categories grouped together
  const accessoryCategories = ['batteries', 'wings', 'parts', 'apparel', 'accessories', 'Batteries', 'Wings', 'Parts', 'Apparel', 'Accessories']

  const filteredProducts = selectedCategory === 'all'
    ? allProducts.filter((p: any) => p.inStock)
    : selectedCategory === 'accessories'
      ? allProducts.filter((p: any) => p.inStock && accessoryCategories.includes(p.categoryTag || p.category || ''))
      : allProducts.filter((p: any) => p.inStock && (p.categoryTag === selectedCategory || p.category === selectedCategory));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const isInWishlist = (id: string) => wishlistItems.some(item => item.id === id)

  // Simplified customer-focused categories
  const mainCategories = [
    {
      id: 'all',
      name: 'All Products',
      icon: Sparkles,
      description: 'Browse our complete collection'
    },
    {
      id: 'jetboards',
      name: 'Jetboards',
      icon: Zap,
      description: 'High-speed surface riding'
    },
    {
      id: 'efoils',
      name: 'eFoils',
      icon: Wind,
      description: 'Fly above the water'
    },
    {
      id: 'accessories',
      name: 'Gear & Accessories',
      icon: Package,
      description: 'Complete your setup'
    },
  ]

  return (
    <>
      {/* Inspirational Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {mainCategories.map((category) => {
          const Icon = category.icon
          const isActive = selectedCategory === category.id ||
            (category.id === 'accessories' && ['batteries', 'wings', 'parts', 'apparel'].includes(selectedCategory))

          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`group relative p-6 rounded-2xl text-left transition-all duration-300 overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-br from-accent-primary to-accent-secondary text-awake-black shadow-lg shadow-accent-primary/25'
                  : 'bg-awake-gray hover:bg-awake-gray/80 text-white hover:shadow-lg'
              }`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-opacity ${
                isActive ? 'bg-white/20 opacity-100' : 'bg-accent-primary/10 opacity-0 group-hover:opacity-100'
              }`} />
              <Icon className={`w-8 h-8 mb-3 relative z-10 ${isActive ? 'text-awake-black' : 'text-accent-primary'}`} />
              <h3 className="font-bold text-lg relative z-10">{category.name}</h3>
              <p className={`text-sm mt-1 relative z-10 ${isActive ? 'text-awake-black/70' : 'text-gray-400'}`}>
                {category.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product: any) => (
          <div
            key={product.id}
            className="bg-awake-gray rounded-xl overflow-hidden group hover:ring-2 hover:ring-accent-primary transition-all"
          >
            <Link href={`/products/${product.id}`}>
              <div className="relative h-64 overflow-hidden cursor-pointer">
                <Image
                  src={('images' in product && product.images && product.images.length > 0)
                    ? product.images[0].url
                    : (product.image || '/images/awake-default.jpg')}
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
                  {product.specs.slice(0, 3).map((spec: any, i: number) => (
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
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏄‍♂️</div>
          <h3 className="text-xl font-bold mb-2">No products in this category yet</h3>
          <p className="text-gray-400 mb-6">Check out our other amazing products or contact us for special requests.</p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="px-6 py-3 bg-accent-primary text-awake-black rounded-lg font-bold hover:bg-accent-secondary transition-colors"
          >
            View All Products
          </button>
        </div>
      )}

      {/* Finance & Support CTA */}
      <div className="mt-16 grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-accent-primary/20 to-cyan-500/10 rounded-2xl p-8 border border-accent-primary/20">
          <h3 className="text-2xl font-bold mb-3">Flexible Payment Options</h3>
          <p className="text-gray-300 mb-6">
            Make your dream board a reality with 0% interest financing through PayJustNow. Split into 3 easy payments.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-accent-primary text-awake-black px-6 py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
          >
            Learn More
          </Link>
        </div>
        <div className="bg-awake-gray rounded-2xl p-8 border border-white/5">
          <h3 className="text-2xl font-bold mb-3">Need Help Choosing?</h3>
          <p className="text-gray-300 mb-6">
            Our team of watersports experts is here to help you find the perfect board for your skill level and riding style.
          </p>
          <Link
            href="/demo"
            className="inline-block bg-white/10 text-white px-6 py-3 rounded-lg font-bold hover:bg-white/20 transition-colors border border-white/20"
          >
            Book a Demo Ride
          </Link>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span className="text-accent-primary">✓</span> All prices include VAT
        </div>
        <div className="flex items-center gap-2">
          <span className="text-accent-primary">✓</span> Free shipping on boards
        </div>
        <div className="flex items-center gap-2">
          <span className="text-accent-primary">✓</span> 2 Year Warranty
        </div>
        <div className="flex items-center gap-2">
          <span className="text-accent-primary">✓</span> SA Support & Service
        </div>
      </div>
    </>
  )
}

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-awake-black text-white">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
              <span className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">Official Awake Distributor for South Africa</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Explore Our
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-cyan-400">
                Collection
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Premium electric surfboards, eFoils, and accessories. Find your perfect ride and experience the future of watersports.
            </p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
              <p className="mt-4 text-gray-400">Loading your adventure...</p>
            </div>
          }>
            <ProductsContent />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
