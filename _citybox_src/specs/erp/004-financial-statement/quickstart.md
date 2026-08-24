# Quickstart: validar o Extrato financeiro consolidado ponta a ponta

Roteiro manual mapeado 1:1 nos Acceptance Scenarios do [`spec.md`](./spec.md). Sem suíte E2E
automatizada em `erp-web` nesta feature (mesma decisão de `001`/`002`/`003`, `research.md` D9) —
este roteiro é a validação de fato, junto dos gates de tipo/lint/teste de unidade do backend.

## Pré-requisitos

```bash
pnpm infra:up:postgres        # na raiz — Postgres local
```

Este roteiro assume `001-financial-entries` e `002-bank-account-ledger` já implementadas em
produção (lançamentos com rateio real + contas bancárias com saldo real — dependências
confirmadas em `spec.md` § Assumptions, sem pendência bloqueante).

## Setup

```bash
pnpm --filter @citybox/erp-api db:seed    # só necessário em banco novo — nenhuma migration nova nesta fatia
pnpm dev:comercio                          # erp-api :3114 + erp-web :3107
```

Login: `http://localhost:3107` via Keycloak, usuário OWNER/ADMIN de uma organização de teste.

## Roteiro por User Story

### US1 — Consultar e filtrar o extrato (P1)

1. `/financas/lancamentos` → **Novo lançamento**: Recebimento, R$ 10.000,00, competência e
   vencimento de hoje, conta bancária X, categoria/centro de custo quaisquer. Salvar.
2. `/financas` → confirma que redireciona para `/financas/extratos` (nunca mais "Em construção").
3. Sem nenhum filtro aplicado: **Esperado** — lista completa de movimentações da organização,
   paginada (Acceptance Scenario 1, SC-001).
4. Aplicar filtro **Competência = hoje** + **Tipo = Recebimento**. **Esperado** — o lançamento do
   passo 1 aparece na lista, cards de resumo refletem o total (Acceptance Scenario 2, SC-002).
5. Criar um segundo lançamento com competência e vencimento **diferentes** (ex.: competência mês
   passado, vencimento hoje). Trocar o eixo de data do filtro de **Competência** para
   **Vencimento** (mesmo intervalo de datas). **Esperado** — o conjunto de resultados muda:
   esse lançamento só aparece quando o eixo é Vencimento (Acceptance Scenario 3, SC-003).
6. Com um conjunto filtrado que ultrapasse uma página (criar lançamentos suficientes ou reduzir
   o `perPage` via query string em teste manual): conferir que os cards de
   Entradas/Saídas/Saldo somam o conjunto **filtrado inteiro**, não só a página exibida
   (Acceptance Scenario 4, SC-004) — abrir a network tab e confirmar que
   `GET /v1/financial-entries/summary` é chamado com os mesmos filtros da lista.
7. Digitar uma palavra específica da descrição de um lançamento na busca livre. **Esperado** —
   aparece nos resultados (Acceptance Scenario 5).
8. Aplicar filtro de conta bancária, categoria financeira e centro de custo simultaneamente.
   **Esperado** — só lançamentos que atendem a todos os filtros aparecem (Acceptance Scenario 6).
9. Excluir (soft-delete) o lançamento do passo 1 na tela de Lançamentos. Reabrir o Extrato com
   os mesmos filtros. **Esperado** — não aparece mais em nenhum resultado, nem na lista nem nos
   cards (Acceptance Scenario 7, FR-012).
10. Trocar a organização ativa (seletor no header). Reabrir o Extrato. **Esperado** — dados
    exibidos passam a refletir exclusivamente a nova organização (Acceptance Scenario 8, SC-007).
11. Informar um período com data final anterior à inicial (via query string manual, já que o
    `DateRangePicker` da UI deve impedir isso). **Esperado** — erro 422 com mensagem clara, não
    um resultado sem sentido (Edge Case do spec).
12. Trocar a organização para uma sem nenhuma movimentação. **Esperado** — estado vazio
    "Nenhuma movimentação registrada", sem erro (Edge Case do spec).
13. Com filtros aplicados que não batem com nenhum lançamento: **Esperado** — estado vazio
    "Nenhuma movimentação encontrada com esses filtros" + botão para limpar os filtros
    (Edge Case do spec).
14. Criar um lançamento rateado entre duas categorias/centros de custo. Filtrar por uma delas.
    **Esperado** — o lançamento aparece **uma vez** na lista (não duplicado por linha de
    rateio) (Edge Case do spec).

### US2 — Ver o saldo de cada conta bancária (P2)

1. Com pelo menos 2 contas bancárias cadastradas (`/financas/contas-bancarias`), abrir o
   Extrato. **Esperado** — o saldo de cada uma das N contas aparece na tela, batendo com o
   saldo mostrado em `/financas/contas-bancarias` (Acceptance Scenario 1, SC-006).
2. Registrar um novo lançamento pago vinculado a uma dessas contas. Reabrir o Extrato.
   **Esperado** — o saldo exibido reflete o valor atualizado (Acceptance Scenario 2).

### US3 — Agrupar lançamentos selecionados (P3)

1. Com ao menos 3 lançamentos visíveis na lista, marcar 2 deles via checkbox de linha.
   **Esperado** — uma barra/rodapé mostra "2 lançamentos selecionados" e o valor total somado
   correto, respeitando o sinal de entrada/saída (Acceptance Scenario 1, SC-005).
2. Com a seleção ativa, mudar um filtro (ex.: trocar o eixo de data) ou trocar de página.
   **Esperado** — a seleção é limpa, a barra desaparece (Acceptance Scenario 2, edge case).

## Verificação técnica

```bash
# confirma que o placeholder saiu de vez
grep -rn "PlaceholderPage" apps/erp/web/src/app/\(app\)/financas/extratos/page.tsx
# esperado: nenhum resultado

# confirma que a validação de período cobre os 2 eixos
grep -rn "InvalidStatementPeriodError" apps/erp/api/src/modules/finance/financial-entries
```

## Gate

```bash
pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test
pnpm --filter @citybox/erp-web typecheck && pnpm --filter @citybox/erp-web lint
```
