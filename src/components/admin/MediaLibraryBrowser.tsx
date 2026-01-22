'use client';

import React, { useState, useMemo } from 'react';
import { useProductsStore, MediaFile } from '@/store/products';
import { X, Search, Image as ImageIcon, Video, ExternalLink, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

// Placeholder image as data URL
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect width="200" height="150" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3ENo Preview%3C/text%3E%3C/svg%3E';

interface MediaLibraryBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (media: MediaFile) => void;
  type?: 'image' | 'video' | 'all';
}

export default function MediaLibraryBrowser({ isOpen, onClose, onSelect, type = 'all' }: MediaLibraryBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const products = useProductsStore((state) => state.products);

  // Collect all media from all products
  const allMedia = useMemo(() => {
    const mediaList: Array<MediaFile & { productName: string; productId: string }> = [];

    products.forEach(product => {
      // Add images
      if (type === 'all' || type === 'image') {
        if (product.images) {
          product.images.forEach(img => {
            mediaList.push({
              ...img,
              productName: product.name,
              productId: product.id,
            });
          });
        }
        // Include legacy image
        if (product.image) {
          mediaList.push({
            id: `legacy-${product.id}`,
            url: product.image,
            type: 'image',
            name: `${product.name} - Primary Image`,
            source: 'url',
            productName: product.name,
            productId: product.id,
          });
        }
      }

      // Add videos
      if (type === 'all' || type === 'video') {
        if (product.videos) {
          product.videos.forEach(vid => {
            mediaList.push({
              ...vid,
              productName: product.name,
              productId: product.id,
            });
          });
        }
      }
    });

    return mediaList;
  }, [products, type]);

  // Filter media based on search
  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return allMedia;

    const query = searchQuery.toLowerCase();
    return allMedia.filter(media =>
      media.productName.toLowerCase().includes(query) ||
      media.name?.toLowerCase().includes(query) ||
      media.url.toLowerCase().includes(query)
    );
  }, [allMedia, searchQuery]);

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelect = (media: MediaFile) => {
    if (onSelect) {
      onSelect(media);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Media Library</h2>
            <p className="text-sm text-gray-500 mt-1">
              Browse all media from your products ({filteredMedia.length} items)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, file name, or URL..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredMedia.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {type === 'image' ? (
                  <ImageIcon className="w-16 h-16 mx-auto" />
                ) : type === 'video' ? (
                  <Video className="w-16 h-16 mx-auto" />
                ) : (
                  <ImageIcon className="w-16 h-16 mx-auto" />
                )}
              </div>
              <p className="text-gray-500 text-lg">
                {searchQuery ? 'No media found matching your search' : 'No media available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((media) => (
                <div
                  key={`${media.productId}-${media.id}`}
                  className="group relative border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSelect(media)}
                >
                  {/* Media Preview */}
                  <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={media.name || 'Image'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <Video className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500 line-clamp-2">{media.name || 'Video'}</p>
                      </div>
                    )}
                  </div>

                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(media.url, media.id);
                      }}
                      className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      title="Copy URL"
                    >
                      {copiedId === media.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    
                    {media.source !== 'upload' && (
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        title="View original"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Media Info */}
                  <div className="p-3 bg-white border-t">
                    <p className="text-sm font-medium text-gray-900 truncate" title={media.name || media.url}>
                      {media.name || 'Untitled'}
                    </p>
                    <p className="text-xs text-gray-500 truncate" title={media.productName}>
                      {media.productName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {media.source === 'upload' ? '📁 Uploaded' : media.source === 'drive' ? '☁️ Drive' : '🔗 URL'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {onSelect ? 'Click on any media to select it' : 'Browse your media library'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
