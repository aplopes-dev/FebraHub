# Quickstart: Validação — Loja como Unidade de Billing (platform-api + admin-web)

Guia para provar, de ponta a ponta, que a feature funciona conforme o [spec](./spec.md) e o
[data model](./data-model.md). Não é um guia de implementação — assume que as tasks de
`/speckit-tasks` já foram executadas (migrations aplicadas, use cases e telas implementados).

## Pré-requisitos

- Infra local no ar: `pnpm infra:up` (Postgres, Keycloak — Redis/RabbitMQ opcionais para esta
  validação; sem `RABBITMQ_URL` configurada, `StoreEventsPublisher` fica em no-op, o que é
  aceitável para validar o fluxo síncrono do admin)
- Migrations da `platform-api` aplicadas (as 3 etapas de `research.md` #1: expand, backfill,
  contract) em um banco de desenvolvimento — **nunca rodar a etapa de contract sem confirmação
  explícita**, conforme Constitution Check do plano
- `apps/platform/api` rodando: `pnpm --filter @citybox/platform-api dev` (`:3103`)
- `apps/platform/admin` rodando: `pnpm --filter @citybox/admin-web dev` (`:3108`)
- Usuário operador autenticado no admin-web (`platform.admin` ou equivalente — ver
  `platform-access.ts`)

## Cenário 1 — Loja como unidade única de cobrança (US1, FR-001/002/003/015/016)

1. Em `http://localhost:3108/lojas`, clicar em "Nova loja".
2. Confirmar que o formulário **não** pede nem referencia um "Cliente" em nenhum passo — só
   vertical, dados fiscais (documento, tipo de pessoa, responsável, endereço) e plano.
3. Tentar avançar sem selecionar um plano → esperado: bloqueado com mensagem de campo obrigatório
   (FR-015).
4. Preencher e submeter com um plano de vertical "Food".
5. **Verificar via API** (`GET /api/v1/stores/:id`): resposta contém os campos fiscais direto na
   loja, `subscriptions` referenciando `storeId` (não `clientId`), sem qualquer campo `clientId`.
6. Repetir os passos 1–5 usando o **mesmo documento fiscal** de uma loja já existente → esperado:
   criação bem-sucedida (FR-016 — documento não é único entre lojas).
7. Confirmar em `http://localhost:3108/clientes` → esperado: rota inexistente / redirecionada
   (menu não tem mais "Clientes" — SC-003).

## Cenário 2 — Tela única da loja (US2, FR-012)

1. Abrir `http://localhost:3108/lojas/:id` de uma loja criada no Cenário 1.
2. Confirmar, na mesma tela: dados fiscais/responsável, plano vigente (vertical + tier visíveis),
   assinatura atual e histórico de faturas — sem navegar para outra rota.
3. Marcar manualmente uma fatura como vencida (via `POST /api/v1/invoices/:id/mark-paid` **não**
   chamado — deixar `dueDate` no passado num seed) e recarregar a tela → status de inadimplência
   visível sem consulta adicional.

## Cenário 3 — Catálogo de planos por vertical/tier (US3, FR-004/005)

1. Em `http://localhost:3108/planos`, criar dois planos: `Clínica Prata` (vertical `Clínica`, tier
   `prata`, `maxNegocios=1`) e `Clínica Ouro` (vertical `Clínica`, tier `ouro`, `maxNegocios=3`),
   cada um com preço mensal e anual.
2. Filtrar o catálogo por vertical `Clínica` → esperado: os dois tiers aparecem, com limites e
   preços distintos (SC-005).
3. Iniciar a criação de uma loja de vertical `Food` → esperado: os planos de `Clínica` **não**
   aparecem no seletor.

## Cenário 4 — Troca de plano e ciclo suspensão/reativação (US4, FR-006/008/010/011)

1. Na loja do Cenário 1 (vertical `Food`), trocar o plano vigente por outro plano de tier
   diferente, mesma vertical `Food` → esperado: assinatura atualizada, histórico do plano anterior
   ainda visível.
2. Tentar trocar o plano para um plano de vertical `Clínica` → esperado: rejeitado (edge case do
   spec — vertical imutável).
