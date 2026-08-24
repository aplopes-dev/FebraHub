# AGENTS.md — `@citybox/clinica-permissions`

> **Para agentes de IA:** Fonte de verdade das **permissões CASL** da vertical
> Clínica. Leia antes de adicionar subject/permissão ou wiring em api/web.
> Ao alterar o catálogo ou a API pública, atualize este arquivo na mesma operação.
> Nunca remova seções — apenas atualize ou adicione.

---

## 1. Identidade

| Campo | Valor |
| ----- | ----- |
| **Nome** | `apps/verticals/clinica/permissions` · `@citybox/clinica-permissions` |
| **Tipo** | Package neutro (TypeScript + `@casl/ability`) — **sem** Nest nem React |
| **Consumidores** | `@citybox/clinica-api`, `@citybox/clinica-web` |
| **Status** | 🟢 Fonte única de autorização da vertical (substitui strings `store.clinic.*`) |
| **Última atualização** | 2026-08-18 — checkbox Equipe **Visualizar prontuário** (`manage` PatientTreatment); IDs CASL inalterados |

**Propósito:** um catálogo e uma `defineAbilityFor` compartilhados — API e Web nunca divergem.

---

## 2. Posição no monorepo

```
apps/verticals/clinica/
├── permissions/   ← VOCÊ ESTÁ AQUI
├── api/           ← PermissionGuard + @RequirePermission(action, subject)
└── web/           ← useAbility / useCan / <Can>
```

Workspace: `apps/verticals/*/permissions` em `pnpm-workspace.yaml`.
Build: `main`/`types` → `dist/` (padrão messaging). Turbo `^build` cobre o package.

**Docker (clinica-api / clinica-web):** os Dockerfiles **devem** copiar
`apps/verticals/clinica/permissions/package.json` no stage `deps` e rodar
`pnpm --filter @citybox/clinica-permissions build` antes do build do app.
Sem isso → `TS2307: Cannot find module '@citybox/clinica-permissions'` (o
`package.json` aponta para `dist/`, que só existe após o `tsc`).

---

## 3. Stack

| Item | Valor |
| ---- | ----- |
| Runtime dep | `@casl/ability` ^6 |
| Zod | **Não** no package — só nos consumidores (forma + `.refine(isValidPermissionId)`) |

---

## 4. Estrutura

```
src/
├── actions.ts              # create|read|update|delete|manage|access
├── subjects.ts             # Vertical|Settings|Team|Stock|Patient*|Financial|Schedule|Sales|Marketing|Dashboard|…
├── types.ts                # Permission, PermissionModule, UserPermissions
├── constants.ts            # PERMISSIONS_MODULES / aliases / expandPermissionIds
├── role-catalog.ts         # CLINIC_ROLES + permissionsForRole + clinicRoleLabel + clinicPermissionLabel(strand)
├── permission-mapper.ts    # expand aliases → { action, subject }
├── ability-factory.ts      # defineAbilityFor / canUser (+ bridge manage)
├── sales-funnel-visibility.ts  # canViewSalesFunnel / filter por ID de checkbox
├── index.ts
└── ability-factory.spec.ts
```

---

## 5. Restrições críticas

1. **Única fonte de verdade** — proibido reintroduzir `store.clinic.*` / `store.scheduling.*` como autorização.
2. **Package agnóstico** — sem `@nestjs/*` nem `react`.
3. **IDs estáveis** (`settings_team`) — o que se persiste / lista em papéis; action/subject podem reorganizar depois.
4. **Owner** — `isOrganizationOwner` → `can('manage', 'all')` (não precisa listar IDs).
5. **Platform admin** — bypass na API (`isPlatformAdmin` / `@RequirePlatformAdmin`), fora do catálogo de loja.
6. **Keycloak `vertical.clinic.view`** — realm role SSO; no Web mapeia para `vertical_access`. Não confundir com permission ID.

---

## 6. Catálogo granular (~68 IDs em 8 módulos UI)

Fonte: `PERMISSIONS_MODULES` em `constants.ts`. UI Equipe: `STORE_PERMISSIONS_MODULES`
(sem `vertical`). Defaults de papel: só `FEATURE_BACKED_PERMISSION_IDS`.

