'use client';

import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { useSupabaseUpload } from '@/hooks/useSupabaseUpload';
import { useTenant } from '@/contexts/TenantContext';
import toast from 'react-hot-toast';

interface MobilePhotoUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (urls: string[]) => void;
  maxFiles?: number;
}

export default function MobilePhotoUpload({
  isOpen,
  onClose,
  onSuccess,
  maxFiles = 10,
}: MobilePhotoUploadProps) {
  const { tenant } = useTenant();
  const { uploadFile, uploading } = useSupabaseUpload();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Check max files limit
    if (selectedFiles.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} photos allowed`);
      return;
    }

    // Validate file types
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      // Check file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 100MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create previews
    const newPreviews: string[] = [];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setPreviews([...previews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedFiles([...selectedFiles, ...validFiles]);
    toast.success(`${validFiles.length} photo(s) selected`);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    if (!tenant?.id) {
      toast.error('Tenant not found');
      return;
    }

    const uploadedUrls: string[] = [];
    const progress: Record<string, number> = {};

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        progress[file.name] = 0;
        setUploadProgress({ ...progress });

        const result = await uploadFile(file, {
          tenantId: tenant.id,
          folder: 'media-library',
        });

        if (result.url) {
          uploadedUrls.push(result.url);
          progress[file.name] = 100;
          setUploadProgress({ ...progress });
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      toast.success(`${uploadedUrls.length} photo(s) uploaded successfully`);
      onSuccess(uploadedUrls);
      handleClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload photos');
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setUploadProgress({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white md:bg-black md:bg-opacity-50 flex items-center justify-center">
      {/* Mobile: Full screen, Desktop: Modal */}
      <div className="w-full h-full md:max-w-2xl md:max-h-[90vh] md:h-auto bg-white md:rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Upload Photos</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={uploading}
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Upload Options */}
          {selectedFiles.length === 0 && (
            <div className="space-y-4">
              {/* Camera Button - Mobile Only */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg md:hidden"
              >
                <Camera className="h-8 w-8" />
                <span className="text-lg font-semibold">Take Photo</span>
              </button>

              {/* Photo Library Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 p-6 bg-white border-2 border-gray-300 text-gray-900 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
              >
                <ImageIcon className="h-8 w-8 text-gray-600" />
                <span className="text-lg font-semibold">Choose from Library</span>
              </button>

              {/* Info Text */}
              <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Tips for best results:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Use good lighting</li>
                    <li>Keep photos under 100MB</li>
                    <li>Select multiple photos at once</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Selected Photos Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedFiles.length} Photo{selectedFiles.length !== 1 ? 's' : ''} Selected
                </h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 font-medium text-sm"
                  disabled={uploading}
                >
                  + Add More
                </button>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-2 gap-3">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Upload Progress */}
                    {uploadProgress[selectedFiles[index].name] !== undefined && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        {uploadProgress[selectedFiles[index].name] === 100 ? (
                          <div className="bg-green-500 rounded-full p-2">
                            <Check className="h-6 w-6 text-white" />
                          </div>
                        ) : (
                          <div className="text-white text-sm font-semibold">
                            {uploadProgress[selectedFiles[index].name]}%
                          </div>
                        )}
                      </div>
                    )}

                    {/* Remove Button */}
                    {!uploading && (
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    {/* File Name */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                      <p className="text-xs text-white truncate">
                        {selectedFiles[index].name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Upload Button */}
        {selectedFiles.length > 0 && (
          <div className="border-t p-4 bg-white sticky bottom-0">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span className="text-lg font-semibold">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span className="text-lg font-semibold">
                    Upload {selectedFiles.length} Photo{selectedFiles.length !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
