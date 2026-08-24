# AGENTS.md — ERP · Feature Shared (UI compartilhada entre verticais)

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre a **camada de UI
> compartilhada entre as verticais do ERP** (`apps/verticals/clinica/web/src/features/shared/`).
> Leia-o integralmente antes de qualquer ação. Ao modificar código nesta pasta,
> atualize as seções relevantes na mesma operação. Nunca remova seções — apenas
> atualize ou adicione.
>
> **Escopo deste arquivo:** o que é **transversal** às verticais (food, varejo, clinic).
> Aqui mora o pouco que NÃO é específico de uma vertical mas também NÃO pertence ao
> design system `@citybox/ui` (que é cross-app). Shell, proxies, auth e multi-vertical
> em `apps/verticals/clinica/web/AGENTS.md`.

---

## 1. Identidade do Módulo

| Campo            | Valor                                                        |
| ---------------- | ------------------------------------------------------------ |
| **Nome**         | `apps/verticals/clinica/web/src/features/shared` — UI compartilhada das verticais |
| **Tipo**         | Feature slice transversal (frontend) do ERP                  |
| **Conteúdo**     | `components/` (ErpPage) · `team/` (equipe — **API real**) · `cep/` · `fiscal/` (CPF/CNPJ) · `pages/` (vazio) |
| **Status**       | 🟢 `team` real (**clinica-api**, `/v1/members`) · `components` mínimo · `fiscal` utils |
| **Última atualização deste arquivo** | 2026-07-15                              |

**Propósito em uma linha:**
Peças de UI **reutilizadas por todas as verticais**: o wrapper de página padrão
(`ErpPage`) e o **módulo de equipe** (`team/`) — tipos, serviço, hook React Query e o
diálogo de credenciais — que food, varejo e clinic consomem em comum.

> **Regra de fronteira:** só entra em `shared/` o que é genuinamente transversal e
> específico do **ERP**. Primitivos de UI cross-app vão para `@citybox/ui`. Lógica de
> uma vertical fica na sua feature. Em dúvida, **não** colocar aqui.

---

## 2. Posição no ERP

```
apps/verticals/clinica/web/src/features/
├── food/    · varejo/ · clinic/    ← verticais (consumidoras)
└── shared/                          ← VOCÊ ESTÁ AQUI
    ├── components/                  ← ErpPage (wrapper de página)
    ├── team/                        ← módulo de equipe compartilhado (API real)
    └── pages/                       ← (vazio — cada vertical tem suas próprias páginas)
```

**Consumido por:** food, varejo e clinic (via `@/features/shared/...`).
**Depende de:** `@citybox/ui` (PageHeader, Dialog, Button…), `features/clinic/shared/api`
(`clinicaFetch` → proxy clínica), `lib/store-context` (`useStore`), TanStack Query, `sonner`.

---

## 3. Estrutura de Pastas

~9 arquivos (excl. testes).

```
features/shared/
├── components/
│   ├── erp-page.tsx              ← <ErpPage title description actions> { children } — wrap de PageHeader + space-y-6
│   └── index.ts
├── cep/                          ← lookup BrasilAPI via route handler local `/api/cep` (`useCepAddressLookup`)
├── fiscal/
│   ├── cnpj.ts (+ test)          ← isValidCnpj, formatCnpj (fornecedores / settings)
│   └── cpf.ts (+ test)           ← isValidCpf, formatCpf (CRM varejo; reutilizável)
├── pages/                        ← VAZIO (placeholder/erro ficam em cada vertical)
└── team/
    ├── types.ts                  ← TeamMember, TeamRole, TeamMemberStatus, *FormValues, ProvisionalCredentials…
    ├── query-keys.ts             ← teamKeys (store-scoped: all/members/roles)
    ├── team-members.service.ts   ← CRUD via clinicaFetch (API REAL) + mapeamento DTO→TeamMember
    ├── team-members.service.test.ts
    ├── use-team-members.ts       ← hook React Query (queries + mutations + toasts)
    ├── components/
    │   └── team-member-credentials-dialog.tsx  ← exibe usuário+senha provisória (copiar)
    └── index.ts                  ← reexporta tipos, serviço, hook e o dialog
```

