# Guia — Conciliação bancária

## O que é

É a tela que permite importar o extrato bancário do seu banco, no formato
**OFX**, e conferir se cada movimentação que o banco registrou também está
lançada corretamente aqui no sistema.

## Para que serve

- **Auditar a adquirente de cartão.** Se o contrato de cartões está
  configurado corretamente, o valor que entra no sistema já vem líquido
  (com a taxa da adquirente descontada). Se o extrato do banco mostra um
  repasse **menor** do que o esperado, é um sinal de divergência a cobrar
  da adquirente.
- **Encontrar lançamentos que ninguém digitou** — uma despesa que saiu da
  conta e nunca foi registrada no sistema.
- **Fechar o caixa com confiança**, sabendo que o financeiro do sistema
  reflete a conta bancária real.

## Como usar

### Importar um extrato

Na tela **Finanças > Conciliação bancária**, clique em **Importar extrato**,
escolha a **conta bancária** de destino e o arquivo **.ofx** baixado do
internet banking do seu banco. O sistema lê o arquivo e mostra quantas
transações novas foram trazidas e quantas já existiam (reimportar o mesmo
arquivo nunca duplica nada).

A conta bancária é **obrigatória**. O arquivo do banco traz o número da agência
e da conta, mas o cadastro de contas aqui no sistema guarda só o banco — não dá
para o sistema adivinhar com segurança qual das suas contas aquele arquivo
representa. Quem baixou o extrato sabe disso, então é você quem informa. Quando
o banco do arquivo corresponde a exatamente uma conta cadastrada, o campo já vem
preenchido como sugestão — e você pode trocar.

Se a empresa ainda não tem nenhuma conta bancária cadastrada, a tela avisa: é
preciso cadastrar a conta em **Finanças > Contas bancárias** antes de importar.

### A lista de extratos

Cada extrato importado aparece com a instituição, a conta, o período coberto
e o **status**:

- **Não conciliado** — nenhuma transação foi tratada ainda.
- **Parcialmente conciliado** — algumas transações já foram tratadas, outras
  seguem pendentes.
- **Conciliado** — todas as transações do extrato já foram tratadas.

Clique em um extrato para abrir o detalhe.

### Trabalhando um extrato

O detalhe mostra a instituição, a conta, o período e três abas:

- **Pendentes** — transações ainda não tratadas.
- **Conciliadas** — transações já casadas com um lançamento do sistema.
- **Excluídas** — transações que você decidiu não tratar.

Cada transação pendente aparece como um cartão com a data, a descrição, o
valor (**entrada em verde, saída em vermelho**) e, quando o sistema encontra
um lançamento parecido, uma **sugestão** embutida no próprio cartão. No topo
da aba Pendentes, um filtro de **Período** (data inicial/final) e a busca por
descrição ajudam a encontrar uma transação específica dentro de um extrato
grande. No rodapé da aba, um painel **"Registros sugeridos"** reúne todas as
sugestões automáticas da página num só lugar, com um botão "Adicionar" que
tem o mesmo efeito de conciliar pelo cartão.

Para cada transação pendente você pode (os botões aparecem nesta ordem:
**Conciliar**, **Novo Registro**, **Buscar registro** e o ícone de excluir):

- **Conciliar** — é o primeiro botão do cartão. Ele só fica disponível quando
  o sistema encontrou algum lançamento com o valor exato. Se houver **um**
  candidato, o clique já confirma o casamento. Se houver **mais de um**, o
  sistema leva você até a lista de candidatos logo abaixo para você escolher
  qual é o certo — ele nunca decide sozinho. Você também pode conciliar
  direto pelo candidato ou pelo painel "Registros sugeridos".
- **Buscar registro** — quando não há sugestão, busque manualmente entre os
  lançamentos da conta (pendentes **e já pagos**, desde que ainda não estejam
  vinculados a outra transação do extrato) e selecione um ou mais. O drawer
  de busca tem filtros completos — período (e se ele se refere a
  competência, vencimento ou recebimento/pagamento), categoria, fornecedor,
  método de pagamento e bandeira — e mostra os resultados numa tabela. A soma
  dos valores selecionados precisa fechar exatamente com o valor da
  transação (seja 1 lançamento, seja vários — um repasse agrupado da
  adquirente, por exemplo). Enquanto você monta a seleção, o rodapé mostra o
  quanto já foi selecionado, o valor da transação e a diferença que falta —
  é só um totalizador para você fechar a conta, não um aviso de erro. O botão
  Conciliar só libera quando a diferença chega a zero.
- **Novo Registro** — quando não existe nenhum lançamento correspondente,
  clique em "Novo Registro"; um painel abre pela lateral direita da tela,
  com as seções Transação
  Financeira, Dados de pagamento e Classificação. Valor, taxas/despesas,
  multas/juros, total e datas vêm da transação e aparecem só para conferência
  (não editáveis). Escolha a conta bancária (vem pré-selecionada com a conta
  do extrato, mas pode trocar), a categoria e o centro de custo, e salve; o
  lançamento nasce pago e já conciliado.
- **Excluir** — move a transação pendente para a aba Excluídas, sem apagá-la.
  Uma transação já conciliada não pode ser excluída diretamente — desfaça a
  conciliação primeiro.

### Quando o valor não bate

Se existe um lançamento com data próxima mas o valor não fecha, o próprio
cartão da transação avisa: aparece uma etiqueta **"Divergência de valor"**
dizendo quanto falta ou quanto excede. É o caso típico de repasse da
adquirente menor que o esperado — algo a investigar ou cobrar, não um erro do
sistema.

Esse aviso fica sempre no cartão, junto da transação. O painel de busca não
interrompe você no meio da escolha para reclamar do valor: ele só mostra a
diferença como totalizador, e o botão Conciliar permanece bloqueado até a
conta fechar.

Conciliar marca o lançamento como pago (ou, se ele já estava pago por outro
meio, só cria o vínculo com a transação) e garante que o saldo real da conta
bancária reflita o movimento. Se você errar, é sempre possível **desfazer a
conciliação** (na aba Conciliadas) — a transação volta para Pendentes e o
vínculo é removido.

### Baixar o extrato original

No detalhe do extrato é possível baixar novamente o arquivo `.ofx` que foi
importado, exatamente como foi enviado.

## O que ainda não faz

- Tolerância de centavos na sugestão automática — hoje o casamento automático
  exige valor exatamente igual; diferenças de centavos precisam de busca
  manual.
- Relatório dedicado de divergências de repasse — a divergência aparece na
  própria transação, mas não existe ainda um relatório consolidado.
