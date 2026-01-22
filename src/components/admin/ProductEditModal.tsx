'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { EditableProduct } from '@/store/products';
import ArrayFieldEditor from './ArrayFieldEditor';
import RichTextEditor from './RichTextEditor';
import MediaManager from './MediaManager';
import { validateProduct } from '@/lib/validation/productValidation';
import toast from 'react-hot-toast';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: EditableProduct | null;
  onSave: (product: EditableProduct) => void;
}

export default function ProductEditModal({ isOpen, onClose, product, onSave }: ProductEditModalProps) {
  const [formData, setFormData] = useState<EditableProduct | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({ 
        ...product,
        images: product.images || [],
        videos: product.videos || [],
      });
      setHasUnsavedChanges(false);
    }
  }, [product]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleChange = (field: keyof EditableProduct, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
    setHasUnsavedChanges(true);
    // Clear error for this field
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    setSaving(true);
    try {
      // Validate
      const result = validateProduct(formData);

      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Please fix validation errors');
        setSaving(false);
        return;
      }

      // Save
      onSave(formData);
      setHasUnsavedChanges(false);
      toast.success('Product updated successfully!');
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        setHasUnsavedChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!formData) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Edit Product: {formData.name}
                </Dialog.Title>

                <div className="mt-4 max-h-[70vh] overflow-y-auto space-y-4 pr-2">
                  {/* Basic Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                    </div>
                  </div>

                  {/* Pricing Fields */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price (ZAR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.price ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price Ex VAT (ZAR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.priceExVAT}
                        onChange={(e) => handleChange('priceExVAT', parseFloat(e.target.value))}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.priceExVAT ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.priceExVAT && <p className="text-red-500 text-sm mt-1">{errors.priceExVAT}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cost (EUR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.costEUR}
                        onChange={(e) => handleChange('costEUR', parseFloat(e.target.value))}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.costEUR ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.costEUR && <p className="text-red-500 text-sm mt-1">{errors.costEUR}</p>}
                    </div>
                  </div>

                  {/* Stock Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                      <input
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => handleChange('stockQuantity', parseInt(e.target.value))}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.stockQuantity ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.stockQuantity && <p className="text-red-500 text-sm mt-1">{errors.stockQuantity}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Skill Level</label>
                      <select
                        value={formData.skillLevel}
                        onChange={(e) => handleChange('skillLevel', e.target.value)}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.skillLevel ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Beginner-Advanced">Beginner-Advanced</option>
                      </select>
                      {errors.skillLevel && <p className="text-red-500 text-sm mt-1">{errors.skillLevel}</p>}
                    </div>
                  </div>

                  {/* Description with Rich Text Editor */}
                  <RichTextEditor
                    label="Description"
                    value={formData.description || ''}
                    onChange={(value) => handleChange('description', value)}
                    placeholder="Enter product description..."
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}

                  {/* Specs Array Editor */}
                  <ArrayFieldEditor
                    label="Specifications"
                    values={formData.specs || []}
                    onChange={(values) => handleChange('specs', values)}
                    placeholder="Add specification"
                  />
                  {errors.specs && <p className="text-red-500 text-sm mt-1">{errors.specs}</p>}

                  {/* Features Array Editor */}
                  <ArrayFieldEditor
                    label="Features"
                    values={formData.features || []}
                    onChange={(values) => handleChange('features', values)}
                    placeholder="Add feature"
                  />
                  {errors.features && <p className="text-red-500 text-sm mt-1">{errors.features}</p>}

                  {/* Media Management Section */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Media Management</h4>
                    
                    {/* Product Images */}
                    <MediaManager
                      type="image"
                      items={formData.images || []}
                      onChange={(items) => handleChange('images', items)}
                      label="Product Images"
                      maxItems={10}
                    />

                    {/* Product Videos */}
                    <div className="mt-6">
                      <MediaManager
                        type="video"
                        items={formData.videos || []}
                        onChange={(items) => handleChange('videos', items)}
                        label="Product Videos"
                        maxItems={5}
                      />
                    </div>
                  </div>

                  {/* Legacy Image URL (for backward compatibility) */}
                  <div className="border-t pt-4 mt-4">
                    <label className="block text-sm font-medium text-gray-700">Legacy Image URL (Backward Compatibility)</label>
                    <p className="text-xs text-gray-500 mb-2">Use the Media Management section above for new images. This field is kept for backward compatibility.</p>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => handleChange('image', e.target.value)}
                      className={`mt-1 block w-full px-3 py-2 border ${errors.image ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="https://example.com/image.jpg"
                    />
                    {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
                    {formData.image && (
                      <img src={formData.image} alt="Preview" className="mt-2 h-32 object-contain" />
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving && (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

