'use client'

export const dynamic = 'force-dynamic'

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="h-10 w-10 text-orange-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>
        
        <p className="text-gray-600 mb-8">
          No internet connection detected. Your changes are saved locally and will sync when you're back online.
        </p>
        
        <button
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <RefreshCw className="h-5 w-5" />
          Try Again
        </button>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> You can still browse cached products and prepare new listings. They'll upload automatically when you reconnect.
          </p>
        </div>
      </div>
    </div>
  );
}