| Módulo UI | Exemplos de IDs | Subject(s) |
| --------- | --------------- | ---------- |
| Agenda | `schedule_view_menu` (access), `schedule_attend` (update), `schedule_view_all` (read), `schedule_create_for_others` (create), `schedule_delete` (delete) | Schedule |
| Configurações Gerais | `settings_team_create` / `_update` / `_inactivate`, `settings_manage`, planos, anamnese, … | Team (CRUD), Settings, ClinicPlan, … |
| Estoque | `stock_access` | **Stock** |
| Ficha do Paciente | `patient_create`, `patient_budget_*`, `patient_file_*`, `patient_anamnesis`, … | Patient, PatientBudget, PatientEvolution, PatientFile, PatientDocument, PatientAnamnesis, PatientTreatment |
| Financeiro | `financial_summary`, `financial_income_*`, `financial_commission_*`, … | Financial |
| Vendas | `sales_access`, `sales_manage_opportunities`, `sales_view_funnel_*` | **Sales** |
| Marketing | `marketing_campaign_create` / `_read` / `_update` / `_finalize` | **Marketing** |
| Dashboard | `dashboard_sales_goals` (update), `dashboard_indicators` (read), `dashboard_tasks` (access) | **Dashboard** |
| (SSO) | `vertical_access` | Vertical |

`marketing_campaign_finalize` → `delete` Marketing (UI “Finalizar”; API `PATCH …/status`).
`marketing_campaign_update` **não** libera finalizar.

`sales_access` → `access` (abre módulo). `sales_manage_opportunities` →
`manage` (criar/editar/excluir/mover **e** ver todos os funis). **Sales fora do
manage-bridge** — só acesso não libera criar oportunidade nem listar funis.

**Visibilidade de funis** (`sales-funnel-visibility.ts` — IDs raw, não CASL `read`
genérico):

| ID | Funil |
|----|-------|
| `sales_view_funnel_schedule` | default `"Funil de Agendamento"` (`readScheduleFunnel`) |
| `sales_view_funnel_sales` | default `"Funil de Venda"` (`readSalesFunnel`) |
| `sales_view_funnel_custom` **ou** `sales_view_clinic_funnels` | qualquer `isDefault: false` |
| `sales_manage_opportunities` | todos |

API `GET /v1/funnels` e oportunidades filtram com `canViewSalesFunnel` /
`filterVisibleSalesFunnels`.

**Aliases legados** (validação + `expandPermissionIds`; **não** na UI):
`patients_manage`, `schedule_manage`, `financial_manage`, `settings_team`,
`marketing_access` → expandem para os IDs finos correspondentes.
`settings_manage` e `stock_access` são **independentes** (Estoque = subject Stock).

**Bridge CASL (1ª leva):** qualquer ability em subject de domínio (exceto
`Patient`, `Schedule`, `Marketing`, **`Sales`**, **`Dashboard`**, **`PatientBudget`**, **`PatientEvolution`**,
**`PatientFile`**, **`PatientPrescription`**, **`PatientCertificate`** e subjects
**Financeiro finos** abaixo) também concede `manage` nesse subject.

**Dashboard (3 IDs, fora do manage-bridge):**
| ID | CASL | Uso |
|----|------|-----|
| `dashboard_indicators` | `read` Dashboard | Indicadores `/` + Relatórios `/relatorios` + `GET /v1/dashboard/*` (exceto tasks) + `GET /v1/reports/*` |
| `dashboard_sales_goals` | `update` Dashboard | `PUT /v1/dashboard/sales-goals`; botão Criar/Editar meta. `GET` sales-goals aceita `read` **ou** `update` |
| `dashboard_tasks` | `access` Dashboard | Tarefas `/tarefas` + `GET /v1/dashboard/tasks/*` |

Defaults: `dentista_admin` → todos os checkboxes (`STORE_PERMISSION_IDS`);
`gerente` → dashboard (3); `contador` → `dashboard_indicators`;
`secretario` → `dashboard_tasks`.

