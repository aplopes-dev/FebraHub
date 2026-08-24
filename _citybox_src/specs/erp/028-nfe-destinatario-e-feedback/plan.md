# Implementation Plan: Destinatário completo e feedback honesto na emissão fiscal

**Branch**: `028-nfe-destinatario-e-feedback` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/erp/028-nfe-destinatario-e-feedback/spec.md`

## Summary

Três correções nas duas telas de emissão fiscal (`/vendas/nfe`, `/vendas/nfse`), destravadas pela
spec 027: (B1/P1) a NF-e sai sem `enderDest` porque a tela reusa o resolvedor de cliente da NFS-e
(`CustomerFiscalInfo`, sem endereço) — ganha um resolvedor próprio, com bloqueio explícito quando o
cliente não tem endereço utilizável; (B2/P2) o resultado da emissão vira `toast.success` mesmo
quando o órgão rejeita, em inglês, sem o motivo — as duas telas passam a diferenciar
`AUTHORIZED`/`REJECTED` e mostrar o código+mensagem do órgão, o que exige o erp-api parar de
descartar `errorCode`/`errorMessage` (que a fiscal-api já devolve na resposta da própria emissão,
hoje ignorados) e persisti-los no vínculo local; (B3/P3) os botões "Emitir" ganham
`variant="contained"`, sem inventar destaque novo.

## Technical Context

**Language/Version**: TypeScript 5.8 (strict)

**Primary Dependencies**: NestJS 11 (erp-api), Next.js 16 + React 19 + `@citybox/mui` (erp-web),
Prisma (erp-api), TanStack Query (erp-web)

**Storage**: PostgreSQL (`citybox` DB, schema `erp`) — migration nova em `nfe_issuances` +
`nfse_issuances` (colunas `error_code`/`error_message`, nullable)

**Testing**: Jest in-memory (erp-api, `--import tsx --test` não se aplica aqui — este app usa
jest); sem harness de teste frontend em `apps/erp/web` (D0, gap pré-existente e documentado)

**Target Platform**: Web (backoffice `erp-web`, :3107) + API (`erp-api`, :3114); `fiscal-api`
(:3116) não muda contrato de request, só passa a ter seu response consumido por inteiro

**Project Type**: Web application (monorepo — `apps/erp/web` + `apps/erp/api`)

**Performance Goals**: N/A — sem mudança de volume/latência; uma chamada a mais
(`GET /v1/customers/:id`) já existia antes (era feita para os 4 campos atuais, passa a incluir
`addresses`, sem round-trip extra)

**Constraints**: Zero `@citybox/ui`/`lucide-react` nas telas tocadas (regras de design não
negociáveis do prompt de origem); sem cor hardcoded; contraste OK nos dois temas; nenhuma
regressão nos comportamentos listados em "O que NÃO mexer" do spec (FR-008)

**Scale/Scope**: 2 telas de emissão + 1 tabela do Facilita NF-e (tradução de status, já existente
— só reuso, sem mudança) + 2 entidades de banco (migration pequena)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Docs-as-Code | `apps/erp/web/AGENTS.md` e `apps/erp/api/AGENTS.md` serão atualizados na mesma operação (D6/D7 abaixo) |
| II. Backend-driven search/pagination | N/A — feature não lista/pagina nada novo |
| III. pnpm único | Sem novas dependências; nenhum comando fora de `pnpm --filter` |
| IV. Atomic Design / `@citybox/ui` | As duas telas já são 100% `@citybox/mui`; B3 usa só `variant="contained"`, um prop já suportado pelo `Button` do design system — sem componente novo |
| V. Tenant isolation / schema próprio | Migration em `apps/erp/api/prisma/schema.prisma` (schema `erp`, tenant-scoped via `organizationId` já existente nas duas tabelas) — `database-reviewer` obrigatório (gate explícito do prompt) |

**Nenhuma violação.** Duas tabelas ganham 2 colunas nullable cada — mudança aditiva, sem
migração de dado, sem índice novo.

## Project Structure

### Documentation (this feature)

```text
specs/erp/028-nfe-destinatario-e-feedback/
├── plan.md              # este arquivo
├── spec.md              # requisitos + clarificações
├── checklists/requirements.md
└── tasks.md             # gerado por /speckit-tasks
```

### Source Code (arquivos tocados)

```text
apps/erp/web/src/
├── features/nfe-issuance/
│   ├── api/
│   │   ├── nfe-issuance.dto.ts            # NfeIssuanceDto ganha errorCode/errorMessage
│   │   ├── nfe-issuance.service.ts        # getCustomerNfeFiscalInfoApi (novo)
│   │   └── customer-nfe-fiscal-info.dto.ts  # tipos do resolvedor próprio (novo)
│   ├── hooks/use-nfe-issuances.ts         # useCustomerNfeFiscalInfoQuery (novo, substitui o
│   │                                        # re-export de nfse-issuance)
│   └── pages/nfe-issuance-page.tsx        # canEmit + toast + Button variant
├── features/nfse-issuance/
│   ├── api/nfse-issuance.dto.ts           # NfseIssuanceDto ganha errorCode/errorMessage
│   └── pages/nfse-issuance-page.tsx       # toast + Button variant
├── features/facilita-nfe/lib/fiscal-document-format.ts  # reusado (sem mudança), agora
│                                                          # importado pelas 2 telas de emissão
├── features/fiscal-certificate/lib/build-provision-payload.ts  # atualiza import (D2)
└── lib/ibge-lookup.ts                     # movido de features/fiscal-certificate/lib/ (D2)

