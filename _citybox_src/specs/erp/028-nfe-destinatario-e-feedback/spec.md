# Feature Specification: Destinatário completo e feedback honesto na emissão fiscal

**Feature Branch**: `028-nfe-destinatario-e-feedback`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Três correções encontradas em teste manual no ERP em 15/08, depois que a emissão pela tela de Vendas foi destravada (spec erp/027): (1) a NF-e sai sem o endereço do destinatário e é rejeitada pela SEFAZ com o código 719; (2) as duas telas de emissão anunciam uma nota REJEITADA pelo órgão como se fosse um sucesso, em inglês, sem mostrar o motivo; (3) os botões 'Emitir NF-e'/'Emitir NFS-e' não têm o mesmo destaque visual da ação primária do resto do ERP."

## Clarifications

### Session 2026-08-15

- Q: Para o endereço do destinatário na NF-e (FR-001): estender o tipo compartilhado com a NFS-e (`CustomerFiscalInfo`) ou criar um resolvedor próprio da NF-e? → A: **Resolvedor próprio da NF-e** — evita reintroduzir o acoplamento entre os dois documentos que causou o bug 719 original.
- Q: Qual severidade visual para uma nota REJEITADA pelo órgão (FR-005)? → A: **`toast.warning`** — a transmissão teve sucesso técnico; a recusa é um resultado de negócio do órgão, distinto de uma falha real do sistema (que continua `toast.error`).
- Q: Os botões de emitir (FR-007) devem ter destaque adicional além de `variant="contained"`, por serem ação irreversível? → A: **Não** — só o padrão já usado no resto do ERP; a irreversibilidade já é comunicada pelo `ConfirmationDialog` que antecede o clique.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A NF-e chega ao órgão com o destinatário completo (Priority: P1)

Um usuário do ERP emite uma NF-e pela tela `/vendas/nfe` a partir de um pedido de venda fechado, cujo cliente tem endereço cadastrado. A nota deve ser transmitida à SEFAZ com o grupo do destinatário completo (incluindo endereço), para que a avaliação do órgão dependa só de fatores reais do negócio (ex.: credenciamento do emitente) — não de um dado que o sistema tinha e deixou de enviar.

**Why this priority**: É o bloqueador atual. Sem o endereço do destinatário, toda NF-e emitida pela tela é recusada automaticamente pela SEFAZ com o código 719, antes mesmo de a nota ser avaliada por qualquer outro critério — nenhuma emissão de NF-e completa seu propósito hoje.

**Independent Test**: Emitir uma NF-e pela tela `/vendas/nfe` para um cliente com endereço completo e confirmar que a rejeição deixa de ser `719` (identificação do destinatário) e passa a refletir o critério de negócio real da empresa emissora.

**Acceptance Scenarios**:

1. **Given** um pedido de venda fechado cujo cliente tem endereço completo cadastrado, **When** o usuário emite a NF-e pela tela, **Then** a nota transmitida contém o endereço do destinatário e a SEFAZ não a rejeita mais por identificação do destinatário incompleta.
2. **Given** um pedido de venda fechado cujo cliente **não** tem endereço cadastrado, **When** o usuário tenta emitir a NF-e, **Then** o sistema impede o envio e explica, antes de transmitir, o que falta preencher e onde (não deixa a SEFAZ recusar por um dado que já sabia estar ausente).
3. **Given** uma emissão que passou a enviar o destinatário completo, **When** o órgão avalia a nota, **Then** a rejeição (se houver) reflete um critério de negócio real do emitente (ex.: credenciamento), não mais a ausência de dados do destinatário.

---

### User Story 2 - O resultado da emissão é anunciado com honestidade (Priority: P2)

Um usuário emite uma NF-e ou NFS-e e o órgão fiscal recusa o documento. A tela deve deixar claro, imediatamente, que a nota **não** foi aceita, em português, com o motivo da recusa e um caminho para investigar mais — sem parecer uma confirmação de sucesso.

**Why this priority**: Sem isso, o usuário só descobre que a nota foi recusada (e por quê) indo manualmente até outra tela (Facilita NF-e). Uma notificação de sucesso para uma nota recusada é ativamente enganosa — o usuário pode seguir operando como se a venda estivesse fiscalmente concluída quando não está.

