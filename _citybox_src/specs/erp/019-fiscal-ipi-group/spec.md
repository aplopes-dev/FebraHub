# Feature Specification: Grupos do IPI (cadastro + emissão do bloco IPI na NF-e)

**Feature Branch**: `019-fiscal-ipi-group` (acumulada em `feat/fiscal-api`)

**Created**: 2026-08-13

**Status**: Draft

**Input**: `specs/005-nfce-cupom-fiscal/contracts/MenuFiscal/Grupo do IPI.txt`

## Contexto e prioridade *(registro obrigatório)*

Esta feature é a última das telas de **grupos fiscais** irmãs (ICMS 016, PIS/COFINS 015,
ISSQN 018) antes de 020 (Natureza de operações). O tributo é **IPI**; a entidade é o
mesmo **Grupo fiscal** (`FiscalGroup`, `taxType='IPI'`), não uma entidade nova.

**Por que o IPI vem por último em valor** (registrado na spec conforme o prompt): o IPI
incide sobre indústria e equiparado a industrial. O piloto (comércio/food em Ilhéus)
raramente tem incidência, enquanto o grupo de PIS/COFINS é obrigatório em toda NF-e
(rejeição 745 sem ele) e já é emitido. A ordem foi por valor, não pela ordem do menu.

Como as features irmãs, é **fatia vertical**: cadastro (erp-web + erp-api) **e** emissão
do bloco `IPI` no XML da NF-e (fiscal-api) na mesma entrega. Sem emitir o bloco, o
cadastro é dado morto — hoje `buildImpostoXml` monta apenas ICMS + PIS/COFINS e o total
sai com `vIPI: '0.00'` fixo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar e listar Grupos do IPI (Priority: P1)

