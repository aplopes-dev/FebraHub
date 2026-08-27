# Depósitos (estoque) — roteiro de testes manuais

Pré-requisitos: API (:3114) e `erp-web` (:3107) no ar; seed aplicado; usuário logado com empresa e unidade ativas.

## Listagem (`/estoque`)

1. Abrir a lista — depósitos da API (não mock), DataTable com paginação server-side.
2. Buscar por nome (debounce ~400ms) e paginar — só a página atual vem da API.
3. Confirmar atalhos: Registrar entrada/saída → `/estoque/movimentacoes/novo?type=&estoque=`; Balanço → `/estoque/[id]/balanco`; Inventários → `/estoque/[id]/inventario`.

## Criar / editar

1. Novo depósito — preencher nome + unidades; salvar com loading; toast de sucesso.
2. Editar um depósito existente — valores persistem no próximo GET.
3. Tentar excluir depósito padrão (`isDefault`) ou com movimentações (`hasMovements`) — deve bloquear conforme API.

## Balanço (`/estoque/[id]/balanco`)

1. Abrir balanço — saldos via `GET /v1/stocks/:id/balance` (busca + filtro status + paginação).
2. Abrir histórico de um produto (drawer) — linhas da API.

## Regressão rápida

- Produtos com `trackStock` refletem alteração após entrada/saída.
- Sem uso de `stock.service` / `stock-balance.service` mock.
