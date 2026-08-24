# Feature Specification: Ajustes no módulo Financeiro

**Feature Branch**: `007-financeiro-ajustes-ui`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "Ajustes no módulo Financeiro: extratos, lançamentos, conciliação bancária, relatório de resultados, contratos de cartões, contas bancárias e cadastro de formas de pagamento"

## Clarifications

### Session 2026-08-07

- Q: O campo "Forma de pagamento" no lançamento hoje é um enum fixo no frontend; `/configuracoes/formas-pagamento` já existe como tela mas é 100% mock em memória (sem persistência no backend). Este ajuste deve criar uma entidade real de forma de pagamento no backend (nova tabela/endpoints, compartilhada pelas duas telas) ou manter a solução só no frontend? → A: Criar entidade real no backend (nova tabela `PaymentMethod` + endpoints CRUD), fonte única compartilhada por `/configuracoes/formas-pagamento` e pelo select de lançamentos.
- Q: O campo "Provedor" do contrato de cartão hoje é texto livre com sugestões estáticas; não existe hoje nenhuma API de catálogo de provedores. O pedido menciona "consumir todos os registros da API, incluindo paginação" — isso deve virar um catálogo real no backend (nova entidade + endpoint paginado) ou uma lista fechada só no frontend (~20 itens, sem API nova)? → A: Lista fechada mantida no frontend, sem endpoint novo — volume pequeno e estável não justifica uma entidade dedicada nesta fatia; a menção a paginação no pedido original é tratada como salvaguarda de UI, não como requisito de API paginada.
- Q: "Remover seleção obrigatória de conta bancária" na importação de extrato — remover o campo inteiramente, ou mantê-lo visível porém opcional? Dado que o arquivo `.ofx` já traz o código do banco (`BANKACCTFROM.BANKID`), mas o cadastro de conta bancária não guarda agência/número de conta (só o código do banco) — como usar essa informação? → A: Manter o campo visível e opcional; ao ler o arquivo, pré-selecionar automaticamente a conta bancária quando exatamente uma conta ativa da organização tiver o mesmo código de banco do arquivo (usuário pode trocar); se houver zero ou mais de uma conta com esse código, o campo fica vazio sem bloquear a importação.

### Session 2026-08-09

- Q: Excluir (soft-delete) um lançamento em `/financas/lancamentos` que tem um pagamento com conciliação bancária ativa (vinculado a uma transação de extrato importado) — o que o sistema deve fazer? → A: Bloquear a exclusão com mensagem clara ("não é possível excluir: desfaça a conciliação primeiro"); o usuário precisa desvincular a conciliação daquele pagamento antes de conseguir excluir o lançamento.
- Q: O select fechado de Bandeira (Visa, MasterCard, American Express, Sorocred, Elo, Hipercard, Credicard, Outros, Alelo, Ticket, VR Benefícios, Sodexo, Banricompras) na seção Pagamentos de `/financas/lancamentos` — como se relaciona com o catálogo `CARD_BRAND_OPTIONS` já existente no código (10 opções, usado em Contratos de cartão e Pedidos de venda)? → A: É o mesmo catálogo compartilhado (`CARD_BRAND_OPTIONS`) nas três telas — a lista existente é ampliada para a união das duas (as 13 opções deste pedido + as opções já existentes que não aparecem nele, como Diners Club e Discover), sem remover nenhuma opção hoje válida em contratos/pedidos de venda já cadastrados.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resumo e colunas do Extrato refletem o que o financeiro precisa ver (Priority: P1)

Como responsável financeiro, ao abrir `/financas/extratos` eu vejo, no topo, apenas os totais de Entradas, Saídas e Saldo do período (sem saldo por conta bancária) e, na grade, as colunas Competência, Vencimento, Categoria, Método de pagamento, Valor original, Valor final e Status — para entender rapidamente o resultado do período sem ruído de informação que não uso nesta tela.

**Why this priority**: É a tela de consulta mais usada do módulo financeiro; o desalinhamento entre o que é exibido hoje e o que o time precisa gera retrabalho manual (exportar/reconferir em planilha).

**Independent Test**: Abrir `/financas/extratos` com lançamentos de teste cadastrados e conferir visualmente que o resumo mostra as 3 métricas (sem saldo por conta) e que a grade mostra exatamente as 7 colunas na ordem especificada.

**Acceptance Scenarios**:

