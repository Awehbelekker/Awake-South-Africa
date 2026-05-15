'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { FileText, Eye, Check, X as XIcon } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Quote {
  id: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  total_zar: number
  financing_months: number | null
  monthly_payment: number | null
  status: string
  created_at: string
  quote_html: string
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

export default function QuotesAdminPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<Quote | null>(null)

  const load = () => {
    fetch('/api/admin/quotes')
      .then(r => r.json())
      .then(d => setQuotes(d.quotes || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch('/api/admin/quotes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) { setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q)); toast.success('Updated') }
  }

  return (
    <AdminLayout title="Quotes">
      <Toaster />
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Customer', 'Total', 'Financing', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : quotes.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No quotes yet</td></tr>
              ) : quotes.map(q => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{q.customer_name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">{q.customer_email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">R{(q.total_zar || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {q.financing_months ? `${q.financing_months}mo @ R${q.monthly_payment?.toLocaleString()}/mo` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={q.status}
                      onChange={e => updateStatus(q.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${STATUS_STYLE[q.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {['pending', 'sent', 'accepted', 'declined'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(q.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setPreview(q)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quote HTML preview modal */}
        {preview && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="font-semibold text-gray-900">Quote Preview — {preview.customer_name || 'Anonymous'}</h2>
                <button onClick={() => setPreview(null)}>
                  <XIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div dangerouslySetInnerHTML={{ __html: preview.quote_html || '<p>No content</p>' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
