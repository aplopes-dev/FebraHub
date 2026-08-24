# Feature Specification: Naturezas de Operação (de-para entrada→saída + resolução da regra)

**Feature Branch**: `020-fiscal-operation-natures` (acumulada em `feat/fiscal-api`)

**Created**: 2026-08-13

**Status**: Draft

**Input**: `specs/005-nfce-cupom-fiscal/contracts/MenuFiscal/Natureza de operações.txt`

## Contexto e pré-requisitos *(registro obrigatório)*

Esta é a **última** feature da fila fiscal (Menu Fiscal). Entrega o cadastro de
**Naturezas de Operação**: regras de-para que, dada uma operação de **entrada**,
determinam o **CFOP e os grupos fiscais** da operação de **saída** correspondente.
Caso canônico: **devolução de mercadoria para fornecedor**.

**Pré-requisitos do prompt e seu estado hoje:**
1. Grupos de ICMS (`fiscal-icms-group`, 016) — ✅ **implementado**.
2. Grupos de PIS/COFINS (`fiscal-pis-cofins-group`, 015) — ✅ **implementado**.
3. Tabela de CFOP — ❌ não há tabela formal; `ProductFiscal.cfop` é String livre e o
   `CFOP_OPTIONS` da erp-web é um catálogo de exibição incompleto (só saída). **Esta
   feature cria a tabela estática versionada** (entrada + saída), source-of-truth na
   erp-api, com teste de imutabilidade (padrão do `cEnq` do IPI / bundle de CAs).
4. Emissão de **ENTRADA/DEVOLUÇÃO** na fiscal-api — ❌ o builder fixa `tpNF: '1'`
   (saída). **Fora de escopo** (pré-requisito, não esta feature). Consequência: a
   regra é **resolvida e testada em isolamento** (dado um CFOP de entrada → devolve o
   CFOP+grupos de saída mapeados), mas **não é disparada** por um fluxo de emissão de
   entrada (que não existe). Mesma natureza do deferimento **B7**.
5. `cBenef` por UF — ❌ fora da fatia do grupo de ICMS. O campo "Manter Código de
   Benefício Fiscal na UF" é renderizado **desabilitado com o motivo** (padrão dos
   campos sem backend em Configurações gerais e do DIFAL em Tipo de NF do PDV).

## Clarifications

### Session 2026-08-13

- Q: As regras de grupo (ICMS e PIS/COFINS) não têm validação contra duplicata de `fromGroupId` dentro do mesmo tributo (diferente do CFOP, que rejeita duplicata exata — D6). Hoje o resolvedor usa a primeira que bater na ordem de criação, silenciosamente. Qual o comportamento correto? → A: Rejeitar no cadastro — mesmo tratamento do D6 para CFOP: duas linhas com o mesmo `fromGroupId` no mesmo tributo viram erro de validação ao salvar.
- Q: `fromGroupId`/`toGroupId` das regras de grupo não têm nenhuma validação de organização nem de tributo (`FiscalGroup.taxType`) na escrita, diferente das features irmãs (015/016/018/019). O que fazer? → A: Validar organização + tributo na escrita (create/update) — mesmo padrão das irmãs; rejeitar com erro claro se o grupo não existir, for de outra org, ou tiver `taxType` diferente do declarado na linha.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar e listar Naturezas de Operação (Priority: P1)

O lojista abre Configurações → Fiscal → Naturezas de Operação. Cria uma natureza
(ex.: "Devolução de Mercadoria para Fornecedor") com Nome, Descrição opcional, e as
**três listas de-para** (CFOP com condição ICMS Livre, grupo de ICMS, grupo de
PIS/COFINS), cada uma com linhas adicionáveis. Salva e a natureza persiste/recarrega.

**Why this priority**: núcleo do cadastro; sem ele não há regra para resolver.

**Independent Test**: criar uma natureza com as três listas, recarregar e ver os
mesmos dados.

**Acceptance Scenarios**:
1. **Given** organização sem naturezas, **When** abro a lista, **Then** vejo estado
   vazio + botão "Nova natureza de operações".
2. **Given** o formulário, **When** adiciono/removo linhas em cada bloco (CFOP, ICMS,
   PIS/COFINS), **Then** as linhas persistem ao salvar e reabrem iguais.
