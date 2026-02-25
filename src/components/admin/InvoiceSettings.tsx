'use client'

import { useState, useRef } from 'react'
import { useAdminStore } from '@/store/admin'
import { Image as ImageIcon, Upload, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const LOGO_POSITIONS = ['left', 'center', 'right'] as const
const INVOICE_THEMES = ['professional', 'modern', 'minimal', 'bold'] as const

type LogoPosition = typeof LOGO_POSITIONS[number]
type InvoiceTheme = typeof INVOICE_THEMES[number]

export default function InvoiceSettings() {
  const { settings, updateSettings } = useAdminStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [invoiceSettings, setInvoiceSettings] = useState({
    logoUrl: settings.invoiceLogo || '',
    logoPosition: (settings.invoiceLogoPosition as LogoPosition) || 'left',
    theme: (settings.invoiceTheme as InvoiceTheme) || 'professional',
    showVAT: settings.invoiceShowVAT ?? true,
    showTaxNumber: settings.invoiceShowTaxNumber ?? true,
    taxNumber: settings.taxNumber || '',
    showBankDetails: settings.invoiceShowBankDetails ?? true,
    bankName: settings.bankName || '',
    accountNumber: settings.bankAccountNumber || '',
    branchCode: settings.bankBranchCode || '',
    footerText: settings.invoiceFooterText || 'Thank you for your business!',
    termsAndConditions: settings.invoiceTerms || '',
    showLineNumbers: settings.invoiceShowLineNumbers ?? false,
    currencySymbol: settings.currencySymbol || 'R',
    dateFormat: settings.invoiceDateFormat || 'en-ZA',
  })

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const logoUrl = event.target?.result as string
      setInvoiceSettings({ ...invoiceSettings, logoUrl })
      toast.success('Logo uploaded')
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    updateSettings({
      invoiceLogo: invoiceSettings.logoUrl,
      invoiceLogoPosition: invoiceSettings.logoPosition,
      invoiceTheme: invoiceSettings.theme,
      invoiceShowVAT: invoiceSettings.showVAT,
      invoiceShowTaxNumber: invoiceSettings.showTaxNumber,
      taxNumber: invoiceSettings.taxNumber,
      invoiceShowBankDetails: invoiceSettings.showBankDetails,
      bankName: invoiceSettings.bankName,
      bankAccountNumber: invoiceSettings.accountNumber,
      bankBranchCode: invoiceSettings.branchCode,
      invoiceFooterText: invoiceSettings.footerText,
      invoiceTerms: invoiceSettings.termsAndConditions,
      invoiceShowLineNumbers: invoiceSettings.showLineNumbers,
      currencySymbol: invoiceSettings.currencySymbol,
      invoiceDateFormat: invoiceSettings.dateFormat,
    })
    toast.success('Invoice settings saved')
  }

  const themeColors = {
    professional: { primary: '#1e40af', secondary: '#3b82f6', accent: '#60a5fa' },
    modern: { primary: '#7c3aed', secondary: '#a78bfa', accent: '#c4b5fd' },
    minimal: { primary: '#374151', secondary: '#6b7280', accent: '#9ca3af' },
    bold: { primary: '#dc2626', secondary: '#ef4444', accent: '#f87171' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Settings</h2>
        <p className="text-gray-600">Customize how your invoices look and what information they display</p>
      </div>

      {/* Logo Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo & Branding</h3>
        
        <div className="space-y-4">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
            <div className="flex items-start gap-4">
              {invoiceSettings.logoUrl ? (
                <div className="relative">
                  <img
                    src={invoiceSettings.logoUrl}
                    alt="Logo"
                    className="h-24 w-auto border border-gray-300 rounded"
                  />
                  <button
                    onClick={() => setInvoiceSettings({ ...invoiceSettings, logoUrl: '' })}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="h-24 w-32 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4" />
                  Upload Logo
                </button>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 2MB. Recommended: 400x100px</p>
              </div>
            </div>
          </div>

          {/* Logo Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo Position</label>
            <div className="flex gap-2">
              {LOGO_POSITIONS.map((position) => (
                <button
                  key={position}
                  onClick={() => setInvoiceSettings({ ...invoiceSettings, logoPosition: position })}
                  className={`px-4 py-2 rounded-lg border-2 capitalize ${
                    invoiceSettings.logoPosition === position
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {position}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Theme</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {INVOICE_THEMES.map((theme) => (
                <button
                  key={theme}
                  onClick={() => setInvoiceSettings({ ...invoiceSettings, theme })}
                  className={`p-4 rounded-lg border-2 capitalize ${
                    invoiceSettings.theme === theme
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: themeColors[theme].primary }} />
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: themeColors[theme].secondary }} />
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: themeColors[theme].accent }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{theme}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Options</h3>
        
        <div className="space-y-4">
          {/* VAT Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Show VAT/Tax</label>
              <p className="text-xs text-gray-500">Display VAT breakdown on invoices</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={invoiceSettings.showVAT}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showVAT: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Tax Number */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Show Tax Number</label>
              <p className="text-xs text-gray-500">Display your VAT/Tax registration number</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={invoiceSettings.showTaxNumber}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showTaxNumber: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {invoiceSettings.showTaxNumber && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax/VAT Number</label>
              <input
                type="text"
                value={invoiceSettings.taxNumber}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, taxNumber: e.target.value })}
                placeholder="e.g., 4123456789"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          )}

          {/* Bank Details */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Show Bank Details</label>
              <p className="text-xs text-gray-500">Display payment banking information</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={invoiceSettings.showBankDetails}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showBankDetails: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {invoiceSettings.showBankDetails && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={invoiceSettings.bankName}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, bankName: e.target.value })}
                  placeholder="e.g., FNB"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={invoiceSettings.accountNumber}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, accountNumber: e.target.value })}
                  placeholder="62XXXXXXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                <input
                  type="text"
                  value={invoiceSettings.branchCode}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, branchCode: e.target.value })}
                  placeholder="250655"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>
          )}

          {/* Line Numbers */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Show Line Numbers</label>
              <p className="text-xs text-gray-500">Number each line item (1, 2, 3...)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={invoiceSettings.showLineNumbers}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showLineNumbers: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Content Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Content</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
            <input
              type="text"
              value={invoiceSettings.footerText}
              onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })}
              placeholder="Thank you for your business!"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
            <textarea
              value={invoiceSettings.termsAndConditions}
              onChange={(e) => setInvoiceSettings({ ...invoiceSettings, termsAndConditions: e.target.value })}
              rows={4}
              placeholder="Payment terms, return policy, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save className="h-5 w-5" />
          Save Settings
        </button>
      </div>
    </div>
  )
}
