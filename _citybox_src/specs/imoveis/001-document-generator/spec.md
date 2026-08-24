# Feature Specification: Gerador de documentos imobiliários

**Feature Branch**: `001-document-generator`

**Created**: 2026-08-19

**Status**: Draft

**Input**: Modelos HTML com `{{tags}}` na loja, merge no servidor e PDF sem Chromium, emitindo a partir da ficha do lead, da agenda e do negócio.

## Escopo desta fase

Fase 1+2 da vertical Imóveis (`imoveis-api` + `imoveis-web`):

- CRUD de **modelos da loja** em Configurações (`?section=templates`).
- Merge Handlebars no servidor + PDF via `html-to-pdfmake` + `pdfmake` (sem Chromium).
- Emitir na **ficha do lead**, **agenda** (termo de visita) e **negócio** (recibo/proposta).
- Persistir PDF no MinIO e anexar em `LeadDocument` (com `object_key`).
- Contrato (`kind=contract` + imóvel matched) avança o funil para `contract_sent` via `SyncActiveDealForLeadUseCase`.
- Upload manual do lead também grava no MinIO (unifica `objectKey`).

**Fora de escopo:** Puppeteer/Chromium, ZapSign/ClickSign, item no pill do header, subject CASL `Document`, texto jurídico completo nos seeds.

## User Scenarios & Testing

### User Story 1 — Modelos da loja (P1)

O admin edita modelos HTML com chips `{{lead.nome}}` etc. em Configurações → Modelos.

**Acceptance:** listar/criar/editar/desativar; preview interpola sem persistir; catálogo de variáveis é fixo.

### User Story 2 — Gerar contrato na ficha (P1)

Na aba Documentos do lead, “Gerar a partir de modelo” (tipos contrato/outro). PDF anexa como `kind=contract` e, com imóvel matched, o deal vai para `contract_sent`.

### User Story 3 — Termo de visita (P2)

No sheet do compromisso, gerar `termo-visita` se houver `leadId`. Anexa como `kind=other` (não move funil).

### User Story 4 — Recibo/proposta no negócio (P2)

No detalhe da transação, gerar recibo ou proposta (venda vs locação). Anexa no lead se `leadId` existir (`kind=other`).

### User Story 5 — Upload persistente (P1)

Upload PDF/DOC na ficha persiste no MinIO; após reload o arquivo abre no viewer autenticado.
