---
description: Corrige um bug ponta a ponta (Nest.js + React + Prisma/Postgres) com TDD e revisão, orquestrando os subagentes automaticamente
argument-hint: <descrição do bug> (ex.: "erro 500 ao salvar pedido sem itens" ou link/stack trace)
---

# /bugfix — Fluxo completo de correção de bug

Você vai diagnosticar e corrigir o bug abaixo **de ponta a ponta**, executando TODO o fluxo sozinho e **delegando aos subagentes especializados sem perguntar qual usar**. Só pare se faltar algo bloqueante (não conseguir reproduzir por falta de dado/credencial, decisão destrutiva) — ou no portão de aprovação da causa-raiz.

**Bug relatado:** $ARGUMENTS

## Stack do projeto (assuma estes padrões)
- **Backend:** Nest.js (TypeScript). **ORM/DB:** Prisma + PostgreSQL (migrations versionadas). **Frontend:** React (TypeScript).
- **Testes:** TDD — toda correção começa por um teste de regressão que FALHA reproduzindo o bug.
- **Princípio:** correção mínima e cirúrgica na causa-raiz, sem refatorações amplas não solicitadas.
- **Commits:** Conventional Commits (`fix:`).

Rode em paralelo o que for independente.

**Golden rule (validação contínua):** valide após cada mudança; nunca acumule estado quebrado.

---

## Fase 0 — Reproduzir & localizar
1. Reescreva o bug em uma frase: comportamento esperado × observado.
2. Localize a origem com busca no código (grep/glob) e, se precisar mapear o caminho de execução, use o subagente **code-explorer**.
3. Forme uma hipótese de causa **com evidência** (arquivo/linha/log) — não chute.

## Fase 1 — Causa-raiz
- Se for erro de build/type: use **build-error-resolver** (backend) ou **react-build-resolver** (frontend).
- Se houver suspeita de erro engolido / fallback silencioso: use **silent-failure-hunter**.
- Se envolver dados/consulta/migration: investigue com **database-reviewer** (schema, índice, constraint, tipo, N+1).
- Confirme a causa-raiz real antes de corrigir (distinga sintoma de causa).

## 🛑 Fase 1.5 — Aprovação da causa-raiz (OBRIGATÓRIA — PARE AQUI)
**NÃO comece a corrigir até o usuário aprovar a causa-raiz.** Apresente de forma clara:
- **Causa-raiz** identificada em 1–2 frases, distinguindo sintoma × causa.
- **Evidência** que a sustenta (arquivo/linha/log/stack trace).
- **Correção proposta** em alto nível (camada e abordagem) e arquivos que serão tocados.
- Se houver mais de uma hipótese plausível, liste-as e indique a mais provável.

Depois pergunte explicitamente: **"Confirma esta causa-raiz e a abordagem de correção? (aprovar / ajustar)"** e **aguarde a resposta do usuário**.
- Se pedir ajustes ou apontar outra hipótese → reinvestigue e peça aprovação de novo.
- Só avance para a Fase 1.6 após aprovação explícita.

## Fase 1.6 — Preparação de branch/git
1. Verifique o estado: `git branch --show-current` e `git status --porcelain`.
2. Defina um nome curto em kebab-case (`{nome}`, ex.: `pedido-sem-itens-500`) e decida a branch:
   - Já em branch de trabalho → use a atual.
   - Em `main`/`master` **limpa** → crie `git checkout -b fix/{nome}`.
   - Em `main`/`master` **suja** → **PARE** e peça para commitar/stashar antes.
3. Sincronize o remoto: `git pull --rebase origin $(git branch --show-current) 2>/dev/null || true`.

## Fase 2 — Teste de regressão primeiro (RED)
- Use **tdd-guide** para escrever um teste que **falha** reproduzindo exatamente o bug, na camada certa (unit/integração no Nest, e2e se for fluxo de usuário, teste de componente/hook no React).
- Teste **comportamento**: no React use queries por role/label + `userEvent` + MSW (sem `querySelector`/snapshot); no Nest, teste a borda real (controller/service) com entrada que dispara o bug.
- O teste deve falhar **pela razão certa** (reproduz a causa, não um erro de setup).

## Fase 3 — Correção mínima (GREEN)
- Implemente o menor ajuste que resolve a causa-raiz, na camada correta:
  - Backend Nest → seguindo **nestjs-patterns**, **backend-patterns**, **error-handling**.
  - Banco/Prisma → seguindo **prisma-patterns** / **database-migrations** (se precisar de migration, gere versionada).
  - Frontend React → seguindo **react-patterns** / **react-performance**.
