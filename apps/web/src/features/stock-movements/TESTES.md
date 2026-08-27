# Movimentações de estoque — roteiro de testes manuais

Pré-requisitos: API + web no ar; depósito e produtos com `trackStock` no seed; unidade ativa.

## Listagem (`/estoque/movimentacoes`)

1. Abrir a lista — tabs (todas/entrada/saída) com `tabCounts` da API.
2. Buscar (debounce ~400ms) e paginar — server-side.
3. Abrir drawer de detalhe — linhas, categoria, depósito e usuário.

## Registrar (`/estoque/movimentacoes/novo`)

1. Deep link `?type=entrada&estoque=<id>` pré-preenche tipo e depósito.
2. Escolher categoria (`/v1/movement-categories/options?type=`), produtos `trackStock`, quantidades.
3. Salvar — toast sem “(mock)”; lista atualiza; balanço do depósito reflete a quantidade.
4. Saída com saldo insuficiente — erro da API (não inventário fictício).

## Regressão rápida

- Coluna estoque no form usa balanço do depósito selecionado.
- Categorias de sistema e customizadas aparecem nas options.
