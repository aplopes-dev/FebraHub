# Feature Specification: Correções OS, Conciliação e Clientes

**Feature Branch**: `031-os-conciliacao-clientes-correcoes`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Itens para correção: (1) gerar venda a partir de uma Ordem de Serviço falha com 'A OS precisa de ao menos uma linha em payloadJson.lines para gerar a venda' mesmo quando a OS tem itens; (2) na tela de Conciliação bancária, o formulário de 'Novo Registro' (criar lançamento a partir de uma transação) tem o campo Cliente/Fornecedor como texto livre, deveria ser uma lista do cadastro; (3) a tela de Clientes está sem a funcionalidade de edição."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gerar venda a partir de uma Ordem de Serviço com itens de serviço (Priority: P1)

Um operador finaliza uma Ordem de Serviço que contém itens de **serviço** (mão de obra, diagnóstico, etc.) — com ou sem itens de produto de catálogo — e clica em "Gerar venda" para faturar o cliente. Hoje essa ação falha com o erro "A OS precisa de ao menos uma linha em payloadJson.lines para gerar a venda", mesmo a OS tendo itens visíveis e um total calculado na tela, porque só linhas do tipo produto vinculadas a um cadastro de catálogo são consideradas na geração da venda — linhas de serviço são descartadas silenciosamente.

**Why this priority**: Bloqueia o fechamento financeiro de qualquer Ordem de Serviço cujos itens sejam majoritariamente ou exclusivamente serviços — o caso mais comum para esse tipo de documento. Sem a correção, o lojista não consegue faturar OS de serviço nenhuma.

**Independent Test**: Pode ser testado criando uma OS com pelo menos uma linha de serviço (sem produto de catálogo vinculado) e clicando em "Gerar venda" — a venda deve ser criada com sucesso e vinculada à OS.

**Acceptance Scenarios**:

1. **Given** uma OS com pelo menos uma linha de serviço e nenhuma linha de produto, **When** o operador clica em "Gerar venda", **Then** o sistema cria a venda com sucesso, vincula `generatedSaleId` à OS e o valor da venda reflete o total da OS.
2. **Given** uma OS com uma mistura de linhas de produto (vinculadas ao catálogo) e de serviço, **When** o operador clica em "Gerar venda", **Then** todas as linhas (produto e serviço) entram na venda gerada, não só as de produto.
3. **Given** uma OS que já teve a venda gerada anteriormente, **When** o operador clica em "Gerar venda" novamente, **Then** o sistema devolve a mesma venda já existente, sem duplicar (comportamento idempotente atual preservado).
4. **Given** uma OS sem nenhuma linha de produto ou serviço lançada, **When** o operador clica em "Gerar venda", **Then** o sistema bloqueia a ação antes de chamar o servidor, com uma mensagem clara indicando que é preciso adicionar ao menos um produto ou serviço à OS.

---

### User Story 2 - Selecionar cliente ou fornecedor do cadastro ao criar um lançamento na Conciliação bancária (Priority: P2)

Um operador financeiro, na tela de Conciliação bancária, clica em "Novo Registro" numa transação pendente para lançar um pagamento/recebimento que não tem correspondência automática. No formulário, o campo "Cliente ou fornecedor" é hoje um campo de texto livre — o operador digita o nome à mão, sem vínculo com o cadastro real, o que diverge do mesmo campo em Lançamentos financeiros (que já usa uma lista de busca sobre clientes e fornecedores cadastrados).

**Why this priority**: Compromete a qualidade do dado financeiro (nomes digitados livremente geram duplicidade/erros de digitação, sem vínculo para relatórios por cliente/fornecedor) e diverge do padrão já usado em Lançamentos financeiros na mesma tela de Finanças.

**Independent Test**: Pode ser testado abrindo "Novo Registro" a partir de uma transação pendente, digitando parte do nome de um cliente ou fornecedor já cadastrado no campo "Cliente ou fornecedor" e confirmando que ele aparece como sugestão selecionável, com o lançamento resultante vinculado ao cadastro escolhido.

**Acceptance Scenarios**:

