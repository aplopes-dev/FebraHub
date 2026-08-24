# Auditoria ECC — agents, skills e commands instalados

**Data:** 2026-08-13
**Escopo:** `.claude/agents/` (67), `.cursor/skills/` (fonte canônica, symlinked em `.claude/skills/`, ~211 pastas), `.claude/commands/` (94), `.claude/rules/ecc/` (21 diretórios de linguagem), `.claude/settings.json`/`.mcp.json`.
**Metodologia:** 3 passes paralelos (agents / skills / commands) via subagentes com evidência de grep + leitura de arquivo, contra a stack real do monorepo (CLAUDE.md raiz + AGENTS.md), mais verificação direta de hooks, MCP e `.specify/`. Nenhum arquivo foi apagado — isto é só o levantamento.

Este arquivo é a versão completa (todos os ~359 itens nomeados individualmente). A versão resumida/navegável está publicada como artifact: "Poda do ECC".

---

## 1. Resumo executivo

| Bucket | Agents (67) | Skills (~200 de ~211) | Commands (92 de 94) | Total |
|---|---|---|---|---|
| **DAILY** (carregar sempre) | 29 | 22 | 19 | 70 |
| **LIBRARY** (manter, não default) | 14 | 36 | 34 (7 stack secundária + 26 workflow-mismatch + 1 fora de escopo) | 84 |
| **META** (manutenção do próprio harness) | 0 | 44 | 27 | 71 |
| **REMOVER** (peso morto claro) | 24 | 98 | 12 | 134 |

> Nota de contagem: o subagente de skills classificou 200 das ~211 pastas listadas em `.cursor/skills/`; o de commands classificou 92 dos 94 arquivos em `.claude/commands/`. A diferença é arredondamento/pequenas omissões dos próprios subagentes, não reconciliada à força — se você quiser fechar 100%, rode `ls .cursor/skills | wc -l` e `ls .claude/commands | wc -l` e compare com as listas abaixo.

### 1.1 Onde o token realmente é gasto (leia antes do resto)

- **Rules (`rules/ecc/`) já estão bem escopadas.** O `CLAUDE.md` raiz só importa, via `@`, as pastas `common/` (10 arquivos), `typescript/` (5), `react/` (5) e `web/` (7) — 27 arquivos cujo **conteúdo inteiro** entra em toda mensagem da sessão. As outras 17 pastas de linguagem (`angular`, `arkts`, `cpp`, `csharp`, `dart`, `fsharp`, `golang`, `java`, `kotlin`, `nuxt`, `perl`, `php`, `python`, `ruby`, `rust`, `swift`, `vue`) existem em disco mas **não são importadas** — custam zero token por turno, só espaço/manutenção no repo. Cortá-las é limpeza de repositório, não economia de contexto.
- **O gasto recorrente real está no catálogo de agents + skills**, que lista nome + descrição de cada um em todo turno de toda sessão, independente de uso. É aqui que a poda de fato reduz tokens por mensagem.
- **Commands pesam menos** (aparecem como lista de nomes, sem descrição, no listing de skills) mas ainda somam.

### 1.2 Correção de premissa (importante)

O pedido original partiu de "o projeto é só TypeScript". Não é bem assim — o monorepo tem **três apps nativos reais e ativos** fora do índice de `AGENTS.md` da raiz:

| App | Stack | Evidência |
|---|---|---|
| `apps/marketplace/android` | Kotlin + Jetpack Compose | 467 arquivos `.kt`, `build.gradle.kts` com `compose = true`, commits até 2026-08-05 |
| `apps/marketplace/ios` | Swift + SwiftUI | 251 arquivos `.swift`, `CityBox.xcodeproj` real, commits até 2026-07-26 |
| `apps/pdv/app` | Flutter/Dart (desktop Linux/Windows + tablet Android) | 358 arquivos `.dart`, `pubspec.yaml`, commits até 2026-08-12 (o mais recente dos três) |

Isso muda `kotlin-*`, `swift-*`, `flutter-*`, `dart-*` de "remover" para **DAILY** nos agents e commands. Java "de verdade" (Spring Boot/Quarkus), C++, C#, PHP, Go, Rust, F#, Vue e HarmonyOS/ArkTS continuam **100% ausentes** — confirmado que o único `.java` do repo é `GeneratedPluginRegistrant.java` autogerado pelo Flutter, e os `.cpp` são boilerplate do runner Windows do Flutter.

### 1.3 Outros achados fora do escopo direto de agents/skills/commands

- **`.claude/settings.json` não existe.** Zero hook configurado (nenhum prettier/eslint/tsc automático). Mesmo assim, `common/hooks.md`, `typescript/hooks.md`, `react/hooks.md` e `web/hooks.md` — todos carregados toda sessão — descrevem em detalhe hooks que não existem no disco. Decidir: religar de verdade ou cortar essas seções do que é sempre carregado.
- **`.mcp.json`** só tem o servidor `higgsfield` (geração de mídia/vídeo via IA). O `CLAUDE.md` documenta "chrome-devtools", que não existe em lugar nenhum do repo. Divergência entre doc e realidade.
- **`AGENTS.md` raiz não lista os três apps nativos** citados em 1.2 — débito de documentação, não item de remoção do ECC.
- **`.specify/`/`specs/` é uso real**, não lixo: 13 specs reais (fiscal-api, NFS-e, DANFE, NFC-e, por vertical), 14 commits tocando `.specify`, `constitution.md` preenchido com princípios específicos do projeto. Os `speckit-*` (skills e o que houver de commands) ficam.

