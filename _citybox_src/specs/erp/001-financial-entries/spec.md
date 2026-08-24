# Feature Specification: Lançamentos financeiros (Contas a pagar / Contas a receber) ponta a ponta

**Feature Branch**: `001-financial-entries`

**Created**: 2026-08-05

**Status**: Draft

**Input**: User description: "Lançamentos financeiros (Contas a pagar / Contas a receber) ponta a ponta — unificar a tela de contas a pagar/receber do ERP de Comércio; hoje o formulário de criar/editar grava num mock em memória em vez da API real, então o lançamento criado 'some' no refresh. É preciso: (1) fazer criar/editar persistirem de verdade no banco; (2) adicionar rateio de pagamentos (um lançamento pode ser recebido em várias formas, ex.: parte em dinheiro, parte em depósito); (3) adicionar rateio por categoria financeira + centro de custo (com valor ou percentual, que precisa fechar 100% do total) — é esse vínculo que alimenta a DRE; (4) permitir anexar comprovantes; (5) vincular o lançamento a um cliente ou a um fornecedor; (6) status (pendente/pago/recebido) derivado da soma dos pagamentos e filtrável na listagem; (7) trocar todos os campos de seleção do formulário (conta bancária, categoria, centro de custo, cliente, fornecedor) de dados fictícios para dados reais da empresa ativa."

## Clarifications

### Session 2026-08-05

- Q: Lançamentos já existentes (antes desta funcionalidade) têm `categoryName` como texto solto e nenhum rateio por categoria. Se os relatórios (DRE) passarem a ler o rateio, o que fazer com esses lançamentos antigos — incluindo os gerados automaticamente pelo fechamento de pedidos de venda? → A: Migrar automaticamente — criar um rateio para cada lançamento existente, ligando à categoria do plano de contas com nome equivalente (ou a uma categoria padrão quando não houver correspondência, registrando quantos caíram no padrão); o fechamento de pedido de venda passa a gravar o rateio direto na categoria de sistema de vendas, em vez do texto solto. Nenhum lançamento antigo some da DRE.
- Q: Na linha de rateio por categoria financeira, o centro de custo (departamento) é obrigatório? → A: Sim, obrigatório — toda linha de rateio precisa indicar um centro de custo.
- Q: No backfill dos lançamentos antigos, quando o texto solto da categoria (`categoryName`) não bate com nenhuma conta do plano de contas, para qual categoria cada linha de rateio deve apontar? → A: Uma categoria de sistema dedicada "Outras" (fallback do backfill), separada da categoria de vendas usada pelos pedidos de venda — mantém rastreável quais lançamentos foram enquadrados automaticamente pela migração, sem poluir uma categoria de negócio real.
- Q: Quando um lançamento foi gerado automaticamente pelo fechamento de um pedido de venda, o operador pode editar os outros campos dele (valor, datas, pagamentos, rateio), ou o lançamento inteiro fica travado para edição? → A: O lançamento inteiro fica somente-leitura quando vinculado a um pedido de venda — a tela só permite excluir (soft-delete) e restaurar; nenhum campo pode ser alterado.
- Q: Existem restrições de tamanho ou tipo de arquivo para os comprovantes anexados a um lançamento? → A: Sim — até 5MB por arquivo, aceitando apenas PDF e imagens (JPG, PNG, WEBP).

## Fora de Escopo desta Fase

- **Implementação do endpoint de transferência entre contas bancárias.** O diálogo de transferência (acionado a partir de Lançamentos) deve continuar existindo na tela e buscar o centro de custo em dados reais, mas a persistência da transferência em si (modelo de dados, endpoint) pertence a uma especificação própria do módulo de contas bancárias. Enquanto esse endpoint não existir, a transferência não é um critério de aceite exigível desta fase.
- **Tela de cadastro de formas de pagamento.** As formas de pagamento usadas no rateio de pagamentos desta fase usam uma lista fixa predefinida (dinheiro, PIX, débito, crédito, boleto, depósito, transferência); um cadastro próprio de formas de pagamento fica para quando a tela de configurações existir.
- **Vínculo automático de parcelas de contrato com lançamentos financeiros.** Parcelas de contrato que hoje não geram lançamento de contas a receber continuam fora do escopo desta fase.
- **Conciliação bancária** (casar transações importadas de extrato com lançamentos existentes) é uma especificação separada que consome este módulo depois de pronto.
- **Cancelamento explícito de transferência ou de lançamentos fechados em relatórios já publicados** não está coberto.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar e editar um lançamento que realmente persiste (Priority: P1)

