# Produção — roteiro de testes manuais

Pré-requisitos: API + web no ar; ficha técnica `productive_process` com insumos; depósitos e saldos de insumos suficientes.

## Pedido de produção (`/estoque/pedido-producao`)

1. Listar pedidos — API, busca/paginação server-side.
2. Novo pedido (`/novo`) — produto acabado, quantidade, depósitos; salvar.

## Produção / finalização (`/estoque/producao`, `/estoque/finalizacao`)

1. Avançar pedido para produção conforme UI.
2. Finalizar — consome insumos (`consumo-interno`) e gera entrada do acabado (`entrada-avulsa`) via BOM da ficha.
3. Conferir balanços: insumos ↓, produto ↑; histórico de produção com comentário se aplicável.

## Regressão rápida

- Cancelar pedido aberto não altera estoque.
- Ficha sem insumos / saldo insuficiente — erro claro da API.
- Sem `createStockMovement` mock local.
