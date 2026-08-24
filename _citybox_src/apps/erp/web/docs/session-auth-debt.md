# Sessão BFF — backoffice

## Arquitetura atual

| Camada | Responsabilidade |
|--------|------------------|
| Cookies `httpOnly` | JWTs (`aplopes_bo_access`, `aplopes_bo_refresh`, `aplopes_bo_id`) — path `/` |
| BFF Next.js | `/api/auth/*` (token, refresh, session, logout) + proxies `/api/proxy/core/*`, `/api/proxy/food/*` |
| `SessionProvider` | Poll `/api/auth/session` (~120s + jitter); metadados públicos em React state |
| `session-bridge` | Refresh e `patchUser` registrados pelo provider — usado por `auth-fetch` e `profile-api` |
| `memorySession` | Espelho interno sincronizado pelo provider — **não** exposto via `loadSession()` |
| `PermissionsProvider` | Permissões coarse da plataforma (`vertical.*.view`, `platform.admin`) via `usePermissions()` |
| `localStorage` | Apenas loja ativa (`aplopes-active-store`) — **não** persiste sessão |

Mitigações: PKCE + `state` no OAuth; CSP; refresh só via cookie; `accessTokenGrantsBackoffice` no servidor.

APIs cookie-based (`food-api`, `profile-api`, `stores-api`) usam `fetchWithSession` sem parâmetro `session`; guards ficam nos componentes/contexts (`status === 'authenticated'`).

## Limitação multi-pod

`auth-server.ts` mantém `refreshInFlight` e `refreshCache` **in-process** (singleton por pod Next.js).

- Dedupe de refresh funciona **dentro do mesmo pod**
- Com **N réplicas** sem sticky session, pods distintos podem chamar o Keycloak com o mesmo refresh token e invalidar tokens uns dos outros se rotação/revogação estiver agressiva

### Requisito operacional

Manter **`revokeRefreshToken: false`** no realm/client `citybox-backoffice` até:

- cache distribuído (Redis) para refresh dedupe, **ou**
- session affinity (sticky sessions) no ingress

Ver também [`infra/keycloak/README.md`](../../../../infra/keycloak/README.md).

## Roadmap

1. ~~JWTs em cookie httpOnly~~ — feito
2. ~~Proxies BFF com Bearer injetado server-side~~ — feito
3. Cache distribuído de refresh ou sticky sessions para multi-réplica
4. ~~Reduzir dependência de `loadSession()` imperativo~~ — feito (`session-bridge`, APIs sem `session` param)
5. ~~Hook reativo de permissões da plataforma (`usePermissions`)~~ — feito (`PermissionsProvider`)

Permissões granulares por loja/vertical (ex.: Food ERP) permanecem em `useVerticalPermissions()` / `VerticalPermissionsProvider`.

Rastreado em [city.citybox.com/evolucao](https://city.citybox.com/evolucao) → Gaps & débitos → **Sessão httpOnly (BFF + cookie)**.
