# Cadastro de Terminais de PDV (`pos-terminals`) — fatia inicial da integração PDV↔ERP

## Problem
Operadores de backoffice com permissão sobre a vertical Comércio (`vertical.comercio.view`) precisam cadastrar e administrar os terminais de PDV físicos de cada unidade — hoje isso é impossível de fazer de verdade. A tela `/ponto-de-venda/cadastros` no `erp-web` existe e tem UI completa, mas é 100% mock: qualquer terminal criado ali some ao recarregar a página, e o botão "Editar" apenas mostra um toast "Em breve". Do outro lado, o PDV Flutter (`apps/pdv/app`) é um esqueleto visual sem nenhuma integração — não existe hoje nenhum jeito de um terminal físico se identificar perante o ERP. Enquanto esse cadastro não existir de verdade na API, toda a integração PDV↔ERP (autenticação, pareamento, operação) fica bloqueada, porque não há "terminal" contra o qual logar.

## Evidence
- Levantamento técnico direto do código, registrado em `.claude/plans/_platform/pdv-erp-integration.plan.md` (§2–4): confirma que `apps/pdv/app` não tem nenhuma dependência de HTTP/auth/persistência (`pubspec.yaml` só declara `flutter_riverpod`, `intl`, `window_manager`, `package_info_plus`), e que `/ponto-de-venda/cadastros` no `erp-web` roda inteiramente sobre store local (`features/pos-registers`), sem módulo correspondente em nenhuma API do monorepo.
- Decisão de sequenciamento de produto confirmada pelo usuário nesta sessão: construir primeiro a base de cadastro do PDV no ERP, e só depois integrar incrementalmente (autenticação → catálogo/produtos → clientes → …). Fiscal (NFC-e/SAT) fica deliberadamente para uma fase futura — o campo relacionado entra no cadastro apenas como dado, sem lógica fiscal real por trás ainda.

## Users
- **Primary**: operador de backoffice do lojista (papel com `vertical.comercio.view` no `erp-web`) que cadastra e gerencia os terminais de PDV de uma unidade.
- **Secondary (consumidor futuro, não implementado nesta fatia)**: o próprio terminal PDV Flutter, que nas próximas fatias vai consumir o código de pareamento gerado por este módulo para se identificar.
- **Not for**: operador de caixa (login de operador/turno é fora de escopo desta fatia); qualquer fluxo do app Flutter em si.

## Hypothesis
We believe **um módulo `pos-terminals` na `erp-api` (CRUD organization+branch-scoped + geração de código de pareamento) conectado à tela `/ponto-de-venda/cadastros` do `erp-web`** will **permitir que o backoffice cadastre e gerencie terminais de PDV reais, tirando essa tela do mock e estabelecendo a base que o PDV Flutter vai consumir para se parear** for **operadores de backoffice da vertical Comércio**.
We'll know we're right when **um terminal criado pela UI do `erp-web` persiste via API real, aparece em `GET /v1/pos-terminals` escopado à unidade correta, sobrevive a reload de página, e o fluxo de edição deixa de ser um toast "Em breve" e passa a persistir mudanças de verdade**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| `/ponto-de-venda/cadastros` sem dependência de mock | 0 referências a store local de terminal | revisão de código — `features/pos-registers` do `erp-web` passa a chamar a API |
| CRUD de terminal funcional ponta a ponta | criar, listar, editar e (des)ativar terminal via UI persistem entre reloads | teste manual/E2E cobrindo os 4 fluxos |
| Código de pareamento gerado corretamente | endpoint retorna código de uso único, válido por 15 min | teste de integração no backend |
| Cobertura de teste do módulo novo | ≥ 80% (padrão do repo) | `pnpm --filter @citybox/erp-api test` com relatório de cobertura |

## Scope

