'use client'

import { useState, useEffect } from 'react'
import { Flame, Eye, Clock, AlertTriangle } from 'lucide-react'

interface SocialProofData {
  views: number
  recent_purchases: number
  last_purchase_ago: string | null
  low_stock: boolean
  stock_count: number
}

interface Props {
  productId: string
  tenantSlug?: string
}

export default function SocialProof({ productId, tenantSlug }: Props) {
  const [data, setData] = useState<SocialProofData | null>(null)

  useEffect(() => {
    const headers: Record<string, string> = {}
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug

    // Record the view
    fetch(`/api/tenant/products/${productId}/social-proof`, { method: 'POST', headers }).catch(() => {})

    // Fetch social proof data
    const load = () => {
      fetch(`/api/tenant/products/${productId}/social-proof`, { headers })
        .then(r => r.json())
        .then(d => setData(d))
        .catch(() => {})
    }

    load()
    // Refresh every 60 seconds to show live activity
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [productId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return null

  const badges: { icon: React.ReactNode; text: string; color: string }[] = []

  if (data.recent_purchases > 0) {
    badges.push({
      icon: <Flame className="w-4 h-4" />,
      text: `${data.recent_purchases} bought in the last 24h`,
      color: 'text-orange-400 bg-orange-900/30 border-orange-800',
    })
  }

  if (data.views > 10) {
    badges.push({
      icon: <Eye className="w-4 h-4" />,
      text: `${data.views} people viewing this`,
      color: 'text-blue-400 bg-blue-900/30 border-blue-800',
    })
  }

  if (data.last_purchase_ago) {
    badges.push({
      icon: <Clock className="w-4 h-4" />,
      text: `Last purchased ${data.last_purchase_ago}`,
      color: 'text-green-400 bg-green-900/30 border-green-800',
    })
  }

  if (data.low_stock) {
    badges.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      text: `Only ${data.stock_count} left in stock`,
      color: 'text-red-400 bg-red-900/30 border-red-800',
    })
  }

  if (badges.length === 0) return null

  return (
    <div className="mt-4 space-y-2">
      {badges.map((b, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${b.color}`}
        >
          {b.icon}
          {b.text}
        </div>
      ))}
    </div>
  )
}
