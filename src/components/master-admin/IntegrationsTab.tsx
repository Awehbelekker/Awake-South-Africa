'use client'

import { useState, useEffect } from 'react'
import { GATEWAY_INFO } from '@/lib/payments/factory'

// ─── Types ────────────────────────────────────────────────────────────────────

type GatewayCode = 'payfast' | 'yoco' | 'peach' | 'ikhokha' | 'stripe'

interface TenantGateway {
  id: string
  is_enabled: boolean
  is_default: boolean
  is_sandbox: boolean
  payment_gateways: { code: GatewayCode; name: string }
}

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'resend' | ''
  sender_name: string
  sender_email: string
  reply_to: string
  // SMTP
  smtp_host: string
  smtp_port: string
  smtp_secure: boolean
  smtp_user: string
  smtp_password: string
  // API-key providers
  api_key: string
}

export interface WhatsAppConfig {
  phone_number: string
  provider: 'none' | 'twilio' | 'meta' | ''
  // Twilio
  twilio_account_sid: string
  twilio_auth_token: string
  twilio_from_number: string
  // Meta Cloud API
  meta_phone_number_id: string
  meta_access_token: string
  meta_verify_token: string
  // Templates
  template_order_confirmed: string
  template_order_shipped: string
  template_order_ready: string
}

