'use client';

import React, { useState } from 'react';
import { MediaFile } from '@/store/products';
import GoogleDrivePicker from './GoogleDrivePicker';
import { X, Upload, Image as ImageIcon, Video, ExternalLink, MoveUp, MoveDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface MediaManagerProps {
  type: 'image' | 'video';
  items: MediaFile[];
  onChange: (items: MediaFile[]) => void;
  label: string;
  maxItems?: number;
}

export default function MediaManager({ type, items = [], onChange, label, maxItems = 10 }: MediaManagerProps) {
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleAddFromUrl = () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
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

  const handleDriveSelect = (files: Array<{ id: string; name: string; url: string; mimeType: string; thumbnailUrl?: string }>) => {
    const newItems: MediaFile[] = files.map(file => ({
      id: `drive-${file.id}`,
      url: file.url,
      type,
      name: file.name,
      source: 'drive',
      driveId: file.id,
      thumbnail: file.thumbnailUrl,
    }));

    if (items.length + newItems.length > maxItems) {
      toast.error(`Maximum ${maxItems} ${type}s allowed`);
      return;
    }

    onChange([...items, ...newItems]);
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
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
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
        <GoogleDrivePicker
          onSelect={handleDriveSelect}
          multiSelect={true}
          accept={type}
          label={`Select from Google Drive`}
        />

        {/* URL Input */}
        <div className="flex-1 min-w-[250px] flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddFromUrl()}
            placeholder={`Enter ${type} URL...`}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div key={item.id} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {/* Media Preview */}
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.name || `Image ${index + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder.png';
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
    </div>
  );
}
