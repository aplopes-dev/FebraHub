# Implementation Plan: Emissão de NF-e pela tela de Vendas, com parametrização fiscal real

**Branch**: `026-emissao-nfe-vendas` | **Date**: 2026-08-15 | **Spec**: `specs/erp/026-emissao-nfe-vendas/spec.md`

**Input**: Feature specification from `specs/erp/026-emissao-nfe-vendas/spec.md`

## Summary

Hoje `/vendas/nfe` é rota placeholder e a única emissão de NF-e testada foi manual via
Swagger, sem passar pelos 4 resolvedores fiscais (`ResolveItemIcmsUseCase`,
`ResolveItemPisCofinsUseCase`, `ResolveItemIpiUseCase`, `ResolveOperationNatureUseCase`) já
implementados e testados na erp-api — eles existem só registrados em DI, nenhum caso de uso
real os injeta (verificado por grep). Esta spec liga um pedido de venda (`SaleOrder`) já
fechado à emissão real de NF-e: por linha, resolve ICMS/PIS-COFINS/IPI do produto (cadeia
produto→grupo→padrão da organização→fallback), monta o payload e chama
`POST /v1/nfe` da fiscal-api. **`ResolveOperationNatureUseCase` fica fora de escopo** (FR-007
— ela resolve CFOP de saída a partir de uma operação de *entrada*, e aqui a operação já é de
saída, o pedido de venda).

**Achado no planejamento (grounding no código, não estava no research da fiscal-api
AGENTS.md):** `services/fiscal-api/src/modules/nfe/infrastructure/xml/nfe-xml.builder.ts`
(`NfeItemInput`) **já suporta** `icmsAliquota`, `origem`, `pis`, `cofins` e `ipi` por item —
o builder do XML da NF-e já sabe montar os blocos `ICMS`/`PIS`/`COFINS`/`IPI` reais. O gap
real de FR-003 está **duas camadas acima do builder**: o DTO HTTP (`issue-nfe.dto.ts`,
`class-validator`) e o tipo de aplicação/validador zod (`nfe-item.zod.validator.ts`,
`NfeItemDto`) só carregam `cst`/`csosn` — os campos de PIS/COFINS/IPI/ICMS-alíquota nunca
chegam ao builder porque são descartados antes, na fronteira HTTP. Não é preciso tocar no
builder XML; é preciso **estender o contrato de entrada** (2 arquivos) e o validador zod
(FR-004).

## Technical Context

**Language/Version**: TypeScript 5.8, NestJS 11 (ambos `apps/erp/api` e `services/fiscal-api`), Next.js 16 + React 19 (`apps/erp/web`)

**Primary Dependencies**: Prisma (novo modelo `NfeIssuance`, tenant-scoped), `class-validator`/`class-transformer` (fiscal-api HTTP DTO), `zod` (fiscal-api domain validator), `@tanstack/react-query` + `@citybox/mui` (frontend)

**Storage**: Postgres `citybox`, schema `erp` (nova tabela `nfe_issuances`, molde `nfse_issuances`); `services/fiscal-api` já persiste o `FiscalDocument`/`FiscalDocumentItem` — não é tocado no schema, só no shape do payload que aceita.

**Testing**: Jest in-memory (erp-api: `nfe-issuance` module, molde `nfse-issuance`), Jest (fiscal-api: `issue-nfe.use-case.spec.ts` + zod validator specs), sem harness de frontend (gap já documentado em `apps/erp/web/AGENTS.md`).

**Target Platform**: 3 pacotes do monorepo — `apps/erp/api` (:3114), `services/fiscal-api` (:3116), `apps/erp/web` (:3107).

**Project Type**: Web application (backend NestJS × 2 + frontend Next.js), dentro do monorepo Turborepo existente.

**Performance Goals**: Sem meta nova — emissão síncrona (`POST /v1/nfe` já é síncrona, FR-016 documentado no controller da fiscal-api), mesmo padrão de latência de `nfse-issuance`.

