# Quickstart: validar Lançamentos financeiros ponta a ponta

Roteiro manual para provar que a feature funciona de ponta a ponta, mapeado 1:1 nos cenários de
aceite do [`spec.md`](./spec.md). Não há suíte E2E automatizada para `erp-web` nesta feature
(ver `research.md` D15) — este roteiro é a validação de fato.

## Pré-requisitos

```bash
pnpm infra:up:postgres        # na raiz — Postgres local
pnpm infra:up                 # se precisar de MinIO também (ver infra/AGENTS.md)
```

Variáveis obrigatórias em `apps/erp/api/.env` (ver `apps/erp/api/AGENTS.md` §7 para a lista
completa): `DATABASE_URL`, `MINIO_ENDPOINT`/`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY`/`MINIO_BUCKET`
(default `erp`) — sem MinIO configurado, os cenários de anexo (User Story 4) falham
graciosamente conforme FR-014, mas todo o resto da feature funciona normalmente.

## Setup

```bash
# Schema + seed (organização de teste com plano de contas/centros de custo já provisionados)
pnpm --filter @citybox/erp-api db:migrate:dev
pnpm --filter @citybox/erp-api db:seed

# Backfill de lançamentos legados (D10 — só necessário se já existirem FinancialEntry sem allocations)
pnpm --filter @citybox/erp-api exec tsx scripts/backfill-financial-entry-allocations.ts

# Sobe os dois apps
pnpm dev:comercio    # erp-api :3114 + erp-web :3107
```

Login: `http://localhost:3107` via Keycloak (realm `citybox-dev`), usuário OWNER/ADMIN de uma
organização de teste (MEMBER é usado só no cenário de permissão, US1 cenário 5).

## Roteiro por User Story

### US1 — Criar e editar um lançamento que realmente persiste (P1)

1. `/financas/lancamentos` → **Novo**. Preencher: operação = Contas a receber, valor
   R$ 1.000,00, conta bancária, competência e vencimento, descrição. Salvar.
2. **Esperado**: toast de sucesso, redirect para a lista, lançamento visível.
3. **Atualizar a página (F5)** na lista. **Esperado**: o lançamento continua lá (prova que não é
   mais o mock em memória — SC-001).
4. Abrir o lançamento criado para edição. **Esperado**: os dados reais carregam no formulário
   (não cai em "não encontrado").
5. Alterar a descrição, salvar, reabrir. **Esperado**: a alteração persistiu.
6. Excluir o lançamento → aparece na aba "Excluídos" → Restaurar → volta para "Ativos".
7. Logar com um usuário papel `MEMBER` → tentar criar/editar → **Esperado**: ação bloqueada
   (403 refletido na UI).
8. Fechar um pedido de venda com pagamento (fora desta feature, via módulo `sales`) → abrir o
   recebível gerado automaticamente em Lançamentos → **Esperado**: todos os campos aparecem
   desabilitados/somente-leitura (FR-016); só "Excluir"/"Restaurar" continuam ativos.

### US2 — Ratear entre formas de pagamento (P2)

1. Criar um lançamento de R$ 10.000,00. Na seção Pagamentos, adicionar 2 linhas: R$ 5.000 em
   dinheiro (hoje) + R$ 5.000 em depósito (hoje). **Esperado**: indicador mostra "cobre o total".
2. Salvar, reabrir. **Esperado**: as 2 linhas persistem com formas distintas.
3. Editar para deixar só 1 pagamento de R$ 6.000. **Esperado**: salva mesmo assim (advisory),
   indicador mostra "recebido a mais R$ 1.000" (RN-18/FR-007), status = pago/recebido na listagem.
4. Reduzir para R$ 4.000 total pago. **Esperado**: status volta para pendente na listagem
   (SC-002 verificado pela recomputação em `save()`, D5).

### US3 — Ratear entre categorias e centros de custo (P2)

1. No mesmo lançamento de R$ 10.000, seção Categoria: adicionar 2 linhas — 80% "Faturamento com
   serviços" / centro de custo X, 20% "Faturamento com venda de produtos" / centro de custo Y.
2. Editar o valor de uma linha (ex.: mudar de 80% para R$ 7.500) → **Esperado**: o percentual
   recalcula sozinho (75%).
