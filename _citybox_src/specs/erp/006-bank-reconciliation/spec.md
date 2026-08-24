# Feature Specification: Conciliação bancária — importação de OFX e casamento com lançamentos

**Feature Branch**: `006-bank-reconciliation`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "Conciliação bancária: importar extrato OFX associado a uma conta bancária, extrair as transações e permitir ao operador conciliar (casar automaticamente por sugestão, buscar manualmente, somar N lançamentos, ou criar um lançamento novo) cada transação com o lançamento equivalente do ERP, excluir transações da conciliação, desfazer conciliações e baixar o arquivo original."

## Clarifications

### Session 2026-08-06

- Q: Quando há mais de um lançamento do ERP com valor exatamente igual e dentro da janela de
  datas para a mesma transação do extrato, o sistema deve mostrar 1 sugestão automática (a mais
  próxima por data) ou uma lista de candidatos para o operador escolher? → A: Lista de candidatos
  ordenados por confiança — o operador escolhe qual conciliar.
- Q: Um lançamento já conciliado (vinculado) a uma transação pode ser sugerido, encontrado na
  busca manual, ou usado na soma de N lançamentos para conciliar outra transação diferente? →
  A: Não — fica excluído de sugestões, busca manual e soma até sua conciliação ser desfeita.
- Q: A movimentação bancária gerada ao conciliar (FR-029) deve usar como data a data da transação
  do extrato (postedAt) ou a data em que o operador confirmou a conciliação? → A: Data da
  transação do extrato (postedAt) — mantém o saldo histórico da conta fiel à cronologia bancária
  real.

### Session 2026-08-10

- Q: Quando o operador seleciona manualmente (busca manual, FR-016) um único lançamento com valor
  diferente do valor da transação, o sistema deve permitir a conciliação mesmo assim (com alerta)
  ou bloquear exigindo valor exato? → A: Bloquear — a busca manual segue a mesma regra de valor
  exato aplicada à soma de N lançamentos (FR-017); o sistema recusa a ação e sinaliza ao operador
  a diferença de valor (excedente ou faltante) encontrada, sem vincular nada.
- Q: O botão de excluir uma transação deve funcionar apenas em transações pendentes, ou também em
  transações já conciliadas (desfazendo a conciliação automaticamente antes de excluir)? → A:
  Apenas pendentes — para excluir uma transação conciliada, o operador precisa primeiro usar
  "Desfazer" (FR-020); não há desfazer implícito escondido dentro da ação de excluir.
- Q: A busca manual (drawer "Buscar Registros", FR-016) deve passar a permitir selecionar vários
  lançamentos ao mesmo tempo e conciliar a soma deles (User Story 4/FR-017), unificando os dois
  fluxos num único drawer com seleção múltipla? → A: Sim — busca manual e soma de N lançamentos
  passam a viver no mesmo drawer; a seleção é múltipla (checkbox por linha), e a confirmação usa a
  mesma validação de valor já especificada (exato para 1 selecionado, soma exata para N).
- Q: No formulário "Novo Registro" (FR-018), a conta bancária, taxas/despesas e multas/juros
  aparecem como campos do formulário — isso quebra a regra de valor/data travados na transação
  (FR-018/FR-021)? → A: A conta bancária passa a ser um campo editável (pré-selecionada com a conta
  do extrato, mas o operador pode trocar, já que nem sempre o arquivo OFX identifica a conta com
  certeza). Valor, taxas/despesas, multas/juros e as datas continuam travados nos valores derivados
  da transação — taxas/despesas e multas/juros sempre zero, e o total sempre igual ao valor da
  transação; esses campos aparecem no formulário só por paridade visual com o formulário completo
  de lançamento, não são editáveis.
- Q: O filtro de período acima da lista de transações pendentes — que data ele filtra, já que a
  transação do extrato não tem "vencimento" (só a data em que o banco processou)? → A: Filtra pela
  data em que o banco processou a transação (postedAt); o rótulo no sistema é "Período", nunca
  "vencimento", para não confundir com o vencimento de um lançamento financeiro.
- Q: O filtro de conta bancária dentro do drawer "Buscar Registros" permite buscar lançamentos de
  outras contas além da conta do extrato? → A: Não — a busca continua restrita à conta bancária do
  extrato (mesma regra de elegibilidade de FR-016); o filtro aparece pré-selecionado e travado
  nessa conta, sem opção de trocar. **[SUPERADA pela sessão 2026-08-14 — o filtro de conta passou a
  ser editável; ver FR-037.]**
- Q: A busca manual/soma (FR-016/FR-017) hoje filtra os resultados apenas por lançamentos com
  status `pending` — isso está correto, dado que um lançamento pode já estar pago por outro meio e
  ainda assim precisar ser conciliado com esta transação bancária? → A: Não — a busca MUST
  retornar lançamentos da conta em qualquer status (`pending` ou `paid`), restringindo apenas pela
  exclusão já especificada em FR-033 (lançamento vinculado a uma conciliação ativa não aparece);
  status do lançamento deixa de ser um critério de elegibilidade.