3. **Given** o formulário, **When** olho o campo "Manter Código de Benefício Fiscal na
   UF", **Then** ele está **desabilitado**, com o motivo visível, e não aceita edição.
4. **Given** uma linha de CFOP, **When** escolho "De", **Then** o select oferece só
   CFOPs de **entrada** (1101, 1102, 1111, 1113…) e "Para" só CFOPs de **saída**.

---

### User Story 2 - Resolver a regra de-para (Priority: P1)

Dada uma operação de entrada (CFOP de entrada + item com seu grupo de ICMS), a regra
resolve o CFOP de saída e os grupos de ICMS/PIS-COFINS mapeados, respeitando a
condição **ICMS Livre**.

**Why this priority**: é a metade "uso real" da fatia vertical (o resolvedor).

**Independent Test**: erp-api — resolver dado (naturezaId, cfopEntrada, itemIcmsLivre)
→ `{cfopSaida, icmsGroupId?, pisCofinsGroupId?}`; testar casa-uma, casa-duas
(especificidade), não-casa.

**Acceptance Scenarios**:
1. **Given** uma natureza com uma linha de CFOP que casa a entrada, **When** resolvo,
   **Then** obtenho o CFOP de saída e os grupos mapeados.
2. **Given** uma linha geral (ICMS Livre = **Ambos**) e uma exceção (ICMS Livre =
   **Sim**) para o mesmo CFOP de entrada, **When** resolvo um item **ICMS-livre**,
   **Then** vence a **exceção** (Sim), não a geral (Ambos).
3. **Given** um item **não** ICMS-livre com as mesmas duas linhas, **When** resolvo,
   **Then** vence a linha **Não** se existir, senão a **Ambos**.
4. **Given** nenhuma linha casa, **When** resolvo, **Then** **mantém o valor original
   do item** e **não bloqueia** a operação.

---

### Edge Cases

- ICMS-livre de um item é **derivado** do CST/CSOSN do seu grupo de ICMS — **não** de
  flag manual no produto (uma segunda declaração da mesma verdade divergiria do CST e
  escolheria a linha errada em silêncio). Lista exata de CSTs/CSOSN ICMS-livre no plan.
- Select nunca oferece CFOP/grupo que o emissor não saiba montar.
- Descrição limitada a 300 caracteres.
- CFOP de entrada duplicado em duas linhas com a **mesma** condição ICMS Livre é
  ambíguo — decidir no plan (rejeitar no cadastro OU desempate determinístico).
- Grupo de origem (`fromGroupId`) duplicado em duas linhas do mesmo tributo (ICMS
  ou PIS/COFINS) é igualmente ambíguo — **rejeitar no cadastro** (mesmo tratamento
  do CFOP acima; ver Clarifications).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir criar, listar e editar Naturezas de Operação por
  organização, com Nome, Descrição opcional (≤300), indicador de benefício fiscal
  (sempre `false` nesta fatia) e as três listas de-para.
- **FR-002**: A lista de CFOP DEVE ter linhas `De (entrada) → Para (saída)` + condição
  **ICMS Livre** (`AMBOS`|`SIM`|`NAO`), adicionáveis/removíveis.
- **FR-003**: As listas de grupo de ICMS e de PIS/COFINS DEVEM ter linhas
  `De (grupo) → Para (grupo)`, adicionáveis/removíveis. Duas linhas com o mesmo
  `fromGroupId` dentro do mesmo tributo (ICMS ou PIS/COFINS) são ambíguas — o
  cadastro DEVE rejeitar a duplicata exata, mesmo tratamento do CFOP (FR-002).
- **FR-004**: A **tabela de CFOP** DEVE ser estática, versionada em código, com teste
  que quebra ao alterá-la; separa CFOPs de **entrada** (`1xxx`/`2xxx`) dos de **saída**
  (`5xxx`/`6xxx`). O select "De" oferece só entrada; "Para" só saída.
- **FR-005**: O indicador **ICMS Livre** é a **condição** de aplicação da linha (não um
  valor aplicado): a linha vale para itens ICMS-livre (`SIM`), não ICMS-livre (`NAO`)
  ou ambos (`AMBOS`).
