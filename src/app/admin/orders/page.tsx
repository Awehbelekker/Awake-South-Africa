'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useInvoicesStore } from '@/store/invoices'
import { useAdminStore } from '@/store/admin'
import {
  Search, Filter, Eye, FileText, Package,
  XCircle, RefreshCw, Bell, CheckCircle2, Layers, Download
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { exportToCSV } from '@/lib/csv'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  image?: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod?: string
  trackingNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped:    'bg-indigo-100 text-indigo-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
  refunded:   'bg-gray-100 text-gray-800',
}

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  paid:     'bg-green-100 text-green-800',
  failed:   'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const NOTIFY_ON: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

// ─── Status Change Modal ──────────────────────────────────────────────────────

interface StatusModalProps {
  order: Order
  newStatus: OrderStatus
  onConfirm: (opts: { notify: boolean; trackingNumber?: string }) => void
  onCancel: () => void
  saving: boolean
}

function StatusModal({ order, newStatus, onConfirm, onCancel, saving }: StatusModalProps) {
  const [notify, setNotify] = useState(NOTIFY_ON.includes(newStatus))
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Update Order Status</h3>
          <p className="text-sm text-gray-500 mt-1">
            Order <strong>{order.orderNumber}</strong> → <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[newStatus]}`}>{newStatus}</span>
          </p>
        </div>

        {newStatus === 'shipped' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tracking Number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. CPN123456789ZA"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {order.customerEmail && (
          <div className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all ${notify ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
            onClick={() => setNotify(!notify)}>
            <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${notify ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
              {notify && <CheckCircle2 className="w-3 h-3 text-white" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Notify customer</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Send email{order.customerPhone ? ' + WhatsApp' : ''} to {order.customerEmail}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ notify, trackingNumber: trackingNumber || undefined })}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { addInvoice, createInvoiceFromOrder, invoices } = useInvoicesStore()
  const { isAuthenticated } = useAdminStore()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Status change flow
  const [pendingChange, setPendingChange] = useState<{ order: Order; newStatus: OrderStatus } | null>(null)
  const [saving, setSaving] = useState(false)

  // Bulk selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  const [bulkStatusSaving, setBulkStatusSaving] = useState(false)
  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(n)

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  // ── Load orders ────────────────────────────────────────────────────────────
  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/tenant/orders')
      const data = await res.json()
      if (data.orders) {
        setOrders(data.orders.map((o: any): Order => ({
          id:             o.id,
          orderNumber:    o.order_number || o.id,
          customerName:   o.customer_name || o.customer_email || 'Unknown',
          customerEmail:  o.customer_email || '',
          customerPhone:  o.customer_phone || '',
          items:          Array.isArray(o.items) ? o.items : [],
          subtotal:       o.subtotal || 0,
          tax:            o.tax_amount || 0,
          total:          o.total || 0,
          status:         o.status as OrderStatus,
          paymentStatus:  o.payment_status as PaymentStatus,
          paymentMethod:  o.payment_gateway || o.payment_method || '',
          trackingNumber: o.tracking_number || '',
          notes:          o.customer_notes || '',
          createdAt:      o.created_at,
          updatedAt:      o.updated_at,
        })))
      }
      if (!silent) toast.success('Orders refreshed')
    } catch {
      if (!silent) toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) loadOrders(true)
  }, [isAuthenticated, loadOrders])

  // ── Status change ──────────────────────────────────────────────────────────
  const handleStatusSelect = (order: Order, newStatus: OrderStatus) => {
    if (newStatus === order.status) return
    setPendingChange({ order, newStatus })
  }

  const handleStatusConfirm = async ({ notify, trackingNumber }: { notify: boolean; trackingNumber?: string }) => {
    if (!pendingChange) return
    const { order, newStatus } = pendingChange
    setSaving(true)
    try {
      const res = await fetch(`/api/tenant/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          tracking_number: trackingNumber,
          notify,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Update failed')

      // Update local state immediately
      setOrders(prev => prev.map(o => o.id === order.id
        ? { ...o, status: newStatus, trackingNumber: trackingNumber ?? o.trackingNumber }
        : o
      ))
      // Also update selected order if open
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus, trackingNumber: trackingNumber ?? prev.trackingNumber } : null)
      }

      toast.success(`Order ${order.orderNumber} → ${newStatus}${notify ? ' · Customer notified' : ''}`)
      setPendingChange(null)
    } catch (e: any) {
      toast.error(e.message || 'Failed to update order')
    } finally {
      setSaving(false)
    }
  }

  // ── Notify customer manually ───────────────────────────────────────────────
  const handleNotify = async (order: Order) => {
    if (!order.customerEmail) { toast.error('No customer email on this order'); return }
    const toastId = toast.loading('Sending notification...')
    try {
      const res = await fetch(`/api/tenant/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: order.status, notify: true }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Customer notified', { id: toastId })
    } catch (e: any) {
      toast.error(e.message || 'Notification failed', { id: toastId })
    }
  }

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAllOrders = () => {
    setSelectedOrderIds(
      selectedOrderIds.size === filtered.length
        ? new Set()
        : new Set(filtered.map(o => o.id))
    )
  }

  const handleBulkStatusChange = async (newStatus: OrderStatus) => {
    if (selectedOrderIds.size === 0) return
    if (!confirm(`Change ${selectedOrderIds.size} order(s) to "${newStatus}"? Customers will not be notified.`)) return
    setBulkStatusSaving(true)
    try {
      await Promise.all(
        Array.from(selectedOrderIds).map(id =>
          fetch(`/api/tenant/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, notify: false }),
          })
        )
      )
      setOrders(prev => prev.map(o =>
        selectedOrderIds.has(o.id) ? { ...o, status: newStatus } : o
      ))
      toast.success(`${selectedOrderIds.size} order(s) → ${newStatus}`)
      setSelectedOrderIds(new Set())
    } catch {
      toast.error('Bulk status update failed')
    } finally {
      setBulkStatusSaving(false)
    }
  }

  const handleBulkGenerateInvoices = () => {
    if (selectedOrderIds.size === 0) return
    const selected = filtered.filter(o => selectedOrderIds.has(o.id))
    let created = 0
    selected.forEach(order => {
      if (!invoices.find(i => i.referenceId === order.id)) {
        addInvoice(createInvoiceFromOrder(order as any))
        created++
      }
    })
    const skipped = selected.length - created
    toast.success(`${created} invoice(s) created${skipped > 0 ? `, ${skipped} already existed` : ''}`)
    setSelectedOrderIds(new Set())
  }

  const handleGenerateInvoice = (order: Order) => {
    if (invoices.find(i => i.referenceId === order.id)) {
      toast.error('Invoice already exists for this order')
      return
    }
    const invoice = createInvoiceFromOrder(order as any)
    addInvoice(invoice)
    toast.success(`Invoice ${invoice.invoiceNumber} created`)
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    orders
      .filter(o => {
        const q = searchQuery.toLowerCase()
        const matchSearch = !q ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q)
        const matchStatus = statusFilter === 'all' || o.status === statusFilter
        return matchSearch && matchStatus
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [orders, searchQuery, statusFilter])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const pagedOrders = filtered.slice((page - 1) * pageSize, page * pageSize)

  const exportOrders = () => exportToCSV(
    filtered.map(o => ({
      'Order #': o.orderNumber,
      Date: new Date(o.createdAt).toLocaleDateString('en-ZA'),
      Customer: o.customerName,
      Email: o.customerEmail,
      Phone: o.customerPhone || '',
      Items: o.items.length,
      Total: o.total,
      Status: o.status,
      Payment: o.paymentStatus,
      'Payment Method': o.paymentMethod || '',
      'Tracking #': o.trackingNumber || '',
    })),
    `orders-${new Date().toISOString().slice(0, 10)}`
  )

  const stats = useMemo(() => ({
    total:      orders.length,
    pending:    orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped:    orders.filter(o => o.status === 'shipped').length,
    revenue:    orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
  }), [orders])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Orders">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          ● Supabase
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={exportOrders}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => loadOrders()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: stats.total, color: 'text-gray-900' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Processing', value: stats.processing, color: 'text-purple-600' },
          { label: 'Shipped', value: stats.shipped, color: 'text-indigo-600' },
          { label: 'Revenue', value: formatCurrency(stats.revenue), color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search order number, customer name, or email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | 'all'); setPage(1) }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrderIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-2 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm font-medium text-gray-700">{selectedOrderIds.size} selected</span>
          <select
            disabled={bulkStatusSaving}
            defaultValue=""
            onChange={e => { if (e.target.value) handleBulkStatusChange(e.target.value as OrderStatus) }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-900 bg-white disabled:opacity-40"
          >
            <option value="" disabled>Change status…</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button
            onClick={handleBulkGenerateInvoices}
            disabled={bulkStatusSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-40"
          >
            <Layers className="h-3.5 w-3.5" />
            Generate Invoices
          </button>
          <button onClick={() => setSelectedOrderIds(new Set())} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Loading orders...</div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={selectedOrderIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAllOrders} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                  </th>
                  {['Order', 'Customer', 'Items', 'Total', 'Status', 'Payment', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagedOrders.map(order => (
                  <tr key={order.id} className={`hover:bg-gray-50 ${selectedOrderIds.has(order.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedOrderIds.has(order.id)} onChange={() => toggleSelectOrder(order.id)} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{order.orderNumber}</div>
                      <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerEmail}</div>
                      {order.customerPhone && <div className="text-xs text-gray-400">{order.customerPhone}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 text-sm">{formatCurrency(order.total)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusSelect(order, e.target.value as OrderStatus)}
                        className={`px-2 py-1 text-xs rounded-full border-0 cursor-pointer font-medium ${STATUS_COLORS[order.status]}`}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${PAYMENT_COLORS[order.paymentStatus]}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedOrder(order)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="View details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleNotify(order)} className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Notify customer">
                          <Bell className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleGenerateInvoice(order)} className="p-1.5 text-gray-400 hover:text-purple-600 rounded" title="Generate invoice">
                          <FileText className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 text-sm">Orders appear here when customers complete checkout.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 25 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white">
              {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>per page · {filtered.length} orders</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40">← Prev</button>
            <span>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}

      {/* ── Status Change Modal ──────────────────────────────────────────────── */}
      {pendingChange && (
        <StatusModal
          order={pendingChange.order}
          newStatus={pendingChange.newStatus}
          onConfirm={handleStatusConfirm}
          onCancel={() => setPendingChange(null)}
          saving={saving}
        />
      )}

      {/* ── Order Detail Modal ───────────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Order {selectedOrder.orderNumber}</h2>
                <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Status + Payment badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${STATUS_COLORS[selectedOrder.status]}`}>
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </span>
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${PAYMENT_COLORS[selectedOrder.paymentStatus]}`}>
                  {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                </span>
                {selectedOrder.paymentMethod && (
                  <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 font-medium">
                    {selectedOrder.paymentMethod}
                  </span>
                )}
              </div>

              {/* Customer */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Customer</p>
                  <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerPhone && <p className="text-sm text-gray-600">{selectedOrder.customerPhone}</p>}
                </div>
                {selectedOrder.trackingNumber && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tracking</p>
                    <p className="font-medium text-gray-900 font-mono text-sm">{selectedOrder.trackingNumber}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Items</p>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {selectedOrder.items.length > 0 ? selectedOrder.items.map((item, i) => (
                    <div key={item.id || i} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-900 text-sm">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  )) : (
                    <p className="p-3 text-sm text-gray-500">No item details available</p>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>VAT (15%)</span><span>{formatCurrency(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span><span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Change status from modal */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setSelectedOrder(null)
                        handleStatusSelect(selectedOrder, s)
                      }}
                      disabled={s === selectedOrder.status}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-default
                        ${s === selectedOrder.status ? STATUS_COLORS[s] : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700'}`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-5 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => handleNotify(selectedOrder)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <Bell className="h-4 w-4" /> Notify Customer
              </button>
              <button
                onClick={() => handleGenerateInvoice(selectedOrder)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
              >
                <FileText className="h-4 w-4" /> Generate Invoice
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium"
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
