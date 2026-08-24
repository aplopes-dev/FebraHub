# Feature Specification: Tela Facilita NFE

**Feature Branch**: `009-facilita-nfe-screen`

**Created**: 2026-08-09

**Status**: Draft

**Input**: User description: "Desenvolver a tela 'Facilita NFE', localizada em financas/facilita-nfe no ERP web. O item já existe no menu, mas a tela está em branco/não desenvolvida. A tela deve consumir os endpoints de services/fiscal-api/ e possui 3 abas: 'Recebido' (notas fiscais recebidas pela loja — cards de totais: Total, Autorizadas, Canceladas, Manifestações finais, Não manifestadas; busca; filtro; tabela com Data de emissão, Status, Emitente, Valor, Número, Série, Modelo, Origem, Importado), 'Emitido' (notas fiscais emitidas pela loja — mesmos cards de totais; busca; filtro; botões 'Agendar envio' e 'Enviar por e-mail'; tabela com Data de emissão, Status, Cliente, Valor, Número, Série, Modelo), e 'Histórico de Envios' (busca; filtro; tabela com Solicitante, Período, E-mail, Status, Arquivos)."

## Clarifications

### Session 2026-08-09

- Q: A `fiscal-api` hoje não expõe (1) consulta de documentos recebidos de terceiros
  (aba "Recebido"), nem (2) envio de documento fiscal por e-mail/agendamento (ações
  "Agendar envio"/"Enviar por e-mail" e aba "Histórico de Envios"). Essas capacidades
  entram como trabalho de backend novo nesta mesma entrega, ou ficam fora de escopo? →
  A: Fora de escopo nesta entrega. Apenas a aba "Emitido" (US1) será implementada. As
  abas "Recebido" e "Histórico de Envios", e as ações "Agendar envio"/"Enviar por
  e-mail", ficam para uma entrega futura, condicionadas à existência do backend
  correspondente.
- Q: A Constitution do monorepo exige busca/paginação backend-driven, mas
  `GET /v1/fiscal-documents` hoje não tem parâmetro de busca textual nem endpoint de
  totais por status. Estender a `fiscal-api` nesta entrega, ou restringir a aba
  "Emitido" a filtro por status/tipo (sem busca livre)? → A: Estender a `fiscal-api`
  nesta entrega — adicionar parâmetro `search` (busca no banco) e um endpoint de
  resumo/contagens por status ao módulo `fiscal-documents`, mantendo a busca/paginação
  100% backend-driven (Constitution Princípio II).
- Q: Os cards "Manifestações finais" e "Não manifestadas" do mockup pertencem ao fluxo
  de manifestação do destinatário (aplicável a notas *recebidas*, não emitidas) — o
  enum de status de `FiscalDocument` não tem equivalente para documentos emitidos. Na
  aba "Emitido" desta entrega, remover os 2 cards ou mantê-los zerados/desabilitados? →
  A: Manter os 5 cards do mockup por fidelidade visual — "Manifestações finais" e "Não
  manifestadas" ficam sempre zerados/desabilitados na aba "Emitido" (sem dado real por
  trás), com indicação visual de que não se aplicam a documentos emitidos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar documentos fiscais emitidos pela loja (Priority: P1)

O lojista (financeiro/fiscal) abre a aba "Emitido" da tela Facilita NFE e vê a lista de
notas fiscais (NF-e, NFS-e e cupons NFC-e) já emitidas pela própria loja, com contadores
de totais por status e capacidade de buscar e filtrar a lista.

**Why this priority**: é a única das três abas com todos os dados já existentes no
sistema hoje (documentos fiscais emitidos são gravados pela `fiscal-api` no fluxo de
emissão já implementado). Entrega valor imediato sem depender de integração nova com a
SEFAZ e sem depender de nenhuma feature ainda não construída.

**Independent Test**: com a loja tendo pelo menos uma NF-e/NFS-e/NFC-e emitida, abrir a
aba "Emitido" e verificar que ela aparece na tabela com os dados corretos e que os cards
de totais refletem a contagem real.

**Acceptance Scenarios**:

1. **Given** a loja possui documentos fiscais emitidos com diferentes status, **When** o
   usuário abre a aba "Emitido", **Then** os cards "Total", "Autorizadas", "Canceladas",
   "Manifestações finais" e "Não manifestadas" exibem as contagens corretas para essa
   loja e a tabela lista os documentos com Data de emissão, Status, Cliente, Valor,
   Número, Série e Modelo.
