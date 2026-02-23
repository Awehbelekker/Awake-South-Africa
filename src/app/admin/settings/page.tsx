'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminStore } from '@/store/admin'
import { GoogleDriveConnection } from '@/components/admin/GoogleDriveConnection'

export default function AdminSettingsPage() {
  const router = useRouter()
  const { isAuthenticated, settings, updateSettings } = useAdminStore()
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated) {
    return null
  }

  const handleSave = () => {
    updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <AdminLayout title="Settings">
      <div className="max-w-3xl">
        <div className="bg-white rounded-lg shadow p-6">
          {saved && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              Settings saved successfully!
            </div>
          )}

          <div className="space-y-6">
            {/* Store Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Store Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Store Name</label>
                  <input
                    type="text"
                    value={form.storeName}
                    onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Settings */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Exchange Rate (EUR to ZAR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.exchangeRate}
                    onChange={(e) => setForm({ ...form, exchangeRate: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border text-gray-900 bg-white"
                  />
                  <p className="mt-1 text-sm text-gray-500">Current rate: R{form.exchangeRate}/EUR</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Target Margin (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.margin * 100}
                    onChange={(e) => setForm({ ...form, margin: Number(e.target.value) / 100 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border text-gray-900 bg-white"
                  />
                  <p className="mt-1 text-sm text-gray-500">Target margin: {(form.margin * 100).toFixed(0)}%</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    VAT Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.taxRate * 100}
                    onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) / 100 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border text-gray-900 bg-white"
                  />
                  <p className="mt-1 text-sm text-gray-500">VAT: {(form.taxRate * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>

            {/* Google Drive Integration */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Integrations</h3>
              <GoogleDriveConnection />
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t">
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
