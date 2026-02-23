'use client'

import { useState, useMemo, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useInvoicesStore, Invoice, InvoiceStatus } from '@/store/invoices'
import { useAdminStore } from '@/store/admin'
import { 
  Search, Filter, Eye, Download, Send, CheckCircle, 
  XCircle, Clock, FileText, Printer, Mail
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const statusColors: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export default function AdminInvoicesPage() {
  const { invoices, updateInvoiceStatus, markAsPaid } = useInvoicesStore()
  const { settings } = useAdminStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        const matchesSearch = 
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [invoices, searchQuery, statusFilter])

  const stats = useMemo(() => ({
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalOutstanding: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.total, 0),
    totalPaid: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
  }), [invoices])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleMarkPaid = (invoiceId: string) => {
    markAsPaid(invoiceId)
    toast.success('Invoice marked as paid')
  }

  const handleSendInvoice = (invoice: Invoice) => {
    updateInvoiceStatus(invoice.id, 'sent')
    toast.success(`Invoice sent to ${invoice.customerEmail}`)
  }

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${selectedInvoice?.invoiceNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .invoice-header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                .invoice-header h1 { margin: 0; color: #333; }
                .company-info { margin-top: 10px; color: #666; }
                .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .customer-info, .invoice-info { flex: 1; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                .items-table th { background: #f5f5f5; font-weight: bold; }
                .totals { text-align: right; }
                .totals .total-row { display: flex; justify-content: flex-end; gap: 50px; padding: 5px 0; }
                .totals .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
                @media print { body { padding: 20px; } }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  return (
    <AdminLayout title="Invoices">
      <Toaster position="top-right" />
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Draft</div>
          <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Sent</div>
          <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Paid</div>
          <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Overdue</div>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Outstanding</div>
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalOutstanding)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredInvoices.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">{formatDate(invoice.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{invoice.customerName}</div>
                    <div className="text-sm text-gray-500">{invoice.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-sm text-gray-600">{invoice.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{formatCurrency(invoice.total)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{formatDate(invoice.dueDate)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="View Invoice"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => handleSendInvoice(invoice)}
                          className="p-1 text-gray-400 hover:text-green-600"
                          title="Send Invoice"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      )}
                      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <button
                          onClick={() => handleMarkPaid(invoice.id)}
                          className="p-1 text-gray-400 hover:text-green-600"
                          title="Mark as Paid"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500">Invoices will appear here when generated from orders or bookings.</p>
          </div>
        )}
      </div>

      {/* Invoice Detail/Print Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Invoice {selectedInvoice.invoiceNumber}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2 text-gray-600 hover:text-blue-600"
                  title="Print Invoice"
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Content */}
            <div ref={printRef} className="p-8">
              <div className="invoice-header border-b-2 border-gray-800 pb-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                <div className="company-info mt-2 text-gray-600">
                  <p className="font-semibold">{settings.storeName}</p>
                  <p>Email: {settings.email}</p>
                  <p>Phone: {settings.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To:</h3>
                  <p className="font-semibold">{selectedInvoice.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedInvoice.customerEmail}</p>
                  {selectedInvoice.customerPhone && <p className="text-sm text-gray-600">{selectedInvoice.customerPhone}</p>}
                  {selectedInvoice.customerAddress && <p className="text-sm text-gray-600">{selectedInvoice.customerAddress}</p>}
                </div>
                <div className="text-right">
                  <p><span className="text-gray-500">Invoice #:</span> <span className="font-semibold">{selectedInvoice.invoiceNumber}</span></p>
                  <p><span className="text-gray-500">Date:</span> {formatDate(selectedInvoice.createdAt)}</p>
                  <p><span className="text-gray-500">Due Date:</span> {formatDate(selectedInvoice.dueDate)}</p>
                  <p className="mt-2">
                    <span className={`px-3 py-1 text-sm rounded-full ${statusColors[selectedInvoice.status]}`}>
                      {selectedInvoice.status.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>

              <table className="w-full mb-8">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                    <th className="py-3 text-center text-sm font-semibold text-gray-700">Qty</th>
                    <th className="py-3 text-right text-sm font-semibold text-gray-700">Unit Price</th>
                    <th className="py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-3 text-sm">{item.description}</td>
                      <td className="py-3 text-sm text-center">{item.quantity}</td>
                      <td className="py-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 text-sm text-right">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">VAT ({(selectedInvoice.taxRate * 100).toFixed(0)}%):</span>
                    <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-gray-800 font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Notes:</h4>
                  <p className="text-sm text-gray-600">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              {selectedInvoice.status === 'draft' && (
                <button
                  onClick={() => { handleSendInvoice(selectedInvoice); setSelectedInvoice(null); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Send className="h-4 w-4" /> Send Invoice
                </button>
              )}
              {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'overdue') && (
                <button
                  onClick={() => { handleMarkPaid(selectedInvoice.id); setSelectedInvoice(null); }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" /> Mark as Paid
                </button>
              )}
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
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

