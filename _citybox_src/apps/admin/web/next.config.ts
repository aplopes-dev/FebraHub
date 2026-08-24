import type { NextConfig } from 'next';

const DEV_KEYCLOAK_ISSUER = 'http://127.0.0.1:8080/realms/citybox-dev';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@citybox/ui'],
  typescript: {
    ignoreBuildErrors: true,
  },
  // Next 16 bloqueia HMR/chunks de 127.0.0.1 sem isso — React não hidrata e fica "Carregando…"
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  env: {
    NEXT_PUBLIC_KEYCLOAK_ISSUER:
      process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER ??
      process.env.KEYCLOAK_ISSUER ??
      DEV_KEYCLOAK_ISSUER,
    NEXT_PUBLIC_KEYCLOAK_CLIENT: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT ?? 'citybox-admin',
    NEXT_PUBLIC_ADMIN_ORIGIN:
      process.env.NEXT_PUBLIC_ADMIN_ORIGIN ??
      (process.env.NODE_ENV === 'production' ? 'https://admin.citybox.com' : 'http://127.0.0.1:3108'),
  },
};

export default nextConfig;