3. Tentar salvar com soma divergente do total (ex.: deixar 90% no total das 2 linhas). **Esperado**:
   bloqueado na tela **e** — para provar que o backend também valida — reproduzir via `curl`:
   ```bash
   curl -X PUT http://localhost:3114/api/v1/financial-entries/<id> \
     -H "X-Organization-Id: <org>" -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
     -d '{"...", "allocations":[{"chartOfAccountId":"...","costCenterId":"...","amountCents":900000,"percentage":90}]}'
   ```
   **Esperado**: `422` com `AllocationMismatchError`.
4. Tentar salvar uma linha sem centro de custo. **Esperado**: bloqueado (FR-010).
5. Usar um `chartOfAccountId` de outra organização (via `curl` direto, forçando o cenário que a
   UI não permite). **Esperado**: `404` `ChartOfAccountNotFoundError`.

### US4 — Anexar comprovantes (P3)

1. Com MinIO no ar, anexar um PDF de 1MB a um lançamento salvo. **Esperado**: aparece na lista de
   anexos ao reabrir o lançamento.
2. Tentar anexar um arquivo de 8MB. **Esperado**: rejeitado com mensagem clara, resto do
   lançamento intacto.
3. Tentar anexar um `.exe`. **Esperado**: rejeitado (tipo não aceito).
4. Derrubar o MinIO (`docker stop` do container) e tentar anexar. **Esperado**: lançamento
   principal já salvo continua salvo; toast de erro só do anexo (FR-014/SC-007).

### US5 — Filtros ricos (P2)

1. Na listagem, abrir o filtro de categoria financeira → escolher uma categoria específica.
   **Esperado**: só lançamentos com ao menos uma `allocation` dessa categoria aparecem; a URL/
   Network mostra `chartOfAccountId=` na query string (server-side, não `.filter()` no browser —
   verificar na aba Network do DevTools).
2. Combinar com filtro de status "pago/recebido". **Esperado**: interseção correta.
3. Abrir todos os `Select`/`Autocomplete` do formulário e dos filtros (conta bancária, categoria,
   centro de custo, cliente, fornecedor). **Esperado**: nenhuma opção de exemplo — só dados reais
   da organização ativa (`grep -r "MOCK_" apps/erp/web/src/features/financial-entries` deve
   retornar vazio ao final da implementação).

### Regressão — fechamento de pedido de venda (RN-19/SC-003)

1. Fechar o mesmo pedido de venda duas vezes seguidas (reprocessamento). **Esperado**: continua
   existindo **exatamente 1** `FinancialEntry` `receivable` para aquele `saleOrderId` — checar
   via `SELECT count(*) FROM erp.financial_entries WHERE sale_order_id = '<id>'` (deve ser 1) e
   via `SELECT * FROM erp.financial_entry_allocations WHERE financial_entry_id = '<id>'` (deve
   ter 1 linha, 100%, categoria `vendas-mercadorias`, centro de custo `comercial` — D8).

### Migração de dados legados (FR-024)

Antes de rodar o backfill, checar um lançamento antigo sem `allocations`:
```sql
SELECT id, category_name FROM erp.financial_entries WHERE id NOT IN (SELECT financial_entry_id FROM erp.financial_entry_allocations);
```
Depois de `pnpm --filter @citybox/erp-api exec tsx scripts/backfill-financial-entry-allocations.ts`,
repetir a query — **esperado: 0 linhas**. Conferir quantos caíram no fallback
`outras-receitas`/`outras-despesas` (o script loga esse número por organização ao final — ver
D7/D9 em `research.md`).

## Gate antes de considerar a feature pronta

```bash
pnpm --filter @citybox/erp-api build && pnpm --filter @citybox/erp-api lint && pnpm --filter @citybox/erp-api typecheck && pnpm --filter @citybox/erp-api test
pnpm --filter @citybox/erp-web typecheck && pnpm --filter @citybox/erp-web lint
grep -r "MOCK_" apps/erp/web/src/features/financial-entries   # deve retornar vazio
```

## Débitos técnicos assumidos por este plano (registrar em `tasks.md`/AGENTS.md ao final)

- Vitest não foi introduzido em `erp-web` (D15) — `card-contracts`/`financial-entries` seguem
  sem teste de componente automatizado.
- `saleOrderId` continua sem `@relation` formal no schema (D4) — dívida pré-existente, não
  fechada por esta feature (fora do escopo autorizado no módulo `sales`).
- Transferência entre contas bancárias segue fora de escopo (dialog existe na tela, mas sem
  endpoint real — ver spec `## Fora de Escopo desta Fase`).
