'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { MessageSquare, ShoppingCart, RefreshCw } from 'lucide-react'

interface Session {
  id: string
  phone: string
  state: string
  cart: any[]
  last_activity: string
  created_at: string
}

const STATE_COLOR: Record<string, string> = {
  MENU: 'bg-gray-100 text-gray-600',
  BROWSING: 'bg-blue-100 text-blue-700',
  CART: 'bg-yellow-100 text-yellow-700',
  CHECKOUT: 'bg-orange-100 text-orange-700',
  AWAITING_PAYMENT: 'bg-purple-100 text-purple-700',
}

export default function WhatsAppAdminPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/whatsapp/sessions')
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const cartTotal = (cart: any[]) =>
    (cart || []).reduce((s: number, l: any) => s + (l.price || 0) * (l.quantity || 1), 0)

  return (
    <AdminLayout title="WhatsApp Commerce">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Commerce Bot</h1>
            <p className="text-sm text-gray-500 mt-1">Active customer sessions via WhatsApp</p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['MENU', 'BROWSING', 'CART', 'AWAITING_PAYMENT'] as const).map(s => (
            <div key={s} className="bg-white rounded-xl shadow p-4">
              <p className="text-xs text-gray-500 uppercase">{s.replace('_', ' ')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {sessions.filter(x => x.state === s).length}
              </p>
            </div>
          ))}
        </div>

        {/* Session list */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Active Sessions</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading…</div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No active sessions yet. When customers message your WhatsApp number, they'll appear here.
              </div>
            ) : sessions.map(s => (
              <div key={s.id} className="p-5 flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{s.phone}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATE_COLOR[s.state] || 'bg-gray-100 text-gray-600'}`}>
                      {s.state}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last active {new Date(s.last_activity).toLocaleString()}
                  </p>
                  {(s.cart || []).length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <ShoppingCart className="w-4 h-4" />
                      {s.cart.length} items — R{cartTotal(s.cart).toLocaleString()} in cart
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
