'use client';

import React, { useState } from 'react';
import { MediaFile } from '@/store/products';
import GoogleDrivePicker from './GoogleDrivePicker';
import { MediaLibrary } from './MediaLibrary';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { useTenant } from '@/contexts/TenantContext';
import { X, Upload, Image as ImageIcon, Video, ExternalLink, MoveUp, MoveDown, FolderOpen, Cloud } from 'lucide-react';
import toast from 'react-hot-toast';

// Placeholder image as data URL (1x1 transparent pixel)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect width="200" height="150" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3ENo Preview%3C/text%3E%3C/svg%3E';

interface MediaManagerProps {
  type: 'image' | 'video';
  items: MediaFile[];
  onChange: (items: MediaFile[]) => void;
  label: string;
  maxItems?: number;
}

export default function MediaManager({ type, items = [], onChange, label, maxItems = 10 }: MediaManagerProps) {
  const { tenant } = useTenant();
  const { transferToSupabase } = useGoogleDrive();
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const handleLibrarySelect = (urls: string[]) => {
    const newItems: MediaFile[] = urls.map(url => ({
      id: `library-${Date.now()}-${Math.random()}`,
      url,
      type,
      source: 'url',
      name: url.split('/').pop() || 'Library image',
    }));
    if (items.length + newItems.length > maxItems) {
      toast.error(`Maximum ${maxItems} ${type}s allowed`);
      return;
    }
    onChange([...items, ...newItems]);
    setShowLibrary(false);
    toast.success(`${newItems.length} item(s) added from library`);
  };

  const handleAddFromUrl = () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      const url = new URL(urlInput);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        toast.error('Only HTTP and HTTPS URLs are allowed');
        return;
      }
    } catch {
      toast.error('Invalid URL format');
      return;
    }

    const newItem: MediaFile = {
      id: `url-${Date.now()}`,
      url: urlInput,
      type,
      source: 'url',
    };

    onChange([...items, newItem]);
    setUrlInput('');
    toast.success(`${type === 'image' ? 'Image' : 'Video'} added successfully`);
  };

  const handleDriveSelect = async (files: Array<{ id: string; name: string; mimeType: string; size: number; thumbnailLink?: string }>) => {
    if (items.length + files.length > maxItems) {
      toast.error(`Maximum ${maxItems} ${type}s allowed`);
      return;
    }

    setTransferring(true);
    setShowDrivePicker(false);

    try {
      // Transfer files from Drive to Supabase
      const result = await transferToSupabase(
        files.map(f => f.id),
        { createProducts: false }
      );

      if (result.errors.length > 0) {
        console.error('Transfer errors:', result.errors);
        toast.error(`Failed to transfer ${result.errors.length} file(s)`);
      }

      if (result.success.length > 0) {
        // Add successfully transferred files to media items
        const newItems: MediaFile[] = result.success.map(item => ({
          id: `drive-${item.fileId}`,
          url: item.url,
          type,
          name: item.fileName,
          source: 'drive',
        }));

        onChange([...items, ...newItems]);
        toast.success(`Added ${result.success.length} ${type}(s) from Google Drive`);
      }
    } catch (error: any) {
      console.error('Drive transfer error:', error);
      toast.error(error.message || 'Failed to transfer files from Google Drive');
    } finally {
      setTransferring(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (items.length + files.length > maxItems) {
      toast.error(`Maximum ${maxItems} ${type}s allowed`);
      return;
    }

    setUploading(true);

    try {
      const newItems: MediaFile[] = [];
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for localStorage
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} is too large (max 5MB). Use Google Drive for larger files.`);
          continue;
        }
        
        // Validate file type
        if (type === 'image' && !file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }
        if (type === 'video' && !file.type.startsWith('video/')) {
          toast.error(`${file.name} is not a video file`);
          continue;
        }

        // Convert to base64 for preview (client-side storage)
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        newItems.push({
          id: `upload-${Date.now()}-${i}`,
          url: base64,
          type,
          name: file.name,
          source: 'upload',
        });
      }

      onChange([...items, ...newItems]);
      toast.success(`${newItems.length} ${type}(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleRemove = (id: string) => {
    onChange(items.filter(item => item.id !== id));
    toast.success(`${type === 'image' ? 'Image' : 'Video'} removed`);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label} ({items.length}/{maxItems})
      </label>

      {/* Add Actions */}
      <div className="flex flex-wrap gap-2">
        {/* File Upload */}
        <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md cursor-pointer transition-colors">
          <Upload className="w-4 h-4" />
          Upload {type === 'image' ? 'Images' : 'Videos'}
          <input
            type="file"
            accept={type === 'image' ? 'image/*' : 'video/*'}
            multiple
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading || items.length >= maxItems}
          />
        </label>

        {/* Google Drive Picker */}
        <button
          type="button"
          onClick={() => setShowDrivePicker(true)}
          disabled={items.length >= maxItems || transferring}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md cursor-pointer transition-colors"
        >
          <Cloud className="w-4 h-4" />
          {transferring ? 'Transferring...' : 'Select from Google Drive'}
        </button>

        {/* Media Library */}
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          disabled={items.length >= maxItems}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-md cursor-pointer transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          Media Library
        </button>

        {/* URL Input */}
        <div className="flex-1 min-w-[250px] flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddFromUrl()}
            placeholder={`Enter ${type} URL...`}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            disabled={items.length >= maxItems}
          />
          <button
            type="button"
            onClick={handleAddFromUrl}
            disabled={!urlInput.trim() || items.length >= maxItems}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add URL
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, index) => (
            <div key={item.id} className="relative group border border-gray-200 rounded-lg overflow-hidden text-gray-900 bg-white">
              {/* Media Preview */}
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.name || `Image ${index + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                  />
                ) : (
                  item.source === 'upload' ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-contain"
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <Video className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500 line-clamp-2">{item.name || 'Video'}</p>
                    </div>
                  )
                )}
              </div>

              {/* Item Info */}
              <div className="p-2 bg-white">
                <p className="text-xs text-gray-600 truncate" title={item.name || item.url}>
                  {item.name || `${type} ${index + 1}`}
                </p>
                <p className="text-xs text-gray-400">
                  {item.source === 'upload' ? '📁 Uploaded' : item.source === 'drive' ? '☁️ Google Drive' : '🔗 URL'}
                </p>
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {/* Reorder buttons */}
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <MoveUp className="w-4 h-4" />
                </button>
                
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === items.length - 1}
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <MoveDown className="w-4 h-4" />
                </button>

                {/* View link */}
                {item.source !== 'upload' && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    title="View original"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          {type === 'image' ? (
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          ) : (
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          )}
          <p className="text-gray-500 text-sm">
            No {type}s added yet. Upload files, select from Google Drive, or add via URL.
          </p>
        </div>
      )}

      {/* Media Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Choose from Media Library</h3>
              <button
                type="button"
                onClick={() => setShowLibrary(false)}
                className="p-2 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <MediaLibrary
                onSelect={handleLibrarySelect}
                multiSelect={true}
                maxSelect={maxItems - items.length}
              />
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Picker Modal */}
      <GoogleDrivePicker
        isOpen={showDrivePicker}
        onClose={() => setShowDrivePicker(false)}
        onSelect={handleDriveSelect}
        multiSelect={true}
        title={`Select ${type === 'image' ? 'Images' : 'Videos'} from Google Drive`}
      />
    </div>
  );
}