**Constraints**: **Zero mudança de schema no builder XML da fiscal-api** (`nfe-xml.builder.ts` já suporta os campos — só o contrato de entrada precisa mudar). Reusar o padrão de auth M2M (`fiscal-service-token.ts`) e `HttpFiscalApiClient` já implementados em `nfse-issuance` (spec 025) — não duplicar a lógica de token, só o client HTTP específico de NF-e (endpoint e payload diferentes de NFS-e).

**Scale/Scope**: 1 user story (P1, MVP = toda a feature — não há P2/P3 nesta spec). 3 pacotes tocados. ~12-15 arquivos novos + 2-3 arquivos estendidos na fiscal-api (DTO + validator).

## Constitution Check

Sem `.specify/memory/constitution.md` custom neste repo — gates efetivos são os do `CLAUDE.md`/`AGENTS.md` raiz (Clean Architecture por módulo, Prisma multi-schema, guards locais por API, sem `@ts-ignore`/`eslint-disable @typescript-eslint/*`, `database-reviewer` obrigatório em migration, `react-reviewer` obrigatório em `.tsx`, `security-reviewer` obrigatório em auth/token — aplica-se ao endpoint `/v1/nfe` estendido e ao módulo `nfe-issuance` novo). Nenhuma violação identificada nesta fase.

## Project Structure

### Documentation (this feature)

Este repositório usa **um único `plan.md` consolidado** por feature (sem `research.md`/
`data-model.md`/`contracts/`/`quickstart.md` separados — convenção confirmada nas specs
022-025 já entregues). Achados de pesquisa, modelo de dados e critérios de validação estão
inline nas seções abaixo.

```text
specs/erp/026-emissao-nfe-vendas/
├── spec.md
├── plan.md              # este arquivo
├── tasks.md              # gerado por /speckit-tasks
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
services/fiscal-api/
└── src/modules/nfe/
    ├── infrastructure/http/routes/issue-nfe/issue-nfe.dto.ts   # ESTENDER: pis/cofins/ipi/icmsAliquota/origem por item
    ├── application/dtos/nfe.dto.ts                              # ESTENDER: NfeItemDto (import do zod validator)
    └── domain/validators/nfe-item.zod.validator.ts               # ESTENDER: schema + revalidação (FR-004)

apps/erp/api/
└── src/modules/nfe-issuance/                # NOVO — molde 1:1 de modules/nfse-issuance
    ├── domain/
    │   ├── entities/nfe-issuance.entity.ts
    │   ├── repositories/nfe-issuance.repository.interface.ts
    │   ├── providers/fiscal-api-client.interface.ts     # issueNfe() em vez de issueNfse()
    │   └── errors/fiscal-api-emission.error.ts           # reuso do mesmo formato de nfse-issuance
    ├── application/
    │   ├── dtos/issue-nfe.dto.ts
    │   └── use-cases/
    │       ├── issue-nfe/issue-nfe.use-case.ts            # orquestra: SaleOrder → resolvers → fiscal-api
    │       └── list-nfe-issuances/list-nfe-issuances.use-case.ts
    ├── infrastructure/
    │   ├── database/prisma-nfe-issuance.repository.ts
    │   ├── http/routes/nfe-issuance.route.ts
    │   ├── http/routes/shared/{issue-nfe.http.dto.ts,nfe-issuance.presenter.ts}
    │   └── providers/http-fiscal-api-client.ts            # reusa fiscal-service-token.ts existente (não duplica)
    ├── tests/{fake-fiscal-api-client.ts,in-memory-nfe-issuance.repository.ts}
    └── nfe-issuance.module.ts
    prisma/schema.prisma                    # + model NfeIssuance (tenant-scoped, molde NfseIssuance)

apps/erp/web/
└── src/
    ├── app/(app)/vendas/nfe/page.tsx                       # troca o placeholder por NfeIssuancePage real
    └── features/nfe-issuance/                # NOVO
        ├── api/ (dto + service, molde nfse-issuance)
        ├── hooks/ (use-nfe-issuances: buscar pedido, emitir)
        ├── pages/nfe-issuance-page.tsx
        └── GUIA.md
```

