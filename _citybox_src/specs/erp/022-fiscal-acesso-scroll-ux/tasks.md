# Tasks: 022 — Acesso, Scroll e UX do Menu Fiscal

## P1 — Autorização [CRÍTICO]
- [x] T001 `StoreMembershipCompanyAccessPolicy`: query `UNION` com o caminho `erp.memberships` (+ `o.status='ACTIVE' AND o.deleted_at IS NULL`, achado do security-reviewer).
- [x] T002 Testes de integração (8 cenários: 6 do plano + suspenso + soft-deletado).
- [x] T003 security-reviewer no diff — 1 gap real encontrado (status/deletedAt não checados) e corrigido; demais pontos (SQLi, UNION, NULL-cast, cross-tenant) OK.
- [ ] T004 Validar manualmente: Séries lista/cria/ajusta/desativa/exclui; CSC grava.

## P2 — Scroll [ALTO]
- [x] T010 `FiscalScrollablePage` (wrapper compartilhado) — `apps/erp/web/src/components/ui/form/fiscal-scrollable-page.tsx`.
- [x] T011 Aplicar nas 5 abas de `/configuracoes/fiscal` (wrapper único no container `fiscal-tabs.tsx`).
- [x] T012 Aplicar em `fiscal-operation-natures` (lista+novo+editar) e `nfse-issuance`; `fiscal-additional-info` já tinha o padrão full-bleed+ScrollArea manual (sem mudança).
- [ ] T013 Aplicar nas telas de grupo (unificadas em P3 — não duplicar trabalho).
- [ ] T014 Validar scroll em 1366×768 e 1280×720 (mouse + Tab) em todas as rotas do FR-P2-003. ⚠️ **Não executável nesta sessão** — sem ferramenta de browser disponível (chrome-devtools MCP não surfaceado). Verificado estruturalmente: `FiscalScrollablePage` replica exatamente o padrão comprovado de `/catalogo/produtos/novo` (mesma matemática `m:-3`+`ScrollArea`); react-reviewer confirmou que nenhuma tela aninha o wrapper duas vezes (sem duplicação de margem negativa); build de produção passou sem erro. Falta a validação visual/interativa real — pedir ao usuário para confirmar no navegador após o redeploy (T034).

## P3 — UX [MÉDIO]
- [x] T020 Backend: `productCount` — `ListFiscalGroupsUseCase` + `FiscalGroupRepository.countProductsByGroup` (1 `groupBy` por tributo, D2) + `FiscalGroupPresenter.toHttpRichList` em `GET /v1/fiscal-groups`.
- [x] T021 Backend: `DELETE /v1/fiscal-{tributo}-groups/:id` nos 4 controllers (compartilham `DeleteFiscalGroupUseCase`), bloqueio 409 (`FiscalGroupInUseError`: produtos vinculados / é o padrão fiscal). 6 testes novos, 54/54 verdes no módulo.
- [x] T022 Frontend: rota unificada `/configuracoes/fiscal/grupos` com abas por tributo (`features/fiscal-groups`).
- [x] T023 Frontend: listagem rica (situação tributária, alíquota, produtos, excluir) por tributo.
- [x] T024 Frontend: redirect das 4 rotas antigas pra rota unificada.
- [x] T025 Frontend: hub de Padrões fiscais (4 cards + CFOP padrão + links) — `fiscal-default-taxes-hub.tsx`.
- [x] T026 Aplicar `FiscalScrollablePage` nas telas novas de P3 (`fiscal-groups-page.tsx` já nasce com o wrapper).
- [x] T027 GUIA.md das features tocadas (`fiscal-groups`, `fiscal-default-taxes`, 4 features de grupo — nota de redirecionamento) + `apps/erp/web/AGENTS.md` + `apps/erp/api/AGENTS.md` + `services/fiscal-api/AGENTS.md`.

## Gates
- [x] T030 `pnpm --filter @citybox/fiscal-api typecheck && lint && test` — verde (integração + 613/627 unit, baseline inalterado).
- [x] T031 `pnpm --filter @citybox/erp-web typecheck && lint && build` — typecheck limpo, lint limpo no diff (erros pré-existentes fora do diff confirmados via `git status`), build exit 0, `/configuracoes/fiscal/grupos` + 4 redirects no manifesto.
- [x] T032 `pnpm --filter @citybox/erp-api typecheck && test` — typecheck limpo, 54/54 verdes em `fiscal-defaults` (não é smoke — teve mudança real nesta feature: productCount + delete).
- [x] T033 react-reviewer (0 CRITICAL/HIGH) + typescript-reviewer (1 cast inseguro em `countProductsByGroup` + 2 switches sem exaustividade — corrigidos: `row[field]` sem cast, `default: never` nos dois switches, `findById`/`countProductsByGroup` paralelizados) no diff completo. Re-verificado: typecheck + lint + 54/54 testes verdes após as correções.
- [x] T034 Build + redeploy docker (fiscal-api + erp-web, `services/platform/docker-compose.yml --env-file ../platform-apps.env`) — build exit 0, ambos containers recreados e saudáveis (`aplopes_fiscal_api` healthy, `aplopes_erp_web` up), `/login` (erp-web) e `/api/health` (fiscal-api) respondem 200, sem erro nos logs de boot.
