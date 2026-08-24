# Quickstart — Validar a aba "Emitido" da tela Facilita NFE

## Pré-requisitos

- `pnpm infra:up` (Postgres, Keycloak, etc. — ver `infra/AGENTS.md`)
- `fiscal-api` com um `Company` cadastrado (`storeId` da loja de teste, CNPJ conhecido) e
  pelo menos 2-3 `FiscalDocument` emitidos com status variados (`AUTHORIZED`,
  `CANCEL_AUTHORIZED`, algum outro) — usar os fixtures/testes de
  `specs/002-fiscal-api/` ou emitir via `POST /v1/nfe`/`POST /v1/nfce` em homologação
- `erp-web` e `fiscal-api` rodando localmente:
  ```bash
  pnpm --filter @citybox/fiscal-api dev   # :3116
  pnpm --filter @citybox/erp-web dev      # :3107
  ```
- Usuário logado no `erp-web` com organização cujo CNPJ bate com o `Company.cnpj` de
  teste, e role/escopo Keycloak com `fiscal.documents.view` no client `citybox-backoffice`

## Cenário 1 — Lista carrega e cards batem com o backend

1. Acessar `financas/facilita-nfe`, aba "Emitido" (padrão ao abrir a tela).
2. **Esperado**: tabela lista os documentos emitidos da organização ativa; cards "Total"/
   "Autorizadas"/"Canceladas" batem com a contagem real (conferir via
   `GET /v1/fiscal-documents/summary?companyId=...` direto, ex. `curl`/Swagger em
   `/api/v1/docs`); "Manifestações finais"/"Não manifestadas" aparecem zerados e
   marcados como não aplicáveis (ver `research.md` §3.3).

## Cenário 2 — Busca é backend-driven

1. Digitar um número de documento existente no campo "Buscar por".
2. Abrir as DevTools → Network: **esperado** uma única request (após ~400ms de debounce)
   para `GET /v1/fiscal-documents?...&search=<termo>` — não deve haver o conjunto
   completo sendo baixado e filtrado no cliente.
3. **Esperado**: tabela e cards atualizam para refletir só o resultado da busca.

## Cenário 3 — Filtro por status

1. Abrir o painel de filtro, selecionar um status (ex.: "Cancelada").
2. **Esperado**: tabela e cards refletem só documentos com aquele status; a query string
   da request de summary/list inclui `status=CANCEL_AUTHORIZED`.

## Cenário 4 — Paginação

1. Com mais documentos que o tamanho de página padrão, navegar para a página 2 na tabela.
2. **Esperado**: nova request com `page=2`; a tabela não re-renderiza dados já vistos na
   página 1 (sem duplicar/perder linhas).

## Cenário 5 — Estado vazio

1. Trocar para uma organização/loja sem nenhum documento fiscal emitido (ou sem
   `Company` cadastrado na `fiscal-api`).
2. **Esperado**: tabela mostra "Sem dados no momento", cards em 0 — sem erro no console.

## Cenário 6 — Falha da `fiscal-api`

1. Derrubar `fiscal-api` (`Ctrl+C` no processo `dev`) e recarregar a aba "Emitido".
2. **Esperado**: mensagem de erro amigável na aba (não a tela inteira quebrada); navegar
   para "Recebido"/"Histórico de Envios" continua funcionando (placeholders).

## Cenário 7 — Abas fora de escopo continuam navegáveis

1. Clicar em "Recebido" e depois em "Histórico de Envios".
2. **Esperado**: ambas abrem, mostram "Sem dados no momento" e cards zerados, controles
   de busca/filtro desabilitados ou ocultos, sem chamada de rede para dados desses
   recursos (FR-001/FR-006/FR-008).

## Cenário 8 — Item de menu deixou de estar desabilitado

1. Abrir o painel "Finanças" no rail do `erp-web`.
2. **Esperado**: "Facilita NF-e" (grupo NOTAS FISCAIS) está clicável (não mais opaco) e
   aparece no ⌘K; o item equivalente em Estoque (`/estoque/facilita-nfe`, "NF-e de
   entrada") continua desabilitado — não faz parte desta feature.
