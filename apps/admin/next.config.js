/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ],
  },
};

module.exports = nextConfig;