---

## 4. Componentes e Módulos

### 4.1 `ErpPage` (`components/erp-page.tsx`)
Wrapper de página padrão das verticais. Renderiza `PageHeader` (`@citybox/ui/organisms`)
+ `space-y-6` e os `children` abaixo.
```tsx
type ErpPageProps = { title: string; description?: string; actions?: ReactNode; children: ReactNode };
// Usado em: food (menus/products/placeholder), varejo (dashboard/placeholder), clinic (dashboard/placeholder).
```

### 4.1.1 `data-table-styles.ts` + `ErpDataTableActionsHeader`
Estilos canônicos do `DataTable` no ERP (`erpDataTableStyleProps`). **Sem scroll horizontal:**
`table-fixed`, `max-w-0` nas células de dados; conteúdo longo com `truncate`/`line-clamp`. **Coluna Ações:**
cabeçalho visível via `ErpDataTableActionsHeader`, `min-w-14`, `overflow-visible`, alinhamento à direita.
Célula do menu: `ERP_DATA_TABLE_ACTIONS_CELL_CLASS`. Desktop + card list no mobile quando aplicável.

### 4.2 `team/` — módulo de equipe (**API REAL**)
CRUD de membros contra a **clinica-api** (`/v1/members`), escopado por clínica.

> **Mudou na Fase 9 (PLAT-001).** Antes ia para `platform-api` em
> `/v1/backoffice/stores/:id/team`. Os `Member` passaram a ser da vertical na Fase 4, e o
> backfill preservou `platform.store_members.id` como PK — logo os `memberId` já gravados
> em agendamentos/orçamentos/comissões continuam válidos.

| Peça | Papel |
| ---- | ----- |
| `types.ts` | Contrato de UI: `TeamMember` (`status`: `active` \| `pending` + campos opcionais `disabledAt`/`provisionalExpiresAt`), `TeamRole`, `TeamMemberFormValues` (inclui `permissions[]` CASL), `CreatedTeamMember` (inclui `temporaryPassword`), `ProvisionalCredentials` |
| `team-members.service.ts` | `listTeamMembers` · `listTeamRoles` · `createTeamMember` · `updateTeamMember` · `updateTeamMemberStatus` · `resetTeamMemberPassword` · `deleteTeamMember` — todos via `clinicaFetch`. O papel exibido é o do vínculo da **clínica ativa**, não `clinics[0]` (membro multi-clínica pode ter papel diferente por unidade) |
| `use-team-members.ts` | Hook React Query: lê `storeId` (= `clinicId`) de `useStore()`; expõe `members/roles/isLoading` + mutations (`createMember/updateMember/setMemberStatus/removeMember/resetPassword`); invalida por `teamKeys`; toasts via `sonner`; erros normalizados em `ClinicaApiError` |
| `components/team-member-credentials-dialog.tsx` | Dialog que mostra **uma única vez** usuário + senha provisória, com botões de copiar |

**Endpoints (via proxy clínica — escopo em `X-Store-Id`, resolvido pelo `ClinicScopeGuard`):**
```
GET    /v1/members
GET    /v1/members/roles          ← catálogo de papéis da vertical (sem escopo)
GET    /v1/members/me             ← descoberta de acesso no login (sem escopo)
POST   /v1/members
PUT    /v1/members/:memberId      ← reescreve o conjunto de clínicas/papéis (não é delta)
PATCH  /v1/members/:memberId/status              ← active | disabled
POST   /v1/members/:memberId/reset-password
DELETE /v1/members/:memberId      ← soft delete (preserva histórico clínico)
```

> **Clinic:** status `inactive`/`expired` são derivados em `features/clinic/.../clinic-team-member-status.ts` a partir de `disabledAt`/`provisionalExpiresAt`. O `TeamMemberStatus` shared permanece só `active`|`pending` para não quebrar food/varejo.

### 4.3 Como cada vertical reusa o `team`
- **food** (`modules/team`): consome `useTeamMembers` + tipos; UI própria (grid/tabela, busca, filtros).
- **varejo** (`modules/team`): idem food — grid/tabela, toolbar, badges; forms **legados** (useState).
- **clinic** (`modules/settings/team`): **estende** — usa `useTeamMembers` para o CRUD base e adiciona
  permissões granulares (mock) + horários de atendimento (`service-hours.service.ts`).