**Financeiro (19 IDs, fora do manage-bridge):**
| ID | CASL |
|----|------|
| `financial_summary` | `read` Financial |
| `financial_income_*` | CRUD FinancialIncome |
| `financial_expense_*` | CRUD FinancialExpense |
| `financial_pay_receive` | `settle` Income **e** Expense |
| `financial_receive_future` / `_retroactive` | `settleFuture` / `settleRetroactive` Income |
| `financial_commission_own` / `_all` / `_pay` | read / update / settle FinancialCommission (`manage`/`create` evitados — no CASL manage implica tudo) |
| `financial_account_create` / `_delete` | create / delete FinancialAccount (create também edita; create|delete concedem `read`) |
| `financial_category_create` / `_delete` | create / delete FinancialCategory — despesa **e** receita (create também edita; create|delete concedem `read`) |

Escrita em income/expense também concede `read` do mesmo subject. Menu Financeiro
abre com views (`*_view`); Visão geral (cards) exige `financial_summary`.
Configurações do Financeiro exige algum de account/category create|delete.

**Orçamentos (`PatientBudget`):** `patient_budget_read` / `_create` / `_update` /
`_delete` / `_approve` (`approve` — ação CASL dedicada, **não** `manage`).
List/get → `read`; POST → `create`; PUT → `update`; DELETE → `delete`;
PATCH status → `approve`.

**Evoluções (`PatientEvolution`):** fora do manage-bridge. `patient_evolution_create`
/ `_update` / `_delete` → create/update/delete. Listagem/histórico na ficha usam
`manage` PatientTreatment (checkbox **Visualizar prontuário** — copy de produto; ID CASL inalterado).

**Arquivos (`PatientFile`):** fora do manage-bridge. `patient_file_create` → create;
`patient_file_manage` → **update** (rótulo “Visualizar e editar”); `patient_file_delete`
→ delete. Qualquer um desses também concede `read` (listar/baixar). Upload/criar pasta
→ `create`; list/breadcrumb/content → `read`; rename/move → `update`; delete → `delete`.

**Receituários / Atestados:** fora do manage-bridge. `patient_prescription_create` →
`create` PatientPrescription; `patient_certificate_create` → `create` PatientCertificate
(todas as rotas do recurso, único checkbox cada). Cards na aba Documentos só com create.
Contratos continuam em `manage` PatientDocument (ainda no bridge).

**Sempre concedidos** (sem checkbox na Equipe):
- `can('access', 'Patient')` — lista de pacientes + item no sidebar;
- `can('read', 'Team')` — listagem em Configurações → Equipe (ações CRUD exigem
  `settings_team_*`);
- `can('read', 'Category')` — listagem/selects de categorias (CRUD exige
  `settings_categories_create` / `_update`). `settings_manage` **não** libera
  cadastrar/editar categorias.

**Ficha do paciente** (`/pacientes/:id/*`): exige `patient_read_personal`
(`can('read', 'Patient')`). Outros IDs da ficha liberam abas/ações, não a rota.
`GET /v1/patients/:id` usa o mesmo gate.

Papéis (`CLINIC_ROLES`): `aluno`, `contador`, `dentista_admin`, `dentista`,
`gerente`, `radiologia`, `secretario`, `vendedor`. Presets em
`permissionsForRole` / `role-catalog.ts`. Removidos: `auxiliar`, `recepcionista`,
`financeiro` (labels legados via `clinicRoleLabel`).

---

## 7. Como usar

### API (Nest)

```ts
@RequirePermission('manage', 'Team')
@Get()
async list(...) { ... }

@RequirePlatformAdmin()  // só operação / M2M
@Post(':storeId/retry')
async retry(...) { ... }
```

`PermissionGuard` (global) lê metadata → `defineAbilityFor({ userId, permissions, isOrganizationOwner })` → `ability.can`.

### Web (React)

```tsx
import { Can, useCan } from '@/features/clinic/permissions';

<Can action="manage" subject="Team">
  <Button>Adicionar membro</Button>
</Can>

const canManageTeam = useCan('manage', 'Team');
```

Fonte das perms de loja: `members/me` → `StoreOption.permissions` + `isOrganizationOwner`.

