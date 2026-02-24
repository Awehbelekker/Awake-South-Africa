'use client';

import React, { useState } from 'react';
import { X, Sparkles, Save, Image as ImageIcon } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import toast from 'react-hot-toast';
import MobilePhotoUpload from './MobilePhotoUpload';

interface QuickProductCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface QuickProductData {
  name: string;
  price: string;
  category: string;
  description: string;
  images: string[];
}

const CATEGORIES = [
  'eFoils',
  'Jetboards',
  'Accessories',
  'Batteries',
  'Parts',
  'Other',
];

export default function QuickProductCreate({
  isOpen,
  onClose,
  onSuccess,
}: QuickProductCreateProps) {
  const { tenant } = useTenant();
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<QuickProductData>({
    name: '',
    price: '',
    category: 'eFoils',
    description: '',
    images: [],
  });

  if (!isOpen) return null;

  const handlePhotoUploadSuccess = (urls: string[]) => {
    setFormData({ ...formData, images: [...formData.images, ...urls] });
    setShowPhotoUpload(false);
    toast.success(`${urls.length} photo(s) added`);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    if (formData.images.length === 0) {
      toast.error('At least one photo is required');
      return;
    }

    if (!tenant?.id) {
      toast.error('Tenant not found');
      return;
    }

    setSaving(true);

    try {
      // Create product via API
      const response = await fetch('/api/tenant/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          name: formData.name.trim(),
          slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: formData.description.trim() || `New ${formData.category}`,
          price: parseFloat(formData.price),
          currency: 'ZAR',
          category: formData.category,
          images: formData.images,
          thumbnail: formData.images[0],
          is_active: true,
          is_featured: false,
          in_stock: true,
          stock_quantity: 1,
          metadata: {
            quick_created: true,
            created_via: 'mobile',
            created_at: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }

      const result = await response.json();
      
      toast.success('Product created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        price: '',
        category: 'eFoils',
        description: '',
        images: [],
      });

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error: any) {
      console.error('Create product error:', error);
      toast.error(error.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    
    // Warn if there's unsaved data
    if (formData.name || formData.images.length > 0) {
      if (!confirm('Discard unsaved changes?')) {
        return;
      }
    }

    setFormData({
      name: '',
      price: '',
      category: 'eFoils',
      description: '',
      images: [],
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white md:bg-black md:bg-opacity-50 flex items-center justify-center overflow-hidden">
        {/* Mobile: Full screen, Desktop: Modal */}
        <div className="w-full h-full md:max-w-2xl md:max-h-[90vh] bg-white md:rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-white" />
              <h2 className="text-xl font-bold text-white">Quick Create Product</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              disabled={saving}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Photos Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Photos *
              </label>
              
              {formData.images.length > 0 ? (
                <div className="space-y-3">
                  {/* Image Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                            Main
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          disabled={saving}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add More Button */}
                  <button
                    type="button"
                    onClick={() => setShowPhotoUpload(true)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition-colors"
                    disabled={saving}
                  >
                    + Add More Photos
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPhotoUpload(true)}
                  className="w-full flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-600 font-medium">Add Photos</span>
                </button>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                Product Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Awake RÄVIK 3"
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={saving}
                required
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-gray-900 mb-2">
                Price (ZAR) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium">
                  R
                </span>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={saving}
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-900 mb-2">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={saving}
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description (Optional) */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                Description <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add a brief description..."
                rows={4}
                className="w-full p-4 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={saving}
              />
            </div>
          </form>

          {/* Footer with Save Button */}
          <div className="border-t p-4 bg-white">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !formData.name || !formData.price || formData.images.length === 0}
              className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all active:scale-95 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed shadow-lg font-semibold text-lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Creating Product...</span>
                </>
              ) : (
                <>
                  <Save className="h-6 w-6" />
                  <span>Create Product</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Photo Upload Modal */}
      {showPhotoUpload && (
        <MobilePhotoUpload
          isOpen={showPhotoUpload}
          onClose={() => setShowPhotoUpload(false)}
          onSuccess={handlePhotoUploadSuccess}
        />
      )}
    </>
  );
}