2. **Given** a lista de documentos emitidos, **When** o usuário digita um termo na busca
   (ex.: número da nota ou nome do cliente), **Then** a tabela é filtrada para mostrar
   apenas os documentos correspondentes.
3. **Given** a lista de documentos emitidos, **When** o usuário aplica um filtro (ex.: por
   status ou período), **Then** somente os documentos que atendem ao filtro permanecem
   visíveis e os cards de totais recalculam sobre o conjunto filtrado.
4. **Given** a loja não possui nenhum documento emitido, **When** o usuário abre a aba,
   **Then** a tabela exibe o estado vazio "Sem dados no momento" e os cards mostram 0.

---

### User Story 2 - Consultar documentos fiscais recebidos pela loja (Priority: P2, fora de escopo nesta entrega)

> **Fora de escopo nesta entrega** (ver Clarifications, sessão 2026-08-09). Mantida aqui
> como referência para uma entrega futura, condicionada à existência de um endpoint na
> `fiscal-api` (ou serviço equivalente) para consulta de documentos emitidos por
> terceiros contra a loja.

O lojista abre a aba "Recebido" e vê a lista de notas fiscais emitidas por terceiros
(fornecedores) contra o CNPJ da loja, para acompanhar entradas e realizar a manifestação
do destinatário.

**Why this priority**: entrega valor real (controle de entradas fiscais), mas depende de
uma capacidade — consulta de documentos emitidos por terceiros contra a loja
(Distribuição DFe / manifestação do destinatário na SEFAZ) — que **não existe hoje** na
`fiscal-api` (ela hoje só emite e lista documentos que a própria loja emitiu). Prioridade
mais baixa que a US1 por essa dependência de backend novo.

**Independent Test**: com pelo menos um documento de terceiro disponibilizado à loja via
SEFAZ, abrir a aba "Recebido" e verificar que ele aparece na tabela com os dados do
Emitente (terceiro) e que os cards de totais refletem a contagem real.

**Acceptance Scenarios**:

1. **Given** existem documentos de terceiros disponíveis para a loja, **When** o usuário
   abre a aba "Recebido", **Then** os cards de totais exibem as contagens corretas e a
   tabela lista Data de emissão, Status, Emitente, Valor, Número, Série, Modelo, Origem e
   Importado.
2. **Given** a lista de documentos recebidos, **When** o usuário busca ou filtra,
   **Then** o comportamento é equivalente ao descrito na US1 (busca/filtro local sobre a
   lista carregada).
3. **Given** a loja não possui nenhum documento recebido, **When** o usuário abre a aba,
   **Then** a tabela exibe "Sem dados no momento" e os cards mostram 0.

---

### User Story 3 - Reenviar e consultar histórico de envios de documentos fiscais (Priority: P3, fora de escopo nesta entrega)

> **Fora de escopo nesta entrega** (ver Clarifications, sessão 2026-08-09). Mantida aqui
> como referência para uma entrega futura, condicionada à existência de uma capacidade de
> envio de documento fiscal por e-mail/agendamento (backend novo).

O lojista usa os botões "Agendar envio" e "Enviar por e-mail" na aba "Emitido" para
reenviar documentos fiscais a um destinatário por e-mail (imediatamente ou em uma data
programada), e consulta o resultado desses envios na aba "Histórico de Envios".

**Why this priority**: é uma funcionalidade de conveniência sobre dados que já existem
(os documentos da US1), mas depende de uma capacidade de envio de e-mail e agendamento
que **não existe hoje** na `fiscal-api` nem em nenhum outro serviço consumido pelo ERP.
Menor prioridade por ser aditiva às outras duas abas, não bloqueante para elas.

**Independent Test**: selecionar um ou mais documentos na aba "Emitido", disparar "Enviar
por e-mail" informando um destinatário, e verificar que uma linha correspondente aparece
na aba "Histórico de Envios" com o status do envio.

**Acceptance Scenarios**:

1. **Given** o usuário selecionou documentos na aba "Emitido", **When** aciona "Enviar
   por e-mail" e informa um e-mail válido, **Then** o sistema registra a solicitação e
   ela passa a aparecer em "Histórico de Envios" com Solicitante, Período, E-mail, Status
   e os arquivos gerados.
2. **Given** o usuário aciona "Agendar envio" e escolhe uma data futura, **When** a data
   chega, **Then** o envio é disparado automaticamente e o status em "Histórico de
   Envios" é atualizado de "Agendado" para o resultado do envio.
