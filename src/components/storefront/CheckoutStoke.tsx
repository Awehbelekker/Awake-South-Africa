'use client'

import { useState } from 'react'

interface Props {
  subtotal: number
  onRedeem: (discountAmount: number, email: string, points: number) => void
  onClear: () => void
  applied: boolean
}

export default function CheckoutStoke({ subtotal, onRedeem, onClear, applied }: Props) {
  const [email, setEmail] = useState('')
  const [balance, setBalance] = useState<{ points: number; tier: string; rands: number } | null>(null)
  const [pointsToRedeem, setPointsToRedeem] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checked, setChecked] = useState(false)

  const checkBalance = async () => {
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/tenant/stoke?email=${encodeURIComponent(email)}`)
      const d = await res.json()
      if (!res.ok || !d.points) { setError('No Stoke Points account found for that email.'); return }
      setBalance({ points: d.points, tier: d.tier, rands: Math.floor(d.points / 10) })
      setChecked(true)
    } catch {
      setError('Could not load balance. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const applyRedeem = async () => {
    const pts = parseInt(pointsToRedeem)
    if (!pts || pts < 10) { setError('Minimum redemption is 10 points (R1).'); return }
    if (!balance || pts > balance.points) { setError('Not enough points.'); return }
    const discount = Math.floor(pts / 10)
    if (discount > subtotal) { setError(`Maximum you can redeem is R${Math.floor(subtotal)} (${Math.floor(subtotal) * 10} pts).`); return }

    setLoading(true)
    try {
      const res = await fetch('/api/tenant/stoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'redeem', email, points: pts }),
      })
      const d = await res.json()
      if (!res.ok || !d.success) { setError(d.error || 'Redemption failed.'); return }
      onRedeem(discount, email, pts)
    } catch {
      setError('Redemption failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">⭐</span>
          <span className="text-yellow-300">Stoke Points redeemed</span>
        </div>
        <button onClick={onClear} className="text-gray-400 hover:text-white text-xs">Remove</button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Stoke Points</p>

      {!checked ? (
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email to check balance"
            className="flex-1 px-3 py-2 text-sm bg-awake-black border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
          />
          <button onClick={checkBalance} disabled={loading || !email}
            className="px-4 py-2 text-sm font-medium bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 disabled:opacity-50">
            {loading ? '…' : 'Check'}
          </button>
        </div>
      ) : balance && balance.points >= 10 ? (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-yellow-300 font-medium capitalize">{balance.tier} · {balance.points} pts</span>
            <span className="text-gray-400">= up to R{balance.rands} off</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={pointsToRedeem}
              onChange={e => setPointsToRedeem(e.target.value)}
              placeholder={`10–${Math.min(balance.points, Math.floor(subtotal) * 10)} pts`}
              min={10}
              max={Math.min(balance.points, Math.floor(subtotal) * 10)}
              className="flex-1 px-3 py-2 text-sm bg-awake-black border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-yellow-500"
            />
            <button onClick={applyRedeem} disabled={loading || !pointsToRedeem}
              className="px-4 py-2 text-sm font-medium bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 disabled:opacity-50">
              {loading ? '…' : 'Redeem'}
            </button>
          </div>
          <p className="text-xs text-gray-500">10 pts = R1 discount</p>
        </div>
      ) : (
        <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-400">
          {balance ? 'Not enough points to redeem (minimum 10).' : 'No balance found.'}{' '}
          <button onClick={() => { setChecked(false); setError('') }} className="text-yellow-400 hover:underline">Try again</button>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
