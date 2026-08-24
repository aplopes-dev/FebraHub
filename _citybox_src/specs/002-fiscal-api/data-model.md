# Phase 1 Data Model: fiscal-api

**Input**: [spec.md](./spec.md) Key Entities · [research.md](./research.md) §4, §6, §9

Convenções: todo `id` é `Uuid @default(dbgenerated("citybox_uuid_v7()"))` (Constitution V). Todos os modelos abaixo vivem no schema Prisma `fiscal` (datasource `schemas = ["fiscal"]`). Nomes de campo em `camelCase` no Prisma / `snake_case` nas colunas via `@map`, seguindo o padrão dos demais apps do monorepo.

## Visão geral das relações

```text
Company (Emitente) 1───1 Store (CityBox, referência externa por storeId)
Company 1───N Certificate
Company 1───N FiscalDocument
Company 1───N FiscalSequence
Customer N───1 Company (destinatário é sempre relativo a um emitente que já negociou com ele)
FiscalDocument N───1 Company
FiscalDocument N───0..1 Customer
FiscalDocument 1───N FiscalDocumentItem
FiscalDocument 1───N FiscalEvent
FiscalDocument 1───N ProviderRequest
```

## Enums

```prisma
enum DocumentType {
  NFE
  NFSE
}

enum ProviderType {
  SEFAZ_BA_NFE
  ILHEUS_METROPOLIS_NFSE
}

enum Environment {
  HOMOLOGATION
  PRODUCTION
}

/// Status unificado — nem todo status se aplica a todo DocumentType (ver §"Transições de Status").
enum FiscalDocumentStatus {
  DRAFT
  VALIDATING
  NUMBER_RESERVED
  XML_GENERATED
  SIGNED
  SENT
  PROCESSING
  AUTHORIZED
  REJECTED
  DENIED                        // NF-e apenas
  CANCEL_REQUESTED
  CANCEL_AUTHORIZED
  CANCEL_REJECTED
  CORRECTION_LETTER_AUTHORIZED  // NF-e apenas
  INUTILIZED                    // NF-e apenas (faixa de numeração, não um documento emitido)
  ERROR
  SYNC_REQUIRED
}

enum CertificateStatus {
  PENDING_VALIDATION
  VALID
  EXPIRED
  INVALID
  REVOKED
}

/// Discrimina o tipo de evento dentro de FiscalEvent — cobre cancelamento, carta de
/// correção e inutilização com uma única tabela genérica (ver research.md §3, adotando
/// o padrão fiscal_events do documento de referência em vez de 3 tabelas separadas).
enum FiscalEventType {
  ISSUE
  CANCEL
  CORRECTION_LETTER
  INUTILIZATION
  SYNC
}
```

## Company (Emitente)

Empresa em nome de quem os documentos fiscais são emitidos. Relação 1:1 com a Loja (Store) do CityBox — ver spec.md, Key Entities.

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `Uuid` | PK, `citybox_uuid_v7()` |
| `storeId` | `Uuid` | **Único** — garante 1 Loja : 1 Emitente (FK lógica para `Store` em `admin-api`, sem FK física entre schemas) |
| `cnpj` | `String` | Único, 14 dígitos, validado (dígito verificador) |
| `legalName` | `String` | Razão social |
| `tradeName` | `String?` | Nome fantasia |
| `stateRegistration` | `String?` | Inscrição estadual — obrigatória se `taxRegime` exigir para NF-e |
| `municipalRegistration` | `String?` | Inscrição municipal — obrigatória para emitir NFS-e |
| `taxRegime` | `String` | Regime tributário (ex.: `SIMPLES_NACIONAL`, `LUCRO_PRESUMIDO`, `LUCRO_REAL`) |
| `cityCodeIbge` | `String` | Código IBGE do município — obrigatório para NFS-e (FR-002 exige Ilhéus/BA: `2913606`) |
| `uf` | `String` | 2 letras |
| `address` | `Json` | Endereço completo (rua, número, bairro, CEP, etc.) |
| `defaultEnvironment` | `Environment` | Ambiente padrão de emissão — `HOMOLOGATION` no v1 (Assumptions do spec) |
| `active` | `Boolean` | `@default(true)` |
| `createdAt` / `updatedAt` | `DateTime` | |

