---
description: Desenvolve uma feature nova ponta a ponta (Nest.js + React + Prisma/Postgres) orquestrando todos os subagentes automaticamente
argument-hint: <descrição da feature> (ex.: "cadastro de clientes com endereço e busca por documento")
---

# /feature — Fluxo completo de feature nova

Você vai implementar a feature descrita abaixo **de ponta a ponta**, executando TODO o fluxo sozinho e **delegando aos subagentes especializados sem pedir confirmação sobre qual usar**. Só pare para perguntar se houver uma ambiguidade que impeça o trabalho (regra de negócio essencial faltando, decisão destrutiva, credencial ausente) — ou no portão de aprovação do plano.

**Feature solicitada:** $ARGUMENTS

## Stack do projeto (assuma estes padrões)
- **Backend:** Nest.js (TypeScript) — módulos/controllers/services/DTOs, `class-validator`, repository pattern, envelope de resposta consistente.
- **ORM/DB:** Prisma + PostgreSQL — mudanças via `schema.prisma` + migrations versionadas.
- **Frontend:** React (TypeScript).
- **Testes:** TDD obrigatório, cobertura alvo 80%+ (unit + integração + e2e do fluxo crítico).
- **Commits:** Conventional Commits.

Trate cada subagente abaixo como invocação real (no Claude Code via subagente; no Cursor via Task tool). Rode em paralelo o que for independente.

**Golden rule (validação contínua):** valide após **cada** mudança; nunca acumule estado quebrado. Se uma validação falha, corrija antes de prosseguir.

---

## Fase 0 — Enquadramento (rápido)
1. Reescreva a feature em uma frase e liste as camadas afetadas (backend / banco / frontend).
2. Liste premissas que está assumindo. Só pergunte se algo for bloqueante.

## Fase 1 — Planejamento + geração dos artefatos (PRD e Plano)
Defina um nome curto em kebab-case para a feature (ex.: `cadastro-clientes`). Use **`{nome}`** abaixo.

1. Use o subagente **planner** para quebrar a feature em fases, arquivos a criar/editar, contrato de API (rotas, DTOs, payloads) e modelo de dados. Se houver decisão arquitetural relevante (novo módulo, integração, mudança de contrato), use também **architect**.
2. Antes de escrever o plano de implementação, **busque padrões reais no código** (naming, error handling, logging, acesso a dados, testes) para espelhar — capture `arquivo:linha`. Se não existir padrão, diga explicitamente; não invente.
3. **Gere e salve dois artefatos em disco** (crie as pastas se necessário):

   **a) PRD →** `.claude/prds/{nome}.prd.md` (requisitos — o "o quê/porquê"), com: Problema, Evidência (ou "Assumption — needs validation via {método}"), Usuários (primário / não-é-para), Hipótese, Métricas de sucesso, Escopo (MVP + fora de escopo), tabela **Delivery Milestones** (`# | Milestone | Outcome | Status | Plan`), Perguntas abertas e Riscos.

   **b) Plano →** `.claude/plans/{nome}.plan.md` (implementação — o "como"), com:
   - `**Source PRD**: .claude/prds/{nome}.prd.md` e `**Complexity**`
   - **Summary** (2–3 frases)
   - **Patterns to Mirror** (tabela Category | Source `arquivo:linha` | Pattern)
   - **Files to Change** (tabela File | CREATE/UPDATE/DELETE | Why) — separe backend Nest, `schema.prisma`/migrations, frontend React
   - **Tasks** — cada uma com *Action*, *Mirror* (padrão a seguir) e *Validate* (comando que prova correção)
   - **Validation** (bloco com os comandos: testes, build, type-check, lint, e2e)
   - **Risks** (tabela)
   - **Acceptance** — checklist `- [ ]` (inclui: tasks completas, validação passa, lint limpo, cobertura 80%+, sem CRITICAL/HIGH)
4. No PRD, marque o milestone selecionado como `in-progress` e preencha a célula **Plan** com `\`.claude/plans/{nome}.plan.md\``.

## 🛑 Fase 1.5 — Aprovação do plano (OBRIGATÓRIA — PARE AQUI)
**NÃO comece a implementar até o usuário aprovar o plano.** Apresente:
- Resumo da feature em 1 frase e camadas afetadas (backend / banco / frontend).
- Mudanças no modelo de dados / `schema.prisma` e migrations previstas.
- Contrato de API (rotas, métodos, DTOs principais) e componentes/telas React previstos.
- Lista de arquivos a criar/editar e principais riscos/premissas.
- **Os caminhos dos dois artefatos salvos**: `.claude/prds/{nome}.prd.md` e `.claude/plans/{nome}.plan.md`.

Depois pergunte explicitamente: **"Posso seguir com este plano? (aprovar / ajustar)"** e **aguarde a resposta do usuário**.
- Se pedir ajustes → **atualize os arquivos** `.prd.md` e `.plan.md` e peça aprovação de novo.
- Só avance para a Fase 1.6 após uma aprovação explícita ("aprovar", "pode seguir", "ok", etc.).

