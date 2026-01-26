'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAdminStore } from '@/store/admin'
import { useDemoLocationsStore, DemoLocation } from '@/store/demoLocations'
import { Pencil, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import GoogleDrivePicker from '@/components/admin/GoogleDrivePicker'

export default function AdminLocationsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAdminStore()
  const { locations, deleteLocation } = useDemoLocationsStore()
  const [mounted, setMounted] = useState(false)
  const [editingLocation, setEditingLocation] = useState<DemoLocation | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, router])

  if (!mounted || !isAuthenticated) {
    return null
  }

  const handleEdit = (location: DemoLocation) => {
    setEditingLocation(location)
    setShowEditModal(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteLocation(id)
      toast.success('Location deleted')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Demo Locations</h1>
          </div>
          <button
            onClick={() => {
              setEditingLocation({
                id: `location-${Date.now()}`,
                name: '',
                area: '',
                image: '',
                description: '',
                price: 1500,
                active: true,
              })
              setShowEditModal(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Locations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <div
              key={location.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="relative h-48">
                <Image
                  src={location.image || 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800'}
                  alt={location.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {!location.active && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    Inactive
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {location.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{location.area}</p>
                {location.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {location.description}
                  </p>
                )}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-blue-600">
                    R{location.price?.toLocaleString() || '1,500'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(location)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(location.id, location.name)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {locations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No demo locations yet. Add your first location!</p>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {showEditModal && editingLocation && (
        <LocationEditModal
          location={editingLocation}
          onClose={() => {
            setShowEditModal(false)
            setEditingLocation(null)
          }}
        />
      )}
    </div>
  )
}

// Location Edit Modal Component
function LocationEditModal({ 
  location, 
  onClose 
}: { 
  location: DemoLocation
  onClose: () => void 
}) {
  const { updateLocation, addLocation } = useDemoLocationsStore()
  const [formData, setFormData] = useState(location)
  const isNew = !location.name

  const handleSave = () => {
    if (!formData.name || !formData.area || !formData.image) {
      toast.error('Please fill in all required fields')
      return
    }

    if (isNew) {
      addLocation(formData)
      toast.success('Location added successfully!')
    } else {
      updateLocation(formData.id, formData)
      toast.success('Location updated successfully!')
    }
    onClose()
  }

  const handleDriveSelect = (files: Array<{ id: string; name: string; url: string; mimeType: string; thumbnailUrl?: string }>) => {
    if (files.length > 0) {
      const file = files[0]
      // Use the direct link or thumbnail
      const imageUrl = file.thumbnailUrl || file.url || `https://drive.google.com/uc?id=${file.id}`
      setFormData({ ...formData, image: imageUrl })
      toast.success('Image selected from Google Drive!')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {isNew ? 'Add New Location' : 'Edit Location'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="e.g., Langebaan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area *
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="e.g., West Coast"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image *
              </label>
              
              {/* Google Drive Picker Button */}
              <div className="mb-3">
                <GoogleDrivePicker
                  onSelect={handleDriveSelect}
                  accept="image"
                  multiSelect={false}
                  label="Select from Google Drive"
                />
              </div>

              {/* OR divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-sm text-gray-500">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* URL Input */}
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="https://example.com/image.jpg"
              />
              {formData.image && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="h-32 w-full object-cover rounded border border-gray-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={3}
                placeholder="Brief description of the location..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (ZAR)
              </label>
              <input
                type="number"
                value={formData.price || 1500}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Active (show on website)
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              {isNew ? 'Add Location' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
