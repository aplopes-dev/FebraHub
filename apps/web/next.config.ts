import type { NextConfig } from "next";

/* O browser SEMPRE fala com `/api` (mesma origem — é o que permite o cookie
   httpOnly de sessão). Em produção o Next reescreve `/api/*` para a API NestJS
   pela rede interna do Docker (API_INTERNAL_URL), então nenhuma URL de backend
   vaza para o bundle e não há CORS nem preflight no caminho quente.

   `/api/saude` fica de fora do rewrite de propósito: é a rota de healthcheck
   DO CONTAINER DO FRONT (src/app/api/saude/route.ts). Se ela fosse
   encaminhada, o healthcheck do front passaria a medir a saúde da API. */
const interna = process.env.API_INTERNAL_URL;

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    // O logo é o único asset de imagem e vive em /public. Sem host externo.
    remotePatterns: [],
  },
  async rewrites() {
    if (!interna) return [];
    return [
      {
        source: "/api/:caminho((?!saude$).*)",
        destination: `${interna.replace(/\/$/, "")}/:caminho`,
      },
    ];
  },
};

export default nextConfig;
