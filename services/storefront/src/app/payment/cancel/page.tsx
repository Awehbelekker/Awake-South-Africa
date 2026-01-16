'use client'

import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen bg-awake-black text-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
        <p className="text-gray-400 mb-8">
          Your payment was cancelled. Your cart items are still saved if you'd like to try again.
        </p>

        <div className="space-y-4">
          <Link
            href="/cart"
            className="block w-full bg-accent-primary text-awake-black py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
          >
            Return to Cart
          </Link>
          <Link
            href="/products"
            className="block w-full border border-white/20 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="mt-8 p-4 bg-awake-gray rounded-lg">
          <h3 className="font-semibold mb-2">Need Help?</h3>
          <p className="text-sm text-gray-400 mb-3">
            If you experienced any issues during checkout, please contact us.
          </p>
          <Link
            href="/contact"
            className="text-accent-primary hover:text-accent-secondary font-medium"
          >
            Contact Support →
          </Link>
        </div>
      </div>
    </main>
  )
}
