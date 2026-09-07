/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@palnadu/ui', '@palnadu/config', '@palnadu/types', '@palnadu/validation'],
};

module.exports = nextConfig;
