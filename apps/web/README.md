# web (`@febrahub/web`)

Front do FebraHub — Next.js 16 + React 19 + MUI 9.

## Dev

```bash
pnpm --filter @febrahub/web dev
# http://127.0.0.1:3107 → redireciona para /visao-geral
```

O app está em fase de triagem e roda **sem backend e sem autenticação**: os
proxies respondem com dados de demonstração enquanto `API_URL` não estiver
definida. Detalhes em [`AGENTS.md`](AGENTS.md).

## Shell

Sidebar dupla (`DualDashboardLayout`, `railVariant="expandable"`):

- sem submenu: coluna 1 com ícone + nome;
- com submenu: coluna 1 só com ícones + coluna 2 com os itens.

A navegação é declarada em `src/lib/navigation.ts`.