**Validação (FR-002, spec Assumptions)**: emissão de NFS-e só é permitida quando `cityCodeIbge = '2913606'` (Ilhéus/BA) — validado na `nfse.use-case`, não no schema (município suportado é regra de negócio versionável, não uma constraint de banco).

## Certificate

Certificado digital A1 vinculado a um Emitente (US3, FR-007, FR-008).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `Uuid` | PK |
| `companyId` | `Uuid` | FK → `Company.id` |
| `type` | `String` | `@default("A1")` — só A1 no v1 |
| `name` | `String?` | Rótulo livre para o operador identificar |
| `encryptedPfxObjectKey` | `String` | Chave do objeto no MinIO (bucket `fiscal`) — o `.pfx` original, criptografado |
| `encryptedPassword` | `String` | Senha do certificado, criptografada em repouso (AES-256-GCM) — **nunca** decifrada fora do momento de assinatura; nunca exposta em resposta de API ou log (FR-007) |
| `subjectCnpj` | `String` | CNPJ extraído do certificado — deve bater com `Company.cnpj` |
| `validFrom` / `validUntil` | `DateTime` | Extraídos do certificado no upload |
| `status` | `CertificateStatus` | |
| `createdAt` | `DateTime` | |

**Validação**:
- Upload rejeitado (sem persistir) se: assinatura binária não é PKCS#12 válida, senha incorreta, certificado expirado, ou `subjectCnpj != Company.cnpj` (US3 cenário 2, SC-006).
- No máximo um certificado com `status = VALID` por `companyId` em um dado momento — emitir com um certificado `EXPIRED`/`INVALID`/`REVOKED` é bloqueado (FR-008).
- Job periódico (fora do escopo de código deste plano, mas o campo `validUntil` já sustenta) sinaliza expiração próxima (US3 cenário 3).

## Customer (Destinatário/Tomador)

Parte que recebe o produto (NF-e) ou o serviço (NFS-e).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `Uuid` | PK |
| `companyId` | `Uuid` | FK → `Company.id` (destinatário é sempre relativo a um emitente) |
| `documentType` | `String` | `CPF` \| `CNPJ` |
| `document` | `String` | 11 ou 14 dígitos conforme `documentType`, validado (dígito verificador) |
| `name` | `String` | |
| `email` / `phone` | `String?` | |
| `stateRegistration` / `municipalRegistration` | `String?` | |
| `address` | `Json` | Mesma forma de `Company.address` |
| `createdAt` | `DateTime` | |

## FiscalDocument

Entidade base de NF-e ou NFS-e (spec.md, Key Entities — "Documento Fiscal").

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `Uuid` | PK |
| `companyId` | `Uuid` | FK → `Company.id` |
| `customerId` | `Uuid?` | FK → `Customer.id` |
| `documentType` | `DocumentType` | `NFE` \| `NFSE` |
| `provider` | `ProviderType` | Resolvido pelo `FiscalProviderFactory` a partir de `documentType` + `Company.cityCodeIbge` |
| `environment` | `Environment` | Copiado de `Company.defaultEnvironment` no momento da criação |
| `status` | `FiscalDocumentStatus` | Ver "Transições de Status" abaixo |
| `sourceSystem` | `String` | Identificador lógico do sistema chamador (ex.: `erp`, `pdv`) — nunca hardcoded na API (spec Assumptions) |
| `externalReference` | `String` | Referência do documento no sistema chamador |
| `idempotencyKey` | `String` | Ver "Idempotência" abaixo |
| `series` / `number` | `String?` | Reservados via `FiscalSequence` (NF-e) |
| `rpsSeries` / `rpsNumber` | `String?` | NFS-e Ilhéus |
| `accessKey` | `String?` | Chave de acesso (NF-e) |
| `verificationCode` | `String?` | Código de verificação (NFS-e) |
| `protocol` | `String?` | Protocolo retornado pelo órgão |
| `totalAmount` | `Decimal(15,2)` | Soma de `FiscalDocumentItem.totalValue` |
| `xmlObjectKey` | `String?` | Chave do XML autorizado no MinIO |
| `errorCode` / `errorMessage` | `String?` | Preenchido em `REJECTED`/`DENIED`/`ERROR` |
| `issuedAt` / `authorizedAt` / `cancelledAt` | `DateTime?` | |
| `createdAt` / `updatedAt` | `DateTime` | |

