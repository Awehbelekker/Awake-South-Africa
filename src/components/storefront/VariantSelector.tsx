'use client'

import { useState, useEffect } from 'react'

interface Variant {
  id: string
  name: string
  options: Record<string, string>
  price_override: number | null
  stock_count: number
}

interface Props {
  productId: string
  tenantSlug?: string
  basePrice: number
  onVariantChange: (variantId: string | null, variantName: string | null, price: number) => void
}

export default function VariantSelector({ productId, tenantSlug, basePrice, onVariantChange }: Props) {
  const [variants, setVariants] = useState<Variant[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug

    fetch(`/api/tenant/products/${productId}/variants`, { headers })
      .then(r => r.json())
      .then(d => {
        const v = d.variants || []
        setVariants(v)
        if (v.length > 0) {
          setSelected(v[0].id)
          onVariantChange(v[0].id, v[0].name, v[0].price_override ?? basePrice)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [productId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || variants.length === 0) return null

  const handleSelect = (v: Variant) => {
    setSelected(v.id)
    onVariantChange(v.id, v.name, v.price_override ?? basePrice)
  }

  // Group option keys from first variant to build selectors
  const optionKeys = Object.keys(variants[0]?.options || {})

  // If simple list (no structured options keys), show as buttons
  if (optionKeys.length === 0) {
    return (
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-400 mb-2">Variant</p>
        <div className="flex flex-wrap gap-2">
          {variants.map(v => (
            <button
              key={v.id}
              onClick={() => handleSelect(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                selected === v.id
                  ? 'border-accent-primary bg-accent-primary text-awake-black'
                  : 'border-gray-600 text-gray-300 hover:border-gray-400'
              } ${v.stock_count === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={v.stock_count === 0}
            >
              {v.name}
              {v.price_override && v.price_override !== basePrice && (
                <span className="ml-1 text-xs">(R{v.price_override.toLocaleString()})</span>
              )}
              {v.stock_count === 0 && <span className="ml-1 text-xs">(Out)</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Structured options: show a select per option key
  return (
    <div className="mt-4 space-y-3">
      {optionKeys.map(key => {
        const uniqueValues = [...new Set(variants.map(v => v.options[key]).filter(Boolean))]
        return (
          <div key={key}>
            <p className="text-sm font-medium text-gray-400 mb-2 capitalize">{key}</p>
            <div className="flex flex-wrap gap-2">
              {uniqueValues.map(val => {
                const matchingVariant = variants.find(v => v.options[key] === val)
                const isSelected = matchingVariant ? selected === matchingVariant.id : false
                const outOfStock = matchingVariant ? matchingVariant.stock_count === 0 : false
                return (
                  <button
                    key={val}
                    onClick={() => matchingVariant && handleSelect(matchingVariant)}
                    disabled={outOfStock || !matchingVariant}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      isSelected
                        ? 'border-accent-primary bg-accent-primary text-awake-black'
                        : 'border-gray-600 text-gray-300 hover:border-gray-400'
                    } ${outOfStock ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                  >
                    {val}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
