'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/store/admin'
import { useProductsStore } from '@/store/products'

export default function AdminProductsPage() {
  const router = useRouter()
  const { isAuthenticated, settings } = useAdminStore()
  const { products, updateProduct } = useProductsStore()
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated) {
    return null
  }

  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(p => (p.categoryTag || p.category) === filter)

  const categories = ['all', ...Array.from(new Set(products.map(p => p.categoryTag || p.category)))]

  const startEdit = (product: any) => {
    setEditingId(product.id)
    setEditForm(product)
  }

  const saveEdit = () => {
    if (editingId) {
      updateProduct(editingId, editForm)
      setEditingId(null)
      setEditForm({})
    }
  }

  const calculateMargin = (product: any) => {
    if (!product.costEUR) return 'N/A'
    const costZAR = product.costEUR * settings.exchangeRate
    const margin = ((product.priceExVAT - costZAR) / product.priceExVAT) * 100
    return margin.toFixed(2) + '%'
  }

  const calculateProfit = (product: any) => {
    if (!product.costEUR) return 'N/A'
    const costZAR = product.costEUR * settings.exchangeRate
    const profit = product.priceExVAT - costZAR
    return 'R' + Math.round(profit).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Manage Products</h1>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Category
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Products' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price (inc VAT)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost EUR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  {editingId === product.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                          className="w-24 px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={editForm.costEUR || ''}
                          onChange={(e) => setEditForm({ ...editForm, costEUR: Number(e.target.value) })}
                          className="w-24 px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {calculateMargin(editForm)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {calculateProfit(editForm)}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={editForm.stockQuantity}
                          onChange={(e) => setEditForm({ ...editForm, stockQuantity: Number(e.target.value) })}
                          className="w-16 px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={saveEdit}
                          className="text-green-600 hover:text-green-900 mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.categoryTag || product.category}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        R{product.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.costEUR ? `€${product.costEUR.toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {calculateMargin(product)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {calculateProfit(product)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => startEdit(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
