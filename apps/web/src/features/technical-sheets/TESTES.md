# Fichas técnicas — roteiro de testes manuais

Pré-requisitos: API + web no ar; produtos (acabado + insumos) no catálogo; unidade ativa.

## Listagem (Catálogo → Fichas técnicas)

1. Abrir a lista — fichas da API; busca debounce ~400ms; paginação server-side.
2. Filtrar por tipo de produção se a UI expuser o filtro.

## Criar / editar

1. Nova ficha — vincular produto acabado, tipo, linhas de insumos (produto + qty).
2. Salvar — loading; toast; reabrir e conferir BOM persistido.
3. Editar quantidade de insumo — upsert atualiza; produção subsequente usa BOM ao vivo.

## Regressão rápida

- Produção finalize consome exatamente as quantidades da ficha vigente.
- Produto sem ficha não finaliza produção que exige BOM.