Um operador financeiro registra um novo lançamento (contas a pagar ou contas a receber) informando valor, taxa, multa, conta bancária, data de competência, data de vencimento, descrição e, opcionalmente, um cliente ou fornecedor vinculado. Depois de salvar, o lançamento aparece na listagem e continua lá mesmo depois de atualizar a página ou reabrir o sistema mais tarde. O operador também consegue reabrir esse mesmo lançamento, alterar seus dados e salvar novamente, vendo as alterações refletidas de verdade.

**Why this priority**: É o defeito mais grave hoje: o operador cria um lançamento, vê a confirmação de sucesso, mas o dado nunca chega a ser salvo de verdade — ele desaparece no refresh. Sem isso corrigido, a tela inteira de Lançamentos não tem valor de uso, e nenhuma outra tela do módulo financeiro (que depende dos lançamentos) pode funcionar corretamente.

**Independent Test**: Pode ser testado sozinho criando um lançamento simples (sem rateio, sem anexo), atualizando a página e confirmando que ele continua na lista com os mesmos dados; em seguida editando esse lançamento e confirmando que a alteração persiste.

**Acceptance Scenarios**:

1. **Given** o operador está na tela de Lançamentos, **When** ele preenche os dados obrigatórios de um novo lançamento e salva, **Then** o lançamento aparece na listagem e continua visível após atualizar a página.
2. **Given** um lançamento foi criado anteriormente, **When** o operador abre esse lançamento para edição, **Then** os dados reais do lançamento são carregados no formulário (não uma tela de "não encontrado").
3. **Given** um lançamento existente aberto para edição, **When** o operador altera um campo e salva, **Then** a alteração é refletida ao reabrir o lançamento depois.
4. **Given** um lançamento existente, **When** o operador o exclui, **Then** ele deixa de aparecer na lista de ativos, passa a aparecer na lista de excluídos, e pode ser restaurado a qualquer momento.
5. **Given** um usuário sem permissão de gestão financeira da loja, **When** ele tenta criar, editar ou excluir um lançamento, **Then** a ação é bloqueada.
6. **Given** um lançamento vinculado a um pedido de venda, **When** o operador tenta editar qualquer campo dele, **Then** a edição é bloqueada e apenas as ações de excluir/restaurar continuam disponíveis.

---

### User Story 2 - Ratear um lançamento entre várias formas de pagamento (Priority: P2)

Um operador registra que o valor de um lançamento foi recebido (ou pago) em partes, com formas diferentes — por exemplo, parte em dinheiro e parte em depósito bancário. Ele adiciona quantas linhas de pagamento forem necessárias, cada uma com seu próprio valor, data e forma de pagamento (e a bandeira do cartão, quando for o caso). A qualquer momento, o operador vê quanto ainda falta para cobrir o total, se o total já foi coberto, ou se foi recebido/pago a mais.

**Why this priority**: É uma capacidade nova pedida por clientes que hoje não existe em lugar nenhum (nem no sistema legado). Depende da persistência real da User Story 1, mas é independente do rateio por categoria.

**Independent Test**: Pode ser testado criando um lançamento com duas linhas de pagamento (ex.: metade em dinheiro, metade em depósito) e confirmando que ambas aparecem, com formas distintas, ao reabrir o lançamento.

**Acceptance Scenarios**:

1. **Given** um lançamento em criação, **When** o operador adiciona duas linhas de pagamento com formas diferentes cujo total soma o valor do lançamento, **Then** o indicador mostra que o total foi coberto e o lançamento é salvo com as duas linhas.
2. **Given** um lançamento cujos pagamentos somam menos que o total, **When** o operador salva mesmo assim, **Then** o salvamento é permitido e o lançamento fica com status pendente, mostrando quanto ainda falta.
3. **Given** um lançamento cujos pagamentos somam mais que o total, **When** o operador salva, **Then** o salvamento é permitido e o indicador mostra o valor recebido/pago a mais.
4. **Given** um lançamento com pagamentos cuja soma cobre o total, **When** a listagem é consultada, **Then** o status desse lançamento aparece como pago/recebido.

