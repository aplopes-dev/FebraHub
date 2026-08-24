# Tasks: Destravar emissão de NF-e/NFS-e (URL base da fiscal-api)

**Input**: `specs/erp/027-destravar-emissao-vendas/plan.md`, `spec.md`
**Branch**: `027-destravar-emissao-vendas`

Feature com **1 única user story (P1)** — não há fatiamento P2/P3. MVP = a feature inteira
(correção pequena e cirúrgica).

## Phase 1: Setup

- [X] T001 Confirmar branch de trabalho: já em `027-destravar-emissao-vendas` (criada pelo `/speckit-specify`) — nenhuma ação, só checagem

## Phase 2: Foundational

*(nenhuma tarefa bloqueante — correção de configuração + hardening pequeno em código já existente, sem infraestrutura nova)*

## Phase 3: User Story 1 — Emissão de NF-e/NFS-e chega ao órgão fiscal (Priority: P1) 🎯 MVP

**Goal**: corrigir `FISCAL_API_URL` (produção + `.env.example`), normalizar defensivamente a
URL base nos dois `http-fiscal-api-client.ts`, e ajustar os dois pontos triviais de UX — sem
tocar nenhum comportamento já validado (FR-005).

**Independent Test**: emitir uma NF-e pela tela `/vendas/nfe` e uma NFS-e pela tela
`/vendas/nfse`, ambas para a organização Aplopes (CNPJ 36698609000123), e confirmar que as
duas chegam ao órgão e recebem veredito (não mais a mensagem "Não foi possível resolver o
Emitente fiscal da organização").

### Correção da URL base (FR-001, FR-002, FR-003)

- [X] T002 [P] [US1] `services/platform/docker-compose.yml` (~linha 137, env do serviço `erp-api`): `FISCAL_API_URL: http://fiscal-api:3116` → `http://fiscal-api:3116/api` (mesmo padrão já correto na env do `erp-web`, ~linha 247)
- [X] T003 [P] [US1] `apps/erp/api/.env.example:53`: `FISCAL_API_URL=http://127.0.0.1:3116` → `FISCAL_API_URL=http://127.0.0.1:3116/api`

### Normalização defensiva (FR-004, decisão do clarify: normalizar + logar aviso, não falhar boot)

- [X] T004 [P] [US1] `apps/erp/api/src/modules/nfse-issuance/infrastructure/providers/http-fiscal-api-client.ts`: `baseUrl()` passa a normalizar — remove barra(s) final(is), acrescenta `/api` se ausente, loga aviso `[FiscalConfig]` quando normalizar; valor vazio/inválido cai no `DEFAULT_FISCAL_API_URL` (plan.md D2, cobre o Edge Case de string vazia da spec)
- [X] T005 [P] [US1] `apps/erp/api/src/modules/nfe-issuance/infrastructure/providers/http-fiscal-api-client.ts`: mesma normalização de T004 (arquivo irmão — duplicar a lógica, não extrair função compartilhada, ver plan.md D2)
- [X] T006 [US1] `apps/erp/api/src/modules/nfse-issuance/infrastructure/providers/http-fiscal-api-client.spec.ts`: estender com casos — `FISCAL_API_URL` sem `/api` normaliza e loga aviso; já com `/api` não duplica o sufixo; com barra final não vira `//api`; vazia cai no default
- [X] T007 [US1] `apps/erp/api/src/modules/nfe-issuance/infrastructure/providers/http-fiscal-api-client.spec.ts`: mesmos casos de T006 (arquivo irmão)

### Ajustes de UX (FR-006, FR-007, FR-008, FR-009)

- [X] T008 [P] [US1] `apps/erp/web/src/features/nfse-issuance/pages/nfse-issuance-page.tsx:134`: `description` do `PageHeader` perde a menção fixa a "ambiente de homologação" — o selo de ambiente (já dinâmico) é a única fonte dessa informação (plan.md D3)
- [X] T009 [P] [US1] Confirmar `apps/erp/web/src/features/nfe-issuance/pages/nfe-issuance-page.tsx:152` — achado do planejamento (plan.md D4): esta tela já não menciona ambiente no subtítulo, **nenhuma mudança necessária**; esta tarefa é só a confirmação final antes de fechar FR-007 (rodar rápido, sem código)
- [X] T010 [P] [US1] `apps/erp/web/src/features/nfe-issuance/pages/nfe-issuance-page.tsx` (~linha 224, `Autocomplete` de pedido de venda): adicionar `noOptionsText` em português explicando "nenhum pedido de venda fechado disponível" com link para `/vendas/pedidos-de-venda` (molde `EmptyState` com link já usado em `nfse-issuance-page.tsx` para Grupo de ISSQN vazio)
- [X] T011 [US1] Varredura (FR-009): grep por `Autocomplete`/`noOptionsText` nas duas telas de emissão; avaliar `nfse-issuance-page.tsx` (~linha 210, Autocomplete de cliente/tomador) e qualquer outro achado — aplicar o mesmo tratamento de T010 onde fizer sentido

**Checkpoint**: as duas telas emitem e recebem veredito do órgão; log mostra `[FiscalConfig]`
só se alguém reintroduzir uma `FISCAL_API_URL` sem `/api`; nenhum texto de estado vazio em
inglês; nenhuma contradição de ambiente no subtítulo.

---

## Phase 4: Polish & Gates

- [X] T012 `pnpm --filter @citybox/erp-api typecheck && lint && test`
- [X] T013 `pnpm --filter @citybox/erp-web typecheck && lint && build`
- [X] T014 `react-reviewer` nos `.tsx` tocados (T008-T011) — achado HIGH (link dentro de `noOptionsText` inacessível por teclado) corrigido e re-verificado
- [X] T015 `typescript-reviewer` no diff completo — achado HIGH (`.trim()` ausente na normalização) corrigido e re-verificado; achados MEDIUM (3ª implementação divergente em `fiscal/infrastructure/http-fiscal-api.adapter.ts`, teste pré-existente não relacionado em `fiscal-additional-info.use-case.spec.ts`) documentados como fora de escopo
- [X] T016 `security-reviewer` — sem achados
- [X] T017 Atualizar `apps/erp/api/AGENTS.md` — corrigir a documentação da env var (`FISCAL_API_URL`) e registrar a normalização defensiva
- [X] T018 Atualizar `apps/erp/web/AGENTS.md` — registrado B2/B3 e o motivo de não embutir link em `noOptionsText`
- [ ] T019 Build + deploy `erp-api` (docker-compose + rebuild da imagem, já que T002 muda env de produção e T004/T005/T006/T007 mudam código) — `erp-web` só se T008/T010/T011 mudarem algo
- [ ] T020 Validação manual em produção: emitir pelas DUAS telas (`/vendas/nfe`, `/vendas/nfe`) para a organização Aplopes e confirmar veredito do órgão (203 / E0116, conforme spec.md Assumptions) — não mais a mensagem de Emitente não resolvido

## Dependencies

- T002/T003 (config) são independentes entre si e de tudo mais.
- T004/T005 (normalização) são independentes entre si (arquivos irmãos) e não dependem de T002/T003 — o código de normalização funciona com ou sem a correção da env var (é justamente a rede de segurança).
- T006 depende de T004 (mesmo arquivo); T007 depende de T005.
- T008/T010 são independentes entre si e de T002-T007 (frontend, arquivos diferentes).
- T009 é só confirmação — pode rodar a qualquer momento, independente do resto.
- T011 depende de T010 ter estabelecido o padrão a replicar.
- Phase 4 depende de toda a Phase 3 completa.

## Parallel Execution Examples

```text
# Início — tudo em paralelo (arquivos/áreas independentes):
Task: T002 docker-compose.yml
Task: T003 .env.example
Task: T004 http-fiscal-api-client.ts (nfse-issuance)
Task: T005 http-fiscal-api-client.ts (nfe-issuance)
Task: T008 nfse-issuance-page.tsx subtítulo
Task: T009 nfe-issuance-page.tsx confirmação
Task: T010 nfe-issuance-page.tsx noOptionsText

# Depois de T004/T005:
Task: T006 http-fiscal-api-client.spec.ts (nfse-issuance)
Task: T007 http-fiscal-api-client.spec.ts (nfe-issuance)
```

## Implementation Strategy

**MVP = toda a feature** (user story única, P1, correção pequena). Ordem sugerida: T002/T003
(desbloqueiam produção mesmo sem redeploy de código) → T004-T007 (rede de segurança) →
T008-T011 (UX) → Phase 4 (gates + deploy + validação).
