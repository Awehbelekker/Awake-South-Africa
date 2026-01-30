'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useWishlistStore } from '../../../store/wishlist'
import { useCartStore } from '../../../store/cart'

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore()
  const { addItem } = useCartStore()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleAddToCart = (item: typeof items[0]) => {
    addItem({
      ...item,
      quantity: 1,
    })
    removeItem(item.id)
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-awake-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">♥</div>
          <h1 className="text-3xl font-bold mb-4">Your Wishlist is Empty</h1>
          <p className="text-gray-400 mb-8">
            Save your favorite products here and come back when you're ready to buy.
          </p>
          <Link
            href="/products"
            className="inline-block bg-accent-primary text-awake-black px-8 py-3 rounded-lg font-bold"
          >
            Browse Products
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Your Wishlist</h1>
          <button
            onClick={clearWishlist}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-awake-gray rounded-xl overflow-hidden group"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <span className="text-accent-primary font-bold">
                    {formatPrice(item.price)}
                  </span>
                </div>
                <button
                  onClick={() => handleAddToCart(item)}
                  className="w-full bg-accent-primary text-awake-black py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
