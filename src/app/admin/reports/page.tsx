'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminStore } from '@/store/admin'
import { useProductsStore } from '@/store/products'

interface ProductRow {
  id: string
  name: string
  price: number
  priceExVAT: number
  costEUR: number
  stockQuantity: number
  inStock: boolean
}

interface RevenueStats {
  totalRevenue: number
  totalOrders: number
  paidInvoices: number
  unpaidInvoices: number
  overdueInvoices: number
  totalInvoiced: number
}

export default function AdminReportsPage() {
  const router = useRouter()
  const { isAuthenticated, settings } = useAdminStore()
  const { products: localProducts } = useProductsStore()
  const [mounted, setMounted] = useState(false)
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [liveProducts, setLiveProducts] = useState<ProductRow[]>([])
  const [ordersByStatus, setOrdersByStatus] = useState<Record<string, number>>({})
  const [lowStockProducts, setLowStockProducts] = useState<ProductRow[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ label: string; revenue: number; orders: number }[]>([])

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, router])

  // Load live data from Supabase
  useEffect(() => {
    if (!isAuthenticated) return
    setStatsLoading(true)

    Promise.all([
      fetch('/api/tenant/orders').then(r => r.ok ? r.json() : { orders: [] }),
      fetch('/api/tenant/invoices').then(r => r.ok ? r.json() : { invoices: [] }),
      fetch('/api/tenant/products').then(r => r.ok ? r.json() : { products: [] }),
    ]).then(([ordersData, invoicesData, productsData]) => {
      const orders   = ordersData.orders   || []
      const invoices = invoicesData.invoices || []
      const rawProducts = productsData.products || []

      // Revenue stats
      const paidOrders = orders.filter((o: any) => o.payment_status === 'paid')
      const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)
      const paidInvoices    = invoices.filter((inv: any) => inv.status === 'paid').length
      const unpaidInvoices  = invoices.filter((inv: any) => inv.status === 'sent').length
      const overdueInvoices = invoices.filter((inv: any) => inv.status === 'overdue').length
      const totalInvoiced   = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0)
      setRevenueStats({ totalRevenue, totalOrders: orders.length, paidInvoices, unpaidInvoices, overdueInvoices, totalInvoiced })

      // Orders by status breakdown
      const byStatus: Record<string, number> = {}
      orders.forEach((o: any) => { byStatus[o.status] = (byStatus[o.status] || 0) + 1 })
      setOrdersByStatus(byStatus)

      // Monthly revenue — last 12 months
      const now = new Date()
      const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
        return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' }), revenue: 0, orders: 0 }
      })
      orders.forEach((o: any) => {
        const d = new Date(o.created_at || o.createdAt)
        const idx = months.findIndex(m => m.year === d.getFullYear() && m.month === d.getMonth())
        if (idx !== -1) {
          months[idx].orders++
          if (o.payment_status === 'paid') months[idx].revenue += Number(o.total || 0)
        }
      })
      setMonthlyRevenue(months)

      // Normalise products from Supabase schema to camelCase
      if (rawProducts.length > 0) {
        const normalised: ProductRow[] = rawProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price || 0,
          priceExVAT: p.price_ex_vat || Math.round((p.price || 0) / 1.15),
          costEUR: p.cost_eur || 0,
          stockQuantity: p.stock_quantity ?? 0,
          inStock: p.in_stock ?? true,
        }))
        setLiveProducts(normalised)
        setLowStockProducts(normalised.filter(p => p.inStock && p.stockQuantity <= 2))
      }
    }).catch(() => {
      // Supabase tables may not exist yet — silent fail
    }).finally(() => setStatsLoading(false))
  }, [isAuthenticated])

  if (!mounted || !isAuthenticated) {
    return null
  }

  // Use live Supabase products; fall back to localStorage if API hasn't loaded yet
  const products = liveProducts.length > 0 ? liveProducts : localProducts

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
    <AdminLayout title="Reports & Analytics">
        {/* ── Live Revenue Overview ── */}
        {(revenueStats || statsLoading) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Revenue Overview
              {statsLoading && <span className="ml-2 text-sm font-normal text-gray-400">Loading…</span>}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Total Revenue</div>
                <div className="mt-1 text-2xl font-bold text-green-700">
                  R{Math.round(revenueStats?.totalRevenue ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Orders</div>
                <div className="mt-1 text-2xl font-bold text-blue-700">
                  {revenueStats?.totalOrders ?? 0}
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Total Invoiced</div>
                <div className="mt-1 text-2xl font-bold text-purple-700">
                  R{Math.round(revenueStats?.totalInvoiced ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Paid Invoices</div>
                <div className="mt-1 text-2xl font-bold text-green-700">
                  {revenueStats?.paidInvoices ?? 0}
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-xs font-medium text-yellow-600 uppercase tracking-wide">Unpaid</div>
                <div className="mt-1 text-2xl font-bold text-yellow-700">
                  {revenueStats?.unpaidInvoices ?? 0}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-xs font-medium text-red-600 uppercase tracking-wide">Overdue</div>
                <div className="mt-1 text-2xl font-bold text-red-700">
                  {revenueStats?.overdueInvoices ?? 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Revenue Chart */}
        {monthlyRevenue.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Revenue — Last 12 Months</h2>
            <div className="bg-white rounded-lg shadow p-6">
              {(() => {
                const maxRev = Math.max(...monthlyRevenue.map(m => m.revenue), 1)
                const W = 780, H = 140, pad = 40, barW = Math.floor((W - pad) / 12)
                return (
                  <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full" aria-label="Monthly revenue chart">
                    {/* Y-axis guide lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(f => (
                      <line key={f} x1={pad} x2={W} y1={H - f * H} y2={H - f * H} stroke="#e5e7eb" strokeWidth="1" />
                    ))}
                    {/* Bars */}
                    {monthlyRevenue.map((m, i) => {
                      const bh = Math.max((m.revenue / maxRev) * H, m.revenue > 0 ? 2 : 0)
                      const x = pad + i * barW + barW * 0.1
                      const bw = barW * 0.8
                      return (
                        <g key={m.label}>
                          <rect x={x} y={H - bh} width={bw} height={bh} fill="#3b82f6" rx="2" />
                          {m.revenue > 0 && (
                            <text x={x + bw / 2} y={H - bh - 4} textAnchor="middle" fontSize="9" fill="#6b7280">
                              {m.revenue >= 1000 ? `R${Math.round(m.revenue / 1000)}k` : `R${Math.round(m.revenue)}`}
                            </text>
                          )}
                          <text x={x + bw / 2} y={H + 16} textAnchor="middle" fontSize="9" fill="#9ca3af">{m.label}</text>
                          {m.orders > 0 && (
                            <text x={x + bw / 2} y={H + 28} textAnchor="middle" fontSize="8" fill="#d1d5db">{m.orders} ord</text>
                          )}
                        </g>
                      )
                    })}
                    {/* Y-axis labels */}
                    {[0, 0.5, 1].map(f => (
                      <text key={f} x={pad - 4} y={H - f * H + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
                        {f === 0 ? 'R0' : `R${Math.round(maxRev * f / 1000)}k`}
                      </text>
                    ))}
                  </svg>
                )
              })()}
            </div>
          </div>
        )}

        {/* Orders by Status */}
        {Object.keys(ordersByStatus).length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Orders by Status</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {(['pending','confirmed','processing','shipped','delivered','cancelled'] as const).map(status => (
                <div key={status} className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{ordersByStatus[status] || 0}</div>
                  <div className="text-xs text-gray-500 capitalize mt-1">{status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Low Stock <span className="ml-2 px-2 py-0.5 text-sm bg-red-100 text-red-700 rounded-full">{lowStockProducts.length}</span>
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Product', 'Stock', 'Price', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lowStockProducts.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.stockQuantity === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {p.stockQuantity} left
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">R{p.price.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <a href="/admin/products" className="text-blue-600 hover:underline text-xs">Update stock →</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
    </AdminLayout>
  )
}
