'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import CheckoutDiscount from '@/components/storefront/CheckoutDiscount'

const SA_PROVINCES = [
  { code: 'WC', name: 'Western Cape' },
  { code: 'GP', name: 'Gauteng' },
  { code: 'KZN', name: 'KwaZulu-Natal' },
  { code: 'EC', name: 'Eastern Cape' },
  { code: 'LP', name: 'Limpopo' },
  { code: 'MP', name: 'Mpumalanga' },
  { code: 'NW', name: 'North West' },
  { code: 'FS', name: 'Free State' },
  { code: 'NC', name: 'Northern Cape' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCartStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [province, setProvince] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Discount state
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountCodeId, setDiscountCodeId] = useState<string | null>(null)
  const [discountMessage, setDiscountMessage] = useState('')

  // Shipping state
  const [shippingRate, setShippingRate] = useState<number | null>(null)
  const [shippingLabel, setShippingLabel] = useState('Select province to calculate')
  const [shippingFree, setShippingFree] = useState(false)

  useEffect(() => {
    if (items.length === 0) router.push('/cart')
  }, [items, router])

  // Fetch shipping rate when province changes
  useEffect(() => {
    if (!province) { setShippingRate(null); setShippingLabel('Select province to calculate'); return }

    fetch('/api/tenant/shipping/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ province, total_zar: total() }),
    })
      .then(r => r.json())
      .then(d => {
        setShippingRate(d.rate)
        setShippingLabel(d.free ? 'Free Delivery 🎉' : `${d.label} — R${d.rate}`)
        setShippingFree(d.free)
      })
      .catch(() => { setShippingRate(99); setShippingLabel('Standard — R99') })
  }, [province]) // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = total()
  const shipping = shippingRate ?? 0
  const grandTotal = Math.max(0, subtotal - discountAmount) + shipping

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(price)

  const handlePayFastCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) { alert('Please fill in all required fields'); return }
    if (!province) { alert('Please select your province for shipping'); return }
    setIsProcessing(true)

    try {
      const nameParts = name.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || firstName
      const orderId = `AWK-${Date.now()}`
      localStorage.setItem('awake_last_order_id', orderId)

      const itemNames = items.map(item =>
        item.variantName ? `${item.quantity}x ${item.name} (${item.variantName})` : `${item.quantity}x ${item.name}`
      ).join(', ')

      try {
        await fetch('/api/tenant/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber:    orderId,
            customerEmail:  email,
            customerName:   name,
            customerPhone:  phone || null,
            items: items.map(item => ({
              description:  item.variantName ? `${item.name} (${item.variantName})` : item.name,
              quantity:     item.quantity,
              unitPrice:    item.price,
              total:        item.price * item.quantity,
              variant_id:   item.variantId || null,
              variant_name: item.variantName || null,
            })),
            subtotal,
            taxAmount:      Math.round(subtotal * 15 / 115 * 100) / 100,
            shippingAmount: shipping,
            discountAmount,
            total:          grandTotal,
            currency:       'ZAR',
            paymentGateway: 'payfast',
            status:         'pending',
          }),
        })
      } catch (e) { console.warn('Pre-order creation failed:', e) }

      // Mark cart as recovered (paid)
      const sessionId = localStorage.getItem('awake_session_id')
      if (sessionId) {
        fetch('/api/tenant/cart', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        }).catch(() => {})
      }

      const paymentRes = await fetch('/api/payfast/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: grandTotal,
          itemName: 'Awake Boards SA Order',
          itemDescription: `Awake SA Order: ${itemNames}`,
          paymentId: orderId,
          email,
          name: firstName,
        }),
      })

      if (!paymentRes.ok) throw new Error('Failed to create payment')

      const payment = await paymentRes.json()
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = payment.url
      Object.entries(payment.data).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = String(value)
        form.appendChild(input)
      })
      document.body.appendChild(form)
      form.submit()
      setTimeout(() => clearCart(), 2000)

    } catch (error) {
      console.error('PayFast checkout error:', error)
      alert('There was an error processing your payment. Please try again.')
      setIsProcessing(false)
    }
  }

  if (items.length === 0) return null

  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Customer Details */}
          <div className="bg-awake-gray rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Customer Details</h2>

            <form onSubmit={handlePayFastCheckout} ref={formRef} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:ring-2 focus:ring-accent-primary"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:ring-2 focus:ring-accent-primary"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:ring-2 focus:ring-accent-primary"
                  placeholder="+27 XX XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Province <span className="text-red-500">*</span></label>
                <select
                  value={province} onChange={e => setProvince(e.target.value)} required
                  className="w-full px-4 py-3 bg-awake-black border border-white/10 rounded-lg focus:ring-2 focus:ring-accent-primary text-white"
                >
                  <option value="">Select province…</option>
                  {SA_PROVINCES.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-400 mb-4">
                  You'll be redirected to PayFast to complete your secure payment.
                </p>
                <button
                  type="submit" disabled={isProcessing}
                  className="w-full bg-accent-primary text-awake-black py-4 rounded-lg font-bold hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : `Pay ${formatPrice(grandTotal)} with PayFast`}
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
                  <div key={`${item.id}-${item.variantId}`} className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      {item.variantName && <p className="text-xs text-accent-primary">{item.variantName}</p>}
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      <p className="text-sm text-accent-primary font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount Code */}
              <div className="mb-4">
                <CheckoutDiscount
                  subtotal={subtotal}
                  onDiscount={(amount, codeId, msg) => {
                    setDiscountAmount(amount)
                    setDiscountCodeId(codeId)
                    setDiscountMessage(msg)
                  }}
                />
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Discount</span>
                    <span>−{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-gray-400">
                  <span>VAT (15%)</span>
                  <span>Included</span>
                </div>

                <div className="flex justify-between text-sm text-gray-400">
                  <span>Shipping</span>
                  <span className={shippingFree ? 'text-green-400' : ''}>
                    {province ? formatPrice(shipping) : 'Select province'}
                  </span>
                </div>

                {province && (
                  <p className="text-xs text-gray-500">{shippingLabel}</p>
                )}

                <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span className="text-accent-primary">{formatPrice(grandTotal)}</span>
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
