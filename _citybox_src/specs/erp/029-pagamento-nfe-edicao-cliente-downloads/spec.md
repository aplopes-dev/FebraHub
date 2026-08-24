# Feature Specification: Pagamento real na NF-e, edição de cliente e downloads fiscais

**Feature Branch**: `029-pagamento-nfe-edicao-cliente-downloads`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Três frentes encontradas em teste manual no ERP em 15/08, com a organização RR EMPREENDIMENTOS ativa: (1) a NF-e sai sempre com meio de pagamento fixo '99-Outros', inválido do jeito que é enviado (sem a descrição obrigatória), ignorando o pagamento real do pedido — rejeição SEFAZ 441; (2) não existe tela para editar um cliente já cadastrado, só criar; (3) não há como baixar o XML e o PDF (DANFE/DANFSE) das notas fiscais emitidas pelo ERP, apesar das rotas já existirem na fiscal-api."

## Clarifications

### Session 2026-08-15

- Q: Quando a forma de pagamento do pedido não tem `tPag` configurado, o que a emissão deve fazer? → A: **Bloquear a emissão** com mensagem dizendo qual forma está sem código fiscal e onde configurar — mesmo padrão já adotado para endereço do cliente ausente (spec 028), fecha a classe de bug do fallback silencioso que causou o 441 original.
- Q: Onde entra o botão de baixar XML/PDF (DANFSE) da NFS-e? → A: **Só no Facilita NF-e** (`/financas/facilita-nfe`) — já lista todos os documentos emitidos com status, é o lugar natural, sem duplicar a ação em duas telas.
- Q: O download do PDF (DANFE/DANFSE) deve baixar direto ou abrir em nova aba? → A: **Baixar arquivo direto** — mesmo padrão do XML, mais previsível entre navegadores.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A NF-e sai com o meio de pagamento real do pedido (Priority: P1)

Um usuário emite uma NF-e pela tela `/vendas/nfe` a partir de um pedido de venda cujo pagamento foi registrado numa forma concreta (Dinheiro, Pix, cartão, etc.). A nota transmitida à SEFAZ deve refletir essa forma de pagamento real, não um código fixo genérico que a própria SEFAZ recusa.

**Why this priority**: É o bloqueador atual. Toda NF-e emitida pela tela hoje é rejeitada pela SEFAZ com o código 441 antes de qualquer outro critério ser avaliado — nenhuma NF-e completa seu propósito.

**Independent Test**: Emitir uma NF-e para um pedido cujo pagamento está cadastrado com uma forma que tenha o código fiscal (`tPag`) configurado, e confirmar que a nota sai com esse código, sem a rejeição de descrição de pagamento obrigatória.

**Acceptance Scenarios**:

1. **Given** um pedido de venda com um único pagamento numa forma que tem o código fiscal configurado, **When** o usuário emite a NF-e, **Then** a nota transmitida usa esse código real de meio de pagamento, e a SEFAZ não a rejeita mais por descrição de pagamento obrigatória.
2. **Given** um pedido de venda com dois ou mais pagamentos (rateio/split), **When** o usuário emite a NF-e, **Then** a nota transmitida representa cada pagamento individualmente, com o valor de cada um, e a soma bate com o valor total da nota.
3. **Given** um pedido cujo pagamento usa uma forma sem código fiscal configurado, **When** o usuário tenta emitir a NF-e, **Then** o sistema não emite silenciosamente com um código inválido — resolve o caso de forma explícita e testável (comportamento exato a confirmar antes do plano técnico).

---

### User Story 2 - Baixar XML e PDF das notas emitidas (Priority: P2)

Um usuário que emitiu uma NF-e ou NFS-e precisa entregar o XML e o PDF (DANFE/DANFSE) ao cliente e ao contador. Hoje isso só é possível fora do ERP (ex.: Swagger da fiscal-api).

