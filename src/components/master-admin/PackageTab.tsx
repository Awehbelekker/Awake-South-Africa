'use client'

interface PackageTabProps {
  currentPackage: 'basic' | 'pro' | 'enterprise' | 'custom'
  features: any
  limits: any
  onUpdatePackage: (pkg: 'basic' | 'pro' | 'enterprise') => void
}

export default function PackageTab({ currentPackage, features, limits, onUpdatePackage }: PackageTabProps) {
  const packages = [
    {
      id: 'basic',
      name: 'Basic',
      price: 'R499/month',
      description: 'Perfect for small businesses getting started',
      features: [
        'Google OAuth only',
        'AI Product Generation (50k tokens/month)',
        'OCR Invoice Scanning',
        'Barcode Generation',
        'Basic Analytics',
        'Up to 100 products',
        'Up to 500 orders/month',
        '5GB storage',
        '2 users'
      ]
    },
    {
      id: 'pro',
      name: 'Professional',
      price: 'R999/month',
      description: 'For growing businesses with advanced needs',
      features: [
        'Google + Microsoft OAuth',
        'AI Product Generation + Image Analysis (200k tokens/month)',
        'OCR + Auto Payments',
        'Barcode + Calendar Integration',
        'Advanced Analytics',
        'Multi-Currency Support',
        'Up to 1,000 products',
        'Up to 5,000 orders/month',
        '20GB storage',
        '10 users'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'R2,499/month',
      description: 'Unlimited features for large organizations',
      features: [
        'All OAuth Providers',
        'Unlimited AI (1M tokens/month)',
        'Full Automation Suite',
        'All Features Enabled',
        'Priority Support',
        'Unlimited products',
        'Unlimited orders',
        'Unlimited storage',
        'Unlimited users'
      ]
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Package Selection</h2>
        <p className="text-gray-600">
          Choose the package tier for this tenant. Features and limits will be automatically applied.
        </p>
      </div>

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`
              border-2 rounded-lg p-6 cursor-pointer transition-all
              ${currentPackage === pkg.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
              }
            `}
            onClick={() => {
              if (currentPackage !== pkg.id) {
                if (confirm(`Switch to ${pkg.name} package?`)) {
                  onUpdatePackage(pkg.id as any)
                }
              }
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
              {currentPackage === pkg.id && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  CURRENT
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-blue-600 mb-2">{pkg.price}</p>
            <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
            <ul className="space-y-2">
              {pkg.features.map((feature, idx) => (
                <li key={idx} className="flex items-start text-sm">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Current Features */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Current Features & Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Features */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Enabled Features</h4>
            <div className="space-y-2">
              <FeatureRow label="Google OAuth" enabled={features?.oauth?.google} />
              <FeatureRow label="Microsoft OAuth" enabled={features?.oauth?.microsoft} />
              <FeatureRow label="AI Product Generation" enabled={features?.ai?.productGeneration} />
              <FeatureRow label="AI Image Analysis" enabled={features?.ai?.imageAnalysis} />
              <FeatureRow label="OCR Scanning" enabled={features?.automation?.ocrScanning} />
              <FeatureRow label="Auto Payments" enabled={features?.automation?.autoPayments} />
              <FeatureRow label="Barcode System" enabled={features?.features?.barcode} />
              <FeatureRow label="Calendar Integration" enabled={features?.features?.calendar} />
              <FeatureRow label="Multi-Currency" enabled={features?.features?.multiCurrency} />
            </div>
          </div>

          {/* Limits */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Usage Limits</h4>
            <div className="space-y-2">
              <LimitRow label="Products" limit={limits?.products} />
              <LimitRow label="Orders/month" limit={limits?.orders} />
              <LimitRow label="Storage" limit={formatBytes(limits?.storage)} />
              <LimitRow label="Users" limit={limits?.users} />
              <LimitRow label="API Calls/month" limit={limits?.apiCalls} />
              <LimitRow label="AI Tokens/month" limit={features?.ai?.monthlyTokens} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
      <span className="text-sm text-gray-700">{label}</span>
      {enabled ? (
        <span className="text-green-600 font-semibold text-sm">✓ Enabled</span>
      ) : (
        <span className="text-gray-400 text-sm">✗ Disabled</span>
      )}
    </div>
  )
}

function LimitRow({ label, limit }: { label: string; limit: number | string }) {
  const displayLimit = limit === -1 || limit === '-1' ? 'Unlimited' : limit
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
      <span className="text-sm text-gray-700">{label}</span>
      <span className="text-blue-600 font-semibold text-sm">{displayLimit}</span>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === -1) return 'Unlimited'
  const gb = bytes / (1024 * 1024 * 1024)
  return `${gb.toFixed(0)}GB`
}

