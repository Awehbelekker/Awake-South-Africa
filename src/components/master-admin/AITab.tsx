'use client'

import { useState } from 'react'

interface AITabProps {
  config: any
  features: any
  onChange: (config: any) => void
}

export default function AITab({ config, features, onChange }: AITabProps) {
  const [aiConfig, setAiConfig] = useState(config || {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    businessTone: {
      style: 'professional',
      vibe: '',
      targetAudience: '',
      keywords: []
    },
    monthlyBudget: 5000,
    currentSpend: 0
  })

  const handleChange = (updates: any) => {
    const newConfig = { ...aiConfig, ...updates }
    setAiConfig(newConfig)
    onChange(newConfig)
  }

  const handleToneChange = (updates: any) => {
    const newTone = { ...aiConfig.businessTone, ...updates }
    handleChange({ businessTone: newTone })
  }

  const addKeyword = () => {
    const keyword = prompt('Enter keyword:')
    if (keyword) {
      const newKeywords = [...(aiConfig.businessTone.keywords || []), keyword]
      handleToneChange({ keywords: newKeywords })
    }
  }

  const removeKeyword = (index: number) => {
    const newKeywords = aiConfig.businessTone.keywords.filter((_: any, i: number) => i !== index)
    handleToneChange({ keywords: newKeywords })
  }

  return (
    <div className="space-y-8">
      {/* AI Provider */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">AI Provider Configuration</h3>

        {!features?.ai?.enabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ AI features are not available in the current package. Upgrade to Basic or higher.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              value={aiConfig.provider}
              onChange={(e) => handleChange({ provider: e.target.value })}
              disabled={!features?.ai?.enabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="openai">OpenAI</option>
              <option value="self-hosted">Self-Hosted (Coming Soon)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={aiConfig.apiKey}
              onChange={(e) => handleChange({ apiKey: e.target.value })}
              disabled={!features?.ai?.enabled}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              value={aiConfig.model}
              onChange={(e) => handleChange({ model: e.target.value })}
              disabled={!features?.ai?.enabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature (Creativity: {aiConfig.temperature})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={aiConfig.temperature}
              onChange={(e) => handleChange({ temperature: parseFloat(e.target.value) })}
              disabled={!features?.ai?.enabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
        </div>
      </div>

      {/* Business Tone */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Business Tone & Vibe</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure how AI generates product descriptions to match your brand personality
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Writing Style
            </label>
            <select
              value={aiConfig.businessTone.style}
              onChange={(e) => handleToneChange({ style: e.target.value })}
              disabled={!features?.ai?.productGeneration}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="luxury">Luxury</option>
              <option value="technical">Technical</option>
              <option value="friendly">Friendly</option>
              <option value="edgy">Edgy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Vibe
            </label>
            <textarea
              value={aiConfig.businessTone.vibe}
              onChange={(e) => handleToneChange({ vibe: e.target.value })}
              disabled={!features?.ai?.productGeneration}
              placeholder="e.g., 'Skateboarding culture, South African slang, youthful energy'"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience
            </label>
            <input
              type="text"
              value={aiConfig.businessTone.targetAudience}
              onChange={(e) => handleToneChange({ targetAudience: e.target.value })}
              disabled={!features?.ai?.productGeneration}
              placeholder="e.g., 'Young adults 18-35, action sports enthusiasts'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Keywords
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {aiConfig.businessTone.keywords?.map((keyword: string, index: number) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={addKeyword}
              disabled={!features?.ai?.productGeneration}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              + Add Keyword
            </button>
          </div>
        </div>
      </div>

      {/* Usage & Budget */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Usage & Budget</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Token Limit
            </label>
            <div className="text-2xl font-bold text-blue-600">
              {features?.ai?.monthlyTokens === -1 ? 'Unlimited' : features?.ai?.monthlyTokens?.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Based on package tier</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Budget (ZAR)
            </label>
            <input
              type="number"
              value={aiConfig.monthlyBudget}
              onChange={(e) => handleChange({ monthlyBudget: parseInt(e.target.value) })}
              disabled={!features?.ai?.enabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Month Spend
            </label>
            <div className="text-2xl font-bold text-gray-900">
              R{aiConfig.currentSpend?.toFixed(2) || '0.00'}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min((aiConfig.currentSpend / aiConfig.monthlyBudget) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

