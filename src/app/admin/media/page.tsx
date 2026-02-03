'use client'

import { useState, useMemo, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useProductsStore, MediaFile } from '@/store/products'
import { 
  Search, Upload, Image as ImageIcon, Video, ExternalLink, 
  Copy, Check, Trash2, FolderOpen, Plus, X, Link as LinkIcon
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add Media</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                <input
                  type="url"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newMediaName}
                  onChange={(e) => setNewMediaName(e.target.value)}
                  placeholder="Optional display name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={handleAddMedia}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Media
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