3. Rodar o job de faturamento (`POST /api/v1/invoices/generate-job` ou equivalente) sobre uma
   assinatura com fatura vencida sem pagamento → esperado: `Store.status` muda para `BLOCKED`,
   evento de audit log registrado com motivo de inadimplência (research.md #3).
4. Registrar o pagamento da fatura em atraso → esperado: `Store.status` volta para `PRODUCTION`.

## Verificação de regressão de dados (migration)

1. Antes da migration de contract, exportar contagem de `Subscription`/`Invoice` por `clientId`.
2. Depois do backfill (ainda com `Client` presente — passo intermediário), comparar: toda
   `Subscription`/`Invoice` tem `storeId` preenchido e a contagem por `storeId` bate com a
   contagem original por `clientId` (SC-002).
3. Só then autorizar a migration de contract.

**Resultado real (T056/T057, banco de dev local, 2026-07-18)** —
`pnpm exec tsx apps/platform/api/scripts/backfill-store-billing.ts`:

| Entidade | Total (pré e pós) | Atualizados neste backfill | Observação |
|----------|--------------------|------------------------------|------------|
| `Store` (fiscal via `Client`) | 2 | 2 | as 2 stores client-backed do banco de dev ganharam `personType`/`responsibleName`/`billingEmail`/`document`/`legalName`/endereço copiados do `Client` |
| `Subscription` (`storeId`) | 1 | 1 | regra "primeira loja criada" (research.md #2) foi de fato exercida — o único Client com 2 Stores tem sua Subscription apontada para a Store mais antiga |
| `Invoice` (`storeId`) | 0 | 0 | nenhuma Invoice existia no banco de dev nesse momento |
| `Member` (`storeId`) | 1 | 0 (1 pendente) | `bruno.arouca` tem 2 `StoreMember` distintas — caso ambíguo, **não** backfilled automaticamente; listado para revisão manual (research.md #6, fora do escopo de regra automática) |
| `Plan` (`vertical`/`tier`/`maxNegocios`) | 4 | 4 | achado do gate `database-reviewer` (T064): os 4 planos pré-existentes (`starter`/`professional`/`enterprise`/`enterprise-plus`) tinham `vertical IS NULL`, o que os tornava invisíveis no seletor de plano filtrado por vertical (T020/T042) — bug real, corrigido no script (ver nota abaixo) |

Zero perda de dados: totais idênticos antes/depois em todas as entidades (só `UPDATE` de campos
nulos, nunca `DELETE`/`INSERT`). Rodado uma segunda vez para confirmar idempotência — 0
atualizações na segunda execução, o member ambíguo continua corretamente sinalizado. **O caso do
member ambíguo precisa de decisão manual antes de T058** (qual das 2 Stores deve virar a
`storeId` primária de `bruno.arouca` — ou se `Member.storeId` deve simplesmente continuar nulo
para casos multi-loja, já que a associação real vive em `StoreMember`).

**Nota sobre o backfill de `Plan`**: `maxNegocios` tem fonte de dado clara (`= maxStores`, mesma
decisão do research.md #5). `vertical`/`tier` **não têm** — não existe coluna equivalente nos
planos legados. O script aplica um *default heurístico documentado* (`vertical = 'Food'`, único
vertical com uso histórico real antes do PLAT-001; `tier = code` do próprio plano) só para
destravar o seletor de plano; os valores atribuídos aparecem no log de saída do script
(`Plans legados com vertical/tier/maxNegocios preenchidos por DEFAULT HEURÍSTICO`) e **precisam de
confirmação manual do time de produto antes de T058** — não é uma verdade de negócio.

## Comandos de apoio

```bash
# Migrations (sempre assim — nunca SQL manual)
pnpm --filter @citybox/platform-api db:migrate:dev
pnpm --filter @citybox/platform-api db:generate

# Qualidade (rodar antes de considerar qualquer cenário acima "pronto")
pnpm --filter @citybox/platform-api lint && pnpm --filter @citybox/platform-api test
pnpm --filter @citybox/admin-web lint && pnpm --filter @citybox/admin-web typecheck && pnpm --filter @citybox/admin-web test
```

## Critério de saída deste quickstart

Todos os 4 cenários passam manualmente (ou via `test:e2e`/Playwright equivalente), a verificação
de regressão de dados confirma zero perda, e `lint`/`typecheck`/`test` estão limpos nos dois
pacotes — nesse ponto o spec está implementado e pronto para `/code-review`.
