# Transportadoras — roteiro de testes manuais

Pré-requisitos: API + web no ar; empresa ativa.

## Listagem (`/estoque/transportadoras`)

1. Abrir a lista — dados da API; busca debounce ~400ms; paginação server-side.
2. Clicar numa linha → detalhe/edição `/estoque/transportadoras/[id]`.

## Criar / editar

1. Nova (`/estoque/transportadoras/novo`) — preencher dados obrigatórios; salvar com loading.
2. Reabrir — valores persistidos.
3. Excluir (se permitido) — some da listagem.

## Regressão rápida

- Compras / recebimento que referenciam transportadora ainda listam a criada.
- Sem store mock local na feature.
