# Feature Specification: DRE real e análise por centro de custo

**Feature Branch**: `003-financial-reports-cost-center`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "Fechar o ciclo de grupo financeiro, plano de contas e centro de custo: trocar a DRE (relatório de resultados) de dados fictícios para dados reais agregados por data de competência na hierarquia Grupo financeiro → Plano de contas, e entregar a análise por centro de custo (percentual de receita/despesa por departamento), hoje inexistente."

## Clarifications

### Session 2026-08-06

- Q: Quando um grupo/conta da DRE não tem nenhum lançamento no período, ou quando não há nenhuma
  alocação sem centro de custo (bucket "Outros"), como o relatório deve tratar esse item? → A:
  Omitir da lista/árvore — o item simplesmente não aparece no relatório (mesmo comportamento do
  mock atual da DRE).
- Q: Qual convenção de arredondamento deve reger os percentuais exibidos (conta dentro do grupo,
  grupo dentro da seção, centro de custo dentro do total)? → A: Fração bruta (não arredondada) no
  backend; o arredondamento (1 casa decimal) acontece somente na exibição, no frontend — a soma das
  frações brutas sempre fecha em 100% por construção.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar a DRE com dados reais (Priority: P1)

Um operador financeiro abre a tela de Relatórios de resultados (DRE), escolhe um período, e vê
as entradas e saídas reais do negócio agregadas por data de competência, organizadas por Grupo
financeiro → Plano de contas, com despesas destacadas em negativo e o resultado líquido do
período — não mais dados fictícios sincronizados manualmente.

**Why this priority**: É o entregável que fecha o ciclo dos três cadastros já concluídos (grupo,
plano, centro de custo) e corrige o problema mais grave hoje: a tela mostra dados fictícios que
não têm nenhuma relação com a operação real da loja, o que compromete a confiança de quem gerencia
o financeiro.

**Independent Test**: Criar a conta "Internet" no grupo "Despesas fixas", lançar um pagamento de
R$ 100 nela com competência no mês corrente, abrir a DRE do mês e verificar que aparece "Despesas
fixas −R$ 100", expandindo para "Internet −R$ 100".

**Acceptance Scenarios**:

1. **Given** um lançamento de despesa de R$ 100 na conta X do grupo Y com competência no mês
   corrente, **When** o operador abre a DRE desse mês, **Then** vê o grupo Y com total −R$ 100,
   expansível até a conta X com −R$ 100.
2. **Given** um lançamento rateado 80%/20% entre duas contas, **When** a DRE é aberta, **Then** a
   primeira conta mostra 80% do valor do lançamento e a segunda 20%.
3. **Given** um período sem nenhum lançamento, **When** o operador abre a DRE desse período,
   **Then** vê um estado vazio claro, sem quebrar e sem mostrar dados de outro período.
4. **Given** um lançamento excluído (soft-delete), **When** a DRE é recalculada, **Then** esse
   lançamento não entra na soma.