> A partir daqui, o **`.claude/plans/{nome}.plan.md` é a fonte da verdade**: siga as **Tasks** na ordem, execute o *Validate* de cada uma e vá marcando o checklist de **Acceptance**. Se durante a implementação algo divergir do plano, atualize o `.plan.md` antes de seguir.

## Fase 1.6 — Preparação de branch/git
Antes de escrever código, deixe o git pronto e a feature isolada:
1. Verifique o estado: `git branch --show-current` e `git status --porcelain`.
2. Decisão de branch:
   - Já em branch de feature → use a atual.
   - Em `main`/`master` com árvore **limpa** → crie `git checkout -b feat/{nome}`.
   - Em `main`/`master` com árvore **suja** → **PARE** e peça para commitar/stashar antes.
   - Em worktree dedicada → use a worktree.
3. Sincronize o remoto: `git pull --rebase origin $(git branch --show-current) 2>/dev/null || true`.

## Fase 2 — Camada de dados (se o banco for afetado)
- Aplique o conhecimento das skills **prisma-patterns**, **postgres-patterns** e **database-migrations**: atualize `schema.prisma`, gere a migration e o client.
- Revise o schema e a migration com o subagente **database-reviewer** (tipos corretos, índices, constraints/uniques, relações, risco de N+1, segurança). Corrija itens CRITICAL/HIGH/MEDIUM/LOW antes de seguir.

## Fase 3 — Backend (Nest.js) — TDD
1. Use **tdd-guide** para escrever PRIMEIRO os testes que falham (unit dos services + integração/e2e dos endpoints).
2. Implemente module/controller/service/DTOs seguindo **nestjs-patterns**, **backend-patterns**, **api-design** e **error-handling**:
   - Validação de entrada com `class-validator` nos DTOs.
   - Repository pattern para acesso a dados (Prisma isolado da regra).
   - Tratamento de erro em todas as camadas, sem engolir exceção; envelope de resposta consistente.
3. **Validação por task:** após cada arquivo/task, rode o type-check (e o teste relacionado) imediatamente; só passe para a próxima task quando estiver verde. Vá marcando a task correspondente no `.plan.md`.

## Fase 4 — Frontend (React) — TDD
1. Use **react-testing** para escrever os testes primeiro (componentes/hooks/estados), com foco em **comportamento, não implementação**:
   - Queries por role/label (`getByRole`, `getByLabelText`), interação com `userEvent`, rede mockada com **MSW**.
   - Teste de acessibilidade automatizado (ex.: `axe`/`vitest-axe`) nos componentes.
   - Evite anti-padrões: `container.querySelector`, asserts em estado interno, snapshot de componente, mock do próprio `react`.
2. Implemente componentes, hooks e data-fetching seguindo **react-patterns**, **react-performance**, **frontend-patterns** e **frontend-design-direction**.
3. Garanta acessibilidade com o subagente **a11y-architect** (labels, foco, contraste, navegação por teclado).
4. **Validação por task:** type-check + teste do componente após cada peça; nunca acumule estado quebrado.

## Fase 5 — Validação em 5 níveis (corrija em cada nível antes de avançar)

**Nível 1 — Estática:**
- Type-check de backend e frontend (`tsc --noEmit`).
- Lint (ESLint backend + frontend, com `eslint-plugin-react-hooks` e `eslint-plugin-jsx-a11y`; se faltar plugin, sinalize gap HIGH e siga; no Cursor use também o checador da IDE).
- Formatação (Biome `check` ou Prettier `--check`).
- Supply-chain: `npm audit` (ou pnpm/yarn) — trate HIGH/CRITICAL de dependências.

**Nível 2 — Testes unitários + cobertura (portão obrigatório):**
- Rode os testes unitários.
- Detecte o runner (Jest/Vitest) e rode a cobertura; liste arquivos **abaixo da meta**, pior-primeiro, apontando funções/branches/caminhos de erro não testados.
- Gere os testes que faltam na ordem: happy path → tratamento de erro → edge cases (null/undefined/vazio/0/negativo) → cobertura de branch.
- Metas mínimas: services/regras Nest e utilitários **≥ 90%** · hooks e controllers **≥ 85%** · componentes apresentacionais **≥ 80%** · containers **≥ 70%** · global do que mudou **≥ 80%**.
- Use **pr-test-analyzer** para validar a **qualidade** (cobertura comportamental real, não só %). Repita até bater as metas.

**Nível 3 — Build:**
- Compile backend e frontend. Em falha, use **build-error-resolver** (Nest) ou **react-build-resolver** (front; inclui hidratação e fronteira server/client), 1 erro por vez, revalidando após cada correção.
- **Guardrail de dependência:** se o erro for por **dependência faltando**, NÃO instale às cegas — pare, mostre o pacote e o comando de install proposto, e confirme antes (decisão de escopo).