---

## 2. Agents (`.claude/agents/`, 67 arquivos)

### 2.1 DAILY (29) — usar toda sessão

| Agent | Motivo |
|---|---|
| `a11y-architect` | WCAG 2.2 para web e nativo — cobre Next.js e os 3 apps nativos confirmados. |
| `architect` | Design de sistema/decisões arquiteturais, usado em qualquer feature nova. |
| `build-error-resolver` | Erros de build/TypeScript — núcleo do stack Nest/Next/Turborepo. |
| `code-architect` | Blueprint de implementação a partir de padrões existentes do código. |
| `code-explorer` | Mapeia arquitetura/dependências do código existente, uso genérico e frequente. |
| `code-reviewer` | "MUST BE USED for all code changes" — revisão genérica de qualidade/segurança. |
| `code-simplifier` | Simplificação de código recém-modificado. |
| `comment-analyzer` | Qualidade de comentários, barato de rodar em qualquer PR. |
| `dart-build-resolver` | App Flutter real em `apps/pdv/app` (358 arquivos, commits até 12/08). |
| `database-reviewer` | Especialista PostgreSQL — bate direto com Prisma + Postgres do projeto. |
| `doc-updater` | Mantém docs/CODEMAPS e READMEs — tarefa recorrente, e política obrigatória do CLAUDE.md. |
| `docs-lookup` | Context7 para docs atualizadas de qualquer lib (NestJS/Next/Prisma), agnóstico de linguagem. |
| `e2e-runner` | Playwright E2E — repo tem workspace dedicado `tests/e2e-ui`. |
| `flutter-reviewer` | App Flutter de PDV, ativo e crescendo. |
| `kotlin-build-resolver` | App Android nativo Kotlin+Compose em `apps/marketplace/android`. |
| `kotlin-reviewer` | Mesmo app Android nativo. |
| `performance-optimizer` | Bottlenecks, bundle size, render — recorrente em qualquer stack web. |
| `planner` | Planejamento de features/refactors complexos, ativado automaticamente. |
| `pr-test-analyzer` | Qualidade de cobertura de teste em PR. |
| `react-build-resolver` | Erros de build Next.js/React (JSX, hidratação, boundary server/client) — core do frontend. |
| `react-reviewer` | "MUST BE USED for React projects" — core do frontend Next.js 16/React 19. |
| `refactor-cleaner` | Usa knip/depcheck/ts-prune — ferramentas específicas do ecossistema TS deste repo. |
| `security-reviewer` | OWASP/secrets/injection, gate de segurança recorrente. |
| `silent-failure-hunter` | Erros engolidos/fallbacks ruins, alto valor em qualquer PR. |
| `swift-build-resolver` | App iOS nativo SwiftUI em `apps/marketplace/ios`. |
| `swift-reviewer` | Mesmo app iOS nativo. |
| `tdd-guide` | Disciplina TDD genérica, cobertura 80%+, aplicável a todo o monorepo. |
| `type-design-analyzer` | Encapsulamento/invariantes de tipos — relevante para o rigor de tipos do TS. |
| `typescript-reviewer` | "MUST BE USED for TypeScript/JavaScript" — é o backend Nest + frontend Next. |

### 2.2 LIBRARY (14) — manter, não carregar por padrão

| Agent | Motivo |
|---|---|
| `agent-evaluator` | Meta-agente de avaliação de qualidade de output de outros agentes, uso esporádico de harness. |
| `conversation-analyzer` | Alimenta `/hookify`, mas é tooling de harness, não revisão de stack. |
| `gan-evaluator` | Harness GAN ligado a `/gan-build`/`/gan-design`, mas é fluxo alternativo nichado. |
| `gan-generator` | Idem, parte do trio GAN. |
| `gan-planner` | Idem, parte do trio GAN. |
| `harness-optimizer` | Tuning do harness Claude Code em si, não revisão de código do produto. |
| `loop-operator` | Operação de loops autônomos, meta-harness. |
| `marketing-agent` | Copywriting/campanhas — uso plausível para o marketplace B2C, mas não é agente de engenharia. |
| `opensource-forker` | Só relevante se decidirem abrir o código; sem sinal disso hoje. |
| `opensource-packager` | Idem, estágio 3 do mesmo pipeline. |
| `opensource-sanitizer` | Idem, estágio 2 do mesmo pipeline. |
| `python-reviewer` | Só 2 scripts utilitários pequenos (ícones/logo) no repo, não há app Python de produção. |
| `seo-specialist` | Plausível para páginas públicas do marketplace B2C, mas não é gate diário de engenharia. |
| `spec-miner` | Alvo é workflow OpenSpec puro — não existe pasta `openspec/` no repo hoje (repo usa `.specify/`/speckit). |

