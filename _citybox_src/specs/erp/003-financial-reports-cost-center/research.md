# Research: DRE real e análise por centro de custo

## Contexto herdado (não decidido aqui, só registrado)

A pesquisa de código (feita durante `/speckit-specify`) confirmou que o pré-requisito que o
prompt original tratava como bloqueante — o vínculo real lançamento ↔ conta do plano ↔ centro de
custo — **já está em produção**, entregue por `specs/erp/001-financial-entries/`:

- `FinancialEntryAllocation` existe (`chartOfAccountId` + `costCenterId`, ambos obrigatórios,
  `onDelete: Restrict`), com a soma validada em 100% do total do lançamento
  (`AllocationMismatchError` → 422).
- O backfill de lançamentos legados já rodou (`scripts/backfill-financial-entry-allocations.ts`,
  `pnpm db:backfill:financial-entries`) — todo `FinancialEntry` tem pelo menos uma
  `FinancialEntryAllocation`.
- `PrismaSaleOrderRepository.maybeCreateReceivable` já grava o rateio de 100% na conta de sistema
  `vendas-mercadorias` + centro `comercial` ao fechar uma venda — o risco do prompt original
  ("`categoryName: 'Venda'` solta não bate com nenhuma conta do seed") **não existe mais**.

Esta fatia é, portanto, **só consumidora** desse dado: dois relatórios de leitura + uma correção
pontual de classificação de grupo financeiro. Nenhuma mudança nos três submódulos de cadastro
(`financial-groups`, `chart-of-accounts`, `cost-centers`) além do campo `classification` (D2).

---

## D1 — Onde vive o novo submódulo de relatórios

**Decision**: Novo submódulo Clean `apps/erp/api/src/modules/finance/reports/`, importando
`FinancialGroupsModule`/`ChartOfAccountsModule`/`CostCentersModule`/`FinancialEntriesModule`
(read-only). Segue a mesma anatomia dos demais submódulos de `finance/`
(`domain → application → infrastructure`), mas **sem entidade de domínio própria** — é um módulo
de leitura pura sobre dados que outros submódulos já são donos.

**Rationale**: O padrão "submódulo fino sem camada de domínio" já existe (`sales/service-orders`
etc.), mas essa família acessa Prisma direto e não tem `.spec.ts` — incompatível com a exigência
do projeto de TDD com repositório in-memory. O padrão Clean completo (`financial-entries`,
`bank-accounts`) tem entidades de domínio que não fazem sentido aqui (não existe um "Relatório"
persistido para criar/atualizar). A solução adotada fica no meio: Clean Architecture (interface de
repositório abstrata + implementação Prisma + repositório in-memory para teste), mas o `domain/`
contém só a interface do repositório — sem pasta `entities/`, já que o "objeto" retornado é um
DTO de leitura (`IncomeStatementReport`/`CostCenterAnalysisReport`), não uma entidade com
identidade e ciclo de vida.

**Alternatives considered**:
- Colocar os dois use cases dentro de `financial-entries/` (dono da tabela de rateio) —
  rejeitado: a DRE e a análise por centro de custo cruzam 3 agregados diferentes
  (`FinancialEntry`/`FinancialGroup`/`ChartOfAccount`/`CostCenter`), nenhum dos quais é dono
  natural do relatório; um módulo `reports/` neutro evita acoplar o relatório a um dos cadastros.
- Padrão "submódulo fino" (Prisma direto, sem `domain`/`application`) — rejeitado: sem
  `.spec.ts` viola a exigência de TDD do projeto para este tipo de lógica (agregação com regras
  de negócio: rateio explodido, exclusão de grupos patrimoniais, bucket "Outros").

---

## D2 — Classificação do grupo financeiro: novo enum, não novo model

**Decision**: `FinancialGroup` ganha um campo `classification` (`FinancialGroupClassification` —
`resultado` | `patrimonial`), com `@default(resultado)` no schema. Os dois grupos de sistema
`caixa-e-bancos` e `ativo` são corrigidos para `patrimonial`:
- **Organizações novas**: `finance.seed.ts` já semeia com o valor correto — nenhum backfill
  necessário para elas.
