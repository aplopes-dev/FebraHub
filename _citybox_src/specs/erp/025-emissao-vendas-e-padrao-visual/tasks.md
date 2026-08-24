# Tasks: 025 — Emissão fiscal pela tela de Vendas e padrão visual (P1–P3)

**Input**: `spec.md`, `plan.md` · **Ordem**: US1 (P1) → US2 (P2) → US3 (P3) — independentes entre si, sem fase Foundational bloqueante.

## Phase 1: Setup

- [X] T001 Confirmar no ambiente local/produção que `KEYCLOAK_FISCAL_M2M_CLIENT_ID`/`KEYCLOAK_FISCAL_M2M_CLIENT_SECRET`/`KEYCLOAK_ISSUER` já estão no `docker-compose.yml`/`platform-apps.env` do `erp-api` (confirmado nesta sessão — sem ação esperada, só checagem antes de codar)

## Phase 2: Foundational

*(nenhuma tarefa bloqueante entre user stories — US1, US2 e US3 são independentes, conforme `spec.md`)*

---

## Phase 3: User Story 1 — Emitir NFS-e pela tela de Vendas (P1) 🎯 MVP

**Goal**: a erp-api autentica contra a fiscal-api com um token de serviço real e renovável; falhas de causas diferentes ficam distinguíveis no log; tela de emissão mostra estado vazio honesto sem Grupo de ISSQN.

**Independent Test**: preencher e emitir uma NFS-e real pela tela `/vendas/nfse` e ver `AUTHORIZED` com chave de 50 dígitos.

- [X] T002 [P] [US1] Criar `apps/erp/api/src/modules/nfse-issuance/infrastructure/providers/fiscal-service-token.ts` — `client_credentials` contra `KEYCLOAK_ISSUER`/`KEYCLOAK_FISCAL_M2M_CLIENT_ID`/`_SECRET`, cache em memória + renovação antes do expiry, dedupe de chamadas em voo (molde de `apps/erp/web/src/lib/api/fiscal-service-token.ts`, cópia local — sem pacote compartilhado, ADR C-17)
- [X] T003 [US1] Criar `apps/erp/api/src/modules/nfse-issuance/infrastructure/providers/fiscal-service-token.spec.ts` — token obtido, cacheado, renovado perto do expiry, dedupe de chamadas concorrentes
- [X] T004 [US1] `apps/erp/api/src/modules/nfse-issuance/infrastructure/providers/http-fiscal-api-client.ts`: `authToken()` deixa de ler `FISCAL_API_TOKEN`/`dev-admin`, passa a chamar o token de T002
- [X] T005 [US1] Mesmo arquivo: mover a resolução do token pra **fora** do `try` que envolve cada `fetch()` (em `findCompanyIdByCnpj` e `issueNfse`) — cada chamada resolve o token primeiro (seu próprio `try/catch` com `Logger.error` da causa real), só then monta a request; corrige a mensagem genérica engolindo o erro de config/auth
- [X] T006 [US1] Mesmo arquivo: 3 blocos de log distintos e nomeados — falha de auth/config (token), falha de transporte (fetch/timeout), erro de negócio devolvido pela fiscal-api (`toEmissionError`) — nunca a mesma linha de log pras três causas
- [X] T007 [US1] `apps/erp/api/src/modules/nfse-issuance/infrastructure/providers/http-fiscal-api-client.spec.ts` (criar ou ajustar): mock do token de T002 e do `fetch`; casos: token falha (config ausente) → log específico; fetch falha (rede) → log específico; fiscal-api recusa (4xx/5xx) → mensagem de negócio traduzida, log específico
- [X] T008 [US1] Localizar o componente do select de Grupo de ISSQN na tela `/vendas/nfse` (`apps/erp/web/src/features/nfse-issuance/`) e trocar o select vazio + botão desabilitado por `EmptyState` (`@citybox/mui`) com texto explicando a ausência de grupo cadastrado + link `href="/configuracoes/fiscal/grupos?tributo=issqn"`

**Checkpoint**: NFS-e emitida pela tela chega `AUTHORIZED` na fiscal-api; log distingue as 3 causas de falha; tela de Grupo de ISSQN vazio é honesta.

---

## Phase 4: User Story 2 — Selo de ambiente reflete `Company.defaultEnvironment` (P2)

**Goal**: o ambiente efetivamente transmitido e o selo da tela vêm do campo real do Emitente, não de constantes fixas.

**Independent Test**: mudar `defaultEnvironment` do Emitente em `/configuracoes/fiscal?aba=geral` e ver o selo/ambiente da tela de emissão mudar junto.

