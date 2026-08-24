# Contracts — Tela Fiscal (Certificado A1)

## Consumidos da `services/fiscal-api` (:3116) — IMUTÁVEIS nesta entrega

Via proxy same-origin `/api/proxy/fiscal/*` (isola por `companyId` explícito; sem headers de escopo).

### POST /api/v1/companies
Perm `fiscal.companies.manage`. Body (JSON):
```
{ storeId, cnpj, legalName, tradeName?, stateRegistration?, municipalRegistration?,
  taxRegime: 'SIMPLES_NACIONAL'|'LUCRO_PRESUMIDO'|'LUCRO_REAL',
  cityCodeIbge (7), uf (2),
  address: { street, number, complement?, district, city, zipCode (≥8) },
  defaultEnvironment?: 'HOMOLOGATION'|'PRODUCTION' }
```
Resposta 201: `CompanyPresenter.toHttp(company)` = **`{ data: { id, … } }`** (envelopado, igual às demais rotas — verificado em `company.presenter.ts`). Ler `res.data.id`.
Erros: `CnpjAlreadyRegisteredError`, `StoreAlreadyHasCompanyError` (409-ish → tratar como "já existe").

### POST /api/v1/companies/{companyId}/certificates
Perm `fiscal.certificates.manage`. `multipart/form-data`: `file` (.pfx|.p12, ≤10MB), `password` (obrigatório), `name?`.
201 → `{ data: { id, companyId, type, name, subjectCnpj, validFrom, validUntil, status, createdAt } }`.
Erros: 400 (arquivo/senha ausente); 422 (extensão/tamanho/assinatura/senha/parse/CNPJ divergente).
Nunca devolve senha nem chave de armazenamento.

### GET /api/v1/companies/{companyId}/certificates
Perm `fiscal.certificates.manage`. → `{ data: [ …certificate ] }`.

### GET /api/v1/certificates/{id}/status
→ `{ data: { status, validUntil, daysUntilExpiration } }`.

### GET /api/v1/companies?cnpj={cnpj}
Resolve o Emitente pelo CNPJ (usado por `useFiscalCompany`). Sem match → sem Company.

## Da `erp-api` (:3114) — via `/api/proxy/comercio/*`

### GET /v1/branches (existente)
Lista filiais; matriz = `isHeadquarters:true`. Traz document, legalName, tradeName, stateRegistration, municipalRegistration, taxRegime, endereço (zipCode/street/number/complement/neighborhood/city/state).

### GET /v1/organizations/current (existente) — **MUDANÇA**
Adicionar `platformStoreId` ao `OrganizationPresenter.toHttp` (organization.presenter.ts) e ao tipo/DTO consumido no erp-web.
Antes: `{ id, personType, document, legalName, tradeName, displayName, email, phone, responsible{…}, status, createdAt, updatedAt }`
Depois: **+ `platformStoreId: string | null`**.

## Cliente novo no erp-web

`fiscalUpload<T>(path, formData, init?)` em `lib/api/fiscal-client.ts` — multipart sem `Content-Type` manual (browser injeta boundary), via `fetchWithSession`, mesmo `extractErrorMessage`. Espelha `comercioUpload`.
