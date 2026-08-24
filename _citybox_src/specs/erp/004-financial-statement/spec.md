# Feature Specification: Extrato financeiro consolidado

**Feature Branch**: `004-financial-statement`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "Extrato financeiro consolidado somente-leitura em /financas/extratos: filtros por período (competência ou vencimento), tipo/operação, status, conta bancária, categoria e centro de custo; cards de resumo (entradas, saídas, saldo) agregados no backend sobre o conjunto filtrado; saldo por conta bancária; busca livre; agrupamento (seleção) de lançamentos com soma client-side; zero ações de escrita."

## Clarifications

### Session 2026-08-06

- Q: Quando há uma unidade/filial ativa selecionada, o Extrato (lista + resumo + saldo por conta)
  deve ser filtrado por essa unidade, ou o escopo desta tela é sempre a organização inteira,
  independentemente da unidade ativa? → A: Sempre a organização inteira — o Extrato ignora a
  unidade ativa, no mesmo padrão de todas as outras telas financeiras hoje (Lançamentos, Contas
  bancárias, Relatórios de resultados, Análise por centro de custo). Nenhuma delas filtra por
  unidade; `FinancialEntry` não tem vínculo de unidade e `BankAccount.branchIds` não é consultado
  em nenhuma query. Trocar a unidade ativa não altera os dados exibidos; só trocar a organização
  ativa altera (FR-013).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar e filtrar o extrato (Priority: P1)

Um operador financeiro abre a tela de Extrato (ou é redirecionado a ela ao acessar Finanças) e vê,
sem precisar aplicar nenhum filtro, a lista completa de entradas e saídas da organização ativa, com
um resumo no topo (total de entradas, total de saídas e saldo) que muda exatamente conforme os
filtros que ele aplica — período (por competência ou por vencimento), tipo, status, conta bancária,
categoria financeira, centro de custo — e/ou uma busca livre por texto.

**Why this priority**: É o entregável que tira a porta de entrada do módulo financeiro do estado
"Em construção" (`/financas` redireciona para `/financas/extratos`) e entrega a funcionalidade
central pedida: achar rapidamente uma movimentação ou o conjunto de movimentações de um período,
com um resumo confiável.

**Independent Test**: Criar um lançamento de recebimento de R$ 10.000 com competência e vencimento
de hoje, abrir o Extrato, filtrar por competência = hoje + tipo = recebimento, e conferir que o
lançamento aparece na lista e que os cards de resumo refletem esse total.

**Acceptance Scenarios**:

1. **Given** a tela recém-aberta sem nenhum filtro, **When** o operador olha a lista, **Then** vê
   todas as movimentações da organização ativa, paginadas.
2. **Given** um lançamento com competência e vencimento de hoje, **When** o operador filtra por
   competência = hoje e tipo = recebimento, **Then** o lançamento aparece na lista.
3. **Given** um lançamento cuja competência e vencimento diferem, **When** o operador troca o eixo
   de data de competência para vencimento, **Then** o conjunto de resultados muda de acordo.
4. **Given** um conjunto de resultados filtrado com mais de uma página, **When** o operador observa
   os cards de Entradas/Saídas/Saldo, **Then** os valores correspondem à soma de **todo** o conjunto
   filtrado, não apenas da página exibida.
5. **Given** um lançamento com uma palavra específica na descrição, **When** o operador digita essa
   palavra na busca livre, **Then** o lançamento aparece nos resultados.
6. **Given** filtros de conta bancária, categoria financeira ou centro de custo aplicados, **When**
   a busca é refeita, **Then** somente as movimentações que atendem a esses filtros aparecem.
7. **Given** um lançamento excluído (soft-delete), **When** o extrato é recalculado, **Then** esse
   lançamento não aparece em nenhum resultado.
8. **Given** o operador troca a organização ativa, **When** reabre o Extrato, **Then** os valores
   exibidos passam a refletir exclusivamente a nova organização.

---

### User Story 2 - Ver o saldo de cada conta bancária (Priority: P2)

Na mesma tela, o operador financeiro visualiza o saldo atual de cada conta bancária cadastrada,
sem precisar navegar até a tela de Contas bancárias.

**Why this priority**: Complementa o resumo geral do período com uma visão por conta — útil, mas
independente da funcionalidade central de filtrar/consultar (US1); pode ser entregue e testado
separadamente.

