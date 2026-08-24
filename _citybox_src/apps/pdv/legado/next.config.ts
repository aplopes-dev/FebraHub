import type { NextConfig } from 'next';
import { withSerwist } from '@serwist/turbopack';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@citybox/ui'],
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default withSerwist(nextConfig);