**Structure Decision**: Clean Architecture replicada 1:1 do módulo `nfse-issuance` (já
revisado e aprovado nesta mesma sessão, spec 025) para o novo módulo `nfe-issuance` — mesma
separação domain/application/infrastructure, mesmo padrão de idempotência local, mesmo padrão
de client HTTP com token M2M próprio (cópia local, ADR C-17 — **não** reexportar
`fiscal-service-token.ts` de `nfse-issuance` como se fosse pacote compartilhado; o arquivo é
**reusado por caminho relativo dentro da mesma erp-api** — isso não viola a ADR C-17, que
proíbe pacote/symlink **entre sistemas**, não reuso de utilitário dentro do mesmo sistema).
Import direto de `../../nfse-issuance/infrastructure/providers/fiscal-service-token.ts` do
módulo `nfe-issuance` é aceitável (mesmo `apps/erp/api`); o `HttpFiscalApiClient` **é**
duplicado (não reusado), porque o endpoint (`/v1/nfe` vs `/v1/nfse`) e o payload são
estruturalmente diferentes — replicar o padrão, não a instância.

## Design — decisões por camada

### D1. fiscal-api: extensão do contrato `POST /v1/nfe` (FR-002, FR-003, FR-004)

`NfeItemInput` (builder XML) já aceita os campos — **estender só a fronteira**:

- `issue-nfe.dto.ts` (`IssueNfeItemDto`, class-validator): adicionar `icmsAliquota?: number`,
  `origem?: string`, `pis?: { cst: string; aliquota?: number }`, `cofins?: { cst: string;
  aliquota?: number }`, `ipi?: { cst: string; cEnq: string; aliquota?: number }` — todos
  opcionais e nullable, espelhando exatamente os tipos `NfePisCofinsInput`/`NfeIpiInput` do
  builder (`ApiProperty` + `IsOptional`/`ValidateNested`, mesmo padrão do `customer.address`
  já existente no arquivo).
