'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminStore } from '@/store/admin'
import { GoogleDriveConnection } from '@/components/admin/GoogleDriveConnection'
import InvoiceSettings from '@/components/admin/InvoiceSettings'
import { GATEWAY_INFO } from '@/lib/payments/factory'
import type { EmailConfig, WhatsAppConfig } from '@/components/master-admin/IntegrationsTab'

const defaultEmail = (): EmailConfig => ({
  provider: '', sender_name: '', sender_email: '', reply_to: '',
  smtp_host: '', smtp_port: '587', smtp_secure: false, smtp_user: '', smtp_password: '', api_key: '',
})
const defaultWhatsApp = (): WhatsAppConfig => ({
  phone_number: '', provider: 'none',
  twilio_account_sid: '', twilio_auth_token: '', twilio_from_number: '',
  meta_phone_number_id: '', meta_access_token: '', meta_verify_token: '',
  template_order_confirmed: 'Hi {{name}}, your order {{order_id}} has been confirmed! Total: {{total}}.',
  template_order_shipped: 'Hi {{name}}, your order {{order_id}} is on its way!',
  template_order_ready: 'Hi {{name}}, your order {{order_id}} is ready for collection.',
})

export default function AdminSettingsPage() {
  const router = useRouter()
  const { isAuthenticated, settings, updateSettings } = useAdminStore()
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState(settings)
  const [saved, setSaved] = useState(false)

  // Integrations state
  const [activeSection, setActiveSection] = useState<'store' | 'pricing' | 'payments' | 'email' | 'whatsapp'>('store')
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(defaultEmail())
  const [waConfig, setWaConfig] = useState<WhatsAppConfig>(defaultWhatsApp())
  const [integLoading, setIntegLoading] = useState(false)
  const [integSaving, setIntegSaving] = useState(false)
  const [integMsg, setIntegMsg] = useState('')
  const [activeGateways, setActiveGateways] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) router.push('/admin')
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!mounted || !isAuthenticated) return
    loadIntegrations()
    loadGateways()
  }, [mounted, isAuthenticated])

  async function loadIntegrations() {
    setIntegLoading(true)
    try {
      const res = await fetch('/api/tenant/integrations')
      if (res.ok) {
        const data = await res.json()
        if (data.email_config) setEmailConfig({ ...defaultEmail(), ...data.email_config })
        if (data.whatsapp_config) setWaConfig({ ...defaultWhatsApp(), ...data.whatsapp_config })
      }
    } catch {}
    finally { setIntegLoading(false) }
  }

  async function loadGateways() {
    try {
      const res = await fetch('/api/tenant/payment-gateways')
      if (res.ok) {
        const data = await res.json()
        setActiveGateways(data.gateways || [])
      }
    } catch {}
  }

  async function saveIntegrations() {
    setIntegSaving(true)
    setIntegMsg('')
    try {
      const res = await fetch('/api/tenant/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_config: emailConfig, whatsapp_config: waConfig }),
      })
      if (!res.ok) throw new Error('Save failed')
      setIntegMsg('Saved successfully!')
      setTimeout(() => setIntegMsg(''), 3000)
    } catch (e: any) {
      setIntegMsg(`Error: ${e.message}`)
    } finally {
      setIntegSaving(false)
    }
  }

  const handleSave = () => {
    updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!mounted || !isAuthenticated) return null

  const navItems = [
    { id: 'store', label: '🏪 Store' },
    { id: 'pricing', label: '💰 Pricing' },
    { id: 'payments', label: '💳 Payments' },
    { id: 'email', label: '📧 Email' },
    { id: 'whatsapp', label: '💬 WhatsApp' },
  ] as const

  return (
    <AdminLayout title="Settings">
      <div className="max-w-4xl">
        {/* Section nav */}
        <div className="flex flex-wrap gap-1 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveSection(n.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeSection === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {saved && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm font-medium">
              Settings saved successfully!
            </div>
          )}
          {integMsg && (
            <div className={`mb-4 px-4 py-3 rounded text-sm font-medium ${integMsg.startsWith('Error') ? 'bg-red-50 border border-red-300 text-red-700' : 'bg-green-50 border border-green-300 text-green-700'}`}>
              {integMsg}
            </div>
          )}

          {/* ── STORE INFO ──────────────────────────────────────── */}
          {activeSection === 'store' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Store Information</h3>
              <div className="space-y-4">
                {[
                  { label: 'Store Name', key: 'storeName', type: 'text' },
                  { label: 'Email', key: 'email', type: 'email' },
                  { label: 'Phone', key: 'phone', type: 'tel' },
                  { label: 'WhatsApp', key: 'whatsapp', type: 'tel' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <input
                      type={type}
                      value={(form as any)[key] || ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border text-gray-900 bg-white"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <InvoiceSettings />
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-base font-medium text-gray-900 mb-3">Google Drive</h3>
                <GoogleDriveConnection />
              </div>

              <button onClick={handleSave} className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
                Save Store Settings
              </button>
            </div>
          )}

          {/* ── PRICING ─────────────────────────────────────────── */}
          {activeSection === 'pricing' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Pricing Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Exchange Rate (EUR → ZAR)</label>
                  <input
                    type="number" step="0.01"
                    value={form.exchangeRate}
                    onChange={(e) => setForm({ ...form, exchangeRate: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border text-gray-900 bg-white"
                  />
                  <p className="mt-1 text-sm text-gray-500">Current: R{form.exchangeRate}/EUR</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Margin (%)</label>
                  <input
                    type="number" step="0.01"
                    value={form.margin * 100}
                    onChange={(e) => setForm({ ...form, margin: Number(e.target.value) / 100 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">VAT Rate (%)</label>
                  <input
                    type="number" step="0.01"
                    value={form.taxRate * 100}
                    onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) / 100 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border text-gray-900 bg-white"
                  />
                </div>
              </div>
              <button onClick={handleSave} className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
                Save Pricing Settings
              </button>
            </div>
          )}

          {/* ── PAYMENTS ────────────────────────────────────────── */}
          {activeSection === 'payments' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Payment Gateways</h3>
                <p className="text-sm text-gray-500 mt-1">Active gateways configured by your account manager. Contact support to add or change gateways.</p>
              </div>

              {integLoading ? (
                <p className="text-gray-500 text-sm">Loading...</p>
              ) : activeGateways.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-500 text-sm">No payment gateways configured yet.</p>
                  <p className="text-gray-400 text-xs mt-1">Contact your account manager to enable payment processing.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeGateways.map((tg: any) => {
                    const code = tg.payment_gateways?.code
                    const info = code ? GATEWAY_INFO[code as keyof typeof GATEWAY_INFO] : null
                    return (
                      <div key={tg.id} className={`flex items-center gap-4 p-4 rounded-lg border ${tg.is_enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{info?.name || code}</span>
                            {tg.is_default && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Default</span>}
                            {tg.is_sandbox && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Sandbox</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{info?.description}</p>
                          <p className="text-xs text-gray-400">{info?.currencies?.join(' · ')}</p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${tg.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {tg.is_enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── EMAIL ───────────────────────────────────────────── */}
          {activeSection === 'email' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Email Configuration</h3>
                <p className="text-sm text-gray-500 mt-1">How your store sends order confirmations, invoices, and notifications.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                    <input value={emailConfig.sender_name} onChange={(e) => setEmailConfig({ ...emailConfig, sender_name: e.target.value })}
                      placeholder="My Store" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sender Email</label>
                    <input type="email" value={emailConfig.sender_email} onChange={(e) => setEmailConfig({ ...emailConfig, sender_email: e.target.value })}
                      placeholder="orders@mystore.co.za" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reply-To Email</label>
                  <input type="email" value={emailConfig.reply_to} onChange={(e) => setEmailConfig({ ...emailConfig, reply_to: e.target.value })}
                    placeholder="support@mystore.co.za" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Provider</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ id: 'smtp', label: 'SMTP', desc: 'Any mail server' }, { id: 'sendgrid', label: 'SendGrid', desc: 'API-based' }, { id: 'resend', label: 'Resend', desc: 'Developer-first' }].map((p) => (
                      <button key={p.id} onClick={() => setEmailConfig({ ...emailConfig, provider: p.id as EmailConfig['provider'] })}
                        className={`p-3 rounded-lg border text-left transition-all ${emailConfig.provider === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="text-sm font-medium text-gray-900">{p.label}</div>
                        <div className="text-xs text-gray-500">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {emailConfig.provider === 'smtp' && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Host</label>
                        <input value={emailConfig.smtp_host} onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })}
                          placeholder="smtp.gmail.com" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
                        <input value={emailConfig.smtp_port} onChange={(e) => setEmailConfig({ ...emailConfig, smtp_port: e.target.value })}
                          placeholder="587" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={emailConfig.smtp_secure} onChange={(e) => setEmailConfig({ ...emailConfig, smtp_secure: e.target.checked })} className="rounded text-blue-600" />
                      <span className="text-sm text-gray-700">Use SSL/TLS</span>
                    </label>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                      <input value={emailConfig.smtp_user} onChange={(e) => setEmailConfig({ ...emailConfig, smtp_user: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                      <input type="password" value={emailConfig.smtp_password} onChange={(e) => setEmailConfig({ ...emailConfig, smtp_password: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white" />
                    </div>
                  </div>
                )}

                {(emailConfig.provider === 'sendgrid' || emailConfig.provider === 'resend') && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {emailConfig.provider === 'sendgrid' ? 'SendGrid API Key' : 'Resend API Key'}
                    </label>
                    <input type="password" value={emailConfig.api_key} onChange={(e) => setEmailConfig({ ...emailConfig, api_key: e.target.value })}
                      placeholder={emailConfig.provider === 'sendgrid' ? 'SG.xxxxxxxx' : 're_xxxxxxxx'}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white" />
                  </div>
                )}
              </div>

              <button onClick={saveIntegrations} disabled={integSaving} className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50">
                {integSaving ? 'Saving...' : 'Save Email Settings'}
              </button>
            </div>
          )}

          {/* ── WHATSAPP ────────────────────────────────────────── */}
          {activeSection === 'whatsapp' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">WhatsApp Communication</h3>
                <p className="text-sm text-gray-500 mt-1">Customer notifications and support via WhatsApp.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                  <input value={waConfig.phone_number} onChange={(e) => setWaConfig({ ...waConfig, phone_number: e.target.value })}
                    placeholder="+27821234567" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white" />
                  <p className="text-xs text-gray-400 mt-1">Used for the chat button on your website. No API needed.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Provider (automated messages)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ id: 'none', label: 'None', desc: 'Chat link only' }, { id: 'twilio', label: 'Twilio', desc: 'WhatsApp Business' }, { id: 'meta', label: 'Meta Cloud', desc: 'Official API' }].map((p) => (
                      <button key={p.id} onClick={() => setWaConfig({ ...waConfig, provider: p.id as WhatsAppConfig['provider'] })}
                        className={`p-3 rounded-lg border text-left transition-all ${waConfig.provider === p.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="text-sm font-medium text-gray-900">{p.label}</div>
                        <div className="text-xs text-gray-500">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {waConfig.provider === 'twilio' && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    {[
                      { key: 'twilio_account_sid', label: 'Account SID', ph: 'ACxxxxxxxx', type: 'text' },
                      { key: 'twilio_auth_token', label: 'Auth Token', ph: '••••••••', type: 'password' },
                      { key: 'twilio_from_number', label: 'From Number', ph: '+14155238886', type: 'text' },
                    ].map(({ key, label, ph, type }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                        <input type={type} value={(waConfig as any)[key]} onChange={(e) => setWaConfig({ ...waConfig, [key]: e.target.value })}
                          placeholder={ph} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white" />
                      </div>
                    ))}
                  </div>
                )}

                {waConfig.provider === 'meta' && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    {[
                      { key: 'meta_phone_number_id', label: 'Phone Number ID', ph: '1234567890', type: 'text' },
                      { key: 'meta_access_token', label: 'Access Token', ph: 'EAAxxxxxxxx', type: 'password' },
                      { key: 'meta_verify_token', label: 'Webhook Verify Token', ph: 'any-secret-string', type: 'text' },
                    ].map(({ key, label, ph, type }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                        <input type={type} value={(waConfig as any)[key]} onChange={(e) => setWaConfig({ ...waConfig, [key]: e.target.value })}
                          placeholder={ph} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white" />
                      </div>
                    ))}
                  </div>
                )}

                {(waConfig.provider === 'twilio' || waConfig.provider === 'meta') && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Message Templates</h4>
                      <p className="text-xs text-gray-400">Variables: <code className="bg-gray-100 px-1 rounded">{`{{name}}`}</code> <code className="bg-gray-100 px-1 rounded">{`{{order_id}}`}</code> <code className="bg-gray-100 px-1 rounded">{`{{total}}`}</code></p>
                    </div>
                    {[
                      { key: 'template_order_confirmed', label: 'Order Confirmed' },
                      { key: 'template_order_shipped', label: 'Order Shipped' },
                      { key: 'template_order_ready', label: 'Ready for Collection' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                        <textarea value={(waConfig as any)[key]} onChange={(e) => setWaConfig({ ...waConfig, [key]: e.target.value })}
                          rows={2} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white resize-none" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={saveIntegrations} disabled={integSaving} className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium disabled:opacity-50">
                {integSaving ? 'Saving...' : 'Save WhatsApp Settings'}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