**Independent Test**: Emitir uma nota que o órgão vai recusar (situação já reproduzível hoje, ex.: NFS-e da Aplopes) e confirmar que a notificação exibida é claramente de alerta/erro, em português, com o código e a mensagem do órgão visíveis, sem exigir navegação a outra tela para entender o motivo.

**Acceptance Scenarios**:

1. **Given** uma emissão que o órgão autoriza, **When** o resultado retorna à tela, **Then** o usuário vê uma notificação de sucesso com o número/protocolo do documento.
2. **Given** uma emissão que o órgão rejeita, **When** o resultado retorna à tela, **Then** o usuário vê uma notificação que não parece sucesso, com o status traduzido para português, o código de rejeição e a mensagem do órgão.
3. **Given** qualquer outro ponto do ERP que exiba o status cru de um documento fiscal (ex.: Facilita NF-e), **When** o usuário visualiza esse status, **Then** ele aparece traduzido para português, com o mesmo tratamento visual (sucesso vs. rejeição) das telas de emissão.

---

### User Story 3 - O botão de emitir tem o peso visual de uma ação primária (Priority: P3)

Um usuário abre a tela de emissão de NF-e ou NFS-e e precisa identificar de imediato qual é a ação principal da tela — emitir o documento fiscal, uma ação irreversível.

**Why this priority**: É um ajuste visual, independente das duas correções acima, mas nas mesmas telas — vale entregar junto. Não bloqueia nenhuma emissão; hoje o botão funciona, só não comunica visualmente que é a ação primária da tela, destoando do padrão já estabelecido no resto do ERP.

**Independent Test**: Abrir as telas `/vendas/nfe` e `/vendas/nfse` e confirmar visualmente que o botão de emitir tem o mesmo peso (fundo preenchido) das ações primárias em outras telas do ERP, nos temas claro e escuro.

**Acceptance Scenarios**:

1. **Given** a tela de emissão de NF-e ou NFS-e, **When** o usuário a visualiza, **Then** o botão de emitir tem fundo preenchido (mesmo padrão da ação primária usada no resto do ERP), mantendo o indicador de carregamento e o estado desabilitado quando aplicável.
2. **Given** o tema escuro ativo, **When** o usuário visualiza a tela, **Then** o botão de emitir mantém contraste adequado, sem cor fixa hardcoded.

### Edge Cases

- Cliente do pedido sem endereço cadastrado (nenhum logradouro/UF/CEP): a emissão de NF-e deve ser bloqueada antes de transmitir, com mensagem indicando o que preencher e onde (não é mais responsabilidade da SEFAZ apontar isso).
- Endereço do cliente incompleto (ex.: sem código IBGE do município): tratado como "sem endereço utilizável" para efeito do bloqueio de FR-004 — a spec de origem não differ entre ausência total e incompletude parcial, e um XML com `enderDest` parcialmente preenchido arrisca uma nova rejeição por campo ausente.
- Documento com status diferente de `AUTHORIZED`/`REJECTED` (ex.: falha de transporte antes de chegar ao órgão) continua no fluxo de erro já existente (`toast.error` genérico) — esta feature não introduz um terceiro status.
- Emissão que falha antes de chegar ao órgão (erro de rede/config) não é uma "rejeição do órgão" e deve continuar distinta do tratamento de US2 — não ganha o novo toast de rejeição, mantém a mensagem de erro técnico já existente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST enviar o endereço completo do destinatário (logradouro, número, complemento quando houver, bairro, município, UF, código IBGE do município e CEP) em toda emissão de NF-e feita pela tela `/vendas/nfe`.
- **FR-002**: O sistema MUST impedir a emissão de NF-e quando o cliente do pedido não tiver endereço cadastrado (ou tiver endereço incompleto, ver Edge Cases), exibindo uma mensagem que informe o que falta e onde completar o cadastro — antes de qualquer tentativa de transmissão ao órgão.
- **FR-003**: O sistema MUST continuar exigindo (e não regredir) as validações de destinatário já existentes na tela de NF-e (documento do tomador, pedido com cliente identificado).
- **FR-004**: O sistema MUST exibir, ao final de uma emissão de NF-e ou NFS-e, uma notificação de sucesso quando o documento for `AUTHORIZED` pelo órgão, incluindo número e protocolo quando disponíveis.
- **FR-005**: O sistema MUST exibir, ao final de uma emissão de NF-e ou NFS-e, uma notificação de **aviso** (não de sucesso, e distinta visualmente de um erro técnico) quando o documento for `REJECTED` pelo órgão, incluindo o código de rejeição e a mensagem do órgão em português — a rejeição do órgão é um resultado de negócio esperado, não uma falha do sistema.
- **FR-006**: O sistema MUST traduzir os status de documento fiscal (`AUTHORIZED`/`REJECTED`, e demais valores do enum) para português em toda superfície do ERP onde eles são exibidos ao usuário (telas de emissão de NF-e/NFS-e e Facilita NF-e).
- **FR-007**: O sistema MUST aplicar `variant="contained"` (mesmo padrão da ação primária usada em `EntityFormFooter`, sem destaque adicional de cor/tamanho — decisão do clarify) aos botões "Emitir NF-e" e "Emitir NFS-e", preservando os estados de carregamento (`loading`) e desabilitado (`disabled`) já existentes.
- **FR-008**: O sistema MUST manter, sem regressão, os comportamentos já validados e explicitamente fora de escopo desta feature: resolução de `FISCAL_API_URL`, o selo de ambiente com bloqueio em PRODUÇÃO, o rodapé sticky de formulários fiscais, os avisos de fallback por tributo na tela de NF-e, e a tradução de `noOptionsText` nos dois `Autocomplete` de emissão.

