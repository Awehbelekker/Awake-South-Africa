'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Pencil } from 'lucide-react'

export interface BulkEditUpdates {
  inStock?: boolean
  stockQuantity?: number
  price?: number
  priceExVAT?: number
  costEUR?: number
  categoryTag?: string
  fulfillment?: 'in_stock' | 'preorder'
}

interface BulkEditModalProps {
  isOpen: boolean
  count: number
  categories: string[]
  onClose: () => void
  onApply: (updates: BulkEditUpdates) => Promise<void>
}

type FieldKey = keyof BulkEditUpdates

export default function BulkEditModal({
  isOpen,
  count,
  categories,
  onClose,
  onApply,
}: BulkEditModalProps) {
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState<Record<string, boolean>>({})
  const [inStock, setInStock] = useState<'true' | 'false'>('true')
  const [stockQuantity, setStockQuantity] = useState('0')
  const [price, setPrice] = useState('')
  const [priceExVAT, setPriceExVAT] = useState('')
  const [costEUR, setCostEUR] = useState('')
  const [categoryTag, setCategoryTag] = useState('')
  const [fulfillment, setFulfillment] = useState<'in_stock' | 'preorder'>('preorder')

  const toggle = (key: string) =>
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }))

  const reset = () => {
    setEnabled({})
    setInStock('true')
    setStockQuantity('0')
    setPrice('')
    setPriceExVAT('')
    setCostEUR('')
    setCategoryTag('')
    setFulfillment('preorder')
  }

  const handleClose = () => {
    if (saving) return
    reset()
    onClose()
  }

  const handleApply = async () => {
    const updates: BulkEditUpdates = {}
    if (enabled.inStock) updates.inStock = inStock === 'true'
    if (enabled.stockQuantity) updates.stockQuantity = parseInt(stockQuantity, 10) || 0
    if (enabled.price) updates.price = parseFloat(price) || 0
    if (enabled.priceExVAT) updates.priceExVAT = parseFloat(priceExVAT) || 0
    if (enabled.costEUR) updates.costEUR = parseFloat(costEUR) || 0
    if (enabled.categoryTag && categoryTag) updates.categoryTag = categoryTag
    if (enabled.fulfillment) {
      updates.fulfillment = fulfillment
      if (!enabled.inStock) updates.inStock = fulfillment === 'in_stock'
      if (!enabled.stockQuantity && fulfillment === 'preorder') updates.stockQuantity = 0
    }

    if (Object.keys(updates).length === 0) return

    setSaving(true)
    try {
      await onApply(updates)
      reset()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const FieldRow = ({
    field,
    label,
    children,
  }: {
    field: FieldKey
    label: string
    children: React.ReactNode
  }) => (
    <label className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <input
        type="checkbox"
        checked={!!enabled[field]}
        onChange={() => toggle(field)}
        className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
      />
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        <div className={`mt-1.5 ${enabled[field] ? '' : 'opacity-40 pointer-events-none'}`}>
          {children}
        </div>
      </div>
    </label>
  )

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform rounded-xl bg-white shadow-xl transition-all">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                  <Pencil className="h-5 w-5 text-blue-600" />
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Bulk edit {count} product{count !== 1 ? 's' : ''}
                  </Dialog.Title>
                </div>

                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                  <p className="text-sm text-gray-500 mb-4">
                    Check the fields you want to change. Unchecked fields stay as they are.
                  </p>

                  <FieldRow field="fulfillment" label="Fulfilment">
                    <select
                      value={fulfillment}
                      onChange={(e) => setFulfillment(e.target.value as 'in_stock' | 'preorder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                    >
                      <option value="in_stock">In stock — ready to ship</option>
                      <option value="preorder">Pre-order — air freight from Sweden</option>
                    </select>
                  </FieldRow>

                  <FieldRow field="inStock" label="In stock flag">
                    <select
                      value={inStock}
                      onChange={(e) => setInStock(e.target.value as 'true' | 'false')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                    >
                      <option value="true">In stock</option>
                      <option value="false">Out of stock / pre-order</option>
                    </select>
                  </FieldRow>

                  <FieldRow field="stockQuantity" label="Stock quantity">
                    <input
                      type="number"
                      min={0}
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                    />
                  </FieldRow>

                  <FieldRow field="price" label="Price (inc VAT, ZAR)">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 241139"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                    />
                  </FieldRow>

                  <FieldRow field="priceExVAT" label="Price (ex VAT, ZAR)">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={priceExVAT}
                      onChange={(e) => setPriceExVAT(e.target.value)}
                      placeholder="e.g. 209686"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                    />
                  </FieldRow>

                  <FieldRow field="costEUR" label="Cost (EUR)">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={costEUR}
                      onChange={(e) => setCostEUR(e.target.value)}
                      placeholder="Landed cost in EUR"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                    />
                  </FieldRow>

                  <FieldRow field="categoryTag" label="Category">
                    <select
                      value={categoryTag}
                      onChange={(e) => setCategoryTag(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                    >
                      <option value="">Select category…</option>
                      {categories.filter((c) => c !== 'all').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </FieldRow>
                </div>

                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={saving}
                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={saving || Object.keys(enabled).length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md"
                  >
                    {saving ? 'Applying…' : `Apply to ${count}`}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
