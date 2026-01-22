'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-awake-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">👤</div>
          <h1 className="text-3xl font-bold mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-8">
            Please sign in to access your account.
          </p>
          <Link
            href="/login"
            className="inline-block bg-accent-primary text-awake-black px-8 py-3 rounded-lg font-bold"
          >
            Sign In
          </Link>
        </div>
      </main>
    )
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-awake-black text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Account</h1>

        {/* User Info */}
        <div className="bg-awake-gray rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent-primary/20 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link
            href="/account/orders"
            className="bg-awake-gray p-6 rounded-xl hover:ring-2 hover:ring-accent-primary transition-all"
          >
            <div className="text-2xl mb-2">📦</div>
            <h3 className="font-bold">Orders</h3>
            <p className="text-sm text-gray-400">View order history</p>
          </Link>
          <Link
            href="/account/wishlist"
            className="bg-awake-gray p-6 rounded-xl hover:ring-2 hover:ring-accent-primary transition-all"
          >
            <div className="text-2xl mb-2">♥</div>
            <h3 className="font-bold">Wishlist</h3>
            <p className="text-sm text-gray-400">Saved products</p>
          </Link>
          <Link
            href="/account/settings"
            className="bg-awake-gray p-6 rounded-xl hover:ring-2 hover:ring-accent-primary transition-all"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="font-bold">Settings</h3>
            <p className="text-sm text-gray-400">Account preferences</p>
          </Link>
          <Link
            href="/account/addresses"
            className="bg-awake-gray p-6 rounded-xl hover:ring-2 hover:ring-accent-primary transition-all"
          >
            <div className="text-2xl mb-2">📍</div>
            <h3 className="font-bold">Addresses</h3>
            <p className="text-sm text-gray-400">Shipping addresses</p>
          </Link>
          <Link
            href="/support"
            className="bg-awake-gray p-6 rounded-xl hover:ring-2 hover:ring-accent-primary transition-all"
          >
            <div className="text-2xl mb-2">💬</div>
            <h3 className="font-bold">Support</h3>
            <p className="text-sm text-gray-400">Get help</p>
          </Link>
          <button
            onClick={handleLogout}
            className="bg-awake-gray p-6 rounded-xl text-left hover:ring-2 hover:ring-red-500 transition-all"
          >
            <div className="text-2xl mb-2">🚪</div>
            <h3 className="font-bold">Sign Out</h3>
            <p className="text-sm text-gray-400">Log out of account</p>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-awake-gray rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-400">
            <p>No recent orders</p>
            <Link href="/products" className="text-accent-primary hover:underline mt-2 inline-block">
              Start Shopping →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
