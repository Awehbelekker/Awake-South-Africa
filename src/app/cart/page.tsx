'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-awake-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🛒</div>
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-400 mb-8">
            Looks like you haven't added anything yet. Explore our products and find your perfect ride.
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
        <h1 className="text-4xl font-bold mb-8">Your Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-awake-gray rounded-xl p-4 flex gap-4"
              >
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-accent-primary font-semibold">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 bg-awake-black rounded flex items-center justify-center hover:bg-white/10"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-awake-black rounded flex items-center justify-center hover:bg-white/10"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-awake-gray rounded-xl p-6 h-fit">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{formatPrice(total())}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>VAT (15%)</span>
                <span>Included</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-accent-primary">{formatPrice(total())}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full bg-accent-primary text-awake-black py-4 rounded-lg font-bold text-center hover:bg-accent-secondary transition-colors"
            >
              Proceed to Checkout
            </Link>

            <div className="mt-6 p-4 bg-awake-black rounded-lg">
              <p className="text-sm text-gray-400 text-center">
                💳 PayFast & PayJustNow available
              </p>
            </div>

            <Link
              href="/products"
              className="block text-center text-sm text-gray-400 hover:text-accent-primary mt-4"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
