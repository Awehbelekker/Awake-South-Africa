'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useProductsStore, MediaFile } from '@/store/products'
import GoogleDrivePicker from '@/components/admin/GoogleDrivePicker'
import {
  Search, Upload, Image as ImageIcon, Video, ExternalLink,
  Copy, Check, Trash2, FolderOpen, Plus, X, Link as LinkIcon, Cloud
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect width="200" height="150" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3ENo Preview%3C/text%3E%3C/svg%3E'

export default function AdminMediaPage() {
  const { products, updateProduct } = useProductsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMediaUrl, setNewMediaUrl] = useState('')
  const [newMediaName, setNewMediaName] = useState('')
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image')
  const [selectedProduct, setSelectedProduct] = useState('')

  // Collect all media from all products
  const allMedia = useMemo(() => {
    const mediaList: Array<MediaFile & { productName: string; productId: string }> = []

    products.forEach(product => {
      if (typeFilter === 'all' || typeFilter === 'image') {
        if (product.images) {
          product.images.forEach(img => {
            mediaList.push({ ...img, productName: product.name, productId: product.id })
          })
        }
        if (product.image) {
          mediaList.push({
            id: `legacy-${product.id}`,
            url: product.image,
            type: 'image',
            name: `${product.name} - Primary`,
            source: 'url',
            productName: product.name,
            productId: product.id,
          })
        }
      }
      if (typeFilter === 'all' || typeFilter === 'video') {
        if (product.videos) {
          product.videos.forEach(vid => {
            mediaList.push({ ...vid, productName: product.name, productId: product.id })
          })
        }
      }
    })
    return mediaList
  }, [products, typeFilter])

  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return allMedia
    const query = searchQuery.toLowerCase()
    return allMedia.filter(media =>
      media.productName.toLowerCase().includes(query) ||
      media.name?.toLowerCase().includes(query) ||
      media.url.toLowerCase().includes(query)
    )
  }, [allMedia, searchQuery])

  const stats = useMemo(() => ({
    total: allMedia.length,
    images: allMedia.filter(m => m.type === 'image').length,
    videos: allMedia.filter(m => m.type === 'video').length,
  }), [allMedia])

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('URL copied')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleAddMedia = () => {
    if (!newMediaUrl || !selectedProduct) {
      toast.error('Please fill in all required fields')
      return
    }
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    const newMedia: MediaFile = {
      id: `media-${Date.now()}`,
      url: newMediaUrl,
      type: newMediaType,
      name: newMediaName || 'Untitled',
      source: 'url',
    }

    if (newMediaType === 'image') {
      const images = product.images || []
      updateProduct(product.id, { images: [...images, newMedia] })
    } else {
      const videos = product.videos || []
      updateProduct(product.id, { videos: [...videos, newMedia] })
    }

    toast.success('Media added successfully')
    setShowAddModal(false)
    setNewMediaUrl('')
    setNewMediaName('')
    setSelectedProduct('')
  }

  const handleDeleteMedia = (media: MediaFile & { productId: string }) => {
    if (!confirm('Remove this media from the product?')) return
    const product = products.find(p => p.id === media.productId)
    if (!product) return

    if (media.type === 'image') {
      const images = (product.images || []).filter(i => i.id !== media.id)
      updateProduct(product.id, { images })
    } else {
      const videos = (product.videos || []).filter(v => v.id !== media.id)
      updateProduct(product.id, { videos })
    }
    toast.success('Media removed')
  }

  // Handle Google Drive selection
  const handleDriveSelect = (files: Array<{ id: string; name: string; url: string; mimeType: string; thumbnailUrl?: string }>) => {
    if (!selectedProduct) {
      toast.error('Please select a product first')
      return
    }
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    files.forEach(file => {
      const isVideo = file.mimeType.startsWith('video/')
      const newMedia: MediaFile = {
        id: `drive-${file.id}`,
        url: file.url,
        type: isVideo ? 'video' : 'image',
        name: file.name,
        source: 'drive',
        driveId: file.id,
        thumbnail: file.thumbnailUrl,
      }

      if (isVideo) {
        const videos = product.videos || []
        updateProduct(product.id, { videos: [...videos, newMedia] })
      } else {
        const images = product.images || []
        updateProduct(product.id, { images: [...images, newMedia] })
      }
    })

    toast.success(`${files.length} file(s) added from Google Drive`)
    setShowAddModal(false)
    setSelectedProduct('')
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (!selectedProduct) {
      toast.error('Please select a product first')
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max 5MB). Use Google Drive for larger files.`)
        continue
      }

      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')

      if (!isVideo && !isImage) {
        toast.error(`${file.name} is not a valid image or video file`)
        continue
      }

      // Convert to base64
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      const newMedia: MediaFile = {
        id: `upload-${Date.now()}-${i}`,
        url: base64,
        type: isVideo ? 'video' : 'image',
        name: file.name,
        source: 'upload',
      }

      if (isVideo) {
        const videos = product.videos || []
        updateProduct(product.id, { videos: [...videos, newMedia] })
      } else {
        const images = product.images || []
        updateProduct(product.id, { images: [...images, newMedia] })
      }
    }

    toast.success('Files uploaded successfully')
    setShowAddModal(false)
    setSelectedProduct('')
    e.target.value = ''
  }

  // Drag and drop handlers
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (!selectedProduct) {
      toast.error('Please select a product first')
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    const files = Array.from(e.dataTransfer.files)

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max 5MB)`)
        continue
      }

      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')

      if (!isVideo && !isImage) {
        toast.error(`${file.name} is not a valid file type`)
        continue
      }

      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      const newMedia: MediaFile = {
        id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: base64,
        type: isVideo ? 'video' : 'image',
        name: file.name,
        source: 'upload',
      }

      if (isVideo) {
        const videos = product.videos || []
        updateProduct(product.id, { videos: [...videos, newMedia] })
      } else {
        const images = product.images || []
        updateProduct(product.id, { images: [...images, newMedia] })
      }
    }

    toast.success(`${files.length} file(s) uploaded`)
    setShowAddModal(false)
    setSelectedProduct('')
  }, [selectedProduct, products, updateProduct])

  return (
    <AdminLayout title="Media Library">
      <Toaster position="top-right" />
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Media</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Images</div>
          <div className="text-2xl font-bold text-blue-600">{stats.images}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Videos</div>
          <div className="text-2xl font-bold text-purple-600">{stats.videos}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search media by name, product, or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'image' | 'video')}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" /> Add Media
          </button>
        </div>
      </div>

      {/* Media Grid */}
      <div className="bg-white rounded-lg shadow p-6">
        {filteredMedia.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMedia.map((media) => (
              <div
                key={`${media.productId}-${media.id}`}
                className="group relative border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={media.name || 'Image'}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      <Video className="w-10 h-10 text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500 truncate">{media.name || 'Video'}</p>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleCopyUrl(media.url, media.id)}
                    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    title="Copy URL"
                  >
                    {copiedId === media.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    title="View Original"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {!media.id.startsWith('legacy-') && (
                    <button
                      onClick={() => handleDeleteMedia(media)}
                      className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="p-2 bg-white border-t">
                  <p className="text-sm font-medium text-gray-900 truncate">{media.name || 'Untitled'}</p>
                  <p className="text-xs text-gray-500 truncate">{media.productName}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
            <p className="text-gray-500">Add images and videos to your products to see them here.</p>
          </div>
        )}
      </div>

      {/* Add Media Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add Media</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Step 1: Select Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">1. Select Product *</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <>
                  {/* Drag & Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Drag & drop files here</p>
                    <p className="text-sm text-gray-500 mb-4">or use the options below</p>

                    <div className="flex flex-wrap justify-center gap-3">
                      {/* File Upload Button */}
                      <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        Upload Files
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Google Drive Button */}
                      <GoogleDrivePicker
                        onSelect={handleDriveSelect}
                        multiSelect={true}
                        accept="all"
                        label="Google Drive"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Max file size: 5MB (use Google Drive for larger files)</p>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-sm text-gray-500">OR add by URL</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  {/* URL Input Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                      <select
                        value={newMediaType}
                        onChange={(e) => setNewMediaType(e.target.value as 'image' | 'video')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                      <input
                        type="url"
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
                      <input
                        type="text"
                        value={newMediaName}
                        onChange={(e) => setNewMediaName(e.target.value)}
                        placeholder="Display name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <button
                      onClick={handleAddMedia}
                      disabled={!newMediaUrl}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Add from URL
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => { setShowAddModal(false); setSelectedProduct(''); setNewMediaUrl(''); setNewMediaName(''); }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

