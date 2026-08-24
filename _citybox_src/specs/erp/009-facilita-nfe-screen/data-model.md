# Data Model — Tela Facilita NFE (aba "Emitido")

Nenhum schema Prisma novo. Esta feature só **lê** dados que já existem em
`services/fiscal-api` (`fiscal-documents`, `companies`) — ver `research.md` §3 para os
dois pontos de extensão de API (não de schema).

## FiscalDocumentListItem (view do frontend)

Projeção de `FiscalDocument` (fiscal-api) consumida pela tabela "Emitido". Vem de
`GET /v1/fiscal-documents` já hoje — sem campo novo de schema.

| Campo | Tipo | Origem | Coluna na UI |
|---|---|---|---|
| `id` | `string` (uuid v7) | `FiscalDocument.id` | — (chave de linha / link) |
| `documentType` | `'NFE' \| 'NFSE' \| 'NFCE'` | `FiscalDocument.documentType` | Modelo |
| `status` | `FiscalDocumentStatus` | `FiscalDocument.status` | Status |
| `series` | `string \| null` | `FiscalDocument.series` | Série |
| `number` | `string \| null` | `FiscalDocument.number` | Número |
| `totalAmount` | `number` (centavos) | `FiscalDocument.totalAmount` | Valor |
| `issuedAt` | `Date \| null` | `FiscalDocument.issuedAt` | Data de emissão |
| `customerName` | `string \| null` | `FiscalDocument.customerId` → `Customer.name` (já resolvido pelo presenter atual, `FiscalDocumentPresenter`) | Cliente |

### Regras de validação (leitura, não há escrita nesta feature)

- `status` fora de `FISCAL_DOCUMENT_STATUSES` (não deveria acontecer, mas a UI trata
  defensivamente): exibido como veio da API, sem quebrar a linha (Edge Case da spec).
- `customerName` nulo (documento sem destinatário identificado, ex.: NFC-e a consumidor
  não identificado): coluna Cliente exibe "Consumidor não identificado".

## FiscalDocumentSummary (novo — endpoint `GET /v1/fiscal-documents/summary`)

| Campo | Tipo | Cálculo |
|---|---|---|
| `total` | `number` | `count()` de todos os documentos do filtro ativo |
| `authorized` | `number` | `count()` com `status = 'AUTHORIZED'` |
| `cancelled` | `number` | `count()` com `status = 'CANCEL_AUTHORIZED'` |

`manifestedFinal`/`unmanifested` **não existem neste DTO** — os cards correspondentes na
UI são sempre renderizados com valor fixo `0` e estado visual "não aplicável" (ver
`research.md` §3.3), sem campo de backend por trás.

## FacilitaNfeIssuedFilters (estado de UI, client-side)

| Campo | Tipo | Default | Vai para a API como |
|---|---|---|---|
| `search` | `string` | `""` | `search` (debounce 400ms) |
| `status` | `FiscalDocumentStatus \| null` | `null` | `status` |
| `documentType` | `FiscalDocumentType \| null` | `null` | `documentType` |
| `page` | `number` | `1` | `page` |
| `perPage` | `number` | `10` | `perPage` |

Todo o filtro é resolvido no backend (`GET /v1/fiscal-documents` + `.../summary`) —
nenhum filtro/ordenação client-side sobre o array retornado (Constitution Princípio II).
