# Guia — Extrato

## O que é

O Extrato é a tela de consulta central das Finanças: reúne **todas as
entradas e saídas** já lançadas na organização (o mesmo cadastro de
Lançamentos), com filtros, um resumo do período e o saldo de cada conta
bancária — tudo em modo **somente leitura**.

## Para que serve

- **Achar rapidamente** uma movimentação ou um conjunto de movimentações de
  um período, sem precisar abrir a tela de Lançamentos.
- **Conferir o resumo do período filtrado**: quanto entrou, quanto saiu e o
  saldo entre os dois — recalculado a cada mudança de filtro.
- **Ver o saldo de cada conta bancária** cadastrada, sem navegar até a tela
  de Contas bancárias.
- **Somar rapidamente um grupo de lançamentos**: marcar algumas linhas e ver
  a soma delas, sem precisar calcular manualmente.

O Extrato **não cria, edita nem exclui** nada — para alterar um lançamento,
use o link "Ver" da linha, que leva até a tela de Lançamentos.

## Como usar

### Filtrar por período: competência ou vencimento

No filtro, escolha primeiro **qual data** usar para o período: **Competência**
(quando a receita/despesa aconteceu) ou **Vencimento** (quando deveria ser
paga/recebida). Depois escolha o intervalo de datas. Trocar entre os dois
eixos muda o conjunto de resultados sempre que a competência e o vencimento
de um lançamento forem diferentes.

### Outros filtros e busca

Além do período, dá para filtrar por **tipo** (Contas a pagar/receber),
**status** (Pendente/Pago-Recebido), **categoria financeira**, **centro de
custo** e **conta bancária** — todos combináveis. A busca livre, no topo,
procura por descrição, cliente ou fornecedor.

### Os cards de resumo

Logo no topo aparecem três números: **Entradas**, **Saídas** e **Saldo do
período**. Eles somam **todo** o conjunto que atende aos filtros aplicados —
não só os lançamentos da página que está na tela. O saldo é a diferença
entre entradas e saídas **do período filtrado**; não é o saldo real das
contas bancárias (isso é o próximo item).

### Saldo por conta bancária

Ao lado do resumo, cada conta bancária cadastrada aparece com o seu saldo
atual — o mesmo valor mostrado na tela de Contas bancárias, sempre
atualizado conforme novos pagamentos/recebimentos entram no sistema.

### Selecionar e somar linhas

Marque o checkbox de duas ou mais linhas da lista para ver, numa barra no
rodapé, quantos lançamentos foram selecionados e o valor total somado
(entradas somam, saídas subtraem). É só uma soma visual — não existe nenhuma
ação em lote sobre a seleção. Trocar de página ou mudar um filtro limpa a
seleção automaticamente, para nunca mostrar uma soma desatualizada.

### Estados da tela

- **Sem nenhum filtro e organização sem movimentação**: "Nenhuma movimentação
  registrada".
- **Com filtro aplicado e nenhum resultado**: "Nenhuma movimentação
  encontrada com esses filtros", com um botão para limpar os filtros.
- **Erro ao carregar**: mensagem com botão para tentar de novo.