apps/erp/api/
├── prisma/schema.prisma                   # NfeIssuance/NfseIssuance ganham errorCode/errorMessage
├── prisma/migrations/<ts>_nfe_nfse_issuance_error_fields/
└── src/modules/
    ├── nfe-issuance/
    │   ├── domain/
    │   │   ├── entities/nfe-issuance.entity.ts        # +errorCode/errorMessage
    │   │   └── providers/fiscal-api-client.interface.ts  # IssueNfeResult +errorCode/errorMessage
    │   ├── infrastructure/
    │   │   ├── providers/http-fiscal-api-client.ts    # lê errorCode/errorMessage do body
    │   │   ├── database/nfe-issuance.mapper.ts (ou equivalente)  # persiste os 2 campos
    │   │   └── http/routes/shared/nfe-issuance.presenter.ts      # expõe no response
    │   └── application/use-cases/issue-nfe/issue-nfe.use-case.ts # repassa result→entity
    └── nfse-issuance/  (espelho 1:1 da árvore acima)
```

**Structure Decision**: segue a árvore de módulos já existente — nenhum diretório novo, exceto o
resolvedor de dados fiscais próprio da NF-e (`api/customer-nfe-fiscal-info.dto.ts` +
função em `nfe-issuance.service.ts`) e a migration. `lib/ibge-lookup.ts` sobe um nível (de
`features/fiscal-certificate/lib/` para `src/lib/`) por ser geografia genérica, não algo do
domínio de certificado.

## Fase 0 — Decisões (research)

### D1 — Endereço do destinatário na NF-e: resolvedor próprio, não `CustomerFiscalInfo` estendido

**Decisão** (confirmada no `/speckit-clarify`): novo `getCustomerNfeFiscalInfoApi(customerId)` em
`features/nfe-issuance/api/nfe-issuance.service.ts`, chamando o mesmo `GET /v1/customers/:id` que
`getCustomerFiscalInfoApi` já usa (nenhum endpoint novo no erp-api) — mas lendo também
`data.addresses[]`, que a resposta **já inclui** hoje (`CustomerPresenter.toHttpSingle` já
serializa `addresses`; só o mapper do frontend da NFS-e que os ignora).

**Endereço de referência** (spec: "cobrança vs. entrega"): `CUSTOMER_ADDRESS_TYPES` no backend é
`principal | entrega | outro` (`customer.entity.ts:18`) — usa o endereço `addressType === "principal"`;
se não houver nenhum com esse tipo, cai no primeiro endereço da lista (ordem de cadastro); lista
vazia → `address: null` (dispara o bloqueio de FR-002).

**Código IBGE do município**: `Customer.addresses[]` não tem `cityCodeIbge` (só `city`+`state`
texto livre) — mesma lacuna que `features/fiscal-certificate` já resolveu com uma tabela estática
(`ibge-lookup.ts`, cidade+UF → código, cobertura Ilhéus + região). Reuso, não duplicação: o arquivo
sobe para `src/lib/ibge-lookup.ts` (D2) e as duas features passam a importar de lá. Cidade fora da
tabela → tratada como endereço "não utilizável" (mesmo bloqueio de endereço ausente, FR-002/Edge
Case) — nunca chuta um código IBGE.

**Bloqueio (FR-002)**: `canEmit` em `nfe-issuance-page.tsx` ganha
`Boolean(customerNfeFiscalQuery.data?.address)`; quando falso e o pedido tem cliente identificado,
um `Alert` explica: "O cliente não tem endereço cadastrado (ou o município não está na nossa base).
Complete o cadastro em Clientes antes de emitir a NF-e." com link para `/clientes/:id` — não deixa
a SEFAZ recusar de novo por um dado que o sistema já sabia estar ausente/incompleto.

**Efeito colateral positivo, não-regressão a confirmar**: `ResolveSaleOrderItemsService.execute`
já recebe `input.customer.address?.uf` (`issue-nfe.use-case.ts:71`) para resolver ICMS
interno/interestadual — hoje esse `uf` é sempre `undefined` (o frontend nunca envia endereço), então
a resolução de ICMS já roda nesse modo degradado. Depois desta feature, `uf` passa a chegar
preenchido para clientes com endereço — o teste de regressão de US1 deve confirmar que isso não
muda o resultado do ICMS para o caso de teste real (Aplopes é BA; verificar se o `SaleOrder`/produto
de teste já assume BA como UF do destinatário hoje, para não introduzir uma mudança de tributo
não pedida por esta spec).

### D2 — `ibge-lookup.ts`: mover para `src/lib/`, não duplicar

Um único arquivo (`normalizeCityName` + `resolveCityCodeIbge` + tabela estática), hoje só usado por
`fiscal-certificate/lib/build-provision-payload.ts`. Mover para `apps/erp/web/src/lib/ibge-lookup.ts`
e atualizar o único import existente — DRY dentro do mesmo app (diferente do caso `nfse`/`nfe`
`fiscal-service-token.ts`, que é duplicado de propósito entre *sistemas* por ADR C-17; aqui é o
mesmo app, mesma camada `lib/`, sem justificativa para duplicar).

### D3 — `indIEDest`: confirmar, não é bloqueador de B1

`nfe-xml.builder.ts:793` (fiscal-api) já envia `indIEDest: '9'` (Não Contribuinte) fixo, independente
do tipo de destinatário. Não é a causa do `719` (que é ausência total do grupo `enderDest`) e a
spec não pede mudança de comportamento aqui — só confirmação de que `'9'` continua aceitável para
destinatário PJ sem IE informada nesta plataforma (é o valor mais permissivo/seguro quando não se
sabe se o destinatário é contribuinte). Nenhuma tarefa de código; registrar a confirmação no
`AGENTS.md` do `fiscal-api` se for tocado por outro motivo, senão só nesta spec.

### D4 — `errorCode`/`errorMessage`: já existem na resposta da fiscal-api, hoje descartados

`POST /v1/nfe` e `POST /v1/nfse` na `fiscal-api` **já respondem** com `errorCode`/`errorMessage`
(mesmo `FiscalDocumentPresenter.toHttp` usado por `GET /v1/fiscal-documents`, que o Facilita NF-e já
exibe) — a mensagem do órgão já chega em português (é o texto literal devolvido pela SEFAZ/prefeitura,
sem tradução do erp-api). O gap é só no lado do erp-api: `HttpFiscalApiClient.issueNfe`/`issueNfse`
(`FiscalApiSuccessBody`) só lê `data.status`/`data.accessKey`/`data.protocol` — `errorCode`/
`errorMessage` chegam na resposta HTTP e são jogados fora antes de chegar ao `IssueNfeUseCase`.

**Decisão**: persistir `errorCode`/`errorMessage` (nullable) em `NfeIssuance`/`NfseIssuance` — não
só repassar como campo efêmero da resposta HTTP do `POST /v1/nfe-issuances`. Motivo: essas duas
entidades já têm como responsabilidade documentada ser "o vínculo documento↔operação" — um vínculo
que sabe que a nota foi rejeitada mas não sabe por quê é uma responsabilidade pela metade, e abre
espaço para uma tela futura de histórico de emissões do erp-api precisar cruzar com a fiscal-api
(acoplamento maior) para explicar uma rejeição já conhecida no momento da emissão. Custo: migration
pequena (2 colunas nullable × 2 tabelas), sem migração de dado, `database-reviewer` obrigatório.

### D5 — Severidade da rejeição: `toast.warning`

Confirmado no `/speckit-clarify`. `@citybox/mui`'s `toast` (wrapper Sonner) já suporta `toast.warning`
— usado hoje em outras telas do ERP (padrão existente, não introduz API nova).

## Fase 1 — Design

### Contrato: `IssueNfeCustomerAddressPayload` (já existe, sem mudança de forma)

```ts
// apps/erp/web/src/features/nfe-issuance/api/nfe-issuance.dto.ts (já existente)
export type IssueNfeCustomerAddressPayload = {
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  uf: string;
  cityCodeIbge?: string | null;
  zipCode?: string | null;
};
```

### Novo tipo: resolvedor próprio da NF-e

```ts
// apps/erp/web/src/features/nfe-issuance/api/customer-nfe-fiscal-info.dto.ts (novo)
export type CustomerNfeFiscalInfo = {
  documentType: "CPF" | "CNPJ";
  document: string;
  name: string;
  email: string | null;
  /** null = sem endereço utilizável (ausente ou município fora da tabela IBGE) — bloqueia FR-002. */
  address: IssueNfeCustomerAddressPayload | null;
};
```

### `NfeIssuance`/`NfseIssuance` — schema (migration)

```prisma
model NfeIssuance {
  // ...campos existentes...
  errorCode    String? @map("error_code")
  errorMessage String? @map("error_message")
}

