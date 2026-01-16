'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/store/admin'
import { useProductsStore } from '@/store/products'

export default function AdminReportsPage() {
  const router = useRouter()
  const { isAuthenticated, settings } = useAdminStore()
  const { products } = useProductsStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated) {
    return null
  }

  const productsWithCosts = products.filter(p => p.costEUR)
  
  const reports = productsWithCosts.map(p => {
    const costZAR = (p.costEUR || 0) * settings.exchangeRate
    const margin = ((p.priceExVAT - costZAR) / p.priceExVAT) * 100
    const profit = p.priceExVAT - costZAR
    const totalValue = p.price * p.stockQuantity
    const totalProfit = profit * p.stockQuantity
    
    return {
      ...p,
      costZAR,
      margin,
      profit,
      totalValue,
      totalProfit,
    }
  })

  const totalInventoryValue = reports.reduce((sum, r) => sum + r.totalValue, 0)
  const totalPotentialProfit = reports.reduce((sum, r) => sum + r.totalProfit, 0)
  const avgMargin = reports.reduce((sum, r) => sum + r.margin, 0) / reports.length

  // Top 5 most profitable
  const topProfitable = [...reports].sort((a, b) => b.totalProfit - a.totalProfit).slice(0, 5)
  
  // Top 5 highest margin
  const topMargin = [...reports].sort((a, b) => b.margin - a.margin).slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Inventory Value</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              R{(totalInventoryValue / 1000000).toFixed(2)}M
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Potential Profit</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              R{(totalPotentialProfit / 1000000).toFixed(2)}M
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Average Margin</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              {avgMargin.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Most Profitable */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Profitable Products</h3>
            <div className="space-y-3">
              {topProfitable.map((item, idx) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-medium text-gray-900">{idx + 1}. {item.name}</div>
                    <div className="text-sm text-gray-500">{item.stockQuantity} units</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">R{Math.round(item.totalProfit).toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{item.margin.toFixed(1)}% margin</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Highest Margin */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Highest Margin Products</h3>
            <div className="space-y-3">
              {topMargin.map((item, idx) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-medium text-gray-900">{idx + 1}. {item.name}</div>
                    <div className="text-sm text-gray-500">€{item.costEUR?.toLocaleString()} cost</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{item.margin.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">R{Math.round(item.profit).toLocaleString()}/unit</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* All Products Report */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Complete Cost & Margin Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost EUR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost ZAR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price Ex VAT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit/Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Profit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">€{item.costEUR?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">R{Math.round(item.costZAR).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">R{Math.round(item.priceExVAT).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{item.margin.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">R{Math.round(item.profit).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.stockQuantity}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">R{Math.round(item.totalProfit).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