1. **Given** existem lançamentos no período filtrado, **When** o usuário abre `/financas/extratos`, **Then** o resumo no topo mostra Entradas, Saídas e Saldo do período, e não mostra saldo por conta bancária.
2. **Given** a grade de extrato está carregada, **When** o usuário observa as colunas, **Then** elas são, nesta ordem: Competência, Vencimento, Categoria, Método de pagamento, Valor original, Valor final, Status.

---

### User Story 2 - Grade de Lançamentos mostra as colunas de gestão do dia a dia (Priority: P1)

Como responsável financeiro, ao abrir `/financas/lancamentos` eu vejo Fornecedor/Cliente, Tipo, Categoria, Data de vencimento, Valor original, Valor final e Status na grade — para localizar e priorizar contas a pagar/receber sem abrir cada lançamento individualmente.

**Why this priority**: Mesma tela de trabalho diário do financeiro; sem essas colunas o usuário precisa abrir cada lançamento para saber quem é a contraparte e o tipo.

**Independent Test**: Abrir `/financas/lancamentos` com lançamentos de contas a pagar e a receber cadastrados e conferir que a grade mostra exatamente essas 7 colunas.

**Acceptance Scenarios**:

1. **Given** existem lançamentos de tipos diferentes (pagar/receber), **When** o usuário abre `/financas/lancamentos`, **Then** a grade mostra as colunas Fornecedor/Cliente, Tipo, Categoria, Data de vencimento, Valor original, Valor final, Status.

---

### User Story 3 - Formulário de novo lançamento com campos alinhados e forma de pagamento vinda do cadastro (Priority: P1)

Como responsável financeiro, ao criar um lançamento em `/financas/lancamentos/novo`, na seção "Pagamentos" eu vejo os campos Data, Forma de pagamento e Valor todos com label (hoje só Valor tem), o que mantém o formulário alinhado; e a lista de formas de pagamento do select vem do cadastro de `/configuracoes/formas-pagamento`, que inclui as 15 formas padrão da plataforma e permite à empresa cadastrar formas próprias.

**Why this priority**: É o ponto de entrada de todo lançamento manual; um select desalinhado ou com dados mockados (que não batem com o que a empresa cadastrou) gera erro de digitação e dado inconsistente entre telas.

**Independent Test**: Abrir `/financas/lancamentos/novo`, conferir visualmente que os 3 campos da linha de pagamento têm label; cadastrar uma forma de pagamento nova em `/configuracoes/formas-pagamento` e confirmar que ela aparece no select de Forma de pagamento do lançamento sem reload manual de cache.

**Acceptance Scenarios**:

1. **Given** o usuário está na seção Pagamentos do formulário de novo lançamento, **When** ele observa a linha de um pagamento, **Then** os campos Data, Forma de pagamento e Valor têm label visível e alinhado.
2. **Given** as 15 formas de pagamento padrão existem no cadastro, **When** o usuário abre o select Forma de pagamento no lançamento, **Then** todas as 15 aparecem como opção.
3. **Given** o usuário cadastrou uma forma de pagamento nova em `/configuracoes/formas-pagamento`, **When** ele volta para `/financas/lancamentos/novo`, **Then** a nova forma aparece como opção no select.

---

### User Story 4 - Importar extrato bancário sem exigir conta pré-selecionada e via upload de arquivo (Priority: P2)

Como responsável financeiro, ao importar um extrato em `/financas/conciliacao-bancaria`, eu não sou obrigado a selecionar uma conta bancária antes de enviar o arquivo — o sistema tenta identificar a conta automaticamente pelo código do banco gravado no próprio arquivo `.ofx`, e eu só preciso escolher manualmente quando essa identificação for ambígua ou não encontrar nada — e escolho o arquivo `.ofx` por um seletor de upload (não digitando texto).

**Why this priority**: Reduz fricção do fluxo de conciliação sem abrir mão de contexto: a maioria das empresas com uma conta por banco nunca precisa tocar no campo.

**Independent Test**: Selecionar um arquivo `.ofx` de teste cujo código de banco bate com uma única conta bancária cadastrada e confirmar que o campo Conta bancária é pré-preenchido sozinho; repetir com um arquivo cujo código de banco não tem conta correspondente (ou tem mais de uma) e confirmar que o campo fica vazio mas a importação não é bloqueada.

**Acceptance Scenarios**:

1. **Given** a organização tem exatamente uma conta bancária ativa cadastrada para o banco X, **When** o usuário seleciona um arquivo `.ofx` cujo código de banco é X, **Then** o campo Conta bancária é pré-selecionado automaticamente com essa conta, permanecendo editável.
2. **Given** a organização tem zero ou duas ou mais contas bancárias ativas para o banco do arquivo, **When** o usuário seleciona o arquivo `.ofx`, **Then** o campo Conta bancária permanece vazio e a importação MUST continuar permitida sem exigir a seleção.
3. **Given** o usuário abre "Importar Extrato", **When** ele não seleciona nenhuma conta bancária (manual ou automaticamente) e escolhe um arquivo `.ofx` válido, **Then** o sistema aceita a importação sem bloquear por falta de conta.
4. **Given** o usuário está no diálogo de importação, **When** ele interage com o campo de arquivo, **Then** a interação é um seletor de upload de arquivo restrito a `.ofx`, nunca um campo de texto livre.

---

### User Story 5 - Estrutura de categorias do Relatório de Resultados (DRE) segue o novo modelo (Priority: P2)

Como responsável financeiro, ao abrir `/financas/relatorios-de-resultados`, vejo a árvore de categorias organizada exatamente no modelo: Receitas Operacionais (+) com as subcategorias Faturamento com serviços / Faturamento com serviços e venda de produtos / Faturamento com venda de produtos; Deduções da Receita (+); Custos Operacionais (-); Despesas Operacionais (-); Despesas Financeiras (-); Outras Receitas (+); Outras Despesas (-); Descontos/Taxas (-); Juros/Multa (-) com as subcategorias Juros/Multa de Receitas e Juros/Multa de Despesas; e ao final o total de Resultado Operacional — mantendo o layout e a navegação por período já existentes.

**Why this priority**: Alinha a DRE ao plano de contas que a contabilidade da empresa usa; sem isso os relatórios não batem com a apuração externa. Menor prioridade que P1 porque não bloqueia o dia a dia operacional das contas a pagar/receber.

**Independent Test**: Abrir `/financas/relatorios-de-resultados` para um período com lançamentos em todas as categorias do novo modelo e conferir visualmente a árvore completa e o total de Resultado Operacional ao final.

**Acceptance Scenarios**:

1. **Given** o usuário está em `/financas/relatorios-de-resultados`, **When** a árvore de categorias é exibida, **Then** os grupos aparecem na ordem e com os nomes definidos no modelo (Receitas Operacionais, Deduções da Receita, Custos Operacionais, Despesas Operacionais, Despesas Financeiras, Outras Receitas, Outras Despesas, Descontos/Taxas, Juros/Multa).
2. **Given** a árvore está renderizada, **When** o usuário expande Receitas Operacionais, **Then** vê as 3 subcategorias de faturamento; **When** expande Juros/Multa, **Then** vê Juros/Multa de Receitas e Juros/Multa de Despesas.
3. **Given** a árvore está completa, **When** o usuário rola até o final, **Then** vê o total consolidado de Resultado Operacional.
4. **Given** o usuário troca o período no filtro existente, **Then** a árvore recalcula os valores para o novo período sem alterar a estrutura de categorias.

---

### User Story 6 - Provedor do contrato de cartão como lista de seleção (Priority: P3)

Como responsável financeiro, ao cadastrar um novo contrato em `/financas/contratos-de-cartoes-e-outros/novo`, escolho o Provedor em uma lista de seleção (não digito texto livre), evitando nomes duplicados/divergentes do mesmo provedor.

**Why this priority**: Melhora consistência de dado, mas o campo atual (texto livre com sugestões) já funciona; o ganho é qualidade de dado, não desbloqueio de fluxo.

**Independent Test**: Abrir `/financas/contratos-de-cartoes-e-outros/novo` e confirmar que o campo Provedor é um select/autocomplete fechado (sem permitir texto arbitrário) com exatamente as 20 opções fornecidas.

**Acceptance Scenarios**:

1. **Given** o usuário está no formulário de novo contrato, **When** ele abre o campo Provedor, **Then** vê uma lista de opções pré-definidas e só pode escolher uma delas (não digitar um valor fora da lista).
2. **Given** o usuário abre o campo Provedor, **When** ele rola ou busca na lista, **Then** todos os 20 provedores especificados ficam disponíveis para seleção, sem nenhum ficar de fora.

---

### User Story 7 - Lista completa de bancos ao cadastrar conta bancária (Priority: P3)

