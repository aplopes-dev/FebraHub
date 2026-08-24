# Categorias de movimentação — roteiro de testes manuais

Pré-requisitos: API + web no ar; usuário com permissão de estoque; unidade ativa.

## Listagem (`/estoque/categorias-de-movimentacao`)

1. Abrir a lista — categorias da API (`isSystem` + customizadas).
2. Buscar por código/nome (debounce ~400ms); filtrar por Tipo (entrada/saída).
3. Paginação server-side; `ListLoadErrorAlert` se a API falhar.

## Criar / editar (drawer)

1. Nova categoria — Nome (max 60), Tipo, unidades; código `CM-NNN` gerado no backend; Salvar com loading.
2. Editar customizada — persiste no próximo GET.
3. Excluir customizada — some da lista; categoria `isSystem` tem exclusão desabilitada com caption.

## Regressão rápida

- Form de movimentações (`/estoque/movimentacoes/novo`) lista a categoria nova em `/options?type=`.
- Sem dependência de `mock-movement-category-options`.
