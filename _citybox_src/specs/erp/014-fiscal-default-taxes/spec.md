# Feature Specification: Padrões Fiscais

**Feature Branch**: `014-fiscal-default-taxes`
**Created**: 2026-08-13
**Status**: Draft
**Input**: Tela "Padrões fiscais" do erp-web — grupo fiscal padrão da organização por tributo, herdado pelos produtos sem valor próprio. Base de 015/016/018/019 (Grupo fiscal mínimo + campo `issqn` em `ProductFiscal`).

## ⚠️ Limitação conhecida (declarada)

Hoje `ProductFiscal` (erp-api, schema `erp`) guarda `icms/pisCofins/ipi/cfop` como **String livre**
e é referenciado **apenas** no módulo `catalog` — **nenhum caminho de emissão lê esses valores** e a
fiscal-api não os recebe. Logo, grupos e padrões são **cadastro que a emissão ainda não consome**. O
valor desta entrega é **preparar o vocabulário e a herança**, não alterar a emissão. Fazer a emissão
consumir esses valores é **fora de escopo**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Definir o grupo fiscal padrão por tributo (Priority: P1)

O lojista abre Configurações → Fiscal → aba **Padrões fiscais** e escolhe, por tributo (ICMS, IPI,
PIS/COFINS, ISSQN) e para o CFOP, o grupo/valor padrão da organização. Salva num botão. Recarrega
com os valores persistidos.

**Independent Test**: escolher um grupo padrão por tributo, salvar, recarregar → persistido.

**Acceptance Scenarios**:
1. **Given** a aba, **When** define um padrão por tributo e salva, **Then** persiste e recarrega correto.
2. **Given** um tributo **sem grupo cadastrado**, **When** a tela carrega, **Then** mostra estado
   vazio explícito dizendo o que fazer (acionar suporte/administrador — o lojista não cria grupos aqui).
3. **Given** seleção alterada, **When** o usuário não clica em Salvar, **Then** nada é persistido
   (sem autosave).

### User Story 2 - Herança exibida nos parâmetros fiscais do produto (Priority: P1)

Em `/catalogo/parametros-fiscais`, um produto **sem valor próprio** em um tributo exibe o **valor
herdado do padrão vigente**, visivelmente marcado como "herdado". Produto com valor manual permanece
intocado. Mudar o padrão altera o que os produtos sem valor próprio exibem — **sem escrever nada no
catálogo** (herança por referência, resolvida na exibição).

**Independent Test**: produto sem ICMS próprio mostra o ICMS do padrão marcado "herdado"; mudar o
padrão muda o exibido; produto com ICMS manual não muda.

**Acceptance Scenarios**:
1. **Given** produto sem valor de um tributo, **When** abre os parâmetros fiscais, **Then** vê o
   valor do padrão marcado como herdado.
2. **Given** produto com valor manual, **When** o padrão muda, **Then** o valor do produto não muda.
3. **Given** padrão alterado, **When** reabre um produto sem valor próprio, **Then** reflete o novo
   padrão, sem nenhuma escrita no catálogo.

### Edge Cases
- Aba ativa refletida na URL (compartilhável/recarregável).
- Aviso de alterações não salvas ao trocar de aba.
- Tributo sem grupos: select desabilitado/estado vazio com orientação.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: O erp-api DEVE ter uma entidade **Grupo fiscal** mínima por organização: `taxType`
  (ICMS|IPI|PIS_COFINS|ISSQN) + nome/identificador. **Sem** alíquotas/UF/FCP/ST/cBenef (backlog).
- **FR-002**: O erp-api DEVE listar grupos por tributo para popular os selects (leitura). **Sem CRUD**
  de grupos nesta entrega — registros vêm de seed/backoffice.
- **FR-003**: O erp-api DEVE persistir **um** registro de padrões por organização: um grupo padrão por
  tributo (ICMS/IPI/PIS_COFINS/ISSQN) + CFOP padrão. **Sem** override por filial (o override por
  unidade já existe no produto).
- **FR-004**: `ProductFiscal` DEVE ganhar o campo **`issqn`** (String livre + `applyToAll`), com o
  override por unidade em `ProductFiscalBranch` — mesmo formato dos outros quatro.
- **FR-005**: A herança DEVE ser **por referência, resolvida na exibição**: produto sem valor próprio
  reflete o padrão vigente; mudar o padrão vale imediatamente; valor manual sempre prevalece. **Sem**
  cópia em massa nem migração ao salvar.
- **FR-006**: A tela (aba em `/configuracoes/fiscal`) DEVE ter salvamento explícito, aviso de
  alterações não salvas, e **estado vazio honesto** por tributo sem grupos.
- **FR-007**: `/catalogo/parametros-fiscais` DEVE exibir o valor herdado (marcado como herdado) para
  campos vazios do produto.
- **FR-008**: Ler/gravar os padrões DEVE exigir permissão de escopo organizacional (não aberta a
  qualquer papel).

### Key Entities
- **Grupo fiscal (FiscalGroup)**: por organização — tributo + nome. Distinto do tipo `FiscalGroupField`
  (o `{value, applyToAll}` já existente no `ProductFiscal`).
- **Padrões fiscais (FiscalDefaultTaxes)**: um por organização — grupo padrão por tributo + CFOP padrão.
- **ProductFiscal (existente)**: ganha `issqn` + override em `ProductFiscalBranch`.

## Success Criteria *(mandatory)*
- **SC-001**: Definir um padrão por tributo persiste e recarrega correto.
- **SC-002**: Produto sem valor próprio exibe o herdado (marcado); produto com valor manual intocado.
- **SC-003**: Mudar o padrão altera o exibido nos produtos sem valor próprio, sem escrita no catálogo.
- **SC-004**: Tributo sem grupo mostra estado vazio explicativo.
- **SC-005**: Nenhuma seleção persiste sem salvar.

## Assumptions
- Grupos fiscais vêm de seed/backoffice (sem CRUD aqui).
- CFOP: sem tela "Grupo do CFOP"; ver decisão no plano (D1).
- erp-api DB não provisionado neste env → migration versionada + testes jest in-memory (a spec pede
  Postgres real; indisponível aqui — documentado).
- Frontend sem harness (D0).

## Fora de escopo
- CRUD de grupos + alíquotas por UF (FCP/ST/cBenef/partilha/CST/CSOSN) — feature futura.
- Emissão consumir esses valores; **qualquer** alteração na fiscal-api.
- Demais telas do menu (Série, Tipo NF PDV, Info adicionais, Natureza de operações).