**Why this priority**: Pedido direto do usuário, de alto impacto operacional (é o artefato que efetivamente comprova a venda para o cliente e alimenta a contabilidade) — mas depende de uma extensão de segurança no proxy fiscal que tem risco técnico maior que a tela de edição de cliente (US3), por isso vem antes dela na ordem de implementação.

**Independent Test**: Com uma nota AUTORIZADA pelo órgão, baixar o XML e o PDF a partir da tela correspondente e confirmar que o conteúdo corresponde ao documento fiscal daquela nota. Com uma nota não autorizada, confirmar que a ação de baixar está desabilitada e explica o motivo.

**Acceptance Scenarios**:

1. **Given** uma NF-e com status AUTHORIZED, **When** o usuário aciona baixar XML (ou PDF) nas telas de Vendas ou Pedidos de venda, **Then** o arquivo correspondente é obtido com sucesso.
2. **Given** uma NF-e com status diferente de AUTHORIZED (ex.: REJECTED), **When** o usuário olha a linha correspondente, **Then** a ação de baixar aparece desabilitada, com uma explicação de que só notas autorizadas têm documento para baixar.
3. **Given** uma NFS-e com status AUTHORIZED, **When** o usuário aciona baixar XML (ou PDF), **Then** o arquivo correspondente é obtido com sucesso, a partir de um ponto da interface definido nesta spec (ver Clarifications).
4. **Given** um usuário de uma organização, **When** ele tenta baixar (por qualquer meio, incluindo manipulação direta de URL) o documento fiscal de outra organização, **Then** o sistema recusa o acesso — nunca expõe documento fiscal de organização diferente da ativa.

---

### User Story 3 - Editar um cliente já cadastrado (Priority: P3)

Um usuário do ERP precisa corrigir ou completar o cadastro de um cliente já existente (ex.: adicionar/corrigir o endereço, que passou a alimentar a emissão de NF-e).

**Why this priority**: Pedido direto do usuário. Autocontida e de menor risco técnico que as outras duas — o backend já existe, e o padrão de tela já está estabelecido em três features irmãs do mesmo sistema.

**Independent Test**: Abrir um cliente existente pela lista, alterar um campo (ex.: endereço), salvar, e confirmar que a alteração persiste ao reabrir o cadastro.

**Acceptance Scenarios**:

1. **Given** um cliente já cadastrado, **When** o usuário abre a tela de edição a partir da lista, **Then** o formulário aparece preenchido com os dados atuais do cliente.
2. **Given** a tela de edição aberta, **When** o usuário altera um campo e salva, **Then** a alteração é persistida e refletida ao reabrir o cadastro.
3. **Given** um id de cliente que não existe (ou foi excluído), **When** o usuário acessa a rota de edição diretamente, **Then** a tela mostra "Cliente não encontrado" em vez de quebrar ou mostrar um formulário vazio enganoso.
4. **Given** um cliente sem endereço completo ou sem documento, **When** o usuário visualiza a tela de edição, **Then** existe algum sinal de que esses dados são necessários para a emissão de NF-e — sem torná-los obrigatórios para salvar o cadastro em si.

### Edge Cases

