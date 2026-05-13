'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, CheckCircle, Clock, XCircle, AlertTriangle, ArrowLeft, Zap } from 'lucide-react'

interface PlanRow {
  id: string
  name: string
  display_name: string
  price_zar: number
  max_products: number
  max_pages: number
  has_ai: boolean
  has_whatsapp: boolean
  has_page_builder: boolean
}

interface SubRow {
  tenant_id: string
  tenant_name: string
  tenant_slug: string
  status: string
  plan_name: string
  plan_display: string
  price_zar: number
  period_end: string
  trial_ends_at: string
}

const STATUS_STYLE: Record<string, string> = {
  active:    'bg-green-100 text-green-800',
  trial:     'bg-blue-100 text-blue-800',
  past_due:  'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-gray-100 text-gray-600',
  expired:   'bg-red-100 text-red-800',
  none:      'bg-gray-100 text-gray-500',
}

const STATUS_ICON: Record<string, typeof CheckCircle> = {
  active: CheckCircle, trial: Clock, past_due: AlertTriangle,
  cancelled: XCircle, expired: XCircle, none: AlertTriangle,
}

export default function MasterAdminBillingPage() {
  const router = useRouter()
  const [plans, setPlans]   = useState<PlanRow[]>([])
  const [subs, setSubs]     = useState<SubRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const res  = await fetch('/api/master-admin/auth')
      const data = await res.json()
      if (!data.authenticated) { router.push('/master-admin/login'); return }
      loadData()
    }
    checkAuth()
  }, [router])

  async function loadData() {
    try {
      const [plansRes, subsRes] = await Promise.all([
        fetch('/api/billing/plans'),
        fetch('/api/billing/all-subscriptions'),
      ])
      if (plansRes.ok) setPlans(await plansRes.json())
      if (subsRes.ok)  setSubs(await subsRes.json())
    } finally {
      setLoading(false)
    }
  }

  const mrr = subs
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.price_zar || 0), 0)

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 flex items-center gap-4">
          <Link href="/master-admin" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Subscriptions</h1>
            <p className="text-sm text-gray-500 mt-0.5">Platform subscription management</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* MRR stat */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">Monthly Recurring Revenue</p>
            <p className="text-3xl font-bold text-green-600 mt-1">R {mrr.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{subs.filter(s => s.status === 'active').length} active subscriptions</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">On Trial</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{subs.filter(s => s.status === 'trial').length}</p>
            <p className="text-xs text-gray-400 mt-1">converting to paid</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-sm text-gray-500">Expired / At Risk</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{subs.filter(s => ['expired','past_due'].includes(s.status)).length}</p>
            <p className="text-xs text-gray-400 mt-1">need attention</p>
          </div>
        </div>

        {/* Plans */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Subscription Plans</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {loading ? (
              <div className="col-span-3 py-12 text-center text-gray-400">Loading plans…</div>
            ) : plans.map(plan => (
              <div key={plan.id} className="p-6">
                <p className="font-semibold text-lg text-gray-900">{plan.display_name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">R {plan.price_zar}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                <ul className="mt-4 space-y-1 text-sm text-gray-600">
                  <li>{plan.max_products === -1 ? 'Unlimited' : plan.max_products} products</li>
                  <li>{plan.max_pages === -1 ? 'Unlimited' : plan.max_pages} pages</li>
                  {plan.has_ai && <li className="text-blue-600">✓ AI Assistant</li>}
                  {plan.has_page_builder && <li className="text-blue-600">✓ Page Builder</li>}
                  {plan.has_whatsapp && <li className="text-blue-600">✓ WhatsApp</li>}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Subscriptions table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">All Client Subscriptions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Client','Plan','Status','Period End','Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading…</td></tr>
                ) : subs.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No subscriptions yet</td></tr>
                ) : subs.map(sub => {
                  const Icon = STATUS_ICON[sub.status] || AlertTriangle
                  return (
                    <tr key={sub.tenant_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{sub.tenant_name}</p>
                        <p className="text-xs text-gray-500">{sub.tenant_slug}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{sub.plan_display || '—'}</p>
                        {sub.price_zar && <p className="text-xs text-gray-500">R {sub.price_zar}/mo</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${STATUS_STYLE[sub.status] || 'bg-gray-100'}`}>
                          <Icon className="w-3 h-3" />
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {sub.status === 'trial' && sub.trial_ends_at
                          ? `Trial ends ${new Date(sub.trial_ends_at).toLocaleDateString()}`
                          : sub.period_end ? new Date(sub.period_end).toLocaleDateString() : '—'
                        }
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/master-admin/tenants/${sub.tenant_id}/configure`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          Configure
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