### Key Entities *(include if feature involves data)*

- **Endereço do destinatário (NF-e)**: logradouro, número, complemento (opcional), bairro, município, UF, código IBGE do município, CEP. Fonte: cadastro do cliente (`Customer`) associado ao pedido de venda — o pedido de venda em si não guarda endereço.
- **Resultado da emissão**: status do documento (`AUTHORIZED` | `REJECTED` | outros), código de rejeição do órgão (quando houver), mensagem de rejeição do órgão em português (quando houver), número/protocolo (quando autorizado). Já existe no backend (`GET /v1/fiscal-documents` expõe `errorCode`/`errorMessage`); a mudança é de exibição, não de captura.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma NF-e emitida pela tela, para um cliente com endereço completo, deixa de ser rejeitada pelo código de "destinatário sem identificação completa" — a rejeição (se houver) passa a refletir um critério de negócio real do emitente.
- **SC-002**: 100% das tentativas de emitir NF-e para um cliente sem endereço cadastrado são bloqueadas na tela, com mensagem acionável, antes de qualquer chamada ao órgão fiscal.
- **SC-003**: Toda emissão rejeitada pelo órgão, nas duas telas, mostra ao usuário — sem navegação adicional — que a nota não foi aceita, em português, com o código e a mensagem do órgão.
- **SC-004**: Nenhuma rejeição do órgão é anunciada visualmente como sucesso.
- **SC-005**: Os botões de emitir das duas telas têm o mesmo padrão visual (fundo preenchido) da ação primária usada no restante do ERP, com contraste adequado nos dois temas.

## Assumptions

- O endereço do destinatário só pode vir do cadastro do cliente (`Customer`) — confirmado que `SaleOrder` não modela endereço nenhum, então a hipótese de reaproveitar um endereço já salvo no próprio pedido não se aplica; o "terceiro caminho" citado na origem do pedido está descartado por este motivo.
- Quando o cliente tem mais de um endereço (cobrança vs. entrega) cadastrado, esta feature assume que existe um único endereço de referência hoje no cadastro do cliente para fins fiscais (mesmo padrão que a tela de NFS-e já usa implicitamente, que não distingue os dois). Divergência de endereço de cobrança/entrega fica fora de escopo — não há indicação de que o cadastro atual de cliente já modele essa distinção.
- `indIEDest` (indicador de Inscrição Estadual do destinatário): o builder da fiscal-api já envia um valor fixo por padrão hoje; esta feature verifica (não necessariamente altera) se esse valor é adequado para destinatário PJ — não é a causa da rejeição 719 relatada (essa é especificamente ausência do grupo de endereço), então não é tratado como bloqueador de FR-001/FR-002.