3. **Given** um envio falha (ex.: e-mail inválido, erro de geração de arquivo), **When** o
   usuário consulta "Histórico de Envios", **Then** o status reflete a falha de forma
   compreensível ao usuário.

---

### Edge Cases

- O que acontece quando a `fiscal-api` está indisponível ou retorna erro ao carregar uma
  das abas? A tela deve indicar falha de carregamento sem quebrar as demais abas.
- Como a tela se comporta quando a loja tem uma quantidade muito grande de documentos
  (paginação nos cards/tabela)?
- (Fora de escopo nesta entrega) O que acontece se o usuário tentar "Enviar por e-mail"
  sem selecionar nenhum documento? — relevante apenas quando a US3 entrar em escopo.
- Como tratar um documento com Status desconhecido/não mapeado retornado pela API?
- O que acontece se o usuário aplicar busca + filtro simultaneamente e nenhum resultado
  atender aos dois critérios?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela Facilita NFE MUST exibir três abas — "Recebido", "Emitido" e
  "Histórico de Envios" — navegáveis sem recarregar a página, preservando a aba ativa
  como estado de navegação. Nesta entrega, apenas a aba "Emitido" (FR-002 a FR-004)
  carrega dados reais; "Recebido" e "Histórico de Envios" MUST existir como abas
  navegáveis exibindo o estado vazio "Sem dados no momento" e cards zerados (ver
  Clarifications, sessão 2026-08-09).
- **FR-002**: A aba "Emitido" MUST listar os documentos fiscais (NF-e, NFS-e, NFC-e)
  emitidos pela loja atualmente selecionada, consumindo `GET /v1/fiscal-documents` da
  `fiscal-api` (filtrado por `companyId` da loja), com busca e paginação resolvidas no
  backend (ver FR-005 e Clarifications).
- **FR-003**: A aba "Emitido" MUST exibir os 5 cards do mockup ("Total", "Autorizadas",
  "Canceladas", "Manifestações finais", "Não manifestadas"), calculados no backend sobre
  o conjunto filtrado. "Total"/"Autorizadas"/"Canceladas" MUST refletir contagens reais
  (mapeadas a partir de `FiscalDocumentStatus`); "Manifestações finais" e "Não
  manifestadas" MUST ser exibidos sempre zerados e visualmente indicados como não
  aplicáveis a documentos emitidos (ver Clarifications, sessão 2026-08-09).
- **FR-004**: A tabela da aba "Emitido" MUST exibir as colunas Data de emissão, Status,
  Cliente, Valor, Número, Série e Modelo.
- **FR-005**: A aba "Emitido" MUST oferecer um campo de busca textual e um filtro (via
  popover/painel), ambos resolvidos por consulta ao backend (parâmetros de query em
  `GET /v1/fiscal-documents`, sem carregar o conjunto completo para filtrar no
  cliente — Constitution Princípio II) — restringindo a lista exibida e os cards de
  totais correspondentes. As abas "Recebido" e "Histórico de Envios" MUST exibir os
  controles de busca/filtro desabilitados ou ocultos enquanto não houver dados reais
  para filtrar (fora de escopo nesta entrega, ver FR-006/FR-007/FR-008).
- **FR-006** (fora de escopo nesta entrega): A aba "Recebido" (cards de totais e tabela
  com Data de emissão, Status, Emitente, Valor, Número, Série, Modelo, Origem e
  Importado, para documentos fiscais emitidos por terceiros contra a loja) fica como
  placeholder vazio nesta entrega. Depende de um endpoint de consulta de documentos de
  terceiros (manifestação do destinatário / Distribuição DFe da SEFAZ) inexistente hoje
  na `fiscal-api` — entra em escopo apenas em entrega futura, junto com esse backend.
- **FR-007** (fora de escopo nesta entrega): As ações "Agendar envio" e "Enviar por
  e-mail" na aba "Emitido" ficam ocultas/desabilitadas nesta entrega. Dependem de uma
  capacidade de envio de documento fiscal por e-mail e agendamento inexistente hoje em
  qualquer serviço consumido pelo ERP — entram em escopo apenas em entrega futura, junto
  com esse backend.
- **FR-008** (fora de escopo nesta entrega): A aba "Histórico de Envios" (Solicitante,
  Período, E-mail, Status, Arquivos) fica como placeholder vazio nesta entrega, por
  depender diretamente da capacidade de envio da FR-007.
