# Implementation Plan: Naturezas de Operação (020)

**Feature dir**: `specs/erp/020-fiscal-operation-natures` · **Branch**: acumulada em `feat/fiscal-api`

## Technical Context

- **Backend**: `apps/erp/api` (`@citybox/erp-api`, NestJS 11 Clean Architecture), schema
  Prisma `erp` no DB `citybox_platform` — **não provisionado** → migration escrita à mão +
  versionada, `prisma generate` offline, testes jest in-memory.
- **Frontend**: `apps/erp/web` (Next.js 16, React 19, MUI 9). **Sem harness** → só backend
  testado (D0).
- **fiscal-api**: **NÃO tocado** (emissão de entrada/devolução é pré-requisito fora de escopo).

## Decisões de arquitetura

### D1 — Novo módulo `operation-natures` (não estende FiscalGroup)
Diferente dos grupos fiscais (015/016/018/019, todos `FiscalGroup`), natureza de operação é
uma **entidade própria** com coleções filhas de regras de-para. Novo módulo
`apps/erp/api/src/modules/operation-natures/` (Clean Architecture, molde de `fiscal-defaults`).

### D2 — Data model (schema `erp`)
- **`operation_natures`** (pai): `id`, `organizationId`, `name`, `description` (nullable, ≤300),
  `keepBenefitInUf` Boolean `@default(false)`, timestamps.
- **`operation_nature_cfop_rules`** (filha): `id`, `organizationId`, `operationNatureId`,
  `fromCfop`, `toCfop`, `icmsLivre` (`AMBOS`|`SIM`|`NAO`).
- **`operation_nature_group_rules`** (filha, discriminada): `id`, `organizationId`,
  `operationNatureId`, `taxType` (`ICMS`|`PIS_COFINS`), `fromGroupId`, `toGroupId` (FK →
  `fiscal_groups`, `ON DELETE RESTRICT`? não — `SetNull` quebraria a regra; usar sem FK física
  para o grupo e validar por app-layer como as features irmãs, **ou** FK `SetNull` + resolver
  ignora regra órfã). **Decisão**: FK `SetNull` nos dois lados + o resolver ignora regra com
  grupo nulo (regra órfã não transforma — consistente com FR-008 "não bloquear").
- Migration `<ts>_operation_natures/migration.sql`. As 3 filhas com `@@index` em
  `operationNatureId` + `organizationId`. CHECK em `icms_livre ∈ ('AMBOS','SIM','NAO')` e
  `tax_type ∈ ('ICMS','PIS_COFINS')`.
- `TENANT_SCOPED_MODELS`: registrar `OperationNature` + as 3 filhas.

### D3 — Tabela de CFOP estática (FR-004)
Novo `apps/erp/api/src/modules/operation-natures/domain/cfop.table.ts`: conjunto curado de
CFOPs de **entrada** (1101, 1102, 1111, 1113, 1201, 1202, 2101, 2102…) e **saída** (5101, 5102,
5201, 5202, 5411, 6101, 6102…), com descrição, `isEntradaCfop`/`isSaidaCfop`/`isValidCfop`.
Teste de imutabilidade (snapshot dos códigos + unicidade). Espelho de opções na erp-web
(separa entrada/saída para os selects "De"/"Para"). Substitui o `CFOP_OPTIONS` improvisado.

### D4 — ICMS-livre derivado (FR-006)
`isIcmsLivre(cst, csosn)`: tributado = CST `00` ou CSOSN `102`; **ICMS livre** = CSOSN `103`
(isenção), `300` (imune), `400` (não tributada). Só o conjunto que 016 suporta. Sem flag manual
no produto. Constante `ICMS_LIVRE_CSOSN = ['103','300','400']` na tabela de CFOP/regras.