Como responsável financeiro, ao cadastrar uma nova conta bancária em `/financas/contas-bancarias`, escolho o Banco em uma lista que cobre os 19 bancos especificados (Banco de Brasília, Banco do Brasil, Banco do Nordeste, Bancoob, Banestes, BankBoston, Banpará, Banrisul, BCN, Bradesco, BTG Pactual, C6 Bank, Caixa Econômica, Citibank, Conta PDV, Credisan, HSBC, Inter, Itaú, Mercantil do Brasil), sem precisar digitar um código manualmente.

**Why this priority**: Corrige uma lista incompleta; contorno atual é digitar o nome manualmente em outro campo/observação, então não bloqueia o cadastro, só piora a qualidade do dado.

**Independent Test**: Abrir o formulário de nova conta bancária e conferir que o select de Banco contém todos os 19 bancos da lista, cada um associado ao código correto.

**Acceptance Scenarios**:

1. **Given** o usuário está cadastrando uma nova conta bancária, **When** ele abre o select Banco, **Then** vê todos os 19 bancos listados, cada um com o nome e o código corretos (ex.: "70 — Banco de Brasília").
2. **Given** o usuário salva uma conta com um dos bancos da lista, **When** ele reabre a conta para edição, **Then** o mesmo banco continua selecionado (o código persistido resolve de volta ao nome).

---

### User Story 9 - Bandeira do pagamento como select fechado (Priority: P1)

Como responsável financeiro, ao registrar um pagamento na seção "Pagamentos" de um lançamento (`/financas/lancamentos/novo` ou ao visualizar/editar um lançamento existente), vejo o campo Bandeira com label visível, alinhado aos demais campos da linha (Data, Forma de pagamento, Valor), e escolho a bandeira em uma lista fechada de opções (não digito texto livre).

**Why this priority**: Hoje o campo é um `Autocomplete` livre (`freeSolo`) sem label próprio, o que desalinha a linha de pagamento visualmente e permite valores divergentes (ex.: "Visa" vs "visa" vs "VISA") que não conversam com o catálogo já usado em Contratos de cartões e Pedidos de venda.

**Independent Test**: Abrir um lançamento na seção Pagamentos, conferir que o campo Bandeira tem label visível e alinhado com Data/Forma de pagamento/Valor, e que ao abrir o campo só é possível escolher uma opção da lista (sem digitar valor fora dela).

**Acceptance Scenarios**:

1. **Given** o usuário está na seção Pagamentos de um lançamento, **When** ele observa a linha de um pagamento, **Then** o campo Bandeira tem label visível ("Bandeira"), no mesmo padrão visual dos demais campos da linha.
2. **Given** o usuário abre o campo Bandeira, **When** ele visualiza as opções, **Then** vê uma lista fechada que inclui, no mínimo, Visa, MasterCard, American Express, Sorocred, Elo, Hipercard, Credicard, Outros, Alelo, Ticket, VR Benefícios, Sodexo e Banricompras — e não pode digitar um valor fora da lista.
3. **Given** o lançamento é de operação que não é cartão, **When** o usuário não seleciona nenhuma bandeira, **Then** o lançamento pode ser salvo normalmente (campo continua opcional).

---

### User Story 10 - Bloquear exclusão de lançamento com conciliação ativa (Priority: P1)

Como responsável financeiro, ao tentar excluir um lançamento em `/financas/lancamentos` que tem um pagamento vinculado a uma conciliação bancária ativa (transação de extrato importado já casada com esse pagamento), o sistema impede a exclusão e explica que preciso desfazer a conciliação primeiro.

**Why this priority**: Excluir um lançamento já conciliado sem desfazer o vínculo deixa a transação do extrato importado apontando para um lançamento que não existe mais, corrompendo a conciliação bancária e o extrato — mesma classe de proteção que já existe para formas de pagamento em uso (US8, FR-021).

**Independent Test**: Conciliar manualmente um pagamento de um lançamento de teste com uma transação de extrato importado; tentar excluir esse lançamento em `/financas/lancamentos` e confirmar que o sistema bloqueia a ação com mensagem explicando o motivo; desfazer a conciliação e confirmar que a exclusão passa a ser permitida.

**Acceptance Scenarios**:

1. **Given** um lançamento tem ao menos um pagamento com conciliação bancária ativa, **When** o usuário tenta excluí-lo (soft-delete) em `/financas/lancamentos`, **Then** o sistema bloqueia a exclusão e exibe mensagem explicando que é preciso desfazer a conciliação primeiro.
2. **Given** o usuário desfez a conciliação de todos os pagamentos de um lançamento, **When** ele tenta excluir esse lançamento novamente, **Then** a exclusão é permitida normalmente.
3. **Given** um lançamento não tem nenhum pagamento conciliado, **When** o usuário o exclui, **Then** o comportamento atual (soft-delete livre) permanece inalterado.

