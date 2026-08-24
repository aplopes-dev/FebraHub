# AGENTS.md — `@citybox/beautiful-permissions`

> **Para agentes de IA:** Fonte de verdade das **permissões CASL** da vertical
> Beautiful. Leia antes de adicionar subject/permissão ou wiring em api/web.
> Ao alterar o catálogo ou a API pública, atualize este arquivo na mesma operação.
> Nunca remova seções — apenas atualize ou adicione.

---

## 1. Identidade

| Campo | Valor |
| ----- | ----- |
| **Nome** | `apps/verticals/beautiful/permissions` · `@citybox/beautiful-permissions` |
| **Tipo** | Package neutro (TypeScript + `@casl/ability`) — **sem** Nest nem React |
| **Consumidores** | `@citybox/beautiful-api`, `@citybox/beautiful-web` |
| **Status** | 🟢 Fonte única de autorização da vertical (Fase G) |
| **Última atualização** | 2026-08-20 |

**Propósito:** um catálogo e uma `defineAbilityFor` compartilhados — API e Web nunca divergem.

---

## 2. Posição no monorepo

```
apps/verticals/beautiful/
├── permissions/   ← VOCÊ ESTÁ AQUI
├── api/           ← PermissionGuard + @RequirePermission(action, subject)
└── web/           ← useAbility / useCan / <Can>
```

Workspace: `apps/verticals/*/permissions` em `pnpm-workspace.yaml`.
Build: `main`/`types` → `dist/`. Turbo `^build` cobre o package.

---

## 3. Stack

| Item | Valor |
| ---- | ----- |
| Runtime dep | `@casl/ability` ^6 |
| Testes | `node --import tsx --test` (`pnpm test`) |

---

## 4. Estrutura

```
src/
├── actions.ts
├── subjects.ts
├── types.ts
├── constants.ts            # PERMISSIONS_MODULES / aliases / validatePermissionIds
├── role-catalog.ts         # STORE_ROLES + permissionsForRole + SCHEDULABLE_STORE_ROLES
├── permission-mapper.ts
├── ability-factory.ts      # defineAbilityFor / canUser
├── index.ts
└── ability-factory.spec.ts
```

---

## 5. Restrições críticas

1. **Única fonte de verdade** — papéis e IDs CASL vivem aqui (API reexporta `store-role.catalog`).
2. **Package agnóstico** — sem `@nestjs/*` nem `react`.
3. **IDs estáveis** — o que se persiste em `StoreMember.permissions`.
4. **Owner da org** — `isOrganizationOwner` → `can('manage', 'all')`.
5. **Sempre concedidos (sem checkbox):** `read` Team, `read` Category.
6. **Agenda (colunas):** `SCHEDULABLE_STORE_ROLES = ['profissional']` — permissão controla *acesso*; papel define *quem* aparece.
7. **Bridge legado:** leitura efetiva com `permissions: []` → `permissionsForRole(role)` (API).

---

## 6. Catálogo (subjects / IDs)

| Módulo UI | IDs (exemplos) | Subject |
|-----------|----------------|---------|
| Vertical (SSO) | `vertical_access` | Vertical |
| Agenda | `schedule_view_menu`, `schedule_attend`, `schedule_view_all`, `schedule_create_for_others`, `schedule_delete` | Schedule |
| Clientes | `client_*` | Client |
| Catálogo · Serviços | `service_*` | Service |
| Catálogo · Estoque | `stock_access`, `product_*`, `stock_adjust` | Stock / Product |
| Equipe | `settings_team_create` / `_update` / `_inactivate` | Team |
| Configurações | `settings_manage`, `settings_categories_*` | Settings / Category |
| Financeiro | `financial_access` | Financial |

UI Equipe: `STORE_PERMISSIONS_MODULES` (sem `vertical`).

**Presets `permissionsForRole`:**

| Role | Preset |
|------|--------|
| `profissional` | agenda (menu+attend+delete), clients CRUD, service/product read |
| `recepcao` | agenda (menu+view_all+create_for_others), clients CRUD, service_read |
| `gerente` | todos `STORE_PERMISSION_IDS` |
| `owner` (legado, só leitura) | todos `STORE_PERMISSION_IDS` — não está em `STORE_ROLES` |

**Manage-bridge (1ª leva):** subjects `Settings` e `Stock` — qualquer ability concede também `manage`.

---

## 7. Variáveis de ambiente

Nenhuma (package puro).

---

## 8. Scripts

```bash
pnpm --filter @citybox/beautiful-permissions build
pnpm --filter @citybox/beautiful-permissions test
pnpm --filter @citybox/beautiful-permissions typecheck
```

---

## 9. Módulos / API pública

Exportados em `index.ts`: actions/subjects types, constants, `STORE_ROLES`,
`permissionsForRole`, `defineAbilityFor`, `validatePermissionIds`, etc.

---

## 10. Decisões de arquitetura

- Espelha Clínica (`@citybox/clinica-permissions`) com subjects do Beautiful.
- Papéis lean: `profissional` | `recepcao` | `gerente`. O responsável da org é `organizationRole=OWNER`, não um cargo da loja.
- Persistência em `StoreMember.permissions` (JSON string[]).

---

## 11. Contexto para a IA

- Ao adicionar ID: atualize `constants.ts` + presets em `role-catalog.ts` + testes + AGENTS.
- API: `resolveStorePermissions` / `effectiveStorePermissions` em `members/domain/`.
- Web: `features/permissions/` + `lib/beautiful-nav-permissions.ts`.

---

## 12. Histórico de mudanças estruturais

| Data | Mudança | Impacto |
|------|---------|---------|
| 2026-08-20 | Remove `owner` de `STORE_ROLES`; adiciona `gerente` (full preset); `permissionsForRole('owner')` só para leitura de vínculos antigos | API GET roles + presets |
| 2026-08-11 | Package criado (Fase G) — catálogo granular + presets + ability | API PermissionGuard + Web Can/nav/Equipe |
