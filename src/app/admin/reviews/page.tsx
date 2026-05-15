'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { CheckCircle, XCircle, Star } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Review {
  id: string
  product_id: string
  customer_name: string
  customer_email: string
  rating: number
  body: string
  approved: boolean
  created_at: string
  products?: { name: string }
}

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending')

  const load = () => {
    fetch(`/api/admin/reviews?approved=${filter === 'approved'}`)
      .then(r => r.json())
      .then(d => setReviews(d.reviews || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setLoading(true); load() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const approve = async (id: string) => {
    const res = await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved: true }),
    })
    if (res.ok) { setReviews(prev => prev.filter(r => r.id !== id)); toast.success('Approved') }
  }

  const reject = async (id: string) => {
    const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' })
    if (res.ok) { setReviews(prev => prev.filter(r => r.id !== id)); toast.success('Deleted') }
  }

  return (
    <AdminLayout title="Reviews">
      <Toaster />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {(['pending', 'approved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No {filter} reviews</div>
          ) : reviews.map(r => (
            <div key={r.id} className="p-6 flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{r.customer_name}</span>
                  <span className="text-gray-400 text-sm">({r.customer_email})</span>
                  <span className="text-gray-400 text-xs ml-auto">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${r.rating >= i ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                {r.body && <p className="text-sm text-gray-700">{r.body}</p>}
              </div>
              {filter === 'pending' && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => approve(r.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => reject(r.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                  >
                    <XCircle className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
