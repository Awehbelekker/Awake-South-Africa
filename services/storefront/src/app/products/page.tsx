'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AWAKE_IMAGES } from '@/lib/constants'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'

const products = [
  {
    id: 'ravik-s',
    name: 'RÄVIK S',
    category: 'jetboards',
    price: 285000,
    image: AWAKE_IMAGES.products.ravikS,
    description: 'The ultimate electric jetboard for thrill-seekers. Top speed 57 km/h.',
    specs: ['57 km/h top speed', '45 min ride time', 'Carbon fiber construction'],
  },
  {
    id: 'ravik-3',
    name: 'RÄVIK 3',
    category: 'jetboards',
    price: 245000,
    image: AWAKE_IMAGES.products.ravik3,
    description: 'Perfect balance of performance and accessibility.',
    specs: ['50 km/h top speed', '40 min ride time', 'Premium build quality'],
  },
  {
    id: 'vinga-2',
    name: 'VINGA 2',
    category: 'efoils',
    price: 195000,
    image: AWAKE_IMAGES.products.vinga2,
    description: 'Glide above the water with our advanced eFoil technology.',
    specs: ['40 km/h top speed', '90 min ride time', 'Whisper quiet'],
  },
  {
    id: 'brabus-shadow',
    name: 'BRABUS x AWAKE',
    category: 'jetboards',
    price: 350000,
    image: AWAKE_IMAGES.products.brabusShadow,
    description: 'Luxury meets performance. Limited edition collaboration.',
    specs: ['60 km/h top speed', '45 min ride time', 'Exclusive BRABUS design'],
  },
  {
    id: 'battery-pack',
    name: 'Extra Battery Pack',
    category: 'accessories',
    price: 45000,
    image: AWAKE_IMAGES.accessories.battery,
    description: 'Extend your ride time with an additional battery.',
    specs: ['Quick swap design', '45 min additional ride time', 'LED indicators'],
  },
  {
    id: 'charger-pro',
    name: 'Pro Charger',
    category: 'accessories',
    price: 12000,
    image: AWAKE_IMAGES.accessories.charger,
    description: 'Fast charging solution for your Awake board.',
    specs: ['2 hour full charge', 'Smart charging', 'Travel friendly'],
  },
]

function ProductsContent() {
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get('category')
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'all')
  const { addItem } = useCartStore()
  const { addItem: addToWishlist, items: wishlistItems } = useWishlistStore()

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const isInWishlist = (id: string) => wishlistItems.some(item => item.id === id)

  return (
    <>
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {['all', 'jetboards', 'efoils', 'accessories'].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              selectedCategory === category
                ? 'bg-accent-primary text-awake-black'
                : 'bg-awake-gray text-white hover:bg-awake-gray/80'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
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
            <div className="relative h-64 overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <button
                onClick={() => addToWishlist({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                })}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isInWishlist(product.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-white/10 backdrop-blur text-white hover:bg-white/20'
                }`}
              >
                ♥
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{product.name}</h3>
                <span className="text-accent-primary font-bold">
                  {formatPrice(product.price)}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4">{product.description}</p>
              <ul className="text-sm text-gray-500 mb-6 space-y-1">
                {product.specs.map((spec, i) => (
                  <li key={i}>• {spec}</li>
                ))}
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => addItem({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1,
                  })}
                  className="flex-1 bg-accent-primary text-awake-black py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
                >
                  Add to Cart
                </button>
                <Link
                  href={`/products/${product.id}`}
                  className="px-4 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

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
    </>
  )
}

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Our Products</h1>
        <p className="text-xl text-gray-400 text-center mb-12">
          Premium electric watercraft for the ultimate riding experience
        </p>

        <Suspense fallback={<div className="text-center py-12">Loading products...</div>}>
          <ProductsContent />
        </Suspense>
      </div>
    </main>
  )
}
