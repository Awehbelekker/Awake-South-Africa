'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useCartStore } from '@/store/cart'

export default function PaymentSuccessPage() {
  const { clearCart } = useCartStore()

  useEffect(() => {
    // Clear cart on successful payment
    clearCart()
  }, [clearCart])

  return (
    <main className="min-h-screen bg-awake-black text-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-400 mb-8">
          Thank you for your order. You'll receive a confirmation email shortly with your order details.
        </p>

        <div className="space-y-4">
          <Link
            href="/products"
            className="block w-full bg-accent-primary text-awake-black py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="block w-full border border-white/20 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-8 p-4 bg-awake-gray rounded-lg">
          <h3 className="font-semibold mb-2">What's Next?</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>✓ Order confirmation email sent</li>
            <li>✓ We'll contact you to arrange delivery</li>
            <li>✓ Free demo session included</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