interface IntegrationsTabProps {
  tenantId: string
  emailConfig: EmailConfig | null
  whatsappConfig: WhatsAppConfig | null
  onEmailChange: (config: EmailConfig) => void
  onWhatsAppChange: (config: WhatsAppConfig) => void
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultEmail = (): EmailConfig => ({
  provider: '',
  sender_name: '',
  sender_email: '',
  reply_to: '',
  smtp_host: '',
  smtp_port: '587',
  smtp_secure: false,
  smtp_user: '',
  smtp_password: '',
  api_key: '',
})

const defaultWhatsApp = (): WhatsAppConfig => ({
  phone_number: '',
  provider: 'none',
  twilio_account_sid: '',
  twilio_auth_token: '',
  twilio_from_number: '',
  meta_phone_number_id: '',
  meta_access_token: '',
  meta_verify_token: '',
  template_order_confirmed: 'Hi {{name}}, your order {{order_id}} has been confirmed! Total: {{total}}. We\'ll be in touch soon.',
  template_order_shipped: 'Hi {{name}}, great news! Your order {{order_id}} is on its way. Track it here: {{tracking_url}}',
  template_order_ready: 'Hi {{name}}, your order {{order_id}} is ready for collection at our store.',
})

// ─── Gateway Card ─────────────────────────────────────────────────────────────

function GatewayCard({
  code,
  tenantGateway,
  onSave,
  saving,
}: {
  code: GatewayCode
  tenantGateway: TenantGateway | undefined
  onSave: (data: {
    gatewayCode: GatewayCode
    credentials: Record<string, string>
    isEnabled: boolean
    isDefault: boolean
    isSandbox: boolean
  }) => Promise<void>
  saving: boolean
}) {
  const info = GATEWAY_INFO[code]
  const [expanded, setExpanded] = useState(false)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [isEnabled, setIsEnabled] = useState(tenantGateway?.is_enabled ?? false)
  const [isDefault, setIsDefault] = useState(tenantGateway?.is_default ?? false)
  const [isSandbox, setIsSandbox] = useState(tenantGateway?.is_sandbox ?? true)
  const [showPasswords, setShowPasswords] = useState(false)

  const isConfigured = !!tenantGateway

  const handleSave = async () => {
    await onSave({ gatewayCode: code, credentials, isEnabled, isDefault, isSandbox })
    setExpanded(false)
  }

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${isConfigured ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{info.name}</span>
            {isConfigured && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tenantGateway.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {tenantGateway.is_enabled ? 'Active' : 'Disabled'}
              </span>
            )}
            {tenantGateway?.is_default && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Default</span>
            )}
            {tenantGateway?.is_sandbox && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Sandbox</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{info.description}</p>
          <p className="text-xs text-gray-400 mt-0.5">{info.currencies.join(' · ')}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 shrink-0"
        >
          {expanded ? 'Cancel' : isConfigured ? 'Edit' : 'Configure'}
        </button>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="border-t border-gray-200 bg-white p-4 space-y-4">
          {/* Credential fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Credentials</h4>
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {showPasswords ? 'Hide' : 'Show'} values
              </button>
            </div>
            {info.requiredFields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                <input
                  type={field.type === 'password' && !showPasswords ? 'password' : 'text'}
                  value={credentials[field.key] || ''}
                  onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                  placeholder={field.type === 'password' ? '••••••••' : `Enter ${field.label}`}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            ))}
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="rounded text-blue-600" />
              <span className="text-sm text-gray-700">Enabled</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="rounded text-blue-600" />
              <span className="text-sm text-gray-700">Default</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isSandbox} onChange={(e) => setIsSandbox(e.target.checked)} className="rounded text-yellow-600" />
              <span className="text-sm text-gray-700">Sandbox</span>
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Gateway'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function IntegrationsTab({
  tenantId,
  emailConfig,
  whatsappConfig,
  onEmailChange,
  onWhatsAppChange,
}: IntegrationsTabProps) {
  const [section, setSection] = useState<'payments' | 'email' | 'whatsapp'>('payments')
  const [gateways, setGateways] = useState<TenantGateway[]>([])
  const [loadingGateways, setLoadingGateways] = useState(true)
  const [savingGateway, setSavingGateway] = useState(false)
  const [gatewayMsg, setGatewayMsg] = useState('')

  const email = emailConfig ?? defaultEmail()
  const whatsapp = whatsappConfig ?? defaultWhatsApp()

  // ── Load gateways ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (section !== 'payments') return
    loadGateways()
  }, [section, tenantId])

  async function loadGateways() {
    setLoadingGateways(true)
    try {
      const res = await fetch(`/api/master-admin/tenants/${tenantId}/payment-gateways`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('master_admin_token')}` },
      })
      const data = await res.json()
      setGateways(data.gateways || [])
    } catch {
      setGateways([])
    } finally {
      setLoadingGateways(false)
    }
  }

  async function saveGateway(data: {
    gatewayCode: GatewayCode
    credentials: Record<string, string>
    isEnabled: boolean
    isDefault: boolean
    isSandbox: boolean
  }) {
    setSavingGateway(true)
    setGatewayMsg('')
    try {
      const res = await fetch(`/api/master-admin/tenants/${tenantId}/payment-gateways`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('master_admin_token')}`,
        },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setGatewayMsg(`${data.gatewayCode} saved successfully`)
      await loadGateways()
    } catch (e: any) {
      setGatewayMsg(`Error: ${e.message}`)
    } finally {
      setSavingGateway(false)
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const gatewayByCode = (code: GatewayCode) =>
    gateways.find((g) => g.payment_gateways?.code === code)

  // ── Render ─────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'payments', label: '💳 Payments' },
    { id: 'email', label: '📧 Email' },
    { id: 'whatsapp', label: '💬 WhatsApp' },
  ] as const

  return (
    <div>
      {/* Sub-nav */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSection(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              section === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PAYMENTS ────────────────────────────────────────────────────── */}
      {section === 'payments' && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Gateways</h3>
            <p className="text-sm text-gray-500 mt-1">Configure which payment providers this tenant can accept. Credentials are stored encrypted.</p>
          </div>

          {gatewayMsg && (
            <div className={`mb-4 px-4 py-3 rounded-md text-sm font-medium ${gatewayMsg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {gatewayMsg}
            </div>
          )}

          {loadingGateways ? (
            <p className="text-gray-500 text-sm">Loading gateways...</p>
          ) : (
            <div className="space-y-3">
              {(Object.keys(GATEWAY_INFO) as GatewayCode[]).map((code) => (
                <GatewayCard
                  key={code}
                  code={code}
                  tenantGateway={gatewayByCode(code)}
                  onSave={saveGateway}
                  saving={savingGateway}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EMAIL ───────────────────────────────────────────────────────── */}
      {section === 'email' && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Email Configuration</h3>
            <p className="text-sm text-gray-500 mt-1">Set up how this tenant sends transactional emails (invoices, order confirmations, etc.).</p>
          </div>

          {/* Sender */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Sender Identity</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sender Name</label>
                <input
                  value={email.sender_name}
                  onChange={(e) => onEmailChange({ ...email, sender_name: e.target.value })}
                  placeholder="Awake SA"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sender Email</label>
                <input
                  type="email"
                  value={email.sender_email}
                  onChange={(e) => onEmailChange({ ...email, sender_email: e.target.value })}
                  placeholder="orders@mystore.co.za"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reply-To Email</label>
              <input
                type="email"
                value={email.reply_to}
                onChange={(e) => onEmailChange({ ...email, reply_to: e.target.value })}
                placeholder="support@mystore.co.za"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Provider */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Email Provider</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'smtp', label: 'SMTP', desc: 'Any mail server' },
                { id: 'sendgrid', label: 'SendGrid', desc: 'Twilio SendGrid' },
                { id: 'resend', label: 'Resend', desc: 'Developer-first' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => onEmailChange({ ...email, provider: p.id as EmailConfig['provider'] })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    email.provider === p.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{p.label}</div>
                  <div className="text-xs text-gray-500">{p.desc}</div>
                </button>
              ))}
            </div>

            {email.provider === 'smtp' && (
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Host</label>
                    <input
                      value={email.smtp_host}
                      onChange={(e) => onEmailChange({ ...email, smtp_host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
                    <input
                      value={email.smtp_port}
                      onChange={(e) => onEmailChange({ ...email, smtp_port: e.target.value })}
                      placeholder="587"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={email.smtp_secure}
                    onChange={(e) => onEmailChange({ ...email, smtp_secure: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Use SSL/TLS (port 465)</span>
                </label>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Username</label>
                  <input
                    value={email.smtp_user}
                    onChange={(e) => onEmailChange({ ...email, smtp_user: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Password</label>
                  <input
                    type="password"
                    value={email.smtp_password}
                    onChange={(e) => onEmailChange({ ...email, smtp_password: e.target.value })}
                    placeholder="App password or SMTP password"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
              </div>
            )}

            {(email.provider === 'sendgrid' || email.provider === 'resend') && (
              <div className="pt-2 border-t border-gray-200">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {email.provider === 'sendgrid' ? 'SendGrid API Key' : 'Resend API Key'}
                </label>
                <input
                  type="password"
                  value={email.api_key}
                  onChange={(e) => onEmailChange({ ...email, api_key: e.target.value })}
                  placeholder={email.provider === 'sendgrid' ? 'SG.xxxxxxxx' : 're_xxxxxxxx'}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {email.provider === 'sendgrid'
                    ? 'Create at sendgrid.com → Settings → API Keys'
                    : 'Create at resend.com → API Keys'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── WHATSAPP ─────────────────────────────────────────────────────── */}
      {section === 'whatsapp' && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">WhatsApp Communication</h3>
            <p className="text-sm text-gray-500 mt-1">Configure WhatsApp for order notifications, customer support, and automated messages.</p>
          </div>

          {/* Phone number */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Business Phone Number</h4>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp Number (international format)</label>
              <input
                value={whatsapp.phone_number}
                onChange={(e) => onWhatsAppChange({ ...whatsapp, phone_number: e.target.value })}
                placeholder="+27821234567"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
              />
              <p className="text-xs text-gray-400 mt-1">Used for the chat link on the website. No provider needed for this.</p>
            </div>
          </div>

          {/* Provider */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">API Provider (for automated messages)</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'None', desc: 'Chat link only' },
                { id: 'twilio', label: 'Twilio', desc: 'WhatsApp Business' },
                { id: 'meta', label: 'Meta Cloud', desc: 'Official API' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => onWhatsAppChange({ ...whatsapp, provider: p.id as WhatsAppConfig['provider'] })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    whatsapp.provider === p.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{p.label}</div>
                  <div className="text-xs text-gray-500">{p.desc}</div>
                </button>
              ))}
            </div>

            {whatsapp.provider === 'twilio' && (
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Account SID</label>
                  <input
                    value={whatsapp.twilio_account_sid}
                    onChange={(e) => onWhatsAppChange({ ...whatsapp, twilio_account_sid: e.target.value })}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Auth Token</label>
                  <input
                    type="password"
                    value={whatsapp.twilio_auth_token}
                    onChange={(e) => onWhatsAppChange({ ...whatsapp, twilio_auth_token: e.target.value })}
                    placeholder="Your Twilio auth token"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From Number (WhatsApp Sandbox or Business)</label>
                  <input
                    value={whatsapp.twilio_from_number}
                    onChange={(e) => onWhatsAppChange({ ...whatsapp, twilio_from_number: e.target.value })}
                    placeholder="+14155238886"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
              </div>
            )}

            {whatsapp.provider === 'meta' && (
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number ID</label>
                  <input
                    value={whatsapp.meta_phone_number_id}
                    onChange={(e) => onWhatsAppChange({ ...whatsapp, meta_phone_number_id: e.target.value })}
                    placeholder="1234567890"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Permanent Access Token</label>
                  <input
                    type="password"
                    value={whatsapp.meta_access_token}
                    onChange={(e) => onWhatsAppChange({ ...whatsapp, meta_access_token: e.target.value })}
                    placeholder="EAAxxxxxxxx..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Webhook Verify Token</label>
                  <input
                    value={whatsapp.meta_verify_token}
                    onChange={(e) => onWhatsAppChange({ ...whatsapp, meta_verify_token: e.target.value })}
                    placeholder="any-secret-string-you-choose"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Add this webhook URL in Meta Developer Console:<br />
                    <code className="bg-gray-100 px-1 rounded text-gray-600">
                      https://yourdomain.com/api/webhooks/whatsapp
                    </code>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Message Templates */}
          {whatsapp.provider !== 'none' && whatsapp.provider !== '' && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700">Message Templates</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Variables: <code className="bg-gray-100 px-1 rounded">{`{{name}}`}</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">{`{{order_id}}`}</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">{`{{total}}`}</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">{`{{tracking_url}}`}</code>
                </p>
              </div>
              {[
                { key: 'template_order_confirmed', label: 'Order Confirmed' },
                { key: 'template_order_shipped', label: 'Order Shipped' },
                { key: 'template_order_ready', label: 'Ready for Collection' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <textarea
                    value={(whatsapp as any)[key]}
                    onChange={(e) => onWhatsAppChange({ ...whatsapp, [key]: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-900 bg-white resize-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
