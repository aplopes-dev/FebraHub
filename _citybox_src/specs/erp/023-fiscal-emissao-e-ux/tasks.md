# Tasks: 023 — Fiscal: emissão, deploy, scroll e novas seções

## N2 — Deploy [CRÍTICO, primeiro]
- [x] T001 Build + deploy `erp-api` (`services/platform`, faltou na sessão da spec 022). Container saudável, `/api/health` 200.
- [x] T002 Confirmado que o código de `toHttpRichList`/`DELETE` está agora servido (imagem nova). Validação funcional completa fica para T067 (checagem final logada).
- [x] T003 Removido "TESTE QA - pode excluir" via SQL direto (0 produtos vinculados, não era padrão fiscal — seguro), mesma regra do `DeleteFiscalGroupUseCase`.
- [ ] T004 Documentar gate de deploy (AGENTS.md raiz).

## N1 — Permissão de Séries [CRÍTICO]
- [x] T010 `fiscal.sequences.manage` em `FISCAL_PERMISSIONS` + `fiscal_operator` (que passa a ser `[...FISCAL_PERMISSIONS]`, elimina a duplicação que causou o drift).
- [x] T011 Corrigido `fiscal.documents.read` → `fiscal.documents.view` (achado extra, mesma classe de bug).
- [x] T012 Teste de exaustividade `permissions.exhaustive.spec.ts` — verde, e já provou seu valor achando o bug #2 antes de eu terminar de escrevê-lo.
- [ ] T013 Validar manualmente as 4 escritas de série (após deploy final do fiscal-api).

## N3 — Scroll dos formulários de grupo [ALTO]
- [x] T020 `FiscalScrollablePage` em `grupos-icms/novo` + `/[id]`.
- [x] T021 `FiscalScrollablePage` em `grupos-ipi/novo` + `/[id]`.
- [x] T022 `FiscalScrollablePage` em `grupos-issqn/novo` + `/[id]`.
- [x] T023 `FiscalScrollablePage` em `grupos-pis-cofins/novo` + `/[id]`.
- [x] T024 Varredura completa do Menu Fiscal: todo `page.tsx` sob `configuracoes/fiscal` e `vendas/nfse` lido — nenhuma tela sem o wrapper ficou de fora (as 4 `grupos-*/page.tsx` de topo são `redirect()`, sem conteúdo próprio).

## N4/N5 — Robustez de exibição [BAIXO]
- [x] T030 `rateLabel`/`taxSituationLabel` nullish (`== null` / parâmetro aceita `undefined`).
- [x] T031 `business-error-message.ts` cobre 401/403 sem `code` (raw do NestJS) com mensagem acionável, preservando erros de domínio 403 já traduzidos.

## N7 — UX de Outros cadastros fiscais [MÉDIO]
- [x] T040 Backend: `GET /v1/fiscal-additional-infos/count` (erp-api) — `groupBy` + `CountFiscalAdditionalInfosUseCase`, teste novo verde (achado: teste pré-existente "concatena na ordem de criação" falha igual sem minhas mudanças — confirmado via `git stash`, fora de escopo).
- [x] T041 Frontend: 2 cards novos no hub de Padrões fiscais (`OtherFiscalCard`, mesma moldura visual dos 4 de tributo; contagem real, estado vazio explicativo, sem placeholder).

## N6 — Justificativas padrão [MÉDIO/MAIOR]
- [x] T050 Migration `Company` (`inutilizationJustification`, `cancellationJustification`) — escrita à mão (shadow DB não tem `citybox_uuid_v7()`, mesmo precedente já documentado no AGENTS.md), aplicada com `migrate deploy`, sem drift fora do pré-existente (índices de `nfce_contingency_queue`/`fiscal_documents`, não relacionado).
- [x] T051 `CompanyZodValidator` (15–255 ou `null`) + `UpdateCompanyDto`/`UpdateCompanyUseCase` com os 2 campos + constante compartilhada `JUSTIFICATION_MIN/MAX_LENGTH`. 6 testes novos em `company.entity.spec.ts`, todos verdes.
- [x] T052 Frontend: sai de `disabled-soon-sections.tsx`, entra em `general-settings-form.tsx` como campos reais (multiline, validação de 15–255 no cliente espelhando o backend, bloqueia Salvar se inválido). ⚠️ Limitação declarada no spec.md: sem tela de inutilizar/cancelar em `erp-web` ainda, o valor fica persistido mas não é usado automaticamente em nenhum fluxo.

## Gates
- [x] T060 `pnpm --filter @citybox/fiscal-api typecheck && lint && test` — verde (620/634, mesmas 14 falhas pré-existentes de sempre — CA bundle ausente).
- [x] T061 `pnpm --filter @citybox/erp-web typecheck && lint && build` — typecheck limpo, lint limpo no diff, build exit 0.
- [x] T062 `pnpm --filter @citybox/erp-api typecheck && lint && test` — typecheck limpo, 0 erros de lint no diff (112 pré-existentes fora do escopo, confirmados via grep), 70/71 em fiscal-additional-info+fiscal-defaults (1 falha pré-existente confirmada idêntica sem minhas mudanças).
- [x] T063 `database-reviewer` na migration de `Company` — sem bloqueio; sugeriu testes de fronteira (14/15/255/256 chars + string vazia), adicionados a `company.entity.spec.ts` (10/10 verdes).
- [x] T064 `security-reviewer` obrigatório em N1 — sem CRITICAL/HIGH; confirmou escopo da permissão nova, refactor `[...FISCAL_PERMISSIONS]` comportamentalmente neutro, e que o "buraco" do teste de exaustividade (regex não pega permissão dinâmica) é hoje só teórico (nenhum `@RequirePermission` dinâmico existe no código).
- [x] T065 `react-reviewer` (limpo) + `typescript-reviewer` (1 HIGH: cast inseguro em `countByDocumentType`, mesma classe de erro já achada na spec 022 — corrigido com type guard `isFiscalDocumentType` + log de linha inesperada em vez de indexação silenciosa; 17/17 verdes após o fix).
- [x] T066 GUIA.md (`fiscal-settings`, `fiscal-default-taxes`) + AGENTS.md (raiz, `apps/erp/web`, `apps/erp/api`, `services/fiscal-api`) atualizados.
- [x] T067 Build + redeploy final (fiscal-api + erp-api + erp-web, `services/platform` — as 3 imagens do achado N2, desta vez juntas) — build exit 0, 3 containers recreados e saudáveis, `/api/health` (fiscal-api e erp-api) e `/login` (erp-web) respondendo 200, migration `inutilization_justification`/`cancellation_justification` confirmada em `fiscal.companies` no banco em uso pelos containers, sem erro nos logs de boot.