### 2.3 REMOVER (24) — stack 100% ausente

| Agent | Motivo |
|---|---|
| `chief-of-staff` | Triagem pessoal de email/Slack/LINE/Messenger — zero relação com o código do produto. |
| `cpp-build-resolver` | Únicos `.cpp` do repo são boilerplate de runner Windows do Flutter + cache CMake, nunca editados à mão. |
| `cpp-reviewer` | Mesma razão — não há C++ de aplicação no repo. |
| `csharp-reviewer` | Zero arquivos `.cs` no monorepo. |
| `django-build-resolver` | Nenhum projeto Django/Python web no repo. |
| `django-reviewer` | Idem. |
| `fastapi-reviewer` | Nenhum FastAPI no repo. |
| `fsharp-reviewer` | Zero F#. |
| `go-build-resolver` | Zero arquivos `.go`/`go.mod` no repo. |
| `go-reviewer` | Idem. |
| `harmonyos-app-resolver` | Stack explicitamente ausente (ArkTS/HarmonyOS). |
| `healthcare-reviewer` | Enquadrado para PHI/HIPAA dos EUA; a vertical clínica aqui responde a LGPD, não HIPAA — `security-reviewer`+`database-reviewer` já cobrem o que existe de fato. |
| `homelab-architect` | Domínio de rede doméstica, nenhuma relação com o produto. |
| `java-build-resolver` | Único `.java` é `GeneratedPluginRegistrant.java` autogerado pelo Flutter; agente é para Spring Boot/Quarkus, ausentes. |
| `java-reviewer` | Idem — nota: Kotlin é vivo no projeto (Android), mas Java-para-backend não é o mesmo domínio. |
| `mle-reviewer` | Nenhum código de ML/MLOps/feature store no repo. |
| `network-architect` | Domínio de rede corporativa, sem relação com o produto. |
| `network-config-reviewer` | Idem. |
| `network-troubleshooter` | Idem. |
| `php-reviewer` | Zero PHP/Laravel no repo. |
| `pytorch-build-resolver` | Nenhum treino/inferência ML no repo. |
| `rust-build-resolver` | Zero `.rs` no repo. |
| `rust-reviewer` | Idem. |
| `vue-reviewer` | Zero `.vue` no repo, stack explicitamente ausente. |

### 2.4 Redundâncias entre agents (independente do bucket)

- `architect` × `code-architect` × `planner` — os três atuam em "desenhar antes de codar" com escopos sobrepostos. Revisar gatilhos para não disparar os três na mesma tarefa.
- `code-explorer` × `spec-miner` — ambos extraem entendimento de código existente; `spec-miner` não tem `openspec/` para consumir sua saída hoje.
- `build-error-resolver` × `react-build-resolver` — qualquer falha de build Next.js é ao mesmo tempo erro TS e erro React; documentar limite claro entre os dois.
- `java-reviewer`/`java-build-resolver` × `kotlin-reviewer`/`kotlin-build-resolver` — como o Android do projeto é 100% Kotlin/Compose (não Java), os agentes Java não têm sobreposição real de uso — reforça que Java aqui é peso morto puro.
- Trio `gan-planner`/`gan-generator`/`gan-evaluator` replica, como workflow alternativo, o que `planner`+`tdd-guide`+`e2e-runner` já cobrem. Plugado via `/gan-build`/`/gan-design` — decidir qual dos dois fluxos mantém.
- Trio `opensource-forker`/`opensource-sanitizer`/`opensource-packager` só faz sentido junto e só se houver plano real de abrir o código — sem evidência disso.
- Cluster de rede (`network-architect`, `network-config-reviewer`, `network-troubleshooter`, `homelab-architect`) — kit completo de engenharia de rede sem ponto de contato com o domínio do projeto.
- `chief-of-staff`, `marketing-agent`, `seo-specialist` — não são agentes de engenharia de código; parecem vir de um template genérico do ECC não customizado para este repo.

---

## 3. Skills (`.cursor/skills/`, ~211 pastas, 200 classificadas)

### 3.1 DAILY (22)

