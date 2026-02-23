'use client'

/**
 * Google Drive Picker Modal
 * 
 * Reusable modal for selecting files from Google Drive
 * Uses unified OAuth system - "connect once, use everywhere"
 */

import { useState, useEffect } from 'react'
import { useGoogleDrive } from '@/hooks/useGoogleDrive'
import { 
  X,
  Folder, 
  Image as ImageIcon, 
  ChevronRight, 
  Home,
  Loader2,
  AlertCircle,
  Check
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

interface GoogleDrivePickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (files: DriveFile[]) => void
  multiSelect?: boolean
  title?: string
}

export default function GoogleDrivePicker({
  isOpen,
  onClose,
  onSelect,
  multiSelect = true,
  title = 'Select from Google Drive'
}: GoogleDrivePickerProps) {
  const { isConnected, checking, connect, browseFolder } = useGoogleDrive()
  const [currentFolder, setCurrentFolder] = useState('root')
  const [folderPath, setFolderPath] = useState<BreadcrumbItem[]>([])
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [files, setFiles] = useState<DriveFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load folder when it changes
  useEffect(() => {
    if (isOpen && isConnected && currentFolder) {
      loadFolder(currentFolder)
    }
  }, [isOpen, isConnected, currentFolder])

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentFolder('root')
      setSelectedFiles(new Set())
      setError(null)
    }
  }, [isOpen])

  async function loadFolder(folderId: string) {
    setLoading(true)
    setError(null)

    try {
      const result = await browseFolder(folderId)
      setFolderPath(result.folderPath)
      setFolders(result.folders)
      setFiles(result.files)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleFileSelection(fileId: string) {
    if (!multiSelect) {
      // Single select - replace selection
      setSelectedFiles(new Set([fileId]))
    } else {
      // Multi select - toggle
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
  }

  function handleSelect() {
    const selected = files.filter(f => selectedFiles.has(f.id))
    onSelect(selected)
    onClose()
  }

  function handleConnect() {
    connect()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {checking ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Checking connection...</span>
            </div>
          ) : !isConnected ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <ImageIcon className="w-16 h-16 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Connect Google Drive
              </h3>
              <p className="text-gray-600 mb-6">
                Connect your Google Drive to browse and select images
              </p>
              <button
                onClick={handleConnect}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Connect Google Drive
              </button>
            </div>
          ) : (
            <>
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 mb-4 text-sm">
                <button
                  onClick={() => setCurrentFolder('root')}
                  className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded transition"
                >
                  <Home className="w-4 h-4" />
                  <span className="text-gray-700">My Drive</span>
                </button>

                {currentFolder === 'root' && (
                  <button
                    onClick={() => setCurrentFolder('shared')}
                    className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded transition ml-2"
                  >
                    <Folder className="w-4 h-4" />
                    <span className="text-gray-700">Shared with me</span>
                  </button>
                )}

                {folderPath.slice(1).map((folder) => (
                  <div key={folder.id} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <button
                      onClick={() => setCurrentFolder(folder.id)}
                      className="px-3 py-1.5 hover:bg-gray-100 rounded transition text-gray-700"
                    >
                      {folder.name}
                    </button>
                  </div>
                ))}
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Folders */}
                  {folders.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Folders</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {folders.map((folder) => (
                          <button
                            key={folder.id}
                            onClick={() => setCurrentFolder(folder.id)}
                            className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition text-left"
                          >
                            <Folder className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <span className="text-sm text-gray-900 truncate">{folder.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files */}
                  {files.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Images ({files.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {files.map((file) => {
                          const isSelected = selectedFiles.has(file.id)
                          return (
                            <button
                              key={file.id}
                              onClick={() => toggleFileSelection(file.id)}
                              className={`relative group border-2 rounded-lg overflow-hidden transition ${
                                isSelected
                                  ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {/* Image Preview */}
                              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                {file.thumbnailLink ? (
                                  <img
                                    src={file.thumbnailLink}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-12 h-12 text-gray-400" />
                                )}
                              </div>

                              {/* File Name */}
                              <div className="p-2 bg-white">
                                <p className="text-xs text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>

                              {/* Selection Indicator */}
                              {isSelected && (
                                <div className="absolute top-2 right-2 bg-blue-600 rounded-full p-1">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {folders.length === 0 && files.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">This folder is empty</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {isConnected && (
          <div className="border-t p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSelect}
                disabled={selectedFiles.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Select {selectedFiles.size > 0 && `(${selectedFiles.size})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
