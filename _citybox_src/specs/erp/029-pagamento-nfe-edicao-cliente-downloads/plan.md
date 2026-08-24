# Implementation Plan: Pagamento real na NF-e, edição de cliente e downloads fiscais

**Branch**: `029-pagamento-nfe-edicao-cliente-downloads` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/erp/029-pagamento-nfe-edicao-cliente-downloads/spec.md`

## Summary

Três frentes independentes, na ordem do prompt de origem (B1 → B3 → B2 — B3 antes de B2 por
risco técnico maior):

- **US1/B1 (P1)**: a NF-e sai sempre com `tPag=99` sem `xPag` (rejeição SEFAZ 441). Resolver o
  código fiscal real a partir de `SaleOrderPayment.methodId → PaymentMethod.fiscalCode`, enviar
  **um `detPag` por pagamento** (a fiscal-api já suporta isso — `payments[]` no XML builder,
  hoje só populado pela NFC-e; falta a rota `POST /v1/nfe` da fiscal-api aceitar o mesmo campo e
  o erp-api populá-lo), e **bloquear a emissão** (decisão do clarify) quando alguma forma usada
  não tiver `fiscalCode` configurado.
- **US2/B3 (P2)**: baixar XML/DANFE (NF-e, em Vendas + Pedidos de venda) e XML/DANFSE (NFS-e, só
  no Facilita NF-e — decisão do clarify). As rotas já existem na fiscal-api; falta (a) o
  erp-api persistir o `documentId` da fiscal-api (hoje descartado, mesma classe de gap do
  `errorCode`/`errorMessage` da spec 028), (b) a listagem de Vendas/Pedidos expor esse vínculo,
  e (c) o proxy `/api/proxy/fiscal` resolver o dono de `/v1/nfe/:id[...]`/`/v1/nfse/:id[...]`
  antes de elevar para o token de serviço (via `GET /v1/fiscal-documents/:id`, que já expõe
  `companyId`).
- **US3/B2 (P3)**: tela `/clientes/[id]`, reaproveitando `CustomerFormView` — molde idêntico ao
  de `suppliers`/`carriers`/`branches`.

## Technical Context

**Language/Version**: TypeScript 5.8 (strict)

**Primary Dependencies**: NestJS 11 (erp-api, fiscal-api), Next.js 16 + React 19 +
`@citybox/mui` (erp-web), Prisma (erp-api), TanStack Query (erp-web)

**Storage**: PostgreSQL — migration em `nfe_issuances`/`nfse_issuances` (novo campo
`fiscal_document_id`, nullable) para US2/B3. Nenhuma migration para US1/B1 ou US3/B2.

**Testing**: Jest in-memory (erp-api, fiscal-api); sem harness de teste frontend em
`apps/erp/web` (D0, gap pré-existente documentado)

**Target Platform**: Web (`erp-web` :3107) + API (`erp-api` :3114) + `fiscal-api` (:3116) — as
três frentes tocam pelo menos duas dessas três peças cada

**Project Type**: Web application (monorepo — `apps/erp/web` + `apps/erp/api` +
`services/fiscal-api`)

**Constraints**: Zero `@citybox/ui`/`lucide-react` nas telas tocadas; ícones só
`@mui/icons-material`; sem cor hardcoded; botão que dispara requisição precisa de `loading`;
proxy fiscal deve permanecer fail-closed (documento cujo dono não se resolve continua saindo
com o token do usuário, nunca eleva "só para garantir")

**Scale/Scope**: 3 user stories independentes; toca `nfe-issuance`/`nfse-issuance` (erp-api),
`nfe`/`nfse` (fiscal-api), `customers`/`sales`/`sales-orders`/`facilita-nfe` (erp-web), e o
proxy `/api/proxy/fiscal`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Docs-as-Code | `apps/erp/web/AGENTS.md`, `apps/erp/api/AGENTS.md`, `services/fiscal-api/AGENTS.md` atualizados na mesma operação |
| II. Backend-driven search/pagination | N/A — nenhuma listagem nova; a listagem de Vendas/Pedidos ganha um campo, não muda paginação |
| III. pnpm único | Sem dependências novas |
| IV. Atomic Design / `@citybox/ui` | Telas 100% `@citybox/mui`; edição de cliente reaproveita `CustomerFormView` já existente — zero componente novo de design system |
| V. Tenant isolation / schema próprio | Migration pequena e aditiva em `nfe_issuances`/`nfse_issuances` (schema `erp`, já tenant-scoped) — `database-reviewer` obrigatório. `fiscal-api` não ganha migration (usa campos já existentes de `FiscalDocument`) |

**Nenhuma violação.** O ponto de maior atenção arquitetural é o proxy fiscal (US2/B3) — tratado
em D3 abaixo com o mesmo padrão fail-closed já estabelecido nas rotas de sequência/CSC.

## Project Structure

### Documentation (this feature)

```text
specs/erp/029-pagamento-nfe-edicao-cliente-downloads/
├── plan.md              # este arquivo
├── spec.md              # requisitos + clarificações
├── checklists/requirements.md
└── tasks.md             # gerado por /speckit-tasks
```

### Source Code (arquivos tocados, por frente)

```text
# US1/B1 — meio de pagamento real
apps/erp/api/src/modules/nfe-issuance/
├── domain/providers/fiscal-api-client.interface.ts   # IssueNfeRequest.payments[] (não mais paymentMethodCode único)
├── infrastructure/providers/http-fiscal-api-client.ts # monta o body com payments[]
├── application/
│   ├── dtos/issue-nfe.dto.ts                          # remove o comentário desatualizado
│   └── use-cases/issue-nfe/issue-nfe.use-case.ts       # resolve payments reais, bloqueia sem fiscalCode
apps/erp/api/src/modules/finance/payment-methods/
└── domain/repositories/payment-method.repository.interface.ts  # findByIds (novo, evita N+1)
services/fiscal-api/src/modules/nfe/
├── infrastructure/http/routes/issue-nfe/issue-nfe.dto.ts  # payments[] opcional (mesmo shape do NFC-e)
└── application/use-cases/issue-nfe/issue-nfe.use-case.ts  # repassa payments[] pro XML builder

