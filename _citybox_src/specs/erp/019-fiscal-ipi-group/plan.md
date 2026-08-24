# Implementation Plan: Grupos do IPI (019)

**Feature dir**: `specs/erp/019-fiscal-ipi-group` · **Branch**: acumulada em `feat/fiscal-api`

## Technical Context

- **Backend cadastro**: `apps/erp/api` (`@citybox/erp-api`, NestJS 11, Clean Architecture),
  schema Prisma `erp` no DB `citybox_platform` — **não provisionado** → migration escrita à
  mão + versionada, `prisma generate` offline, testes jest in-memory. Aplicada depois via
  `prisma migrate deploy`.
- **Emissão**: `services/fiscal-api` (`@citybox/fiscal-api`), builder da NF-e
  `src/modules/nfe/infrastructure/xml/nfe-xml.builder.ts`. Testes jest.
- **Frontend**: `apps/erp/web` (Next.js 16, React 19, MUI 9). **Sem harness de teste** →
  só backend testado (D0). Features irmãs em `src/features/fiscal-*`.

## Decisões de arquitetura (mesma resposta das irmãs — NÃO reabrir)

1. **Entidade única `FiscalGroup`** com `taxType='IPI'`. Acrescenta colunas `ipiCst`,
   `ipiEnquadramento` (`cEnq`), `ipiRate` à mesma tabela `fiscal_groups` (padrão de 015/016/018).
2. **Localização**: rota própria sob o leaf fiscal — `/configuracoes/fiscal/grupos-ipi`
   (igual ao Grupo de ICMS 016 e ISSQN 018). Link na página Padrões fiscais.
3. **Permissão cadastro**: `store.catalog.manage` (mesma de todas as telas de grupo fiscal).
4. **FK no produto**: `ProductFiscal.ipiGroupId` (nullable), com `ProductIpiGroup` relation;
   idem `ProductFiscalBranch.ipiGroupId` (override por unidade).
5. **Emissão**: quem monta o pedido (erp-api/PDV) resolve produto → grupo → valores e envia
   pronto; a fiscal-api não conhece grupos. `NfeItemInput` ganha `ipi?` opcional.

## CSTs suportados (saída) e mapeamento XSD

| CST | Descrição | Grupo XML | Valores |
|-----|-----------|-----------|---------|
| 50  | Saída tributada | `IPITrib` | `vBC`, `pIPI`, `vIPI` |
| 99  | Outras saídas | `IPITrib` | `vBC`, `pIPI`, `vIPI` |
| 51  | Saída tributada alíq. zero | `IPINT` | — |
| 52  | Saída isenta | `IPINT` | — |
| 53  | Saída não-tributada | `IPINT` | — |
| 54  | Saída imune | `IPINT` | — |
| 55  | Saída com suspensão | `IPINT` | — |

- **Tributado (exige percentual)** = `{50, 99}` → `IPITrib`. Demais → `IPINT`, sem percentual.
- Sequência XSD do grupo `IPI` (TIpi): `cEnq` (1–3 chars) → choice `IPITrib`|`IPINT`.
  `IPITrib`: `CST` → (`vBC` + `pIPI`) → `vIPI`. `IPINT`: só `CST`.
- Posição no `imposto`: **após ICMS, antes de PIS/COFINS** (confirmado no XSD, linha 4410).
  `buildImpostoXml` → `{ ...icms, ...buildIpiXml(item), ...buildPisCofinsXml(item) }`.

## Tabela `cEnq` estática (FR-009)

