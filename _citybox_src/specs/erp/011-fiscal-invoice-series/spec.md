# Feature Specification: Séries e Numeração de Notas Fiscais

**Feature Branch**: `011-fiscal-invoice-series`

**Created**: 2026-08-12

**Status**: Draft

**Input**: Expor o controle de séries e numeração (`FiscalSequence`, já existente e usada na emissão) ao lojista: tela no erp-web (`/configuracoes/fiscal`, aba Séries) + endpoints na fiscal-api.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver e criar séries (Priority: P1)

O lojista abre Configurações → Fiscal → aba **Séries** e vê a lista de séries do Emitente para
o ambiente selecionado (colunas: Série, Número atual, Para venda de). Pode **adicionar** uma
série nova informando Série, Número atual inicial e o tipo (Produto - NF-e / Produto - NFC-e /
Serviço). A série criada passa a valer na próxima emissão daquele tipo.

**Why this priority**: É a fachada mínima que dá visibilidade e controle sobre a numeração —
hoje nenhuma rota expõe séries.

**Independent Test**: Com um Emitente, listar séries no ambiente de homologação, criar a série
`001` para NF-e com número inicial e confirmar que aparece na lista e vale na emissão seguinte.

**Acceptance Scenarios**:

1. **Given** um Emitente, **When** abre a aba Séries, **Then** vê as séries reais daquele
   Emitente para o ambiente filtrado (padrão = ambiente do Emitente), com o número atual correto.
2. **Given** a aba Séries, **When** cria a série `001` (Produto - NF-e, número inicial X),
   **Then** ela aparece na lista e a próxima emissão de NF-e naquela série continua a partir de X.
3. **Given** uma série já existente para a mesma chave (tipo+série+ambiente), **When** tenta
   criar de novo, **Then** recebe uma mensagem clara de duplicidade (não erro de banco).

---

### User Story 2 - Ajustar o número atual com segurança (Priority: P1)

O lojista que migrou de outro emissor precisa continuar a numeração de onde parou (ex.: nº 4520).
Pode **aumentar** o número atual, com confirmação explícita e registro de auditoria. **Reduzir é
bloqueado**, com mensagem explicando o motivo.

**Why this priority**: Migração é o caso real que exige a edição; reduzir causaria reemissão de
faixa autorizada (rejeição SEFAZ irreversível).

**Independent Test**: Aumentar o número de uma série (confirmar) e ver o novo valor + registro de
auditoria; tentar reduzir e receber bloqueio com mensagem.

**Acceptance Scenarios**:

1. **Given** uma série com número atual N, **When** o lojista informa um número M > N e confirma,
   **Then** o número passa a M e fica registrado quem alterou, quando, de N para M.
2. **Given** uma série com número atual N, **When** tenta informar M < N, **Then** é bloqueado
   com mensagem explicando que reduzir reemitiria faixa já autorizada.
3. **Given** a intenção de aumentar, **When** confirma, **Then** há um passo de confirmação
   explícito antes de gravar.

---

### User Story 3 - Desativar / excluir séries (Priority: P2)

Séries nunca usadas (número atual 0) podem ser **excluídas** (erro de digitação). Séries com
numeração já gasta só podem ser **desativadas** — o registro é histórico fiscal. Emitir numa
série **desativada** falha com erro específico e acionável.

**Why this priority**: Higiene do cadastro + segurança (não apagar histórico fiscal).

**Independent Test**: Excluir série com número 0 (ok); tentar excluir série usada (bloqueado);
desativar série usada; emitir nela → erro específico "série inativa".

**Acceptance Scenarios**:

1. **Given** série com número atual 0, **When** exclui, **Then** é removida.
2. **Given** série com número atual > 0, **When** tenta excluir, **Then** é impedido; só pode
   desativar.
3. **Given** série desativada, **When** ocorre uma emissão naquela série, **Then** a emissão
   falha com erro específico de "série inativa" (não erro genérico). A tela avisa disso antes de
   desativar.

---

### Edge Cases

- **Filtro de ambiente**: a mesma série tem numeração independente em homologação e produção; a
  tela mostra **um** ambiente por vez (padrão = `defaultEnvironment` do Emitente), nunca os dois
  misturados.
- **Série sem cadastro prévio**: emitir em série inexistente continua criando a sequência sob
  demanda (com `active=true`, `currentNumber=0`) — a tela **não** é pré-requisito para emitir.
