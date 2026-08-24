# Feature Specification: Motor de recebíveis do contrato de cartões

**Feature Branch**: `005-card-receivables-engine`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "Motor de recebíveis do contrato de cartões: ao fechar uma venda no cartão/Pix, gerar os recebíveis previstos com a taxa da adquirente já abatida, na data em que a adquirente efetivamente repassa (D+N em dias úteis ou corridos, ou pagamento único), agrupados conforme o contrato — substituindo o recebível único, bruto e já quitado que o fechamento de venda gera hoje para qualquer forma de pagamento. Inclui capturar bandeira e número de parcelas no pagamento da venda, pré-requisito que falta hoje para o motor conseguir resolver qual taxa e prazo aplicar."

## Clarifications

### Session 2026-08-06

- Q: No painel de pagamentos da venda, a bandeira do cartão deve ser um catálogo fixo (as mesmas
  bandeiras cadastradas nos métodos de pagamento do contrato) ou texto livre digitado pelo operador
  de caixa? → A: Catálogo fixo, igual ao do contrato — evita divergência de digitação que faria o
  motor cair no fallback bruto silenciosamente mesmo com a taxa configurada.
- Q: O agrupamento do contrato (por bandeira / por método / sem agrupamento) precisa criar, já
  nesta entrega, um registro de "lote de repasse" ligando os recebíveis gerados, ou fica sem efeito
  nos dados até a conciliação bancária ser especificada? → A: Sem efeito nos dados nesta entrega —
  grouping continua só cadastrado no contrato; nenhuma estrutura de lote é criada agora.
- Q: Quando a venda cai no fallback (sem contrato/método aplicável), o aviso deve ficar só em log
  técnico, ou o usuário financeiro precisa ver esse aviso na tela do recebível/lançamento? → A:
  Visível ao usuário financeiro — um indicador simples no próprio lançamento, para o lojista
  descobrir que o cadastro do contrato está incompleto.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capturar bandeira e parcelas no pagamento em cartão (Priority: P1)

Ao registrar um pagamento em cartão (débito ou crédito) no fechamento de uma venda, o operador de
caixa informa a bandeira do cartão e, quando for crédito, o número de parcelas.

**Why this priority**: É o dado de entrada sem o qual nenhuma outra parte desta funcionalidade
pode funcionar — sem bandeira e parcelas, o sistema não tem como saber qual taxa e prazo do
contrato de cartão se aplicam a esse pagamento.

**Independent Test**: Registrar um pagamento em cartão de crédito em 3x com bandeira Visa e
verificar que esses dois dados ficam salvos junto do pagamento, mesmo antes de qualquer cálculo de
recebível existir.

**Acceptance Scenarios**:

1. **Given** um pagamento em cartão de débito sendo registrado, **When** o operador seleciona a
   forma de pagamento cartão, **Then** o sistema pede a bandeira do cartão a partir de uma lista
   fixa de bandeiras — a mesma usada no cadastro de métodos de pagamento do contrato de cartão —
   sem permitir texto livre.
2. **Given** um pagamento em cartão de crédito sendo registrado, **When** o operador seleciona a
   forma de pagamento cartão de crédito, **Then** o sistema pede a bandeira e o número de
   parcelas.
3. **Given** um pagamento em dinheiro ou Pix, **When** o operador registra o pagamento, **Then** o
   sistema não exige bandeira nem parcelas (Pix normalmente não tem bandeira).

---

### User Story 2 - Recebível líquido, na data certa de repasse (Priority: P1)

Ao fechar uma venda com pagamento em cartão ou Pix cujo contrato de adquirente está configurado, o
sistema gera o recebível já com a taxa da adquirente descontada e com vencimento na data em que o
dinheiro efetivamente cai na conta — não mais um valor bruto vencendo no mesmo dia da venda.

**Why this priority**: É a razão de existir de toda a funcionalidade — sem isso, o contrato de
cartão cadastrado não produz nenhum efeito financeiro real, e o financeiro continua "mentindo" o
valor e a data de cada venda no cartão.

**Independent Test**: Fechar uma venda de R$ 100,00 no débito Visa com um contrato configurado a
2,3% de taxa e repasse em 1 dia corrido; conferir que o recebível gerado vale R$ 97,70 e vence no
dia seguinte à venda, não no dia da venda.

