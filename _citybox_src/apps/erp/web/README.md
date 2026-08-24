# ERP · web (`@citybox/erp-web`)

Backoffice de comércio Citybox — Next.js 16 + `@citybox/ui`.

## Dev

```bash
pnpm --filter @citybox/erp-web dev
# http://127.0.0.1:3107 → redireciona para /visao-geral
```

## Shell

`AppSidebarDual` com `railVariant="expandable"`:
- Sem submenu: coluna 1 com ícone + nome
- Com submenu (Produtos): coluna 1 só ícones + coluna 2 com leaves

Navegação em `src/lib/navigation.ts`. Ver `AGENTS.md`.
