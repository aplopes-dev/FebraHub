# Guia — Gerenciar caixas

## O que é

Cada vez que um caixa do PDV é **aberto** e depois **fechado**, nasce uma
**sessão de caixa**. Nesta tela você acompanha essas sessões: quanto entrou de
saldo, quanto foi declarado, quantas vendas foram feitas e o comprovante de
fechamento.

Os dados vêm da **`erp-api`** (`/v1/pos-cash-sessions`), alimentados pelos
turnos abertos/fechados no app PDV (Flutter).

## Para que serve

- **Filtrar** sessões por PDV, operador e período.
- **Ver o resumo** de abertura, fechamento e saldos de cada caixa.
- **Abrir as vendas** de uma sessão e conferir o detalhe de cada uma.
- **Consultar o comprovante** de valores de fechamento (relatório gerencial).

## Como usar

### Filtros

No topo da lista você escolhe:

- **PDV** — terminais cadastrados na unidade ativa
- **Operador** — busca pelo nome de quem abriu o turno
- **Período** — Hoje, Ontem, Essa semana, Esse mês ou **Data específica**
  (início e fim)

Depois use **Filtrar**. **Limpar** volta aos filtros padrão (período = Hoje).

### Lista de sessões

Cada linha mostra:

- PDV e identificação do caixa
- Horário de abertura e fechamento (ou “Aberto” se ainda estiver em operação)
- **Operador** (quem abriu o turno) e **Vendedor** (agregado quando disponível)
- Saldo inicial e saldo final
- Recebimentos declarados
- **Vendas** — número total; **clique** para abrir o painel lateral
- **Sangrias** — quantidade de sangrias no turno (resumo)

### Painel da sessão

Ao clicar no número de vendas:

1. O cabeçalho mostra o PDV, o caixa e o **operador** da abertura.
2. Há duas abas: **Vendas** e **Sangrias / movimentos** (sangrias e reforços,
   com valor, motivo, operador e quem autorizou).
3. Na aba Vendas: lista paginada com **Código `#N`** (número do turno, não
   UUID); a **lupa** abre o detalhe (informações com **Operador** e
   **Vendedor**, produtos e pagamentos).
4. No topo, o botão **Valores de fechamento** abre o comprovante da sessão.
5. Use **Voltar** para retornar à lista sem fechar o painel.

> Os dados vêm da `erp-api` (`/v1/pos-cash-sessions`). Os turnos são abertos e
> fechados no app PDV Flutter; esta tela é a visão gerencial no backoffice.
