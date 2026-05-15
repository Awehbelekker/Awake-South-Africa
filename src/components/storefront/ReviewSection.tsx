'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'

interface Review {
  id: string
  customer_name: string
  rating: number
  body: string
  created_at: string
}

interface Props {
  productId: string
  tenantSlug?: string
}

function Stars({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`w-5 h-5 ${(hover || rating) >= i ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
          />
        </button>
      ))}
    </div>
  )
}

export default function ReviewSection({ productId, tenantSlug }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customer_name: '', customer_email: '', rating: 0, body: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const headers: Record<string, string> = {}
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug

    fetch(`/api/tenant/products/${productId}/reviews`, { headers })
      .then(r => r.json())
      .then(d => {
        setReviews(d.reviews || [])
        setAverage(d.average || 0)
        setCount(d.count || 0)
      })
      .catch(() => {})
  }, [productId]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!form.customer_name || !form.customer_email || !form.rating) return
    setSubmitting(true)

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug

    try {
      await fetch(`/api/tenant/products/${productId}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      })
      setSubmitted(true)
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-16 border-t border-gray-800 pt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Customer Reviews</h2>
          {count > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Stars rating={Math.round(average)} />
              <span className="text-gray-400 text-sm">{average.toFixed(1)} out of 5 ({count} reviews)</span>
            </div>
          )}
        </div>
        {!showForm && !submitted && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Submitted confirmation */}
      {submitted && (
        <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-sm">
          Thank you for your review! It will appear after approval.
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <div className="mb-8 p-6 bg-gray-900 rounded-xl border border-gray-700 space-y-4">
          <h3 className="font-semibold text-white">Write a Review</h3>
          <div>
            <p className="text-sm text-gray-400 mb-1">Your Rating</p>
            <Stars rating={form.rating} interactive onRate={r => setForm(f => ({ ...f, rating: r }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              value={form.customer_name}
              onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
              placeholder="Your name"
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            />
            <input
              value={form.customer_email}
              onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
              placeholder="your@email.com"
              type="email"
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Share your experience with this product…"
            rows={3}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={submit}
              disabled={submitting || !form.rating || !form.customer_name || !form.customer_email}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 text-gray-400 hover:text-white text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="text-gray-500 text-sm">No reviews yet. Be the first to share your experience.</p>
      ) : (
        <div className="space-y-6">
          {reviews.map(r => (
            <div key={r.id} className="border-b border-gray-800 pb-6 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">{r.customer_name}</span>
                <span className="text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <Stars rating={r.rating} />
              {r.body && <p className="mt-2 text-gray-300 text-sm">{r.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