**UI Equipe (clinica-web):** accordion de permissões inicia fechado; módulos e
checkboxes ordenados alfabeticamente (`pt-BR`). Troca de cargo aplica
`permissionsForRole` e o operador pode ajustar antes de salvar.

### Zod (web / forms)

```ts
import { permissionIdsSchema } from '@/features/clinic/permissions';
// z.array(z.string()).refine(isValidPermissionId) — ver permission-ids.schema.ts
```

Validação semântica na API: `validatePermissionIds` do package no use case (não no DTO).

---

## 8. Checklist — nova permissão

1. Subject novo? → `subjects.ts`
2. Entrada em `PERMISSIONS_MODULES` (`constants.ts`)
3. Papel(is) em `role-catalog.ts` (e rebuild)
4. `pnpm --filter @citybox/clinica-permissions build`
5. `@RequirePermission(action, subject)` nas rotas
6. `<Can>` / `useCan` no Web
7. Teste: 403 sem permissão / sucesso com ela
8. Atualizar este AGENTS.md §6

---

## 9. Persistência (estado e próximo passo)

**Hoje:** `ClinicMember.permissions` (JSON validado) é a fonte de verdade em runtime
(`ClinicScopeGuard`, presenter, `GET /v1/members/me`). Create/update aceitam
`clinics[].permissions` opcional — omitir aplica `permissionsForRole(role)`.
A aba Equipe do Web edita os checkboxes de `STORE_PERMISSIONS_MODULES` e envia
a lista no body. O Web filtra sidebar/rotas com `createClinicNavPermissions`
+ `usesStorePermissionsApi` (não o stub que liberava tudo).

**Próximo:** enforcement fino por rota (sem bridge `manage`); remoção dos aliases
grossos do banco após re-salvar membros; gates UI (`<Can>`) para IDs catalog-only
quando a feature existir.

---

## 10. Problemas a evitar (lições Odontotech)

- Rota de escrita sem `@RequirePermission` (exceto exceções documentadas)
- Duplicar catálogo no front
- Confiar só no JWT no front sem enforcement na API (API sempre fresca via papel)
- Código morto com strings `store.clinic.*`

---

## 11. Scripts

```bash
pnpm --filter @citybox/clinica-permissions build
pnpm --filter @citybox/clinica-permissions typecheck
pnpm --filter @citybox/clinica-permissions test
```

---

## 12. Histórico estrutural

