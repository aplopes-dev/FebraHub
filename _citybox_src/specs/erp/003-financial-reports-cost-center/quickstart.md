# Quickstart: validar DRE real e análise por centro de custo ponta a ponta

Roteiro manual mapeado 1:1 nos cenários de aceite do [`spec.md`](./spec.md). Sem suíte E2E
automatizada em `erp-web` nesta feature (mesma decisão de `001-financial-entries/research.md`
D15/`research.md` D11 desta feature) — este roteiro é a validação de fato, junto dos gates de
tipo/lint/teste de unidade do backend.

## Pré-requisitos

```bash
pnpm infra:up:postgres        # na raiz — Postgres local
```

Este roteiro assume `001-financial-entries` já implementada (o rateio `FinancialEntryAllocation`
real é o que os dois relatórios consomem — confirmado já em produção, ver `research.md`
"Contexto herdado").

## Setup

```bash
pnpm --filter @citybox/erp-api db:migrate:dev
pnpm --filter @citybox/erp-api db:backfill:financial-group-classification   # organizações existentes: corrige Caixa e bancos/Ativo → patrimonial
pnpm --filter @citybox/erp-api db:seed                                       # só necessário em banco novo

pnpm dev:comercio    # erp-api :3114 + erp-web :3107
```

Login: `http://localhost:3107` via Keycloak, usuário OWNER/ADMIN de uma organização de teste.

## Roteiro por User Story

### US1 — Visualizar a DRE com dados reais (P1)

1. `/financas/plano-de-contas` → criar a conta **"Internet"** no grupo **"Despesas fixas"**
   (criar o grupo antes em `/financas/grupo-financeiro` se ainda não existir, tipo Despesa).
2. `/financas/lancamentos` → **Novo lançamento**: Contas a pagar, R$ 100,00, competência hoje,
   categoria = "Internet" (100% do rateio), centro de custo qualquer. Salvar.
3. `/financas/relatorios-de-resultados` → selecionar o período **Mês atual**.
4. **Esperado**: bloco Despesas mostra o grupo **"Despesas fixas" com −R$ 100,00**; expandir o
   grupo mostra a conta **"Internet" com −R$ 100,00** (cenário de validação da transcrição,
   Acceptance Scenario 1).
5. Criar um segundo lançamento de R$ 200,00 rateado **80%/20%** entre duas contas do plano
   (ex.: "Internet" 80% + "Telefone" 20%). Reabrir a DRE. **Esperado**: "Internet" ganha
   +R$ 160,00 no total, "Telefone" ganha +R$ 40,00 (Acceptance Scenario 2).
6. Trocar o período para um mês sem nenhum lançamento (ex.: um mês futuro). **Esperado**: estado
   vazio claro, sem erro (Acceptance Scenario 3).
7. Excluir (soft-delete) o lançamento de R$ 100,00 criado no passo 2. Reabrir a DRE do mês atual.
   **Esperado**: o valor de "Internet"/"Despesas fixas" cai de volta (Acceptance Scenario 4).
8. Criar um lançamento (transferência ou entrada manual) alocado à conta de sistema
   **"Recebimento de clientes"** (grupo "Ativo", `patrimonial` após esta fatia) ou **"Sangria de
   caixa"**/**"Suprimento de caixa"** (grupo "Caixa e bancos", `patrimonial`). Reabrir a DRE.
   **Esperado**: esse valor **não** aparece no total de receita nem altera o resultado líquido
   (Acceptance Scenario 5 — prova a correção do bug de classificação, `data-model.md`).
9. Trocar a organização ativa (seletor no header). **Esperado**: a DRE muda para refletir a nova
   organização, sem misturar dados (Acceptance Scenario 6).
10. Conferir visualmente que a soma dos percentuais de conta dentro do grupo, e de grupo dentro
    da seção, fecha em 100% (Acceptance Scenario 7) — validação exata fica no `.spec.ts` do use
    case (`research.md` D7).

### US2 — Analisar receita e despesa por centro de custo (P2)

1. Com os lançamentos rateados criados acima (ou novos, garantindo pelo menos 2 centros de custo
   diferentes em despesas), abrir **Finanças → Análise por centro de custo**
   (`/financas/analise-centro-de-custo`, novo item de navegação).
2. Selecionar o mesmo período usado na DRE e o tipo **Despesa**.
3. **Esperado**: cada centro de custo aparece com valor e percentual, ordenado do maior para o
   menor (Acceptance Scenario 1).
4. Alternar para **Receita**. **Esperado**: valores e percentuais recalculados para o tipo
   selecionado (Acceptance Scenario 5).
5. Trocar para um período sem lançamentos do tipo selecionado. **Esperado**: estado vazio
   (Acceptance Scenario 3).
6. Conferir que os percentuais de todos os centros de custo (incluindo "Outros", se aparecer)
   somam 100% (Acceptance Scenario 4).

### Regressão — Cadastros (grupo, plano, centro de custo)

1. `/financas/grupo-financeiro`, `/financas/plano-de-contas`, `/financas/centro-de-custo`:
   confirmar que CRUD, abas Ativos/Excluídos e restore continuam funcionando exatamente como
   antes (FR-018).
2. Tentar excluir um grupo financeiro com contas do plano ativas → continua retornando 409
   (mensagem no toast).
3. Confirmar que nenhum registro `isSystem` (incluindo os 2 grupos recém-classificados como
   `patrimonial`) ganhou opção de exclusão.
4. Criar uma organização nova → confirmar que ela nasce com os 6 grupos (2 já `patrimonial`), 9
   contas e 5 centros de custo do seed, sem precisar rodar o script de backfill.

## Verificação técnica (grep de confirmação antes de remover mocks)

```bash
grep -rn "MOCK_RESULT_ENTRIES\|MOCK_CHART_OF_ACCOUNTS\|MOCK_FINANCIAL_GROUPS" apps/erp/web/src
# esperado: nenhum resultado, só depois de remover:
#   features/financial-results/services/financial-result.service.ts
#   features/financial-results/data/mock-result-entries.ts
#   features/financial-groups/data/mock-financial-groups.ts
#   features/chart-of-accounts/data/mock-chart-of-accounts.ts
```

## Gate

```bash
pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test
pnpm --filter @citybox/erp-web typecheck && pnpm --filter @citybox/erp-web lint
```