| Skill | Motivo |
|---|---|
| `api-design` | REST API design (recursos, status codes, paginação) — usado direto no backend NestJS. |
| `backend-patterns` | Padrões Node/Express/Next API routes aplicáveis ao backend NestJS/BFF. |
| `coding-standards` | Convenções base de código usadas em qualquer code review do monorepo. |
| `database-migrations` | Migrations versionadas — exatamente o fluxo do Prisma no projeto. |
| `deployment-patterns` | CI/CD, health checks, rollback — usado no deploy do monorepo. |
| `docker-patterns` | Docker Compose é a infra local declarada (Postgres, Redis, RabbitMQ, Typesense, Keycloak). |
| `documentation-lookup` | Context7 MCP para docs de React/Next/Prisma. |
| `e2e-testing` | Playwright é o E2E test runner declarado. |
| `error-handling` | Padrões de erro tipado/retry usados no backend (a fatia TS do skill é a relevante). |
| `frontend-patterns` | React/Next.js state management, performance — stack frontend real. |
| `github-ops` | `gh` CLI para PR/issue/CI — fluxo real de operação do repo. |
| `nestjs-patterns` | Match 1:1 com o framework backend do projeto. |
| `nextjs-turbopack` | Next.js 16 é a versão declarada, Turbopack é o bundler padrão dela. |
| `postgres-patterns` | Banco declarado do projeto. |
| `prisma-patterns` | ORM declarado, inclusive armadilhas específicas (updateMany, $transaction) citadas na stack. |
| `react-patterns` | React 19 é o frontend declarado. |
| `react-performance` | Otimização de performance React/Next. |
| `react-testing` | Vitest/Jest + RTL — testes declarados no projeto. |
| `search-first` | Pesquisar antes de codar — workflow de engenharia diário. |
| `security-review` | Checklist de segurança para auth/API/secrets — aplicável a qualquer endpoint novo. |
| `tdd-workflow` | TDD com cobertura — metodologia de desenvolvimento citada. |
| `verification-loop` | Loop de verificação de sessão Claude Code antes de PR. |

**Redundância a notar:** `backend-patterns` e `frontend-patterns` são genéricos e se sobrepõem fortemente com `nestjs-patterns`+`api-design` (backend) e `react-patterns`+`react-performance`+`nextjs-turbopack` (frontend). Não são inúteis, mas há sobreposição de conteúdo.

### 3.2 LIBRARY (36) — ocasional/nicho, não do fluxo diário

| Skill | Motivo |
|---|---|
| `api-connector-builder` | Útil só quando se adiciona uma integração nova (Keycloak/RabbitMQ etc.). |
| `article-writing` | Conteúdo longo — marketing/blog ocasional. |
| `benchmark-optimization-loop` | Otimização via múltiplas variantes — nicho, não diário. |
| `brand-voice` | Perfil de voz para conteúdo — marketing ocasional. |
| `code-tour` | Tours de onboarding/arquitetura — útil pontualmente. |
| `content-engine` | Conteúdo multi-plataforma — marketing, não engenharia. |
| `content-hash-cache-pattern` | Padrão de cache genérico, aplicável mas não central. |
| `cost-aware-llm-pipeline` | Só relevante se o produto ganhar feature de IA/LLM (não confirmado). |
| `council` | Ferramenta de decisão genérica, útil ocasionalmente para trade-offs. |
| `crosspost` | Distribuição de conteúdo social — marketing. |
| `customer-billing-ops` | Só relevante se o produto usa Stripe/billing (plausível, não confirmado no stack). |
| `dashboard-builder` | Grafana/SigNoz — monitoramento de produção, ocasional. |
| `data-scraper-agent` | Scraping automatizado — nicho. |
| `data-throughput-accelerator` | ETL/backfill em massa — só relevante em migrações grandes. |
| `deep-research` | Pesquisa multi-fonte via firecrawl/exa — ocasional. |
| `exa-search` | Busca web via MCP — pesquisa ocasional. |
| `frontend-design-direction` | Direção de design de UI — usado pontualmente em features grandes de UI. |
| `google-workspace-ops` | Drive/Docs/Sheets — produtividade interna ocasional. |
| `investor-materials` | Pitch decks/memos — só se houver captação ativa. |
| `investor-outreach` | Idem, outreach a investidores. |
| `jira-integration` | Só se o time usar Jira (não confirmado; projeto parece GitHub-centric). |
| `latency-critical-systems` | Sistemas realtime/HFT-like — não é o perfil do produto, mas pode ajudar em partes críticas. |
| `lead-intelligence` | Growth/outbound — nicho de vendas B2B. |
| `make-interfaces-feel-better` | Polimento de UI — ocasional, não todo PR. |
| `market-research` | Pesquisa de mercado/competidores — decisão de negócio ocasional. |
| `mcp-server-patterns` | Só se o projeto construir servidores MCP próprios (não confirmado). |
| `motion-ui` | Sistema de motion — só quando há animação a construir. |
| `nutrient-document-processing` | Processamento de PDF/OCR — nicho, só se houver feature de documentos. |
| `plankton-code-quality` | Depende de ferramenta terceira "Plankton" não confirmada no projeto. |
| `production-audit` | Auditoria de prontidão para produção — pontual, pré-launch. |
| `project-flow-ops` | GitHub+Linear triage — redundante com `github-ops`; só útil se Linear for adotado. |
| `regex-vs-llm-structured-text` | Framework de decisão genérico, ocasional. |
| `security-bounty-hunter` | Pentest/bug bounty — nicho de segurança ofensiva. |
| `seo` | SEO para o marketplace B2C — plausível mas não parte do dia a dia de código. |
| `ui-demo` | Gravação de demo em vídeo via Playwright — ocasional, para docs/marketing. |
| `x-api` | Integração com X/Twitter — marketing/social ocasional. |

### 3.3 META (44) — manutenção do próprio harness/ECC, não do produto

Não são "lixo" — são ferramenta de operar o Claude Code em si.

