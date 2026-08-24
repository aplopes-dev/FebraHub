# Feature Specification: Emissão de NF-e pela tela de Vendas, com parametrização fiscal real

**Feature Branch**: `026-emissao-nfe-vendas`

**Created**: 2026-08-14

**Status**: Draft

**Input**: Desmembrada de `specs/erp/025-emissao-vendas-e-padrao-visual` (P4) — ver `## Clarifications` daquela spec para o histórico da decisão. Hoje não existe tela de emissão de NF-e no ERP (`/vendas/nfe` é rota placeholder, desabilitada em `apps/erp/web/src/lib/navigation.ts:107`). A única prova de que a transmissão funciona é uma emissão manual via Swagger (`specs/erp/024-fiscal-exclusoes/protocolo-emissao-2026-08-14.md`), que **não usa nenhum cadastro fiscal do lojista**: o CSOSN foi digitado à mão no payload, PIS/COFINS saíram no fallback zerado (CST 49), e IPI nem apareceu no XML.

## Clarifications

### Session 2026-08-14 (herdada de `specs/erp/025-emissao-vendas-e-padrao-visual`)

- Q: A tela entra junto com o wiring da parametrização fiscal (ICMS/PIS-COFINS/IPI), ou primeiro, emitindo com dados manuais como o Swagger aceita hoje? → A: **Junto** — sem isso a nota sairia com PIS/COFINS zerado parecendo correta, erro fiscal real em produção. Honesto com o cadastro fiscal que já existe.

### Session 2026-08-14 (própria desta spec)

- Q: De onde a tela puxa os itens — pedido de venda existente (ancorada em Vendas) ou tela avulsa (como NFS-e)? → A: **Ancorada em pedido de venda existente** — `SaleOrder` já modela `lines[].productId`, exatamente o dado que os resolvedores de ICMS/PIS-COFINS/IPI precisam; reusar evita recriar seleção de produto do zero e mantém rastreabilidade venda→nota.
- Q: Produto sem grupo fiscal de ICMS/PIS-COFINS/IPI configurado — bloquear a emissão ou emitir com fallback explícito e visível? → A: **Emitir com fallback explícito e visível** — a tela avisa qual item está usando fallback e qual seria o valor, mas não impede o lojista de emitir (decisão do usuário — mantém o fluxo desbloqueado à custa de exigir que o aviso seja claro o bastante para não passar despercebido).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emitir NF-e a partir de um pedido de venda, com a parametrização fiscal real do produto (Priority: P1)

Um lojista abre um pedido de venda existente e emite a NF-e correspondente pela tela de Vendas — o XML resultante reflete os grupos fiscais reais dos produtos das linhas do pedido (ICMS, PIS/COFINS, IPI), não dados digitados manualmente nem o fallback zerado que a emissão via Swagger expôs.

**Why this priority**: é o núcleo da feature — sem isso, a tela emitiria notas fiscalmente incorretas parecendo corretas.

**Independent Test**: a partir de um pedido de venda com produtos cujos grupos fiscais estão todos configurados, emitir a NF-e e confirmar no XML que CST/CSOSN, alíquota de PIS, COFINS e IPI vieram do cadastro — não de fallback.

**Acceptance Scenarios**:

1. **Given** um pedido de venda com linhas cujos produtos têm `ProductFiscal.<tributo>GroupId` apontando para grupos fiscais cadastrados, **When** a NF-e é emitida a partir desse pedido, **Then** o XML resultante reflete os valores desses grupos (cadeia produto → grupo → padrão da organização → fallback, na ordem que já existe hoje para outras finalidades) para cada linha.
2. **Given** o contrato HTTP `POST /v1/nfe` da fiscal-api hoje só aceita `cst`/`csosn` por item, **When** a erp-api envia um item com alíquota de PIS/COFINS/IPI, **Then** a fiscal-api aceita esses campos no DTO.
3. **Given** um payload de emissão com CST/alíquota manipulados, **When** a fiscal-api recebe a requisição, **Then** ela revalida CST e alíquota no próprio DTO — não confia cegamente no caller (mesmo padrão de defesa em profundidade das demais rotas fiscais, B10).
4. **Given** um produto de uma linha do pedido sem grupo fiscal de algum tributo configurado, **When** a tela monta a prévia da emissão, **Then** ela mostra um aviso explícito, por item, indicando que aquele tributo vai sair com valor de fallback — e permite ao lojista prosseguir mesmo assim (decisão do usuário no clarify: não bloquear).

### Edge Cases