O lojista abre Configurações → Fiscal → Grupos do IPI. A lista mostra estado vazio
("Nenhum grupo de IPI encontrado / Crie um grupo de IPI para organizar e aplicar regras
fiscais aos seus produtos de forma prática" + botão "Novo Grupo IPI"). Ao criar, informa
Nome, Grupo tributário de IPI (CST de saída), Grupo de Enquadramento Legal (`cEnq`) e —
apenas quando o CST é tributado (50) — o Percentual (%). Salva e o grupo persiste.

**Why this priority**: é o núcleo do cadastro; sem ele não há perfil de IPI reutilizável.

**Independent Test**: criar um grupo com CST 50 + `cEnq` + percentual, recarregar a lista
e ver o grupo; editar e ver o campo Percentual aparecer/sumir conforme o CST.

**Acceptance Scenarios**:

1. **Given** organização sem grupos de IPI, **When** abro a lista, **Then** vejo o estado
   vazio com o botão "Novo Grupo IPI".
2. **Given** o formulário aberto, **When** seleciono um CST tributado (50), **Then** o
   campo "Percentual (%)" aparece e é obrigatório.
3. **Given** o formulário aberto, **When** seleciono um CST não tributado (51–55), **Then**
   o campo "Percentual (%)" **não** é renderizado.
4. **Given** um grupo criado com CST 50, `cEnq` e percentual, **When** recarrego a lista,
   **Then** o grupo aparece e reabre com os mesmos valores.
5. **Given** alterações não salvas no formulário, **When** tento sair, **Then** vejo o
   aviso "Você tem alterações não salvas" com "Descartar alterações" e "Salvar".

---

### User Story 2 - Emitir NF-e com o bloco IPI a partir do grupo (Priority: P1)

Um item de produto com grupo de IPI tributado (CST 50) gera uma NF-e cujo `imposto`
inclui o grupo `IPI` completo (`cEnq` + `IPITrib` com `vBC`/`pIPI`/`vIPI`), e o total
`vIPI` soma os itens com IPI. Um item com CST 51–55 sai com `IPI` + `IPINT`, sem valores.

**Why this priority**: é a metade "emissão" da fatia vertical; sem ela o cadastro é morto.

**Independent Test**: builder da fiscal-api com um item CST 50 → verificar `IPITrib` no XML
gerado e o `vIPI` do total; item CST 53 → verificar `IPINT` sem valores.

**Acceptance Scenarios**:

1. **Given** item com grupo IPI CST 50, `cEnq='999'`, percentual 10, base R$ 100, **When**
   emito a NF-e, **Then** o XML tem `IPI/cEnq='999'` e `IPI/IPITrib` com `vBC=100.00`,
   `pIPI=10.0000`, `vIPI=10.00`, e o total `vIPI=10.00`.
2. **Given** item com grupo IPI CST 53, `cEnq='999'`, **When** emito, **Then** o XML tem
   `IPI/IPINT/CST=53` sem `vBC`/`pIPI`/`vIPI`, e o total `vIPI` não soma esse item.
3. **Given** um documento com item tributado (CST 50) e item isento (CST 53), **When**
   emito, **Then** o total `vIPI` soma apenas o item tributado.

---

### User Story 3 - Vincular produtos e ver quem é afetado (Priority: P2)

O `ProductFiscal` referencia o grupo de IPI por FK (`ipiGroupId`, nullable), preservando
`applyToAll` e o override por unidade, como as features irmãs. A aba "Produtos" do
formulário do grupo lista, **somente leitura**, os produtos que usam o grupo.

**Why this priority**: responde "quem é afetado se eu mudar esta alíquota"; vínculo em
massa está fora de escopo.

**Independent Test**: erp-api — vincular um `ProductFiscal.ipiGroupId` a um grupo e
consultar os produtos do grupo; ver o produto retornado.

**Acceptance Scenarios**:

1. **Given** um produto com `ipiGroupId` apontando para o grupo, **When** abro a aba
   Produtos, **Then** vejo o produto listado (leitura).
2. **Given** a aba Produtos, **When** o formulário ainda não foi salvo, **Then** a aba
   nasce desabilitada e só habilita após salvar.

---

### Edge Cases

- **Não-regressão (CRÍTICO)**: item **sem** grupo de IPI continua **sem** bloco `IPI` no
  XML e com `vIPI: 0.00` no total — byte a byte equivalente ao XML de hoje. Teste próprio.
- CST não suportado (entradas 00–05, 49) nunca é oferecido no select — o v1 só emite saída
  (`tpNF: '1'`).
- Percentual fora da faixa 0–100 é rejeitado no cadastro.
- `cEnq` ausente com grupo selecionado é rejeitado (obrigatório quando há grupo).
- CST tributado (50) sem percentual é rejeitado; CST não tributado (51–55) ignora/zera o
  percentual.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir criar, listar e editar Grupos do IPI por organização,
  com Nome, CST do IPI (situação tributária de saída), `cEnq` (enquadramento legal) e
  Percentual (nulo quando o CST não é tributado).
- **FR-002**: O CST do IPI DEVE ser limitado aos CSTs de **saída**: 50 (tributada), 51
  (tributada com alíquota zero), 52 (isenta), 53 (não-tributada), 54 (imune), 55 (com
  suspensão) e 99 (outras saídas). Entradas (00–05, 49) ficam de fora.
- **FR-003**: O campo Percentual DEVE ser exibido/obrigatório **apenas** quando o CST é
  tributado (50). Para 51–55 o campo não é aplicável e não é renderizado. (Ver *Assumptions*
  sobre o CST 99.)
- **FR-004**: O `ProductFiscal` DEVE referenciar o grupo de IPI por FK `ipiGroupId`
  (nullable — ausência é o caso normal), preservando `applyToAll` e override por unidade.
- **FR-005**: A aba "Produtos" do formulário DEVE listar, somente leitura, os produtos que
  usam o grupo; nasce desabilitada e habilita após salvar.
- **FR-006**: O builder da NF-e (fiscal-api) DEVE emitir o grupo `IPI` com `cEnq` e,
  conforme o CST: `IPITrib` (50, 99 → `vBC`, `pIPI`, `vIPI`) ou `IPINT` (51–55, sem valores).
- **FR-007**: O total `vIPI` DEVE deixar de ser fixo e passar a somar os itens que tiverem
  IPI tributado.
- **FR-008 (NÃO-REGRESSÃO)**: Item **sem** grupo de IPI DEVE sair sem bloco `IPI` e com
  `vIPI: 0.00` no total — XML byte a byte equivalente ao de hoje. Teste dedicado.
- **FR-009**: A tabela de enquadramento legal (`cEnq`) DEVE ser estática, versionada em
  código, com teste que quebra se alguém a alterar — mesmo padrão do bundle de CAs da SEFAZ.
  Não é cadastro do lojista nem seed de banco; atualização entra por PR.
- **FR-010**: A permissão de cadastro DEVE ser a mesma dos demais cadastros fiscais no
  erp-api (`store.catalog.manage`) — nomeada explicitamente no plan.
- **FR-011**: Salvamento explícito, com aviso ao sair com alterações pendentes.
- **FR-012**: Validação: percentual 0–100; `cEnq` obrigatório quando há grupo.

### Key Entities

- **FiscalGroup (taxType=IPI)**: grupo de IPI por organização — nome, `ipiCst`,
  `ipiEnquadramento` (`cEnq`), `ipiRate` (percentual, nulo quando não tributado).
- **ProductFiscal.ipiGroupId**: FK nullable para o grupo de IPI (item do catálogo).
- **Tabela de enquadramento legal (`cEnq`)**: estática, em código.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Criar, listar e editar um grupo de IPI persiste e recarrega correto; o campo
  Percentual aparece e some conforme o CST.
- **SC-002**: A aba Produtos lista corretamente os produtos que usam o grupo.
- **SC-003**: NF-e de produto com grupo de IPI tributado (CST 50) sai com `IPI` completo
  (`cEnq` + `IPITrib` com `vBC`/`pIPI`/`vIPI`) e o total `vIPI` somando os itens.
- **SC-004**: NF-e de produto com CST 51–55 sai com `IPI` + `IPINT`, sem valores.
- **SC-005 (NÃO-REGRESSÃO)**: NF-e de produto sem grupo de IPI sai byte a byte equivalente
  ao XML de hoje, sem bloco `IPI` e com `vIPI: 0.00` no total.
- **SC-006**: Nenhuma situação tributária oferecida que o emissor não saiba montar.

## Assumptions

- **CST 99 (outras saídas)**: é `IPITrib` no XSD (exige `vBC`/`pIPI`/`vIPI`). O prompt
  confirma o campo Percentual "selecionando 50 - Saída tributada" e cita apenas "50 e 99 →
  IPITrib". Assunção: o Percentual também é exigido para o **CST 99**. A ser confirmado no
  plan/tasks; o tratamento no builder segue o XSD (99 → IPITrib com valores).
- Localização: mesma resposta dada ao Grupo de ICMS (016) — **rota própria sob o leaf
  fiscal** (`/configuracoes/fiscal/grupos-ipi`), por ter lista + formulário com abas.
- `ProductFiscal.ipi` hoje é String livre (`@default("")`). A migration verifica se há dado
  real (só `""` esperado) antes de decidir o destino; o novo caminho é a FK `ipiGroupId`.
- erp-web sem harness de teste de frontend (Vitest/RTL) — **só backend testado** nesta
  entrega (lacuna de teste de frontend documentada na conferência). Herdado das features
  irmãs.
- Sem checkbox "Compartilhar com todas as empresas": o grupo pertence à organização e vale
  para todas as unidades (Princípio V). O prompt menciona o checkbox na referência, mas a
  decisão herdada das irmãs prevalece — **não reabrir**.
- Fora de escopo: grupos de ICMS/PIS-COFINS/ISSQN; IPI em entradas; devolução de IPI
  (`vIPIDevol`); vínculo em massa.