**Cluster "-ops" ECC (9):** `email-ops`, `messages-ops`, `finance-billing-ops`, `research-ops`, `terminal-ops`, `knowledge-ops`, `unified-notifications-ops`, `automation-audit-ops`, `workspace-surface-audit`
Todos seguem o mesmo padrão "evidence-first workflow for ECC" e se sobrepõem consideravelmente entre si.

**Cluster orquestração de agentes (14):** `agent-architecture-audit`, `agent-harness-construction`, `agent-introspection-debugging`, `agentic-os`, `autonomous-loops`, `continuous-agent-loop`, `enterprise-agent-ops`, `dynamic-workflow-mode`, `ralphinho-rfc-pipeline`, `team-agent-orchestration`, `claude-devfleet`, `parallel-execution-optimizer`, `recursive-decision-ledger`, `benchmark-optimization-loop`
14 skills tratando essencialmente do mesmo tema ("como construir/orquestrar sistemas de agentes Claude"), fronteiras pouco claras entre eles.

**Demais META (21):** `agent-sort`, `agentic-engineering`, `ai-first-engineering`, `ai-regression-testing`, `blueprint`, `configure-ecc`, `continuous-learning` (deprecated, redireciona para v2), `continuous-learning-v2`, `cost-tracking`, `ecc-tools-cost-audit`, `eval-harness`, `hookify-rules`, `iterative-retrieval`, `nanoclaw-repl`, `product-capability`, `prompt-optimizer`, `security-scan` (escaneia `.claude/`, não o app), `skill-scout`, `skill-stocktake`, `strategic-compact`, `team-builder`, `token-budget-advisor`

### 3.4 REMOVER (98) — zero chance de uso

#### 3.4a Linguagem/framework 100% ausente (51)

Quartetos quase idênticos por linguagem (`*-patterns`/`*-security`/`*-tdd`/`*-verification`) — remover o quarteto inteiro de uma vez:

`android-clean-architecture`, `angular-developer`, `compose-multiplatform-patterns`, `cpp-coding-standards`, `cpp-testing`, `csharp-testing`, `dart-flutter-patterns`, `django-patterns`, `django-security`, `django-tdd`, `django-verification`, `dotnet-patterns`, `fastapi-patterns`, `foundation-models-on-device`, `fsharp-testing`, `golang-patterns`, `golang-testing`, `java-coding-standards`, `jpa-patterns`, `kotlin-coroutines-flows`, `kotlin-exposed-patterns`, `kotlin-ktor-patterns`, `kotlin-patterns`, `kotlin-testing`, `laravel-patterns`, `laravel-plugin-discovery`, `laravel-security`, `laravel-tdd`, `laravel-verification`, `liquid-glass-design`, `mysql-patterns`, `perl-patterns`, `perl-security`, `perl-testing`, `python-patterns`, `python-testing`, `quarkus-patterns`, `quarkus-security`, `quarkus-tdd`, `quarkus-verification`, `rust-patterns`, `rust-testing`, `springboot-patterns`, `springboot-security`, `springboot-tdd`, `springboot-verification`, `swift-actor-persistence`, `swift-concurrency-6-2`, `swift-protocol-di-testing`, `swiftui-patterns`, `ui-to-vue`, `vue-patterns`, `windows-desktop-e2e`

Bônus: `bun-runtime` e `clickhouse-io` — o projeto fixou pnpm+Turborepo (não Bun) e Postgres+Typesense (não ClickHouse).

> Nota: apesar de Kotlin/Swift serem DAILY em *agents* (apps nativos reais), os quartetos de *skills* Kotlin/Swift acima são variantes Ktor/Exposed/coroutines/SwiftUI-patterns genéricas — redundantes com o que `kotlin-reviewer`/`swift-reviewer` já cobrem via prática de review. Reavaliar se a equipe nativa crescer.

#### 3.4b Domínio de negócio completamente alheio (47)

`blender-motion-state-inspection`, `carrier-relationship-management`, `cisco-ios-patterns`, `connections-optimizer`, `customs-trade-compliance`, `defi-amm-security`, `energy-procurement`, `evm-token-decimals`, `fal-ai-media`, `frontend-slides`, `healthcare-phi-compliance`, `hipaa-compliance`, `homelab-network-readiness`, `homelab-network-setup`, `inventory-demand-planning`, `ito-basket-compare`, `ito-data-atlas-agent`, `ito-market-intelligence`, `ito-trade-planner`, `llm-trading-agent-security`, `logistics-exception-management`, `manim-video`, `mle-workflow`, `netmiko-ssh-automation`, `network-bgp-diagnostics`, `network-config-validation`, `network-interface-health`, `nodejs-keccak256`, `prediction-market-oracle-research`, `prediction-market-risk-review`, `production-scheduling`, `quality-nonconformance`, `remotion-video-creation`, `returns-reverse-logistics`, `scientific-db-pubmed-database`, `scientific-db-uspto-database`, `scientific-pkg-gget`, `scientific-thinking-literature-review`, `scientific-thinking-scholar-evaluation`, `social-graph-ranker`, `videodb`, `video-editing`, `visa-doc-translate`

