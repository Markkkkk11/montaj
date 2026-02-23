/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', '217.198.13.3'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '217.198.13.3',
      },
      {
        protocol: 'https',
        hostname: '217.198.13.3',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
};

module.exports = nextConfig;
