'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cart'
import { useOrder } from '@/lib/medusa-hooks'
import { CheckCircle, Package, Truck, Loader2, Copy, Check } from 'lucide-react'

export default function PaymentSuccessPage() {
  const { clearCart, setMedusaCartId } = useCartStore()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Get order ID from localStorage
  useEffect(() => {
    const storedOrderId = localStorage.getItem('awake_last_order_id')
    if (storedOrderId) {
      setOrderId(storedOrderId)
    }
  }, [])

  // Fetch order details from Medusa
  const { data: order, isLoading: orderLoading } = useOrder(orderId)

  useEffect(() => {
    // Clear cart on successful payment
    clearCart()
    setMedusaCartId(null)
    // Clear stored cart ID
    localStorage.removeItem('medusa_cart_id')
  }, [clearCart, setMedusaCartId])

  const copyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Format price
  const formatPrice = (amount: number) => {
    return `R ${(amount / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
  }

  return (
    <main className="min-h-screen bg-awake-black text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
          <p className="text-gray-400">
            Thank you for your order. You'll receive a confirmation email shortly.
          </p>
        </div>

        {/* Order Details Card */}
        {orderId && (
          <div className="bg-awake-gray rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Order Reference</h2>
              <button
                onClick={copyOrderId}
                className="flex items-center gap-2 text-sm text-accent-primary hover:text-accent-secondary transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="font-mono text-lg bg-awake-black px-4 py-2 rounded-lg">
              {orderId}
            </p>
          </div>
        )}

        {/* Order Items */}
        {orderLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
            <span className="ml-3 text-gray-400">Loading order details...</span>
          </div>
        ) : order ? (
          <div className="bg-awake-gray rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Order Items
            </h2>

            <div className="space-y-4 mb-6">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-white/10 last:border-0">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatPrice(item.unit_price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal || 0)}</span>
              </div>
              {order.shipping_total > 0 && (
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Shipping</span>
                  <span>{formatPrice(order.shipping_total)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>VAT (15% included)</span>
                <span>{formatPrice(order.tax_total || 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                <span>Total</span>
                <span className="text-accent-primary">{formatPrice(order.total || 0)}</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Shipping Info */}
        {order?.shipping_address && (
          <div className="bg-awake-gray rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" /> Delivery Address
            </h2>
            <div className="text-gray-300">
              <p>{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
              <p>{order.shipping_address.address_1}</p>
              {order.shipping_address.address_2 && <p>{order.shipping_address.address_2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}</p>
              {order.shipping_address.phone && <p className="mt-2">Phone: {order.shipping_address.phone}</p>}
            </div>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-awake-gray rounded-xl p-6 mb-8">
          <h3 className="font-semibold mb-4">What's Next?</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">Order confirmation email sent to {order?.email || 'your email'}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">Our team will contact you to arrange delivery</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">Free demo session included with your purchase</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/products"
            className="flex-1 bg-accent-primary text-awake-black py-4 rounded-lg font-bold hover:bg-accent-secondary transition-colors text-center"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="flex-1 border border-white/20 py-4 rounded-lg font-bold hover:bg-white/10 transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