**Acceptance Scenarios**:

1. **Given** um contrato de cartão ativo com taxa de débito Visa 2,3% e repasse D+1 corrido,
   **When** uma venda de R$ 100,00 nesse cartão é fechada, **Then** é gerado 1 recebível de
   R$ 97,70 com vencimento no dia seguinte à venda.
2. **Given** o mesmo contrato configurado com repasse D+1 em dias úteis, **When** a venda é fechada
   numa sexta-feira, **Then** o recebível vence na segunda-feira seguinte, não no sábado.
3. **Given** um pagamento via Pix com taxa 0% e prazo 0 configurados no contrato, **When** a venda
   é fechada, **Then** é gerado 1 recebível pelo valor cheio, vencendo no mesmo dia da venda.
4. **Given** um método de pagamento com faixas progressivas de taxa cadastradas, **When** a venda é
   fechada com um número de parcelas que cai dentro de uma faixa específica, **Then** a taxa
   aplicada é a da faixa correspondente, não a taxa base do método.
5. **Given** um método de pagamento com tarifa fixa em dinheiro além da taxa percentual, **When** o
   recebível é calculado, **Then** a tarifa fixa também é descontada do valor líquido.
6. **Given** um recebível gerado por essa funcionalidade, **When** o usuário financeiro o consulta,
   **Then** ele nasce não quitado (aguardando recebimento) e creditado na conta bancária definida
   no contrato — não mais já quitado como hoje.

---

### User Story 3 - Parcelamento do crédito distribuído corretamente (Priority: P2)

Numa venda parcelada no crédito, o sistema respeita o que o contrato diz sobre como a adquirente
repassa o dinheiro: tudo de uma vez (pagamento único) ou uma parcela por vencimento futuro — sem
perder nem sobrar centavo entre elas.

**Why this priority**: É o cenário mais comum de venda no cartão de crédito parcelado e o que mais
diverge do comportamento atual (hoje o valor total aparece integralmente hoje, nunca parcelado no
futuro).

**Independent Test**: Fechar uma venda de R$ 600,00 em 6x no crédito com um contrato configurado
para pagamento único; conferir que nasce exatamente 1 recebível com o valor líquido total. Repetir
com o contrato configurado para parcelas em dias corridos e conferir que nascem exatamente 6
recebíveis cuja soma bate exatamente com o valor líquido total.

**Acceptance Scenarios**:

1. **Given** um contrato de crédito configurado como pagamento único, **When** uma venda de
   R$ 600,00 em 6x é fechada, **Then** é gerado exatamente 1 recebível com o valor líquido total
   da venda.
2. **Given** o mesmo contrato configurado com parcelas em dias corridos, **When** a mesma venda é
   fechada, **Then** são gerados exatamente 6 recebíveis, cada um vencendo um intervalo de dias
   após o anterior, e a soma dos 6 valores líquidos é exatamente igual ao valor líquido total (sem
   diferença de centavos).

---

### User Story 4 - Comportamento seguro quando não há contrato aplicável (Priority: P2)

Quando uma venda no cartão não tem contrato configurado, ou a bandeira/método usado não bate com
nenhum método cadastrado no contrato, o fechamento da venda continua funcionando exatamente como
hoje — nunca falha por causa desta funcionalidade.

**Why this priority**: O fechamento de venda é o fluxo mais crítico do ERP do lojista; nenhuma
melhoria no financeiro pode travar o caixa da loja.

**Independent Test**: Fechar uma venda no cartão numa organização sem nenhum contrato de cartão
cadastrado e confirmar que a venda fecha normalmente, gerando o recebível bruto e quitado como
acontece hoje.

**Acceptance Scenarios**:

1. **Given** uma organização sem contrato de cartão cadastrado, **When** uma venda no cartão é
   fechada, **Then** a venda fecha normalmente e gera o recebível no formato atual (valor bruto,
   já quitado, vencendo hoje).
2. **Given** um contrato cadastrado mas sem um método correspondente à bandeira usada na venda,
   **When** a venda é fechada, **Then** a venda fecha normalmente com o recebível no formato atual,
   e esse recebível fica marcado com um aviso visível ao usuário financeiro de que não houve
   correspondência com o contrato.