### D5 — Resolução da regra (FR-007/008)
`ResolveOperationNatureUseCase`: input `{organizationId, operationNatureId, fromCfop,
itemIcmsLivre, itemIcmsGroupId?, itemPisCofinsGroupId?}` → output
`{toCfop, toIcmsGroupId, toPisCofinsGroupId} | null`.
- Filtra `cfopRules` por `fromCfop`. Dos que casam, escolhe o **mais específico**: uma linha
  cuja condição `icmsLivre` é `SIM`/`NAO` e **bate** com `itemIcmsLivre` vence uma `AMBOS`.
  Ordem de precedência: (condição específica que bate) > (`AMBOS`). Empate entre duas
  específicas idênticas → desempate determinístico por `id` (e o cadastro previne duplicidade
  exata `fromCfop`+`icmsLivre`, ver D6).
- Nenhuma linha de CFOP casa → **retorna `null`** (mantém o item original, não bloqueia).
- CFOP casa → `toCfop` resolvido; para cada grupo do item, se houver `group_rule` com
  `taxType` e `fromGroupId === itemGroupId` → `toGroupId`; senão mantém o grupo original.

### D6 — Ambiguidade de cadastro
Rejeitar no cadastro **duas linhas de CFOP com o mesmo `fromCfop` E a mesma `icmsLivre`**
(duplicata exata — ambígua). Linhas com mesmo `fromCfop` mas `icmsLivre` diferentes são
válidas (é o "geral + exceção"). Validação na entidade.

### D7 — Benefício fiscal desabilitado (FR-009)
`keepBenefitInUf` sempre `false` no backend nesta fatia; o campo na erp-web é renderizado
`disabled` com o motivo (depende de `cBenef` por UF, fora de escopo).

### D8 — Localização e permissão
Rota própria `/configuracoes/fiscal/naturezas-operacao` (lista + `/novo` + `/[id]`), link na
aba Padrões fiscais. Permissão: `org.view` (leitura) / `store.catalog.manage` (escrita).

## Camadas erp-api (`modules/operation-natures`)
- **Domain**: `OperationNature` (entidade agregada com `cfopRules`/`groupRules`), value types,
  `create`/`update`/`validate` (nome, descrição ≤300, CFOPs entrada/saída válidos, sem
  duplicata exata, grupos por tributo), `cfop.table.ts`, `icms-livre` helper. Repository
  interface.
- **Application**: `create`/`update`/`list`/`get` + `ResolveOperationNatureUseCase` (exportado).
  DTOs.
- **Infrastructure**: Prisma repo (pai + 2 filhas em transação, molde de `FiscalGroupUfRate`);
  HTTP route `v1/operation-natures` (CRUD); presenter.
- **Module** registrado no AppModule.

## Frontend erp-web (`src/features/fiscal-operation-natures`)
`api/` + `hooks/` (React Query scoped por `useCatalogScope`) + `lib/cfop-options` (entrada/saída
+ ICMS-livre opções) + `components/` (form com 4 blocos: Informações gerais c/ benefício
desabilitado; 3 blocos de-para com linhas adicionáveis via `+ Adicionar campo`) + `pages/`
(lista/novo/[id], `key` no edit) + `GUIA.md`. Grupos via `useFiscalGroupsQuery` (por tributo).
Rota + link em Padrões fiscais.

## Gates & reviewers
- `database-reviewer` (migration Prisma — pai + 2 filhas + CHECKs + FKs).
- `react-reviewer` + `typescript-reviewer` (.tsx da feature + resolvedor/entidade).
- `security-reviewer` (tenant isolation das FKs de grupo + permissão de escrita que altera CFOP/
  tributação). **Não toca XML** (emissão fora de escopo) — mas a regra decide CFOP/grupos.

## Docs-as-code
`apps/erp/web/AGENTS.md`, `apps/erp/api/AGENTS.md` (fiscal-api **não**, emissão intacta) +
GUIA.md da feature. Migration → gate database-reviewer.

## Testes
- **erp-api** (jest in-memory): entidade (validação de CFOP entrada/saída, descrição ≤300, sem
  duplicata exata) + CRUD use-cases + **resolvedor** (casa-uma; casa-duas com especificidade
  Ambos×Sim×Não; não-casa → null; mapeamento de grupos; regra órfã ignorada) + tenant-scope
  allowlist.
- **erp-web**: sem harness → não testado (D0), documentado na conferência.
