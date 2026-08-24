# Feature Specification: Tipo de NF emitida pelo PDV

**Feature Branch**: `013-pos-fiscal-document-type`
**Created**: 2026-08-13
**Status**: Draft (config entregue; consumo no PDV **deferido** — ver "Bloqueio descoberto")
**Input**: Configurar qual modelo de documento fiscal o PDV emite ao concluir a venda (NF-e 55 / NFC-e 65), e o consumo dessa configuração pelo PDV.

## ⚠️ Bloqueio descoberto (escopo real desta entrega)

O `.txt` prevê 3 partes: (a) config no erp-api, (b) tela no erp-web, (c) **consumo no PDV**
(ler a config e emitir no fechamento da venda). Ao investigar, o app-alvo documentado
(`apps/pdv/frontend`) **não tem código** (0 arquivos versionados). O PDV real hoje é um app
**Flutter/Dart** (`apps/pdv/app`, 420 arquivos) e/ou a PWA legada `apps/pdv/legado`
(`@citybox/pdv`) — **nenhum deles tem integração fiscal hoje** (confirmado por busca). Wirar
emissão fiscal ao vivo no fechamento de venda de um app Flutter é um esforço grande de **outra
stack** (Dart), que não deve ser feito às cegas.

**Decisão:** esta entrega faz **(a) + (b)** — a configuração e a exposição ao PDV — de forma
completa e testada. **(c) o consumo/emissão no PDV fica DEFERIDO** como trabalho próprio (stack
Flutter/legado), com a config já pronta e um endpoint device para o PDV ler quando for wirado.
Registrado honestamente; não bloqueia 014+.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Escolher o modelo emitido pelo PDV (Priority: P1)

O lojista abre Configurações → Fiscal → aba **Tipo de NF (PDV)** e escolhe o modelo que o PDV
emitirá: Modelo 55 (NF-e), Modelo 65 (NFC-e) ou nenhum. Um aviso legal (Lei 8.846) explica por
que a configuração existe. Salva e recarrega com o valor persistido.

**Why this priority**: é a configuração que o PDV lê para saber o que emitir.

**Independent Test**: escolher Modelo 65, salvar, recarregar e ver persistido no erp-api.

**Acceptance Scenarios**:
1. **Given** a aba, **When** escolhe Modelo 55/65 e salva, **Then** persiste no erp-api e recarrega correto.
2. **Given** o Emitente **sem CSC**, **When** tenta salvar Modelo 65, **Then** é **bloqueado** com
   mensagem que leva à aba Configurações gerais (onde o CSC é cadastrado).
3. **Given** o Emitente **sem certificado A1 válido**, **When** salva, **Then** recebe **aviso**
   (não bloqueio).
4. **Given** o toggle "ICMS para Consumidor Final", **When** a tela carrega, **Then** ele está
   **desabilitado** com o motivo visível (DIFAL não existe no emissor — backlog).

### User Story 2 - PDV consome a configuração (Priority: P1) — **DEFERIDA**

O PDV lê a config e emite o modelo no fechamento; sem config, conclui a venda com aviso; falha
não-transitória conclui a venda e registra cupom pendente/erro. **Deferida** — depende do app
PDV (Flutter `apps/pdv/app` / legado), fora desta entrega (ver Bloqueio). A config já é exposta
por endpoint device para quando o PDV for wirado.

## Requirements *(mandatory)*

### Functional Requirements (entregues)
- **FR-001**: O erp-api DEVE persistir, por organização, o modelo de documento que o PDV emite
  (Modelo 55 / Modelo 65 / não configurado), com registro de quem alterou.
- **FR-002**: O erp-api DEVE expor a configuração: uma rota de gestão (lojista, org do header) e
  uma rota **device** (o PDV lê pela autenticação do terminal).
- **FR-003**: A tela (aba em `/configuracoes/fiscal`) DEVE permitir escolher o modelo e salvar,
  recarregando com o valor persistido, com o aviso legal (Lei 8.846) visível.
- **FR-004**: Salvar **Modelo 65** DEVE ser **bloqueado** quando o Emitente não tem CSC, com
  mensagem que leva à aba Configurações gerais.
- **FR-005**: Ausência de certificado A1 válido DEVE gerar **aviso**, não bloqueio.
- **FR-006**: O toggle "ICMS para Consumidor Final" DEVE ser renderizado **desabilitado**, com o
  motivo (DIFAL inexistente no emissor — backlog).
- **FR-007**: A config **não** mora no Emitente da fiscal-api nem dentro de `PosPolicy` — é
  entidade própria por organização (sem eixo de filial/terminal).
- **FR-008**: Alterar a config DEVE exigir permissão distinta da de leitura.

### Functional Requirements (deferidos — PDV)
- **FR-101 (deferida)**: O PDV lê a config e emite o modelo no fechamento.
- **FR-102 (deferida)**: Venda sem config conclui com aviso e registro (não bloqueia; não assume modelo).
- **FR-103 (deferida)**: Falha não-transitória conclui a venda e registra cupom pendente/erro visível.

### Key Entities
- **Configuração fiscal do PDV**: por organização — modelo emitido (55/65/nenhum), quem alterou, quando.

## Success Criteria *(mandatory)*
- **SC-001**: Escolher Modelo 55/65 persiste e recarrega correto. *(entregue)*
- **SC-002**: Salvar Modelo 65 sem CSC é bloqueado com mensagem que leva ao lugar certo. *(entregue)*
- **SC-003**: Ausência de certificado gera aviso, não bloqueio. *(entregue)*
- **SC-004**: Nenhum controle promete DIFAL. *(entregue)*
- **SC-101 (deferida)**: PDV emite o modelo configurado na venda seguinte.
- **SC-102/103 (deferidas)**: venda sem config / falha não-transitória — comportamento no PDV.

## Assumptions
- `cscConfigured` do Emitente vem da fiscal-api (`GET /v1/companies/:id`) — usado no bloqueio do Modelo 65.
- Validade do certificado: derivável da fiscal-api (lista de certificados / status) — usado no aviso.
- Frontend sem harness (D0) — cobertura de teste no backend (erp-api).

## Fora de escopo / Deferido
- Consumo e emissão no PDV (Flutter/legado) — FR-101/102/103, deferido (Bloqueio descoberto).
- DIFAL/ICMSUFDest; SAT CF-e (modelo 59)/MFE; config por terminal/filial; alterar a emissão de NFC-e.