Notas específicas:
- `ito-*` (4) formam o cluster de "prediction market" — redundantes entre si e fora do domínio.
- `network-*` + `cisco-ios-patterns` + `netmiko-ssh-automation` (5) formam o cluster de rede/telecom.
- `scientific-*` (5) formam o cluster acadêmico/biomédico.
- `healthcare-phi-compliance` e `hipaa-compliance` são um par redundante entre si; HIPAA/PHI são conceitos jurídicos dos EUA — no Brasil a legislação aplicável é LGPD, que nenhum dos dois cobre.
- `videodb`, `video-editing`, `remotion-video-creation`, `manim-video`, `fal-ai-media` formam o cluster de mídia/vídeo como produto — domínio explicitamente ausente.

### 3.5 Redundâncias entre skills mantidos

1. `backend-patterns` (genérico) se sobrepõe a `nestjs-patterns`+`api-design`.
2. Cluster frontend com 7 skills tocando "como fazer React/Next.js ficar bom": `frontend-patterns`, `react-patterns`, `react-performance`, `nextjs-turbopack`, `frontend-design-direction`, `motion-ui`, `make-interfaces-feel-better`.
3. `error-handling` cobre TS + Python + Go no mesmo arquivo — só a fatia TS é usada.
4. `database-migrations` (genérico multi-DB) vs. `prisma-patterns` (específico) — complementares, não redundantes.
5. Cluster "-ops" ECC (9 skills) e cluster de orquestração de agentes (14 skills) — ver §3.3.
6. `project-flow-ops` parcialmente redundante com `github-ops` (DAILY) — só adiciona valor se Linear for usado (não confirmado).

---

## 4. Commands (`.claude/commands/`, 94 arquivos, 92 classificados)

### 4.1 DAILY (19)

| Command | Motivo |
|---|---|
| `feature.md` | Orquestrador de feature nova citado literalmente no CLAUDE.md. |
| `bugfix.md` | Orquestrador de bugfix citado literalmente no CLAUDE.md. |
| `plan-prd.md` | Fase 1 do `/feature`. |
| `plan.md` | Fase 1 do `/feature`/pipeline, "para aguardando CONFIRM". |
| `code-review.md` | Fase 4 do `/feature` e do `/bugfix`. |
| `security-scan.md` | Fase 6 condicional (auth/PSP/tenant/secrets). |
| `checkpoint.md` | Parte do harness ECC do projeto. |
| `pr.md` | Passo final do pipeline. |
| `quality-gate.md` | Gate de qualidade, parte do pipeline `pnpm build/lint/typecheck/test`. |
| `test-coverage.md` | Suporta a fase TDD do `/feature`/`/bugfix`. |
| `refactor-clean.md` | Alinhado ao code-review (sem dead code, imutabilidade). |
| `review-pr.md` | Complementa `/pr` para revisão de PR já aberto. |
| `react-build.md` | Stack real — frontend é React/Next.js. |
| `react-review.md` | Idem. |
| `react-test.md` | Idem, TDD com RTL. |
| `sessions.md` | Gestão de sessão, útil sempre. |
| `resume-session.md` | Idem. |
| `save-session.md` | Idem. |
| `cost-report.md` | Relatório de custo local, útil sempre. |

### 4.2 LIBRARY — stacks secundárias reais (7)

| Command | Motivo |
|---|---|
| `flutter-build.md` | Stack real: `apps/pdv/app` é Flutter/Dart. |
| `flutter-review.md` | Idem. |
| `flutter-test.md` | Idem. |
| `kotlin-build.md` | Stack real: `apps/marketplace/android`, 467 arquivos `.kt` nativos. |
| `kotlin-review.md` | Idem. |
| `kotlin-test.md` | Idem. |
| `gradle-build.md` | Android usa Gradle de verdade (`build.gradle.kts`). |

### 4.3 LIBRARY — meta-ferramentas ECC (27)

| Command | Motivo |
|---|---|
| `ecc-guide.md` | Navegação do próprio ECC. |
| `harness-audit.md` | Auditoria do harness ECC, não do projeto. |
| `auto-update.md` | Atualiza o repo ECC, não o Citybox. |
| `project-init.md` | Onboarding de stack — já feito, uso pontual. |
| `projects.md` | Lista projetos com instincts do ECC. |
| `model-route.md` | Recomendação de modelo. |
| `skill-create.md` | Gera SKILL.md a partir do histórico git — uso ocasional. |
| `skill-health.md` | Dashboard de portfólio de skills do ECC. |
| `learn.md` | Extrai padrões de sessão para skills. |
| `learn-eval.md` | Variante de `learn.md` com auto-avaliação. |
| `evolve.md` | Evolui instincts em estruturas. |
| `promote.md` | Promove instincts de projeto para global. |
| `prune.md` | Limpa instincts antigos não promovidos. |
| `instinct-export.md` | Meta-ferramenta de instincts. |
| `instinct-import.md` | Idem. |
| `instinct-status.md` | Idem. |
| `hookify.md` | Cria hooks a partir de análise de conversa. |
| `hookify-configure.md` | Ativa/desativa regras hookify. |
| `hookify-help.md` | Ajuda do sistema hookify. |
| `hookify-list.md` | Lista regras hookify configuradas. |
| `loop-start.md` | Loop autônomo genérico ECC, sem uso documentado aqui. |
| `loop-status.md` | Idem. |
| `aside.md` | Utilitário genérico de pergunta lateral. |
| `setup-pm.md` | Package manager já fixo em pnpm@9.15.0 — comando obsoleto. |
| `feature-dev.md` | **Redundante/concorrente com `/feature`** — orquestrador genérico sem as fases específicas do CLAUDE.md. |
| `build-fix.md` | Genérico stack-agnostic; sobreposto pelo passo `pnpm build && lint && typecheck` já embutido no `/feature`/`/bugfix`. |
| `update-docs.md` | Alinhado com a política de manter `AGENTS.md` atualizado — vale manter, uso ocasional. |
| `update-codemaps.md` | Útil pontualmente num monorepo grande, mas fora do fluxo documentado. |