- Novo arquivo em fiscal-api (`.../nfe/domain/ipi-enquadramento.table.ts`) e um espelho de
  opções na erp-web para o select. Versionada em código, com teste que quebra ao mudar
  (snapshot do conjunto de códigos). Valor genérico `999` ("Tributação normal do IP; range
  de 990 a 999") é o default seguro para quem não tem enquadramento específico.

## Data model (schema `erp`)

`FiscalGroup` (tabela `fiscal_groups`) — colunas novas, todas nullable:
- `ipiCst` `VARCHAR` — CST de saída.
- `ipiEnquadramento` `VARCHAR(3)` — `cEnq`.
- `ipiRate` `Decimal(7,4)` — percentual (nulo quando CST não tributado).
- CHECK: `ipi_cst IS NULL OR ipi_cst IN ('50','51','52','53','54','55','99')`.

`ProductFiscal` + `ProductFiscalBranch`: `ipiGroupId String?` + relation
`ProductIpiGroup`/`ProductBranchIpiGroup` (FK para `fiscal_groups`, `ON DELETE SET NULL` —
igual issqnGroupId de 018).

Migration: `<yyyymmddHHMMSS>_ipi_groups/migration.sql`. `ProductFiscal.ipi` (String
`@default("")`) permanece por ora — o novo caminho é a FK; a coluna string legada não é
removida nesta entrega (evita perda caso haja dado; verificado como só `""`).

## Camadas erp-api

- **Domain**: `FiscalGroup` ganha `IPI_CST_SUPPORTED`, `IPI_CST_TRIBUTADO`, `IpiGroupInput`,
  `createIpi`/`updateIpi`/`validateIpi`, getters `ipiCst`/`ipiEnquadramento`/`ipiRate`.
  Props IPI adicionadas a `FiscalGroupProps` (null-default nas outras factories).
- **Application**: use-cases `create-ipi-group`, `update-ipi-group`, `resolve-product-ipi`
  (resolve grupo → CST/cEnq/rate para o item de emissão). List já existe (filtra taxType).
- **Infrastructure**: repositório Prisma mapeia as colunas novas; presenter expõe campos IPI.
- **Route**: `/v1/fiscal-groups` já existe filtrando por taxType; acrescentar suporte a IPI
  (create/update aceitam o corpo IPI). `store.catalog.manage`.
- **Catalog**: `ipiGroupId` threaded em ProductFiscal entity/dto/repo/presenter/route +
  `assertGroupOfType('IPI')` em upsert-fiscal-parameters.

## Camadas fiscal-api (emissão)

- `NfeItemInput.ipi?: { cst; cEnq; aliquota? } | null` (todos os campos do bloco IPI).
- `buildIpiXml(item)`: `{}` quando `item.ipi` ausente (não-regressão); senão `{ IPI: { cEnq,
  ...(tributado ? { IPITrib: { CST, vBC, pIPI, vIPI } } : { IPINT: { CST } }) } }`.
- `ipiItemValue(item)`: base×alíquota (tributado) ou 0.
- Total: `vIPI` = soma de `ipiItemValue` dos itens. `vIPIDevol` permanece `0.00`.

## Frontend erp-web (`src/features/fiscal-ipi-group`)

Mesma estrutura de `fiscal-issqn-group` (018): `api/`, `hooks/`, `lib/`, `components/`,
`pages/`, `GUIA.md`. Formulário: Nome, select CST (busca), select `cEnq`, Percentual
condicional; barra de alterações não salvas (`useUnsavedChangesGuard`); aba Produtos
somente-leitura. Rota `/configuracoes/fiscal/grupos-ipi`; link em Padrões fiscais.

## Gates & reviewers

- `database-reviewer` (migration Prisma).
- `react-reviewer` + `typescript-reviewer` (.tsx da feature + código de emissão).
- `security-reviewer` (tenant isolation da FK, numeração/emissão — o bloco IPI vai ao XML
  transmitido à SEFAZ).
- Teste do builder verificando o XML gerado (obrigatório — toca XML transmitido).

## Docs-as-code

`apps/erp/web/AGENTS.md`, `apps/erp/api/AGENTS.md`, `services/fiscal-api/AGENTS.md`
(mudança no contrato de emissão: `buildImpostoXml` deixa de omitir IPI). GUIA.md da feature.

## Testes

- **fiscal-api** (jest): builder com IPITrib (CST 50), com IPINT (CST 53), CST 99 tributado,
  total `vIPI` somando itens, e **não-regressão** (item sem `ipi` → sem bloco, `vIPI 0.00`).
- **erp-api** (jest in-memory): `FiscalGroup.createIpi`/`updateIpi`/`validateIpi`, resolver
  de produto→IPI, FK em ProductFiscal, tenant-scope allowlist inalterada (assertion exata).
- **erp-web**: sem harness → não testado (D0), documentado na conferência.