---

### User Story 3 - Ratear um lançamento entre categorias financeiras e centros de custo (Priority: P2)

Um operador divide o valor de um lançamento entre diferentes categorias do plano de contas — por exemplo, 80% em "Faturamento com serviços" e 20% em "Faturamento com venda de produtos" — informando, para cada categoria, o centro de custo (departamento) responsável e o valor ou o percentual daquela fatia. Alterar o valor de uma linha recalcula automaticamente o percentual, e vice-versa. O sistema não permite salvar se a soma das linhas não fechar exatamente com o valor total do lançamento.

**Why this priority**: É o vínculo que alimenta a Demonstração de Resultados (DRE) e a análise por centro de custo — sem ele, essas telas continuam furadas mesmo com o CRUD básico funcionando. Depende da User Story 1.

**Independent Test**: Pode ser testado criando um lançamento de R$ 10.000 rateado 80%/20% entre duas categorias (cada uma com seu centro de custo) e confirmando que as duas linhas persistem com os valores e percentuais corretos; e testando que uma tentativa de salvar com soma divergente do total é rejeitada.

**Acceptance Scenarios**:

1. **Given** um lançamento de R$ 10.000 em criação, **When** o operador informa duas linhas de rateio por categoria (80% e 20%, cada uma com seu centro de custo) que somam o total, **Then** o lançamento é salvo com as duas linhas de rateio.
2. **Given** uma linha de rateio em edição, **When** o operador altera o valor da linha, **Then** o percentual correspondente é recalculado automaticamente (e vice-versa, ao alterar o percentual).
3. **Given** um lançamento cujo rateio por categoria não soma o valor total (fora da tolerância de R$ 0,01), **When** o operador tenta salvar, **Then** o salvamento é rejeitado tanto na tela quanto pelo servidor, com uma mensagem clara do que precisa ser corrigido.
4. **Given** uma linha de rateio sem centro de custo informado, **When** o operador tenta salvar, **Then** o salvamento é rejeitado até que o centro de custo seja preenchido.
5. **Given** uma categoria ou centro de custo que não pertence à empresa ativa, **When** o operador tenta usá-lo numa linha de rateio, **Then** o salvamento é rejeitado.

---

### User Story 4 - Anexar comprovantes a um lançamento (Priority: P3)

Um operador anexa um ou mais arquivos (comprovantes, notas, recibos) a um lançamento financeiro. Ao reabrir o lançamento depois, os anexos continuam disponíveis para consulta.

**Why this priority**: É um complemento de valor (auditoria e organização), mas o módulo financeiro funciona sem ele — por isso vem depois das capacidades de rateio.

**Independent Test**: Pode ser testado anexando um arquivo a um lançamento já salvo, reabrindo o lançamento e confirmando que o arquivo aparece disponível.

**Acceptance Scenarios**:

1. **Given** um lançamento salvo, **When** o operador anexa um comprovante, **Then** o anexo aparece ao reabrir o lançamento depois.
2. **Given** o serviço de armazenamento de arquivos está indisponível no momento do anexo, **When** o operador tenta anexar um comprovante, **Then** o restante do lançamento é salvo normalmente e o operador é avisado separadamente que só o anexo falhou.
3. **Given** um arquivo maior que 5MB ou de um tipo não aceito, **When** o operador tenta anexá-lo a um lançamento, **Then** o sistema rejeita o anexo antes de salvá-lo, com uma mensagem clara do motivo.

---

### User Story 5 - Encontrar lançamentos com filtros ricos (Priority: P2)

Um operador filtra a listagem de lançamentos por tipo de operação (a pagar/a receber), status (pendente/pago/recebido), categoria financeira, centro de custo e período de vencimento, além de buscar por texto — e os resultados batem exatamente com os filtros aplicados, mesmo com muitos lançamentos cadastrados.

**Why this priority**: Sem filtros reais, o operador não consegue localizar lançamentos específicos numa base grande — mas a tela já funciona minimamente sem eles (busca básica e paginação já existem hoje).

