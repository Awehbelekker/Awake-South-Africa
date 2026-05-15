'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

interface Variant {
  id?: string
  name: string
  sku: string
  price_override: string
  stock_count: string
  options: string
}

const empty = (): Variant => ({ name: '', sku: '', price_override: '', stock_count: '0', options: '{}' })

export default function ProductVariantsPage() {
  const { id: productId } = useParams() as { id: string }
  const router = useRouter()
  const [variants, setVariants] = useState<Variant[]>([])
  const [productName, setProductName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/tenant/products/${productId}/variants`).then(r => r.json()),
      fetch(`/api/tenant/products?tenant_id=`).then(() => null).catch(() => null),
    ]).then(([varData]) => {
      setVariants((varData.variants || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        sku: v.sku || '',
        price_override: v.price_override?.toString() || '',
        stock_count: v.stock_count?.toString() || '0',
        options: JSON.stringify(v.options || {}),
      })))
    }).finally(() => setLoading(false))
  }, [productId])

  const addRow = () => setVariants(v => [...v, empty()])

  const updateRow = (idx: number, field: keyof Variant, val: string) => {
    setVariants(v => v.map((row, i) => i === idx ? { ...row, [field]: val } : row))
  }

  const saveVariant = async (idx: number) => {
    const v = variants[idx]
    setSaving(String(idx))
    try {
      let options: Record<string, string> = {}
      try { options = JSON.parse(v.options) } catch { options = {} }

      const body = {
        name: v.name,
        sku: v.sku || null,
        price_override: v.price_override ? parseFloat(v.price_override) : null,
        stock_count: parseInt(v.stock_count) || 0,
        options,
      }

      let res
      if (v.id) {
        res = await fetch(`/api/tenant/products/${productId}/variants?variant_id=${v.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch(`/api/tenant/products/${productId}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setVariants(prev => prev.map((row, i) => i === idx ? { ...row, id: data.variant?.id } : row))
      toast.success(v.id ? 'Variant updated' : 'Variant created')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(null)
    }
  }

  const deleteVariant = async (idx: number) => {
    const v = variants[idx]
    if (!v.id) { setVariants(prev => prev.filter((_, i) => i !== idx)); return }
    if (!confirm('Delete this variant?')) return

    const res = await fetch(`/api/tenant/products/${productId}/variants?variant_id=${v.id}`, { method: 'DELETE' })
    if (res.ok) {
      setVariants(prev => prev.filter((_, i) => i !== idx))
      toast.success('Deleted')
    } else {
      toast.error('Delete failed')
    }
  }

  return (
    <AdminLayout title="Product Variants">
      <Toaster />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Manage Variants</h1>
          <span className="text-sm text-gray-500">Product ID: {productId.slice(0, 8)}…</span>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Add size, colour, or material variants. Leave price override blank to use the product's base price.
            </p>
            <button
              onClick={addRow}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Variant
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : variants.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No variants yet. Click "Add Variant" to create size/colour options.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Options (JSON)', 'SKU', 'Price Override (R)', 'Stock', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {variants.map((v, idx) => (
                  <tr key={v.id || idx}>
                    <td className="px-4 py-3">
                      <input
                        value={v.name}
                        onChange={e => updateRow(idx, 'name', e.target.value)}
                        placeholder="e.g. Black / XL"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={v.options}
                        onChange={e => updateRow(idx, 'options', e.target.value)}
                        placeholder='{"colour":"Black","size":"XL"}'
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-mono"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={v.sku}
                        onChange={e => updateRow(idx, 'sku', e.target.value)}
                        placeholder="SKU-001"
                        className="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={v.price_override}
                        onChange={e => updateRow(idx, 'price_override', e.target.value)}
                        placeholder="base"
                        className="w-28 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={v.stock_count}
                        onChange={e => updateRow(idx, 'stock_count', e.target.value)}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button
                        onClick={() => saveVariant(idx)}
                        disabled={saving === String(idx)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteVariant(idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