- [X] T009 [P] [US2] `apps/erp/api/src/modules/nfse-issuance/domain/providers/fiscal-api-client.interface.ts`: `findCompanyIdByCnpj` passa a devolver `{ id: string; defaultEnvironment: 'HOMOLOGATION' | 'PRODUCTION' } | null` em vez de `string | null`
- [X] T010 [US2] `http-fiscal-api-client.ts`: `findCompanyIdByCnpj` lê `defaultEnvironment` do corpo já parseado da resposta de `GET /v1/companies?cnpj=` (campo já existe na resposta da fiscal-api — sem chamada extra)
- [X] T011 [US2] Atualizar todos os chamadores de `findCompanyIdByCnpj` pra nova assinatura (checar `IssueNfseUseCase` e qualquer outro caller no módulo)
- [X] T012 [US2] `apps/erp/api/src/modules/nfse-issuance/application/use-cases/issue-nfse/issue-nfse.use-case.ts`: remover `const ENVIRONMENT = 'HOMOLOGATION' as const`; usar o `defaultEnvironment` resolvido junto do `companyId` (T010)
- [X] T013 [US2] Mesmo arquivo: quando `defaultEnvironment === 'PRODUCTION'` e a plataforma não suportar produção, recusar **antes** de reservar `idempotencyKey`/gravar `NfseIssuance` (mesmo cuidado que a fiscal-api já tem no lado dela — evita round-trip fadado a falhar e efeito colateral órfão)
- [X] T014 [US2] `apps/erp/api/src/modules/nfse-issuance/application/use-cases/issue-nfse/issue-nfse.use-case.spec.ts`: ambiente vem de `defaultEnvironment`, não mais fixo; caso `PRODUCTION` sem suporte recusa sem gravar nada
- [X] T015 [US2] `apps/erp/web/src/features/nfse-issuance/pages/nfse-issuance-page.tsx`: `Chip label="Ambiente: HOMOLOGAÇÃO"` (~linha 166) deixa de ser string fixa — lê o ambiente real retornado pela API (confirmar/expor no payload que a tela já consome, ou expor endpoint leve se necessário); `color` muda para aviso mais forte quando `PRODUCTION` sem suporte
- [X] T016 [US2] Mesmo arquivo: `title="Emitir NFS-e em HOMOLOGAÇÃO?"` (~linha 300) idem — texto reflete o ambiente real, não fixo

**Checkpoint**: selo da tela e ambiente transmitido sempre batem com `defaultEnvironment`; mudar pra `PRODUCTION` sem suporte da plataforma é tratado honestamente, sem gravar emissão órfã.

---

## Phase 5: User Story 3 — Botão Salvar no mesmo padrão em todas as telas fiscais (P3)

**Goal**: todas as telas fiscais listadas usam `EntityFormFooter`, com fundo, posição consistente, convivendo com `FiscalScrollablePage`.

**Independent Test**: abrir cada tela listada, rolar, confirmar que o Salvar está sempre no mesmo lugar visual, com fundo, visível sem rolar.

- [X] T017 [US3] `apps/erp/web/src/features/fiscal-settings/components/fiscal-settings-tab.tsx` + `general-settings-form.tsx`: extrair o `Box`+`Button` de dentro da última `FormSection` (linha ~274-291) e substituir por `EntityFormFooter mode="dirty"` próprio do formulário do Emitente — primeira tela tocada, valida a convivência com `FiscalScrollablePage` antes de replicar nas outras 8
- [X] T018 [US3] `csc-section.tsx`: ajuste só de posição/fundo pra consistência visual — mantém os botões de ação pontual (Configurar/Substituir/Remover CSC) da spec 024, não vira `EntityFormFooter` de dirty-state (CSC não é formulário de edição contínua)
- [X] T019 [P] [US3] `apps/erp/web/src/features/pos-fiscal-document-type/components/pos-fiscal-type-form.tsx:149`: trocar `Box`+`Button type="submit"` por `EntityFormFooter mode="dirty"`
- [X] T020 [P] [US3] `apps/erp/web/src/features/fiscal-default-taxes/components/fiscal-default-taxes-hub.tsx:379`: idem
- [X] T021 [P] [US3] `apps/erp/web/src/features/fiscal-icms-group/components/icms-group-form-view.tsx:295`: idem
- [X] T022 [P] [US3] `apps/erp/web/src/features/fiscal-ipi-group/components/ipi-group-form-view.tsx`: idem
- [X] T023 [P] [US3] `apps/erp/web/src/features/fiscal-pis-cofins-group/components/pis-cofins-group-form-view.tsx`: idem
- [X] T024 [P] [US3] `apps/erp/web/src/features/fiscal-issqn-group/components/issqn-group-form-view.tsx`: idem
- [X] T025 [P] [US3] `apps/erp/web/src/features/fiscal-operation-natures/components/operation-nature-form-view.tsx`: idem
- [X] T026 [US3] `apps/erp/web/src/features/fiscal-additional-info/components/fiscal-additional-info-form-dialog.tsx`: **não** trocar por `EntityFormFooter` — é um `Dialog` modal, `DialogActions` já é o padrão correto; ajuste só de cor/consistência se necessário (achado de planejamento: item da lista do prompt, mas componente real é modal)