- Q: A comparação com o layout de referência (CPLUG) mostrou divergências relevantes de estrutura
  na lista de Pendentes — cada transação deve virar um card com botões reais (não links de texto),
  mantendo os tokens de tema do app? → A: Sim — cada transação pendente é renderizada como um card
  (componentes `@citybox/mui`) com botões reais para Conciliar/Novo Registro/Buscar registro/
  Excluir e a caixa de "nenhum registro encontrado"/sugestão embutida no próprio card; sem checkbox
  de seleção em lote na lista principal (a seleção múltipla continua restrita ao drawer "Buscar
  Registros", FR-036).
- Q: O drawer "Buscar Registros" deve implementar o conjunto completo de filtros do layout de
  referência (Períodos, tipo de data, Categoria, Fornecedor, Conta travada, Método de pagamento,
  Bandeira) e trocar a lista simples por uma tabela de resultados? → A: Sim — filtros completos e
  resultados em tabela, mantendo a seleção múltipla e a conta travada na conta do extrato (FR-037).
  **[Parcialmente SUPERADA pela sessão 2026-08-14 — filtros completos e tabela seguem válidos, mas a
  conta deixou de ser travada; ver FR-037.]**
- Q: O formulário "Novo Registro" deve ser reestruturado nas seções do layout de referência
  (Transação Financeira / Dados de pagamento / Classificação), incluindo suporte a rateio múltiplo
  (várias linhas de categoria/centro de custo com porcentagem)? → A: Reestruturar nas seções do
  layout, mas sem rateio múltiplo — os campos travados (valor, taxas/despesas, multas/juros, datas)
  aparecem como somente leitura dentro dessas seções; rateio múltiplo fica fora de escopo, pois
  `create-entry-from-transaction` hoje só aceita uma alocação de categoria/centro de custo.
- Q: Além da sugestão embutida em cada card de transação pendente, o layout de referência mostra um
  painel consolidado "Registros sugeridos" no rodapé da lista — esse painel também deve ser
  implementado? → A: Sim — um painel colapsável "Registros sugeridos" no rodapé da aba Pendentes,
  listando todas as sugestões automáticas da página com ação rápida "Adicionar" (equivalente a
  Conciliar), além da sugestão já embutida em cada card.

### Session 2026-08-14

- Q: A divergência de valor hoje é sinalizada no drawer, no momento em que o operador escolhe o
  lançamento (FR-016). Mover essa exibição para o cartão da transação muda também a regra de
  bloqueio? → A: Não — apenas move a exibição. O cartão da transação passa a ser a única superfície
  que sinaliza a divergência (excedente/faltante); o drawer deixa de exibir o alerta no momento da
  escolha. Conciliar com valor diferente continua REJEITADO (FR-016/FR-017 inalteradas quanto ao
  bloqueio).
- Q: Qual regra da busca de lançamentos deve mudar? → A: Destravar o filtro de conta bancária — a
  FR-037 é revogada. O filtro de conta no drawer "Buscar Registros" deixa de vir travado na conta do
  extrato e passa a ser editável entre as contas da organização. Motivo: quando o arquivo OFX não
  resolve a conta bancária, a busca ficava inteiramente bloqueada; é o mesmo motivo que já tornou a
  conta editável no formulário "Novo Registro" (decisão de 2026-08-10).
- Q: Qual botão muda de ordem no cartão da transação pendente (FR-039)? → A: "Conciliar" passa a
  ocupar a 1ª posição da linha de ações (Conciliar → Novo Registro → Buscar registro → Excluir).
  Hoje ele não está na linha de ações — vive apenas dentro do bloco de sugestão, abaixo do cartão.
  Fica habilitado somente quando existe ao menos uma sugestão automática para a transação.
- Q: De onde o formulário "Novo Registro" deve abrir, já que hoje é um diálogo centralizado? → A:
  Painel lateral (drawer) ancorado à direita, igual ao drawer "Buscar Registros" — as duas
  superfícies da mesma tela passam a entrar pelo mesmo lado.
- Q: Com a conta destravada na busca (FR-037 revogada), o operador pode conciliar uma transação do
  extrato da Conta A com um lançamento cadastrado na Conta B. Em qual conta entra a movimentação
  bancária (FR-029/FR-034)? → A: Sempre na conta bancária do extrato — é ela que o banco de fato
  movimentou, e o extrato é o fato. Quando o lançamento apontava para outra conta, a conciliação
  corrige o vínculo do lançamento para a conta do extrato.
- Q: Desde a 007, um extrato pode ser importado sem conta bancária resolvida (`bankAccountId` nulo).
  Nesse caso não existe "conta do extrato" para receber a movimentação (FR-029) — o que acontece ao
  conciliar? → A: A conciliação MUST exigir que o extrato tenha conta definida. A busca manual
  continua liberada sem conta (para o operador investigar), mas conciliar fica bloqueado até que a
  conta do extrato seja definida; o sistema MUST oferecer uma ação para definir/corrigir a conta de
  um extrato já importado.
- Q: Com o alerta de divergência saindo do drawer, o rodapé de soma ao vivo ("Diferença: R$ X")
  também some? → A: Não — o rodapé permanece como **total neutro** (Selecionado / Transação /
  Diferença), sem cor ou texto de erro. É feedback mecânico necessário para montar uma soma exata de
  N lançamentos (FR-017); o que sai do drawer é o alerta de divergência e a mensagem de recusa, que
  passam a viver no cartão (FR-031/FR-039).
- Q: Teste em produção mostrou que a busca manual fica inteiramente bloqueada porque o extrato não
  resolve a conta bancária. Investigação: o cadastro `BankAccount` guarda apenas `bankCode` (sem
  agência nem número de conta), enquanto o OFX traz agência e conta — **não existe chave confiável**
  entre os dois, e o único campo comum (`bankCode`) falha na prática. Quem informa qual conta
  cadastrada o extrato representa? → A: O **operador, na importação**. A conta bancária volta a ser
  obrigatória ao importar o `.ofx` (revertendo a opcionalidade introduzida pela
  `007-financeiro-ajustes-ui` FR-007) — quem baixou o arquivo sabe de qual conta ele veio. O
  `bankCode` do arquivo passa a servir apenas como pré-seleção sugerida, nunca como requisito de
  casamento. Sem campo novo no cadastro e sem heurística de matching.
- Q: O campo "Cliente ou fornecedor" não lista os clientes de `/clientes`. Investigação: a tela de
  lançamentos filtra por `tab=active` (estágio de CRM "Cliente ativo"), mas **não existe nenhum
  controle na interface para editar o estágio** — todo cliente nasce `lead` e fica preso nele, exceto
  os criados pelo diálogo rápido de dentro de um lançamento, que nascem `active`. O estágio deve
  continuar filtrando esse campo? → A: Não. O campo MUST listar todos os clientes não excluídos de
  `/clientes` (qualquer estágio) mais os fornecedores. Estágio de CRM descreve funil de vendas, não
  autorização para receber ou pagar.
- Q: O ramo `paid` (decisão de 2026-08-11) não gera movimentação bancária, sob a premissa de que a
  conta do lançamento era a do extrato. Com a conta destravada, conciliar um lançamento `paid` da
  conta B com o extrato da conta A não moveria saldo nenhum. O que o sistema faz? → A: Bloquear —
  conciliar um lançamento já `paid` MUST exigir que a conta dele seja a mesma do extrato. Ele
  continua aparecendo na busca (o operador precisa investigar), mas a confirmação é recusada quando
  as contas diferem. A troca de conta de FR-029 aplica-se apenas a lançamentos `pending`, que são os
  que geram movimentação nova.
- Q: A sugestão automática (FR-014) continua restrita à conta do extrato enquanto a busca manual
  deixou de ser (FR-037) — a assimetria é intencional? → A: Sim, intencional. Sugerir é o sistema
  afirmando que dois registros casam; buscar é o operador investigando. Cruzar contas na sugestão
  automática produziria falsos positivos (mesmo valor e data em contas diferentes é comum) e, pela
  decisão anterior, um candidato `paid` de outra conta nem seria conciliável.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Importar um extrato bancário e ver suas transações (Priority: P1)

Um operador financeiro baixa o extrato OFX do internet banking, abre a tela de Conciliação
bancária, escolhe a conta bancária de destino e importa o arquivo. O sistema extrai cada
transação do extrato (data, valor, tipo débito/crédito, descrição) e as apresenta como pendentes
de conciliação.

**Why this priority**: Sem a importação não existe conciliação — é a porta de entrada de todo o
módulo, e sozinha já entrega valor: o operador enxerga, pela primeira vez, o extrato bancário real
dentro do ERP.

**Independent Test**: Importar um arquivo `.ofx` real associado a uma conta bancária; a tela deve
listar o extrato com instituição, conta, período e todas as transações extraídas como pendentes,
sobrevivendo a um refresh da página.

**Acceptance Scenarios**:

1. **Given** uma conta bancária existente e um arquivo `.ofx` válido, **When** o operador importa o
   arquivo associando-o a essa conta, **Then** um novo extrato aparece na lista com instituição,
   conta, período coberto e todas as transações do arquivo como pendentes.
2. **Given** um arquivo que não é um OFX válido (extensão errada ou conteúdo ilegível), **When** o
   operador tenta importá-lo, **Then** o sistema recusa a importação com uma mensagem clara,
   sem quebrar a tela e sem gravar nada.
2b. **Given** um arquivo `.ofx` válido cujo código de banco não corresponde a nenhuma conta
   cadastrada, **When** o operador o seleciona para importar, **Then** o campo de conta bancária
   aparece vazio e obrigatório (sem pré-seleção), a importação só é aceita depois que ele escolher
   uma conta, e o extrato resultante nunca fica sem conta (FR-001).
3. **Given** um extrato já importado anteriormente para uma conta, **When** o operador importa o
   mesmo arquivo novamente, **Then** nenhuma transação é duplicada e o sistema informa quantas
   transações foram ignoradas por já existirem.
4. **Given** um arquivo OFX acentuado (nomes com "ç", "ã" etc.), **When** o operador o importa,
   **Then** as descrições das transações aparecem com os acentos corretos, sem corrupção de texto.

---

### User Story 2 - Conciliar uma transação por sugestão automática (Priority: P1)

Ao abrir um extrato importado, o operador vê, ao lado de cada transação pendente, os lançamentos
candidatos do ERP quando o sistema encontra um ou mais compatíveis (mesma conta, mesmo sinal,
valor e data compatíveis), ordenados por confiança. Um clique em "Conciliar" no candidato
escolhido confirma o casamento — quando há apenas um candidato, isso equivale a confirmar a
sugestão única.

**Why this priority**: É o caminho feliz do módulo — a maior parte das transações de um extrato
comum (recebimentos e pagamentos já lançados) deve casar automaticamente; sem isso, o operador
teria que conciliar tudo manualmente, e o módulo não economizaria tempo nenhum.

**Independent Test**: Ter um lançamento na conta com o mesmo valor e data próxima de uma transação
pendente do extrato; abrir o extrato e verificar que a sugestão aparece ao lado da transação; um
clique em Conciliar move a transação para a aba Conciliadas e atualiza os contadores do extrato.

**Acceptance Scenarios**:

1. **Given** uma transação pendente do extrato e um lançamento da mesma conta com valor idêntico e
   data próxima, **When** o operador abre a aba Pendentes, **Then** a sugestão desse lançamento
   aparece ao lado da transação.
2. **Given** uma sugestão exibida ao lado de uma transação pendente, **When** o operador clica em
   Conciliar, **Then** a transação passa para a aba Conciliadas, o lançamento não é alterado (só
   vinculado), e os contadores do extrato são recalculados.
3. **Given** um extrato cujas transações foram todas conciliadas, **When** o operador consulta o
   status do extrato, **Then** ele aparece como "conciliado"; enquanto restar ao menos uma
   pendente e ao menos uma conciliada, o status é "parcialmente conciliado".
4. **Given** uma transação de entrada (crédito) e uma de saída (débito), **When** o operador
   visualiza a aba Pendentes, **Then** a entrada aparece em verde e a saída em vermelho, cada uma
   com sua indicação de débito/crédito.
5. **Given** dois lançamentos da mesma conta com valor idêntico ao da transação e ambos dentro da
   janela de datas, **When** o operador abre a aba Pendentes, **Then** os dois aparecem como
   candidatos ordenados por confiança, e o operador escolhe qual deles conciliar.
6. **Given** um candidato já vinculado a outra transação por uma conciliação ainda não desfeita,
   **When** o sistema calcula os candidatos para uma transação diferente, **Then** esse candidato
   não aparece entre as sugestões.

---

### User Story 3 - Conciliar quando não há sugestão automática (Priority: P2)

Quando o sistema não encontra um candidato óbvio (ex.: diferença de poucos centavos, descrição
muito diferente), o operador busca manualmente o lançamento correspondente entre os lançamentos da
conta e concilia a transação com o resultado encontrado.

**Why this priority**: A sugestão automática cobre o caso comum, mas a transcrição de origem é
explícita que ela falha em casos de pequena divergência — sem uma saída manual, essas transações
ficariam permanentemente pendentes.

**Independent Test**: Ter uma transação pendente sem sugestão (por diferença de centavos, por
exemplo); usar a busca manual, selecionar um lançamento e confirmar a conciliação; a transação
deve ir para Conciliadas.

**Acceptance Scenarios**:

1. **Given** uma transação pendente sem sugestão automática, **When** o operador abre a busca
   manual e encontra o lançamento correspondente com valor exatamente igual ao da transação,
   **Then** ele consegue conciliar os dois com uma ação explícita.
2. **Given** uma conciliação feita manualmente, **When** o operador confirma, **Then** o resultado
   é idêntico ao de uma conciliação por sugestão automática (transação vai para Conciliadas,
   contadores recalculados).
3. **Given** uma transação pendente e um lançamento encontrado na busca manual cujo valor é
   diferente (excedente ou faltante) do valor da transação, **When** o operador tenta conciliar,
   **Then** o sistema rejeita a ação, nada é vinculado, e a diferença de valor encontrada é exibida
   no cartão da transação — não como alerta dentro do drawer no momento da escolha.
4. **Given** um extrato cuja conta bancária não foi resolvida a partir do arquivo OFX, **When** o
   operador abre a busca manual, **Then** o drawer abre utilizável, com o filtro de conta vazio e
   editável entre as contas da organização, em vez de a ação ficar bloqueada.
5. **Given** um lançamento **`pending`** cadastrado numa conta bancária diferente da conta do
   extrato e com valor exatamente igual ao da transação, **When** o operador o seleciona na busca
   manual e concilia, **Then** a movimentação bancária é gerada na conta do extrato e o lançamento
   passa a apontar para essa conta; ao desfazer a conciliação, o lançamento volta à conta original.
6. **Given** um lançamento **`paid`** cadastrado numa conta bancária diferente da conta do extrato,
   **When** o operador o encontra na busca manual e tenta conciliar, **Then** o lançamento aparece
   normalmente nos resultados, mas a conciliação é recusada com a indicação de que a conta do
   lançamento difere da conta do extrato, e nada é vinculado (FR-043).

---

### User Story 4 - Casar um repasse agrupado com vários lançamentos (Priority: P2)

Quando uma única transação do extrato representa o repasse de várias vendas (repasse agrupado da
adquirente), o operador seleciona os N lançamentos cuja soma bate com o valor da transação e
concilia todos de uma vez.

**Why this priority**: É um cenário citado explicitamente como frequente (repasses agrupados de
adquirente) — sem essa capacidade, todo repasse agrupado ficaria permanentemente sem conciliação
possível.

**Independent Test**: Ter uma transação de R$ 300 no extrato e três lançamentos de R$ 100 na
mesma conta; selecionar os três e conciliar; a transação deve ir para Conciliadas vinculada aos
três lançamentos. Selecionar lançamentos cuja soma não feche o valor deve ser rejeitado com uma
mensagem clara.

**Acceptance Scenarios**:

1. **Given** uma transação do extrato e N lançamentos cuja soma é exatamente igual ao valor dela,
   **When** o operador seleciona os N lançamentos e confirma, **Then** a transação é conciliada
   com todos eles e vai para Conciliadas.
2. **Given** uma seleção de lançamentos cuja soma não iguala o valor da transação, **When** o
   operador tenta confirmar, **Then** o sistema rejeita a ação e explica que a soma não fecha.

---

### User Story 5 - Criar o lançamento direto da tela de conciliação (Priority: P2)

Quando uma transação do extrato não tem nenhum lançamento correspondente no ERP (ex.: uma despesa
que ninguém digitou), o operador cria o lançamento ali mesmo, com os dados já pré-preenchidos a
partir da transação, e ele nasce conciliado.

**Why this priority**: É um dos dois problemas centrais que o módulo resolve (achar lançamentos
que ninguém registrou); obrigar o operador a sair da tela e ir até Lançamentos quebraria o fluxo e
reduziria a adoção.

**Independent Test**: Ter uma transação pendente sem nenhum lançamento correspondente; usar
"Criar lançamento", conferir que data, valor, sinal e descrição vêm pré-preenchidos; salvar deve
criar o lançamento e conciliar a transação na mesma ação.

**Acceptance Scenarios**:

1. **Given** uma transação pendente sem lançamento correspondente, **When** o operador escolhe
   criar um lançamento a partir dela, **Then** o formulário abre com data, valor, sinal
   (entrada/saída), taxas/despesas, multas/juros e descrição pré-preenchidos a partir da transação
   — taxas/despesas e multas/juros sempre zero, o total sempre igual ao valor da transação — e a
   conta bancária pré-selecionada com a conta do extrato.
2. **Given** esse formulário preenchido, **When** o operador salva, **Then** um novo lançamento é
   criado no ERP e a transação do extrato é conciliada com ele automaticamente, sem passo extra.
3. **Given** o formulário aberto, **When** o operador troca a conta bancária pré-selecionada por
   outra conta da organização, **Then** o lançamento nasce vinculado à conta escolhida, sem afetar
   o valor/data/sinal travados nem a conciliação com a transação do extrato de origem.

---

### User Story 6 - Excluir uma transação e desfazer uma conciliação (Priority: P3)

O operador exclui da conciliação uma transação que não faz sentido tratar (ex.: tarifa isenta que
não será lançada), e pode desfazer uma conciliação feita por engano, devolvendo a transação para
pendente.

**Why this priority**: Erro de casamento é comum (citado explicitamente na origem da demanda);
sem reversibilidade, um erro de conciliação corromperia a leitura financeira do lojista sem
possibilidade de correção pela própria tela.

**Independent Test**: Excluir uma transação pendente e verificar que ela aparece na aba Excluídas
(não desaparece); conciliar uma transação e depois desfazer, verificando que ela volta para
Pendentes e o vínculo é removido, sem alterar o lançamento em si.

**Acceptance Scenarios**:

1. **Given** uma transação pendente, **When** o operador a exclui, **Then** ela desaparece de
   Pendentes e passa a aparecer em Excluídas, sem ser apagada do sistema.
2. **Given** uma transação conciliada, **When** o operador desfaz a conciliação, **Then** ela volta
   para Pendentes, o vínculo com o(s) lançamento(s) é removido, e o(s) lançamento(s) em si não são
   alterados.

---

### User Story 7 - Consultar, filtrar e baixar um extrato importado (Priority: P3)

O operador lista todos os extratos já importados (com status e contadores), filtra e busca
transações dentro de um extrato por status, e baixa o arquivo OFX original de qualquer extrato já
importado.

**Why this priority**: É o polimento operacional do módulo — histórico, auditoria e capacidade de
recuperar o arquivo original — necessário para uso contínuo, mas não bloqueia o valor central de
conciliar.

**Independent Test**: Importar dois extratos para contas diferentes; a lista deve mostrar ambos
com status e contadores corretos; dentro de um extrato, filtrar por status deve restringir a lista
de transações; baixar o extrato deve devolver o arquivo `.ofx` original, byte a byte.

**Acceptance Scenarios**:

1. **Given** vários extratos importados, **When** o operador abre a lista, **Then** cada um mostra
   instituição, conta, período, status de conciliação e contadores de pendentes/conciliadas/
   excluídas.
2. **Given** um extrato aberto, **When** o operador busca ou filtra por status dentro dele,
   **Then** apenas as transações que atendem ao filtro aparecem.
3. **Given** um extrato importado, **When** o operador escolhe baixar o arquivo, **Then** recebe o
   mesmo arquivo `.ofx` que foi importado originalmente.

---

### Edge Cases

- Arquivo com extensão `.ofx` mas conteúdo corrompido ou ilegível: importação recusada com
  mensagem clara, nada é gravado.
- Arquivo muito grande (ex.: extrato anual): importação recusada acima de um limite de tamanho,
  com mensagem explicando o limite.
- Reimportação do mesmo arquivo: nenhuma transação duplicada; o resumo informa quantas foram
  ignoradas por já existirem.
- Transação cujo identificador único do extrato (FITID) vem vazio ou é instável entre reimportações
  do mesmo banco: o sistema ainda precisa evitar duplicação, usando um critério alternativo.
- Extrato em codificação Latin-1/ISO-8859-1 com acentuação: os textos importados não podem ficar
  corrompidos.
- Soma de lançamentos selecionados não fecha o valor da transação: ação de conciliar por soma é
  rejeitada, nada é vinculado.
- Lançamento selecionado na busca manual com valor diferente (excedente ou faltante) do valor da
  transação: ação de conciliar é rejeitada, com o sistema indicando a diferença encontrada no cartão
  da transação (FR-031/FR-039), da mesma forma que a soma de N lançamentos que não fecha (FR-017).
- Extrato **legado** sem conta bancária resolvida (importado antes de FR-001 voltar a exigir a
  conta): a busca manual continua disponível, com o filtro de conta vazio e editável (FR-037); a
  sugestão automática (FR-014) e a conciliação (FR-042) ficam indisponíveis até o operador definir a
  conta do extrato.
- Código do banco do arquivo OFX não corresponde a nenhuma conta cadastrada (ex.: arquivo diz
  "Banco 1" e a organização só tem Banco do Brasil): a importação **não** é recusada nem bloqueada —
  o campo de conta apenas não vem pré-selecionado, e o operador escolhe manualmente (FR-001).
- Organização sem nenhuma conta bancária cadastrada tenta importar um extrato: a importação é
  recusada, orientando o operador a cadastrar a conta primeiro (consequência de FR-001 ser
  obrigatório).
- Cliente cadastrado em `/clientes` em estágio `lead` (o padrão de todo cadastro novo): MUST aparecer
  normalmente no campo Cliente ou fornecedor de lançamentos e do "Novo Registro" (FR-044) — o estágio
  não restringe a seleção.
- Operador tenta conciliar uma transação de um extrato sem conta bancária definida: ação bloqueada
  com mensagem explicando que a conta do extrato precisa ser definida primeiro (FR-042); nada é
  vinculado e nenhuma movimentação é gerada.
- Lançamento **`pending`** de outra conta bancária conciliado com a transação: a movimentação entra
  na conta do extrato e a conta do lançamento é corrigida para ela (FR-029); desfazer restaura a
  conta original (FR-030).
- Lançamento **`paid`** de outra conta bancária selecionado na busca: aparece nos resultados, mas
  conciliar é recusado com mensagem indicando a diferença de conta (FR-043) — conciliá-lo não geraria
  movimentação e deixaria o saldo da conta do extrato sem refletir a transação.
- Soma de N lançamentos (FR-017) misturando um `pending` de outra conta e um `paid` de outra conta:
  a ação é recusada por causa do `paid` (FR-043), mesmo que a soma feche exatamente.
- Operador tenta excluir uma transação que já está conciliada: ação bloqueada — é necessário
  desfazer a conciliação (FR-020) antes de excluir; não há desfazer automático embutido na ação de
  excluir.
- Conta bancária informada na importação não existe ou não pertence à organização ativa:
  importação recusada.
- Extrato ou transação de uma organização não pode ser acessado, listado, baixado ou alterado por
  outra organização.
- Usuário sem permissão de escrita financeira tenta importar, conciliar, excluir ou desfazer: ação
  bloqueada.
- Transação já excluída ou já conciliada não pode ser conciliada/excluída novamente pela mesma
  ação (deve passar primeiro por "desfazer", quando aplicável).
- Candidato próximo (mesma conta, sinal e janela de data) com valor diferente do valor da
  transação: não gera sugestão de conciliação direta, mas é sinalizado como divergência de valor
  para o operador investigar (ex.: repasse da adquirente menor que o esperado).
- Desfazer uma conciliação cujo lançamento já teve sua movimentação bancária usada em outro
  fechamento/relatório: a movimentação gerada pela conciliação é removida e o lançamento volta ao
  status anterior, mesmo que isso implique recalcular o saldo já consultado anteriormente.
- Mais de um lançamento com valor exatamente igual e dentro da janela de data para a mesma
  transação: todos aparecem como candidatos ordenados por confiança; o operador escolhe qual
  conciliar, em vez de o sistema escolher sozinho.
- Um lançamento já vinculado a outra transação (conciliação ainda não desfeita): não aparece como
  candidato de sugestão, resultado de busca manual ou opção de soma para nenhuma outra transação,
  do mesmo extrato ou de outro.
- Operador tenta editar os campos de taxas/despesas ou multas/juros no formulário de "Criar
  lançamento" (FR-018): a interface não permite — esses campos são sempre zero, e o total exibido
  sempre é igual ao valor da transação.
- Operador troca a conta bancária pré-selecionada no formulário de "Criar lançamento" por uma
  conta que não existe ou não pertence à organização ativa: o sistema recusa salvar, informando o
  erro.
- Lançamento com status `paid` (pago por outro meio, sem vínculo de conciliação ativo) aparece nos
  resultados da busca manual/soma: é elegível como qualquer outro lançamento da conta, desde que
  não esteja vinculado a uma conciliação ativa (FR-033) — status do lançamento não é mais critério
  de exclusão (FR-016). A partir de 2026-08-14, a única restrição adicional é a de conta: um `paid`
  de conta diferente da do extrato aparece na busca, mas não pode ser conciliado (FR-043).
- Uma sugestão automática aparece simultaneamente no cartão da transação e no painel consolidado
  "Registros sugeridos" (FR-041): ambas as superfícies mostram a mesma sugestão; confirmar por
  qualquer uma delas produz o mesmo resultado (FR-015) e remove a sugestão de ambos os lugares.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir importar um arquivo no formato OFX associando-o a uma conta
  bancária existente da organização ativa. Essa associação é **obrigatória** na importação: o
  operador MUST escolher a conta, e o sistema MUST recusar a importação sem ela (decisão de
  2026-08-14, que reverte a opcionalidade da `007-financeiro-ajustes-ui` FR-007). Motivo: o cadastro
  de conta bancária guarda apenas o código do banco, enquanto o OFX traz agência e número de conta —
  não há chave confiável para casar os dois, e o operador é quem sabe de qual conta baixou o arquivo.
  O código do banco do arquivo MUST ser usado apenas para **pré-selecionar** a conta quando houver
  exatamente uma correspondência, nunca como critério de aceitação ou recusa.
- **FR-002**: O sistema MUST recusar a importação de um arquivo que não seja um OFX válido ou
  legível, com uma mensagem de erro clara para o operador.
- **FR-003**: O sistema MUST recusar a importação de um arquivo que exceda o tamanho máximo
  permitido, informando o limite.
- **FR-004**: O sistema MUST recusar a importação quando a conta bancária informada não existir ou
  não pertencer à organização ativa.
- **FR-005**: O sistema MUST extrair de cada arquivo importado: instituição, agência, conta,
  período coberto, e cada transação com data, valor, sinal (entrada/saída), tipo débito/crédito e
  descrição.
- **FR-006**: O sistema MUST persistir o arquivo original importado, disponível para download
  posterior.
- **FR-007**: O sistema MUST impedir que a reimportação do mesmo extrato duplique transações já
  importadas para a mesma conta, e MUST informar ao operador quantas transações foram ignoradas
  por já existirem.
- **FR-008**: O sistema MUST marcar toda transação recém-importada como pendente de conciliação.
- **FR-009**: O sistema MUST permitir importar quantos extratos o operador desejar, mantendo o
  histórico de todos os já importados.
- **FR-010**: O sistema MUST listar os extratos importados mostrando instituição, conta, período,
  status de conciliação e contadores de transações pendentes, conciliadas e excluídas.
- **FR-011**: O sistema MUST calcular o status de um extrato como "não conciliado" quando nenhuma
  transação foi tratada, "parcialmente conciliado" quando há uma mistura de tratadas e pendentes, e
  "conciliado" quando não resta nenhuma pendente.
- **FR-012**: O sistema MUST separar as transações de um extrato em três grupos consultáveis:
  pendentes de conciliação, conciliadas e excluídas.
- **FR-013**: O sistema MUST exibir transações de entrada (crédito) e saída (débito) com indicação
  visual distinta (entrada em verde, saída em vermelho) e com o tipo débito/crédito explícito.
- **FR-014**: O sistema MUST sugerir automaticamente, para cada transação pendente, os lançamentos
  candidatos do ERP compatíveis (mesma conta bancária, mesmo sinal, valor exatamente igual e data
  dentro de uma janela próxima), ordenados por confiança; quando houver mais de um candidato
  compatível, todos MUST ser apresentados como opções, e não apenas o primeiro. A restrição de
  **mesma conta bancária** permanece exclusiva da sugestão automática, mesmo depois de a busca
  manual deixar de ser restrita (FR-037) — assimetria intencional: sugerir é o sistema afirmando que
  dois registros casam, e cruzar contas automaticamente produziria falsos positivos.
- **FR-015**: O sistema MUST permitir ao operador confirmar (conciliar) qualquer um dos candidatos
  sugeridos com uma única ação; quando houver apenas um candidato, essa ação equivale a confirmar
  a sugestão única.
- **FR-016**: O sistema MUST permitir ao operador buscar manualmente um lançamento — em qualquer
  status (`pending` ou `paid`), não apenas pendentes, e em qualquer conta bancária da organização
  (FR-037) — e conciliar a transação com o resultado escolhido, para os casos em que não há sugestão
  automática, desde que o valor do lançamento selecionado seja exatamente igual ao valor da
  transação; caso contrário, o sistema MUST rejeitar a ação sem vincular nada — a mesma exigência de
  valor exato já aplicada à soma de N lançamentos (FR-017). A diferença de valor (excedente ou
  faltante) MUST ser sinalizada no cartão da transação (FR-031/FR-039), e MUST NOT ser exibida como
  alerta no momento da escolha dentro do drawer. O drawer MUST manter um totalizador **neutro**
  (valor selecionado, valor da transação e diferença), sem cor ou texto de erro — feedback mecânico
  necessário para montar uma soma exata (FR-017). A única exclusão de elegibilidade continua sendo
  FR-033 (lançamento já vinculado a uma conciliação ativa).
- **FR-017**: O sistema MUST permitir ao operador selecionar múltiplos lançamentos e conciliar uma
  única transação do extrato com todos eles, desde que a soma dos valores selecionados seja
  exatamente igual ao valor da transação; caso contrário, MUST rejeitar a ação informando que a
  soma não fecha.
- **FR-018**: O sistema MUST permitir criar um novo lançamento diretamente a partir de uma
  transação pendente, com data, valor, sinal e descrição pré-preenchidos a partir dela, e MUST
  conciliar automaticamente a transação com o lançamento recém-criado na mesma operação. O
  formulário MUST exibir os campos de taxas/despesas e multas/juros (sempre zero, não editáveis —
  o total sempre igual ao valor da transação) para paridade visual com o formulário completo de
  lançamento, e MUST permitir escolher a conta bancária do novo lançamento entre as contas da
  organização, pré-selecionada com a conta do extrato mas editável (decisão de `/speckit-clarify`
  2026-08-10: nem sempre o arquivo OFX identifica a conta com certeza).
- **FR-019**: O sistema MUST permitir excluir uma transação pendente da conciliação, movendo-a
  para o grupo de excluídas sem apagá-la do sistema. O sistema MUST NOT permitir excluir
  diretamente uma transação já conciliada — o operador MUST primeiro desfazer a conciliação
  (FR-020) antes de poder excluí-la.
- **FR-020**: O sistema MUST permitir desfazer uma conciliação já feita, devolvendo a transação
  para pendente e removendo o vínculo com o(s) lançamento(s), sem alterar o(s) lançamento(s) em si.
- **FR-021**: O sistema MUST NOT alterar os dados descritivos de um lançamento já existente (valor,
  data, descrição, categoria, centro de custo) como efeito de conciliá-lo com uma transação — a
  conciliação cria um vínculo e atualiza o status de pagamento/recebimento (FR-029), mas não
  reescreve o restante do lançamento. Há duas exceções: quando o próprio lançamento é criado a
  partir da transação (FR-018), onde os dados vêm da transação por definição; e a correção do
  vínculo de conta bancária do lançamento para a conta do extrato quando as contas diferem
  (FR-029), que MUST ser revertida ao desfazer a conciliação (FR-030).
- **FR-022**: O sistema MUST recalcular os contadores e o status do extrato a cada ação de
  conciliar, buscar/somar, criar, excluir ou desfazer.
- **FR-023**: O sistema MUST permitir buscar e filtrar as transações de um extrato por status
  (pendente, conciliada, excluída) e por período (data em que o banco processou a transação —
  `postedAt` — dentro de um intervalo informado pelo operador; ver FR-035).
- **FR-024**: O sistema MUST permitir baixar o arquivo OFX original de qualquer extrato já
  importado, idêntico ao que foi enviado.
- **FR-025**: O sistema MUST restringir toda leitura de extratos e transações de conciliação a
  usuários com permissão de visualização da organização, e toda escrita (importar, conciliar,
  buscar/somar, criar, excluir, desfazer) a usuários com permissão de gestão financeira da loja.
- **FR-026**: O sistema MUST impedir que um extrato, suas transações ou o arquivo original de uma
  organização sejam acessados, listados ou alterados a partir de outra organização.
- **FR-027**: O sistema MUST impedir a duplicação de transações mesmo quando o identificador único
  do extrato (FITID) do banco de origem vier vazio ou se repetir de forma inconsistente entre
  reimportações, usando um critério alternativo de identidade da transação nesses casos.
- **FR-028**: O sistema MUST interpretar corretamente a codificação de caracteres do arquivo OFX
  (incluindo Latin-1/ISO-8859-1, comum em bancos brasileiros), preservando acentuação nas
  descrições importadas.

- **FR-029**: Ao conciliar uma transação do extrato com um ou mais lançamentos (por sugestão,
  busca manual, soma ou criação), o sistema MUST marcar o(s) lançamento(s) envolvidos como
  pago/recebido e MUST gerar a movimentação bancária correspondente na **conta bancária do extrato**,
  de modo que o saldo real dessa conta passe a refletir a conciliação. Quando um lançamento
  selecionado na busca manual pertencer a outra conta bancária (possível desde FR-037), a
  movimentação MUST ainda assim ser gerada na conta do extrato — é ela que o banco de fato
  movimentou — e o sistema MUST corrigir o vínculo de conta bancária do lançamento para a conta do
  extrato. Essa correção aplica-se **apenas a lançamentos `pending`**, os únicos que geram
  movimentação nova; um lançamento já `paid` só pode ser conciliado quando sua conta já é a do
  extrato (FR-043).
- **FR-030**: Ao desfazer uma conciliação (FR-020), o sistema MUST reverter também o efeito sobre o
  saldo: desfazer o status de pago/recebido do(s) lançamento(s) e remover a movimentação bancária
  gerada pela conciliação, sem apagar o lançamento em si. Quando a conciliação tiver corrigido a
  conta bancária de um lançamento (FR-029), o desfazer MUST restaurar a conta original que o
  lançamento tinha antes da conciliação.
- **FR-031**: Quando uma transação pendente tiver um candidato próximo no ERP (mesma conta, mesmo
  sinal, data dentro da janela) cujo valor seja diferente do valor da transação — indicando uma
  possível divergência de repasse (ex.: adquirente repassou menos que o esperado) — o sistema MUST
  sinalizar essa transação com um indicador de divergência de valor, distinto da ausência de
  qualquer candidato, para que o operador identifique casos a auditar/cobrar da adquirente sem
  precisar investigar manualmente cada transação sem sugestão. Esse indicador MUST ser exibido no
  cartão da transação (FR-039) — a superfície única de sinalização de divergência, incluindo a
  diferença apurada na busca manual (FR-016) — e MUST informar a diferença como excedente ou
  faltante.
- **FR-032**: O critério de sugestão automática por valor (FR-014) MUST considerar como candidato
  apto à sugestão direta apenas lançamentos com valor exatamente igual ao da transação; candidatos
  com valor diferente (mesmo dentro da janela de data e mesmo sinal) MUST ser tratados como
  divergência de valor (FR-031), não como sugestão de conciliação direta.
- **FR-033**: Um lançamento já vinculado a uma conciliação ativa (não desfeita) MUST NOT aparecer
  como candidato de sugestão automática (FR-014), como resultado de busca manual (FR-016), nem
  como opção selecionável para soma de N lançamentos (FR-017) — em qualquer desses fluxos, para
  qualquer transação do extrato — até que essa conciliação seja desfeita (FR-020).
- **FR-034**: A movimentação bancária gerada por uma conciliação (FR-029) MUST usar como data a
  data da transação do extrato (a data em que o banco processou a transação), não a data em que o
  operador confirmou a conciliação.
- **FR-035**: O sistema MUST permitir filtrar as transações de um extrato por um intervalo de
  período (data inicial/data final) aplicado sobre a data em que o banco processou a transação
  (`postedAt`), combinável com o filtro de status (FR-023) e a busca por descrição.
- **FR-036**: A busca manual (FR-016) e a soma de N lançamentos (FR-017) MUST ser oferecidas na
  mesma interface de busca, com seleção múltipla (o operador marca 1 ou mais lançamentos); a
  confirmação MUST aplicar a mesma regra de valor já especificada — exato quando 1 lançamento está
  marcado (FR-016), soma exata quando 2 ou mais estão marcados (FR-017).
- **FR-037**: A busca manual/soma (FR-016/FR-017) MUST oferecer um filtro de conta bancária
  editável entre as contas da organização ativa, pré-selecionado com a conta do extrato quando ela
  for conhecida. O filtro MUST NOT ser travado: quando o arquivo OFX não resolve a conta bancária, a
  busca MUST permanecer utilizável em vez de ficar bloqueada. A conta bancária deixa de ser critério
  de elegibilidade dos resultados (revoga a restrição de conta única decidida em 2026-08-10).
- **FR-038**: O drawer "Buscar Registros" (FR-036) MUST oferecer os seguintes filtros de busca:
  período (data inicial/final), o tipo de data usado nesse período (Competência, Vencimento,
  Recebimento/Pagamento — seleção via checkboxes, não exclusiva), Categoria, Fornecedor, Conta
  (pré-selecionada na conta do extrato e editável, FR-037), Método de pagamento e Bandeira. Os
  resultados MUST ser apresentados em formato de tabela com colunas de vencimento, pagamento,
  competência, descrição/categoria e valor, mantendo a seleção múltipla por checkbox (FR-036).
- **FR-039**: Cada transação pendente na aba Pendentes MUST ser apresentada como um cartão contendo
  valor, tipo (Pagamento/Crédito), data, descrição, as ações Conciliar/Novo Registro/Buscar
  registro/Excluir como controles acionáveis (não links de texto), e — quando não houver sugestão —
  um aviso de "nenhum registro encontrado" embutido no próprio cartão. As ações MUST aparecer nesta
  ordem, da esquerda para a direita: **Conciliar, Novo Registro, Buscar registro, Excluir**;
  "Conciliar" MUST ocupar a primeira posição da linha de ações do cartão (e não apenas dentro do
  bloco de sugestão), habilitado somente quando existe ao menos uma sugestão automática para a
  transação. O cartão MUST também ser a superfície onde a divergência de valor é sinalizada
  (FR-016/FR-031). A lista principal de Pendentes MUST NOT oferecer seleção em lote por checkbox;
  seleção múltipla continua restrita ao drawer "Buscar Registros" (FR-036).
- **FR-040**: O formulário "Novo Registro" (FR-018) MUST abrir como painel lateral (drawer)
  ancorado à direita da tela — a mesma direção do drawer "Buscar Registros" (FR-038) — e não como
  diálogo centralizado. O formulário MUST agrupar seus campos nas seções Transação
  Financeira (valor, taxas/despesas, multas/juros, total, conta, data de competência, data de
  vencimento, descrição), Dados de pagamento (valor, data do pagamento, método de pagamento,
  bandeira) e Classificação (categoria, centro de custo); os campos derivados e travados da
  transação (valor, taxas/despesas, multas/juros, total, datas) MUST aparecer como somente leitura
  dentro dessas seções — apenas conta, categoria e centro de custo permanecem editáveis (FR-018).
  Rateio múltiplo (mais de uma linha de categoria/centro de custo) está fora de escopo desta
  funcionalidade.
- **FR-041**: A aba Pendentes MUST exibir, além da sugestão embutida em cada cartão de transação
  (FR-014), um painel colapsável "Registros sugeridos" consolidando todas as sugestões automáticas
  da página, com uma ação rápida de confirmação por sugestão equivalente a Conciliar (FR-015).

- **FR-042**: Aplica-se apenas a **extratos legados** — os importados enquanto a conta era opcional
  (`bankAccountId` nulo). Desde a decisão de 2026-08-14 (FR-001) nenhum extrato novo nasce sem conta,
  mas os já existentes precisam continuar tratáveis. Nesses extratos, o sistema MUST manter a busca
  manual (FR-016) disponível para investigação,
  mas MUST bloquear a conciliação (FR-015/FR-016/FR-017/FR-018) enquanto a conta não for definida,
  informando ao operador o motivo. O sistema MUST oferecer uma ação para definir ou corrigir a conta
  bancária de um extrato já importado. A sugestão automática (FR-014), que depende da conta,
  permanece indisponível nesses extratos até a conta ser definida.

- **FR-043**: Um lançamento com status `paid` (já pago por outro meio) MUST ser conciliável apenas
  quando sua conta bancária for a mesma do extrato. Como a conciliação de um `paid` não gera
  movimentação nova — a movimentação do pagamento original já existe — conciliá-lo a partir de outra
  conta deixaria o saldo da conta do extrato sem refletir a transação. O lançamento MUST continuar
  aparecendo nos resultados da busca (FR-016) para o operador investigar; apenas a confirmação MUST
  ser recusada, informando que a conta do lançamento difere da conta do extrato. Lançamentos
  `pending` não têm essa restrição — para eles vale a correção de conta de FR-029.
- **FR-044**: O campo "Cliente ou fornecedor" do formulário "Novo Registro" (FR-018/FR-040) MUST ser
  uma **seleção sobre os cadastros existentes** — todos os clientes não excluídos de `/clientes`,
  em qualquer estágio de CRM, mais os fornecedores — e MUST NOT ser um campo de texto livre, que é o
  comportamento atual. O vínculo MUST ser gravado por identificador do cadastro, não por nome
  digitado. O estágio de CRM (`lead`/`opportunity`/`active`/`inactive`) MUST NOT ser critério de
  elegibilidade: ele descreve funil de vendas, não autorização para receber ou pagar, e hoje sequer
  é editável pela interface. A mesma regra vale para o campo equivalente da tela de lançamentos
  (`/financas/lancamentos`), que hoje filtra por `tab=active` e por isso não lista nenhum cliente
  cadastrado pela tela `/clientes`.

- **FR-045**: O sistema MUST permitir **excluir um extrato importado**, removendo o extrato, suas
  transações e o arquivo OFX. A exclusão MUST ser definitiva (não soft-delete): o objetivo é liberar
  as chaves de dedupe (FR-007) para o mesmo arquivo poder ser reimportado — um extrato "excluído"
  que continuasse no banco manteria as transações e o problema. O sistema MUST recusar a exclusão
  enquanto houver ao menos uma transação conciliada; o operador MUST desfazer as conciliações antes
  (mesma regra da FR-019 para transação: nada de desfazer escondido dentro de excluir). Comportamento
  confirmado no CPLUG em teste do usuário: excluir é recusado enquanto há item conciliado e liberado
  após desconciliar.
- **FR-046**: A verificação de duplicidade da importação (FR-007/FR-027) MUST ignorar transações no
  grupo **excluídas**. Excluir uma transação significa "não vou tratar isso", não "nunca mais importe
  este arquivo". Enquanto as excluídas contavam, um extrato descartado inutilizava o arquivo de forma
  permanente: reimportar devolvia um extrato **vazio**, e sem FR-045 não havia saída. Reimportar um
  arquivo cujas transações foram excluídas MUST devolver as transações como pendentes.

### Key Entities *(include if feature involves data)*

- **Extrato bancário importado**: representa um arquivo OFX importado para uma conta bancária;
  guarda instituição, conta, período coberto, status de conciliação (não conciliado / parcialmente
  conciliado / conciliado), contadores de transações por grupo, e referência ao arquivo original
  para download. Pertence a uma organização e a uma conta bancária existente.
- **Transação do extrato**: cada movimentação individual extraída de um extrato importado — data,
  valor, sinal (entrada/saída), tipo débito/crédito, descrição, e o grupo em que se encontra
  (pendente, conciliada, excluída). Identificada de forma única dentro do extrato/conta para evitar
  duplicação em reimportações.
- **Vínculo de conciliação**: liga uma transação do extrato a um ou mais lançamentos financeiros do
  ERP; existe apenas enquanto a conciliação não é desfeita; permite repasses agrupados (uma
  transação, vários lançamentos). Enquanto ativo, cada lançamento vinculado fica indisponível como
  candidato para qualquer outra transação (FR-033). Ao ser criado, gera a movimentação bancária que
  quita o(s) lançamento(s) vinculado(s) na data da transação do extrato (FR-034); ao ser desfeito,
  remove essa movimentação e libera o(s) lançamento(s) novamente como candidatos.
- **Lançamento financeiro** *(entidade existente, referenciada)*: o registro do ERP com o qual uma
  transação do extrato é casada, buscada manualmente, ou criada a partir dos dados da transação.
  Passa a pago/recebido como efeito da conciliação (FR-029) e volta ao status anterior se a
  conciliação for desfeita (FR-030); enquanto vinculado a uma conciliação ativa, fica excluído das
  sugestões, busca manual e soma para qualquer outra transação (FR-033).
- **Conta bancária** *(entidade existente, referenciada)*: destino da importação; delimita o
  universo de lançamentos elegíveis para a **sugestão automática** (FR-014) — a busca manual não é
  mais restrita a ela (FR-037). O saldo real da conta do extrato passa a refletir as movimentações
  geradas pelas conciliações, inclusive quando o lançamento conciliado vinha de outra conta
  (FR-029).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um operador consegue importar um extrato bancário e ver todas as suas transações
  listadas em menos de 30 segundos para um extrato de até 500 transações.
- **SC-002**: Reimportar o mesmo arquivo, em qualquer ordem ou repetição, nunca resulta em
  transações duplicadas visíveis na tela.
- **SC-003**: Para transações do extrato que têm um lançamento correspondente exato (mesma conta,
  sinal, valor e data) já registrado no ERP, o sistema apresenta a sugestão automática e permite
  concluir a conciliação em uma única ação do operador.
- **SC-004**: Toda ação de conciliação (por sugestão, manual, por soma, ou por criação de
  lançamento) e toda exclusão de transação podem ser revertidas pelo próprio operador sem
  intervenção técnica.
- **SC-005**: O status de um extrato (não conciliado / parcialmente conciliado / conciliado) reflete
  corretamente o estado de suas transações em 100% das consultas, sem exigir recarregar a página.
- **SC-006**: Um extrato ou transação de uma organização nunca aparece, é listado ou é acessível
  para outra organização, em nenhuma tela ou download.
- **SC-007**: O arquivo baixado de um extrato já importado é idêntico, byte a byte, ao arquivo
  originalmente enviado pelo operador.
- **SC-008**: Quando um repasse bancário é menor que o valor esperado no ERP para o candidato mais
  próximo, o operador consegue identificar essa divergência olhando para a transação, sem precisar
  comparar valores manualmente contra os lançamentos da conta.
- **SC-009**: Depois de conciliar uma transação, o saldo real da conta bancária reflete o valor
  conciliado; depois de desfazer essa conciliação, o saldo volta ao valor anterior à conciliação.

## Assumptions

- A conciliação depende funcionalmente de três outras capacidades do módulo financeiro já
  existentes ou entregues: contas bancárias, lançamentos financeiros e contrato de cartões
  (taxas/prazos de repasse da adquirente). Sem taxas e prazos corretamente configurados no contrato
  de cartões, os valores do extrato tendem a não bater com os do ERP — essa é uma limitação
  funcional conhecida, não um defeito desta funcionalidade.
- A janela de datas usada na sugestão automática, quando não há correspondência de valor exato em
  data idêntica, é de até 3 dias de diferença entre a data da transação do extrato e a data do
  lançamento — um valor de partida a ser ajustado com uso real.
- Quando não há logo disponível para a instituição financeira do extrato, o sistema mostra um
  identificador visual com as iniciais do banco em vez de buscar uma imagem externa.
- O tamanho máximo de um arquivo OFX aceito na importação é 10 MB; arquivos maiores são recusados
  nesta entrega em vez de processados de forma assíncrona.
- A escolha de biblioteca de parsing de OFX (ou a decisão de escrever um parser próprio mínimo) é
  um detalhe de implementação a ser resolvido na fase de planejamento técnico, não nesta
  especificação.
- Esta funcionalidade depende de as três funcionalidades citadas acima (contas bancárias,
  lançamentos, contrato de cartões) já estarem implementadas o suficiente para gerar lançamentos e
  movimentações reais na conta bancária — sem isso, a conciliação não tem contrapartida real para
  casar durante o desenvolvimento e a validação.
- Imagens de referência de layout (mockups) para esta tela seguem o mesmo tratamento já dado a
  outras telas do ERP com referência visual externa: definem quais campos/filtros/botões existem e
  como se agrupam, mas a implementação usa os componentes e tokens de cor do design system já
  adotado no app (`@citybox/mui`, com o alternador claro/escuro existente) — não uma réplica
  literal de cores/tema da imagem (decisão de `/speckit-clarify` 2026-08-10).
