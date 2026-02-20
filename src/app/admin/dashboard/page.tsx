'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminStore } from '@/store/admin'
import { useProductsStore } from '@/store/products'
import { useBookingsStore } from '@/store/bookings'
import { useOrdersStore } from '@/store/orders'
import { useInvoicesStore } from '@/store/invoices'
import { useAdminProducts, useAdminOrders } from '@/lib/medusa-hooks'
import {
  Package, ShoppingCart, Calendar, FileText, AlertTriangle,
  TrendingUp, Clock, CheckCircle, XCircle, DollarSign, Database, HardDrive
} from 'lucide-react'

export default function AdminDashboard() {
  const { settings, authMode } = useAdminStore()
  const { products: localProducts, productSource } = useProductsStore()
  const { bookings } = useBookingsStore()
  const { orders: localOrders } = useOrdersStore()
  const { invoices } = useInvoicesStore()

  // Fetch from Medusa Admin API
  const { data: medusaProductData, isLoading: productsLoading } = useAdminProducts()
  const { data: medusaOrderData, isLoading: ordersLoading } = useAdminOrders()

  // Use Medusa data when available, fallback to local
  // Changed: Always use Medusa if it returns data, regardless of authMode
  const medusaProducts = medusaProductData?.products
  const useMedusaProducts = medusaProducts && medusaProducts.length > 0
  const products = useMedusaProducts ? medusaProducts : localProducts

  const medusaOrders = medusaOrderData?.orders
  const useMedusaOrders = medusaOrders !== undefined
  const orders = useMedusaOrders ? medusaOrders : localOrders

  // Product metrics
  const productMetrics = useMemo(() => {
    const total = products.length
    const inStock = products.filter((p: any) => p.inStock).length
    const lowStock = products.filter((p: any) => p.inStock && p.stockQuantity <= 2).length
    const outOfStock = products.filter((p: any) => !p.inStock || p.stockQuantity === 0).length
    const totalValue = products.reduce((sum: number, p: any) => sum + (p.price || 0) * (p.stockQuantity || 0), 0)
    const productsWithCost = products.filter((p: any) => p.costEUR)
    const avgMargin = productsWithCost.length > 0
      ? productsWithCost.reduce((sum: number, p: any) => {
          const costZAR = (p.costEUR || 0) * settings.exchangeRate
          const margin = p.priceExVAT > 0 ? ((p.priceExVAT - costZAR) / p.priceExVAT) * 100 : 0
          return sum + margin
        }, 0) / productsWithCost.length
      : 0
    return { total, inStock, lowStock, outOfStock, totalValue, avgMargin }
  }, [products, settings.exchangeRate])

  // Booking metrics
  const bookingMetrics = useMemo(() => {
    const pending = bookings.filter(b => b.status === 'pending').length
    const confirmed = bookings.filter(b => b.status === 'confirmed').length
    const today = new Date().toISOString().split('T')[0]
    const todayBookings = bookings.filter(b => b.date === today && b.status === 'confirmed').length
    const revenue = bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.price, 0)
    const upcomingBookings = bookings
      .filter(b => b.date >= today && (b.status === 'confirmed' || b.status === 'pending'))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
    return { pending, confirmed, todayBookings, revenue, upcomingBookings }
  }, [bookings])

  // Order metrics (handles both Medusa and local order formats)
  const orderMetrics = useMemo(() => {
    if (useMedusaOrders && Array.isArray(medusaOrders)) {
      const pending = medusaOrders.filter((o: any) => o.fulfillment_status === 'not_fulfilled').length
      const processing = medusaOrders.filter((o: any) => o.fulfillment_status === 'partially_fulfilled').length
      const total = medusaOrders.length
      const revenue = medusaOrders
        .filter((o: any) => o.payment_status === 'captured')
        .reduce((sum: number, o: any) => sum + ((o.total || 0) / 100), 0) // Medusa stores in cents
      return { pending, processing, total, revenue }
    }
    const localOrdrs = localOrders
    const pending = localOrdrs.filter(o => o.status === 'pending').length
    const processing = localOrdrs.filter(o => o.status === 'processing').length
    const total = localOrdrs.length
    const revenue = localOrdrs.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0)
    return { pending, processing, total, revenue }
  }, [orders, useMedusaOrders, medusaOrders, localOrders])

  // Invoice metrics
  const invoiceMetrics = useMemo(() => {
    const unpaid = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length
    const overdue = invoices.filter(i => i.status === 'overdue').length
    const totalOutstanding = invoices
      .filter(i => i.status === 'sent' || i.status === 'overdue')
      .reduce((sum, i) => sum + i.total, 0)
    return { unpaid, overdue, totalOutstanding }
  }, [invoices])

  // Action items
  const actionItems = useMemo(() => {
    const items: { type: 'warning' | 'info' | 'error', message: string, link: string }[] = []
    if (bookingMetrics.pending > 0) {
      items.push({ type: 'warning', message: `${bookingMetrics.pending} pending demo booking(s) need confirmation`, link: '/admin/bookings' })
    }
    if (orderMetrics.pending > 0) {
      items.push({ type: 'warning', message: `${orderMetrics.pending} pending order(s) need processing`, link: '/admin/orders' })
    }
    if (productMetrics.lowStock > 0) {
      items.push({ type: 'info', message: `${productMetrics.lowStock} product(s) running low on stock`, link: '/admin/products' })
    }
    if (productMetrics.outOfStock > 0) {
      items.push({ type: 'error', message: `${productMetrics.outOfStock} product(s) out of stock`, link: '/admin/products' })
    }
    if (invoiceMetrics.overdue > 0) {
      items.push({ type: 'error', message: `${invoiceMetrics.overdue} invoice(s) overdue`, link: '/admin/invoices' })
    }
    return items
  }, [bookingMetrics, orderMetrics, productMetrics, invoiceMetrics])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(amount)
  }

  return (
    <AdminLayout title="Dashboard">
      {/* Data Source Indicator */}
      <div className="flex items-center gap-3 mb-4 text-sm">
        {useMedusaProducts ? (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full">
            <Database className="h-3.5 w-3.5" />
            Products: Medusa API ({products.length})
          </span>
        ) : productSource === 'supabase' ? (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
            <Database className="h-3.5 w-3.5" />
            Products: Supabase ({products.length})
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
            <HardDrive className="h-3.5 w-3.5" />
            Products: Local Storage ({products.length})
          </span>
        )}
        {useMedusaOrders ? (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full">
            <Database className="h-3.5 w-3.5" />
            Orders: Medusa API
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
            <HardDrive className="h-3.5 w-3.5" />
            Orders: Local Storage
          </span>
        )}
        {(productsLoading || ordersLoading) && (
          <span className="text-xs text-gray-500 animate-pulse">Loading...</span>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Package className="h-4 w-4" />
            Products
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{productMetrics.total}</div>
          <div className="text-xs text-green-600">{productMetrics.inStock} in stock</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Calendar className="h-4 w-4" />
            Bookings
          </div>
          <div className="mt-1 text-2xl font-bold text-orange-600">{bookingMetrics.pending}</div>
          <div className="text-xs text-gray-500">pending confirmation</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <ShoppingCart className="h-4 w-4" />
            Orders
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-600">{orderMetrics.total}</div>
          <div className="text-xs text-gray-500">{orderMetrics.pending} pending</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <FileText className="h-4 w-4" />
            Invoices
          </div>
          <div className="mt-1 text-2xl font-bold text-purple-600">{invoiceMetrics.unpaid}</div>
          <div className="text-xs text-gray-500">unpaid</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <DollarSign className="h-4 w-4" />
            Inventory Value
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(productMetrics.totalValue)}
          </div>
          <div className="text-xs text-blue-600">{productMetrics.avgMargin.toFixed(1)}% avg margin</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <TrendingUp className="h-4 w-4" />
            Revenue
          </div>
          <div className="mt-1 text-2xl font-bold text-green-600">
            {formatCurrency(bookingMetrics.revenue + orderMetrics.revenue)}
          </div>
          <div className="text-xs text-gray-500">bookings + orders</div>
        </div>
      </div>

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Action Required
          </h3>
          <div className="space-y-2">
            {actionItems.map((item, index) => (
              <Link
                key={index}
                href={item.link}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  item.type === 'error' ? 'bg-red-50 hover:bg-red-100 text-red-700' :
                  item.type === 'warning' ? 'bg-orange-50 hover:bg-orange-100 text-orange-700' :
                  'bg-blue-50 hover:bg-blue-100 text-blue-700'
                }`}
              >
                {item.type === 'error' ? <XCircle className="h-5 w-5" /> :
                 item.type === 'warning' ? <Clock className="h-5 w-5" /> :
                 <AlertTriangle className="h-5 w-5" />}
                <span className="flex-1">{item.message}</span>
                <span className="text-sm">View →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Upcoming Bookings
          </h3>
          {bookingMetrics.upcomingBookings.length > 0 ? (
            <div className="space-y-2">
              {bookingMetrics.upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{booking.customerName}</div>
                    <div className="text-sm text-gray-500">{booking.locationName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{booking.date}</div>
                    <div className="text-sm text-gray-500">{booking.timeSlot}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming bookings</p>
          )}
          <Link href="/admin/bookings" className="block text-center text-blue-600 hover:text-blue-800 mt-3 text-sm font-medium">
            View all bookings →
          </Link>
        </div>

        {/* Inventory Health */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            Inventory Health
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">In Stock</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(productMetrics.inStock / productMetrics.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{productMetrics.inStock}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Low Stock</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${(productMetrics.lowStock / productMetrics.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-orange-600">{productMetrics.lowStock}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Out of Stock</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(productMetrics.outOfStock / productMetrics.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-red-600">{productMetrics.outOfStock}</span>
              </div>
            </div>
          </div>
          <Link href="/admin/products" className="block text-center text-blue-600 hover:text-blue-800 mt-4 text-sm font-medium">
            Manage inventory →
          </Link>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/admin/products" className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-4 text-white hover:from-blue-600 hover:to-blue-700 transition-colors">
          <Package className="h-8 w-8 mb-2 opacity-80" />
          <h3 className="font-semibold">Products</h3>
          <p className="text-sm opacity-80">Manage catalog</p>
        </Link>
        <Link href="/admin/orders" className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-4 text-white hover:from-green-600 hover:to-green-700 transition-colors">
          <ShoppingCart className="h-8 w-8 mb-2 opacity-80" />
          <h3 className="font-semibold">Orders</h3>
          <p className="text-sm opacity-80">Process orders</p>
        </Link>
        <Link href="/admin/invoices" className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-4 text-white hover:from-purple-600 hover:to-purple-700 transition-colors">
          <FileText className="h-8 w-8 mb-2 opacity-80" />
          <h3 className="font-semibold">Invoices</h3>
          <p className="text-sm opacity-80">Billing & payments</p>
        </Link>
        <Link href="/admin/reports" className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-4 text-white hover:from-orange-600 hover:to-orange-700 transition-colors">
          <TrendingUp className="h-8 w-8 mb-2 opacity-80" />
          <h3 className="font-semibold">Reports</h3>
          <p className="text-sm opacity-80">Analytics</p>
        </Link>
      </div>
    </AdminLayout>
  )
}
