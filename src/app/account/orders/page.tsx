'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { Package, ChevronRight, RefreshCw } from 'lucide-react'

interface OrderItem { name: string; quantity: number; price: number }

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  total: number
  created_at: string
  items: OrderItem[]
  tracking_number?: string
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-900/30 text-yellow-400',
  confirmed:  'bg-blue-900/30 text-blue-400',
  processing: 'bg-purple-900/30 text-purple-400',
  shipped:    'bg-indigo-900/30 text-indigo-400',
  delivered:  'bg-green-900/30 text-green-400',
  cancelled:  'bg-red-900/30 text-red-400',
}

export default function OrdersPage() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!mounted || !isAuthenticated || !user?.email) return
    fetchOrders()
  }, [mounted, isAuthenticated, user])

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await fetch(`/api/tenant/orders?customer_email=${encodeURIComponent(user!.email)}`)
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(n)

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })

  if (!mounted || !isAuthenticated) return null

  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/account" className="text-accent-primary hover:text-accent-secondary text-sm">
              ← Account
            </Link>
            <h1 className="text-3xl font-bold">Order History</h1>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-awake-gray rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-awake-gray rounded-xl p-10 text-center">
            <Package className="w-14 h-14 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Orders Yet</h2>
            <p className="text-gray-400 mb-6">You haven't placed any orders yet.</p>
            <Link
              href="/products"
              className="inline-block bg-accent-primary text-awake-black px-6 py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-awake-gray rounded-xl overflow-hidden">
                {/* Summary row */}
                <button
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">{order.order_number}</p>
                      <p className="text-sm text-gray-400">{fmtDate(order.created_at)}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-800 text-gray-400'}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-accent-primary">{fmt(order.total)}</span>
                    <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expanded === order.id ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {/* Expanded details */}
                {expanded === order.id && (
                  <div className="border-t border-white/10 p-5 space-y-4">
                    {/* Items */}
                    {Array.isArray(order.items) && order.items.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Items</p>
                        <div className="space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-gray-300">{item.quantity}× {item.name}</span>
                              <span className="text-gray-400">{fmt(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Payment</p>
                        <p className={order.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}>
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </p>
                      </div>
                      {order.tracking_number && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tracking</p>
                          <p className="font-mono text-accent-primary">{order.tracking_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
