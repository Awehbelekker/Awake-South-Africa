import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Awake Store Admin',
    short_name: 'Awake Admin',
    description: 'Admin portal for Awake Store - Manage products, orders, and media from anywhere',
    start_url: '/admin',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['business', 'productivity'],
    shortcuts: [
      {
        name: 'Products',
        short_name: 'Products',
        description: 'Manage products',
        url: '/admin/products',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Quick Upload',
        short_name: 'Upload',
        description: 'Quick photo upload',
        url: '/admin/products?quick_upload=true',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Orders',
        short_name: 'Orders',
        description: 'View orders',
        url: '/admin/orders',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
    screenshots: [],
  }
}