**Índice único de idempotência (FR-013, SC-007)**: `@@unique([sourceSystem, externalReference, documentType, idempotencyKey])`. Uma requisição repetida com a mesma combinação retorna o `FiscalDocument` já existente em vez de criar outro (research.md, alinhado a `packages/docs/fiscal/api_fiscal_completa.md` §22).

### Transições de status (state machine)

```text
DRAFT → VALIDATING → NUMBER_RESERVED → XML_GENERATED → SIGNED → SENT → PROCESSING
PROCESSING → AUTHORIZED | REJECTED | DENIED | SYNC_REQUIRED
AUTHORIZED → CANCEL_REQUESTED → CANCEL_AUTHORIZED | CANCEL_REJECTED
AUTHORIZED → CORRECTION_LETTER_AUTHORIZED   (NF-e apenas, não muda o status "principal" — registrado via FiscalEvent)
<qualquer status anterior a AUTHORIZED> → ERROR   (falha de validação, XML, assinatura ou transmissão)
```

`INUTILIZED` não é um status de `FiscalDocument` — é o resultado de uma `FiscalEvent(type=INUTILIZATION)` sobre uma faixa de `FiscalSequence`, sem um documento correspondente (não existe "documento" para uma numeração nunca usada).

**Validação de transição (FR-004, edge case "cancelamento fora do prazo")**: `CANCEL_REQUESTED` só é aceito a partir de `AUTHORIZED` e dentro da janela legal (calculada a partir de `authorizedAt`, valor configurável por `documentType`, não hardcoded — spec Assumptions).

## FiscalDocumentItem

Linha de produto (NF-e) ou serviço (NFS-e) — spec.md, Key Entities "Item/Serviço".

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `Uuid` | PK |
| `fiscalDocumentId` | `Uuid` | FK → `FiscalDocument.id`, `onDelete: Cascade` |
| `description` | `String` | |
| `quantity` | `Decimal(15,4)` | > 0 |
| `unitValue` | `Decimal(15,4)` | ≥ 0 |
| `totalValue` | `Decimal(15,2)` | = `quantity * unitValue` (validado na aplicação, não trigger de banco) |
| `itemType` | `String` | `PRODUCT` \| `SERVICE` (v1 — sem `FEE_REIMBURSEMENT`/`THIRD_PARTY_SERVICE` do doc de referência, fora de escopo) |
| `ncm` / `cfop` / `cst` / `csosn` | `String?` | Campos de NF-e — obrigatórios quando `FiscalDocument.documentType = NFE` |
| `serviceCode` | `String?` | Código de serviço municipal — obrigatório quando `documentType = NFSE` |
| `taxJson` | `Json?` | Tributos já calculados, enviados prontos pelo sistema chamador (FR-016 — fiscal-api não computa tributo no v1, Tax Reform Engine fora de escopo) |

**Validação (FR-001/FR-002/US1 cenário 2)**: um `FiscalDocument` sem ao menos 1 item, ou com item sem `totalValue`, é rejeitado em `VALIDATING` antes de qualquer reserva de numeração ou transmissão.

## FiscalEvent

Registra cancelamento, carta de correção e inutilização de um `FiscalDocument` — uma única tabela genérica em vez de 3 entidades separadas (research.md §3, mesmo padrão do documento de referência).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `Uuid` | PK |
| `fiscalDocumentId` | `Uuid` | FK → `FiscalDocument.id` |
| `eventType` | `FiscalEventType` | |
| `sequence` | `Int?` | Sequência do evento (relevante para carta de correção — pode haver mais de uma) |
| `status` | `String` | Espelha o resultado desse evento específico (ex.: `AUTHORIZED`, `REJECTED`) |
| `justification` | `String?` | Obrigatório para `CANCEL` e `INUTILIZATION` (FR-004, FR-006) |
| `correctionText` | `String?` | Obrigatório para `CORRECTION_LETTER` (FR-005) |
| `protocol` | `String?` | Protocolo de transmissão desse evento |
| `requestXmlObjectKey` / `responseXmlObjectKey` | `String?` | MinIO |
| `createdAt` | `DateTime` | |

