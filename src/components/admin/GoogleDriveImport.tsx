'use client'

/**
 * Google Drive Product Import Component
 * 
 * Browse Drive folder and bulk import product images
 * Shows preview of files before importing
 */

import { useState } from 'react'
import { useTenant } from '@/contexts/TenantContext'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  thumbnailLink?: string
  webViewLink?: string
}

export function GoogleDriveImport() {
  const { tenant } = useTenant()
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [category, setCategory] = useState('uncategorized')

  async function handleBrowseFolder() {
    if (!tenant?.id) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(
        `/api/tenant/google-drive/import?tenant_id=${tenant.id}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to browse folder')
      }

      setFiles(data.files || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (!tenant?.id || files.length === 0) return

    if (!confirm(`Import ${files.length} images as products? You can edit details after import.`)) {
      return
    }

    setImporting(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/tenant/google-drive/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          category,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult(data)
      setFiles([]) // Clear file list after successful import
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Import Products from Drive
        </h3>
        <p className="text-sm text-gray-600">
          Browse your Google Drive folder and import product images
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          <p className="font-medium">✓ Import successful!</p>
          <p className="mt-1">
            Imported {result.imported} products. {result.errors && `${result.errors.length} errors.`}
          </p>
          {result.products && result.products.length > 0 && (
            <div className="mt-2">
              <p className="font-medium">New products:</p>
              <ul className="list-disc list-inside mt-1">
                {result.products.map((p: any) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center space-x-4">
        <button
          onClick={handleBrowseFolder}
          disabled={loading || !tenant}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Browse Drive Folder'}
        </button>

        {files.length > 0 && (
          <div className="flex items-center space-x-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="uncategorized">Uncategorized</option>
              <option value="surfboards">Surfboards</option>
              <option value="apparel">Apparel</option>
              <option value="accessories">Accessories</option>
              <option value="fishing-gear">Fishing Gear</option>
              <option value="jetboards">Jetboards</option>
              <option value="efoils">eFoils</option>
            </select>

            <button
              onClick={handleImport}
              disabled={importing}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {importing ? 'Importing...' : `Import ${files.length} Products`}
            </button>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-900">
          <h4 className="font-medium text-gray-900 mb-3">
            Found {files.length} image{files.length !== 1 ? 's' : ''}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {files.map((file) => (
              <div key={file.id} className="border border-gray-200 rounded-lg p-2 text-gray-900 bg-white">
                {file.thumbnailLink && (
                  <img
                    src={file.thumbnailLink}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <p className="text-xs text-gray-600 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 space-y-1">
        <p className="font-medium">How it works:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Click "Browse Drive Folder" to see images in your Drive</li>
          <li>Select a category for the imported products</li>
          <li>Click "Import" to create product records</li>
          <li>Edit product details (name, price, description) in Products page</li>
          <li>Mark products as "In Stock" when ready to sell</li>
        </ol>
      </div>
    </div>
  )
}