# US2/B3 — downloads
apps/erp/api/prisma/schema.prisma                      # NfeIssuance/NfseIssuance ganham fiscalDocumentId
apps/erp/api/prisma/migrations/<ts>_nfe_nfse_fiscal_document_id/
apps/erp/api/src/modules/nfe-issuance/ (+ nfse-issuance espelho)
├── domain/entities/nfe-issuance.entity.ts              # +fiscalDocumentId
├── domain/providers/fiscal-api-client.interface.ts     # IssueNfeResult +documentId
├── infrastructure/providers/http-fiscal-api-client.ts  # lê documentId da resposta
├── infrastructure/database/prisma-nfe-issuance.repository.ts
└── infrastructure/http/routes/shared/nfe-issuance.presenter.ts
apps/erp/api/src/modules/sales/
└── infrastructure/http/routes/shared/sale-order.presenter.ts  # lista expõe nfeIssuance {id, status, fiscalDocumentId}
apps/erp/web/src/app/api/proxy/fiscal/[...path]/route.ts  # resolvedor de dono para /v1/nfe|nfse/:id[...]
apps/erp/web/src/features/
├── sales/{api,components,pages}/*                      # ação "Baixar XML"/"Baixar DANFE" no RowActionsMenu
├── sales-orders/{api,components,pages}/*                # idem
└── facilita-nfe/{api,components}/*                      # ação de baixar na listagem "Emitido"

# US3/B2 — edição de cliente
apps/erp/web/src/app/(app)/clientes/[id]/page.tsx        # novo
apps/erp/web/src/features/customers/
├── pages/customer-edit-page.tsx                         # novo
├── components/customer-list-table.tsx (ou equivalente)   # linha/menu leva a /clientes/:id
└── hooks/use-customer-queries.ts                         # useCustomerQuery(id) se não existir
```

**Structure Decision**: segue a árvore de módulos já existente nas três apps. Nenhum diretório
novo além do padrão `[id]` já usado por `suppliers`/`carriers`/`branches` (US3) e da migration
pequena (US2).

## Fase 0 — Decisões (research)

### D1 — Meio de pagamento: `payments[]` por pagamento, não um `paymentMethodCode` único

**Achado central**: a fiscal-api **já suporta múltiplos `detPag`** — `nfe-xml.builder.ts` aceita
`payments?: readonly { method, amount, description?, cardIntegration? }[]`, hoje só preenchido
pelo fluxo de NFC-e (`buildNfcePayments`). A rota `POST /v1/nfe` (`issue-nfe.dto.ts`) só expõe
`paymentMethodCode` (string única, legado) — falta estender o DTO para aceitar `payments[]`
também, mesma forma que o builder já espera.

**Decisão**: erp-api resolve `payments[]` a partir de `SaleOrder.payments[]` (cada um com
`amountCents` → `amount` em reais, `methodId` → `PaymentMethod.fiscalCode` → `method`); a
fiscal-api passa a aceitar `payments[]` opcional em `POST /v1/nfe` (mesmo shape do builder) e
repassá-lo ao XML builder sem transformação — o `paymentMethodCode` legado continua existindo no
DTO (não quebra chamadores antigos), mas o `IssueNfeUseCase` do erp-api passa a sempre mandar
`payments[]`.

**Bloqueio por forma sem `fiscalCode`** (FR-003, decisão do clarify): antes de montar `payments[]`,
o use-case resolve `PaymentMethod` de cada `methodId` único do pedido; se algum não tiver
`fiscalCode`, lança `FiscalApiEmissionError` nomeando a forma e apontando para
`/configuracoes/formas-pagamento` — **antes** de qualquer chamada à fiscal-api (mesmo padrão de
"falhar antes de qualquer efeito colateral" já usado para PRODUCTION/endereço ausente).

**Batch lookup**: `PaymentMethodRepository` não tem `findByIds` — adicionar (evita N chamadas
`findById` para pedidos com N formas distintas; a maioria tem 1-2, mas a interface já existe
para outras entidades neste módulo, ex. `ChartOfAccountRepository`).

**`xPag`**: preenchido com `PaymentMethod.name` quando o código resolvido for `99` (caso "Outros"
configurado de propósito pelo lojista, não o fallback antigo) — o builder já suporta
`description` opcional em `payments[]`.

### D2 — `documentId`: mesma classe de gap de `errorCode`/`errorMessage` (spec 028)

A resposta de `POST /v1/nfe`/`POST /v1/nfse` (via `FiscalDocumentPresenter.toHttp`) já inclui
`documentId` — o `HttpFiscalApiClient` do erp-api lê só `status`/`accessKey`/`protocol`/
`errorCode`/`errorMessage` hoje (spec 028) e descarta o resto. Sem persistir esse id, o erp-web
não tem como montar a URL `/v1/nfe/:id/xml`.

**Decisão**: `NfeIssuance`/`NfseIssuance` ganham `fiscalDocumentId: string | null` (nullable —
`null` só no caso teórico de uma emissão que nunca chegou a criar o documento do lado da
fiscal-api, o que hoje sempre lança antes de retornar `NfeIssuance.create`). Migration pequena,
aditiva, mesmo padrão da spec 028 (`database-reviewer` obrigatório).

### D3 — Proxy fiscal: resolvedor de dono para `/v1/nfe/:id[...]` e `/v1/nfse/:id[...]`

Mesma armadilha documentada no `AGENTS.md`: rotas sem `companyId` no path caem no fallback (token
do usuário, sem a role `fiscal_operator`) e recebem 403. `GET /v1/fiscal-documents/:id` já expõe
`companyId` no corpo — usar como resolvedor: o proxy, ao ver `/v1/nfe/:id[...]` ou
`/v1/nfse/:id[...]`, chama esse endpoint **com o token de serviço** (só para resolver o dono),
compara `companyId` retornado com `identity.companyId` da organização ativa; só então eleva a
chamada real para o token de serviço. Documento cujo dono não bate (ou cuja consulta falha) —
**fail-closed**: cai no token do usuário, que a fiscal-api vai recusar com 403 (comportamento
seguro, idêntico ao "resto das rotas" já documentado). Mesmo padrão de `resolveCallerFiscalIdentity`,
uma função nova (`resolveFiscalDocumentOwner`) ao lado dela.

**Custo**: 1 chamada HTTP extra (`GET /v1/fiscal-documents/:id`) antes da chamada de download —
aceitável, é uma ação de clique explícito do usuário, não um caminho de alta frequência.

### D4 — Vínculo pedido → NF-e na listagem

`NfeIssuance.saleOrderId` já existe (spec 026) — falta só o `SaleOrderPresenter`/listagem expor
`{id, status, fiscalDocumentId}` por pedido (join simples por `saleOrderId`, sem N+1 se resolvido
em lote na consulta da página, mesmo padrão de `stockName`/`SaleOrderListItem` já usado). NFS-e
não tem vínculo com pedido (é avulsa) — não se aplica ao FR-010 (que é só sobre NF-e/Vendas/Pedidos).

### D5 — Edição de cliente: reuso exato do molde de `suppliers`

`CustomerFormView` já existe (usado por `customer-create-page.tsx`). `customer-edit-page.tsx`
segue `supplier-edit-page.tsx` linha a linha: `useCustomerQuery(id)` (criar se não existir),
estados loading/error/"não encontrado", `key={customer.id}` no form (evita baseline stale — FR
explícito no prompt, já é o padrão usado por `suppliers`/`carriers`). Sinalização fiscal
(endereço/documento necessários pra NF-e): `Alert` informativo não-bloqueante na seção de
endereço, reaproveitando a mesma mensagem já usada em `nfe-issuance-page.tsx` (spec 028) — não
duplica lógica de validação, só o texto explicativo.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| fiscal-api precisa de mudança de DTO (`payments[]` em `POST /v1/nfe`) — app fora do erp-api/erp-web | Mudança aditiva (campo opcional), não quebra `paymentMethodCode` legado nem o fluxo de NFC-e; gate `pnpm --filter @citybox/fiscal-api typecheck && lint && test` cobre |
| Migration em `NfeIssuance`/`NfseIssuance` (2ª desta cadeia de specs, depois da 028) | Mesmo padrão já validado: nullable, sem default computado, zero-downtime — `database-reviewer` |
| Proxy fiscal: elevar token para rota errada abriria acesso cross-tenant a documento fiscal de outra empresa | `security-reviewer` obrigatório (explícito no prompt); fail-closed testado explicitamente (US2 Acceptance Scenario 4) |
| Pedido de teste real (RR EMPREENDIMENTOS) pode não ter forma de pagamento com `fiscalCode` configurado ainda | Validação manual final inclui configurar o `fiscalCode` da forma usada antes de reemitir, senão o bloqueio de FR-003 é o resultado esperado (não um bug) |