**Validação (FR-005, edge case "campo não corrigível")**: a lista de campos passíveis de carta de correção é uma regra de negócio versionada na camada de aplicação (não no schema) — o schema só garante que `correctionText` existe quando `eventType = CORRECTION_LETTER`.

## FiscalSequence

Controle de número/série por Emitente + tipo de documento + ambiente (necessário para FR-001/FR-002 emitirem números válidos; não é uma entidade citada explicitamente no spec, mas é pré-requisito técnico direto dela).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `Uuid` | PK |
| `companyId` | `Uuid` | FK → `Company.id` |
| `documentType` | `DocumentType` | |
| `series` | `String` | |
| `currentNumber` | `BigInt` | Incrementado atomicamente (transação Prisma) a cada reserva |
| `environment` | `Environment` | |
| `active` | `Boolean` | `@default(true)` |

`@@unique([companyId, documentType, series, environment])`.

## FiscalEvent de inutilização vs. `FiscalSequence`

`FiscalEvent(eventType=INUTILIZATION)` referencia uma faixa (`justification` + campos de início/fim de numeração, carregados em `responseXmlObjectKey`/`protocol` após confirmação) sobre uma `FiscalSequence` — sem exigir que exista um `FiscalDocument` para cada número inutilizado (FR-006, edge case "faixa já usada" é validado comparando contra `FiscalDocument.number` já emitidos naquela faixa antes de aceitar o pedido).

## ProviderRequest

Log de auditoria de toda tentativa de transmissão a um provider externo (FR-011) — distinto de `FiscalEvent` (que é o resultado de negócio); `ProviderRequest` é o log técnico bruto de cada chamada, incluindo tentativas de emissão inicial (não só eventos pós-emissão).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `Uuid` | PK |
| `fiscalDocumentId` | `Uuid?` | FK → `FiscalDocument.id` (nulo só é possível para operações sem documento ainda criado, ex.: consulta de status do serviço) |
| `provider` | `ProviderType` | |
| `operation` | `String` | `ISSUE` \| `CANCEL` \| `CONSULT` \| `CORRECTION_LETTER` \| `INUTILIZE` \| `SYNC_STATUS` |
| `requestXmlObjectKey` / `responseXmlObjectKey` | `String?` | MinIO |
| `requestPayload` / `responsePayload` | `Json?` | Corpo não-XML (ex.: metadados HTTP, cabeçalhos SOAP) — nunca inclui senha de certificado |
| `status` | `String` | `SUCCESS` \| `ERROR` \| `TIMEOUT` |
| `errorMessage` | `String?` | |
| `createdAt` | `DateTime` | |

**Retenção**: sem expurgo automático no v1 — auditoria fiscal deve ser durável (FR-010, FR-011).

## Regras de validação cruzando entidades (resumo)

| Regra | Origem | Onde é aplicada |
|---|---|---|
| Emissão exige certificado `status = VALID` e não expirado | FR-008 | `application/use-cases/issue-*` antes de chamar o provider |
| NFS-e só para `Company.cityCodeIbge = '2913606'` | FR-002 | `nfse.use-case`, antes de resolver o provider |
| XML deve validar contra o XSD oficial antes de qualquer envio | FR-009 | `shared/infra/fiscal-xml` (chamado pelo provider antes do `soap`/HTTP client) |
| Idempotência por `(sourceSystem, externalReference, documentType, idempotencyKey)` | FR-013 | constraint de banco + checagem no use-case (retorna o existente em vez de 409) |
| Cancelamento só dentro do prazo legal | FR-004 | `application/use-cases/cancel-*`, calculado a partir de `authorizedAt` |
| Acesso aos dados de um Emitente restrito a quem tem permissão sobre ele | FR-014 | `PermissionGuard` + `@CompanyId()` (shared/infra/http) |