- Produto sem grupo fiscal de algum tributo configurado — cobrido no Acceptance Scenario 4 (fallback explícito e visível, emissão não bloqueada).
- Pedido de venda com status que não permita emissão (ex.: já cancelado, ou já tem NF-e emitida) — a tela MUST impedir reemissão duplicada para o mesmo pedido.
- Emissão com múltiplos itens, cada um resolvendo para um grupo fiscal diferente — o resolvedor já cobre isso individualmente por item; a tela precisa refletir cada resolução (e cada aviso de fallback) sem misturar itens.
- `ResolveOperationNatureUseCase` (Natureza de Operação) influencia CFOP e grupos da saída quando aplicável — como a tela já parte de um pedido de venda real (não de uma entrada hipotética), a resolução de natureza de operação segue fora do escopo desta emissão direta (ela existe para o fluxo de entrada/devolução, spec erp/020, que continua sem emissão real — ver `apps/erp/api/AGENTS.md`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de emissão de NF-e MUST existir em `/vendas/nfe`, substituindo o placeholder desabilitado hoje, e MUST partir de um pedido de venda (`SaleOrder`) existente — não é uma tela de emissão avulsa.
- **FR-002**: O caminho de emissão MUST chamar `ResolveItemIcmsUseCase`, `ResolveItemPisCofinsUseCase` e `ResolveItemIpiUseCase` por linha do pedido — hoje nenhum é chamado por nenhum caso de uso real (confirmado: só aparecem no registro de DI dos respectivos módulos).
- **FR-003**: O contrato HTTP `POST /v1/nfe` da fiscal-api (`issue-nfe.dto.ts`) MUST ganhar os campos necessários para carregar alíquota de PIS, COFINS e IPI por item — hoje só `cst`/`csosn` existem no shape.
- **FR-004**: A fiscal-api MUST revalidar CST e alíquota recebidos no DTO de emissão, não confiando cegamente no valor enviado pelo caller.
- **FR-005**: Quando um produto de uma linha não tiver grupo fiscal configurado para algum tributo, o sistema MUST emitir com um valor de fallback e a tela MUST mostrar um aviso explícito e visível, por item e por tributo, de que aquele valor é fallback — a emissão NÃO é bloqueada por isso (decisão do clarify).
- **FR-006**: A tela MUST impedir emitir uma segunda NF-e para o mesmo pedido de venda que já tenha uma NF-e emitida com sucesso (evitar duplicidade).
- **FR-007**: `ResolveOperationNatureUseCase` fica FORA do escopo desta emissão direta a partir de pedido de venda — natureza de operação segue associada só ao fluxo de entrada/devolução (spec erp/020), que continua sem emissão real.

### Key Entities *(include if feature involves data)*

- **ProductFiscal.<tributo>GroupId → FiscalGroup → padrão da organização** (erp-api, já existente): cadeia de resolução que passa a ser efetivamente percorrida na emissão de NF-e — hoje só usada por outras finalidades (cadastro, exibição), nunca pela emissão.
- **SaleOrder / SaleOrderLine** (erp-api, já existente): fonte dos itens da NF-e — `lines[].productId` alimenta a resolução fiscal por linha. `SaleOrder.status` precisa refletir que já tem NF-e emitida (FR-006).
- **NfeIssuance** (nova, erp-api): vínculo entre o pedido de venda e o documento NF-e emitido — mesmo papel que `NfseIssuance` já cumpre para NFS-e, mas referenciando `saleOrderId` em vez de só `organizationId`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma NF-e emitida a partir de um pedido de venda reflete no XML os grupos fiscais reais dos produtos das linhas — não fallback zerado nem dado digitado manualmente, para os itens com grupo fiscal configurado.
- **SC-002**: `POST /v1/nfe` da fiscal-api rejeita (não aceita silenciosamente) um item cujo CST/alíquota não bate com o que o cadastro do Emitente/produto sustentaria, quando a revalidação (FR-004) está em vigor.
- **SC-003**: Um item sem grupo fiscal configurado nunca sai zerado sem aviso — a tela sempre mostra qual tributo, em qual item, está usando fallback antes de confirmar a emissão.
- **SC-004**: Nenhum pedido de venda acumula duas NF-e emitidas com sucesso.

## Assumptions

- Os 4 resolvedores citados (`ResolveItemIcmsUseCase`, `ResolveItemPisCofinsUseCase`, `ResolveItemIpiUseCase`, `ResolveOperationNatureUseCase`) já existem, têm teste próprio, e não precisam ser reescritos — só conectados ao caminho de emissão (verificado por grep: hoje só aparecem em `*.module.ts`, nenhum caso de uso real os injeta).
- P1/P2/P3 de `specs/erp/025-emissao-vendas-e-padrao-visual` (autenticação erp-api→fiscal-api, ambiente real, padrão visual) são pré-requisitos práticos — a tela de NF-e desta spec deve reusar `apps/erp/api/src/modules/nfse-issuance/infrastructure/providers/fiscal-service-token.ts` e o padrão de `HttpFiscalApiClient` já implementados em 025 no módulo `nfse-issuance`. **Correção (2026-08-15, achado ao planejar 026):** o texto original desta linha dizia "extraído para `@citybox/nest-common`" — isso descrevia uma decisão do clarify de 025 que foi **revertida** durante o planejamento de 025 ao descobrir a **ADR C-17** ("Molde de autenticação e tenancy por sistema"), que proíbe pacote/symlink de autenticação compartilhado entre sistemas (`@citybox/nest-common` foi removido do monorepo por essa mesma ADR). A implementação real de 025 usa uma **cópia local** dentro do módulo `nfse-issuance` da erp-api — 026 deve seguir o mesmo padrão (cópia local, não import de pacote compartilhado), não a redação original desta linha.
- Ambiente de teste do usuário para validação manual: `backoffice.aplopes.com`, logado como lojista comum.