### 4.4 LIBRARY — workflow que não bate com o projeto (26)

Sem vestígio de uso (sem Jira, sem `gh` CLI instalado no ambiente do subagente, sem menção no CLAUDE.md/AGENTS.md). Todos competem diretamente com `/feature` e `/bugfix`.

| Command | Motivo |
|---|---|
| `jira.md` | Sem integração Jira no projeto. |
| `epic-claim.md` | Fluxo de coordenação de epics via GitHub Issues, não documentado/usado. |
| `epic-decompose.md` | Idem. |
| `epic-publish.md` | Idem. |
| `epic-review.md` | Idem. |
| `epic-sync.md` | Idem. |
| `epic-unblock.md` | Idem. |
| `epic-validate.md` | Idem. |
| `prp-commit.md` | Metodologia PRPs-agentic-eng não usada; redundante com `/pr`. |
| `prp-implement.md` | Redundante com a fase TDD do `/feature`. |
| `prp-plan.md` | Redundante com `/plan`. |
| `prp-prd.md` | Redundante com `/plan-prd`. |
| `prp-pr.md` | **Duplicata quase literal de `pr.md`** (mesma description, mesmo corpo). |
| `orch-add-feature.md` | Orquestrador GAN concorrente do `/feature` customizado do projeto. |
| `orch-build-mvp.md` | Idem, para bootstrap de MVP — não se aplica a monorepo já maduro. |
| `orch-change-feature.md` | Concorrente do `/feature` para alteração de comportamento. |
| `orch-fix-defect.md` | Concorrente direto do `/bugfix` customizado. |
| `orch-refine-code.md` | Concorrente do `/feature`/`refactor-clean`. |
| `multi-backend.md` | Workflow multi-modelo não documentado/usado. |
| `multi-execute.md` | Idem. |
| `multi-frontend.md` | Idem. |
| `multi-plan.md` | Idem. |
| `multi-workflow.md` | Idem. |
| `gan-build.md` | Loop generator/evaluator não documentado; concorre com TDD do `/feature`. |
| `gan-design.md` | Idem, para trabalho de UI. |
| `santa-loop.md` | Loop adversarial dual-review; concorre com `/code-review` + `/security-scan`. |
| `pm2.md` | Infra real é Docker Compose + Turborepo, não PM2 — nenhum vestígio de PM2 no repo. |

### 4.5 Fora de escopo total (1)

| Command | Motivo |
|---|---|
| `marketing-campaign.md` | Geração de campanha de marketing — sem relação com o fluxo de engenharia do repo. |

### 4.6 REMOVER — stack 100% ausente (12)

| Command | Motivo |
|---|---|
| `go-build.md` | Nenhum `.go`/`go.mod` no repo. |
| `go-review.md` | Idem. |
| `go-test.md` | Idem. |
| `rust-build.md` | Nenhum `Cargo.toml`/`.rs` no repo. |
| `rust-review.md` | Idem. |
| `rust-test.md` | Idem. |
| `cpp-build.md` | Nenhum `CMakeLists.txt`/`.cpp` de aplicação no repo. |
| `cpp-review.md` | Idem. |
| `cpp-test.md` | Idem. |
| `python-review.md` | Só 2 scripts utilitários Python, nenhuma aplicação real para revisar. |
| `fastapi-review.md` | Nenhum framework web Python no monorepo. |
| `vue-review.md` | Frontend é 100% React/Next.js; nenhum `.vue` no repo. |

### 4.7 Recomendações diretas de commands

1. **Remoção segura (14):** os 12 do §4.6 + `prp-pr.md` (duplicata literal de `pr.md`) + `marketing-campaign.md` (fora do domínio).
2. **Redundância a resolver, não remoção pura:** `feature-dev.md`, `build-fix.md`, e todo o cluster §4.4 (`orch-*`/`gan-*`/`santa-loop`/`multi-*`/`epic-*`/`prp-*`) competem com `/feature`+`/bugfix`. Manter os dois conjuntos ativos é fonte real de confusão — decidir qual fica.
3. **Não presumir que Flutter/Kotlin são peso morto** — ver §1.2.
4. **Jira/Epic/PRP (14 arquivos):** sem vestígio de uso — bons candidatos a uma segunda rodada de corte se quiser ser mais agressivo.

