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
import { SA_CONTENT } from '@/lib/constants'

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

  // Board Only and Apparel are trade/internal items — hide from customer shop
  const hiddenFromShop = ['Board Only', 'Apparel', 'boards']

  // Deduplicate by id (safety net against API returning duplicates)
  const seen = new Set<string>()
  const uniqueProducts = allProducts.filter((p: any) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  const filteredProducts = selectedCategory === 'all'
    ? uniqueProducts.filter((p: any) => p.inStock && !hiddenFromShop.includes(p.categoryTag || p.category || ''))
    : selectedCategory === 'accessories'
      ? uniqueProducts.filter((p: any) => p.inStock && accessoryCategories.includes(p.categoryTag || p.category || ''))
      : uniqueProducts.filter((p: any) => p.inStock && (p.categoryTag === selectedCategory || p.category === selectedCategory));

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
      {/* Category Filter Tabs */}
      <div className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4">
        {mainCategories.map((category) => {
          const Icon = category.icon
          const isActive = selectedCategory === category.id ||
            (category.id === 'accessories' && ['batteries', 'wings', 'parts', 'apparel'].includes(selectedCategory))

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
              <Icon className={`w-5 h-5 sm:w-7 sm:h-7 sm:mb-2 flex-shrink-0 ${isActive ? 'text-awake-black' : 'text-accent-primary'}`} />
              <span className={`font-semibold text-sm sm:text-base whitespace-nowrap ${isActive ? 'text-awake-black' : 'text-white'}`}>{category.name}</span>
              <p className={`hidden sm:block text-xs mt-0.5 ${isActive ? 'text-awake-black/70' : 'text-gray-400'}`}>
                {category.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
        {filteredProducts.map((product: any) => (
          <div
            key={product.id}
            className="bg-awake-gray rounded-xl overflow-hidden group hover:ring-2 hover:ring-accent-primary transition-all"
          >
            <Link href={`/products/${product.id}`}>
              <div className="relative h-44 sm:h-56 md:h-64 overflow-hidden cursor-pointer">
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
            <div className="p-3 sm:p-6">
              <div className="mb-2">
                <div className="text-xs text-accent-primary font-medium mb-0.5 truncate">{product.categoryTag}</div>
                <h3 className="text-sm sm:text-lg font-bold leading-tight">{product.name}</h3>
                {'skillLevel' in product && product.skillLevel && (
                  <div className="mt-1.5">
                    <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-xs font-medium rounded-full">
                      {product.skillLevel}
                    </span>
                  </div>
                )}
                <div className="mt-2">
                  <div className="text-base sm:text-xl font-bold text-accent-primary">
                    {formatPrice(product.price)}
                  </div>
                  {product.priceExVAT && (
                    <div className="text-xs text-gray-500 hidden sm:block">
                      {formatPrice(product.priceExVAT)} ex-VAT
                    </div>
                  )}
                </div>
              </div>

              {product.description && (
                <p className="text-gray-400 text-xs sm:text-sm mb-3 hidden sm:block line-clamp-2">{product.description}</p>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex gap-1.5 sm:gap-2">
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
                    className="flex-1 bg-accent-primary text-awake-black py-2 sm:py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors text-xs sm:text-sm"
                  >
                    Add to Cart
                  </button>
                  <Link
                    href={`/products/${product.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2.5 sm:px-4 py-2 sm:py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-xs sm:text-sm whitespace-nowrap"
                  >
                    Details
                  </Link>
                </div>
                <a
                  href={`https://wa.me/${SA_CONTENT.contact.whatsapp.replace(/[^0-9]/g, '')}?text=Hi%2C%20I%27m%20interested%20in%20the%20${encodeURIComponent(product.name)}.%20Can%20you%20help%3F`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-1.5 w-full py-2 sm:py-2.5 rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-colors text-xs sm:text-sm font-medium"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="hidden sm:inline">Contact Sales</span>
                  <span className="sm:hidden">WhatsApp</span>
                </a>
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
      <section className="relative pt-28 pb-10 sm:py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
              <span className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">Official Awake Distributor for South Africa</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4">
              Explore Our
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-cyan-400">
                Collection
              </span>
            </h1>
            <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto">
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