1. **Given** o formulário "Novo Registro" aberto a partir de uma transação pendente, **When** o operador digita parte do nome de um cliente ou fornecedor ativo, **Then** o campo mostra sugestões correspondentes do cadastro (clientes e fornecedores), diferenciando visualmente qual é qual.
2. **Given** o operador seleciona um cliente ou fornecedor da lista, **When** ele salva o lançamento, **Then** o lançamento criado fica vinculado ao cadastro selecionado (não apenas a um nome em texto), da mesma forma que um lançamento manual em Lançamentos financeiros.
3. **Given** o operador não quer vincular a nenhum cadastro, **When** ele deixa o campo vazio, **Then** o sistema permite salvar o lançamento sem cliente/fornecedor vinculado (comportamento atual preservado para esse caso).
4. **Given** não existe nenhum cliente ou fornecedor cadastrado na organização, **When** o operador abre o campo, **Then** o sistema mostra uma mensagem clara de "nenhum cliente ou fornecedor encontrado" em vez de uma lista vazia sem explicação.

---

### User Story 3 - Editar um cliente já cadastrado (Priority: P3)

Um operador precisa corrigir ou atualizar os dados de um cliente já cadastrado (telefone, endereço, categoria, etc.) a partir da tela de listagem de Clientes, e hoje não encontra nenhuma forma de editar o registro.

**Why this priority**: Sem edição, qualquer erro de cadastro (comum em telefone/endereço) fica permanente, obrigando a recriar o cliente e perder o histórico — mas o impacto é mais pontual que os dois itens acima, que travam fluxos inteiros de faturamento e conciliação.

**Independent Test**: Pode ser testado abrindo a lista de Clientes, acionando a edição de um cliente existente e confirmando que o formulário abre pré-preenchido com os dados atuais e que alterações salvas aparecem refletidas na listagem.

**Acceptance Scenarios**:

1. **Given** a lista de Clientes com ao menos um cliente cadastrado, **When** o operador aciona a edição desse cliente (de forma visível e óbvia na listagem, não escondida), **Then** abre um formulário pré-preenchido com os dados atuais do cliente (dados pessoais, categoria, endereços).
2. **Given** o formulário de edição aberto, **When** o operador altera um campo e salva, **Then** a alteração é persistida e a listagem de Clientes reflete o dado atualizado.
3. **Given** um link de edição para um cliente que não existe mais (ou não pertence à empresa ativa), **When** a tela de edição é aberta, **Then** o sistema mostra uma mensagem de "Cliente não encontrado" em vez de uma tela quebrada ou em branco.

---

### Edge Cases

- OS com linha de serviço com quantidade ou preço zerado: a linha deve ser considerada uma linha válida para geração de venda (valor zero é uma condição de negócio válida, ex.: serviço cortesia), não deve ser descartada silenciosamente do mesmo jeito que hoje as linhas de serviço são.
- Cliente/fornecedor selecionado no "Novo Registro" da Conciliação bancária é excluído do cadastro depois que o lançamento já foi salvo: o lançamento deve continuar mostrando o nome salvo, sem quebrar a tela (mesmo tratamento de "cadastro removido" já usado em Lançamentos financeiros).
- Cliente sendo editado é alterado por outra sessão/usuário simultaneamente: ao salvar, o sistema deve aplicar a última gravação sem travar a tela (sem necessidade de lock otimista nesta correção).
- Cliente com o mesmo nome de um fornecedor: a lista de sugestões do campo Cliente/Fornecedor da Conciliação deve diferenciar os dois claramente (rótulo indicando o tipo), evitando escolha errada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir gerar uma venda a partir de uma Ordem de Serviço que tenha ao menos uma linha de item lançada, seja ela de produto (vinculado ao catálogo) ou de serviço (sem vínculo de catálogo).
- **FR-002**: O sistema DEVE incluir na venda gerada todas as linhas da Ordem de Serviço com quantidade e valor, não somente as linhas de produto de catálogo.
- **FR-003**: O sistema DEVE bloquear a geração de venda antes de chamar o servidor, com mensagem clara, quando a Ordem de Serviço não tiver nenhuma linha de item lançada — evitando o erro técnico cru chegar ao usuário.
- **FR-004**: O sistema DEVE manter o comportamento idempotente já existente: OS com venda já gerada devolve a venda existente, sem duplicar.
- **FR-005**: O campo "Cliente ou fornecedor" do formulário "Novo Registro" (criar lançamento a partir de uma transação bancária) DEVE ser uma lista de busca sobre o cadastro real de clientes e fornecedores ativos da organização, no mesmo padrão já usado em Lançamentos financeiros.
- **FR-006**: O lançamento criado a partir de "Novo Registro" DEVE gravar o vínculo (identificador e tipo — cliente ou fornecedor) do cadastro selecionado, não apenas um nome em texto livre.
- **FR-007**: O sistema DEVE continuar permitindo salvar o lançamento sem nenhum cliente/fornecedor vinculado, quando o operador não selecionar nenhum.
- **FR-008**: O sistema DEVE mostrar uma mensagem clara quando não houver nenhum cliente ou fornecedor cadastrado, em vez de uma lista de sugestões vazia sem explicação.
- **FR-009**: A tela de listagem de Clientes DEVE oferecer uma forma clara e visível de editar cada cliente cadastrado.
- **FR-010**: A edição de cliente DEVE abrir um formulário pré-preenchido com os dados atuais do cliente (dados pessoais, categoria, endereços).
- **FR-011**: Ao salvar a edição, o sistema DEVE persistir as alterações e refleti-las na listagem de Clientes.
- **FR-012**: Ao tentar editar um cliente inexistente ou de outra empresa, o sistema DEVE mostrar uma mensagem de "Cliente não encontrado" em vez de uma tela quebrada.