---

### User Story 8 - Cadastro de formas de pagamento (CRUD) em Configurações (Priority: P1)

Como administrador do financeiro, em `/configuracoes/formas-pagamento` eu vejo as 15 formas de pagamento padrão da plataforma (Dinheiro, Cheque, Cartão de Crédito, Cartão de Débito, Boleto, Depósito, PagSeguro, Débito em Conta, Vale Alimentação, Vale Refeição, Vale Presente, Crédito em Loja, Faturamento, Pontos de Fidelidade, PIX) já cadastradas e não removíveis, e posso criar, editar e excluir formas de pagamento próprias da minha empresa — e esse cadastro é a única fonte usada pelos selects de forma de pagamento em todo o módulo financeiro.

**Why this priority**: É pré-requisito direto da User Story 3 (lançamentos consumindo o cadastro real); sem persistência real aqui, o select de lançamentos não pode parar de usar dados mockados.

**Independent Test**: Abrir `/configuracoes/formas-pagamento`, confirmar as 15 formas padrão presentes e não editáveis/excluíveis, criar uma forma nova, editá-la, excluí-la, e confirmar que cada mudança se reflete no select de `/financas/lancamentos/novo`.

**Acceptance Scenarios**:

1. **Given** o cadastro de formas de pagamento nunca foi alterado, **When** o usuário abre `/configuracoes/formas-pagamento`, **Then** vê as 15 formas padrão listadas.
2. **Given** o usuário tenta excluir ou editar uma forma padrão, **Then** o sistema impede a ação (formas padrão são protegidas).
3. **Given** o usuário cria uma forma de pagamento nova com nome único, **Then** ela passa a existir no cadastro e pode ser editada/excluída.
4. **Given** o usuário exclui uma forma de pagamento própria que está em uso em lançamentos existentes, **Then** o sistema impede a exclusão ou avisa claramente o motivo do bloqueio (ver Edge Cases).

---

### Edge Cases

- O que acontece se o usuário tentar excluir, em `/configuracoes/formas-pagamento`, uma forma de pagamento própria (não padrão) que já está referenciada em lançamentos existentes? O sistema deve bloquear a exclusão com mensagem explicando o motivo (padrão já usado em `financial-groups`/`cost-centers`/`chart-of-accounts` deste mesmo módulo).
- O que acontece se dois nomes de forma de pagamento (padrão e/ou customizada) colidirem (mesmo nome, variando acento/caixa)? O cadastro já bloqueia duplicidade nesse formato — manter esse comportamento também quando a forma de pagamento passar a ser fonte de verdade para lançamentos.
- O que acontece se o usuário tentar importar um extrato `.ofx` sem conta selecionada (auto-detecção não encontrou uma conta única para o código de banco do arquivo)? O sistema deve permitir a importação mesmo assim e sinalizar claramente, na lista de extratos importados, que aquele extrato está sem conta associada, para reconciliação manual posterior.
- O que acontece se o código de banco do arquivo `.ofx` não corresponder a nenhum código de banco do catálogo usado em `/financas/contas-bancarias` (ex.: banco fora da lista de 19)? A auto-detecção simplesmente não encontra correspondência e o campo permanece vazio, sem erro — mesmo comportamento de "zero contas correspondentes".
- O que acontece se o usuário selecionar um arquivo que não tem extensão `.ofx` no upload de extrato? O sistema deve rejeitar o arquivo com mensagem clara, sem enviar nada ao servidor.
- O que acontece com um lançamento antigo cuja forma de pagamento (do enum fixo anterior) não corresponde a nenhuma forma cadastrada em `/configuracoes/formas-pagamento` após a migração? O valor histórico deve continuar sendo exibido no lançamento existente (somente leitura daquele valor), mesmo que não seja mais uma opção válida para novos lançamentos.
- O que acontece se o usuário aplicar um filtro de período no Relatório de Resultados para o qual não há nenhum lançamento em uma das categorias do novo modelo? Essa categoria aparece com valor zero, não é omitida da árvore (a estrutura de categorias é sempre a mesma, independente do período).
- O que acontece se o usuário tentar excluir, em `/financas/lancamentos`, um lançamento que tem um pagamento com conciliação bancária ativa? O sistema bloqueia a exclusão e informa que é preciso desfazer a conciliação daquele pagamento primeiro (ver US10/FR-006e).
- O que acontece se o usuário selecionar a Bandeira em um pagamento cuja Forma de pagamento não é cartão (ex.: PIX, Dinheiro)? O campo continua disponível e opcional — o sistema não valida a combinação Forma de pagamento × Bandeira nesta fatia; a consistência fica a critério do usuário, igual ao comportamento atual do campo livre.

