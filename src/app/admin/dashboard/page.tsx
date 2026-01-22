'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdminStore } from '@/store/admin'
import { useProductsStore } from '@/store/products'
import MediaLibraryBrowser from '@/components/admin/MediaLibraryBrowser'

export default function AdminDashboard() {
  const router = useRouter()
  const { isAuthenticated, logout, settings, updateSettings } = useAdminStore()
  const { products } = useProductsStore()
  const [mounted, setMounted] = useState(false)
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated) {
    return null
  }

  const totalProducts = products.length
  const inStockProducts = products.filter(p => p.inStock).length
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stockQuantity, 0)
  const avgMargin = products.filter(p => p.costEUR).length > 0
    ? products.filter(p => p.costEUR).reduce((sum, p) => {
        const costZAR = (p.costEUR || 0) * settings.exchangeRate
        const margin = ((p.priceExVAT - costZAR) / p.priceExVAT) * 100
        return sum + margin
      }, 0) / products.filter(p => p.costEUR).length
    : 0

  const categories = Array.from(new Set(products.map(p => p.categoryTag || p.category)))

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Awake SA Admin</h1>
          <div className="flex gap-4 items-center">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              View Store
            </Link>
            <button
              onClick={() => {
                logout()
                router.push('/')
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Products</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{totalProducts}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">In Stock</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{inStockProducts}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Value</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              R{(totalValue / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Avg Margin</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">{avgMargin.toFixed(1)}%</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/products"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Products</h3>
            <p className="text-gray-600">Edit products, prices, inventory, and costs</p>
            <div className="mt-4 text-blue-600 font-medium">View all products →</div>
          </Link>

          <button
            onClick={() => setShowMediaLibrary(true)}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📁 Media Library</h3>
            <p className="text-gray-600">Browse and manage all product images and videos</p>
            <div className="mt-4 text-blue-600 font-medium">Open library →</div>
          </button>

          <Link
            href="/admin/settings"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Store Settings</h3>
            <p className="text-gray-600">Update store details, pricing, and contact info</p>
            <div className="mt-4 text-blue-600 font-medium">Edit settings →</div>
          </Link>

          <Link
            href="/admin/reports"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports & Analytics</h3>
            <p className="text-gray-600">View margins, costs, and profitability</p>
            <div className="mt-4 text-blue-600 font-medium">View reports →</div>
          </Link>
        </div>

        {/* Categories Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => {
              const count = products.filter(p => 
                (p.categoryTag || p.category) === category
              ).length
              return (
                <div key={category} className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500">{category}</div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Media Library Browser */}
        <MediaLibraryBrowser
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          type="all"
        />
      </main>
    </div>
  )
}