- **FR-006**: O "ser ICMS-livre" de um item DEVE ser **derivado** do CST/CSOSN do seu
  grupo de ICMS (não tributado = ICMS livre). Lista exata no plan.
- **FR-007 (RESOLUÇÃO)**: quando várias linhas de CFOP casam, **a mais específica
  vence**: `SIM`/`NAO` prevalece sobre `AMBOS`. Requisito testável.
- **FR-008 (RESOLUÇÃO)**: quando **nenhuma** linha casa, o sistema **mantém o valor
  original do item** e **não bloqueia** a operação. Requisito testável.
- **FR-009**: O campo "Manter Código de Benefício Fiscal na UF" DEVE ser renderizado
  **desabilitado com o motivo** (depende de `cBenef` por UF, fora de escopo).
- **FR-010**: Só oferecer nos selects CFOP/grupo que o emissor saiba montar (grupos da
  própria org; CFOPs da tabela versionada).
- **FR-011**: Permissão de escrita própria (`store.catalog.manage`), distinta da de
  leitura (`org.view`) — nomeadas explicitamente.
- **FR-012**: Salvamento explícito, com aviso ao sair com alterações pendentes.
- **FR-013**: `fromGroupId`/`toGroupId` das regras de grupo DEVEM ser validados na
  escrita (create/update): o `FiscalGroup` referenciado existe, pertence à mesma
  organização do chamador, e seu `taxType` bate com o `taxType` declarado na linha
  — rejeitar com erro claro caso contrário (mesmo padrão de validação de FK das
  features irmãs 015/016/018/019).

### Key Entities

- **OperationNature**: por organização — nome, descrição, `keepBenefitInUf` (bool),
  e três coleções de regras (filhas): `cfopRules`, `icmsGroupRules`, `pisCofinsRules`.
- **OperationNatureCfopRule**: `fromCfop` (entrada), `toCfop` (saída), `icmsLivre`
  (`AMBOS`|`SIM`|`NAO`).
- **OperationNatureGroupRule** (ICMS e PIS/COFINS): `fromGroupId`, `toGroupId` (FK →
  FiscalGroup, por tributo). Ambos DEVEM ser validados na escrita: grupo existe,
  pertence à organização do chamador, e `FiscalGroup.taxType` bate com o `taxType`
  declarado na linha (mesmo padrão das features irmãs 015/016/018/019 — ver
  Clarifications).
- **Tabela de CFOP**: estática, em código (entrada + saída).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Criar/listar/editar uma natureza com as três listas persiste e recarrega
  correto.
- **SC-002**: Operação de entrada que casa uma linha resolve o CFOP e os grupos
  mapeados.
- **SC-003**: Item ICMS-livre com regra geral (Ambos) + exceção (Sim) resolve pela
  exceção.
- **SC-004**: Operação sem correspondência mantém o valor original do item, sem
  bloquear.
- **SC-005**: O campo de benefício fiscal aparece desabilitado, com o motivo, e não
  aceita edição.
- **SC-006**: Nenhum select oferece CFOP ou grupo que o emissor não saiba montar.

## Assumptions

- Localização: **rota própria** sob o leaf fiscal (`/configuracoes/fiscal/naturezas-operacao`),
  como as features irmãs (015/016/018/019) que têm lista + formulário.
- **Fora de escopo confirmado**: emissão de entrada/devolução na fiscal-api (pré-req);
  grupos de ICMS/PIS-COFINS (features próprias); `cBenef` por UF. A **aplicação real da
  regra** na emissão fica deferida (B7) — entregamos o resolvedor + contrato + tabela.
- `services/fiscal-api/AGENTS.md` **não** é tocado (a emissão não muda nesta fatia —
  só cadastro + resolvedor no erp-api).
- erp-web sem harness de teste de frontend (Vitest/RTL) — **só backend testado** (D0),
  lacuna documentada na conferência. Herdado das features irmãs.
- ICMS-livre (derivação, a fechar no plan): tributado = CST 00 e CSOSN 102; **ICMS
  livre** = CSOSN 103 (isenção), 300 (imune), 400 (não tributada). (016 só suporta esse
  conjunto de CST/CSOSN.)
