'use client';

import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Upload, HardDrive, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTenant } from '@/contexts/TenantContext';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import GoogleDrivePicker from './GoogleDrivePicker';

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

type AddMode = 'url' | 'upload' | 'drive';

export function VideoSectionManager({ value = {}, onChange }: Props) {
  const { tenant } = useTenant();
  const { isConnected: driveConnected, transferToSupabase } = useGoogleDrive();

  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [introAddMode, setIntroAddMode] = useState<AddMode>('url');
  const [actionAddMode, setActionAddMode] = useState<AddMode>('url');
  const [uploading, setUploading] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState<'intro' | 'action' | null>(null);

  const toggleSection = (section: keyof VideoSections) => {
    onChange({ ...value, [section]: { ...value[section], enabled: !value[section]?.enabled } });
  };

  const updateIntroVideo = (url: string, title?: string, description?: string) => {
    onChange({ ...value, product_intro: { enabled: value.product_intro?.enabled ?? true, url, title, description } });
  };

  // ── Upload video to Supabase Storage ──────────────────────────────────────

  async function uploadVideo(file: File, target: 'intro' | 'action', title?: string): Promise<string | null> {
    if (!tenant?.id) { toast.error('Tenant not loaded'); return null; }
    if (!file.type.startsWith('video/')) { toast.error('Please select a video file'); return null; }
    if (file.size > 500 * 1024 * 1024) { toast.error('Video must be under 500MB'); return null; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('tenant_id', tenant.id);
      formData.append('file', file);
      formData.append('folder', 'videos');

      const res = await fetch('/api/media/library', { method: 'POST', body: formData });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Upload failed');
      return d.file.url as string;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleIntroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadVideo(file, 'intro');
    if (url) {
      updateIntroVideo(url, value.product_intro?.title, value.product_intro?.description);
      toast.success('Intro video uploaded');
    }
    e.target.value = '';
  }

  async function handleActionUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!newVideoTitle.trim()) { toast.error('Enter a title first'); return; }
    const url = await uploadVideo(file, 'action');
    if (url) {
      addActionVideoWithUrl(url, newVideoTitle);
      setNewVideoTitle('');
    }
    e.target.value = '';
  }

  // ── Drive picker handlers ──────────────────────────────────────────────────

  async function handleDriveSelect(files: Array<{ id: string; name: string; mimeType: string; size: number }>) {
    if (!files.length) return;
    setShowDrivePicker(null);

    setUploading(true);
    try {
      const result = await transferToSupabase(files.map(f => f.id));
      if (!result.success.length) { toast.error('Transfer failed'); return; }

      const url = result.success[0].url;

      if (showDrivePicker === 'intro') {
        updateIntroVideo(url, value.product_intro?.title, value.product_intro?.description);
        toast.success('Intro video imported from Drive');
      } else if (showDrivePicker === 'action') {
        const title = newVideoTitle.trim() || files[0].name.replace(/\.[^/.]+$/, '');
        addActionVideoWithUrl(url, title);
        setNewVideoTitle('');
        toast.success('Action video imported from Drive');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  function addActionVideoWithUrl(url: string, title: string) {
    const currentVideos = value.action_videos?.videos || [];
    if (currentVideos.length >= 3) { toast.error('Maximum 3 action videos allowed'); return; }
    onChange({
      ...value,
      action_videos: {
        enabled: value.action_videos?.enabled ?? true,
        videos: [...currentVideos, { url, title, thumbnail: extractYouTubeThumbnail(url) }],
      },
    });
  }

  const addActionVideo = () => {
    if (!newVideoUrl || !newVideoTitle) { toast.error('Please enter both URL and title'); return; }
    addActionVideoWithUrl(newVideoUrl, newVideoTitle);
    setNewVideoUrl('');
    setNewVideoTitle('');
    toast.success('Action video added');
  };

  const removeActionVideo = (index: number) => {
    const videos = [...(value.action_videos?.videos || [])];
    videos.splice(index, 1);
    onChange({ ...value, action_videos: { ...value.action_videos, enabled: value.action_videos?.enabled ?? true, videos } });
    toast.success('Video removed');
  };

  const handleThumbnailUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const videos = [...(value.action_videos?.videos || [])];
      videos[index] = { ...videos[index], customThumbnail: reader.result as string };
      onChange({ ...value, action_videos: { ...value.action_videos, enabled: value.action_videos?.enabled ?? true, videos } });
      toast.success('Custom thumbnail uploaded');
    };
    reader.readAsDataURL(file);
  };

  const extractYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : '';
  };

  // ── Shared mode toggle buttons ─────────────────────────────────────────────

  const ModeButtons = ({ current, onChange: setMode }: { current: AddMode; onChange: (m: AddMode) => void }) => (
    <div className="flex gap-1 mb-3">
      {([['url', LinkIcon, 'URL'], ['upload', Upload, 'Upload'], ['drive', HardDrive, 'Drive']] as const).map(([mode, Icon, label]) => (
        <button
          key={mode}
          type="button"
          onClick={() => setMode(mode as AddMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
            current === mode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${mode === 'drive' && !driveConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={mode === 'drive' && !driveConnected}
          title={mode === 'drive' && !driveConnected ? 'Connect Google Drive in Settings first' : undefined}
        >
          <Icon className="w-3 h-3" />
          {label}
          {mode === 'drive' && driveConnected && <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 border rounded-lg p-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">See It In Action Videos</h3>
        <span className="text-xs text-gray-500">Videos won't appear in image gallery</span>
      </div>

      {/* ── Product Introduction ─────────────────────────────────────────── */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">Product Introduction</h4>
            <span className="text-xs text-gray-500">(1 hero video)</span>
          </div>
          <button type="button" onClick={() => toggleSection('product_intro')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${value.product_intro?.enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {value.product_intro?.enabled ? <><Eye className="w-4 h-4" />Visible</> : <><EyeOff className="w-4 h-4" />Hidden</>}
          </button>
        </div>

        <ModeButtons current={introAddMode} onChange={setIntroAddMode} />

        <div className="space-y-3">
          {introAddMode === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (YouTube / Vimeo / direct)</label>
              <input type="text" placeholder="https://www.youtube.com/watch?v=..."
                value={value.product_intro?.url || ''}
                onChange={(e) => updateIntroVideo(e.target.value, value.product_intro?.title, value.product_intro?.description)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
            </div>
          )}

          {introAddMode === 'upload' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload video file (mp4, mov — max 500MB)</label>
              <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploading ? 'border-gray-300 bg-gray-50' : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'}`}>
                <Upload className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600">{uploading ? 'Uploading…' : 'Click to choose video'}</span>
                <input type="file" accept="video/*" className="hidden" disabled={uploading} onChange={handleIntroUpload} />
              </label>
              {value.product_intro?.url && value.product_intro.url.includes('supabase') && (
                <p className="text-xs text-green-600 mt-1">✓ Video uploaded: {value.product_intro.url.split('/').pop()}</p>
              )}
            </div>
          )}

          {introAddMode === 'drive' && (
            <div>
              <button type="button" onClick={() => setShowDrivePicker('intro')} disabled={uploading}
                className="flex items-center gap-2 w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50">
                <HardDrive className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600">{uploading ? 'Importing…' : 'Browse Google Drive for video'}</span>
              </button>
              {value.product_intro?.url && value.product_intro.url.includes('supabase') && (
                <p className="text-xs text-green-600 mt-1">✓ Video imported from Drive</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video Title (optional)</label>
            <input type="text" placeholder="e.g., Meet the Awake RÄVIK 3"
              value={value.product_intro?.title || ''}
              onChange={(e) => updateIntroVideo(value.product_intro?.url || '', e.target.value, value.product_intro?.description)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea rows={2} placeholder="Brief description of the video..."
              value={value.product_intro?.description || ''}
              onChange={(e) => updateIntroVideo(value.product_intro?.url || '', value.product_intro?.title, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
          </div>
        </div>

        {value.product_intro?.url && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            {extractYouTubeThumbnail(value.product_intro.url) ? (
              <img src={extractYouTubeThumbnail(value.product_intro.url)} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
            ) : (
              <video src={value.product_intro.url} className="w-full h-48 object-cover rounded-lg" controls muted />
            )}
          </div>
        )}
      </div>

      {/* ── Action Videos ────────────────────────────────────────────────── */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">Action Videos</h4>
            <span className="text-xs text-gray-500">(up to 3)</span>
          </div>
          <button type="button" onClick={() => toggleSection('action_videos')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${value.action_videos?.enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {value.action_videos?.enabled ? <><Eye className="w-4 h-4" />Visible</> : <><EyeOff className="w-4 h-4" />Hidden</>}
          </button>
        </div>

        <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <ModeButtons current={actionAddMode} onChange={setActionAddMode} />

          {/* Title field — shared across all modes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video Title</label>
            <input type="text" placeholder="e.g., Riding in Big Waves"
              value={newVideoTitle}
              onChange={(e) => setNewVideoTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
          </div>

          {actionAddMode === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
              <input type="text" placeholder="https://www.youtube.com/watch?v=..."
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white" />
              <button type="button" onClick={addActionVideo}
                disabled={(value.action_videos?.videos?.length || 0) >= 3}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                <Plus className="w-4 h-4" />
                Add Video ({value.action_videos?.videos?.length || 0}/3)
              </button>
            </div>
          )}

          {actionAddMode === 'upload' && (
            <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploading ? 'border-gray-300 bg-gray-50' : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'}`}>
              <Upload className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600">{uploading ? 'Uploading…' : 'Click to choose video file'}</span>
              <input type="file" accept="video/*" className="hidden" disabled={uploading || !newVideoTitle.trim()} onChange={handleActionUpload} />
            </label>
          )}

          {actionAddMode === 'drive' && (
            <button type="button" onClick={() => setShowDrivePicker('action')} disabled={uploading}
              className="flex items-center gap-2 w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50">
              <HardDrive className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600">{uploading ? 'Importing…' : 'Browse Google Drive for video'}</span>
            </button>
          )}
        </div>

        {/* Existing Videos */}
        {(value.action_videos?.videos?.length || 0) > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Current Videos:</p>
            {value.action_videos?.videos?.map((video, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                <div className="relative flex-shrink-0">
                  {video.customThumbnail || video.thumbnail ? (
                    <img src={video.customThumbnail || video.thumbnail} alt={video.title}
                      className="w-32 h-20 object-cover rounded"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <video src={video.url} className="w-32 h-20 object-cover rounded" muted />
                  )}
                  <label className="absolute bottom-1 right-1 cursor-pointer">
                    <div className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-1 rounded" title="Upload custom thumbnail">
                      <Upload className="w-3 h-3" />
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleThumbnailUpload(index, e)} className="hidden" />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{video.title}</p>
                  <p className="text-xs text-gray-500 truncate mt-1">{video.url}</p>
                  {video.customThumbnail && <p className="text-xs text-green-600 mt-1">✓ Custom thumbnail</p>}
                </div>
                <button type="button" onClick={() => removeActionVideo(index)}
                  className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {(value.action_videos?.videos?.length || 0) === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">No action videos added yet.</div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Use URL for YouTube/Vimeo links, Upload for local files, or browse Google Drive directly.
          Uploaded videos are stored in Supabase Storage.
        </p>
      </div>

      {/* Google Drive Picker */}
      <GoogleDrivePicker
        isOpen={showDrivePicker !== null}
        onClose={() => setShowDrivePicker(null)}
        onSelect={handleDriveSelect}
        multiSelect={false}
        type="video"
        title="Select Video from Google Drive"
      />
    </div>
  );
}