**Independent Test**: Pode ser testado aplicando um filtro de categoria financeira e um de status simultaneamente e confirmando que somente os lançamentos que atendem a ambos aparecem, com a contagem de páginas refletindo o total filtrado (não o total geral).

**Acceptance Scenarios**:

1. **Given** lançamentos com categorias e status variados, **When** o operador filtra por uma categoria financeira específica, **Then** somente lançamentos rateados para aquela categoria aparecem.
2. **Given** a mesma listagem, **When** o operador filtra por status "pago/recebido", **Then** somente lançamentos cuja soma de pagamentos cobre o total aparecem.
3. **Given** todos os campos de seleção do formulário e dos filtros, **When** o operador os abre, **Then** as opções mostradas refletem os dados reais e atuais da empresa ativa (nenhuma opção de exemplo/fictícia).

---

### Edge Cases

- O que acontece quando o operador tenta editar um lançamento enviando uma lista de rateio por categoria vazia? → O sistema rejeita: rateio por categoria não pode ficar vazio quando o lançamento tem valor total maior que zero.
- O que acontece quando o pedido de venda que gera automaticamente um lançamento de contas a receber é fechado mais de uma vez (reprocessamento)? → Não pode gerar um segundo lançamento para o mesmo pedido.
- O que acontece se o operador tentar editar qualquer campo de um lançamento vinculado a um pedido de venda (incluindo tentar reatribuir o próprio vínculo)? → Não é permitido; o lançamento inteiro é somente-leitura nesse caso — a tela bloqueia a edição e permite apenas excluir/restaurar.
- O que acontece se o operador tentar anexar um arquivo maior que 5MB ou de um tipo não aceito (fora de PDF/imagem)? → O sistema rejeita o anexo antes de salvá-lo, com uma mensagem clara do motivo, sem afetar o restante do lançamento.
- O que acontece com um lançamento cujos pagamentos somam exatamente o valor total, nem mais nem menos? → Status muda para pago/recebido.
- O que acontece se o operador tentar vincular um lançamento a um cliente e a um fornecedor ao mesmo tempo? → Não é permitido; o vínculo é com um ou outro, nunca os dois.
- O que acontece com lançamentos criados antes desta funcionalidade existir, que não têm rateio por categoria? → São migrados automaticamente: cada um recebe uma linha de rateio ligada à categoria do plano de contas com nome equivalente ao texto solto anterior, ou a uma categoria padrão quando não houver correspondência (com o número de casos migrados para a categoria padrão registrado para conferência).
- O que acontece se o serviço de anexos estiver fora do ar durante a criação de um lançamento sem tentativa de anexo? → Não afeta o salvamento; anexos são uma etapa independente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir criar um lançamento financeiro escolhendo, dentro do próprio formulário, entre "Contas a receber" e "Contas a pagar" — sem exigir menus ou telas separadas para cada tipo.
- **FR-002**: O sistema DEVE persistir de forma duradoura todo lançamento criado ou editado pela tela, de modo que ele sobreviva a atualizações de página e reaberturas de sessão.
- **FR-003**: O sistema DEVE calcular o valor total do lançamento como valor base + taxa + multa, atualizando esse total em tempo real conforme o operador edita os campos.
- **FR-004**: O sistema DEVE exigir conta bancária, data de competência, data de vencimento e descrição para salvar um lançamento.
- **FR-005**: O sistema DEVE permitir vincular um lançamento a um cliente OU a um fornecedor (nunca os dois simultaneamente), sendo esse vínculo opcional.
- **FR-006**: O sistema DEVE permitir registrar múltiplas linhas de pagamento/recebimento por lançamento, cada uma com valor, data e forma de pagamento (e bandeira, quando a forma for cartão).
- **FR-007**: O sistema DEVE calcular e exibir, a partir do rateio de pagamentos, quanto falta para cobrir o total, se o total já foi coberto, ou quanto foi recebido/pago a mais — sem bloquear o salvamento nesses casos (o rateio de pagamentos é informativo, não obrigatório fechar).
- **FR-008**: O sistema DEVE derivar o status do lançamento (pendente / pago / recebido) a partir da soma dos pagamentos registrados frente ao valor total, e esse status DEVE estar disponível como filtro na listagem.
- **FR-009**: O sistema DEVE permitir ratear um lançamento entre múltiplas categorias financeiras (plano de contas), informando para cada linha o centro de custo, e o valor OU o percentual daquela fatia (recalculando automaticamente o valor quando o percentual é editado, e vice-versa).
- **FR-010**: O sistema DEVE exigir centro de custo em toda linha de rateio por categoria — uma linha sem centro de custo não pode ser salva.
- **FR-011**: O sistema DEVE impedir o salvamento — tanto na validação da tela quanto na validação do servidor — quando a soma do rateio por categoria não fechar com o valor total do lançamento, respeitando uma tolerância de R$ 0,01.
- **FR-012**: O sistema DEVE validar que a categoria financeira, o centro de custo e a conta bancária informados em um lançamento pertencem à empresa (organização) ativa, rejeitando referências de outra empresa.
- **FR-013**: O sistema DEVE permitir anexar um ou mais comprovantes/arquivos a um lançamento, e esses anexos DEVEM continuar disponíveis ao reabrir o lançamento depois.
- **FR-014**: Uma falha ao enviar um anexo NÃO DEVE impedir o salvamento do restante do lançamento; o operador DEVE ser avisado separadamente sobre a falha do anexo.
- **FR-014a**: O sistema DEVE aceitar como anexo apenas arquivos do tipo PDF ou imagem (JPG, PNG, WEBP), com no máximo 5MB por arquivo, rejeitando qualquer arquivo fora desses limites antes de salvá-lo, com mensagem clara do motivo.
- **FR-015**: O sistema DEVE permitir editar um lançamento existente, substituindo integralmente suas linhas de pagamento e de rateio por categoria pelas informadas na edição.
- **FR-016**: O sistema NÃO DEVE permitir editar nenhum campo de um lançamento vinculado a um pedido de venda — o lançamento inteiro fica somente-leitura nesse caso, permitindo apenas excluir (soft-delete) e restaurar.
- **FR-017**: O sistema DEVE permitir excluir um lançamento sem apagá-lo definitivamente (exclusão reversível), listando lançamentos excluídos separadamente dos ativos e permitindo restaurá-los.
- **FR-018**: O sistema DEVE listar e filtrar lançamentos no servidor (não apenas no navegador) por tipo de operação, status, categoria financeira, centro de custo e período de vencimento, além de busca textual, com paginação.
- **FR-019**: O sistema DEVE restringir a criação, edição e exclusão de lançamentos a usuários com permissão de gestão financeira da loja; a leitura/listagem fica disponível a qualquer usuário com acesso à empresa.
- **FR-020**: O sistema DEVE continuar gerando exatamente um lançamento de "contas a receber" por pedido de venda fechado com pagamento, mesmo em caso de reprocessamento (idempotência mantida).
- **FR-021**: Todas as opções de seleção do formulário e dos filtros (conta bancária, categoria financeira, centro de custo, cliente, fornecedor) DEVEM refletir os dados reais e atuais da empresa ativa — nenhuma opção fictícia/de exemplo pode aparecer.
- **FR-022**: O sistema DEVE mostrar um indicador de carregamento em qualquer botão que dispare uma ação de salvar, excluir ou restaurar, até que a operação termine.
- **FR-023**: Ao trocar a empresa ativa, a listagem e os lançamentos exibidos DEVEM refletir exclusivamente a empresa selecionada.
- **FR-024**: O sistema DEVE migrar automaticamente, de uma só vez, os lançamentos existentes antes desta funcionalidade: cada um recebe uma linha de rateio por categoria ligada à categoria do plano de contas cujo nome corresponde ao texto solto anterior, ou a uma categoria de sistema dedicada "Outras" (fallback do backfill, distinta da categoria de vendas usada pelos pedidos de venda) quando não houver correspondência exata, com o total de casos migrados para o fallback disponível para conferência.
- **FR-025**: A geração automática de lançamento de contas a receber ao fechar um pedido de venda DEVE passar a gravar o rateio diretamente na categoria financeira de sistema usada para vendas, em vez de um texto solto sem vínculo.