- Faça o teste de regressão passar. Após cada arquivo alterado, rode o type-check + o teste de regressão antes de seguir.

## Fase 4 — Verificação em níveis (corrija em cada um antes de avançar)

**Nível 1 — Estática:**
- Type-check de backend e frontend (`tsc --noEmit`).
- Lint (ESLint nos arquivos alterados; no front, com `eslint-plugin-react-hooks` e `eslint-plugin-jsx-a11y`); no Cursor use também o checador da IDE.
- Formatação (Biome `check` / Prettier `--check`).
- Supply-chain: se a correção mexeu em dependências, rode `npm audit`.

**Nível 2 — Testes + cobertura local:**
- Rode a suíte completa (garanta que nada quebrou) e confirme que o teste de regressão agora passa (GREEN).
- Confirme que a **linha/branch da correção ficou coberta** pelos testes (use **pr-test-analyzer** para garantir que o teste cobre a causa, não é "carimbo").

**Nível 3 — Build:**
- Compile backend e frontend. Em falha, use **build-error-resolver** (Nest) ou **react-build-resolver** (front), 1 erro por vez.
- **Guardrail de dependência:** se o erro for por dependência faltando, NÃO instale às cegas — pare, mostre o pacote e o comando proposto, e confirme antes.

**Nível 4 — Integração / E2E (se aplicável):**
- Se o bug envolve endpoint, suba o servidor Nest e exercite a rota afetada (curl, com retry de boot) validando o comportamento corrigido.
- Se o bug é visível ao usuário, valide o fluxo com **e2e-runner** (Playwright).

## Fase 5 — Revisão em LOOP (repita até zerar)
Rode os revisores em PARALELO:
- **code-reviewer** — qualidade/manutenibilidade da correção.
- **security-reviewer** — se o bug tocar auth, input, dados sensíveis ou query.
- **database-reviewer** — se houve mudança em schema/migration/consulta.
- **react-reviewer** — se a correção foi em componente/hook React.
- **pr-test-analyzer** — confirma que o teste de regressão cobre de fato a causa (não é teste "carimbo").
- **Scanner determinístico (se for bug de segurança):** rode `npx ecc-agentshield scan --path . --format text` e trate HIGH/CRITICAL como fatos.

**Ciclo obrigatório (não pare no primeiro passe):**
1. Colete TODOS os achados dos revisores + lint (+ AgentShield se rodou).
2. Corrija os **CRITICAL → HIGH → MEDIUM → LOW** (e os warnings de lint).
3. Reexecute lint + type-check + testes afetados.
4. **Rode os revisores de novo** sobre o que mudou.
5. Repita 1–4 até: **zero CRITICAL/HIGH** (busque também zerar MEDIUM/LOW), **lint limpo** e **type-check/testes passando**.
- Se um mesmo achado reaparecer após 3 ciclos sem convergir, pare e reporte o impasse ao usuário com as opções.

## Fase 6 — Limpeza (apenas se a correção deixou resíduo)
- Se a correção deixou código órfão/morto, remova-o com **refactor-cleaner** (use `npx ts-prune`/`npx knip` para confirmar), **um item por vez**, rodando os testes após cada remoção; se quebrar, **reverta** (`git checkout -- <arquivo>`). Não faça refatoração ampla — mantenha o fix mínimo.

## Fase 7 — Entrega
1. Garanta: teste de regressão passando, suíte verde, build/type-check OK, **lint/format limpos**, integração/e2e (se aplicável) verdes, sem CRITICAL/HIGH em aberto.
2. **Relatório de correção** em `.claude/reports/{nome}-fix-report.md` com: Causa-raiz, Evidência, O que foi alterado (arquivos/camadas), Teste de regressão adicionado, Resultados de validação (níveis) e Riscos residuais.
3. **NÃO faça commit automaticamente** — apresente:
   - **Causa-raiz** em 1–2 frases.
   - O que foi alterado e por quê (arquivos/camadas) e o teste de regressão adicionado.
   - Caminho do relatório e mensagem de commit sugerida `fix: <descrição>`.
4. Só faça o commit se eu pedir explicitamente (inclua o `.claude/reports/`).
5. **Handoff de PR (opcional):** se eu pedir, execute o `/pr` — push + criar PR com o template do repo, referenciando o relatório. Use `--force-with-lease` apenas se houve rebase; nunca `--force`.

> Regra geral: seja autônomo nas escolhas equivalentes e só interrompa para decisões de escopo, ações destrutivas ou no portão de aprovação da causa-raiz.
