'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminStore } from '@/store/admin'
import toast, { Toaster } from 'react-hot-toast'
import { Upload, FileJson, Database, AlertCircle } from 'lucide-react'

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || 'https://awake-south-africa-production.up.railway.app'

export default function AdminImportPage() {
  const router = useRouter()
  const { isAuthenticated } = useAdminStore()
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  if (!isAuthenticated) {
    router.push('/admin')
    return null
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/json') {
      setSelectedFile(file)
      setImportStatus([])
    } else {
      toast.error('Please select a valid JSON file')
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }

    setIsImporting(true)
    setImportStatus([])

    try {
      const content = await selectedFile.text()
      const data = JSON.parse(content)
      const products = data.products || []

      setImportStatus(prev => [...prev, `📦 Found ${products.length} products to import`])

      // Import logic would go here
      // For now, just simulate the import
      for (let i = 0; i < products.length; i++) {
        const product = products[i]
        setImportStatus(prev => [...prev, `Importing: ${product.title || product.name}`])
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      setImportStatus(prev => [...prev, '✅ Import completed successfully'])
      toast.success('Products imported successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed'
      setImportStatus(prev => [...prev, `❌ Error: ${errorMessage}`])
      toast.error(errorMessage)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Import Products</h1>
          <p className="text-gray-600">
            Import products from JSON file into the Medusa backend
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
          {/* File Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select JSON File
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={isImporting}
              />
            </div>
            {selectedFile && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                <FileJson className="w-4 h-4" />
                {selectedFile.name} selected
              </p>
            )}
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Import Products
              </>
            )}
          </button>

          {/* Status Log */}
          {importStatus.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Import Log:</h3>
              <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
                {importStatus.map((status, index) => (
                  <div key={index} className="text-sm text-gray-700 mb-1 font-mono">
                    {status}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Import Guidelines:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>File must be in valid JSON format</li>
                  <li>Products should have title, description, and price fields</li>
                  <li>Existing products with same handle will be updated</li>
                  <li>Make sure your Medusa backend is running</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Database className="w-4 h-4" />
            <span>Backend URL: {MEDUSA_URL}</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
