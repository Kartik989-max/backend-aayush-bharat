import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'backend.aayudhbharat.com',
        port: '',
        pathname: '/v1/storage/buckets/**',
      },
    ],
  },
};

export default nextConfig;
