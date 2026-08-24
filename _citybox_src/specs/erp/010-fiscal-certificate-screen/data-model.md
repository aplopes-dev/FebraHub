# Data Model (UI) — Tela Fiscal (Certificado A1)

Não há schema novo. São **modelos de UI** e o **mapeamento filial → payload de Emitente**.

## Certificado (view model)

Origem: `GET /companies/{companyId}/certificates` + `GET /certificates/{id}/status`.

| Campo (UI) | Origem | Notas |
|------------|--------|-------|
| id | certificate.id | |
| name | certificate.name | apelido opcional |
| subjectCnpj | certificate.subjectCnpj | CNPJ do titular |
| validFrom / validUntil | certificate.validFrom/validUntil | validade de/até |
| status | certificate.status | PENDING_VALIDATION \| VALID \| EXPIRED \| INVALID \| REVOKED |
| daysUntilExpiration | `/status` | dias restantes |
| createdAt | certificate.createdAt | data de envio |
| **isCurrent** (derivado) | VALID mais recente por `validUntil`/`createdAt` | não há flag `active` no schema |
| **expiresSoon** (derivado) | `daysUntilExpiration ≤ 30 && > 0` && VALID | FR-016 |
| **isExpired** (derivado) | status EXPIRED ou `validUntil < hoje` | FR-016 |

Regra: **vigente = VALID mais recente**. Histórico = todos os não-vigentes (somente leitura).

## Emitente (Company) — provisionamento a partir da filial matriz

Payload de `POST /v1/companies` (campos exigidos em create-company.dto.ts):

| Campo fiscal | Fonte (filial matriz / org) | Regra |
|--------------|------------------------------|-------|
| storeId | `organization.platformStoreId` | **null → bloqueia** (FR-007) |
| cnpj | `branch.document` | matriz (`isHeadquarters:true`) |
| legalName | `branch.legalName` | obrigatório |
| tradeName | `branch.tradeName` | opcional |
| stateRegistration | `branch.stateRegistration` | opcional |
| municipalRegistration | `branch.municipalRegistration` | opcional |
| taxRegime | `branch.taxRegime` → map | MEI/ISENTO → **bloqueia** (FR-008) |
| cityCodeIbge | `ibgeLookup(branch.city, branch.state)` | par ausente → **bloqueia** (FR-009) |
| uf | `branch.state` | obrigatório (2) |
| address.street | `branch.street` | obrigatório → falta → bloqueia (FR-009) |
| address.number | `branch.number` | obrigatório → falta → bloqueia |
| address.complement | `branch.complement` | opcional |
| address.district | `branch.neighborhood` | obrigatório → falta → bloqueia |
| address.city | `branch.city` | obrigatório → falta → bloqueia |
| address.zipCode | `branch.zipCode` | obrigatório (min 8) → falta → bloqueia |
| defaultEnvironment | fixo `HOMOLOGATION` | FR-006 |

**Validação pré-envio (frontend)**: reunir todos os campos faltantes/incompatíveis e produzir
**uma** mensagem por família (FR-009/FR-008/FR-007), dizendo o quê e onde corrigir — antes de
chamar a API.

## Estados da tela (máquina simples)

| Estado | Condição | UI |
|--------|----------|-----|
| Loading | queries carregando | skeleton |
| StoreNotEnabled | `platformStoreId == null` | aviso "loja não habilitada" (sem upload) |
| EmptyNoCompany | sem Emitente | card vazio + "Inserir certificado" (provisiona no envio) |
| EmptyWithCompany | Emitente existe, 0 certificados | card vazio + "Inserir certificado" |
| WithCurrent | ≥1 certificado | card do vigente + histórico |
| Error | falha de carga | alerta de erro com retry |

## Famílias de erro (tradução → mensagem de negócio) — FR-012

| Família | Gatilho | Mensagem (essência) |
|---------|---------|---------------------|
| Arquivo/senha ausente | validação client | "Selecione o arquivo e informe a senha." (400) |
| Arquivo inválido | extensão≠pfx/p12, vazio, >10MB, assinatura | "Arquivo inválido: envie um .pfx/.p12 de até 10 MB." |
| Senha/parse | 422 senha incorreta/corrompido/expirado | "Senha incorreta ou certificado inválido/expirado." |
| CNPJ divergente | CNPJ do cert ≠ CNPJ do Emitente | "O certificado é do CNPJ X, mas o Emitente é o CNPJ Y." |
| Provisionamento | dado faltante na matriz / regime / storeId | mensagem específica de D1/D2/D3 dizendo o quê e onde |

Nenhuma mensagem expõe stack/HTTP cru (FR-013).