- **Organizações existentes**: script standalone `scripts/backfill-financial-group-classification.ts`
  (mesmo padrão de `backfill-financial-entry-allocations.ts` — executado uma vez via
  `tsx`/`ts-node`, **não** dentro de `prisma migrate dev`, que só expressa diff de schema).
  Para cada organização, faz `UPDATE` (via Prisma) dos grupos com
  `systemKey IN ('caixa-e-bancos', 'ativo')` para `classification = 'patrimonial'` — idempotente
  (roda de novo sem efeito colateral se já corrigido).

O campo **não é exposto na tela de cadastro** (`features/financial-groups`): grupos criados pelo
lojista são sempre `resultado` (o backend fixa esse valor na criação, ignorando qualquer input do
cliente para esse campo — mesmo padrão de `isSystem`, que também não é um input do usuário).
`classification` também não entra no presenter de `GET /v1/financial-groups` — só é lido
internamente pela agregação da DRE. Isso mantém o contrato HTTP dos três cadastros **estável**
(zero mudança visível na tela de Grupo financeiro), only o novo endpoint de relatório enxerga o
campo.

**Rationale**: A alternativa de excluir por `systemKey` fixo (hardcoded na query da DRE) resolve o
bug com uma mudança menor, mas é frágil — qualquer novo grupo patrimonial de sistema no futuro
precisaria de mais um `systemKey` hardcoded espalhado pelo código do relatório. Um campo de
classificação é a modelagem correta do conceito ("este grupo participa do resultado do período ou
não") e o `database-reviewer` deve preferir isso a uma lista de exceções. Como o campo não é
editável pelo lojista, o custo de expor essa complexidade a mais na API/UI fica zero — é
puramente uma correção de dado de sistema.

**Alternatives considered**: Ver a análise completa em `spec.md` (pergunta de clarificação
resolvida antes da escrita do spec) — a opção "excluir por `systemKey` fixo" foi comparada e
descartada pelo usuário em favor desta.

---

## D3 — Agregação da DRE: `groupBy` no banco + join em memória só do lado pequeno

**Decision**: A consulta pesada (linhas de `financial_entry_allocations`, potencialmente milhares
por loja) é agregada **no Postgres** via `groupBy` do Prisma:

```
prisma.scoped.financialEntryAllocation.groupBy({
  by: ['chartOfAccountId'],
  where: {
    financialEntry: { organizationId, deletedAt: null, competenceDate: { gte: from, lte: to } },
  },
  _sum: { amountCents: true },
  _count: true,
})
```

O resultado é **1 linha por conta do plano com lançamento no período** (dezenas, não milhares).
Só então o código de aplicação busca as contas do plano + grupos financeiros da organização
(via os repositórios já existentes de `chart-of-accounts`/`financial-groups` — dezenas de linhas,
o tamanho do cadastro, não do histórico de lançamentos) para montar a hierarquia Conta → Grupo →
Seção e aplicar o filtro `classification = 'resultado'` (D2). Isso satisfaz o requisito "agregação
no banco, não em memória": a dimensão que cresce sem limite (lançamentos/rateio) nunca é
carregada linha a linha; só o resultado já agregado + o cadastro (bounded pelo tamanho do plano
de contas de uma loja, não pelo volume de transações).

**Rationale**: `groupBy` por `costCenterId` é o padrão idêntico para o relatório de centro de
custo (D5). Isso evita duas classes de bug de performance: paginação client-side (proibido pelo
princípio II da constituição) e um `include` profundo que traria todas as allocations com todas
as relações (`financialEntry` + `chartOfAccount` + `costCenter`) linha a linha.

**Alternatives considered**: SQL bruto (`$queryRaw`) com `JOIN` completo até `financial_groups` —
mais rápido em teoria (uma única query), mas perde a tipagem do Prisma e duplicaria a lógica de
filtro por `classification` fora do repositório de `financial-groups`; o ganho de performance não
se justifica na escala desta ferramenta (uma loja por vez, poucos milhares de lançamentos — ver
`Scale/Scope` no `plan.md`).

---

## D4 — Índices necessários

**Decision**: `financial_entry_allocations` já tem `@@index([chartOfAccountId])` e
`@@index([costCenterId])` (migration `20260805180448_...`) — suficientes para os dois `groupBy`.
`financial_entries` já tem `@@index([organizationId, competenceDate])` — suficiente para o filtro
de período. **Nenhum índice novo é necessário.**

**Rationale**: Os índices citados no prompt original como "a criar" já existem — foram entregues
por `001-financial-entries`. Confirmado lendo o schema atual antes de propor qualquer migration.

---

## D5 — Cost center analysis: filtro "Despesa"/"Receita" usa `FinancialEntry.operation`, não `FinancialGroup.type`

**Decision**: O parâmetro `type` (`despesa`\|`receita`) do relatório de centro de custo filtra por
`FinancialEntry.operation` (`payable`\|`receivable`), não por `ChartOfAccount.financialGroup.type`.

```
prisma.scoped.financialEntryAllocation.groupBy({
  by: ['costCenterId'],
  where: {
    financialEntry: {
      organizationId, deletedAt: null,
      operation: type === 'despesa' ? 'payable' : 'receivable',
      competenceDate: { gte: from, lte: to },
    },
  },
  _sum: { amountCents: true },
  _count: true,
})
```

**Rationale**: `operation` já é a distinção nativa de "dinheiro que sai" vs. "dinheiro que entra"
no lançamento (já indexado — `@@index([organizationId, operation])`, já usado como filtro em
`GET /v1/financial-entries`). Evita um segundo join até `financial_groups` só para replicar uma
distinção que o lançamento já carrega. Nos fluxos normais os dois critérios coincidem (um
`payable` aloca numa conta de grupo `despesa`); a única forma de divergir seria alocar
manualmente um `payable` numa conta de grupo `receita` — cenário de borda que não muda o
resultado prático deste relatório (RN-10 fala de "despesa ou receita", não do tipo do grupo).

**Alternatives considered**: Filtrar por `ChartOfAccount.financialGroup.type` — mais "fiel" à
terminologia de grupo financeiro, mas exige juntar `chart_of_accounts`/`financial_groups` no
`groupBy` (Prisma não permite `groupBy` com filtro em relação aninhada de 2 níveis sem subquery)
e não muda o resultado nos fluxos normais.

---

## D6 — Bucket "Outros" no relatório de centro de custo

**Decision**: `costCenterId` é `NOT NULL` no schema atual (FR obrigatório desde
`001-financial-entries`) — na prática, todo `FinancialEntryAllocation` tem um centro de custo
válido (FK `Restrict`, nunca aponta para um centro inexistente). O bucket "Outros" (FR-013 do
spec) é implementado como uma rede de segurança, não como um caminho de query real: se, ao
montar a resposta, o `costCenterId` agregado não resolver para um `CostCenter` ativo conhecido
(situação hoje inatingível, mas que o código não deve quebrar se algum dado futuro permitir), a
linha entra sob `costCenterId: null, costCenterName: "Outros"` em vez de lançar erro ou sumir da
soma. Os testes de use case cobrem esse caminho construindo o cenário sintético diretamente no
repositório in-memory (sem depender de conseguir criar esse estado via API).

**Rationale**: Implementar uma junção `LEFT JOIN` real para um caso que o schema não permite hoje
adicionaria complexidade sem benefício atual. A defesa é barata (um `?? "Outros"` no mapeamento) e
documenta a intenção corretamente — se o modelo mudar no futuro (centro de custo opcional), o
comportamento já está certo.

**Alternatives considered**: Tornar `costCenterId` opcional agora para "usar" o bucket de
verdade — fora de escopo (mudaria o contrato de `financial-entries`, que não faz parte desta
fatia e está marcado como estável no prompt original).

---

## D7 — Convenção de percentuais: fração crua no backend, arredondamento só na exibição

**Decision**: A API devolve `shareOfGroup`/`shareOfSection`/`share` como **frações não
arredondadas** (`accountTotalCents / groupTotalCents`, em ponto flutuante/`number`), exatamente
como o mock atual já faz (`total / group.total`, sem `Math.round`). A soma de frações cruas do
mesmo total fecha em 1.0 por construção — não há erro de arredondamento a "distribuir". O
arredondamento para exibição (1 casa decimal, ex. "33,3%") acontece **só no frontend**, na função
já existente `formatResultShare` — reaproveitada sem alteração.

**Rationale**: Isso já é a convenção do código atual (mock) e da UI existente — manter evita
qualquer mudança visual e resolve "os percentuais devem somar 100%" (SC-002/SC-003) de forma
trivial: a asserção do teste de use case é sobre a soma das frações cruas (`toBeCloseTo(1, 9)`),
não sobre strings formatadas.

**Alternatives considered**: Arredondar no backend (2 casas) e usar "maior resto" para forçar a
soma em exatos 100,00% — mais robusto para exportação futura (PDF/Excel, fora de escopo — FR-019),
mas desnecessário agora e divergente da convenção já estabelecida no mock/UI.

---

## D8 — Sinal da despesa: magnitude positiva no backend, sinal só na formatação

**Decision**: `totalCents` de conta/grupo/seção são sempre **magnitudes positivas** (nunca
negativos) — a mesma convenção do mock atual (`MOCK_RESULT_ENTRIES`/`toSection`). O sinal negativo
da despesa (FR-006) continua sendo aplicado só na exibição, por `formatResultAmount(value, type)`
(já existente, reaproveitada sem alteração — decide o sinal pelo `type` da seção, não pelo valor
recebido). `netCents` (receita − despesa) pode ser negativo de verdade — `formatResultNet` já
trata isso.

**Rationale**: Reaproveitar a convenção existente é o que permite "trocar só a fonte dos dados,
não redesenhar a UI" (orientação explícita do prompt original) — os componentes de formatação já
estão certos e não precisam mudar.

---

## D9 — Contrato dos dois relatórios espelha os tipos que a UI já consome

**Decision**: `GET /v1/reports/income-statement?from=&to=` devolve exatamente o shape de
`FinancialResultReport` (`types/financial-result.ts`), trocando `total`/`amount` (reais, `number`)
por `totalCents`/`amountCents` (centavos, `number` inteiro) — ver `contracts/reports-api.md` e
`data-model.md`. `GET /v1/reports/cost-centers?from=&to=&type=` devolve uma lista ordenada por
valor decrescente, já pré-agregada. Nenhum dos dois pagina — o volume de linhas de retorno é
limitado pelo tamanho do cadastro (contas/grupos/centros de custo de uma loja), não pelo volume de
lançamentos.

**Rationale**: Ver observação do prompt original, confirmada correta durante a pesquisa: o shape
já existe na UI (`financial-results/types`) — copiá-lo no backend (centavos) faz a migração do
front virar troca de origem de dado, não redesenho de tela.

**Alternatives considered**: Paginar os relatórios — rejeitado: não faz sentido paginar uma árvore
Grupo→Conta cujo tamanho é o cadastro, não o histórico.

---

## D10 — Frontend: nenhuma biblioteca de gráfico nova

**Decision**: `cost-center-analysis` usa `LinearProgress` de `@mui/material` (já é dependência
direta do app — `apps/erp/web/AGENTS.md` §3) para a barra de participação horizontal por centro de
custo, em vez de um gráfico de pizza. `@citybox/mui` não expõe hoje nenhum componente de gráfico
(confirmado por busca no pacote) — introduzir uma lib de chart (`recharts`, `nivo`, etc.) exigiria
alinhamento prévio fora do escopo desta fatia (ver acceite: "nenhuma dependência de gráfico
adicionada sem alinhamento prévio").

**Rationale**: `LinearProgress` com `value={share * 100}` cumpre o requisito funcional (mostrar
percentual por centro de custo) sem dependência nova, com o mesmo nível de acessibilidade
(`role="progressbar"` nativo) de um gráfico de pizza customizado.

**Alternatives considered**: SVG customizado (pizza feita à mão) — mais fiel à referência visual
do ConnectPlug, mas maior esforço e maior superfície de bug (cálculo de ângulos/paths) para um
ganho estético que o acceite não exige.

---

## D11 — Estrutura de teste (backend) e ausência de teste automatizado (frontend)

**Decision**: Backend segue o padrão já estabelecido — `.spec.ts` por use case
(`get-income-statement.use-case.spec.ts`, `get-cost-center-analysis.use-case.spec.ts`) sobre um
repositório in-memory (`tests/in-memory-finance-report.repository.ts`) que replica a lógica de
agregação em memória (para o teste, não para produção — produção usa `groupBy` real). Frontend:
mesma decisão já registrada em `specs/erp/001-financial-entries/plan.md` — `apps/erp/web` não tem
infraestrutura de teste (`Vitest`/`RTL`) hoje; validação end-to-end via `quickstart.md` +
`typecheck`/`lint`.

**Rationale**: Consistência com o padrão já auditado nas duas features financeiras anteriores.
Introduzir Vitest em `erp-web` continua sendo débito técnico separado, fora do escopo.
