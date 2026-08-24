# Research & Decisions — Tela Fiscal (Certificado A1)

Cada decisão: **Decisão / Motivo / Alternativas consideradas / Evidência no código**.

## D0 — Harness de teste do `apps/erp/web` (bloqueio descoberto → decisão do usuário: **só backend testado**)

- **Decisão (usuário, 2026-08-12, vale para as 11 features)**: **NÃO** bootstrapar harness de teste de frontend agora. Testar apenas a mudança de **backend** (presenter `platformStoreId`, erp-api já tem Node test runner). O frontend é entregue **sem testes automatizados**, com o gap documentado na conferência (Camada C/D com ressalva) — mesmo padrão da feature 009.
- **Motivo**: o pacote `apps/erp/web` **não tem harness nenhum** e bootstrapá-lo (Next 16 + React 19 + transpile MUI no Vitest) é decisão de escopo do pacote inteiro; o usuário optou por não pagar esse custo agora e priorizar avançar na fila.
- **Consequência**: a seção TESTES do prompt (Vitest+RTL+MSW) fica **não atendida no frontend** por decisão explícita; as NÃO-REGRESSÕES de features futuras que forem puramente de frontend também. Onde houver lógica pura testável sem DOM/React (ex.: `ibge-lookup`, `regime-map`, `error-translate`), avalio teste leve caso o harness venha a existir — hoje não há runner no pacote, então fica de fora.
- **Evidência**: `apps/erp/web/AGENTS.md` (entrada facilita-nfe): "apps/erp/web não tem nenhum harness de teste frontend hoje (zero vitest.config, zero @testing-library/*, zero .test.ts(x))". Confirmado por busca.

## D1 — Origem do `cityCodeIbge`: tabela estática city+UF → código (frontend)

- **Decisão**: mapa curado `(cidade normalizada, UF) → códigoIBGE(7)` em `features/fiscal-certificate/lib/ibge-lookup.ts`, semeado com Ilhéus/BA (`2913606`) e um punhado de municípios BA (Itabuna `2914802`, Salvador `2927408`, etc.). Par ausente → **bloqueia** com mensagem acionável (FR-009).
- **Motivo**: filial não tem IBGE; CEP lookup existente não devolve IBGE; novo campo na filial = migration (fora da "única alteração de backend"). Plataforma é single-city Ilhéus.
- **Alternativas**: (a) derivar por CEP — o provider BrasilAPI v1 atual **não** retorna IBGE; exigiria 2ª chamada ao endpoint `/ibge/municipios/{uf}` + match por nome (frágil, dependência de rede no provisionamento) — rejeitado; (b) novo campo `cityCodeIbge` na filial — correto a longo prazo, mas é migration Prisma + `database-reviewer`, excede o escopo autorizado — adiado; (c) chutar Ilhéus sempre — rejeitado (silencioso e errado fora de Ilhéus).
- **Evidência**: `branch.entity.ts` (sem campo IBGE); `brasil-api-cep.provider.ts:11-16` (`BrasilApiCepResponse` sem IBGE); `create-company.dto.ts:77-80` (`cityCodeIbge` 7 dígitos, obrigatório); DTO cita Ilhéus `2913606`.

## D2 — Regimes MEI/ISENTO: bloquear, nunca mapear

- **Decisão**: `regime-map.ts` mapeia `SIMPLES_NACIONAL|LUCRO_PRESUMIDO|LUCRO_REAL` 1:1; `MEI`/`ISENTO` → erro de provisionamento com mensagem (FR-008).
- **Evidência**: `company.entity.ts:4-8` (3 regimes) vs `branch.entity.ts:9-15` (5 regimes, inclui MEI/ISENTO).

## D3 — `platformStoreId`: expor no presenter (única mudança de backend)

- **Decisão**: adicionar `platformStoreId` ao `OrganizationPresenter.toHttp` da erp-api e ao tipo/DTO da organização no erp-web. `null` → tela em estado "loja não habilitada", sem provisionar (FR-007).
- **Evidência**: `organization.entity.ts:43` (`platformStoreId: string | null`, com getter `:183-185`); `organization.presenter.ts:5-25` (não expõe o campo).

## D4 — Unicidade Emitente (storeId/cnpj): só a matriz nesta entrega

- **Decisão**: provisiona um Emitente para `platformStoreId` + CNPJ da matriz. Filial com CNPJ próprio → Emitente distinto (futuro). Erros `StoreAlreadyHasCompanyError`/`CnpjAlreadyRegisteredError` tratados como "já existe" (re-resolve companyId e segue).
- **Evidência**: `company.entity.ts` (storeId/cnpj); erros em `companies/domain/errors/`.

## D5 — `fiscalUpload()` para multipart

- **Decisão**: criar `fiscalUpload(path, formData, init)` em `lib/api/fiscal-client.ts`, espelhando `comercioUpload` — **não** setar `Content-Type` (o browser injeta o boundary do FormData); passa por `fetchWithSession`; mesmo `extractErrorMessage`.
- **Motivo**: `fiscalFetch` força `application/json` quando há body (fiscal-client.ts:31-33), o que apaga o boundary do multipart.
- **Evidência**: `comercio-client.ts:59-81` (`comercioUpload`); `fiscal-client.ts:31-33`.

## D6 — Reuso de `useFiscalCompany`

- **Decisão**: **importar** `useFiscalCompany` de `features/facilita-nfe/hooks/use-fiscal-company.ts` (resolve `companyId` por CNPJ da organização ativa) sem duplicar; expõe `companyId`/`isCompanyMissing`. Não mover de lugar (evita quebrar o import de facilita-nfe) — reuso satisfaz "não duplicar".
- **Nota**: para o **provisionamento**, o CNPJ e demais dados vêm da **filial matriz** (`GET /v1/branches`, `isHeadquarters:true`), não de `organizations/current` (que não tem endereço/regime/UF) — conforme o prompt.
- **Evidência**: `use-fiscal-company.ts` (resolve por CNPJ; comentário confirma o fluxo).

## Endpoints confirmados (contratos)

- fiscal-api: `POST /api/v1/companies` (perm `fiscal.companies.manage`; resposta = `CompanyPresenter.toHttp` = **`{ data: { id, … } }`**, envelopado — corrigido após revisão TS; ler `res.data.id`); `POST /api/v1/companies/{companyId}/certificates` (multipart); `GET /api/v1/companies/{companyId}/certificates`; `GET /api/v1/certificates/{id}/status`; `GET /api/v1/companies?cnpj=`.
- erp-api: `GET /v1/branches` (`isHeadquarters`), `GET /v1/organizations/current` (para `platformStoreId` após a mudança do presenter).