## Requirements *(mandatory)*

### Functional Requirements

**Extrato (`/financas/extratos`)**

- **FR-001**: O sistema MUST exibir, no resumo do topo da tela de extratos, exatamente os totais de Entradas, Saídas e Saldo do período.
- **FR-002**: O sistema MUST NOT exibir saldo por conta bancária no resumo do extrato.
- **FR-003**: A grade de extratos MUST exibir as colunas Competência, Vencimento, Categoria, Método de pagamento, Valor original, Valor final e Status, nessa ordem.

**Lançamentos (`/financas/lancamentos`)**

- **FR-004**: A grade de lançamentos MUST exibir as colunas Fornecedor/Cliente, Tipo, Categoria, Data de vencimento, Valor original, Valor final e Status, nessa ordem.
- **FR-005**: No formulário de novo lançamento (`/novo`), cada campo da linha de pagamento (Data, Forma de pagamento, Valor) MUST ter um label visível, alinhado com os demais.
- **FR-006**: O select de Forma de pagamento no formulário de lançamento MUST listar exclusivamente as formas de pagamento cadastradas em `/configuracoes/formas-pagamento` (padrão + próprias da empresa), consumindo uma entidade real e persistida no backend (nova tabela `PaymentMethod` + endpoints CRUD), fonte única compartilhada pelas duas telas — sem enum fixo nem store mock no frontend.
- **FR-006a**: Na seção Pagamentos do lançamento (criação e visualização/edição), o campo Bandeira MUST ter label visível ("Bandeira"), no mesmo padrão visual dos demais campos da linha (Data, Forma de pagamento, Valor).
- **FR-006b**: O campo Bandeira MUST ser um controle de seleção fechado (select), não um campo de texto livre nem `Autocomplete` com `freeSolo`.
- **FR-006c**: A lista de opções de Bandeira MUST usar o mesmo catálogo compartilhado já usado em Contratos de cartões e Pedidos de venda (`CARD_BRAND_OPTIONS`), ampliado para incluir, no mínimo, Visa, MasterCard, American Express, Sorocred, Elo, Hipercard, Credicard, Outros, Alelo, Ticket, VR Benefícios, Sodexo e Banricompras, sem remover nenhuma opção hoje válida em contratos/pedidos de venda já cadastrados (ex.: Diners Club, Discover).
- **FR-006d**: O campo Bandeira MUST continuar opcional — lançamentos cujo pagamento não é em cartão podem ser salvos sem bandeira selecionada.

- **FR-006e**: O sistema MUST impedir a exclusão (soft-delete) de um lançamento que tenha ao menos um pagamento com conciliação bancária ativa (vinculado a uma transação de extrato importado), informando ao usuário que é preciso desfazer a conciliação primeiro.
- **FR-006f**: Após todos os pagamentos de um lançamento terem a conciliação desfeita, a exclusão MUST voltar a ser permitida (comportamento atual, sem outras restrições novas).

**Conciliação bancária / importação de extrato (`/financas/conciliacao-bancaria`)**

- **FR-007**: O sistema MUST permitir concluir a importação de um extrato bancário sem exigir a seleção prévia de uma conta bancária — o campo Conta bancária permanece visível no diálogo, porém deixa de ser obrigatório.
- **FR-007a**: Ao ler o arquivo `.ofx` selecionado, o sistema MUST identificar o código do banco (`BANKACCTFROM.BANKID`) e, se exatamente uma conta bancária ativa da organização tiver esse mesmo código de banco, MUST pré-selecionar essa conta automaticamente no campo Conta bancária (o usuário pode trocar antes de confirmar).
- **FR-007b**: Se nenhuma conta bancária corresponder ao código do banco do arquivo, ou se houver mais de uma conta com o mesmo código de banco, o sistema MUST deixar o campo Conta bancária vazio (sem pré-seleção) e MUST permitir prosseguir com a importação mesmo assim.
- **FR-008**: O campo de arquivo do extrato MUST ser um seletor de upload restrito à extensão `.ofx`, nunca um campo de texto livre.
- **FR-009**: O sistema MUST validar a extensão do arquivo selecionado e rejeitar arquivos que não sejam `.ofx`, com mensagem de erro clara, antes de qualquer envio ao servidor.

