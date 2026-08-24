# Citybox PDV

Frontend PWA do ponto de venda Citybox (`@citybox/pdv`), compartilhado por **food** e **varejo**.

## Desenvolvimento

```bash
# na raiz do monorepo
pnpm install
pnpm --filter @citybox/pdv dev   # http://localhost:3109
```

## PWA

- Manifest: `src/app/manifest.ts`
- Service Worker (Serwist): `src/app/sw.ts` → `/serwist/sw.js`
- Offline: `/~offline`

No Chrome (localhost): DevTools → Application → Manifest / Service Workers → Install.

Documentação canônica: [`AGENTS.md`](./AGENTS.md).
