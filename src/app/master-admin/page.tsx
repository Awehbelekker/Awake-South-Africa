'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  CreditCard,
  Cloud,
  Globe,
  Plus,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Loader2
} from 'lucide-react'

interface TenantSummary {
  id: string
  name: string
  slug: string
  domain: string | null
  subdomain: string | null
  plan: string
  is_active: boolean
  created_at: string
}

export default function MasterAdminDashboard() {
  const router = useRouter()
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/master-admin/auth')
        const data = await response.json()

        if (!data.authenticated) {
          router.push('/master-admin/login')
          return
        }

        setAuthenticated(true)
        setAdminEmail(data.email || '')
      } catch (error) {
        router.push('/master-admin/login')
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/master-admin/auth', { method: 'DELETE' })
    router.push('/master-admin/login')
  }

  useEffect(() => {
    if (!authenticated) return

    // TODO: Fetch tenants from API
    // For now, show placeholder data
    setTenants([
      {
        id: '1',
        name: 'Awake SA',
        slug: 'awake-sa',
        domain: 'www.awakesa.co.za',
        subdomain: 'awake',
        plan: 'enterprise',
        is_active: true,
        created_at: '2024-01-01',
      },
      {
        id: '2',
        name: 'Kelp Boards SA',
        slug: 'kelp-boards',
        domain: 'www.kelpboards.co.za',
        subdomain: 'kelp',
        plan: 'pro',
        is_active: true,
        created_at: '2024-02-01',
      },
      {
        id: '3',
        name: 'Aweh Be Lekker',
        slug: 'aweh-be-lekker',
        domain: null,
        subdomain: 'aweh',
        plan: 'basic',
        is_active: true,
        created_at: '2024-03-01',
      },
    ])
    setLoading(false)
  }, [authenticated])

  const stats = [
    { label: 'Total Clients', value: tenants.length, icon: Building2, color: 'bg-blue-500' },
    { label: 'Active Stores', value: tenants.filter(t => t.is_active).length, icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Payment Gateways', value: 5, icon: CreditCard, color: 'bg-purple-500' },
    { label: 'Cloud Storage', value: 2, icon: Cloud, color: 'bg-orange-500' },
  ]

  // Show loading while checking auth
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Master Admin</h1>
              <p className="text-gray-500 mt-1">
                {adminEmail ? `Logged in as ${adminEmail}` : 'Manage all client stores from one place'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/master-admin/tenants/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Client
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/master-admin/tenants" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
            <Building2 className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-lg">Manage Clients</h3>
            <p className="text-gray-500 text-sm">View and edit all client stores</p>
          </Link>
          <Link href="/master-admin/payments" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
            <CreditCard className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-lg">Payment Gateways</h3>
            <p className="text-gray-500 text-sm">Configure payment credentials</p>
          </Link>
          <Link href="/master-admin/storage" className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
            <Cloud className="w-8 h-8 text-orange-600 mb-3" />
            <h3 className="font-semibold text-lg">Cloud Storage</h3>
            <p className="text-gray-500 text-sm">Set up Google Drive / OneDrive</p>
          </Link>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">All Clients</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{tenant.name}</div>
                      <div className="text-sm text-gray-500">{tenant.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tenant.domain || `${tenant.subdomain}.yoursaas.com`}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        tenant.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                        tenant.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${tenant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {tenant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/master-admin/tenants/${tenant.id}`} className="text-blue-600 hover:text-blue-800 mr-4">
                        Edit
                      </Link>
                      <a href={`https://${tenant.domain || `${tenant.subdomain}.yoursaas.com`}`} target="_blank" className="text-gray-600 hover:text-gray-800">
                        Visit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

