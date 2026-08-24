# Guia — Contas bancárias

## O que é

Contas bancárias espelham as contas reais da empresa dentro do sistema, para
gerenciar saldos e registrar todas as entradas e saídas financeiras.

**Importante:** as contas são **virtuais** — não há integração automática em
tempo real com os bancos físicos. Para conciliar, exporte o extrato do banco
real em formato **OFX** e importe pela tela de **Conciliação bancária**
(também acessível pelo menu ⋯ da conta).

## Para que serve

- **Controlar o saldo real** de cada conta da empresa (banco, carteira digital
  ou caixa em espécie) — o saldo mostrado é sempre a soma de tudo que já
  entrou e saiu da conta, nunca só o valor com que ela foi aberta.
- **Registrar movimentações** de entrada e saída com quem lançou (quando
  disponível) e a data de efetivação.
- **Acompanhar como um extrato**: a visão Histórico mostra o saldo acumulado
  após cada movimentação, como um extrato bancário tradicional — e o cálculo
  continua correto mesmo navegando entre páginas.
- **Compartilhar a conta entre filiais**: cada conta é vinculada às unidades
  do grupo que podem usá-la.
- **Transferir dinheiro entre contas**: registra uma saída numa conta e uma
  entrada na outra, de forma permanente.

## Como usar

### A lista

Em **Finanças > Contas bancárias** você vê todas as contas com o banco
vinculado, a data de abertura, quantas unidades compartilham a conta e o
**saldo atual real** (em vermelho quando negativo). Use a busca para achar
uma conta pelo nome ou pelo banco.

No menu ⋯ de cada conta:

- **Transações** — abre o detalhamento analítico da conta.
- **Histórico (extrato)** — abre direto a visão de extrato.
- **Importar extrato (OFX)** — leva até a tela de Conciliação bancária, já
  com esta conta pré-selecionada para importar o extrato.

### Nova conta / Editar conta

O botão **Nova conta** (ou **Editar**, no detalhe da conta) abre um
formulário simples:

- **Banco** — a instituição financeira da conta. Reabrir uma conta já
  cadastrada sempre mostra o banco originalmente escolhido.
- **Apelido** (opcional) — sem apelido, a conta usa o nome do banco.
- **Saldo inicial** — o valor que a empresa já tem no banco físico ao começar
  a usar o sistema (ou ao editar, o valor que deve valer como ponto de
  partida). Ele entra/atualiza como o **primeiro registro** da conta.
- **Data de abertura** — quando a conta foi iniciada no sistema.
- **Vinculação de empresas (unidades)** — o botão **Selecionar** abre, no
  próprio painel, a etapa de escolha das filiais (com busca); marque as
  unidades e clique em **Aplicar seleção** para voltar ao formulário.

**Cancelar** e **Salvar** ficam fixos no rodapé do painel: o formulário rola
por baixo deles, então as ações continuam visíveis mesmo em telas baixas.

### Transações

Visão analítica: todas as entradas e saídas da conta, com o **usuário
responsável** (quando disponível), a **data de efetivação** e a **descrição**.
Filtre por **tipo** (saldo inicial, entrada, saída) e por **período** para
achar uma movimentação específica. O saldo inicial aparece como primeiro
registro.

### Histórico

Visão desenhada como um **extrato bancário**: o saldo atual em destaque no
topo da conta e, na aba, a lista limpa das movimentações agrupadas por dia —
cada uma com o valor (entrada em verde, saída em vermelho) e o **saldo
acumulado** logo após aquela movimentação. Navegue entre páginas sem perder a
continuidade do cálculo.

### Transferência entre contas

Pela tela de Lançamentos (**Transferências**), escolha a conta de saída, a
conta de entrada, o valor, a data, a **forma de pagamento** e o **centro de
custo**, e confirme. A conta de saída perde o valor, a de entrada ganha —
imediatamente e de forma permanente. A conta de saída e a de entrada precisam
ser diferentes. Depois de criada, uma transferência não pode ser editada nem
cancelada — para corrigir um erro, registre uma nova transferência no sentido
oposto.

## O que ainda não faz

- Lançamento manual de transações avulsas pela tela (as movimentações vêm dos
  módulos de vendas/compras/lançamentos financeiros, transferências ou
  conciliação bancária).
- Editar ou cancelar uma transferência já feita.