model NfseIssuance {
  // ...campos existentes...
  errorCode    String? @map("error_code")
  errorMessage String? @map("error_message")
}
```

`migrate dev` local + `migrate deploy` em produção (ver `apps/erp/api/AGENTS.md` §6 para o comando
exato do ambiente).

### Toast de resultado — regra única, reaproveitada nas duas telas

```ts
// pseudocódigo do handleConfirmEmit, replicado em nfe-issuance-page.tsx e nfse-issuance-page.tsx
import { resolveFiscalDocumentStatusLabel } from "@/features/facilita-nfe/lib/fiscal-document-format";

if (issued.status === "AUTHORIZED") {
  toast.success(`NF-e ${resolveFiscalDocumentStatusLabel(issued.status)}.`, {
    description: issued.protocol ? `Protocolo ${issued.protocol}` : undefined,
  });
} else {
  toast.warning(`NF-e ${resolveFiscalDocumentStatusLabel(issued.status)}.`, {
    description: issued.errorMessage
      ? `${issued.errorCode ? `[${issued.errorCode}] ` : ""}${issued.errorMessage}`
      : "Consulte o Facilita NF-e para mais detalhes.",
  });
}
```

Cobre FR-004/FR-005/FR-006. O `catch` (falha de transporte/config, antes de chegar ao órgão)
continua com `toast.error` — não regride, é um caso distinto (Edge Case da spec).

### Botões de emitir — B3

```tsx
<Button
  type="button"
  variant="contained"
  onClick={() => setConfirmOpen(true)}
  loading={issueMutation.isPending}
  disabled={!canEmit}