**Independent Test**: Com duas contas bancárias cadastradas, abrir o Extrato e conferir que o saldo
de cada uma aparece na tela, batendo com o saldo mostrado na tela de Contas bancárias.

**Acceptance Scenarios**:

1. **Given** a organização tem N contas bancárias cadastradas, **When** o operador abre o Extrato,
   **Then** vê o saldo de cada uma das N contas.
2. **Given** o saldo de uma conta muda (novo lançamento pago), **When** o operador reabre o Extrato,
   **Then** o saldo exibido reflete o valor atualizado.

---

### User Story 3 - Agrupar lançamentos selecionados (Priority: P3)

O operador financeiro marca duas ou mais linhas da lista e vê, numa barra de seleção, a contagem e
o valor total somado dessas linhas — útil para conferir rapidamente um subconjunto específico de
movimentações sem precisar somar manualmente.

**Why this priority**: É um incremento de usabilidade sobre a lista já filtrável de US1; não é
crítico para o MVP (a tela já entrega valor real sem isso), mas é pedido explícito da regra de
negócio original e testável de forma isolada.

**Independent Test**: Com pelo menos 3 lançamentos visíveis, selecionar 2 deles e conferir que a
barra de seleção mostra "2 lançamentos selecionados" e o valor somado correto (respeitando o sinal
de entrada/saída).

**Acceptance Scenarios**:

1. **Given** uma lista com lançamentos visíveis, **When** o operador seleciona N linhas, **Then** uma
   barra/rodapé mostra a contagem N e o valor total somado (entradas e saídas com seus sinais).
2. **Given** uma seleção ativa, **When** o operador muda um filtro ou troca de página, **Then** a
   seleção é limpa (evita um total de seleção que não corresponde mais ao que está na tela).

---

### Edge Cases

- Período informado com data final anterior à inicial: o sistema rejeita a consulta com uma
  mensagem clara, em vez de retornar um resultado sem sentido.
