# AGENTS.md — `@citybox/imoveis-permissions`

> Fonte de verdade das **permissões CASL** da vertical Imóveis. Package neutro
> (TypeScript + `@casl/ability`) — sem Nest nem React. Consumidores:
> `@citybox/imoveis-api`, `@citybox/imoveis-web`.

| Campo | Valor |
| ----- | ----- |
| **Pacote** | `@citybox/imoveis-permissions` |
| **Path** | `apps/imoveis/permissions` |
| **Última atualização** | 2026-08-06 |

## Catálogo (1ª leva)

IDs estáveis = checkboxes da Equipe (`leads`, `properties`, `calendar`, …).
Papéis: `admin` (Administrador), `broker` (Administrador/Corretor),
`affiliated` (Corretor filiado), `assistant` (Assistente) →
`permissionsForRole` / `booleanPermissionsForRole`.

| ID | Subject | Uso |
|----|---------|-----|
| `vertical_access` | Vertical | SSO / gate do app |
| `leads` | Lead | CRM + deals (`/v1/deals/*`) |
| `properties` | Property | Imóveis |
| `calendar` | Calendar | Agenda + lembretes |
| `transactions` | Transaction | Negócios formais |
| `finance` | Finance | Financeiro (admin-only por default) |
| `settings` | Settings | Sistema |
| `users` | Team | Equipe |
| `billing` | Billing | Assinatura |
| `integrations` | Integration | Portais |

Keycloak: `vertical.imoveis.view` (realm role) — **não** é permission ID.

**Finance** fica fora do manage-bridge — enforcement fino por rota (como clínica).

## Scripts

```bash
pnpm --filter @citybox/imoveis-permissions build
pnpm --filter @citybox/imoveis-permissions test
```

## Status de cutover

- **API:** rotas autenticadas usam `@RequirePermission(action, subject)` + `ImoveisScopeGuard`.
- **Web:** `useAbility` / `useCan` / nav gates em `features/imoveis/permissions/`.
