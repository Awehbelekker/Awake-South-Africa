/** @type {import('next').NextConfig} */
// Cache bust: 2026-01-30
const nextConfig = {
  // output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/uploads/**' },
      { protocol: 'https', hostname: '*.awakeboards.com', pathname: '/**' },
      { protocol: 'https', hostname: 'awakeboards.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.awakesa.co.za', pathname: '/**' },
      { protocol: 'https', hostname: 'awake-south-africa-production.up.railway.app', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;