### Key Entities

- **Ordem de Serviço (OS)**: documento com cliente, equipamentos e linhas de itens (produto ou serviço) com quantidade/valor; pode gerar uma Venda vinculada uma única vez.
- **Linha da Ordem de Serviço**: item de produto (vinculado a um cadastro de catálogo) ou de serviço (descrição livre, sem cadastro de catálogo), com quantidade e valor unitário.
- **Transação bancária (extrato)**: registro importado de um extrato bancário que pode ser conciliado com um Lançamento financeiro existente ou dar origem a um novo Lançamento.
- **Lançamento financeiro**: registro de entrada/saída financeira, opcionalmente vinculado a um Cliente ou Fornecedor do cadastro.
- **Cliente**: cadastro de pessoa física/jurídica que compra da organização; possui dados pessoais, categoria e endereços; pode ser vinculado a Lançamentos financeiros e Vendas.
- **Fornecedor**: cadastro de pessoa física/jurídica que vende para a organização; pode ser vinculado a Lançamentos financeiros.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das Ordens de Serviço com ao menos uma linha de item (produto ou serviço) geram venda com sucesso ao clicar em "Gerar venda", sem exibir o erro "A OS precisa de ao menos uma linha...".
- **SC-002**: O operador consegue vincular um lançamento criado a partir da Conciliação bancária a um cliente ou fornecedor do cadastro em até 3 interações (abrir o campo, digitar/buscar, selecionar).
- **SC-003**: Todo cliente listado em Clientes pode ser editado em no máximo 2 cliques a partir da listagem, sem precisar sair da tela para descobrir como editar.
- **SC-004**: Zero relatos de "não consigo editar cliente" ou "gerar venda da OS falha" após o deploy da correção, no próximo ciclo de teste manual do usuário.

## Assumptions

- O campo "Cliente ou fornecedor" da Conciliação bancária deve reaproveitar o mesmo componente de busca combinada (cliente + fornecedor) já usado em Lançamentos financeiros, não um componente novo — mantém consistência visual e de comportamento na mesma área (Finanças).
- Linhas de serviço de uma Ordem de Serviço não precisam de um cadastro de produto de catálogo para entrar na venda gerada — a correção deve viabilizar isso sem exigir que o operador cadastre um "produto" fictício para representar o serviço.
- A funcionalidade de edição de cliente cobre os mesmos dados hoje disponíveis no cadastro (dados pessoais, categoria, endereços) — não introduz novos campos.
- "Editar cliente" é uma ação sobre um cliente já existente; a validação dos dados no formulário de edição segue as mesmas regras já aplicadas no cadastro de um novo cliente.
- Nenhuma das três correções altera papéis/permissões existentes — quem já podia gerar venda de OS, criar lançamento de conciliação ou cadastrar cliente continua com o mesmo acesso, agora também para editar/gerar corretamente.
