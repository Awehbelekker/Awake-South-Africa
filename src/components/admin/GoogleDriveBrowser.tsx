'use client'

/**
 * Google Drive Browser & Transfer Component
 * 
 * Browse tenant's Google Drive folders
 * Select images and transfer to Supabase Storage
 * Optionally create product records
 */

import { useState, useEffect } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { 
  Folder, 
  Image as ImageIcon, 
  ChevronRight, 
  Home,
  Upload,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  thumbnailLink?: string
  webViewLink?: string
}

interface DriveFolder {
  id: string
  name: string
}

interface BreadcrumbItem {
  id: string
  name: string
}

export function GoogleDriveBrowser() {
  const { tenant } = useTenant()
  const [currentFolder, setCurrentFolder] = useState('root')
  const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([])
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createProducts, setCreateProducts] = useState(true)
  const [category, setCategory] = useState('uncategorized')

  useEffect(() => {
    if (tenant?.id) {
      loadFolder(currentFolder)
    }
  }, [tenant?.id, currentFolder])

  async function loadFolder(folderId: string) {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/tenant/google-drive/browse?tenant_id=${tenant?.id}&folder_id=${folderId}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load folder')
      }

      setFolderPath(data.folderPath || [])
      setFolders(data.folders || [])
      setFiles(data.files || [])
      setSelectedFiles(new Set())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleFileSelection(fileId: string) {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  function selectAll() {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)))
    }
  }

  async function handleTransfer() {
    if (selectedFiles.size === 0) return

    if (!confirm(
      `Transfer ${selectedFiles.size} image(s) to Supabase Storage?${
        createProducts ? '\n\nThis will also create product records.' : ''
      }`
    )) {
      return
    }

    setTransferring(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/tenant/google-drive/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant?.id,
          file_ids: Array.from(selectedFiles),
          create_products: createProducts,
          category,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Transfer failed')
      }

      setSuccess(data.message)
      setSelectedFiles(new Set())

      if (data.errors && data.errors.length > 0) {
        setError(`${data.errors.length} file(s) had errors. Check console for details.`)
        console.error('Transfer errors:', data.errors)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTransferring(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 pb-2 border-b">
        {folderPath.map((item, index) => (
          <div key={item.id} className="flex items-center">
            {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
            <button
              onClick={() => setCurrentFolder(item.id)}
              className="hover:text-blue-600 font-medium flex items-center"
            >
              {index === 0 && <Home className="w-4 h-4 mr-1" />}
              {item.name}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-start">
          <Check className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Folders */}
          {(folders.length > 0 || currentFolder === 'root') && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Folders</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {/* Show "Shared with me" at root level */}
                {currentFolder === 'root' && (
                  <button
                    onClick={() => setCurrentFolder('shared')}
                    className="flex items-center space-x-2 p-2 bg-white hover:bg-blue-50 rounded border border-gray-200 transition-colors text-left text-gray-900"
                  >
                    <Folder className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="text-sm truncate">Shared with me</span>
                  </button>
                )}
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setCurrentFolder(folder.id)}
                    className="flex items-center space-x-2 p-2 bg-white hover:bg-blue-50 rounded border border-gray-200 transition-colors text-left text-gray-900 bg-white"
                  >
                    <Folder className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm truncate">{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {files.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    {files.length} image{files.length !== 1 ? 's' : ''} found
                  </h3>
                  <button
                    onClick={selectAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                {selectedFiles.size > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedFiles.size} selected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => toggleFileSelection(file.id)}
                    className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                      selectedFiles.has(file.id)
                        ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {file.thumbnailLink ? (
                      <img
                        src={file.thumbnailLink}
                        alt={file.name}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {selectedFiles.has(file.id) && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <div className="p-2 bg-white">
                      <p className="text-xs text-gray-600 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transfer Options */}
              {selectedFiles.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={createProducts}
                        onChange={(e) => setCreateProducts(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Create product records
                      </span>
                    </label>

                    {createProducts && (
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      >
                        <option value="uncategorized">Uncategorized</option>
                        <option value="surfboards">Surfboards</option>
                        <option value="apparel">Apparel</option>
                        <option value="accessories">Accessories</option>
                        <option value="fishing-gear">Fishing Gear</option>
                        <option value="jetboards">Jetboards</option>
                        <option value="efoils">eFoils</option>
                      </select>
                    )}
                  </div>

                  <button
                    onClick={handleTransfer}
                    disabled={transferring}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {transferring ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Transferring to Supabase...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Transfer {selectedFiles.size} Image{selectedFiles.size !== 1 ? 's' : ''} to Supabase
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-600">
                    Images will be downloaded from Google Drive and uploaded to Supabase Storage.
                    {createProducts && ' Product records will be created automatically.'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No images found in this folder</p>
              <p className="text-sm mt-1">Navigate to a folder with images</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
