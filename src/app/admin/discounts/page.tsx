'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Discount {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
  min_order_zar: number
  is_active: boolean
  created_at: string
}

const emptyForm = { code: '', type: 'percent' as const, value: '', max_uses: '', expires_at: '', min_order_zar: '' }

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/tenant/discounts')
      .then(r => r.json())
      .then(d => setDiscounts(d.discounts || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.code || !form.value) { toast.error('Code and value are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/tenant/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: parseFloat(form.value),
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
          expires_at: form.expires_at || null,
          min_order_zar: form.min_order_zar ? parseFloat(form.min_order_zar) : 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Discount code created')
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (d: Discount) => {
    const res = await fetch('/api/tenant/discounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: d.id, is_active: !d.is_active }),
    })
    if (res.ok) {
      setDiscounts(prev => prev.map(x => x.id === d.id ? { ...x, is_active: !x.is_active } : x))
      toast.success(d.is_active ? 'Disabled' : 'Enabled')
    }
  }

  const remove = async (d: Discount) => {
    if (!confirm(`Delete code "${d.code}"?`)) return
    const res = await fetch(`/api/tenant/discounts?id=${d.id}`, { method: 'DELETE' })
    if (res.ok) { setDiscounts(prev => prev.filter(x => x.id !== d.id)); toast.success('Deleted') }
    else toast.error('Delete failed')
  }

  return (
    <AdminLayout title="Discount Codes">
      <Toaster />
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discount Codes</h1>
            <p className="text-sm text-gray-500 mt-1">Create percent or fixed-amount codes for checkout</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> New Code
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">New Discount Code</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Code</label>
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER20"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed (R)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">
                  Value ({form.type === 'percent' ? '%' : 'R'})
                </label>
                <input
                  type="number"
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === 'percent' ? '20' : '100'}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Max Uses</label>
                <input
                  type="number"
                  value={form.max_uses}
                  onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Unlimited"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Expires At</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 uppercase">Min Order (R)</label>
                <input
                  type="number"
                  value={form.min_order_zar}
                  onChange={e => setForm(f => ({ ...f, min_order_zar: e.target.value }))}
                  placeholder="0"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={create}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create Code'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-5 py-2 text-gray-600 hover:text-gray-800 text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Code', 'Type / Value', 'Uses', 'Expires', 'Min Order', 'Status', ''].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No discount codes yet. Click "New Code" to create one.
                  </td>
                </tr>
              ) : discounts.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-500" />
                      <span className="font-mono font-bold text-gray-900">{d.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {d.type === 'percent' ? `${d.value}% off` : `R${d.value} off`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {d.used_count}{d.max_uses ? ` / ${d.max_uses}` : ''}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {d.expires_at ? new Date(d.expires_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {d.min_order_zar ? `R${d.min_order_zar}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggle(d)} title={d.is_active ? 'Disable' : 'Enable'}>
                      {d.is_active
                        ? <ToggleRight className="w-6 h-6 text-green-500" />
                        : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => remove(d)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