**MVP**
- Entidade `PosTerminal` na `erp-api`, organization+branch-scoped, seguindo o padrão Clean Architecture já estabelecido (`TENANT_SCOPED_MODELS`, guards locais existentes).
- Campos: nome, status (ativo/inativo/manutenção), unidade (`branchId`), impressora (texto opcional), balança (boolean/texto opcional), NFC-e contingência (boolean, sem lógica fiscal por trás), servidor offline (texto/boolean opcional) — espelhando exatamente os campos que o formulário mock "Novo PDV" já modela hoje.
- Rotas: `POST /v1/pos-terminals`, `GET /v1/pos-terminals`, `PATCH /v1/pos-terminals/:id`, e `POST /v1/pos-terminals/:id/pair` (gera código de pareamento de uso único, válido por 15 minutos, regenerável a qualquer momento).
- `erp-web`: tela `/ponto-de-venda/cadastros` (`features/pos-registers`) passa a consumir a API real — listar, criar ("Novo PDV"), editar (deixa de ser toast "Em breve" e persiste via `PATCH`).
- Correção pontual de documentação: `apps/pdv/app/AGENTS.md` §6 — remover a afirmação de que "a erp-api não tem módulo de vendas" (o módulo `sales` já existe desde 2026-08-03) e substituir a indicação do client Keycloak `citybox-app` (que é do app B2C consumidor) por uma nota apontando que o PDV vai precisar de um client dedicado.

**Out of scope**
- Qualquer mudança em `apps/pdv/app` (Flutter) — inclusive a tela que vai *consumir* o código de pareamento (fica para a fatia de autenticação).
- Client `citybox-pdv` no Keycloak e fluxo OIDC completo do PDV.
- `cash-sessions`, `payment-methods`, checkout de balcão.
- Integração de catálogo/estoque/clientes no PDV (fica para a fatia seguinte, "leitura online").
- Emissão fiscal real (NFC-e/SAT/contingência) — o campo existe no cadastro, mas sem nenhuma lógica de emissão por trás nesta fatia. Fica para uma fase própria, bem mais à frente no roadmap.
- Heartbeat/observabilidade de terminal (saúde de rede real) — a barra de título do PDV segue com fixture por enquanto.

## Delivery Milestones
<!-- Business outcomes, not engineering tasks. /plan turns each into a plan. -->
<!-- Status: pending | in-progress | complete -->

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Higiene de documentação (Fase 0) | `apps/pdv/app/AGENTS.md` §6 corrigido — sem afirmações desatualizadas sobre `sales` e client Keycloak | in-progress | `.claude/plans/_platform/pos-terminals-pdv-integration.plan.md` |
| 2 | Módulo `pos-terminals` na `erp-api` | CRUD + geração de código de pareamento funcionando via API, testado, organization+branch-scoped | in-progress | `.claude/plans/_platform/pos-terminals-pdv-integration.plan.md` |
| 3 | `erp-web` fora do mock | `/ponto-de-venda/cadastros` consumindo a API real (listar/criar/editar) | in-progress | `.claude/plans/_platform/pos-terminals-pdv-integration.plan.md` |

## Open Questions
- [ ] O código de pareamento deve ser exibido como texto curto, QR code, ou ambos na UI do `erp-web`? (não bloqueia o backend, mas afeta a tela)
- [ ] Terminal pode ser "desativado" (soft) ou precisa de exclusão real? Proposta: só status `inativo`, sem delete físico — a confirmar no `/plan`.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Campos de cadastro mudarem quando a Fase 1 (pareamento real) e a Fase 8 (fiscal) forem desenhadas, exigindo migration adicional | Média | Baixo | Schema simples e aditivo (Prisma migration incremental); campo fiscal já nasce como boolean simples, sem acoplar a nenhum provedor |
| Código de pareamento gerado nesta fatia ficar com formato incompatível com o que a Fase 1 (Flutter) vai precisar consumir | Média | Médio | Manter o endpoint de geração simples (string opaca + expiração) nesta fatia; formato de troca código→credencial só se define na fatia de autenticação, com a UI já pronta para reemitir se necessário |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
