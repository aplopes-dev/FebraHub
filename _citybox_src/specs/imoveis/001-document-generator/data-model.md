# Data model — 001-document-generator

Schema Postgres `imoveis`. IDs `@default(uuid())`, `storeId`, `@@map` snake_case.

## Enums

- `DocumentTemplateType`: `termo_visita` | `recibo_sinal` | `proposta_compra` | `proposta_locacao` | `contrato_promessa_compra_venda` | `contrato_locacao` | `outro`
- HTTP/UI: kebab-case (`termo-visita`, …)
- `GeneratedDocumentStatus`: `rascunho` | `gerado`

## DocumentTemplate

`storeId`, `nome`, `tipo`, `conteudoHtml` (Text), `ativo`, `isDefault`, timestamps.

No máximo um `isDefault=true` ativo por `(storeId, tipo)`.

## GeneratedDocument

`storeId`, `templateId`, `titulo`, `conteudoRender`, `dadosSnapshot` (Json), `objectKey`, `mimeType`, `status`, FKs opcionais: `leadId`, `dealId`, `propertyId`, `appointmentId`, `transactionId`.

## LeadDocument (extend)

`objectKey?`, `mimeType?`, `generatedDocumentId?`.

## MinIO keys

- `{storeId}/leads/{leadId}/documents/{documentId}.pdf` (e `.doc`/`.docx` no upload)
- `{storeId}/documents/{generatedId}.pdf` se não houver lead