- Pedido de venda com pagamento cuja forma foi excluída após o pedido ser fechado: a resolução do código fiscal deve lidar com essa referência sem quebrar a emissão (mensagem clara, não um erro técnico cru).
- Nota fiscal cujo XML/PDF ainda não foi gerado pelo órgão no momento exato da consulta (ex.: entre SENT e AUTHORIZED): a ação de baixar deve refletir esse estado como indisponível, não como erro genérico.
- Usuário edita um cliente e remove o único endereço que alimentava uma NF-e já emitida anteriormente: não afeta a nota já emitida (histórico), só bloqueia futuras emissões até haver endereço de novo.
- Cliente com múltiplos endereços cadastrados (ver spec erp/028 — endereço `principal` com fallback para o primeiro): a tela de edição deve deixar claro qual endereço é o usado pela emissão fiscal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST resolver o meio de pagamento (código fiscal `tPag`) da NF-e a partir do(s) pagamento(s) real(is) do pedido de venda, em vez de um código fixo.
- **FR-002**: O sistema MUST representar cada pagamento do pedido individualmente na NF-e quando houver mais de um, com o valor de cada um, de forma que a soma bata com o valor total da nota.
- **FR-003**: O sistema MUST bloquear a emissão da NF-e (antes de transmitir) quando a forma de pagamento do pedido não tiver o código fiscal configurado, com mensagem indicando qual forma está sem código e onde configurá-lo (decisão do clarify).
- **FR-004**: O sistema MUST permitir editar os dados de um cliente já cadastrado, reaproveitando a mesma validação e o mesmo formulário já usados no cadastro de um cliente novo.
- **FR-005**: O sistema MUST mostrar "Cliente não encontrado" (não uma tela quebrada ou vazia) quando o id da rota de edição não corresponder a um cliente existente.
- **FR-006**: O sistema MUST permitir baixar o XML e o PDF (DANFE) de uma NF-e com status AUTHORIZED, a partir das telas de Vendas e de Pedidos de venda.
- **FR-007**: O sistema MUST permitir baixar o XML e o PDF (DANFSE) de uma NFS-e com status AUTHORIZED, a partir da listagem do Facilita NF-e (decisão do clarify).
- **FR-008**: O sistema MUST desabilitar a ação de baixar (com uma explicação visível) quando o documento fiscal não estiver com status AUTHORIZED.
- **FR-009**: O sistema MUST impedir que um usuário baixe o documento fiscal de uma organização diferente da sua organização ativa, mesmo que tente acessar a rota diretamente.
- **FR-010**: O sistema MUST continuar identificando corretamente, para cada linha das telas de Vendas e Pedidos de venda, se existe (e qual é) a NF-e emitida para aquele pedido — sem regredir nenhum comportamento de listagem já existente.

### Key Entities *(include if feature involves data)*

- **Meio de pagamento fiscal**: código `tPag` (NF-e, NT 2023.004) associado a uma forma de pagamento cadastrada pela organização. Já existe no modelo de forma de pagamento; a lacuna é o pedido de venda usá-lo na emissão.
- **Documento fiscal (para download)**: identificador do documento emitido na fiscal-api, seu status (só AUTHORIZED tem arquivo para baixar), e os dois artefatos — XML e PDF (DANFE para NF-e, DANFSE para NFS-e).
- **Cliente**: entidade já existente; esta feature adiciona a capacidade de edição sobre o que já é lido/criado hoje — nenhum campo novo no cadastro em si.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma NF-e emitida para um pedido com pagamento em uma forma com código fiscal configurado deixa de ser rejeitada por "descrição de pagamento obrigatória".
- **SC-002**: 100% dos pedidos com múltiplos pagamentos emitidos como NF-e preservam o valor de cada pagamento individualmente na nota transmitida.
- **SC-003**: Um usuário consegue editar um cliente existente e ver a alteração persistida, sem precisar recriar o cadastro.
- **SC-004**: Um usuário consegue obter o XML e o PDF de qualquer nota autorizada (NF-e ou NFS-e) sem sair do ERP.
- **SC-005**: Nenhuma tentativa de acesso a documento fiscal de outra organização é bem-sucedida.

## Assumptions

- Pedido com múltiplos pagamentos: cada pagamento vira uma ocorrência própria no grupo de pagamento da nota (o leiaute da NF-e aceita múltiplas ocorrências) — não há consolidação em uma linha só, para não perder informação fiscal (already stated as intent no relato original do bug).
- O valor de cada pagamento enviado à nota é o valor registrado no próprio pedido — a soma bater com o total da nota é uma validação que a própria SEFAZ já faz; esta feature não introduz uma validação client-side redundante além da consistência natural dos dados de origem.
- Esta feature não adiciona nenhum campo novo ao cadastro de cliente — a tela de edição expõe exatamente os mesmos campos que a tela de criação já tem.
