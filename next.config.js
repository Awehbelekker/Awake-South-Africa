const path = require('path');

/** @type {import('next').NextConfig} */
// Cache bust: 2026-01-30
const nextConfig = {
  // output: 'standalone',
  
  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/uploads/**' },
      { protocol: 'https', hostname: '*.awakeboards.com', pathname: '/**' },
      { protocol: 'https', hostname: 'awakeboards.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.awakesa.co.za', pathname: '/**' },
      { protocol: 'https', hostname: 'awake-south-africa-production.up.railway.app', pathname: '/**' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/**' }, // Supabase storage
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' }, // Google Drive thumbnails
    ],
  },
  webpack: (config) => {
    // Ensure the `@/` alias always resolves to the root src/ directory
    if (!config.resolve.alias['@']) {
      config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    }
    return config;
  },
};

module.exports = nextConfig;

