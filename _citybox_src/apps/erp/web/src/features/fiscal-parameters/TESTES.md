# Parâmetros fiscais — roteiro de testes manuais

Pré-requisitos: `erp-api` (:3114) e `erp-web` (:3107) no ar; seed aplicado; usuário logado com organização ativa.

## Listagem (`/catalogo/parametros-fiscais`)

1. Abrir a lista — deve carregar produtos da API (não mock) com badges Configurado/Pendente.
2. Conferir tabs **Todos** / **Pendentes** e contadores (`tabCounts` do backend).
3. Buscar por nome/SKU (debounce ~400ms) e paginar — só a página atual vem da API.
4. Filtrar por categoria (toolbar) e por status no drawer de filtros.
5. Ordenar por nome/categoria — a ordenação é server-side.
6. Clicar numa linha → detalhe `/catalogo/parametros-fiscais/[productId]`.

## Detalhe / salvar

1. Abrir um produto **pendente** — formulário vazio (ou defaults vazios) com unidades = branches reais da org.
2. Preencher NCM + Origem + tributos; salvar — toast de sucesso (sem “(mock)”); botão Salvar com loading.
3. Voltar à lista — o produto deve aparecer como **Configurado**.
4. Reabrir o detalhe — valores persistidos.
5. Desmarcar “Todas as unidades” em CFOP, definir override numa unidade, salvar; reabrir e conferir override.
6. Remarcar applyToAll e salvar — overrides daquele tributo devem sumir no próximo GET.
7. Produto inexistente → empty state “Produto não encontrado”.

## Regressão rápida

- Lista de produtos e listas de preço continuam ok.
- Sem dependência de `MOCK_STORES` na tela fiscal.
