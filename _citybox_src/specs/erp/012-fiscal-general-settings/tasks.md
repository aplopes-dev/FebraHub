# Tasks: Configurações Gerais Fiscais

**Feature**: `specs/erp/012-fiscal-general-settings` | **Testes**: backend só (D0).

## Phase 1 — Backend (contrato de update explícito, FR-010)
- [x] T001 `company.entity.ts`: `UpdateCompanyInput` += `accountingOfficeDocument: string | null` e `nationalNfseEnabled: boolean` (Partial). `application/dtos/company.dto.ts`: `UpdateCompanyDto` += `accountingOfficeDocument?: string | null` (nationalNfseEnabled já existe).
- [x] T002 Teste do `UpdateCompanyUseCase` (jest, in-memory): PUT persiste taxRegime/stateRegistration/municipalRegistration/defaultEnvironment/accountingOfficeDocument/nationalNfseEnabled; 404 se inexistente.

## Phase 2 — Frontend feature `fiscal-settings`
- [x] T003 `api/`: dto (company response subset + update payload + csc payload) + service (`getFiscalCompanyById`/reuso, `updateCompanyApi`, `setCscApi`) via `fiscalFetch` ({data}).
- [x] T004 `hooks/`: query-keys + `use-fiscal-settings` (lê company por cnpj/useFiscalCompany) + mutations (update, setCsc).
- [x] T005 `lib/`: `regime-options.ts` (3 opções com CRT), `dirty` helper.
- [x] T006 [US1] `components/general-settings-tab.tsx`: seções; campos suportados editáveis (regime/IE/IM/ambiente/autXML/nationalNfseEnabled) + botão Salvar (um PUT); confirmação ao mudar p/ Produção; aviso de alterações não salvas.
- [x] T007 [US2] `components/csc-section.tsx`: indicador configurado/não; form ID+token; botão próprio (setCsc); token nunca exibido/cacheado.
- [x] T008 [US3] Campos sem backend renderizados **desabilitados** com "em breve" (nas seções do print), sem edição descartável.
- [x] T009 [US1] Integrar como aba `geral` em `fiscal-tabs.tsx` (`?aba=geral`); `FiscalSettingsTab` orquestra. Aviso de alterações pendentes ao trocar de aba.

## Phase 3 — Docs & Gates
- [x] T010 [P] `features/fiscal-settings/GUIA.md` (negócio, leigo) + `apps/erp/web/AGENTS.md` (feature + 3ª aba) + `services/fiscal-api/AGENTS.md` (contrato de update explícito).
- [x] T011 Gates: fiscal-api typecheck/lint/test; erp-web typecheck/lint(diff)/build. Sem migration → sem database-reviewer.
- [x] T012 Reviewers: react-reviewer + typescript-reviewer (.tsx) + security-reviewer (CSC token/segredo + permissão). Aplicar CRITICAL/HIGH.
- [x] T013 Conferência (5 camadas) + EXECUCAO.md → 012 CONCLUÍDA.

## Backlog nomeado (campos sem backend — D1, NÃO implementar aqui)
- **fiscal-api**: Isento IE; IE do Substituto Tributário (por UF); Intermediadores; Dados de pagamento (UF/CNPJ estab./benef.); venda de gás/medicamentos.
- **erp-api**: indFinal/indPres default; modFrete (hoje '9' hardcoded); frete na base PIS/COFINS; IPI na base; base de cálculo (desc. incond×cond); taxa de serviço NFC-e; lote/validade/GTIN; cliente contribuinte ICMS; alíquota de crédito; justificativas padrão; contador inutiliza; envio automático XML/DANFE.
