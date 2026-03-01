/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', '37.252.20.208'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '37.252.20.208',
      },
      {
        protocol: 'https',
        hostname: '37.252.20.208',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
};

module.exports = nextConfig;
