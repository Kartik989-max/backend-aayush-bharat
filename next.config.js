/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['backend.aayudhbharat.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'backend.aayudhbharat.com',
        pathname: '/v1/**',
      },
    ],
    unoptimized: true
  },
};

module.exports = nextConfig;
