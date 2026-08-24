# Guia — Inventário

## O que é

O Inventário é a **contagem física** dos produtos que você tem guardados em um
estoque. A ideia é simples: comparar **o que existe de verdade na prateleira,
geladeira ou depósito** com **o que o sistema diz que você tem** — e corrigir a
diferença.

Essas diferenças (as chamadas divergências) acontecem por quebras, perdas,
furtos, desperdício ou lançamentos esquecidos. Ao finalizar um inventário, o
sistema atualiza o saldo do estoque para refletir exatamente a realidade contada.

## Para que serve

- **Deixar o estoque do sistema igual ao físico**, para você confiar nos números.
- **Descobrir perdas e desperdícios** — por exemplo, quando o físico é menor do
  que o sistema aponta.
- **Evitar vender o que não existe** — o saldo correto protege as vendas e o
  delivery.
- **Acompanhar o histórico** de contagens já feitas em cada estoque.

## Como usar

### Onde acessar

Na tela de **Estoque**, encontre o estoque que quer auditar, clique no botão de
opções (os três pontinhos) e escolha **Inventários**. Você verá a lista de todas
as contagens já feitas naquele estoque, com data, número de produtos e quantas
tiveram divergência. Clicar em uma contagem abre os detalhes dela.

### Criar um novo inventário

Clique em **Novo inventário**. Ao abrir, o sistema carrega o saldo atual de
todos os produtos do estoque — enquanto isso, os botões **Adicionar produtos** e
**Finalizar inventário** ficam indisponíveis. Isso é proposital: a contagem
ajusta o estoque comparando o que você lançou com o saldo real, então ela só
pode começar depois que esse saldo estiver carregado por completo. Se a consulta
falhar, aparece um aviso com a opção de tentar novamente.

Depois:

1. **Dê um nome à contagem** — algo que ajude a identificar depois, como
   "Inventário Geral Mensal" ou "Inventário de Bebidas".
2. **Adicione os produtos** que serão contados, pelo botão **Adicionar produtos**
   (você busca e marca os itens desejados).
3. Para cada produto, o sistema mostra o **Saldo sistema** (o que ele acha que
   você tem) e um campo **Contagem**, onde você lança **a quantidade real** que
   contou fisicamente.
4. A coluna **Divergência** mostra na hora a diferença: **Sem divergência** quando
   bate, **Sobra** quando contou mais, ou **Falta** quando contou menos. No topo
   há um resumo de quantos itens estão divergentes.

### Finalizar

Ao terminar a contagem, clique em **Finalizar inventário**. O sistema pede uma
confirmação, porque **o saldo do estoque será ajustado** para as quantidades
contadas — e isso não pode ser desfeito. Depois de finalizado, a contagem entra
no histórico e o Balanço do estoque já passa a mostrar os saldos corrigidos.

### Ver uma contagem antiga

Na lista, clique sobre um inventário para abrir os detalhes: nome, data,
quantidade de produtos, itens com divergência e a tabela com o saldo do sistema,
o valor contado e a divergência de cada produto.

## Em resumo

O Inventário é a forma de manter o estoque do sistema fiel ao físico. Você conta,
lança o que realmente tem, e o sistema corrige o saldo — mostrando de quebra onde
estão as perdas e divergências do seu negócio.