3. **Given** um pedido de venda já fechado (com recebíveis já gerados), **When** o mesmo
   fechamento é reprocessado, **Then** nenhum recebível adicional é duplicado.

---

### User Story 5 - Rastrear a taxa cobrada em cada recebível (Priority: P3)

O usuário financeiro consegue ver, em cada recebível gerado por essa funcionalidade, quanto era o
valor bruto original da venda e quanto foi descontado de taxa — sem precisar calcular isso à mão.

**Why this priority**: Sustenta a confiança no motor (permite auditar se o valor líquido está
correto) e prepara terreno para a conciliação bancária, mas não bloqueia o valor central das
histórias P1/P2.

**Independent Test**: Abrir um recebível gerado por uma venda no cartão e conferir que o valor
bruto da venda e o valor da taxa descontada aparecem junto do valor líquido, sem sair da tela.

**Acceptance Scenarios**:

1. **Given** um recebível gerado a partir de uma venda no cartão com contrato aplicável, **When**
   o usuário financeiro o visualiza, **Then** ele vê o valor bruto da venda e o valor da taxa
   descontada, além do valor líquido.

### Edge Cases

- O que acontece quando a bandeira/parcelas informadas no pagamento não correspondem a nenhum
  método cadastrado no contrato aplicável? → mesmo tratamento da User Story 4: recebível bruto +
  aviso, venda não falha.
- O que acontece quando o contrato aplicável está inativado ou foi excluído (soft-delete) no
  momento do fechamento da venda? → o motor não deve considerá-lo aplicável; a venda segue o
  comportamento de fallback (User Story 4).
- O que acontece quando o vencimento calculado cai num fim de semana mas o contrato não tem a opção
  "somente dias úteis" habilitada? → o vencimento permanece no fim de semana, sem ajuste.
- O que acontece quando o vencimento calculado cai num feriado nacional ou municipal? → fora do
  escopo desta fatia; o cálculo de dia útil considera apenas segunda a sexta (ver Assumptions).
- O que acontece com os recebíveis já gerados quando um pedido de venda é cancelado ou reaberto
  após o fechamento? → fora do escopo desta fatia; hoje a garantia é apenas de não duplicar ao
  reprocessar o mesmo fechamento (User Story 4, cenário 3), não de reverter/cancelar recebíveis já
  gerados.
