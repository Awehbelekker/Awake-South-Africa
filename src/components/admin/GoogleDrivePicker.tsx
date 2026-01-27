'use client';

import React, { useEffect, useState } from 'react';
import useDrivePicker from 'react-google-drive-picker';
import { Cloud } from 'lucide-react';
import toast from 'react-hot-toast';

// Placeholder values for unconfigured credentials
const PLACEHOLDER_CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
const PLACEHOLDER_API_KEY = 'your-api-key';
const PLACEHOLDER_APP_ID = 'your-app-id';

interface GoogleDrivePickerProps {
  onSelect: (files: Array<{ id: string; name: string; url: string; mimeType: string; thumbnailUrl?: string }>) => void;
  multiSelect?: boolean;
  accept?: 'image' | 'video' | 'all';
  label?: string;
}

export default function GoogleDrivePicker({ 
  onSelect, 
  multiSelect = false, 
  accept = 'all',
  label = 'Select from Google Drive'
}: GoogleDrivePickerProps) {
  const [openPicker, authResponse] = useDrivePicker();
  const [debugInfo, setDebugInfo] = useState<string>('');

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
  const appId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID;

  // Check if Google Drive credentials are configured
  // More lenient check - just verify they exist and are not empty/placeholder
  const isConfigured = !!(
    clientId && 
    apiKey && 
    appId && 
    clientId.length > 10 &&
    apiKey.length > 10 &&
    appId.length > 5 &&
    !clientId.includes('your-client-id') &&
    !apiKey.includes('your-api-key') &&
    !appId.includes('your-app-id')
  );

  // Debug logging (only in development)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info = `Config check: ${isConfigured ? 'YES' : 'NO'} | ClientID: ${clientId ? 'SET' : 'MISSING'} | ApiKey: ${apiKey ? 'SET' : 'MISSING'} | AppID: ${appId ? 'SET' : 'MISSING'}`;
      setDebugInfo(info);
      console.log('[GoogleDrivePicker]', info);
    }
  }, [clientId, apiKey, appId, isConfigured]);

  const handleOpenPicker = () => {
    if (!isConfigured) {
      const missing = [];
      if (!clientId || clientId.includes('your-client-id')) missing.push('CLIENT_ID');
      if (!apiKey || apiKey.includes('your-api-key')) missing.push('API_KEY');
      if (!appId || appId.includes('your-app-id')) missing.push('APP_ID');
      
      toast.error(`Google Drive not configured. Missing: ${missing.join(', ')}. Check Vercel environment variables.`);
      console.error('[GoogleDrivePicker] Configuration error:', { clientId, apiKey, appId });
      return;
    }

    // Define MIME types based on accept prop
    let mimeTypes: string[] = [];
    if (accept === 'image') {
      mimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    } else if (accept === 'video') {
      mimeTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'];
    } else {
      mimeTypes = [
        'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'
      ];
    }

    openPicker({
      clientId: clientId!,
      developerKey: apiKey!,
      viewId: 'DOCS',
      showUploadView: true,
      showUploadFolders: true,
      supportDrives: true,
      multiselect: multiSelect,
      setIncludeFolders: true,
      setSelectFolderEnabled: false,
      customViews: [
        {
          id: 'DOCS_IMAGES_AND_VIDEOS',
          mimeTypes: mimeTypes,
          query: '',
        },
      ],
      callbackFunction: (data) => {
        if (data.action === 'cancel') {
          console.log('User cancelled the picker');
          return;
        }

        if (data.action === 'picked') {
          const selectedFiles = data.docs.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            url: doc.url,
            mimeType: doc.mimeType,
            thumbnailUrl: doc.iconUrl || doc.thumbnailUrl,
          }));
          
          onSelect(selectedFiles);
          toast.success(`Selected ${selectedFiles.length} file(s) from Google Drive`);
        }
      },
    });
  };

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={handleOpenPicker}
        disabled={!isConfigured}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          isConfigured
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-400 text-gray-700 cursor-not-allowed'
        }`}
        title={!isConfigured ? 'Google Drive not configured. Check Vercel environment variables.' : label}
      >
        <Cloud className="w-4 h-4" />
        {isConfigured ? label : '🔒 Google Drive (Not Configured)'}
      </button>
      {/* Show debug info in development */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="text-xs text-gray-500 mt-1 max-w-md">
          {debugInfo}
        </div>
      )}
    </div>
  );
}
