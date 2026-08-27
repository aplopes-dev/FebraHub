# Guia — Produção

## O que é

O módulo de Produção existe para quem **fabrica** o que vende — como uma
pizzaria que assa pizzas ou uma indústria que monta um kit. Em **uma única
tela**, você planeja o que precisa ser feito, acompanha a separação dos
insumos e fecha a conta no final, atualizando o estoque de insumos e do
produto pronto.

Só entram neste fluxo os produtos marcados como **Processo produtivo** na ficha
técnica real (`/v1/technical-sheets`, tipo `productive_process`) — diferente da
Produção automática, que já dá baixa sozinha na venda. Os insumos da receita
vêm da composição da ficha (produtos tipo Insumo), não de um cadastro paralelo.

## Para que serve

- **Planejar a fabricação** com antecedência: o que, quanto e até quando.
- **Ver tudo em um só lugar**: pedidos pendentes, em andamento e já concluídos,
  sem precisar circular entre telas diferentes.
- **Saber exatamente quanto separar de cada insumo**, sem fazer conta na mão —
  o sistema multiplica a receita pela quantidade pedida.
- **Corrigir divergências** no fim (às vezes a massa rende menos que o
  planejado) e mesmo assim manter o estoque e o custo corretos.
- **Ajustar o estoque automaticamente**: dá baixa nos insumos usados e entrada
  no produto pronto, tudo registrado nas Movimentações.

## Como usar

### A tela

No topo você encontra a **busca** (por produto ou SKU), o botão **Novo
pedido** e o alternador de visualização **Kanban / Lista**:

- **Kanban:** quatro colunas — **Pendente**, **Em andamento**, **Concluído** e
  **Cancelado** — mostrando o ciclo de vida completo de cada pedido de uma só
  vez. Arraste um card de Pendente para Em andamento para iniciar a produção,
  ou clique nele para ver os detalhes. Concluir e cancelar não são feitos por
  arraste — exigem o painel de detalhes (a finalização pede a quantidade
  final; o cancelamento pede confirmação).
- **Lista:** a mesma informação em tabela, com abas para filtrar por status
  (Todos / Pendente / Em andamento / Concluído / Cancelado).

### 1. Criar um pedido

Clique em **Novo pedido** — abre um painel lateral com:

- **Produto:** só aparecem produtos com processo produtivo ativo.
- **Quantidade a produzir:** quantas unidades você quer fabricar.
- **Estoque de origem:** de onde saem os insumos.
- **Estoque de destino:** para onde vai o produto pronto, depois de fabricado.
- **Data de previsão:** quando a produção deve ficar pronta.

Ao clicar em **Gerar Pedido**, ele entra no board com status **Pendente**.

### 2. Acompanhar e iniciar

Clique em qualquer pedido (Kanban ou Lista) para abrir o painel de detalhes.
Um pedido **Pendente** mostra a **separação de insumos**: a receita do produto
já multiplicada pela quantidade pedida (por exemplo, se a receita usa 0,300 kg
de farinha por unidade e o pedido é de 10, a tela mostra 3,000 kg). Clique em
**Iniciar Produção** quando a equipe começar a trabalhar — o pedido passa para
**Em andamento**.

### 3. Finalizar

Um pedido **Em andamento** abre o mesmo painel, agora com o campo **Quantidade
final produzida** — que pode ser diferente da planejada (a massa às vezes
rende menos ou mais) — e o **Resumo de custos**, recalculado na hora: quanto de
cada insumo foi gasto e o custo total daquela produção.

Ao clicar em **Finalizar Produção** (com confirmação, pois a ação mexe no
estoque):

- O sistema **dá baixa** nos insumos usados no estoque de origem.
- O sistema **dá entrada** do produto pronto no estoque de destino.
- Os dois movimentos ficam registrados em **Movimentações** e refletem no
  **Balanço** dos estoques envolvidos.
- O pedido passa para **Concluído** e some da coluna "Em andamento".

### Cancelar um pedido que não vai prosseguir

Às vezes uma produção precisa ser abandonada — faltou insumo, o plano mudou,
foi um pedido criado por engano. Um pedido **Pendente** ou **Em andamento**
pode ser cancelado a qualquer momento: abra o painel de detalhes e clique em
**Cancelar produção** (com confirmação). Como nenhum insumo chegou a ser dado
como consumido nessas duas etapas, cancelar **não mexe no estoque** — não há
nada para estornar. O pedido passa para **Cancelado** — visível na coluna
"Cancelado" do Kanban e na aba "Cancelado" da Lista.

### Consultar um pedido já concluído ou cancelado

Clique em um card/linha **Concluído** para ver, só para consulta, a quantidade
produzida, a divergência (se houve) e os insumos consumidos com seus custos.
Um pedido **Cancelado** mostra apenas a data do cancelamento. Em ambos os
casos não há nenhuma ação disponível, já que a produção foi encerrada.

### Comentários e histórico

Todo pedido tem, na parte de baixo do painel de detalhes, um histórico
completo: quando foi criado, iniciado, finalizado ou cancelado, e por quem.
Além dos eventos automáticos, qualquer pessoa pode escrever uma observação
(por exemplo, "insumo em falta, aguardando fornecedor") no campo de
comentário — ela entra na mesma linha do tempo, com o nome de quem escreveu.

## Em resumo

Uma única tela cobre o ciclo inteiro: criar o pedido, acompanhar a separação
de insumos, iniciar e finalizar a produção — ajustando estoque e custo de
forma automática e rastreável, sem precisar navegar entre páginas diferentes.