### Key Entities *(include if feature involves data)*

- **Lançamento financeiro**: registro de um movimento de dinheiro (a pagar ou a receber) de uma empresa. Atributos principais: tipo de operação, valor base, taxa, multa, valor total (calculado), data de competência, data de vencimento, descrição, observação, status (derivado), vínculo opcional com conta bancária, cliente ou fornecedor, e vínculo somente-leitura com o pedido de venda que o originou (quando aplicável). Pode ser excluído de forma reversível. Quando vinculado a um pedido de venda, o lançamento inteiro é somente-leitura — apenas exclusão e restauração continuam disponíveis.
- **Pagamento (linha de rateio de pagamento)**: uma parcela do valor de um lançamento efetivamente recebida/paga, com seu próprio valor, data, forma de pagamento e bandeira (quando cartão). Um lançamento pode ter várias.
- **Rateio por categoria (linha de alocação)**: uma fatia do valor total de um lançamento atribuída a uma categoria financeira e a um centro de custo, com valor e percentual equivalentes. A soma de todas as linhas de um lançamento deve fechar com o valor total.
- **Anexo**: um arquivo (comprovante, nota, recibo) vinculado a um lançamento, limitado a PDF ou imagem (JPG, PNG, WEBP) com no máximo 5MB por arquivo.
- **Categoria financeira, Centro de custo, Cliente, Fornecedor, Conta bancária**: entidades já existentes no sistema, referenciadas pelo lançamento e por suas linhas de rateio — este recurso não cria nem altera essas entidades, apenas passa a consumi-las de verdade em vez de dados de exemplo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos lançamentos criados ou editados pela tela continuam visíveis, com os mesmos dados, após uma atualização de página.
- **SC-002**: Todo lançamento salvo com rateio por categoria tem a soma das linhas de rateio igual ao valor total do lançamento (tolerância de R$ 0,01), sem exceções.
- **SC-003**: O fechamento de pedidos de venda continua gerando exatamente um lançamento de contas a receber por pedido, mesmo em reprocessamentos — zero duplicidades e zero lançamentos perdidos.
- **SC-004**: Nenhum campo de seleção nas telas de Lançamentos (formulário ou filtros) exibe dados de exemplo/fictícios — 100% das opções vêm de dados reais da empresa ativa.
- **SC-005**: 100% das tentativas de criar, editar ou excluir um lançamento por um usuário sem permissão de gestão financeira são bloqueadas.
- **SC-006**: Ao trocar a empresa ativa, a listagem de lançamentos exibida corresponde exclusivamente à empresa selecionada, sem nenhum lançamento de outra empresa visível.
- **SC-007**: Uma falha no envio de um anexo nunca impede o salvamento do restante de um lançamento.
- **SC-008**: Lançamentos existentes antes desta funcionalidade continuam aparecendo em relatórios que passam a exigir rateio por categoria, após a migração automática.
- **SC-009**: 100% das tentativas de editar qualquer campo de um lançamento vinculado a um pedido de venda são bloqueadas, tanto na tela quanto no servidor.
- **SC-010**: 100% dos anexos maiores que 5MB ou de tipo não aceito são rejeitados antes de serem salvos.