- `nfe-item.zod.validator.ts` (`NfeItemDto`/`itemSchema`): mesmos campos no schema zod.
  **FR-004 (revalidação)**: `cst`/`csosn` de PIS/COFINS restrito ao conjunto suportado (mesmo
  conjunto que `fiscal-pis-cofins-group`/`ipi-options.ts` da erp-api já usam — CST de PIS/COFINS
  tributado/NT, CST de IPI de saída `IPI_TRIBUTADO_CST` já importado pelo builder), `aliquota`
  em `0..100` quando presente. **A fiscal-api não confia no valor que a erp-api mandou** — ela
  já não confiava (o builder tem os próprios `IPI_TRIBUTADO_CST`/branches por CST), esta tarefa
  só garante que o **shape** de entrada passa pela mesma disciplina de validação que os demais
  campos do item (não é uma revalidação fiscal nova, é fechar o buraco de "o campo nem existia
  no contrato, logo nunca foi validado nem usado").
- **Nenhuma mudança no builder XML** (`nfe-xml.builder.ts`) — ele já lê esses campos de
  `NfeItemInput`; `dto.items` já é passado direto pro builder em `issue-nfe.use-case.ts:165`
  (`items: dto.items`), então uma vez que o DTO carrega os campos, eles chegam ao XML sem
  nenhuma mudança na use case da fiscal-api.
- **Nenhuma migration** — os campos vivem só no payload da chamada síncrona, não são
  persistidos como colunas próprias (o builder os usa para montar o XML na hora; o que fica em
  `fiscal_documents`/`fiscal_document_items` continua sendo `cst`/`csosn` puros, como hoje —
  não-regressão de schema).

### D2. erp-api: módulo `nfe-issuance` (FR-001, FR-002, FR-005, FR-006)

**`IssueNfeUseCase.execute({ saleOrderId, organizationId, idempotencyKey })`:**

1. Carrega o `SaleOrder` (via `SaleOrderRepository` já existente em `modules/sales`). Recusa
   (`FiscalApiEmissionError`) se `status` não permitir emissão (spec não define um status
   dedicado "nota emitida" no `SaleOrder` — a FR-006 é garantida pelo **`NfeIssuance` já
   existir para esse `saleOrderId`**, não por um campo novo no `SaleOrder`: idempotência local
   por `saleOrderId`, molde exato de `NfseIssuance.findByIdempotency`, mas chaveada por
   `saleOrderId` em vez de `externalReference` arbitrário — ver Key Entities da spec).
2. Resolve o Emitente (`companyId` + `defaultEnvironment`) do mesmo jeito que `nfse-issuance`
   já faz (reuso do `HttpFiscalApiClient.findCompanyIdByCnpj`, ou do resultado já cacheado se
   o caller já resolveu) — **mesma guarda de PRODUCTION da spec 025** aplicada aqui também
   (a plataforma só sustenta emissão real em homologação; reaproveita o padrão, não duplica a
   decisão).
3. Para cada linha do pedido: busca `ProductFiscal` do produto (NCM, CFOP, origem) +
   `ProductFiscal.{icms,pisCofins,ipi}GroupId` e chama `ResolveItemIcmsUseCase`/
   `ResolveItemPisCofinsUseCase`/`ResolveItemIpiUseCase` (já existentes, só conectados) —
   monta o item da NF-e (`description`, `ncm`, `cfop`, `quantity`, `unitValue`, `totalValue`,
   `cst`/`csosn`, `icmsAliquota`, `origem`, `pis`, `cofins`, `ipi`).
4. **FR-005 — fallback explícito**: cada resolver já retorna `null` quando o produto não tem
   grupo (não-regressão documentada nos próprios resolvers). O use case coleta esses `null`s
   por item/tributo numa lista de avisos (`FallbackWarning[]`) — devolvida **junto** com a
   prévia (rota nova `POST /v1/nfe-issuances/preview`, ou parâmetro `dryRun` na mesma rota,
   decisão de tasks) para a tela mostrar antes de confirmar. A emissão em si **não é
   bloqueada** por ter avisos (decisão do clarify).
5. Chama a fiscal-api (`HttpFiscalApiClient.issueNfe`, client novo — reusa
   `fiscal-service-token.ts` de `nfse-issuance` pelo caminho relativo, não duplica a lógica de
   token) e registra `NfeIssuance` (`saleOrderId`, `fiscalDocumentId`/`accessKey`/`protocol`/
   `status`, `organizationId` para `TENANT_SCOPED_MODELS`).

**Entidade nova `NfeIssuance`** (Prisma, schema `erp`, molde `NfseIssuance`): `id`,
`organizationId`, `saleOrderId` (índice único — é o mecanismo real de FR-006/SC-004, não um
campo novo em `SaleOrder`), `fiscalDocumentId`, `accessKey`, `protocol`, `status`,
`createdAt`. **`database-reviewer` obrigatório** (nova migration).

**Permissão nova**: rota `POST /v1/nfe-issuances` exige `store.fiscal.issue` (mesma permissão
que `nfse-issuance` já usa — emissão fiscal é uma capacidade única, não uma por tipo de
documento).

### D3. erp-web: tela `/vendas/nfe` (FR-001, FR-005)

Substitui o placeholder desabilitado (`navigation.ts:107`). Fluxo: **Autocomplete de pedido de
venda** (`SaleOrder` com `status=closed` e sem `NfeIssuance` ainda — filtro no backend, não no
cliente) → prévia dos itens com os tributos resolvidos, com `Alert`/badge por item mostrando
qual tributo caiu em fallback (FR-005, mesmo padrão visual de aviso já usado em
`nfse-issuance-page.tsx` para o ambiente PRODUCTION-bloqueado da spec 025) → `ConfirmationDialog`
→ Emitir. Molde direto de `features/nfse-issuance` (mesma estrutura de pastas, mesmo padrão de
`useFiscalCompany` para o selo de ambiente, mesmo `businessErrorMessage` para erros do órgão).
`FiscalScrollablePage` (padrão da spec 025, P3) desde o início — não fica de fora como
aconteceu com `nfse-issuance` na spec 018 e precisou ser corrigido depois (spec 022 P2).

## Complexity Tracking

Nenhuma violação de constituição identificada — o desenho replica um padrão já revisado e
aprovado (módulo `nfse-issuance`, spec 025) para uma entidade estruturalmente análoga
(`NfeIssuance` para `SaleOrder`, como `NfseIssuance` já é para emissão avulsa).
