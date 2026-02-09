'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PackageTab from '@/components/master-admin/PackageTab'
import OAuthTab from '@/components/master-admin/OAuthTab'
import AITab from '@/components/master-admin/AITab'
import AutomationTab from '@/components/master-admin/AutomationTab'

interface TenantConfig {
  id: string
  name: string
  slug: string
  package: 'basic' | 'pro' | 'enterprise' | 'custom'
  package_features: any
  package_limits: any
  oauth_config: any
  ai_config: any
  automation_config: any
}

export default function TenantConfigurePage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<TenantConfig | null>(null)
  const [activeTab, setActiveTab] = useState<'package' | 'oauth' | 'ai' | 'automation'>('package')

  useEffect(() => {
    loadConfig()
  }, [tenantId])

  async function loadConfig() {
    try {
      const response = await fetch(`/api/master-admin/tenants/${tenantId}/config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('master_admin_token')}`
        }
      })
      const data = await response.json()
      setConfig(data.tenant)
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveConfig() {
    if (!config) return

    setSaving(true)
    try {
      const response = await fetch(`/api/master-admin/tenants/${tenantId}/config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('master_admin_token')}`
        },
        body: JSON.stringify({
          oauth_config: config.oauth_config,
          ai_config: config.ai_config,
          automation_config: config.automation_config
        })
      })

      if (response.ok) {
        alert('Configuration saved successfully!')
      } else {
        alert('Failed to save configuration')
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      alert('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  async function updatePackage(newPackage: 'basic' | 'pro' | 'enterprise') {
    setSaving(true)
    try {
      const response = await fetch(`/api/master-admin/tenants/${tenantId}/package`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('master_admin_token')}`
        },
        body: JSON.stringify({ package: newPackage })
      })

      if (response.ok) {
        alert('Package updated successfully!')
        loadConfig()
      } else {
        alert('Failed to update package')
      }
    } catch (error) {
      console.error('Failed to update package:', error)
      alert('Failed to update package')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading configuration...</div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">Failed to load tenant configuration</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => router.push('/master-admin/tenants')}
                className="text-blue-600 hover:text-blue-800 mb-2"
              >
                ← Back to Tenants
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Configure: {config.name}
              </h1>
              <p className="text-sm text-gray-600">
                Package: <span className="font-semibold capitalize">{config.package}</span>
              </p>
            </div>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'package', label: 'Package & Features' },
              { id: 'oauth', label: 'OAuth Settings' },
              { id: 'ai', label: 'AI Configuration' },
              { id: 'automation', label: 'Automation' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg p-6">
          {activeTab === 'package' && (
            <PackageTab
              currentPackage={config.package}
              features={config.package_features}
              limits={config.package_limits}
              onUpdatePackage={updatePackage}
            />
          )}

          {activeTab === 'oauth' && (
            <OAuthTab
              config={config.oauth_config}
              features={config.package_features}
              onChange={(newConfig) => setConfig({ ...config, oauth_config: newConfig })}
            />
          )}

          {activeTab === 'ai' && (
            <AITab
              config={config.ai_config}
              features={config.package_features}
              onChange={(newConfig) => setConfig({ ...config, ai_config: newConfig })}
            />
          )}

          {activeTab === 'automation' && (
            <AutomationTab
              config={config.automation_config}
              features={config.package_features}
              onChange={(newConfig) => setConfig({ ...config, automation_config: newConfig })}
            />
          )}
        </div>
      </div>
    </div>
  )
}

