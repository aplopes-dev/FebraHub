# Inventários — roteiro de testes manuais

Pré-requisitos: API + web no ar; depósito com saldos; unidade ativa.

## Listagem (`/estoque/[stockId]/inventario`)

1. Abrir inventários do depósito — API, busca e paginação server-side.
2. Conferir status (aberto/finalizado) e datas.

## Novo inventário (`…/inventario/novo`)

1. Iniciar contagem — produtos do depositário com quantidade sistema preenchida.
2. Informar quantidades contadas; salvar rascunho se aplicável.
3. Finalizar — ajusta saldos (diferença gera movimento); status finalizado.

## Detalhe (`…/inventario/[inventoryId]`)

1. Reabrir inventário finalizado — linhas e diferenças somente leitura.
2. Inventário aberto — permitir editar contagem e finalizar.

## Regressão rápida

- Balanço do depósito bate com as quantidades após finalizar.
- Produtos sem `trackStock` não entram na contagem.
