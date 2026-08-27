import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const monorepoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // npm workspaces: o lockfile fica na raiz do monorepo e o `next` é hoisted
  // para `node_modules/` de lá. Sem isto, o Turbopack pode inferir a raiz errada
  // e servir 404 em rotas que existem no App Router.
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