## Assumptions

- As formas de pagamento usadas no rateio de pagamentos desta fase usam uma lista fixa predefinida (dinheiro, PIX, débito, crédito, boleto, depósito, transferência) — um cadastro dedicado de formas de pagamento fica para uma fase futura.
- A bandeira do cartão é um campo de texto livre (sem cadastro próprio), podendo ser sugerida a partir de bandeiras já usadas em contratos de cartão ativos da empresa.
- O rateio de pagamentos permanece informativo (não bloqueia o salvamento) — apenas o rateio por categoria financeira é obrigatório fechar exatamente com o valor total.
- Anexos são armazenados no mesmo serviço de arquivos já usado por outras áreas do sistema, com o mesmo padrão de tratamento de falha (o restante da operação principal não é bloqueado por uma falha de upload).
- A funcionalidade opera sempre no contexto de uma única empresa ativa por vez, seguindo o modelo multiempresa já existente no restante do sistema.
- O diálogo de transferência entre contas bancárias continua presente na tela de Lançamentos, mas sua persistência real depende de uma funcionalidade externa a esta especificação (ver "Fora de Escopo desta Fase").
- A migração automática de lançamentos antigos (categoria por nome equivalente, com categoria padrão como fallback) é executada uma única vez, como parte da entrega desta funcionalidade, e não como uma ação manual repetível pelo operador.