| Data | Mudança | Impacto |
| ---- | ------- | ------- |
| 2026-08-18 | **Copy Equipe:** checkbox `manage` PatientTreatment = **Visualizar prontuário** (não “tratamentos”); IDs CASL iguais | clinica-web Equipe + labels messaging |
| 2026-08-12 | **First-contact sem equipe demo:** removido `ensureDemoClinicTeam`; nova clínica só com OWNER (`dentista_admin`) | clinica-api store-setup |
| 2026-08-04 | **store-setup seed (legado):** worker `ensureDemoClinicTeam` criava dentista+gerente+secretário; OWNER clínico = `dentista_admin` — removido em 2026-08-12 | clinica-api store-setup |
| 2026-08-04 | **Equipe UX:** accordion permissões fechado + ordem alfabética pt-BR (wiki + web) | `invite-professional-permissions-panel` |
| 2026-08-04 | **Dashboard:** módulo UI (3 IDs) + subject fora do manage-bridge; gates API/nav/metas | Equipe + dashboard/reports API + clinica-web |
| 2026-08-04 | **Cargos:** catálogo `aluno`/`contador`/`dentista_admin`/`dentista`/`gerente`/`radiologia`/`secretario`/`vendedor`; remove auxiliar/recepcionista/financeiro; presets por checkbox; horários só aluno+dentistas | Equipe + agenda |
| 2026-08-04 | **Marketing finalizar:** `PATCH …/status` = `delete` Marketing; documentado vs `update` | campaigns + Equipe |
| 2026-08-04 | **Funis CRM:** actions `readScheduleFunnel`/`readSalesFunnel`/`readCustomFunnel`/`readClinicFunnels` + helper `canViewSalesFunnel`; `sales_access` sozinho não lista funis | API funnels/opportunities + clinica-web |
| 2026-08-04 | **Vendas fino:** Sales fora do manage-bridge; `sales_access` ≠ manage; mutações exigem `sales_manage_opportunities` | API opportunities/funnels/labels + clinica-web |
| 2026-08-04 | **Financeiro contas/categorias:** remove `treatment_cost`; `FinancialAccount`/`FinancialCategory` create|delete (19 IDs); create edita; settings UI gated | API accounts/categories + clinica-web settings |
| 2026-08-04 | **Financeiro fino (16 IDs):** fora do manage-bridge; subjects Income/Expense/Commission + settle*; rotas/RequireAny + UI gates | API financial/commissions/dashboard + clinica-web |
| 2026-08-04 | **Receituário/Atestado finos:** fora do manage-bridge; rotas `create` PatientPrescription/Certificate; cards Documentos só com checkbox | API + clinica-web documentos |
| 2026-08-04 | **Arquivos finos:** `PatientFile` fora do manage-bridge; `patient_file_manage`→`update`; read auto com qualquer file_*; rotas create/read/update/delete; UI gates | API patient-files + clinica-web ficha |
| 2026-08-04 | **Evoluções finas:** fora do manage-bridge; create/update/delete; UI Emitir/Adicionar só com `patient_evolution_create` | API + clinica-web |
| 2026-08-04 | **Orçamentos finos:** `PatientBudget` fora do manage-bridge; ação `approve`; rotas read/create/update/delete/approve; UI gates | API budgets + clinica-web ficha |
| 2026-08-03 | **Ficha exige `patient_read_personal`:** gate de rota/lista = `read` Patient (não basta orçamento/CRUD); lista permanece com `access` | `patient-list-access` + route guard |
| 2026-08-03 | **Estoque independente:** removido `PERMISSION_LEGACY_EXTRAS` (`settings_manage` → `stock_access`); checkbox Estoque desmarca sem forçar de volta | expandPermissionIds + Equipe UI |
| 2026-08-03 | **Categorias finas:** CRUD patient/appointment categories → Category create/update; list=read sempre; `settings_manage` não libera | API routes + ability + UI Can |
| 2026-08-03 | **Equipe listagem sempre:** `can('read', 'Team')` sem checkbox; CRUD via `settings_team_*` | ability-factory + Configurações sidebar |
| 2026-08-03 | **Agenda enforcement fino:** Schedule fora do manage-bridge; rotas access/delete + self/others; UI useCan | API scheduling + clinica-web agenda |
| 2026-08-03 | **Marketing:** “Finalizar campanha” (`marketing_campaign_finalize`) no lugar de Excluir | Catálogo Equipe |
| 2026-08-03 | **Marketing:** catálogo só campanha (`create`/`read`/`update`/`delete`); alias `marketing_access` | Equipe + rotas campaigns + nav |
| 2026-08-03 | **Financeiro:** removidos cobranças integradas, NF, Simples Pay (config/saque) e exportar dados do catálogo | UI Equipe + `CLINIC_PERMISSION_IDS` |
| 2026-08-03 | **Catálogo granular (~70 IDs):** 7 módulos UI; subjects Stock/Sales/Marketing + ficha; aliases `patients_manage` etc.; defaults feature-backed | Equipe + nav + 1ª leva API |
| 2026-08-03 | Configurações Gerais: labels UX + `settings_plans` / `settings_anamnesis` / `settings_contracts` (subjects ClinicPlan, AnamnesisTemplate, ContractModel) | Catálogo + rotas API planos/anamnese/contratos |
| 2026-08-03 | Permissões de loja **editáveis** na Equipe; JSON do vínculo é fonte de verdade no guard | create/update `clinics[].permissions` |
| 2026-08-03 | Papéis (`CLINIC_ROLES` + `permissionsForRole`) movidos para o package; Web Equipe usa `STORE_PERMISSIONS_MODULES` | API reexporta; mocks de checkbox removidos |
| 2026-08-03 | Package criado; cutover CASL; removidas strings `store.clinic.*` | API + Web |
