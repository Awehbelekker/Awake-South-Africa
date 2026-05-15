'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Award, TrendingUp } from 'lucide-react'
import { TIERS } from '@/lib/stoke-points'

interface LeaderboardRow {
  customer_email: string
  points: number
  tier: string
  total_earned: number
}

export default function StokeAdminPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stoke')
      .then(r => r.json())
      .then(d => setRows(d.rows || []))
      .finally(() => setLoading(false))
  }, [])

  const tierInfo = (name: string) => TIERS.find(t => t.name === name) || TIERS[0]

  return (
    <AdminLayout title="Stoke Points">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stoke Points Loyalty</h1>
          <p className="text-sm text-gray-500 mt-1">Customer loyalty leaderboard — 1 point per R10 spent</p>
        </div>

        {/* Tier legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TIERS.map(t => (
            <div key={t.name} className={`rounded-xl p-4 ${t.bg} text-center`}>
              <div className="text-2xl mb-1">{t.emoji}</div>
              <p className={`font-bold ${t.color}`}>{t.label}</p>
              <p className="text-xs text-gray-500">{t.min}+ points</p>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-500" />
            <h2 className="font-semibold text-gray-900">Leaderboard</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Customer', 'Tier', 'Points', 'Total Earned'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No loyalty members yet</td></tr>
              ) : rows.map((r, i) => {
                const t = tierInfo(r.tier)
                return (
                  <tr key={r.customer_email} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-bold text-gray-400">#{i + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{r.customer_email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${t.bg} ${t.color}`}>
                        {t.emoji} {t.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{r.points.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{r.total_earned.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
