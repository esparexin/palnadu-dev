/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  transpilePackages: ['@palnadu/ui', '@palnadu/config', '@palnadu/types', '@palnadu/validation'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.palnadu.dev',
      },
      {
        protocol: 'https',
        hostname: 'cdn.21st.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ui.aceternity.com',
      },
    ],
  },
  async redirects() {
    return [
      // 301 Permanent Redirect: apex domain palnadu.dev -> canonical www.palnadu.dev
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'palnadu.dev',
          },
        ],
        destination: 'https://www.palnadu.dev/:path*',
        permanent: true,
      },
      // 301 Permanent Redirect: /digital-marketing -> /grow
      {
        source: '/digital-marketing',
        destination: '/grow',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

