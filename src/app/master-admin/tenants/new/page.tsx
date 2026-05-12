'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Palette, CreditCard, Cloud, Check, Loader2, Globe, Search, Package, AlertCircle } from 'lucide-react'
import { GATEWAY_INFO } from '@/lib/payments/factory'
import { STORAGE_PROVIDER_INFO } from '@/lib/cloud-storage/types'

type Step = 'basics' | 'scrape' | 'branding' | 'payments' | 'storage' | 'review'

interface ScrapeResult {
  platform: 'shopify' | 'woocommerce' | 'generic'
  brand: {
    name: string
    description: string
    logoUrl: string | null
    faviconUrl: string | null
    primaryColor: string | null
    themeColor: string | null
  }
  products: Array<{
    name: string
    description: string
    handle: string
    price: number | null
    images: string[]
    category: string | null
    tags: string[]
  }>
  productCount: number
  sourceUrl: string
}

export default function NewTenantPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('basics')
  const [saving, setSaving] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  // Scrape state
  const [scrapeUrl, setScrapeUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null)
  const [scrapeError, setScrapeError] = useState('')
  const [importProducts, setImportProducts] = useState(true)

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
      } catch {
        router.push('/master-admin/login')
      }
    }
    checkAuth()
  }, [router])

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    subdomain: '',
    customDomain: '',
    plan: 'basic' as 'basic' | 'pro' | 'enterprise',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    logoUrl: '',
    selectedGateway: '' as string,
    gatewayCredentials: {} as Record<string, string>,
    isSandbox: true,
    storageProvider: '' as 'google_drive' | 'onedrive' | '',
    storageCredentials: {} as Record<string, string>,
  })

  const steps: { key: Step; label: string; icon: any }[] = [
    { key: 'basics',   label: 'Basic Info',  icon: Building2 },
    { key: 'scrape',   label: 'Import Site', icon: Globe },
    { key: 'branding', label: 'Branding',    icon: Palette },
    { key: 'payments', label: 'Payments',    icon: CreditCard },
    { key: 'storage',  label: 'Storage',     icon: Cloud },
    { key: 'review',   label: 'Review',      icon: Check },
  ]

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return
    setScraping(true)
    setScrapeError('')
    setScrapeResult(null)

    try {
      const res = await fetch('/api/master-admin/onboard-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl }),
      })
      const data = await res.json()

      if (!res.ok) {
        setScrapeError(data.error || 'Scrape failed')
        return
      }

      setScrapeResult(data)

      // Pre-fill branding from scraped data
      if (data.brand.primaryColor) updateField('primaryColor', data.brand.primaryColor)
      if (data.brand.logoUrl) updateField('logoUrl', data.brand.logoUrl)
      if (data.brand.name && !formData.name) updateField('name', data.brand.name)
    } catch (err: any) {
      setScrapeError(err.message || 'Network error')
    } finally {
      setScraping(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/master-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          paymentGateways: formData.selectedGateway ? [{
            code: formData.selectedGateway,
            credentials: formData.gatewayCredentials,
            isDefault: true,
            isSandbox: formData.isSandbox,
          }] : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create tenant')

      const tenantId = data.tenant.id

      // Import scraped products if user opted in
      if (importProducts && scrapeResult && scrapeResult.products.length > 0) {
        await fetch('/api/master-admin/tenants/' + tenantId + '/import-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: scrapeResult.products }),
        })
      }

      router.push('/master-admin')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const platformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      shopify: 'bg-green-100 text-green-800',
      woocommerce: 'bg-purple-100 text-purple-800',
      generic: 'bg-gray-100 text-gray-700',
    }
    return colors[platform] || colors.generic
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                <input type="text" value={formData.name} onChange={e => updateField('name', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Kelp Boards SA" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
                <input type="text" value={formData.slug} onChange={e => updateField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="kelp-boards" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="info@kelpboards.co.za" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+27 21 123 4567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
                <div className="flex">
                  <input type="text" value={formData.subdomain} onChange={e => updateField('subdomain', e.target.value.toLowerCase())}
                    className="flex-1 px-4 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-500" placeholder="kelp" />
                  <span className="px-4 py-2 bg-gray-100 border border-l-0 rounded-r-lg text-gray-500">.yoursaas.com</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain (optional)</label>
                <input type="text" value={formData.customDomain} onChange={e => updateField('customDomain', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="www.kelpboards.co.za" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select value={formData.plan} onChange={e => updateField('plan', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 'scrape':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Enter the client's existing website URL. We'll automatically detect their platform, pull products, and extract brand colours and logo to pre-fill the next steps.
              </p>
            </div>

            <div className="flex gap-3">
              <input
                type="url"
                value={scrapeUrl}
                onChange={e => setScrapeUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScrape()}
                className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="https://www.kelpboards.co.za"
              />
              <button
                onClick={handleScrape}
                disabled={scraping || !scrapeUrl.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {scraping ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</>
                ) : (
                  <><Search className="w-4 h-4" /> Scan Website</>
                )}
              </button>
            </div>

            {scrapeError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Could not scrape website</p>
                  <p className="text-sm text-red-700 mt-1">{scrapeError}</p>
                  <p className="text-xs text-red-600 mt-2">You can skip this step and enter details manually.</p>
                </div>
              </div>
            )}

            {scrapeResult && (
              <div className="space-y-4">
                {/* Platform badge */}
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${platformBadge(scrapeResult.platform)}`}>
                    {scrapeResult.platform.charAt(0).toUpperCase() + scrapeResult.platform.slice(1)} detected
                  </span>
                  <span className="text-sm text-gray-500">{scrapeResult.sourceUrl}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Brand preview */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Brand Detected</h4>
                    <div className="flex items-center gap-3 mb-3">
                      {scrapeResult.brand.logoUrl && (
                        <img src={scrapeResult.brand.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded border" />
                      )}
                      <div>
                        <p className="font-medium">{scrapeResult.brand.name || '—'}</p>
                        {scrapeResult.brand.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{scrapeResult.brand.description}</p>
                        )}
                      </div>
                    </div>
                    {scrapeResult.brand.primaryColor && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: scrapeResult.brand.primaryColor }} />
                        <span className="text-sm text-gray-600">Primary colour pre-filled</span>
                      </div>
                    )}
                  </div>

                  {/* Products count */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">Products Found</h4>
                    <div className="flex items-center gap-3 mb-3">
                      <Package className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{scrapeResult.productCount}</p>
                        <p className="text-sm text-gray-500">products ready to import</p>
                      </div>
                    </div>
                    {scrapeResult.productCount > 0 && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importProducts}
                          onChange={e => setImportProducts(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Import all products when store is created</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Product list preview */}
                {scrapeResult.products.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Product preview (first 5):</p>
                    <div className="space-y-2">
                      {scrapeResult.products.slice(0, 5).map((p, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white rounded p-2 border">
                          {p.images[0] && (
                            <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            {p.category && <p className="text-xs text-gray-500">{p.category}</p>}
                          </div>
                          {p.price != null && (
                            <p className="text-sm font-medium text-gray-900 whitespace-nowrap">R{p.price.toFixed(2)}</p>
                          )}
                        </div>
                      ))}
                      {scrapeResult.products.length > 5 && (
                        <p className="text-xs text-gray-500 text-center">+{scrapeResult.products.length - 5} more products</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-gray-400">This step is optional — click Next to skip and configure manually.</p>
          </div>
        )

      case 'branding':
        return (
          <div className="space-y-6">
            {scrapeResult?.brand.primaryColor && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                Brand colours and logo were pre-filled from the scanned website. Adjust if needed.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={formData.primaryColor} onChange={e => updateField('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer" />
                  <input type="text" value={formData.primaryColor} onChange={e => updateField('primaryColor', e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={formData.secondaryColor} onChange={e => updateField('secondaryColor', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer" />
                  <input type="text" value={formData.secondaryColor} onChange={e => updateField('secondaryColor', e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={formData.accentColor} onChange={e => updateField('accentColor', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer" />
                  <input type="text" value={formData.accentColor} onChange={e => updateField('accentColor', e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input type="url" value={formData.logoUrl} onChange={e => updateField('logoUrl', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
            </div>
            <div className="p-6 rounded-lg border-2 border-dashed" style={{ borderColor: formData.primaryColor }}>
              <div className="flex items-center gap-4">
                {formData.logoUrl && <img src={formData.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />}
                <div>
                  <h3 className="text-xl font-bold" style={{ color: formData.primaryColor }}>{formData.name || 'Store Name'}</h3>
                  <p className="text-sm" style={{ color: formData.secondaryColor }}>Preview of your store branding</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'payments':
        return (
          <div className="space-y-6">
            <p className="text-gray-600">Select a payment gateway and enter the client's credentials. You can add more gateways later.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(GATEWAY_INFO).map(([code, info]) => (
                <button key={code} onClick={() => updateField('selectedGateway', code)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${formData.selectedGateway === code ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <h4 className="font-semibold">{info.name}</h4>
                  <p className="text-sm text-gray-500">{info.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{info.currencies.join(', ')}</p>
                </button>
              ))}
            </div>
            {formData.selectedGateway && (
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h4 className="font-semibold">{GATEWAY_INFO[formData.selectedGateway as keyof typeof GATEWAY_INFO]?.name} Credentials</h4>
                {GATEWAY_INFO[formData.selectedGateway as keyof typeof GATEWAY_INFO]?.requiredFields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input type={field.type} value={formData.gatewayCredentials[field.key] || ''}
                      onChange={e => updateField('gatewayCredentials', { ...formData.gatewayCredentials, [field.key]: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isSandbox} onChange={e => updateField('isSandbox', e.target.checked)} />
                  <span className="text-sm">Sandbox/Test Mode</span>
                </label>
              </div>
            )}
          </div>
        )

      case 'storage':
        return (
          <div className="space-y-6">
            <p className="text-gray-600">Connect the client's cloud storage for their media files. They own their data.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(STORAGE_PROVIDER_INFO).map(([code, info]) => (
                <button key={code} onClick={() => updateField('storageProvider', code)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${formData.storageProvider === code ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <h4 className="font-semibold">{info.name}</h4>
                  <p className="text-sm text-gray-500">{info.description}</p>
                </button>
              ))}
            </div>
            {formData.storageProvider && (
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h4 className="font-semibold">{STORAGE_PROVIDER_INFO[formData.storageProvider]?.name} Credentials</h4>
                {STORAGE_PROVIDER_INFO[formData.storageProvider]?.requiredFields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input type={field.type} value={formData.storageCredentials[field.key] || ''}
                      onChange={e => updateField('storageCredentials', { ...formData.storageCredentials, [field.key]: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                    {field.help && <p className="text-xs text-gray-500 mt-1">{field.help}</p>}
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-500">You can skip this step and configure storage later.</p>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800">Ready to create store!</h4>
              <p className="text-sm text-green-700">Review the details below and click "Create Store" to finish.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-4">
                <h5 className="font-semibold mb-2">Basic Info</h5>
                <dl className="text-sm space-y-1">
                  <div className="flex justify-between"><dt className="text-gray-500">Name:</dt><dd>{formData.name}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Email:</dt><dd>{formData.email}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Domain:</dt><dd>{formData.customDomain || `${formData.subdomain}.yoursaas.com`}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Plan:</dt><dd className="capitalize">{formData.plan}</dd></div>
                </dl>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <h5 className="font-semibold mb-2">Integrations</h5>
                <dl className="text-sm space-y-1">
                  <div className="flex justify-between"><dt className="text-gray-500">Payment:</dt><dd>{formData.selectedGateway ? GATEWAY_INFO[formData.selectedGateway as keyof typeof GATEWAY_INFO]?.name : 'Not configured'}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Storage:</dt><dd>{formData.storageProvider ? STORAGE_PROVIDER_INFO[formData.storageProvider]?.name : 'Not configured'}</dd></div>
                </dl>
              </div>
              {scrapeResult && (
                <div className="bg-white border rounded-lg p-4 md:col-span-2">
                  <h5 className="font-semibold mb-2">Scraped Import</h5>
                  <dl className="text-sm space-y-1">
                    <div className="flex justify-between"><dt className="text-gray-500">Source:</dt><dd className="truncate max-w-xs">{scrapeResult.sourceUrl}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Platform:</dt><dd className="capitalize">{scrapeResult.platform}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Products:</dt><dd>{importProducts ? `${scrapeResult.productCount} will be imported` : 'Skipped'}</dd></div>
                  </dl>
                </div>
              )}
            </div>
          </div>
        )
    }
  }

  const stepIndex = steps.findIndex(s => s.key === currentStep)
  const canGoBack = stepIndex > 0

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/master-admin" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add New Client</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="flex justify-between mb-8">
          {steps.map((step, i) => (
            <div key={step.key} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${i <= stepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <step.icon className="w-5 h-5" />
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-1 mx-2 ${i < stepIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step label */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Step {stepIndex + 1} of {steps.length}</p>
          <h2 className="text-xl font-semibold text-gray-900">{steps[stepIndex].label}</h2>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button onClick={() => setCurrentStep(steps[stepIndex - 1]?.key)} disabled={!canGoBack}
            className="px-6 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            Back
          </button>
          {currentStep === 'review' ? (
            <button onClick={handleSubmit} disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Store'}
            </button>
          ) : (
            <button onClick={() => setCurrentStep(steps[stepIndex + 1]?.key)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Next
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
