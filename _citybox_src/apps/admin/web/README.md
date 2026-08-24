# admin-web — Admin plataforma

Next.js 16 para **operadores Citybox** (`platform_admin`). Produção: `admin.citybox.com` (:3108).

Consome `admin-api` via proxy `/api/proxy/admin` — tokens JWT em cookies httpOnly (Keycloak client `citybox-admin`).

## Telas

| Rota | Função |
|------|--------|
| `/` | Dashboard |
| `/municipalities` | Listagem municípios |
| `/municipalities/[id]` | Detalhe orgs/lojas |
| `/onboarding` | Wizard novo município |
| `/onboarding/stores` | Nova loja |
| `/config/billing` | Planos SaaS |
| `/config/flags` | Feature flags |
| `/finance/settlements` | Repasse (read-only) |
| `/audit` | Auditoria admin |

## Como usar

```bash
pnpm --filter @citybox/admin-web dev   # :3108
```

Lojistas usam `backoffice.citybox.com` (:3107) — não este app.

## Referências

- [apps/admin/api/README.md](../api/README.md)
- [apps/README.md](../README.md)
