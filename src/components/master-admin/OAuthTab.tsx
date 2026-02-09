'use client'

import { useState } from 'react'

interface OAuthTabProps {
  config: any
  features: any
  onChange: (config: any) => void
}

export default function OAuthTab({ config, features, onChange }: OAuthTabProps) {
  const [googleConfig, setGoogleConfig] = useState(config?.google || {
    enabled: false,
    clientId: '',
    clientSecret: '',
    scopes: ['drive.file', 'calendar']
  })

  const [microsoftConfig, setMicrosoftConfig] = useState(config?.microsoft || {
    enabled: false,
    clientId: '',
    clientSecret: '',
    tenantId: '',
    scopes: ['Files.ReadWrite', 'Calendars.ReadWrite']
  })

  const handleGoogleChange = (updates: any) => {
    const newConfig = { ...googleConfig, ...updates }
    setGoogleConfig(newConfig)
    onChange({ ...config, google: newConfig })
  }

  const handleMicrosoftChange = (updates: any) => {
    const newConfig = { ...microsoftConfig, ...updates }
    setMicrosoftConfig(newConfig)
    onChange({ ...config, microsoft: newConfig })
  }

  return (
    <div className="space-y-8">
      {/* Google OAuth */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Google OAuth</h3>
            <p className="text-sm text-gray-600">Configure Google Drive and Calendar integration</p>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={googleConfig.enabled}
              onChange={(e) => handleGoogleChange({ enabled: e.target.checked })}
              disabled={!features?.oauth?.google}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              {googleConfig.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        {!features?.oauth?.google && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Google OAuth is not available in the current package. Upgrade to Pro or Enterprise.
            </p>
          </div>
        )}

        {googleConfig.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client ID
              </label>
              <input
                type="text"
                value={googleConfig.clientId}
                onChange={(e) => handleGoogleChange({ clientId: e.target.value })}
                placeholder="123456-abc.apps.googleusercontent.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret
              </label>
              <input
                type="password"
                value={googleConfig.clientSecret}
                onChange={(e) => handleGoogleChange({ clientSecret: e.target.value })}
                placeholder="GOCSPX-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scopes
              </label>
              <div className="space-y-2">
                {['drive.file', 'drive', 'calendar', 'calendar.events'].map((scope) => (
                  <label key={scope} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={googleConfig.scopes?.includes(scope)}
                      onChange={(e) => {
                        const newScopes = e.target.checked
                          ? [...(googleConfig.scopes || []), scope]
                          : (googleConfig.scopes || []).filter((s: string) => s !== scope)
                        handleGoogleChange({ scopes: newScopes })
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{scope}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800 font-medium mb-1">Setup Instructions:</p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Go to Google Cloud Console</li>
                <li>Create OAuth 2.0 credentials</li>
                <li>Add redirect URI: <code className="bg-blue-100 px-1 rounded">https://yourdomain.com/api/auth/google/callback</code></li>
                <li>Copy Client ID and Secret above</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Microsoft OAuth */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Microsoft OAuth</h3>
            <p className="text-sm text-gray-600">Configure OneDrive and Microsoft Calendar integration</p>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={microsoftConfig.enabled}
              onChange={(e) => handleMicrosoftChange({ enabled: e.target.checked })}
              disabled={!features?.oauth?.microsoft}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              {microsoftConfig.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        {!features?.oauth?.microsoft && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Microsoft OAuth is not available in the current package. Upgrade to Pro or Enterprise.
            </p>
          </div>
        )}

        {microsoftConfig.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application (Client) ID
              </label>
              <input
                type="text"
                value={microsoftConfig.clientId}
                onChange={(e) => handleMicrosoftChange({ clientId: e.target.value })}
                placeholder="abc123-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret
              </label>
              <input
                type="password"
                value={microsoftConfig.clientSecret}
                onChange={(e) => handleMicrosoftChange({ clientSecret: e.target.value })}
                placeholder="xyz789~..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Directory (Tenant) ID
              </label>
              <input
                type="text"
                value={microsoftConfig.tenantId}
                onChange={(e) => handleMicrosoftChange({ tenantId: e.target.value })}
                placeholder="common or your-tenant-id"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800 font-medium mb-1">Setup Instructions:</p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Go to Azure Portal → App registrations</li>
                <li>Create new registration</li>
                <li>Add redirect URI: <code className="bg-blue-100 px-1 rounded">https://yourdomain.com/api/auth/microsoft/callback</code></li>
                <li>Create client secret</li>
                <li>Add API permissions: Files.ReadWrite, Calendars.ReadWrite</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

