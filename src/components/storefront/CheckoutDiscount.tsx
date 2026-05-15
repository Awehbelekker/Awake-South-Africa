'use client'

import { useState } from 'react'
import { Tag, X, CheckCircle } from 'lucide-react'

interface Props {
  subtotal: number
  tenantSlug?: string
  onDiscount: (amount: number, codeId: string | null, message: string) => void
}

export default function CheckoutDiscount({ subtotal, tenantSlug, onDiscount }: Props) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'applied' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)

  const apply = async () => {
    if (!code.trim()) return
    setStatus('checking')
    setMessage('')

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug

    try {
      const res = await fetch('/api/tenant/discounts/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: code.trim(), subtotal }),
      })
      const data = await res.json()

      if (data.valid) {
        setStatus('applied')
        setDiscountAmount(data.discount_amount)
        setMessage(data.message)
        onDiscount(data.discount_amount, data.code_id, data.message)
      } else {
        setStatus('error')
        setMessage(data.message || 'Invalid code')
        onDiscount(0, null, '')
      }
    } catch {
      setStatus('error')
      setMessage('Could not validate code. Try again.')
      onDiscount(0, null, '')
    }
  }

  const clear = () => {
    setCode('')
    setStatus('idle')
    setMessage('')
    setDiscountAmount(0)
    onDiscount(0, null, '')
  }

  if (status === 'applied') {
    return (
      <div className="flex items-center justify-between p-3 bg-green-900/30 border border-green-700 rounded-lg">
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span className="font-mono font-bold">{code.toUpperCase()}</span>
          <span>— {message} (−R{discountAmount.toFixed(2)})</span>
        </div>
        <button onClick={clear} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); if (status !== 'idle') setStatus('idle') }}
            onKeyDown={e => e.key === 'Enter' && apply()}
            placeholder="Discount code"
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={apply}
          disabled={status === 'checking' || !code.trim()}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm disabled:opacity-50 transition-colors"
        >
          {status === 'checking' ? 'Checking…' : 'Apply'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-red-400 text-xs pl-1">{message}</p>
      )}
    </div>
  )
}
