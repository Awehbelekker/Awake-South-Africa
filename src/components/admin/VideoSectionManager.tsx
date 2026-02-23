'use client';

import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface VideoSection {
  enabled: boolean;
  url?: string;
  videos?: Array<{ url: string; title: string; thumbnail?: string; customThumbnail?: string }>;
  title?: string;
  description?: string;
}

export interface VideoSections {
  product_intro?: VideoSection;
  action_videos?: VideoSection;
}

interface Props {
  value: VideoSections;
  onChange: (sections: VideoSections) => void;
}

export function VideoSectionManager({ value = {}, onChange }: Props) {
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');

  const toggleSection = (section: keyof VideoSections) => {
    onChange({
      ...value,
      [section]: {
        ...value[section],
        enabled: !value[section]?.enabled
      }
    });
  };

  const updateIntroVideo = (url: string, title?: string, description?: string) => {
    onChange({
      ...value,
      product_intro: {
        enabled: value.product_intro?.enabled ?? true,
        url,
        title,
        description
      }
    });
  };

  const addActionVideo = () => {
    if (!newVideoUrl || !newVideoTitle) {
      toast.error('Please enter both video URL and title');
      return;
    }

    const currentVideos = value.action_videos?.videos || [];
    if (currentVideos.length >= 3) {
      toast.error('Maximum 3 action videos allowed');
      return;
    }

    onChange({
      ...value,
      action_videos: {
        enabled: value.action_videos?.enabled ?? true,
        videos: [
          ...currentVideos,
          {
            url: newVideoUrl,
            title: newVideoTitle,
            thumbnail: extractYouTubeThumbnail(newVideoUrl)
          }
        ]
      }
    });

    setNewVideoUrl('');
    setNewVideoTitle('');
    toast.success('Action video added');
  };

  const removeActionVideo = (index: number) => {
    const videos = [...(value.action_videos?.videos || [])];
    videos.splice(index, 1);

    onChange({
      ...value,
      action_videos: {
        ...value.action_videos,
        enabled: value.action_videos?.enabled ?? true,
        videos
      }
    });
    toast.success('Video removed');
  };

  const handleThumbnailUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Thumbnail must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const videos = [...(value.action_videos?.videos || [])];
      videos[index] = {
        ...videos[index],
        customThumbnail: reader.result as string
      };

      onChange({
        ...value,
        action_videos: {
          ...value.action_videos,
          enabled: value.action_videos?.enabled ?? true,
          videos
        }
      });
      toast.success('Custom thumbnail uploaded');
    };
    reader.readAsDataURL(file);
  };

  const extractYouTubeThumbnail = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : '';
  };

  return (
    <div className="space-y-6 border rounded-lg p-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">See It In Action Videos</h3>
        <span className="text-xs text-gray-500">Videos won't appear in image gallery</span>
      </div>

      {/* Product Introduction Section */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">Product Introduction</h4>
            <span className="text-xs text-gray-500">(1 hero video)</span>
          </div>
          <button
            type="button"
            onClick={() => toggleSection('product_intro')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
              value.product_intro?.enabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {value.product_intro?.enabled ? (
              <>
                <Eye className="w-4 h-4" />
                Visible
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Hidden
              </>
            )}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
              value={value.product_intro?.url || ''}
              onChange={(e) => updateIntroVideo(e.target.value, value.product_intro?.title, value.product_intro?.description)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video Title (optional)</label>
            <input
              type="text"
              placeholder="e.g., Meet the Awake Ravik 3"
              value={value.product_intro?.title || ''}
              onChange={(e) => updateIntroVideo(value.product_intro?.url || '', e.target.value, value.product_intro?.description)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              placeholder="Brief description of the video..."
              value={value.product_intro?.description || ''}
              onChange={(e) => updateIntroVideo(value.product_intro?.url || '', value.product_intro?.title, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              rows={2}
            />
          </div>
        </div>

        {value.product_intro?.url && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <img 
              src={extractYouTubeThumbnail(value.product_intro.url) || '/images/awake-default.jpg'} 
              alt="Video preview"
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/awake-default.jpg';
              }}
            />
          </div>
        )}
      </div>

      {/* Action Videos Section */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">Action Videos</h4>
            <span className="text-xs text-gray-500">(up to 3)</span>
          </div>
          <button
            type="button"
            onClick={() => toggleSection('action_videos')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
              value.action_videos?.enabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {value.action_videos?.enabled ? (
              <>
                <Eye className="w-4 h-4" />
                Visible
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Hidden
              </>
            )}
          </button>
        </div>

        {/* Add New Video */}
        <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video Title</label>
            <input
              type="text"
              placeholder="e.g., Riding in Big Waves"
              value={newVideoTitle}
              onChange={(e) => setNewVideoTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
          </div>
          <button
            type="button"
            onClick={addActionVideo}
            disabled={(value.action_videos?.videos?.length || 0) >= 3}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Video ({value.action_videos?.videos?.length || 0}/3)
          </button>
        </div>

        {/* Existing Videos */}
        {(value.action_videos?.videos?.length || 0) > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Current Videos:</p>
            {value.action_videos?.videos?.map((video, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                <div className="relative flex-shrink-0">
                  <img 
                    src={video.customThumbnail || video.thumbnail || '/images/awake-default.jpg'} 
                    alt={video.title}
                    className="w-32 h-20 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/awake-default.jpg';
                    }}
                  />
                  <label className="absolute bottom-1 right-1 cursor-pointer">
                    <div className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-1 rounded transition-colors" title="Upload custom thumbnail">
                      <Upload className="w-3 h-3" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleThumbnailUpload(index, e)}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{video.title}</p>
                  <p className="text-xs text-gray-500 truncate mt-1">{video.url}</p>
                  {video.customThumbnail && (
                    <p className="text-xs text-green-600 mt-1">✓ Custom thumbnail</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeActionVideo(index)}
                  className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove video"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {(value.action_videos?.videos?.length || 0) === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            No action videos added yet. Add up to 3 videos above.
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> These videos will appear in the "See It In Action" section on the product page, 
          separate from the image gallery. You can toggle visibility for each section.
        </p>
      </div>
    </div>
  );
}