**Relatório de Resultados (`/financas/relatorios-de-resultados`)**

- **FR-010**: A árvore de categorias do relatório MUST seguir esta estrutura e ordem: Receitas Operacionais (+) [Faturamento com serviços; Faturamento com serviços/venda de produtos; Faturamento com venda de produtos], Deduções da Receita (+), Custos Operacionais (-), Despesas Operacionais (-), Despesas Financeiras (-), Outras Receitas (+), Outras Despesas (-), Descontos/Taxas (-), Juros/Multa (-) [Juros/Multa de Receitas; Juros/Multa de Despesas].
- **FR-011**: O relatório MUST exibir, ao final, o total consolidado de Resultado Operacional.
- **FR-012**: O layout geral da tela (filtros, navegação por período, apresentação visual) MUST permanecer o mesmo já existente — a mudança se restringe à estrutura das categorias.

**Contratos de cartões e outros (`/financas/contratos-de-cartoes-e-outros/novo`)**

- **FR-013**: O campo Provedor MUST ser um controle de seleção fechado (select/autocomplete), não um campo de texto livre.
- **FR-014**: A lista de opções de Provedor MUST conter exatamente os provedores fornecidos (Elavon, Conductor, Bin, RV, Firstdata Corban, Fillip, Libercard, Cielo, Rede, Credsystem, Infocards, Nddcargo, Global, Vero, Stone, Mercado Pago, Accentiv, Alelo, Aspeb, A Vista); incluir um provedor novo é uma alteração de código nesta lista, não um cadastro em tela.
- **FR-015**: A lista de opções de Provedor MUST ser uma lista fechada mantida no frontend (constante estática com as ~20 opções fornecidas), sem criar endpoint novo no backend nesta fatia — o volume é pequeno e estável o suficiente para não justificar uma entidade dedicada agora.

**Contas bancárias (`/financas/contas-bancarias`)**

- **FR-016**: O select de Banco no cadastro/edição de conta bancária MUST oferecer a lista completa de 19 bancos especificada (código + nome), substituindo a lista incompleta atual.
- **FR-017**: O código do banco escolhido MUST ser persistido e resolvido de volta ao nome correto ao reabrir a conta para edição.

**Formas de pagamento (`/configuracoes/formas-pagamento`)**

- **FR-018**: O sistema MUST manter cadastradas as 15 formas de pagamento padrão da plataforma: Dinheiro, Cheque, Cartão de Crédito, Cartão de Débito, Boleto, Depósito, PagSeguro, Débito em Conta, Vale Alimentação, Vale Refeição, Vale Presente, Crédito em Loja, Faturamento, Pontos de Fidelidade, PIX.
- **FR-019**: O sistema MUST impedir a edição e a exclusão das formas de pagamento padrão.
- **FR-020**: O sistema MUST permitir que a empresa crie, edite e exclua formas de pagamento próprias, adicionais às padrão.
- **FR-021**: O sistema MUST impedir a exclusão de uma forma de pagamento própria que esteja em uso em algum lançamento existente, informando o motivo do bloqueio.
- **FR-022**: O cadastro de formas de pagamento (padrão + próprias) MUST ser a única origem de dados para qualquer select de forma de pagamento no módulo financeiro, eliminando qualquer lista fixa/mockada equivalente hoje existente no frontend.

### Key Entities *(include if feature involves data)*

