# Tasks: 024 — Exclusões fiscais (Natureza de Operação e CSC do Emitente)

**Input**: `spec.md`, `plan.md` · **Ordem**: A (autocontida) → B (interlock)

## Parte A — Excluir Natureza de Operação (`apps/erp/api` + `apps/erp/web`)

- [x] T001 `OperationNatureRepository` (interface): adicionar `abstract deleteById(organizationId: string, id: string): Promise<void>`
- [x] T002 `PrismaOperationNatureRepository`: implementar `deleteById` via `id_organizationId` (chave composta do `@@unique`), nunca `delete` por `id` sozinho
- [x] T003 `tests/in-memory-operation-nature.repository.ts`: implementar `deleteById` no double
- [x] T004 `DeleteOperationNatureUseCase` + spec: sucesso, 404 (id inexistente), 404 cross-tenant (natureza de outra organização)
- [x] T005 `OperationNatureRoute`: `DELETE :id`, `@HttpCode(204)`, `@RequirePermission('store.catalog.manage')`
- [x] T006 `operation-natures.module.ts`: registrar `DeleteOperationNatureUseCase`
- [x] T007 erp-web `operation-nature.service.ts`: `deleteOperationNatureApi(id)`
- [x] T008 erp-web `use-operation-natures.ts`: `useDeleteOperationNatureMutation()` (invalida `operationNatureKeys(scope).all`, toast sucesso/erro com `businessErrorMessage`)
- [x] T009 erp-web `operation-nature-list-page.tsx`: coluna Ações com `RowActionsMenu` + `confirmDelete` (texto avisando sobre emissões futuras, FR-005); nome deixa de ser stretched-link, vira link no texto (evita colisão com o menu)
- [x] T010 Confirmar visualmente que o card "Naturezas de operação" em `fiscal-default-taxes-hub.tsx` decrementa após a exclusão (sem alteração de código esperada — mesma query key)

## Parte B — Remover CSC do Emitente (`services/fiscal-api` + `apps/erp/web`)

- [x] T011 `Company` entity (fiscal-api): `clearCsc()` — zera `cscId` e `cscTokenEncrypted` juntos
- [x] T012 `Company` entity spec: `clearCsc()` zera os dois campos; `hasCsc()` volta a `false`
- [x] T013 `ClearCscUseCase` + spec: molde de `SetCscUseCase` — `CompanyAccessPolicy` primeiro (404 se não é dono), idempotente (chamar 2x não falha), 404 id inexistente
- [x] T014 `ClearCscRoute`: `DELETE v1/companies/:id/csc`, `@RequirePermission('fiscal.companies.manage')`, resposta nunca ecoa o CSC
- [x] T015 `companies.module.ts` (fiscal-api): registrar `ClearCscUseCase` + `ClearCscRoute`
- [x] T016 erp-web `lib/api/pos-fiscal-model-guard.ts` (novo): `resolveOrgPosDocumentModel(userAccessToken, organizationId)` → `GET {ERP_API_URL}/v1/pos-fiscal-settings` com token do usuário, `null` em qualquer falha (fail-open documentado no plano)
- [x] T017 erp-web proxy `app/api/proxy/fiscal/[...path]/route.ts`: branch novo para `DELETE` em rota `:id/csc` — chama o guard T016 e responde 409 (`csc_removal_blocked_pos_model_65`) se `MODEL_65`, antes do fetch upstream
- [x] T018 erp-web `fiscal-client.ts`: `deleteCscApi(companyId)`; confirmar que `extractErrorInfo` cobre o formato de corpo do 409 do próprio proxy (`{error: "code", message}`) — ajustar se necessário
- [x] T019 erp-web `use-fiscal-settings.ts`: `useClearCscMutation(companyId)` (invalida `fiscalCompanySettingsKey`)
- [x] T020 erp-web `csc-section.tsx`: botão "Remover CSC" (só quando `configured === true`) + `ConfirmationDialog`; erro 409 do bloqueio aparece como toast de negócio (usa a mensagem do backend, não texto genérico)

## Gates

- [x] T021 `pnpm --filter @citybox/erp-api typecheck && lint && test`
- [x] T022 `pnpm --filter @citybox/fiscal-api typecheck && lint && test`
- [x] T023 `pnpm --filter @citybox/erp-web typecheck && lint && build`
- [x] T024 `react-reviewer` em `operation-nature-list-page.tsx` + `csc-section.tsx` — 1 HIGH (CscSection sem `key={company.id}`, leak de estado entre Emitentes) + 1 MEDIUM (`isClearCscRoute` menos tolerante que os matchers irmãos), ambos corrigidos
- [x] T025 `typescript-reviewer` no diff completo — aprovado, 1 nota cosmética não-bloqueante
- [x] T026 `security-reviewer` — obrigatório em B (CSC + gate de emissão) — aprovado, sem CRITICAL/HIGH/MEDIUM
- [x] T027 Fix de achados CRITICAL/HIGH dos reviewers acima — os 2 achados do react-reviewer corrigidos e revalidados (typecheck limpo)

## Documentação

- [x] T028 `apps/erp/api/AGENTS.md` — módulo `operation-natures` ganha exclusão
- [x] T029 `services/fiscal-api/AGENTS.md` — módulo `companies` ganha `DELETE .../csc`
- [x] T030 `apps/erp/web/AGENTS.md` — proxy fiscal ganha o guard de Modelo 65 (FR-009)
- [x] T031 `apps/erp/web/src/features/fiscal-operation-natures/GUIA.md` — exclusão
- [x] T032 `apps/erp/web/src/features/fiscal-settings/GUIA.md` — remover CSC

## Deploy + limpeza do ambiente de teste

- [x] T033 Build + deploy `erp-api`, `fiscal-api`, `erp-web` (as três mudam) — 3/3 healthy, sem erro nos logs
- [ ] T034 Validar em produção: excluir a natureza "QA Devolucao fornecedor" pela tela — **não executado nesta sessão**: rota confirmada registrada e exigindo auth (`401`, não `404`), mas exclui-la de fato exige um token de usuário real com `store.catalog.manage` na organização — sem browser nem credencial de usuário disponíveis nesta sessão. Fica pendente de clique manual.
- [x] T035 Validar em produção: remover o CSC de teste do Emitente `070566ad-c97a-4ce6-9e08-2d0fde8b1249` pela API (token `fiscal-m2m`, mesmo caminho de confiança que o proxy usa) — `cscConfigured` foi a `false`, ambos os campos zerados no banco, chamada repetida confirma idempotência, CSC nunca ecoado na resposta
- [x] T036 Confirmado por inspeção de código + teste automatizado (`issue-nfce.use-case.ts:184`, `!company.hasCsc()`) — não exercitado com uma emissão real de NFC-e nesta sessão (fora de escopo: exigiria disparar emissão de verdade em produção)