---

## 5. Rules (`.claude/rules/ecc/`, 21 diretórios de linguagem)

| Diretório | Arquivos | Carregado sempre via `@` no CLAUDE.md? | Status |
|---|---|---|---|
| `common/` | 10 | Sim | Ativo — mantém |
| `typescript/` | 5 | Sim | Ativo — mantém |
| `react/` | 5 | Sim | Ativo — mantém |
| `web/` | 7 | Sim | Ativo — mantém |
| `angular/` | 5 | Não | Stack ausente — remover |
| `arkts/` | 5 | Não | Stack ausente — remover |
| `cpp/` | 5 | Não | Stack ausente — remover |
| `csharp/` | 5 | Não | Stack ausente — remover |
| `dart/` | 5 | Não | **Stack presente** (Flutter/PDV) mas não importado — avaliar promover ou manter como está |
| `fsharp/` | 5 | Não | Stack ausente — remover |
| `golang/` | 5 | Não | Stack ausente — remover |
| `java/` | 5 | Não | Stack ausente (só autogerado) — remover |
| `kotlin/` | 5 | Não | **Stack presente** (Android nativo) mas não importado — avaliar promover ou manter como está |
| `nuxt/` | 5 | Não | Stack ausente — remover |
| `perl/` | 5 | Não | Stack ausente — remover |
| `php/` | 5 | Não | Stack ausente — remover |
| `python/` | 6 | Não | Stack quase ausente (2 scripts utilitários) — remover |
| `ruby/` | 5 | Não | Stack ausente — remover |
| `rust/` | 5 | Não | Stack ausente — remover |
| `swift/` | 5 | Não | **Stack presente** (iOS nativo) mas não importado — avaliar promover ou manter como está |
| `vue/` | 5 | Não | Stack ausente — remover |

Como nenhum desses 17 diretórios (exceto o carregado via `common/typescript/react/web`) é importado pelo CLAUDE.md, removê-los é limpeza de repositório — **não reduz tokens por sessão**. `dart/`, `kotlin/` e `swift/` merecem uma decisão à parte: já que os apps nativos existem de verdade, faz sentido considerar importá-los via `@` nos respectivos `AGENTS.md` dos apps nativos (não no CLAUDE.md raiz, que é o contexto do monorepo inteiro) em vez de removê-los.

---

## 6. Hooks e MCP

- **`.claude/settings.json` não existe.** Nenhum hook configurado. `common/hooks.md`, `typescript/hooks.md`, `react/hooks.md`, `web/hooks.md` (todos sempre carregados) descrevem hooks de prettier/eslint/tsc que não estão de fato ligados — conteúdo pago em toda mensagem descrevendo infraestrutura fictícia.
  - **Opção A:** criar `.claude/settings.json` e ligar de verdade os hooks descritos (prettier/eslint/tsc pós-edição) — ganho real de qualidade automática.
  - **Opção B:** cortar as seções de hook desses 4 arquivos se não há intenção de usar hooks — reduz tokens por sessão.
- **`.mcp.json`** só declara `higgsfield` (mcp.higgsfield.ai — geração de mídia/vídeo via IA). O `CLAUDE.md` documenta "chrome-devtools" como o MCP do projeto — não existe em lugar nenhum do repo. Confirmar se `higgsfield` é intencional (sobra de teste?) e se `chrome-devtools` deveria ser adicionado.
- `.claude/mcp-configs/mcp-servers.json` existe como catálogo extra (não verificado em detalhe nesta auditoria).

---

## 7. Plano de ação sugerido

1. **Remoção segura, alta confiança — 24 agents + 98 skills + 14 commands = 136 arquivos/pastas.**
   Stack 100% ausente confirmada por três passes independentes. Ver listas completas em §2.3, §3.4 e §4.6+§4.7.

2. **Decisão de equipe, não remoção automática — 26 commands + trio `gan-*` + trio `opensource-*`.**
   O cluster `epic-*`/`prp-*`/`orch-*`/`multi-*`/`gan-*`/`santa-loop` compete com `/feature`+`/bugfix`. Não é sobre token — é sobre não ter dois fluxos concorrentes fazendo a mesma coisa.

3. **Corrigir a documentação, não o ECC.**
   Adicionar `apps/marketplace/android`, `apps/marketplace/ios` e `apps/pdv/app` ao índice de `AGENTS.md` da raiz.

4. **Investigar antes de mexer — hooks + MCP.**
   Decidir se os hooks descritos em `rules/ecc/*/hooks.md` vão ser ligados de fato ou removidos da leitura sempre-carregada. Confirmar `higgsfield` vs. `chrome-devtools` em `.mcp.json`.

5. **Limpeza de repositório de baixa prioridade — 17 diretórios de `rules/ecc/` não importados.**
   Não afeta tokens por sessão, mas reduz ruído de manutenção. `dart/`, `kotlin/`, `swift/` merecem decisão separada (ver §5) já que a stack nativa existe de verdade.

---

*Relatório gerado por 3 subagentes em paralelo (Explore, read-only) + verificação direta nesta sessão. Nenhuma exclusão foi executada.*