**Checkpoint**: Salvar no mesmo lugar visual, com fundo, nas 9 telas de página; diálogo de Informações adicionais mantém `DialogActions` por ser modal; os dois formulários de Configurações gerais preservam isolamento de save.

---

## Phase 6: Polish & Gates

- [X] T027 `pnpm --filter @citybox/erp-web typecheck && lint && build`
- [X] T028 `pnpm --filter @citybox/erp-api typecheck && lint && test`
- [X] T029 `pnpm --filter @citybox/fiscal-api typecheck && lint && test` (sem mudança esperada nesta spec — roda para confirmar zero regressão)
- [X] T030 `react-reviewer` nos `.tsx` tocados (9 telas de US3 + `nfse-issuance-page.tsx` de US2)
- [X] T031 `typescript-reviewer` no diff completo
- [X] T032 `security-reviewer` — obrigatório em US1 (token de serviço) e US2 (ambiente de emissão fiscal)
- [X] T033 Fix de achados CRITICAL/HIGH dos reviewers acima
- [X] T034 Atualizar `apps/erp/api/AGENTS.md` — módulo `nfse-issuance` ganha token de serviço próprio + `defaultEnvironment` real
- [X] T035 Atualizar `apps/erp/web/AGENTS.md` — telas fiscais padronizadas em `EntityFormFooter`; selo de ambiente real
- [X] T036 Atualizar `GUIA.md` das features tocadas (`nfse-issuance`, `fiscal-settings`, `pos-fiscal-document-type`, `fiscal-default-taxes`, grupos fiscais, `fiscal-operation-natures`)
- [X] T037 Build + deploy `erp-api` + `erp-web` (fiscal-api sem mudança nesta spec, redeploy só se T029 pedir)
- [ ] T038 Validar em produção: emitir NFS-e real pela tela `/vendas/nfse`, ver `AUTHORIZED` com chave de 50 dígitos
- [ ] T039 Validar em produção: selo de ambiente bate com `/configuracoes/fiscal?aba=geral`
- [ ] T040 Validar em produção: Salvar no mesmo lugar, com fundo, nas telas fiscais
- [ ] T041 Decidir sobre o resíduo do grupo de ISSQN "Desenvolvimento de sistemas" (manter — útil pra T038 — ou remover ao final)

## Dependencies & Execution Order

- **US1, US2, US3 são independentes** — nenhuma bloqueia as outras (confirmado em `spec.md`). Podem ser feitas em qualquer ordem ou em paralelo por pessoas/sessões diferentes.
- Dentro de US1: T002 → T003 (spec depende do arquivo existir) → T004 → T005 → T006 → T007; T008 é paralelo ao resto de US1 (arquivo diferente).
- Dentro de US2: T009 → T010 → T011 → T012 → T013 → T014 (cadeia, mesmo arquivo/interface); T015/T016 paralelos entre si, dependem só de T012/T013 (precisam do ambiente real disponível pra tela consumir).
- Dentro de US3: T017 primeiro (valida o padrão de convivência com `FiscalScrollablePage`), T018 depende de T017 (mesma tela); T019–T026 são paralelos entre si (arquivos diferentes) depois que T017 validar o padrão.
- Phase 6 depende de todas as user stories completas.

## Parallel Execution Examples

```
# Dentro de US1, T008 em paralelo com o resto:
Task: T002 [US1] fiscal-service-token.ts
Task: T008 [US1] EmptyState do Grupo de ISSQN (arquivo diferente, sem dependência)

# Dentro de US3, depois de T017 validar o padrão:
Task: T019 [US3] pos-fiscal-type-form.tsx
Task: T020 [US3] fiscal-default-taxes-hub.tsx
Task: T021 [US3] icms-group-form-view.tsx
Task: T022 [US3] ipi-group-form-view.tsx
Task: T023 [US3] pis-cofins-group-form-view.tsx
Task: T024 [US3] issqn-group-form-view.tsx
Task: T025 [US3] operation-nature-form-view.tsx
```

## Implementation Strategy

**MVP = US1 (P1)** — sem ela, a única tela de emissão do produto está morta em produção. Entregável e testável isoladamente: emitir uma NFS-e real pela tela.

Incremental: US1 → validar em produção → US2 (pequeno, mesma área) → validar → US3 (UX, todas as telas do menu fiscal) → validar. Cada user story fecha um checkpoint independente — não precisa esperar as três para colocar valor em produção.
