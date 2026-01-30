'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!mounted) {
    return null
  }

  if (!isAuthenticated) {
    return null
  }

  // Placeholder orders - in production, fetch from Medusa API
  const orders: Array<{id: string; date: string; status: string; total: number}> = []

  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account" className="text-accent-primary hover:text-accent-secondary">
            ← Back to Account
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-8">Order History</h1>

        {orders.length === 0 ? (
          <div className="bg-awake-gray rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-bold mb-2">No Orders Yet</h2>
            <p className="text-gray-400 mb-6">
              You haven't placed any orders yet. Start shopping to see your order history here.
            </p>
            <Link
              href="/products"
              className="inline-block bg-accent-primary text-awake-black px-6 py-3 rounded-lg font-bold hover:bg-accent-secondary transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-awake-gray rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Order #{order.id}</p>
                    <p className="text-sm text-gray-400">{order.date}</p>
                  </div>
                  <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-sm">
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold">R{order.total.toLocaleString()}</span>
                  <button className="text-accent-primary hover:text-accent-secondary">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

