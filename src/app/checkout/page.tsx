'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { createPayFastPayment } from '@/lib/payfast'
import {
  useUpdateCartForCheckout,
  useSetPaymentSession,
  useCompleteCart
} from '@/lib/medusa-hooks'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart, medusaCartId } = useCartStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Medusa checkout hooks
  const updateCartMutation = useUpdateCartForCheckout(medusaCartId || '')
  const setPaymentMutation = useSetPaymentSession(medusaCartId || '')
  const completeCartMutation = useCompleteCart(medusaCartId || '')

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handlePayFastCheckout = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email) {
      alert('Please fill in all required fields')
      return
    }

    setIsProcessing(true)

    try {
      // Split name into first and last
      const nameParts = name.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || firstName

      let orderId = `AWK-${Date.now()}`

      // If we have a Medusa cart, create order through Medusa first
      if (medusaCartId) {
        try {
          // Update cart with customer info
          await updateCartMutation.mutateAsync({
            email,
            billing_address: {
              first_name: firstName,
              last_name: lastName,
              phone: phone || undefined,
              country_code: 'za',
            },
            shipping_address: {
              first_name: firstName,
              last_name: lastName,
              phone: phone || undefined,
              country_code: 'za',
            },
          })

          // Set payment session to manual (we handle payment externally via PayFast)
          await setPaymentMutation.mutateAsync('manual')

          // Complete the cart to create an order
          const result = await completeCartMutation.mutateAsync()
          if (result.type === 'order' && result.data) {
            orderId = result.data.id
            // Store order ID for success page
            localStorage.setItem('awake_last_order_id', orderId)
          }
        } catch (medusaError) {
          console.warn('Medusa order creation failed, proceeding with PayFast only:', medusaError)
        }
      }

      // Create item description
      const itemNames = items.map(item => `${item.quantity}x ${item.name}`).join(', ')
      const itemDescription = `Awake SA Order: ${itemNames}`

      // ── Pre-create order in Supabase so webhook can find it ──────────────
      // Best-effort: if this fails the PayFast webhook creates it on callback
      try {
        await fetch('/api/tenant/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber:   orderId,
            customerEmail: email,
            customerName:  name,
            customerPhone: phone || null,
            items: items.map(item => ({
              description: item.name,
              quantity:    item.quantity,
              unitPrice:   item.price,
              total:       item.price * item.quantity,
            })),
            subtotal:       total(),
            taxAmount:      Math.round(total() * 15 / 115 * 100) / 100,
            shippingAmount: 0,
            discountAmount: 0,
            total:          total(),
            currency:       'ZAR',
            paymentGateway: 'payfast',
            status:         'pending',
          }),
        })
      } catch (preCreateError) {
        console.warn('Pre-order creation failed (non-fatal):', preCreateError)
      }

      // Create PayFast payment (with Medusa order ID if available)
      const payment = createPayFastPayment(
        total(),
        'Awake Boards SA Order',
        itemDescription,
        orderId,
        email,
        name
      )

      // Create a form and submit it
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = payment.url

      // Add all payment data as hidden inputs
      Object.entries(payment.data).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()

      // Clear cart after 2 seconds (they're being redirected)
      setTimeout(() => {
        clearCart()
      }, 2000)

    } catch (error) {
      console.error('PayFast checkout error:', error)
      alert('There was an error processing your payment. Please try again.')
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return null // Will redirect
  }

  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Customer Details Form */}
          <div className="bg-awake-gray rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Customer Details</h2>
            
            <form onSubmit={handlePayFastCheckout} ref={formRef} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                  placeholder="+27 XX XXX XXXX"
                />
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-400 mb-4">
                  You'll be redirected to PayFast to complete your secure payment.
                </p>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-accent-primary text-awake-black py-4 rounded-lg font-bold hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : `Pay ${formatPrice(total())} with PayFast`}
                </button>
              </div>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Secure Payment
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                PayFast Protected
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-awake-gray rounded-xl p-6 mb-4">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      <p className="text-sm text-accent-primary font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(total())}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>VAT (15%)</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Shipping</span>
                  <span>TBD</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>Total</span>
                  <span className="text-accent-primary">{formatPrice(total())}</span>
                </div>
              </div>
            </div>

            <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-xl p-4">
              <h3 className="font-semibold mb-2 text-accent-primary">Payment Methods</h3>
              <p className="text-sm text-gray-300">
                PayFast supports all major South African payment methods including credit/debit cards, 
                instant EFT, and PayJustNow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
