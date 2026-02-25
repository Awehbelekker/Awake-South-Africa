// Awake Store Service Worker
// Provides offline support and background sync for the admin portal

const CACHE_NAME = 'awake-admin-v1';
const RUNTIME_CACHE = 'awake-runtime';

// Files to cache on install
const STATIC_ASSETS = [
  '/admin',
  '/admin/products',
  '/offline',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[ServiceWorker] Cache failed:', err);
      });
    })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Skip API requests (always fetch fresh)
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Network first for HTML pages
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/offline');
          });
        })
    );
    return;
  }
  
  // Cache first for other requests (images, styles, scripts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        
        // Clone and cache
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        
        return response;
      });
    })
  );
});

// Background sync for photo uploads
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-photos') {
    event.waitUntil(
      syncPhotos().catch((err) => {
        console.error('[ServiceWorker] Sync failed:', err);
      })
    );
  }
});

// Helper function to sync pending photos
async function syncPhotos() {
  console.log('[ServiceWorker] Syncing pending photos...');
  
  // Get pending uploads from IndexedDB
  const db = await openDB();
  const tx = db.transaction('pending-uploads', 'readonly');
  const store = tx.objectStore('pending-uploads');
  const pendingUploads = await store.getAll();
  
  // Upload each pending photo
  for (const upload of pendingUploads) {
    try {
      const formData = new FormData();
      formData.append('file', upload.file);
      formData.append('tenant_id', upload.tenantId);
      
      const response = await fetch('/api/media/library', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        // Remove from pending
        const deleteTx = db.transaction('pending-uploads', 'readwrite');
        await deleteTx.objectStore('pending-uploads').delete(upload.id);
        console.log('[ServiceWorker] Photo synced:', upload.id);
      }
    } catch (err) {
      console.error('[ServiceWorker] Failed to sync photo:', err);
    }
  }
  
  db.close();
}

// Helper to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('awake-admin', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-uploads')) {
        db.createObjectStore('pending-uploads', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Message handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
