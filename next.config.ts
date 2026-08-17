import type { NextConfig } from 'next';

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:8080';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: `${API_ORIGIN}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
