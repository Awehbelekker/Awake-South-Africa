'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import InvoiceCreateModal from '@/components/admin/InvoiceCreateModal'
import { useInvoicesStore, Invoice, InvoiceStatus } from '@/store/invoices'
import { useAdminStore } from '@/store/admin'
import { 
  Search, Filter, Eye, Download, Send, CheckCircle, 
  XCircle, Clock, FileText, Printer, Mail, Plus, Trash2, RefreshCw
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
  const { invoices, updateInvoiceStatus, markAsPaid, addInvoice } = useInvoicesStore()
  const { settings, isAuthenticated } = useAdminStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Supabase persistence layer
  const [supabaseInvoices, setSupabaseInvoices] = useState<Invoice[]>([])
  const [supabaseAvailable, setSupabaseAvailable] = useState(true)
  const [supabaseLoading, setSupabaseLoading] = useState(false)
  const prevInvoiceCountRef = useRef(invoices.length)

  // Load invoices from Supabase on mount
  useEffect(() => {
    if (!isAuthenticated) return
    setSupabaseLoading(true)
    fetch('/api/tenant/invoices')
      .then(r => r.json())
      .then(data => {
        if (data.invoices && data.invoices.length > 0) {
          setSupabaseInvoices(data.invoices)
          setSupabaseAvailable(true)
        } else if (data.tableExists === false) {
          setSupabaseAvailable(false)
        } else {
          // Supabase reachable but empty — push local invoices up
          setSupabaseAvailable(true)
          if (invoices.length > 0) {
            syncAllToSupabase(invoices)
          }
        }
      })
      .catch(() => setSupabaseAvailable(false))
      .finally(() => setSupabaseLoading(false))
  }, [isAuthenticated])

  // Auto-sync new invoices added via InvoiceCreateModal
  useEffect(() => {
    if (!supabaseAvailable) return
    if (invoices.length > prevInvoiceCountRef.current) {
      const newInvoices = invoices.slice(prevInvoiceCountRef.current)
      newInvoices.forEach(inv => {
        fetch('/api/tenant/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inv),
        })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              setSupabaseInvoices(prev => [{ ...inv, _supabaseId: data.invoice?.id } as any, ...prev])
            }
          })
          .catch(err => console.warn('Invoice sync failed:', err))
      })
    }
    prevInvoiceCountRef.current = invoices.length
  }, [invoices.length, supabaseAvailable])

  const syncAllToSupabase = async (localInvoices: Invoice[]) => {
    for (const inv of localInvoices) {
      try {
        await fetch('/api/tenant/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inv),
        })
      } catch { /* ignore */ }
    }
    const r = await fetch('/api/tenant/invoices')
    const d = await r.json()
    if (d.invoices?.length > 0) setSupabaseInvoices(d.invoices)
  }

  const refreshFromSupabase = async () => {
    setSupabaseLoading(true)
    try {
      const r = await fetch('/api/tenant/invoices')
      const d = await r.json()
      if (d.invoices) setSupabaseInvoices(d.invoices)
      toast.success('Invoices refreshed')
    } catch {
      toast.error('Failed to refresh')
    } finally {
      setSupabaseLoading(false)
    }
  }

  // Use Supabase data when available, fall back to localStorage
  const useSupabase = supabaseAvailable && supabaseInvoices.length > 0
  const displayInvoices: Invoice[] = useSupabase ? supabaseInvoices : invoices
  const dataSource = useSupabase ? 'supabase' : 'local'

  const patchInvoiceInSupabase = async (inv: Invoice, updates: Partial<Invoice>) => {
    if (!supabaseAvailable) return
    try {
      await fetch('/api/tenant/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, id: inv.id, _supabaseId: (inv as any)._supabaseId }),
      })
      setSupabaseInvoices(prev =>
        prev.map(i => i.id === inv.id ? { ...i, ...updates } : i)
      )
    } catch (err) {
      console.warn('Invoice patch failed:', err)
    }
  }

  const filteredInvoices = useMemo(() => {
    return displayInvoices
      .filter(inv => {
        const matchesSearch = 
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [displayInvoices, searchQuery, statusFilter])

  const stats = useMemo(() => ({
    total: displayInvoices.length,
    draft: displayInvoices.filter(i => i.status === 'draft').length,
    sent: displayInvoices.filter(i => i.status === 'sent').length,
    paid: displayInvoices.filter(i => i.status === 'paid').length,
    overdue: displayInvoices.filter(i => i.status === 'overdue').length,
    totalOutstanding: displayInvoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum: number, i) => sum + i.total, 0),
    totalPaid: displayInvoices.filter(i => i.status === 'paid').reduce((sum: number, i) => sum + i.total, 0),
  }), [displayInvoices])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleMarkPaid = async (invoiceId: string) => {
    const invoice = displayInvoices.find(i => i.id === invoiceId)
    markAsPaid(invoiceId)
    if (invoice) {
      await patchInvoiceInSupabase(invoice, { status: 'paid', paidDate: new Date().toISOString() })
    }
    toast.success('Invoice marked as paid')
  }

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return
    if (supabaseAvailable && (invoice as any)._supabaseId) {
      const res = await fetch(`/api/tenant/invoices?id=${(invoice as any)._supabaseId}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.success) {
        setSupabaseInvoices(prev => prev.filter(i => i.id !== invoice.id))
        if (selectedInvoice?.id === invoice.id) setSelectedInvoice(null)
        toast.success('Invoice deleted')
      } else {
        toast.error('Delete failed')
      }
    } else {
      setSupabaseInvoices(prev => prev.filter(i => i.id !== invoice.id))
      if (selectedInvoice?.id === invoice.id) setSelectedInvoice(null)
      toast.success('Invoice removed')
    }
  }

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      // Send email with invoice data and settings
      const response = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          customerEmail: invoice.customerEmail,
          invoiceDate: formatDate(invoice.createdAt),
          dueDate: formatDate(invoice.dueDate),
          items: invoice.items,
          subtotal: invoice.subtotal,
          taxRate: invoice.taxRate,
          taxAmount: invoice.taxAmount,
          total: invoice.total,
          notes: invoice.notes,
          storeName: settings.storeName,
          storeEmail: settings.email,
          // Invoice settings
          logo: settings.invoiceLogo,
          logoPosition: settings.invoiceLogoPosition,
          theme: settings.invoiceTheme,
          showVAT: settings.invoiceShowVAT,
          showTaxNumber: settings.invoiceShowTaxNumber,
          taxNumber: settings.taxNumber,
          showBankDetails: settings.invoiceShowBankDetails,
          bankName: settings.bankName,
          bankAccountNumber: settings.bankAccountNumber,
          bankBranchCode: settings.bankBranchCode,
          footerText: settings.invoiceFooterText,
          terms: settings.invoiceTerms,
          showLineNumbers: settings.invoiceShowLineNumbers,
          currencySymbol: settings.currencySymbol,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        updateInvoiceStatus(invoice.id, 'sent')
        await patchInvoiceInSupabase(invoice, { status: 'sent' })
        toast.success(`Invoice sent to ${invoice.customerEmail}`)
      } else {
        toast.error(data.error || 'Failed to send invoice')
      }
    } catch (error: any) {
      toast.error(`Failed to send invoice: ${error.message}`)
    }
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
      <InvoiceCreateModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      
      {/* Header Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500">Manage and track all invoices</p>
            {supabaseAvailable ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                ● Supabase
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                ● Local only
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshFromSupabase}
            disabled={supabaseLoading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            title="Refresh from Supabase"
          >
            <RefreshCw className={`h-4 w-4 ${supabaseLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Create Invoice
          </button>
        </div>
      </div>
      
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
                      <button
                        onClick={() => handleDeleteInvoice(invoice)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete Invoice"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
              {/* Logo */}
              {settings.invoiceLogo && (
                <div className={`mb-4 ${
                  settings.invoiceLogoPosition === 'center' ? 'text-center' :
                  settings.invoiceLogoPosition === 'right' ? 'text-right' : 'text-left'
                }`}>
                  <img 
                    src={settings.invoiceLogo} 
                    alt="Company Logo" 
                    className="h-16 inline-block"
                  />
                </div>
              )}

              {/* Theme-based header */}
              <div className={`border-b-2 pb-4 mb-6 ${
                settings.invoiceTheme === 'modern' ? 'border-purple-600' :
                settings.invoiceTheme === 'minimal' ? 'border-gray-400' :
                settings.invoiceTheme === 'bold' ? 'border-red-600' :
                'border-blue-800'
              }`}>
                <h1 className={`text-3xl font-bold ${
                  settings.invoiceTheme === 'modern' ? 'text-purple-600' :
                  settings.invoiceTheme === 'minimal' ? 'text-gray-900' :
                  settings.invoiceTheme === 'bold' ? 'text-red-600' :
                  'text-blue-800'
                }`}>INVOICE</h1>
                <div className="company-info mt-2 text-gray-600">
                  <p className="font-semibold">{settings.storeName}</p>
                  <p>Email: {settings.email}</p>
                  <p>Phone: {settings.phone}</p>
                  {settings.invoiceShowTaxNumber && settings.taxNumber && (
                    <p>VAT Number: {settings.taxNumber}</p>
                  )}
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
                  <tr className={`border-b-2 ${
                    settings.invoiceTheme === 'modern' ? 'border-purple-300' :
                    settings.invoiceTheme === 'minimal' ? 'border-gray-300' :
                    settings.invoiceTheme === 'bold' ? 'border-red-300' :
                    'border-blue-300'
                  }`}>
                    {settings.invoiceShowLineNumbers && (
                      <th className="py-3 text-left text-sm font-semibold text-gray-700 w-12">#</th>
                    )}
                    <th className="py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                    <th className="py-3 text-center text-sm font-semibold text-gray-700">Qty</th>
                    <th className="py-3 text-right text-sm font-semibold text-gray-700">Unit Price</th>
                    <th className="py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      {settings.invoiceShowLineNumbers && (
                        <td className="py-3 text-sm text-gray-500">{index + 1}</td>
                      )}
                      <td className="py-3 text-sm">{item.description}</td>
                      <td className="py-3 text-sm text-center">{item.quantity}</td>
                      <td className="py-3 text-sm text-right">{settings.currencySymbol || 'R'}{item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 text-sm text-right">{settings.currencySymbol || 'R'}{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{settings.currencySymbol || 'R'}{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {(settings.invoiceShowVAT ?? true) && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">VAT ({(selectedInvoice.taxRate * 100).toFixed(0)}%):</span>
                      <span>{settings.currencySymbol || 'R'}{selectedInvoice.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between py-3 border-t-2 font-bold text-lg ${
                    settings.invoiceTheme === 'modern' ? 'border-purple-600' :
                    settings.invoiceTheme === 'minimal' ? 'border-gray-400' :
                    settings.invoiceTheme === 'bold' ? 'border-red-600' :
                    'border-blue-800'
                  }`}>
                    <span>Total:</span>
                    <span>{settings.currencySymbol || 'R'}{selectedInvoice.total.toFixed(2)}</span>
                  </div>
                  {!(settings.invoiceShowVAT ?? true) && (
                    <p className="text-xs text-gray-500 mt-1 text-right">Prices exclude VAT</p>
                  )}
                </div>
              </div>

              {/* Bank Details */}
              {settings.invoiceShowBankDetails && settings.bankName && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Banking Details</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Bank:</span> {settings.bankName}</p>
                    {settings.bankAccountNumber && <p><span className="font-medium">Account Number:</span> {settings.bankAccountNumber}</p>}
                    {settings.bankBranchCode && <p><span className="font-medium">Branch Code:</span> {settings.bankBranchCode}</p>}
                  </div>
                </div>
              )}

              {selectedInvoice.notes && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Notes:</h4>
                  <p className="text-sm text-gray-600">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Terms & Conditions */}
              {settings.invoiceTerms && (
                <div className="mt-8 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Terms & Conditions</h4>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{settings.invoiceTerms}</p>
                </div>
              )}

              {/* Footer Text */}
              {settings.invoiceFooterText && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">{settings.invoiceFooterText}</p>
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