>
  Emitir NF-e
</Button>
```

Mesma mudança (`variant="contained"`) no botão equivalente de `nfse-issuance-page.tsx`. Sem cor
custom — o `contained` já usa `primary.main` do tema, com contraste garantido nos dois modos (é o
mesmo padrão usado em toda ação primária do ERP).

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Migration em 2 tabelas de produção | Colunas nullable, sem default computado, sem backfill — `database-reviewer` + `migrate deploy` no mesmo ciclo do deploy desta feature (mesmo padrão da 026/027) |
| Cliente de teste real (Daniel Anselmo) ter endereço com cidade fora da tabela IBGE estática | Se acontecer, o bloqueio de FR-002 dispara (comportamento correto, não é bug) — mas a tabela hoje cobre Ilhéus + região (single-city); validar antes do teste manual final se o endereço cadastrado bate com uma entrada da tabela |
| Mudança em `ResolveSaleOrderItemsService` via `uf` deixar de ser `undefined` alterar o ICMS calculado para o pedido de teste | Teste de regressão de US1 cobre explicitamente esse caso (D1) — se o ICMS mudar, é um efeito esperado (estava rodando em fallback antes), documentar no relatório de implementação, não é uma regressão desta feature |
| `errorMessage` do órgão conter texto muito longo para um `toast` | `description` do `toast.warning`/`toast.success` já trunca/quebra linha no design system (mesmo padrão usado por `errorMessage` na página, ex. `businessErrorMessage`) — sem tratamento extra necessário |
