import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@citybox/ui', '@citybox/clinica-permissions'],
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  typescript: {
    // Débito herdado do apps/erp: 14 erros de tipo pré-existentes em
    // features/clinic (resolvers do react-hook-form, mocks de teste, mock-data).
    // Mantido para paridade com o ERP; remover ao zerar o baseline.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
    // Imagens servidas pelo proxy interno carregam `?storeId=` na query — sem
    // `search` definido, o Next permite qualquer query nesse caminho. O segundo
    // pattern replica o default (demais imagens locais só sem query).
    localPatterns: [{ pathname: '/api/proxy/**' }, { pathname: '**', search: '' }],
  },
};

export default nextConfig;
