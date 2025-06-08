import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://backend.aayudhbharat.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
