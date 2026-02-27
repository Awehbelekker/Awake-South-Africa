'use client'

import { useState, useMemo, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useOrdersStore, Order, OrderStatus, PaymentStatus } from '@/store/orders'
import { useInvoicesStore } from '@/store/invoices'
import { useAdminOrders } from '@/lib/medusa-hooks'
import { useAdminStore } from '@/store/admin'
import { 
  Search, Filter, Eye, FileText, Package, Truck, CheckCircle, 
  XCircle, Clock, RefreshCw, ChevronDown
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

const paymentColors: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

export default function AdminOrdersPage() {
  const { orders: localOrders, updateOrderStatus, updatePaymentStatus } = useOrdersStore()
  const { addInvoice, createInvoiceFromOrder, invoices } = useInvoicesStore()
  const { isAuthenticated } = useAdminStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Medusa admin orders
  const { data: medusaData, isLoading: medusaLoading, error: medusaError } = useAdminOrders()
  const medusaOrders: Order[] = useMemo(() => {
    if (!medusaData?.orders?.length) return []
    return (medusaData.orders as any[]).map((o: any) => ({
      id: o.id,
      orderNumber: o.display_id ? `ORD-${o.display_id}` : o.id,
      customerName: `${o.billing_address?.first_name || ''} ${o.billing_address?.last_name || ''}`.trim() || o.email,
      customerEmail: o.email,
      customerPhone: o.billing_address?.phone || '',
      items: (o.items || []).map((item: any) => ({
        id: item.id,
        productId: item.variant_id || item.id,
        name: item.title,
        price: (item.unit_price || 0) / 100,
        quantity: item.quantity,
        image: item.thumbnail,
      })),
      subtotal: (o.subtotal || 0) / 100,
      tax: (o.tax_total || 0) / 100,
      total: (o.total || 0) / 100,
      status: (o.status as OrderStatus) || 'pending',
      paymentStatus: o.payment_status === 'captured' ? 'paid' : (o.payment_status as PaymentStatus) || 'pending',
      paymentMethod: o.payments?.[0]?.provider_id || '',
      shippingAddress: o.shipping_address ? {
        street: o.shipping_address.address_1 || '',
        city: o.shipping_address.city || '',
        province: o.shipping_address.province || '',
        postalCode: o.shipping_address.postal_code || '',
        country: o.shipping_address.country_code?.toUpperCase() || 'ZA',
      } : undefined,
      notes: o.customer_note || '',
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }))
  }, [medusaData])

  // Supabase orders
  const [supabaseOrders, setSupabaseOrders] = useState<Order[]>([])
  const [supabaseLoading, setSupabaseLoading] = useState(false)
  const [supabaseAvailable, setSupabaseAvailable] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    setSupabaseLoading(true)
    fetch('/api/tenant/orders')
      .then(r => r.json())
      .then(data => {
        if (data.orders?.length > 0) {
          const mapped: Order[] = data.orders.map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number || o.id,
            customerName: o.customer_name || o.customer_email,
            customerEmail: o.customer_email,
            customerPhone: o.customer_phone || '',
            items: o.items || [],
            subtotal: o.subtotal || 0,
            tax: o.tax_amount || 0,
            total: o.total || 0,
            status: o.status as OrderStatus,
            paymentStatus: o.payment_status as PaymentStatus,
            paymentMethod: o.payment_method || '',
            notes: o.customer_notes || '',
            createdAt: o.created_at,
            updatedAt: o.updated_at,
          }))
          setSupabaseOrders(mapped)
          setSupabaseAvailable(true)
        }
      })
      .catch(() => setSupabaseAvailable(false))
      .finally(() => setSupabaseLoading(false))
  }, [isAuthenticated])

  const refreshOrders = async () => {
    setSupabaseLoading(true)
    try {
      const r = await fetch('/api/tenant/orders')
      const d = await r.json()
      if (d.orders?.length > 0) {
        setSupabaseOrders(d.orders.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number || o.id,
          customerName: o.customer_name || o.customer_email,
          customerEmail: o.customer_email,
          customerPhone: o.customer_phone || '',
          items: o.items || [],
          subtotal: o.subtotal || 0,
          tax: o.tax_amount || 0,
          total: o.total || 0,
          status: o.status as OrderStatus,
          paymentStatus: o.payment_status as PaymentStatus,
          paymentMethod: o.payment_method || '',
          notes: o.customer_notes || '',
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        })))
      }
      toast.success('Orders refreshed')
    } catch {
      toast.error('Failed to refresh orders')
    } finally {
      setSupabaseLoading(false)
    }
  }

  // Priority: Medusa > Supabase > localStorage
  const useMedusa = medusaOrders.length > 0 && !medusaError
  const useSupabase = !useMedusa && supabaseOrders.length > 0
  const orders: Order[] = useMedusa ? medusaOrders : useSupabase ? supabaseOrders : localOrders
  const dataSource = useMedusa ? 'medusa' : useSupabase ? 'supabase' : 'local'

  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => {
        const matchesSearch = 
          o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, searchQuery, statusFilter])

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    revenue: orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0),
  }), [orders])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    })
  }

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus)
    toast.success(`Order status updated to ${newStatus}`)
  }

  const handleGenerateInvoice = (order: Order) => {
    const existingInvoice = invoices.find(i => i.referenceId === order.id)
    if (existingInvoice) {
      toast.error('Invoice already exists for this order')
      return
    }
    const invoice = createInvoiceFromOrder(order)
    addInvoice(invoice)
    toast.success(`Invoice ${invoice.invoiceNumber} created`)
  }

  return (
    <AdminLayout title="Orders">
      <Toaster position="top-right" />

      {/* Header with data source indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm">
          {dataSource === 'medusa' && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
              ● Medusa
            </span>
          )}
          {dataSource === 'supabase' && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full">
              ● Supabase
            </span>
          )}
          {dataSource === 'local' && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
              ● Local
            </span>
          )}
          {(medusaLoading || supabaseLoading) && (
            <span className="text-gray-500">Loading...</span>
          )}
        </div>
        <button
          onClick={refreshOrders}
          disabled={supabaseLoading}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${supabaseLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Processing</div>
          <div className="text-2xl font-bold text-purple-600">{stats.processing}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Shipped</div>
          <div className="text-2xl font-bold text-indigo-600">{stats.shipped}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Revenue</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredOrders.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{order.orderNumber}</div>
                    <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.items.length} item(s)</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{formatCurrency(order.total)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className={`px-2 py-1 text-xs rounded-full border-0 ${statusColors[order.status]}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${paymentColors[order.paymentStatus]}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleGenerateInvoice(order)}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Generate Invoice"
                      >
                        <FileText className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">Orders will appear here when customers make purchases.</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Order {selectedOrder.orderNumber}</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerPhone && <p className="text-sm text-gray-500">{selectedOrder.customerPhone}</p>}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Items</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>VAT (15%)</span>
                  <span>{formatCurrency(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Shipping Address</h3>
                  <p className="text-sm">
                    {selectedOrder.shippingAddress.street}<br />
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.province}<br />
                    {selectedOrder.shippingAddress.postalCode}, {selectedOrder.shippingAddress.country}
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => handleGenerateInvoice(selectedOrder)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Generate Invoice
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

