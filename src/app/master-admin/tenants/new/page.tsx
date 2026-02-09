'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Palette, CreditCard, Cloud, Check, Loader2 } from 'lucide-react'
import { GATEWAY_INFO } from '@/lib/payments/factory'
import { STORAGE_PROVIDER_INFO } from '@/lib/cloud-storage/types'

type Step = 'basics' | 'branding' | 'payments' | 'storage' | 'review'

export default function NewTenantPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('basics')
  const [saving, setSaving] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

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
      } catch (error) {
        router.push('/master-admin/login')
      }
    }

    checkAuth()
  }, [router])
  
  // Form state
  const [formData, setFormData] = useState({
    // Basics
    name: '',
    slug: '',
    email: '',
    phone: '',
    subdomain: '',
    customDomain: '',
    plan: 'basic' as 'basic' | 'pro' | 'enterprise',
    
    // Branding
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    logoUrl: '',
    
    // Payments
    selectedGateway: '' as string,
    gatewayCredentials: {} as Record<string, string>,
    isSandbox: true,
    
    // Storage
    storageProvider: '' as 'google_drive' | 'onedrive' | '',
    storageCredentials: {} as Record<string, string>,
  })

  const steps: { key: Step; label: string; icon: any }[] = [
    { key: 'basics', label: 'Basic Info', icon: Building2 },
    { key: 'branding', label: 'Branding', icon: Palette },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'storage', label: 'Storage', icon: Cloud },
    { key: 'review', label: 'Review', icon: Check },
  ]

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      // TODO: Call API to create tenant
      console.log('Creating tenant:', formData)
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
      router.push('/master-admin')
    } catch (error) {
      console.error('Failed to create tenant:', error)
    } finally {
      setSaving(false)
    }
  }

  // Show loading while checking auth
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
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

      case 'branding':
        return (
          <div className="space-y-6">
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
            {/* Preview */}
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
                    {field.help && <p className="text-xs text-gray-500 mt-1">{field.help}</p>}
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
            <p className="text-sm text-gray-500">💡 You can skip this step and configure storage later.</p>
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
            </div>
          </div>
        )
    }
  }

  const stepIndex = steps.findIndex(s => s.key === currentStep)
  const canGoNext = currentStep !== 'review'
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

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">{steps[stepIndex].label}</h2>
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
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Store'}
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