- **FR-009**: Cada aba MUST exibir o estado vazio "Sem dados no momento" quando não
  houver documentos/registros para a loja selecionada, mantendo os cards de totais em 0.
- **FR-010**: A tela MUST respeitar o contexto de loja (tenant/Store) já usado pelo
  restante do ERP — os dados exibidos em qualquer aba pertencem exclusivamente à loja
  atualmente selecionada pelo usuário.
- **FR-011**: A tela MUST tratar falhas de comunicação com a `fiscal-api` exibindo uma
  mensagem de erro amigável por aba, sem impedir a navegação para as demais abas.
- **FR-012**: As tabelas MUST suportar paginação quando o volume de documentos exceder o
  tamanho de página padrão do Design System (`@citybox/ui` `DataTable`).

### Key Entities

- **Documento Fiscal Emitido**: representa uma NF-e, NFS-e ou NFC-e emitida pela loja.
  Atributos relevantes na tela: data de emissão, status, cliente destinatário, valor
  total, número, série, modelo do documento. Fonte: `fiscal-api` (`fiscal-documents` /
  `nfe` / `nfse` / `nfce`).
- **Documento Fiscal Recebido** (fora de escopo nesta entrega): representa um documento
  fiscal emitido por um terceiro (fornecedor) contra o CNPJ da loja. Atributos: data de
  emissão, status, emitente (terceiro), valor total, número, série, modelo, origem,
  indicador de importado. Requer capacidade de consulta ainda não existente (ver
  FR-006).
- **Solicitação de Envio** (fora de escopo nesta entrega): representa um pedido de
  reenvio de um ou mais documentos fiscais por e-mail, imediato ou agendado. Atributos:
  solicitante, período (janela do agendamento ou data do envio), e-mail de destino,
  status do envio, arquivos gerados (ex.: XML, PDF/DANFE). Requer capacidade ainda não
  existente (ver FR-007/FR-008).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário consegue visualizar todos os documentos fiscais emitidos pela
  loja selecionada na aba "Emitido" em até 3 segundos após abrir a tela, sem navegar para
  outra página.
- **SC-002**: 100% dos documentos fiscais emitidos e cadastrados na `fiscal-api` para a
  loja aparecem corretamente na aba "Emitido" (sem perda de registros).
- **SC-003**: A busca e os filtros retornam o conjunto correto de resultados em até 1
  segundo após o usuário parar de digitar/aplicar o filtro, para volumes de até 1.000
  documentos.
- **SC-004**: Quando a `fiscal-api` está indisponível, o usuário vê uma mensagem de erro
  compreensível em até 5 segundos, em vez de uma tela travada ou em branco.

## Assumptions

- A tela consome a `fiscal-api` (`services/fiscal-api`) através do padrão de integração
  já usado por outras telas do ERP (chamada direta autenticada por JWT propagado, sem BFF
  dedicado), a menos que o padrão do módulo `financas` do ERP indique outro caminho.
- "Loja atualmente selecionada" segue o mecanismo de seleção de loja/tenant já existente
  no `erp-web` (nenhuma seleção nova é introduzida por esta feature).
- Os status exibidos nos cards ("Autorizadas", "Canceladas", "Manifestações finais", "Não
  manifestadas") mapeiam para os status já existentes no domínio de documento fiscal da
  `fiscal-api` (`FiscalDocumentStatus` ou equivalente); qualquer status sem mapeamento
  direto será agrupado/exibido como está vindo da API.
- A aba "Emitido" cobre os três tipos de documento hoje emitidos pelo sistema (NF-e,
  NFS-e, NFC-e), já que `GET /v1/fiscal-documents` suporta `documentType` `NFE`/`NFSE`
  (NFC-e a confirmar durante o planejamento técnico, ver research).
- Sem indicação em contrário, "Importado" na aba "Recebido" refere-se a um documento que
  já foi importado/processado no sistema local da loja (ex.: lançado no financeiro), não
  a uma operação de comércio exterior.
- **Fora de escopo nesta entrega** (decisão explícita, ver Clarifications): dados reais
  na aba "Recebido", as ações "Agendar envio"/"Enviar por e-mail", e dados reais na aba
  "Histórico de Envios". Essas três abas/ações ficam com UI placeholder (vazia/
  desabilitada) nesta entrega e exigem trabalho de backend novo (fora do escopo desta
  spec) antes de entrarem em uma entrega futura.