**Nível 4 — Integração (boot real):**
- Suba o servidor Nest e exercite o endpoint da feature (ex.: `curl` no `/health` e nas novas rotas), aguardando o boot com retry. Encerre o servidor ao final. Valide status e payload do envelope de resposta.

**Nível 5 — E2E + edge:**
- Use **e2e-runner** para cobrir o fluxo crítico da feature (Playwright) e rode os edge cases listados no plano.

## Fase 6 — Portão de revisão em LOOP (repita até zerar)
Dispare em PARALELO e consolide os achados:
- **typescript-reviewer** — TS do backend e do frontend.
- **react-reviewer** — componentes/hooks React (regras de hooks, RSC, a11y, render perf, segurança React).
- **database-reviewer** — schema/migration (se a Fase 2 ocorreu).
- **security-reviewer** — auth/z, validação de input, SQL injection, XSS/CSRF, segredos, rate limiting, vazamento em mensagens de erro.
- **silent-failure-hunter** — erros engolidos / fallbacks ruins.
- **type-design-analyzer** — modelagem de tipos e invariantes.
- **pr-test-analyzer** — qualidade/cobertura comportamental dos testes.
- **comment-analyzer** — comentários enganosos/desatualizados e risco de "comment rot".
- **Scanner determinístico:** rode `npx ecc-agentshield scan --path . --format text` para segredos/permissões/superfícies sensíveis e trate os achados HIGH/CRITICAL como fatos (não invente).

**Ciclo obrigatório (não pare no primeiro passe):**
1. Colete TODOS os achados dos revisores + lint + AgentShield.
2. Corrija (prioridade **CRITICAL → HIGH → MEDIUM → LOW**) e os warnings de lint.
3. Reexecute lint + type-check + testes afetados.
4. **Rode os revisores de novo** sobre o que mudou.
5. Repita 1–4 até: **zero CRITICAL/HIGH** (busque também zerar MEDIUM/LOW), **lint limpo** e **type-check/testes passando**.
- MEDIUM/LOW não corrigidos → liste como dívida técnica, com justificativa.
- Se algo não convergir após 3 ciclos, pare e reporte o impasse com as opções.

## Fase 7 — Limpeza & documentação
- **Limpeza de código morto** (via **refactor-cleaner**), com ferramentas reais quando disponíveis: `npx knip`, `npx depcheck`, `npx ts-prune`. Classifique por tier — **SAFE** (utilitários/helpers internos: remover), **CAUTION** (componentes/rotas/middleware: checar imports dinâmicos e consumidores externos), **DANGER** (config/entrypoints/tipos: investigar). Remova **um item por vez**, rodando os testes após cada remoção; se quebrar, **reverta** (`git checkout -- <arquivo>`) e pule. Não refatore enquanto limpa.
- **doc-updater** — atualize docs/README/codemaps a partir das fontes de verdade (scripts do `package.json`, `.env.example`, rotas/OpenAPI, `schema.prisma`), sem duplicar o que o código já documenta.

## Fase 8 — Entrega
1. Garanta: todos os testes passando, cobertura nas metas, build/type-check OK, **lint/format limpos**, integração e e2e verdes, sem achado CRITICAL/HIGH em aberto.
2. **Feche os artefatos**:
   - Marque **todos** os itens do checklist **Acceptance** em `.claude/plans/{nome}.plan.md` como `- [x]` (se algum não foi cumprido, não entregue — volte e resolva).
   - No `.claude/prds/{nome}.prd.md`, atualize o milestone correspondente de `in-progress` para `complete`.
   - Escreva um **relatório de implementação** em `.claude/reports/{nome}-report.md` com: Summary, Assessment vs Plano (complexidade prevista × real, nº de arquivos), Tasks concluídas (com desvios e o porquê), Resultados de validação (os 5 níveis), Files changed, Testes escritos (arquivo / nº / área) e Issues encontradas.
   - Arquive o plano: `mkdir -p .claude/plans/completed && mv .claude/plans/{nome}.plan.md .claude/plans/completed/`.
3. **NÃO faça commit automaticamente** — apresente:
   - Resumo do que foi feito por camada (backend / banco / frontend).
   - Confirmação de Acceptance 100%, milestone `complete` e caminho do relatório.
   - Mensagem de commit sugerida no formato `feat: <descrição>`.
   - Plano de teste (passos para validar manualmente).
4. Só faça o commit se eu pedir explicitamente (inclua os artefatos `.claude/prds/`, `.claude/plans/` e `.claude/reports/` no commit).
5. **Handoff de PR (opcional):** se eu pedir para abrir o PR, execute o fluxo do `/pr` — `git push -u origin HEAD`, criar o PR com o template do repo e **referenciar o PRD, o plano e o relatório** no corpo. Use `--force-with-lease` apenas se houve rebase; nunca `--force`.

> Regra geral: seja autônomo nas escolhas equivalentes (nomes, formatação, defaults) e só interrompa para decisões de escopo, ações destrutivas ou no portão de aprovação do plano.