> O **CRUD base é o mesmo (real)**; cada vertical só varia a apresentação. Não duplicar o serviço/hook.

---

## 5. Restrições Críticas

> Herdam as restrições gerais do ERP (`apps/verticals/clinica/web/AGENTS.md` §5). Específicas daqui:

### 5.1 Só entra em `shared/` o que é transversal ao ERP
```
Critério: usado por 2+ verticais E específico do ERP (não cabe em @citybox/ui).
Primitivo de UI cross-app → @citybox/ui. Lógica de 1 vertical → a feature dela.
```

### 5.2 `team` é clinic-scoped via `clinicaFetch`
```ts
// O escopo vai no header X-Store-Id (= clinicId), NÃO na URL. Quem autoriza é o
// ClinicScopeGuard na clinica-api — o proxy não valida mais membership.
// storeId vem de useStore(); queries com enabled implícito ao ter storeId.
import { clinicaFetch } from '@/features/clinic/shared/api';
```

### 5.3 Credenciais provisórias aparecem uma vez
```
A senha provisória (createMember / resetPassword) só é exibida no TeamMemberCredentialsDialog
no momento da ação. Não persistir nem logar. Reset gera nova senha.
```

---

## 6. Padrões de Código

### 6.1 Hook compartilhado (React Query + toasts)
```ts
const { members, roles, isLoading, createMember, updateMember, setMemberStatus, removeMember, resetPassword } = useTeamMembers();
// mutations retornam Promise (await no container); onSuccess invalida teamKeys e dispara toast.
// Desativar membro: setMemberStatus(id, 'inactive') — traduzido para `disabled` na API;
// não apaga a linha e desabilita o usuário no Keycloak (senão o token vale até expirar).
```

### 6.2 Container da vertical orquestra; shared fornece dados
```
A página de equipe de cada vertical é o container (estado de UI + componentes próprios);
o shared fornece tipos + dados (hook) + o dialog de credenciais. Mantém a apresentação
desacoplada do acesso a dados.
```

> **Formulários:** os forms de equipe vivem em cada vertical e hoje usam o padrão **legado**
> (useState + validate manual). Ao tocá-los, migrar para **RHF + Zod** (padrão canônico do ERP).
> O `shared/team` em si não tem formulário — só o dialog de credenciais.

---

## 7. Contexto para a IA

### O que NÃO fazer
- Não colocar em `shared/` algo usado por **uma só** vertical, nem um primitivo que caberia em `@citybox/ui`.
- Não duplicar o CRUD de equipe nas verticais — usar `useTeamMembers` e os tipos do shared.
- Não enviar `X-Store-Id` no fluxo de equipe — escopo da loja vai na **URL** (proxy platform).
- Não persistir/loggar a senha provisória — exibir só no dialog.
- Não recriar `ErpPage`/`PageHeader` localmente.

### Ao adicionar algo ao `shared`
1. Confirmar que é **transversal** (2+ verticais) e específico do ERP (não cabe em `@citybox/ui`).
2. Componente puro → `components/` (export no `index.ts`). Módulo com dados → pasta própria com
   `types.ts` + `query-keys.ts` + `*.service.ts` (via `clinicaFetch`) + `use-*.ts` (React Query).
3. Reexportar pelo `index.ts` do submódulo; consumir nas verticais via `@/features/shared/<x>`.
4. Atualizar este `AGENTS.md`.

---

## 8. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data | Mudança | Impacto |
| ---- | ------- | ------- |
| 2026-07-15 | Util CPF em `fiscal/cpf.ts` (format/validate) — espelho de `cnpj.ts`; 1º uso VAREJO-060 | CRM varejo; reutilizável por clinic no futuro |
| 2026-07-10 | Soft-status de equipe: `updateTeamMemberStatus` + campos `disabledAt`/`provisionalExpiresAt`; clinic deriva `inactive`/`expired` | Shared mantém `status` só `active`\|`pending` (food/varejo intactos) |
| 2026-06-29 | Arquivo `AGENTS.md` (UI feature shared) criado | — |
