# Feature Specification: Grupo de PIS/COFINS

**Feature**: `specs/erp/015-fiscal-pis-cofins-group` | **Branch**: acumula em `feat/fiscal-api`
**Base**: entidade "Grupo fiscal" da feature 014 (`fiscal-default-taxes`). Fatia vertical:
cadastro (erp-api + erp-web) **e** apuração real de PIS/COFINS no XML da NF-e (fiscal-api).

## Resumo

Cadastro de **Grupos de PIS/COFINS** — regra de tributação reutilizável aplicada ao produto —
e a apuração real de PIS e COFINS no XML da NF-e de Regime Normal (hoje CST 01 e valores
`0.00` hardcoded). PIS/COFINS são obrigatórios em toda NF-e (rejeição 745). Esta feature é a
"tabela de tributação por produto" que o comentário do `buildPisCofinsXml` registra como
ausente.

## User Scenarios

### US1 — Cadastrar/editar grupo de PIS/COFINS (P1)
Como operador fiscal, cadastro um grupo com nome, **Situação do PIS** (CST), **Alíquota do PIS
(%)** (condicional ao CST), **Situação do COFINS** e **Alíquota do COFINS (%)** (condicional),
para reutilizar a regra em vários produtos.
- Aceite: criar → listar → editar persiste e recarrega correto; alíquotas aparecem/somem
  conforme o CST; escolher a situação do PIS **espelha** para o COFINS (valor e alíquota),
  editável, com aviso discreto se as faixas divergirem (sem bloquear); alíquota tributada vem
  **pré-preenchida pelo regime** do Emitente (Lucro Presumido → PIS 0,65% / COFINS 3,00%;
  Lucro Real → PIS 1,65% / COFINS 7,60%), sempre editável.

### US2 — Aplicar grupo ao produto e emitir com valor real (P1)
Como emissor, uma NF-e de Regime Normal para produto **com grupo** sai com
`PISAliq`/`COFINSAliq` contendo `vBC`, `pPIS`/`vPIS` e `pCOFINS`/`vCOFINS` calculados sobre a
base do item, e os totais `vPIS`/`vCOFINS` somando os itens — não mais `0.00`.
- Aceite: o critério que prova a entrega (builder test).

### US3 — Produto sem grupo (herança/fallback) (P1)
- Produto **sem grupo** → herda o grupo padrão da organização (Padrões fiscais, feature 014).
- Sem grupo **e** sem padrão → mantém o comportamento atual (CST 01, valores zerados) —
  requisito de **não-regressão** (ninguém deixa de emitir por não ter configurado).

### US4 — Aba "Produtos" do grupo (P2)
Listagem **somente-leitura** dos produtos que usam o grupo (sem vínculo em massa).

## Requirements

- **FR-001** Entidade de grupo por org+tributo (`taxType = PIS_COFINS`) com: nome, `pisCst`,
  `pisAliquota?`, `cofinsCst`, `cofinsAliquota?`. Reutiliza a entidade `FiscalGroup` da 014.
- **FR-002** CSTs suportados: **`PISAliq`/`COFINSAliq`** (CST 01, 02 — base = valor da operação,
  com alíquota) e **`PISNT`/`COFINSNT`** (CST 04–09, sem valores). Fora do escopo: CST 03
  (`PISQtde`, exige `qBCProd`/`vAliqProd`) e 49–99 configurável. Situações fora do conjunto
  aparecem **indisponíveis no select, com o motivo**.
- **FR-003** Alíquota condicional ao CST — campo não renderiza quando não se aplica (CST 04–09).
- **FR-004** Espelhamento PIS → COFINS (situação e alíquota) ao escolher; editável; aviso
  discreto na divergência de faixa; **não** bloqueia.
- **FR-005** Pré-preenchimento da alíquota tributada pelo regime do Emitente (Presumido/Real);
  editável.
- **FR-006** `ProductFiscal.pisCofinsGroupId` (FK → `FiscalGroup`), preservando `applyToAll` e
  override por unidade.
- **FR-007** Resolução na emissão (erp-api/PDV): produto → grupo → CST + alíquota, enviando
  valores **já resolvidos** por item à fiscal-api. A fiscal-api **não** conhece grupos/produto/
  organização.
- **FR-008** `NfeItemInput` (fiscal-api) ganha PIS/COFINS: CST + alíquota (quando tributado).
  `buildPisCofinsXml` emite `PISAliq`/`COFINSAliq` calculado ou `PISNT`/`COFINSNT` conforme o
  CST; totais `vPIS`/`vCOFINS` somam os itens.
- **FR-009** Caminho do **Simples Nacional** (CST 49 zerado, `PISOutr`/`COFINSOutr`) permanece
  **exatamente** como está. Para lojas do Simples o grupo não altera o XML.
- **FR-010** Aba "Produtos" somente-leitura. Salvamento explícito com barra de estado sujo +
  aviso ao sair com alterações pendentes.
- **FR-011** Permissão: leitura `org.view`, escrita `store.catalog.manage` (mesma dos demais
  cadastros fiscais — ver plan).
- **FR-012** Validação: alíquota 0–100, casas decimais definidas.

## Success Criteria

- **SC-001** Criar/listar/editar grupo persiste e recarrega correto; alíquotas condicionais;
  espelhamento com divergência permitida; pré-preenchimento por regime.
- **SC-002** Aba Produtos lista os produtos que usam o grupo.
- **SC-003** **NF-e Regime Normal + produto com grupo → `PISAliq`/`COFINSAliq` com
  `pPIS`/`vPIS` e `pCOFINS`/`vCOFINS` calculados e totais somados** (builder test).
- **SC-004** Produto sem grupo, com padrão da org → emite conforme o padrão.
- **SC-005 (não-regressão 1)** Simples Nacional → CST 49 zerado, intacto.
- **SC-006 (não-regressão 2)** Produto sem grupo e sem padrão → CST 01 zerado.

## Out of Scope

- CST 03 (`PISQtde`/`COFINSQtde`) e 49–99 configurável.
- Vínculo em massa de produtos ao grupo.
- Compartilhamento entre organizações (Princípio V).

## Assumptions / Constraints

- DB erp `citybox_platform` **não provisionado** neste ambiente → migration versionada +
  `prisma generate` offline + testes **jest in-memory** (a spec pede Postgres real; indisponível).
- fiscal-api builder tests são unit (sem DB) → rodam de verdade e provam SC-003/005/006.
- Emissão em **homologação** apenas.
