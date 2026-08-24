import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pacotes workspace consumidos via source (.ts/.tsx, sem build) — precisa transpilar.
  transpilePackages: ['@citybox/mui', 'react-leaflet', '@react-leaflet/core'],
  // Worker de compressão de fotos carrega o script via importScripts (público).
  serverExternalPackages: ['browser-image-compression', 'heic2any'],
  // Next 16 bloqueia HMR/chunks de 127.0.0.1 sem isso — React não hidrata em dev.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  // Standalone output para Docker — gera server.js + copia apenas deps necessárias.
  output: 'standalone',
};

export default nextConfig;
