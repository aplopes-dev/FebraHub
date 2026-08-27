# Compras — roteiro de testes manuais

Pré-requisitos: API + web no ar; fornecedor + depósito + produtos `trackStock` no seed.

## Listagem (`/estoque/compras`)

1. Abrir a lista — pedidos da API (não mock); tabs/status se houver; busca debounce ~400ms; paginação server-side.
2. Abrir um pedido existente — detalhe com linhas e totais.

## Novo pedido (`/estoque/compras/novo`)

1. Selecionar fornecedor, depósito, produtos e quantidades/custos.
2. Salvar pedido (rascunho/aberto conforme fluxo).
3. Receber / finalizar — entrada no depósito e histórico de movimentação coerentes.

## Regressão rápida

- Toast sem “(mock)”; botões com `loading` em mutations.
- Lista de produtos no form só com controle de estoque quando a API exige.
