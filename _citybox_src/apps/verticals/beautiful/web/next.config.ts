import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@citybox/mui', '@citybox/beautiful-permissions'],
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
