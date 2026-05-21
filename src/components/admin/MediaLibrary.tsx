'use client'

/**
 * Media Library Component
 * 
 * Browse, upload, and select images from centralized media library
 * Images can be reused across multiple products
 */

import { useState, useEffect } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Loader2,
  Check,
  X,
  Search,
  Grid3x3,
  List,
  HardDrive,
  FolderOpen,
  ChevronRight,
  Download,
} from 'lucide-react'

interface MediaFile {
  id: string
  name: string
  path: string
  url: string
  size: number
  createdAt: string
  updatedAt: string
}

interface MediaLibraryProps {
  onSelect?: (urls: string[]) => void
  multiSelect?: boolean
  maxSelect?: number
}

interface DriveFile {
  id: string
  name: string
  mimeType: string
  thumbnailLink?: string
  size?: string
}
interface DriveFolder { id: string; name: string }

export function MediaLibrary({ onSelect, multiSelect = true, maxSelect = 10 }: MediaLibraryProps) {
  const { tenant, isLoading: tenantLoading } = useTenant()
  const [activeTab, setActiveTab] = useState<'library' | 'drive'>('library')

  // Library state
  const [files, setFiles] = useState<MediaFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Google Drive browser state
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null)
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveFolderPath, setDriveFolderPath] = useState<DriveFolder[]>([{ id: 'root', name: 'My Drive' }])
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([])
  const [driveImages, setDriveImages] = useState<DriveFile[]>([])
  const [driveSelected, setDriveSelected] = useState<Set<string>>(new Set())
  const [driveImporting, setDriveImporting] = useState(false)
  const [driveError, setDriveError] = useState<string | null>(null)

  useEffect(() => {
    if (tenant?.id && !tenantLoading) {
      loadMediaLibrary()
      checkDriveConnection()
    }
  }, [tenant?.id, tenantLoading])

  async function checkDriveConnection() {
    try {
      const res = await fetch(`/api/tenant/google-drive/status?tenant_id=${tenant?.id}`)
      const d = await res.json()
      setDriveConnected(d.connected || false)
    } catch {
      setDriveConnected(false)
    }
  }

  async function browseDrive(folderId = 'root', folderName = 'My Drive') {
    setDriveLoading(true)
    setDriveError(null)
    try {
      const res = await fetch(`/api/tenant/google-drive/browse?tenant_id=${tenant?.id}&folder_id=${folderId}`)
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to browse Drive')
      setDriveFolderPath(d.folderPath || [{ id: folderId, name: folderName }])
      setDriveFolders(d.folders || [])
      setDriveImages(d.files || [])
    } catch (e: any) {
      setDriveError(e.message)
    } finally {
      setDriveLoading(false)
    }
  }

  async function importFromDrive() {
    if (driveSelected.size === 0) return
    setDriveImporting(true)
    setDriveError(null)
    try {
      const res = await fetch('/api/tenant/google-drive/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenant?.id, file_ids: Array.from(driveSelected) }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Import failed')
      setSuccess(`${d.transferred} image${d.transferred !== 1 ? 's' : ''} imported to your library!`)
      setDriveSelected(new Set())
      setActiveTab('library')
      loadMediaLibrary()
    } catch (e: any) {
      setDriveError(e.message)
    } finally {
      setDriveImporting(false)
    }
  }

  async function loadMediaLibrary() {
    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Loading media library for tenant:', tenant?.id)
      
      const response = await fetch(
        `/api/media/library?tenant_id=${tenant?.id}`
      )
      const data = await response.json()

      console.log('📦 Media library API response:', {
        ok: response.ok,
        status: response.status,
        success: data.success,
        total: data.total,
        filesCount: data.files?.length,
        error: data.error,
        details: data.details,
      })

      if (!response.ok) {
        console.error('❌ Media library error:', data)
        throw new Error(data.error || data.details || 'Failed to load media library')
      }

      console.log('✅ Media library loaded:', data.total, 'files')
      if (data.files?.length > 0) {
        console.log('📸 Sample files:', data.files.slice(0, 3))
      }
      setFiles(data.files || [])
    } catch (err: any) {
      console.error('❌ Load media library error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(uploadFiles: FileList) {
    if (!uploadFiles.length) return

    setUploading(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(uploadFiles)) {
        const formData = new FormData()
        formData.append('tenant_id', tenant!.id)
        formData.append('file', file)
        formData.append('folder', 'media-library')

        const response = await fetch('/api/media/library', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed')
        }

        uploadedUrls.push(data.file.url)
      }

      setSuccess(`${uploadFiles.length} file(s) uploaded successfully!`)
      loadMediaLibrary()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(filePath: string) {
    if (!confirm('Delete this file? This cannot be undone.')) return

    try {
      const response = await fetch(
        `/api/media/library?tenant_id=${tenant?.id}&file_path=${encodeURIComponent(filePath)}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Delete failed')
      }

      setSuccess('File deleted successfully')
      loadMediaLibrary()
    } catch (err: any) {
      setError(err.message)
    }
  }

  function toggleFileSelection(url: string) {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(url)) {
        newSet.delete(url)
      } else {
        if (!multiSelect) {
          newSet.clear()
        }
        if (newSet.size < maxSelect) {
          newSet.add(url)
        }
      }
      return newSet
    })
  }

  function handleConfirmSelection() {
    if (onSelect) {
      onSelect(Array.from(selectedFiles))
    }
    setSelectedFiles(new Set())
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Wait for tenant to load
  if (!tenant) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading tenant data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'library' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <ImageIcon className="w-4 h-4" /> Library
        </button>
        <button
          onClick={() => { setActiveTab('drive'); if (driveConnected && driveImages.length === 0) browseDrive() }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'drive' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <HardDrive className="w-4 h-4" />
          Google Drive
          {driveConnected && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />}
        </button>
      </div>

      {/* ── GOOGLE DRIVE TAB ────────────────────────────────── */}
      {activeTab === 'drive' && (
        <div className="space-y-4">
          {driveConnected === false && (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <HardDrive className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium text-gray-700">Google Drive not connected</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">Connect your Drive in Settings to browse and import images.</p>
              <a href="/admin/settings" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                Go to Settings
              </a>
            </div>
          )}

          {driveConnected === true && (
            <>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 text-sm text-gray-600 flex-wrap">
                {driveFolderPath.map((crumb, i) => (
                  <span key={crumb.id} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
                    <button
                      onClick={() => browseDrive(crumb.id, crumb.name)}
                      className={i === driveFolderPath.length - 1 ? 'text-gray-900 font-medium' : 'hover:text-blue-600'}
                    >
                      {crumb.name}
                    </button>
                  </span>
                ))}
              </div>

              {driveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center justify-between">
                  {driveError}
                  <button onClick={() => setDriveError(null)}><X className="w-4 h-4" /></button>
                </div>
              )}

              {driveLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Folders */}
                  {driveFolders.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Folders</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {driveFolders.map(folder => (
                          <button
                            key={folder.id}
                            onClick={() => browseDrive(folder.id, folder.name)}
                            className="flex flex-col items-center gap-1 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
                          >
                            <FolderOpen className="w-8 h-8 text-yellow-500" />
                            <span className="text-xs text-gray-700 truncate w-full">{folder.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  {driveImages.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Images ({driveImages.length}) {driveSelected.size > 0 && `· ${driveSelected.size} selected`}
                        </p>
                        <div className="flex gap-2">
                          {driveSelected.size > 0 && (
                            <button
                              onClick={importFromDrive}
                              disabled={driveImporting}
                              className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                            >
                              {driveImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                              {driveImporting ? 'Importing…' : `Import ${driveSelected.size} to Library`}
                            </button>
                          )}
                          <button
                            onClick={() => setDriveSelected(new Set(driveImages.map(f => f.id)))}
                            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Select all
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {driveImages.map(img => (
                          <div
                            key={img.id}
                            onClick={() => setDriveSelected(prev => {
                              const s = new Set(prev)
                              s.has(img.id) ? s.delete(img.id) : s.add(img.id)
                              return s
                            })}
                            className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${driveSelected.has(img.id) ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-1' : 'border-gray-200 hover:border-blue-300'}`}
                          >
                            {img.thumbnailLink ? (
                              <img src={img.thumbnailLink} alt={img.name} className="w-full h-24 object-cover" />
                            ) : (
                              <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            {driveSelected.has(img.id) && (
                              <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                            <div className="p-1.5 bg-white">
                              <p className="text-xs text-gray-600 truncate">{img.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : driveFolders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">No images or folders found here.</div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── LIBRARY TAB ─────────────────────────────────────── */}
      {activeTab === 'library' && (<>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ImageIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Media Library</h2>
          <span className="text-sm text-gray-500">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Upload & Search */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search media files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          />
        </div>

        <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
          <Upload className="w-5 h-5" />
          <span>{uploading ? 'Uploading...' : 'Upload'}</span>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selection Info */}
      {selectedFiles.size > 0 && onSelect && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-900 font-medium">
            {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedFiles(new Set())}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
            <button
              onClick={handleConfirmSelection}
              className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
            >
              <Check className="w-4 h-4" />
              <span>Use Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Media Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">No media files yet</p>
          <p className="text-sm mt-1">Upload images to build your media library</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.path}
              className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                selectedFiles.has(file.url)
                  ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => onSelect && toggleFileSelection(file.url)}
            >
              <img
                src={file.url}
                alt={file.name}
                className="w-full h-32 object-cover"
              />
              {selectedFiles.has(file.url) && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(file.path)
                }}
                className="absolute top-2 left-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <div
              key={file.path}
              className={`flex items-center space-x-4 p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedFiles.has(file.url)
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => onSelect && toggleFileSelection(file.url)}
            >
              <img
                src={file.url}
                alt={file.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • 
                  {new Date(file.createdAt).toLocaleDateString()}
                </p>
              </div>
              {selectedFiles.has(file.url) && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(file.path)
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
      </>)}
    </div>
  )
}