- O que acontece com vendas e recebíveis gerados antes da entrega desta funcionalidade? → não são
  recalculados; o motor passa a valer apenas para vendas fechadas a partir da entrega (ver
  Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir capturar a bandeira do cartão ao registrar um pagamento em
  cartão (débito ou crédito) no fechamento de uma venda, a partir de uma lista fixa de bandeiras —
  a mesma usada no cadastro de métodos de pagamento do contrato de cartão — sem aceitar texto
  livre, para garantir que a bandeira do pagamento sempre possa ser comparada com a bandeira
  cadastrada no contrato (FR-004).
- **FR-002**: O sistema DEVE permitir capturar o número de parcelas ao registrar um pagamento em
  cartão de crédito no fechamento de uma venda.
- **FR-003**: Ao fechar uma venda, o sistema DEVE tentar resolver o contrato de cartão ativo
  aplicável a cada pagamento em cartão ou Pix.
- **FR-004**: O sistema DEVE resolver, dentro do contrato aplicável, o método de pagamento
  cadastrado que corresponde à combinação de forma de pagamento e bandeira do pagamento da venda.
- **FR-005**: Quando não houver contrato aplicável, ou não houver método correspondente à
  combinação forma de pagamento + bandeira, o sistema DEVE gerar o recebível no formato atual
  (valor bruto, já quitado, vencendo no dia da venda) — sem falhar o fechamento da venda — e DEVE
  marcar esse recebível com um aviso visível ao usuário financeiro (não apenas um log técnico) de
  que ele foi gerado sem contrato/método aplicável.
- **FR-006**: Quando o método de pagamento tiver faixas progressivas de taxa habilitadas, o sistema
  DEVE aplicar a taxa da faixa cuja abrangência contempla o número de parcelas da venda; caso
  contrário, DEVE aplicar a taxa fixa configurada no método.
- **FR-007**: O sistema DEVE calcular o valor líquido de cada recebível como o valor bruto menos a
  taxa percentual aplicável e menos a tarifa fixa em dinheiro configurada no método, quando houver.
- **FR-008**: O sistema DEVE calcular a data de vencimento da primeira parcela como a data da venda
  mais o prazo configurado no método, contando em dias úteis ou em dias corridos conforme a
  configuração do contrato/método.
- **FR-009**: Quando a venda for parcelada no crédito e o contrato definir pagamento único, o
  sistema DEVE gerar exatamente 1 recebível com o valor líquido total da venda.
- **FR-010**: Quando a venda for parcelada no crédito e o contrato definir parcelas em dias úteis
  ou corridos, o sistema DEVE gerar 1 recebível por parcela, com vencimentos espaçados conforme o
  intervalo configurado entre parcelas.
- **FR-011**: Quando o contrato tiver a opção de vencimento somente em dias úteis habilitada, o
  sistema DEVE empurrar qualquer vencimento calculado que caia em sábado ou domingo para a próxima
  segunda-feira.
- **FR-012**: A soma dos valores líquidos de todas as parcelas geradas para um mesmo pagamento DEVE
  ser exatamente igual ao valor líquido total calculado para aquele pagamento, sem perda nem sobra
  de centavos.
- **FR-013**: Os recebíveis gerados por esta funcionalidade DEVEM nascer como não quitados (aguardando
  recebimento), diferente do comportamento atual em que nascem já quitados.
- **FR-014**: Os recebíveis gerados por esta funcionalidade DEVEM ser creditados na conta bancária
  configurada no contrato de cartão aplicável.
- **FR-015**: O sistema DEVE manter, em cada recebível gerado, o valor bruto original e o valor da
  taxa descontada visíveis e rastreáveis junto do valor líquido.
- **FR-016**: Fechar o mesmo pedido de venda mais de uma vez NÃO DEVE duplicar os recebíveis já
  gerados para os pagamentos daquele pedido.
- **FR-017**: Esta funcionalidade DEVE se aplicar apenas a vendas fechadas a partir da data de
  entrega; recebíveis de vendas já fechadas anteriormente NÃO DEVEM ser recalculados
  retroativamente.
- **FR-018**: A diferença entre valor bruto e valor líquido (a taxa da adquirente) NÃO DEVE gerar
  um lançamento de despesa separado no plano de contas nesta entrega — basta ficar visível como
  campo do próprio recebível (FR-015). Um lançamento de despesa dedicado fica para uma entrega
  futura, quando o plano de contas/DRE estiver pronto para recebê-lo.
- **FR-019**: "Voucher" NÃO DEVE ser suportado como forma de pagamento configurável no contrato de
  cartão nesta entrega — continua tratado pelo fallback bruto (FR-005) até uma entrega futura que
  amplie o cadastro de métodos de pagamento.
- **FR-020**: O motor de recebíveis NÃO DEVE depender de um interruptor por organização — DEVE
  valer para todas as organizações assim que for entregue. Organizações sem contrato de cartão
  aplicável continuam cobertas pelo fallback (FR-005), que preserva o comportamento atual sem
  nenhuma configuração adicional.
- **FR-021**: O agrupamento configurado no contrato (por bandeira, por método de pagamento, ou sem
  agrupamento) NÃO DEVE alterar como os recebíveis são gerados nesta entrega — nenhuma estrutura de
  "lote de repasse" é criada agora. O campo continua cadastrável no contrato e disponível para ser
  aplicado quando a conciliação bancária (a funcionalidade que efetivamente o consome) for
  especificada.

### Key Entities *(include if feature involves data)*

- **Pagamento da venda**: representa uma forma de pagamento usada para quitar uma venda. Passa a
  registrar também a bandeira do cartão e o número de parcelas, quando aplicável, além de qual
  contrato de cartão foi usado para calcular o recebível gerado a partir dele.
- **Contrato de cartão**: já existente — configura, por adquirente, a conta bancária de repasse, o
  agrupamento, o tipo de dia (útil/corrido) e as demais regras de prazo do repasse. Nesta
  funcionalidade passa a ser efetivamente consultado, não apenas cadastrado.
- **Método de pagamento do contrato**: já existente — define, por combinação de forma de pagamento
  e bandeira, a taxa percentual, a tarifa fixa e o prazo de repasse usados no cálculo.
- **Faixa progressiva de taxa**: já existente — taxa alternativa aplicada conforme a faixa de
  número de parcelas em que a venda se enquadra.
- **Recebível previsto**: o lançamento financeiro gerado a partir de um pagamento em cartão/Pix.
  Guarda o valor bruto da venda, a taxa/tarifa descontada, o valor líquido, a data de vencimento,
  se está ou não quitado, a conta bancária de destino, a qual venda e pagamento ele pertence (para
  nunca ser duplicado ao reprocessar o mesmo fechamento) e, quando gerado pelo fallback (FR-005),
  um indicador visível de que não houve contrato/método aplicável.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma venda de R$ 100,00 no débito com contrato configurado a 2,3% de taxa e repasse em
  1 dia corrido gera um recebível de exatamente R$ 97,70, vencendo no dia seguinte à venda — não no
  dia da venda e não pelo valor bruto.
- **SC-002**: Uma venda parcelada no crédito com contrato configurado para pagamento único gera
  exatamente 1 recebível; a mesma venda com contrato configurado para parcelas em dias corridos
  gera 1 recebível por parcela, e a soma de todos os valores líquidos bate exatamente (zero
  diferença de centavos) com o valor líquido total esperado.
- **SC-003**: 100% das vendas fechadas sem contrato de cartão aplicável (ou sem correspondência de
  bandeira/método) continuam sendo fechadas com sucesso, gerando o recebível no formato atual —
  nenhuma venda falha por causa desta funcionalidade.
- **SC-004**: Fechar o mesmo pedido de venda duas vezes produz exatamente o mesmo conjunto de
  recebíveis, sem nenhuma duplicação, em 100% dos casos testados.
- **SC-005**: Um usuário financeiro consegue identificar o valor bruto e a taxa descontada de
  qualquer recebível gerado por esta funcionalidade em até um clique/consulta, sem precisar de
  cálculo manual ou de outra tela.
- **SC-006**: Uma venda em Pix com taxa e prazo configurados como zero gera o recebível pelo valor
  cheio, vencendo no mesmo dia da venda, em 100% dos casos.

## Assumptions

- O contrato de cartão aplicável a um pagamento é resolvido por um vínculo explícito registrado no
  próprio pagamento (não apenas pela conta bancária), permitindo que uma mesma conta bancária tenha
  mais de um contrato de adquirente associado.
- O agrupamento de recebíveis conforme o contrato (por bandeira, por método, ou individual) não tem
  efeito nos dados gerados nesta entrega — os recebíveis mantêm o rastro 1:1 com a venda/pagamento
  de origem, sem fusão entre vendas diferentes; o campo fica pronto para ser aplicado quando a
  conciliação bancária for especificada (decisão registrada em FR-021).
- Os campos de período de corte (diário/semanal/mensal) e de antecipação (taxa e período) do
  contrato de cartão continuam cadastráveis, mas não são aplicados pelo motor nesta entrega — a
  semântica desses campos fica pendente para uma entrega futura.
- O campo do contrato que controla se todos os lançamentos entram já quitados dentro do contrato
  não tem semântica aplicada nesta entrega.
- O cálculo de "dia útil" considera apenas segunda a sexta-feira; feriados nacionais e municipais
  não são considerados nesta entrega — limitação conhecida e documentada.
- O motor vale apenas para vendas fechadas a partir da data de entrega desta funcionalidade;
  recebíveis já gerados antes disso não são recalculados nem alterados retroativamente.
- Reverter ou cancelar recebíveis já gerados quando uma venda é cancelada/reaberta após o
  fechamento está fora do escopo desta entrega; a garantia coberta aqui é apenas não duplicar
  recebíveis ao reprocessar o mesmo fechamento.
- A taxa da adquirente (bruto − líquido) fica só como campo rastreável do recebível nesta entrega;
  não gera um lançamento de despesa separado no plano de contas (decisão registrada em FR-018).
- "Voucher" fica fora do escopo desta entrega como forma de pagamento configurável; continua
  coberto pelo fallback bruto (decisão registrada em FR-019).
- O motor não depende de um interruptor por organização — vale para todas as organizações assim
  que entregue, com o fallback (FR-005) cobrindo quem ainda não configurou contrato (decisão
  registrada em FR-020).