5. **Given** os dois grupos financeiros de sistema classificados como patrimoniais ("Caixa e
   bancos" e "Ativo"), **When** a DRE é aberta, **Then** esses grupos não entram no total de
   receita nem no resultado líquido exibido.
6. **Given** o operador troca a organização ativa, **When** reabre a DRE, **Then** os valores
   exibidos mudam para refletir a nova organização.
7. **Given** os percentuais calculados (conta dentro do grupo, grupo dentro da seção) como frações
   brutas não arredondadas, **When** somados, **Then** fecham em 100% por construção; o
   arredondamento para exibição (1 casa decimal) ocorre só no frontend.

---

### User Story 2 - Analisar receita e despesa por centro de custo (Priority: P2)

Um operador financeiro escolhe um período e um tipo (despesa ou receita) e vê o percentual e o
valor que cada departamento (centro de custo) representa no total — uma visão que hoje não existe;
a tela correspondente é apenas um placeholder.

**Why this priority**: Depende da mesma base de dados da DRE (US1), mas é um relatório
independente e testável isoladamente. Entrega a "visão macro" prometida ao lojista e ainda ausente
do produto.

**Independent Test**: Com lançamentos rateados entre pelo menos dois centros de custo diferentes
num período, abrir a análise, escolher "Despesa" e conferir que os dois centros aparecem com valor
e percentual, ordenados do maior para o menor.

**Acceptance Scenarios**:

1. **Given** lançamentos de despesa rateados entre "RH" (50% do total) e "Financeiro" (20% do
   total) num período, **When** o operador abre a análise com o tipo "Despesa", **Then** vê "RH"
   listado primeiro com 50% e "Financeiro" com 20%.
2. **Given** um lançamento sem centro de custo definido, **When** a análise é calculada, **Then**
   esse valor aparece agrupado sob o rótulo "Outros".
3. **Given** um período sem lançamentos, **When** a análise é aberta, **Then** mostra um estado
   vazio claro.
4. **Given** os percentuais de todos os centros de custo do período (incluindo "Outros"), **When**
   somados, **Then** fecham em 100%.
5. **Given** o operador alterna o filtro entre "Despesa" e "Receita", **When** troca a seleção,
   **Then** os valores e percentuais exibidos são recalculados para o tipo selecionado.

---

### Edge Cases

- Período informado com data final anterior à inicial: o sistema rejeita a consulta com uma
  mensagem clara, em vez de retornar um resultado sem sentido.
- Lançamento rateado entre três ou mais contas/centros de custo diferentes: a soma de todas as
  linhas de rateio fecha com o valor total do lançamento (tolerância de 1 centavo), refletida
  proporcionalmente nos dois relatórios.
- Organização nova, ainda sem nenhum lançamento além dos cadastros padrão do seed: os dois
  relatórios abrem normalmente em estado vazio, sem erro.
- Um lançamento de alto valor alocado a um grupo financeiro patrimonial ("Caixa e bancos" ou
  "Ativo"): não distorce o total de receita nem o resultado líquido da DRE.
- Grupo financeiro (ou conta) sem nenhum lançamento no período: é omitido da árvore da DRE — não
  aparece como uma linha com total R$ 0,00.
- Bucket "Outros" do centro de custo (alocações sem centro de custo definido) sem nenhum
  lançamento no período: segue a mesma regra — não aparece como um item com valor R$ 0,00.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE calcular um relatório de resultados (DRE) agregando os lançamentos
  financeiros não excluídos cuja data de competência esteja dentro do período informado.
- **FR-002**: A DRE DEVE agregar hierarquicamente por Conta do plano → Grupo financeiro → Seção
  (Receita/Despesa), refletindo o rateio de cada lançamento entre as contas às quais foi
  distribuído.
- **FR-003**: A DRE DEVE considerar todos os lançamentos com competência no período,
  independentemente do status de pagamento (pendente ou pago) — regime de competência pura, não
  regime de caixa.
- **FR-004**: A DRE DEVE excluir do cálculo os grupos financeiros classificados como
  "patrimoniais" — eles não fazem parte do resultado do período.
- **FR-005**: O sistema DEVE permitir classificar cada grupo financeiro como "de resultado" ou
  "patrimonial". Os grupos de sistema "Caixa e bancos" e "Ativo" DEVEM ser corrigidos para
  "patrimonial" tanto em organizações novas quanto nas já existentes. Grupos financeiros criados
  pelo próprio lojista são sempre "de resultado".
- **FR-006**: A DRE DEVE exibir despesas com sinal negativo.
- **FR-007**: A DRE DEVE calcular o resultado líquido do período como o total de receitas menos o
  total de despesas, considerando apenas os grupos "de resultado".
- **FR-008**: A DRE DEVE calcular o percentual de cada conta dentro do seu grupo e de cada grupo
  dentro da sua seção como uma fração não arredondada; o arredondamento para exibição (1 casa
  decimal) DEVE ocorrer somente no frontend, de forma que a soma das frações brutas feche em 100%
  por construção.
- **FR-009**: Um período sem lançamentos DEVE resultar em um estado vazio claro na DRE, sem exibir
  dados de outro período nem quebrar a tela.
- **FR-010**: Lançamentos excluídos (soft-delete) NÃO DEVEM entrar em nenhum dos dois relatórios
  desta funcionalidade.
- **FR-011**: Trocar a organização ativa DEVE atualizar os valores exibidos em ambos os relatórios
  (escopo estritamente por organização).
- **FR-012**: O sistema DEVE calcular um relatório de análise por centro de custo, agregando os
  lançamentos do período por centro de custo e por tipo (despesa ou receita), com valor e
  percentual sobre o total do período.
- **FR-013**: Lançamentos sem centro de custo definido DEVEM ser agrupados sob o rótulo "Outros"
  na análise por centro de custo.
- **FR-014**: A análise por centro de custo DEVE apresentar os resultados ordenados por valor
  decrescente.
- **FR-015**: A tela de Relatórios de resultados DEVE passar a exibir exclusivamente dados reais
  vindos do backend — nenhum dado fictício (mock) pode permanecer na cadeia de consumo dessa tela.
- **FR-016**: O sistema DEVE oferecer uma tela nova de análise por centro de custo, com filtro de
  período e alternância entre Despesa/Receita, acessível por um item de navegação real (não mais
  um placeholder).
- **FR-017**: As duas telas de relatório DEVEM tratar de forma explícita os estados de carregando,
  erro e vazio.
- **FR-018**: Os cadastros existentes de grupo financeiro, plano de contas e centro de custo
  (CRUD, soft-delete/restore, bloqueio de exclusão de registro em uso ou de sistema) DEVEM
  continuar funcionando sem nenhuma regressão de comportamento.
- **FR-019**: Os botões de exportação (PDF/Excel) já existentes na tela de DRE permanecem fora do
  escopo desta entrega; a pendência DEVE ficar registrada na documentação do módulo.
- **FR-020**: O sistema DEVE remover o código e os dados fictícios (mocks) que hoje sustentam a
  DRE, uma vez confirmado que nenhuma outra tela depende deles.

### Key Entities *(include if feature involves data)*

- **Grupo financeiro**: categoria de receita ou despesa; passa a ter uma classificação ("de
  resultado" ou "patrimonial") que determina se participa da DRE.
- **Plano de contas**: subcategoria dentro de um grupo financeiro; já vinculada ao lançamento
  através do rateio.
- **Centro de custo**: departamento vinculado a uma entrada ou saída através do rateio do
  lançamento.
- **Rateio do lançamento**: fração de um lançamento financeiro atribuída a uma conta do plano e a
  um centro de custo; já existe hoje e é a fonte de dados dos dois relatórios desta funcionalidade.
- **Relatório de resultados (DRE)**: visão agregada de receitas e despesas do período, organizada
  por conta e grupo, com percentuais e resultado líquido.
- **Análise por centro de custo**: visão agregada do período por departamento, com valor e
  percentual sobre o total.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um lançamento de despesa lançado numa conta e grupo específicos aparece refletido
  corretamente (com sinal negativo, no grupo e na conta certos) na DRE do mês de competência
  correspondente.
- **SC-002**: Em qualquer período testado, a soma dos percentuais de contas dentro de um grupo, e
  de grupos dentro de uma seção, fecha em 100%.
- **SC-003**: Em qualquer período testado, a soma dos percentuais de todos os centros de custo
  (incluindo "Outros") fecha em 100%.
- **SC-004**: Nenhuma referência a dados fictícios (mock) permanece no caminho de dados das duas
  telas de relatório desta funcionalidade.
- **SC-005**: Um lançamento alocado a um grupo financeiro patrimonial (ex.: recebimento de um
  cliente) não altera o total de receita nem o resultado líquido exibido na DRE.
- **SC-006**: Ao trocar a organização ativa e reabrir qualquer um dos dois relatórios, os valores
  exibidos correspondem exclusivamente aos lançamentos da organização selecionada — nenhum valor
  da organização anterior permanece visível.
- **SC-007**: Os três cadastros (grupo financeiro, plano de contas, centro de custo) continuam se
  comportando exatamente como antes desta entrega — mesmas regras de exclusão, restauração e
  unicidade.

## Assumptions

- O vínculo real entre lançamento financeiro e conta do plano / centro de custo (o rateio) já
  existe e está em produção — foi entregue por uma funcionalidade anterior (Lançamentos
  financeiros) e não faz parte desta fatia.
- O centro de custo já é obrigatório em cada linha de rateio desde a funcionalidade de Lançamentos
  financeiros; o rótulo "Outros" da análise por centro de custo cobre principalmente dados
  legados ou casos de borda, não o fluxo normal de criação de novos lançamentos.
- O fechamento de pedidos de venda já grava o rateio na conta de sistema correta de vendas, em vez
  de uma categoria de texto solta — esse comportamento não é reaberto nesta fatia.
- Grupos financeiros criados pelo lojista (não de sistema) são sempre classificados como "de
  resultado"; a classificação "patrimonial" fica restrita aos dois grupos de sistema já
  existentes ("Caixa e bancos" e "Ativo").
- A disponibilidade de uma conta do plano para uso no PDV (marcação "disponível para o PDV")
  permanece sem nenhum consumidor nesta fatia, por não existir ainda módulo de PDV — a pendência
  fica documentada, não implementada.
- Os botões de exportação (PDF/Excel) da tela de DRE permanecem como estão hoje (sem função real);
  implementar exportação de fato é uma fatia futura, fora deste escopo.