- **Forma de pagamento**: representa um meio de pagamento utilizável em lançamentos financeiros. Atributos: nome, se é padrão da plataforma (não editável/excluível) ou própria da empresa, código fiscal associado (quando aplicável, já existente no cadastro atual), status de uso (para bloquear exclusão indevida). Relaciona-se com Lançamento financeiro (referenciada pelo pagamento de um lançamento).
- **Provedor (contrato de cartão)**: representa a adquirente/subadquirente de um contrato de cartão. Atributos: nome. Relaciona-se com Contrato de cartão (um contrato referencia um provedor).
- **Banco**: catálogo de referência de instituições bancárias disponíveis para conta bancária. Atributos: código, nome. Relaciona-se com Conta bancária (uma conta referencia um banco pelo código).
- **Extrato bancário importado**: representa o resultado de uma importação de arquivo `.ofx`. Atributos: arquivo de origem, código de banco extraído do arquivo, conta bancária associada (preenchida automaticamente quando há correspondência única por código de banco, escolhida manualmente ou deixada em aberto para reconciliação posterior nos demais casos, ver Edge Cases), transações importadas.
- **Bandeira (pagamento do lançamento)**: catálogo fechado de bandeiras de cartão e meios afins, compartilhado entre Contratos de cartões, Pedidos de venda e Pagamentos de lançamento (`CARD_BRAND_OPTIONS`). Atributos: valor/rótulo. Relaciona-se com Pagamento de lançamento financeiro (campo opcional).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário do financeiro consegue identificar o Saldo do período em `/financas/extratos` em até 5 segundos após abrir a tela, sem precisar somar valores manualmente.
- **SC-002**: 100% dos lançamentos criados após esta mudança usam uma forma de pagamento existente no cadastro de `/configuracoes/formas-pagamento` (zero lançamentos novos com forma de pagamento fora do cadastro).
- **SC-003**: O tempo para cadastrar uma nova forma de pagamento e vê-la disponível em um novo lançamento cai para menos de 1 minuto (sem precisar de deploy ou intervenção técnica).
- **SC-004**: 100% dos 19 bancos especificados e das 20 opções de provedor especificadas estão disponíveis para seleção nos respectivos formulários, sem necessidade de digitação livre.
- **SC-005**: A estrutura de categorias do Relatório de Resultados corresponde, em 100% dos grupos e subgrupos, ao modelo especificado, validável por comparação visual direta com a lista fornecida.
- **SC-006**: Usuários conseguem concluir a importação de um extrato bancário sem serem bloqueados pela ausência de seleção de conta em nenhum caso de uso testado.
- **SC-007**: 100% das tentativas de excluir um lançamento com pagamento conciliado ativo são bloqueadas com mensagem explicativa; 0% de lançamentos conciliados excluídos sem antes desfazer a conciliação.
- **SC-008**: O campo Bandeira em `/financas/lancamentos` aceita exclusivamente valores do catálogo fechado compartilhado — zero registros novos com bandeira fora da lista.

## Assumptions

- "Não exibir saldo por conta" (Extrato) significa apenas remover esse dado do resumo desta tela — o saldo por conta continua disponível normalmente na tela de Contas bancárias.
- A ordem das colunas listadas pelo usuário para Extrato e Lançamentos é a ordem final desejada na grade (da esquerda para a direita), incluindo a coluna de ações/detalhe que já existe hoje como adicional (não removida, apenas não mencionada explicitamente pelo usuário).
- "Fornecedor/Cliente" na grade de Lançamentos é uma única coluna que mostra o nome da contraparte (fornecedor quando o lançamento é a pagar, cliente quando é a receber), reaproveitando o combobox combinado que o formulário de lançamento já usa.
- O upload de arquivo `.ofx` mantém o limite de tamanho já vigente hoje na tela de conciliação bancária (10MB) e a mensagem de "reimportar não duplica transações", pois o pedido do usuário não menciona mudança nesses dois comportamentos.
- As 20 opções de Provedor fornecidas pelo usuário formam a lista fechada final desta fatia (ver Clarifications); adicionar um provedor novo no futuro é uma alteração de código na constante do frontend, não requer uma tela de cadastro nem uma API nova.
- Os 19 bancos especificados substituem integralmente a lista atual (nenhum banco da lista antiga que não está entre os 19 novos precisa ser preservado), exceto quando uma conta já cadastrada usa um código fora da nova lista — nesse caso o valor histórico permanece exibível na edição daquela conta específica.
- "Resultado Operacional" ao final do relatório é a soma de todos os grupos com seus sinais (+/-) aplicados, seguindo a mesma lógica de cálculo que a DRE atual já usa para o total geral, sem introduzir uma fórmula nova.
- Pagamentos antigos cujo valor de Bandeira (texto livre) não corresponde a nenhuma opção do catálogo fechado `CARD_BRAND_OPTIONS` continuam exibindo o valor histórico normalmente na visualização/edição daquele pagamento (mesmo tratamento dado a formas de pagamento fora do cadastro, ver Edge Cases de US8) — não é opção válida para novos pagamentos, mas não é apagado nem bloqueia a edição do restante do lançamento.
- "Conciliação bancária ativa" (US10/FR-006e) significa que o pagamento do lançamento está vinculado a uma transação de extrato importado através do fluxo de conciliação de `/financas/conciliacao-bancaria` — a mesma noção de vínculo que a tela de conciliação já usa para marcar uma transação como conciliada, sem introduzir um novo status.