- **Formato da série**: string com zeros à esquerda ("001"); normalizar e respeitar o limite de
  tamanho da SEFAZ por modelo.
- **Concorrência de PDVs na mesma série**: a reserva roda em transação; sem duplicidade, no
  máximo contenção de lock.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A fiscal-api DEVE expor endpoints para **listar** as séries de um Emitente com
  filtro de **ambiente**, **criar**, **editar o número atual** (só aumentar), **desativar/reativar**
  e **excluir** (só com número atual 0).
- **FR-002**: A **reserva** de número DEVE permanecer exclusiva do fluxo de emissão — nenhum
  endpoint pode reservar número fora dele.
- **FR-003**: Criar uma série com chave (Emitente+tipo+série+ambiente) já existente DEVE produzir
  mensagem clara de duplicidade, não erro de banco.
- **FR-004**: Editar o número atual DEVE aceitar **apenas aumento**, exigir **confirmação
  explícita** e gerar **registro de auditoria** (quem, quando, de quanto para quanto). Redução
  DEVE ser bloqueada com mensagem explicando o motivo.
- **FR-005**: Excluir DEVE ser permitido **apenas** quando o número atual é 0. Série com número
  usado só pode ser **desativada**.
- **FR-006**: A emissão DEVE **recusar** série inativa com erro específico e acionável (o campo
  `active` deixa de ser decorativo). A criação sob demanda continua criando com `active=true`.
- **FR-007**: A criação sob demanda na emissão (série inexistente) DEVE continuar funcionando —
  a tela não é pré-requisito para emitir (**não-regressão**).
- **FR-008**: A tela (aba Séries em `/configuracoes/fiscal`) DEVE listar as séries reais com
  número atual correto para o ambiente filtrado, permitir criar, editar número (com confirmação
  ao aumentar), desativar (com aviso de que bloqueia emissão) e excluir (só número 0).
- **FR-009**: O `series` DEVE ser normalizado (zeros à esquerda) e respeitar o limite de tamanho
  da SEFAZ por modelo; exibido como na referência ("001").
- **FR-010**: Alterar `currentNumber` ou desativar série DEVE exigir **permissão própria**,
  distinta da de leitura (dado sensível que pode parar a emissão).
- **FR-011**: A página `/configuracoes/fiscal` DEVE ter **abas com a aba ativa refletida na URL**
  (Certificado — feature 010 — e Séries), sem criar rota/leaf novo.

### Key Entities *(include if feature involves data)*

- **Série fiscal (FiscalSequence)**: controle de numeração por Emitente + tipo de documento +
  série + ambiente. Atributos: série (string), número atual, tipo (NF-e/NFC-e/NFS-e), ambiente,
  ativa/inativa. Já existe e é usada na emissão.
- **Registro de alteração de numeração (auditoria)**: quem alterou, quando, série afetada, número
  anterior e novo. Novo — persistido para o histórico de controle fiscal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A tela lista as séries reais do Emitente com o número atual correto para o ambiente
  filtrado.
- **SC-002**: Criar uma série nova passa a valer na próxima emissão daquele tipo.
- **SC-003**: Reduzir o número atual é bloqueado com mensagem; aumentar exige confirmação e fica
  registrado (auditoria consultável).
- **SC-004**: Excluir série com numeração usada é impedido; desativar funciona.
- **SC-005**: Emitir em série desativada falha com erro **específico** (não genérico).
- **SC-006**: Série duplicada produz mensagem clara, não erro de banco.
- **SC-007 (NÃO-REGRESSÃO)**: emitir com série inexistente continua criando a sequência sob
  demanda como hoje.

## Assumptions

- `FiscalSequence` já existe (chave `companyId+documentType+series+environment`, `currentNumber`,
  `active`) e é usada por `IssueNfeUseCase`/`IssueNfceUseCase`/`IssueNfseUseCase` via `reserveNext()`.
- A auditoria da alteração de número exige persistência própria → **tabela nova** (migration na
  fiscal-api) — a definir no plano.
- Rótulos de domínio na tela (NF-e/NFC-e/NFS-e), não os nomes do enum.
- O campo "Aplicativo" (série por terminal) fica **fora** — a fiscal-api é centrada no Emitente.

## Fora de escopo

- Inutilização de faixa de numeração (já existe como evento; entrega separada).
- Contingência e emissão offline.
- Série por aplicativo/terminal (limite conhecido; revisitar se contingência por terminal virar requisito).