- Nenhum filtro aplicado e organização sem nenhuma movimentação: estado vazio claro ("Nenhuma
  movimentação registrada"), sem erro.
- Algum filtro aplicado e nenhum resultado: estado vazio diferente do anterior ("Nenhuma
  movimentação encontrada com esses filtros"), com uma ação para limpar os filtros.
- Lançamento rateado entre múltiplas contas do plano ou centros de custo: aparece no extrato
  associado ao lançamento (não duplicado por linha de rateio) quando o filtro de categoria/centro de
  custo bate com qualquer uma das linhas do rateio.
- Trocar de página ou de filtro com uma seleção de agrupamento ativa: a seleção anterior é limpa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE substituir o placeholder atual em `/financas/extratos` por uma tela
  funcional, somente leitura — inclusive quando acessada via redirecionamento de `/financas`.
- **FR-002**: O sistema DEVE listar as movimentações (lançamentos financeiros) da organização
  ativa, paginadas no backend; sem nenhum filtro aplicado, a tela mostra todas as movimentações.
- **FR-003**: A tela NÃO DEVE oferecer nenhuma ação de escrita — sem criar, editar, excluir
  lançamento nem registrar transferência. Um link que apenas navega até o lançamento na tela de
  Lançamentos é permitido.
- **FR-004**: O sistema DEVE permitir filtrar por período, com o operador escolhendo o eixo de
  data: por competência ou por vencimento.
- **FR-005**: O sistema DEVE permitir filtrar por tipo/operação (recebimento, pagamento, ou todos)
  e por status, com opção "todos".
- **FR-006**: O sistema DEVE permitir filtrar por conta bancária, por categoria financeira (plano
  de contas) e por centro de custo.
- **FR-007**: O sistema DEVE oferecer busca livre por texto, além dos filtros estruturados.
- **FR-008**: O painel de resumo (entradas, saídas, saldo) DEVE ser recalculado a cada mudança de
  filtro e DEVE refletir a soma de todo o conjunto filtrado — nunca apenas da página exibida.
- **FR-009**: O sistema DEVE exibir o saldo de cada conta bancária cadastrada na organização.
- **FR-010**: Entradas e saídas DEVEM ser visualmente distintas (mesma convenção do módulo:
  entrada em verde, saída em vermelho).
- **FR-011**: O sistema DEVE permitir selecionar múltiplas linhas da lista e exibir a contagem e o
  valor total somado da seleção.
- **FR-012**: Lançamentos excluídos (soft-delete) NÃO DEVEM aparecer em nenhum resultado do
  extrato.
- **FR-013**: Trocar a organização ativa DEVE atualizar os dados exibidos (lista, resumo e saldos
  por conta) para refletir exclusivamente a nova organização. O escopo desta tela é sempre a
  organização inteira — trocar a unidade/filial ativa NÃO DEVE alterar os dados exibidos (ver
  Clarifications acima).
- **FR-014**: A tela DEVE tratar de forma explícita os estados de carregando, erro, vazio sem
  filtro e vazio com filtro (este último com uma ação para limpar os filtros aplicados).
- **FR-015**: Trocar o eixo de data entre competência e vencimento DEVE alterar o conjunto de
  resultados sempre que as duas datas de um lançamento forem diferentes.

### Key Entities *(include if feature involves data)*

- **Lançamento financeiro**: entrada ou saída já existente no sistema; fonte primária de dados do
  extrato — já persistido, com competência, vencimento, status, conta bancária, rateio de
  categoria e centro de custo.
- **Conta bancária**: fornece o saldo exibido na tela; já existente.
- **Plano de contas / Centro de custo**: usados como filtros de categoria e departamento; já
  existentes.
- **Resumo do extrato**: valor agregado (entradas, saídas, saldo) calculado sobre o conjunto de
  lançamentos que atende aos filtros aplicados no momento.
- **Seleção de agrupamento**: conjunto de lançamentos marcados manualmente pelo operador na tela,
  usado só para exibir uma soma — não persistido, não afeta os lançamentos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ao abrir `/financas/extratos` (diretamente ou via redirecionamento de `/financas`)
  sem nenhum filtro, o operador vê a lista completa de movimentações da organização — nunca mais
  uma tela "Em construção".
- **SC-002**: Um lançamento criado com competência e vencimento de hoje aparece corretamente ao
  filtrar por competência = hoje e o tipo correspondente.
- **SC-003**: Trocar o eixo de data entre competência e vencimento, quando as duas datas de um
  lançamento diferem, muda o conjunto de resultados exibido.
- **SC-004**: Em qualquer conjunto filtrado com mais de uma página, os valores de Entradas, Saídas
  e Saldo exibidos batem exatamente com a soma de todo o conjunto filtrado.
- **SC-005**: Selecionar um conjunto de linhas exibe a contagem e o valor total somado corretos
  para esse conjunto.
- **SC-006**: O saldo de cada conta bancária cadastrada está visível na tela, e bate com o valor
  mostrado na tela de Contas bancárias.
- **SC-007**: Trocar a organização ativa e reabrir o Extrato faz os dados exibidos corresponderem
  exclusivamente à organização selecionada — nenhum valor da organização anterior permanece
  visível.

## Assumptions

- As duas dependências funcionais desta fatia — Lançamentos financeiros (rateio de categoria e
  centro de custo persistido) e Contas bancárias (saldo real) — já estão implementadas em produção
  (`specs/erp/001-financial-entries/` e `specs/erp/002-bank-account-ledger/`); esta fatia não está
  bloqueada por nenhuma pendência delas.
- A fonte única de dados do extrato é o Lançamento financeiro (`FinancialEntry`); a aba "Histórico"
  do detalhe de cada conta bancária (que usa as movimentações bancárias) é uma tela separada e não
  é alterada por esta fatia — evita contar a mesma movimentação duas vezes.
- O gráfico de recebimentos x pagamentos que existia no ERP legado fica fora do escopo desta
  fatia — a decisão de produto documentada é enxugar a tela para filtro + resumo + lista; pode
  voltar como uma fatia futura, se pedido.
- A exportação (PDF/Excel) do extrato fica fora do escopo desta fatia, no mesmo padrão da pendência
  já registrada na tela de Relatórios de resultados.
- "Agrupar lançamentos" (seleção de linhas) é apenas uma soma visual, calculada a partir dos dados
  já carregados na tela — não existe nenhuma ação em lote (baixa, exclusão, etc.) sobre o conjunto
  selecionado.
- O saldo mostrado no resumo do topo é o saldo do período filtrado (entradas menos saídas do
  conjunto exibido), não o saldo bancário real das contas — a tela rotula isso de forma explícita
  para não confundir com o saldo por conta bancária (US2).
