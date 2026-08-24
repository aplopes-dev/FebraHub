# Phase 0 Research: Lançamentos financeiros ponta a ponta

Todas as decisões abaixo resolvem lacunas técnicas descobertas ao confrontar as decisões de
negócio já fechadas em `spec.md` (`## Clarifications`) com o código real de `apps/erp/api` e
`apps/erp/web` (relatório de exploração completo). Nenhuma delas reabre escopo de negócio já
decidido com o usuário — são refinamentos de implementação necessários para que essas decisões
sejam realizáveis dentro do schema/arquitetura existentes.

---

### D1 — Persistência de pagamentos e rateio: nested writes numa transação, não sub-rotas próprias

**Decision**: `FinancialEntryPayment[]` e `FinancialEntryAllocation[]` são coleções filhas do
agregado `FinancialEntry`, gravadas dentro da **mesma transação** do `save()` do pai:
`upsert` do `FinancialEntry` + `deleteMany` + `createMany` de cada coleção filha (substituição
total, sem diff incremental). Não ganham módulo NestJS próprio nem rotas HTTP dedicadas.

**Rationale**: A spec (RN-14, FR-015) já define que o `PUT` manda o lançamento inteiro e
substitui pagamentos/rateios por completo — semântica de substituição, não de diff. O precedente
mais próximo no código real **não é** `card-contracts`/`payment-methods` (que usa 2 endpoints
separados, contrato criado antes/depois dos métodos de pagamento) — é
`PrismaSaleOrderRepository.save()` (`apps/erp/api/src/modules/sales/infrastructure/database/prisma-sale-order.repository.ts`),
que já faz exatamente `upsert` do pedido + `deleteMany`/`createMany` de `SaleOrderLine[]` e
`SaleOrderPayment[]` na mesma transação. Seguir esse padrão evita inventar uma segunda forma de
persistir agregado+filhos no mesmo módulo `finance`, e casa com o fluxo real do formulário
(uma tela, um botão Salvar, um `POST`/`PUT`).

**Alternatives considered**:
- Sub-rotas próprias por linha (padrão `card-contracts`/`payment-methods`) — rejeitado: o
  formulário nunca edita uma linha isoladamente fora do contexto do lançamento inteiro; criaria
  N chamadas de rede por save sem necessidade.
- Diff incremental (comparar linhas antigas vs novas e só alterar o delta) — rejeitado: mais
  complexo, sem ganho real (linhas de pagamento/rateio não têm identidade estável para o
  cliente antes de salvar — mesmo raciocínio já documentado no código para `CardRateTier`).

---

### D2 — `FinancialEntryAttachment` tem rota HTTP própria, fora do payload principal

**Decision**: Anexos são o único filho com endpoints dedicados —
`POST/GET/DELETE v1/financial-entries/:id/attachments[/:attachmentId]` — chamados **depois** do
save principal do lançamento, nunca dentro do mesmo payload de `payments`/`allocations`.

**Rationale**: Spec FR-014 exige que falha de upload não bloqueie o salvamento do resto do
lançamento — só é possível com uma chamada de rede separada. O precedente real é o upload de
imagem de produto (`POST/GET/DELETE v1/products/:id/image`, `multipart/form-data`, campo `file`,
`ObjectStorage` global via `StorageModule`) — mesmo padrão, adaptado para múltiplos arquivos por
lançamento (uma linha `FinancialEntryAttachment` por arquivo, ao invés de uma única coluna
`imageUrl`).

**Alternatives considered**: Base64 embutido no payload principal do lançamento — rejeitado:
contraria FR-014 (falha de anexo não pode derrubar o save principal) e explode o tamanho do
payload JSON sem necessidade, já que o monorepo tem `ObjectStorage`/MinIO prontos para isso.

---

### D3 — Validação de FK (categoria, centro de custo, cliente, fornecedor): import direto do módulo, não porta mínima

**Decision**: `FinancialEntriesModule` importa `ChartOfAccountsModule`, `CostCentersModule`,
`CustomersModule` e `SuppliersModule` diretamente e injeta os repositórios completos exportados
por cada um (`ChartOfAccountRepository.findById`, etc.) — mesmo padrão que já existe hoje para
`BankAccountsModule`/`BankAccountRepository` dentro de `financial-entries`.

**Rationale**: O monorepo tem dois padrões coexistindo: import de módulo inteiro (ex.:
`ChartOfAccountsModule → FinancialGroupsModule`, `financial-entries → BankAccountsModule`) e
porta mínima local (`BankAccountLookup` dentro de `card-contracts`, comentário explícito no
código: "depender do módulo inteiro por essa única pergunta acoplaria os dois cadastros" — usado
ali porque `card-contracts` só precisa de um booleano de existência). `financial-entries` já
segue o padrão de import completo para `bankAccountId`; manter os 4 novos vínculos (categoria,
centro de custo, cliente, fornecedor) no mesmo padrão evita introduzir uma terceira convenção
no mesmo módulo. `customerId`/`supplierId` hoje **não são validados** no código atual (gap
existente) — esta feature fecha esse gap por consistência com FR-012 e com o padrão já usado
para `bankAccountId`, mesmo a spec não citando `customerId`/`supplierId` explicitamente em
FR-012 (é extensão de robustez de baixo risco, não mudança de escopo de negócio).

**Alternatives considered**: Porta mínima (`ChartOfAccountLookup`, `CostCenterLookup`,
`CustomerLookup`, `SupplierLookup`) para os 4 vínculos — rejeitado por inconsistência
desnecessária dentro do mesmo módulo (já usa import completo para `bankAccountId`) e porque os
casos de uso aqui **não** são só "existe?": o presenter da resposta provavelmente vai querer
nome/descrição da categoria e do centro de custo eventualmente (fora do escopo desta fase, mas
o repositório completo já dá essa opção de graça sem custo extra).

---

### D4 — `FinancialEntry.customerId`/`supplierId` ganham FK real (`@relation`); `saleOrderId` mantém-se sem FK

**Decision**: Adicionar `@relation` real (`onDelete: SetNull`, mesmo padrão de `bankAccountId`)
para `customerId` e o novo `supplierId`. `saleOrderId` **não** ganha `@relation` nesta fase.

**Rationale**: Hoje `customerId` e `saleOrderId` são colunas soltas sem FK no schema (confirmado
por leitura direta) — uma lacuna de integridade referencial. Fechar isso para
`customerId`/`supplierId` é seguro e local ao módulo `finance` (não toca contrato HTTP de
`customers`/`suppliers`, só adiciona uma constraint de banco). `saleOrderId` fica de fora porque
tocar essa relação implicaria decidir `onDelete` num relacionamento que atravessa o módulo
`sales` (edição fora do escopo autorizado pelo prompt original: "não toque em `SaleOrder`... só o
trecho que grava a entrada financeira").

**Alternatives considered**: Deixar `customerId` sem FK, igual está hoje — rejeitado: contraria
FR-012 (que já pede validação de pertencimento à organização) sem custo adicional de fazer
direito, já que o repositório de `customers` já está sendo importado por D3.

---

### D5 — `status` (pendente/pago) é coluna persistida, recalculada no `save()`, não campo computado em cada leitura

**Decision**: `FinancialEntry` ganha uma coluna `status FinancialEntryStatus` (`pending | paid`),
recalculada dentro da mesma transação de `save()` como
`paidCents >= (amountCents + feesCents + finesCents) ? 'paid' : 'pending'`, com
`@@index([organizationId, status])`. `paidCents` continua existindo como hoje, mas passa a ser
**recalculado a partir da soma de `payments[].amountCents`** a cada save, em vez de um valor
enviado diretamente pelo cliente.

**Rationale**: FR-008/FR-018 exigem que o status seja filtrável **server-side** — via
`WHERE status IN (...)` simples e indexado. `totalCents` não é uma coluna persistida (é
`amountCents + feesCents + finesCents`, sempre calculado), e o Prisma Client não compara duas
expressões computadas dentro de um `where` declarativo sem cair em `$queryRaw` — persistir
`status` (padrão de coluna derivada materializada) é a forma mais simples e consistente com o
resto do módulo (que já filtra por colunas concretas: `operation`, `dueDate`). Reaproveitar
`paidCents` como cache recalculado (em vez de aceitar o valor bruto do cliente) fecha, de
quebra, o mesmo tipo de inconsistência que motivou pedir centro de custo obrigatório: uma única
fonte de verdade (as linhas de pagamento) alimentando o campo agregado.

**Alternatives considered**: Computar `status` só no presenter, a cada leitura — funciona para
`GET :id`, mas não permite filtrar a listagem por status sem carregar tudo em memória (violaria
o princípio II da constituição). `$queryRaw` para o filtro — rejeitado por complexidade extra
sem necessidade, já que persistir a coluna resolve com o padrão Prisma comum já usado no módulo.

---

### D6 — `totalCents` não é persistido; `categoryName` fica na tabela, mas deixa de ser escrita/lida por código novo

**Decision**: `totalCents` nunca é uma coluna — sempre `amountCents + feesCents + finesCents`,
calculado no presenter/entidade. `categoryName` **permanece** na tabela `financial_entries`
(não é removida por esta migration), mas nenhum código novo (use cases, presenter, formulário)
lê ou escreve nela — vira um campo histórico morto, mantido só para não perder o valor bruto
pré-migração em caso de auditoria.

**Rationale**: Remover uma coluna é uma mudança de schema mais arriscada (e, no caso, sem
benefício real — manter o dado histórico bruto ajuda a depurar o backfill se algo sair errado) do
que só parar de escrevê-la. `totalCents` como coluna persistida criaria uma segunda fonte de
verdade que poderia divergir de `amountCents + feesCents + finesCents` se um dia um desses três
campos for editado sem recalcular o total — mantê-lo sempre derivado elimina essa classe de bug.

**Alternatives considered**: Remover `categoryName` na mesma migration — rejeitado por risco
desnecessário (nenhum requisito pede a remoção; FR-024/FR-025 pedem só que o rateio passe a ser
a fonte de verdade para os relatórios, não que o campo antigo desapareça).

---

### D7 — Categoria de fallback do backfill: duas contas de sistema (`outras-receitas` reaproveitada + `outras-despesas` nova), não uma única

**Decision**: A clarificação decidida com o usuário foi "uma categoria de sistema dedicada
'Outras'" (singular, na conversa). Na prática do schema real, isso precisa virar **duas** contas
de sistema, porque `ChartOfAccount.financialGroupId` é obrigatório e aponta para um
`FinancialGroup` tipado (`receita` | `despesa`) — uma única conta não consegue servir de
fallback tanto para um lançamento `payable` quanto para um `receivable` sem violar essa
tipagem. O seed (`finance.seed.ts`) **já tem** `systemKey: 'outras-receitas'` (`"Outras
receitas"`, grupo `receitas`) — reaproveitado como fallback para lançamentos `receivable`. É
criado **um novo** `systemKey: 'outras-despesas'` (`"Outras despesas"`, grupo `despesas`) para
lançamentos `payable`. Ambos entram em `SEED_CHART_OF_ACCOUNTS` (para organizações novas) **e**
são inseridos via `scripts/backfill-financial-entry-allocations.ts` para organizações já
existentes que ainda não têm essas contas (upsert por `systemKey`, idempotente).

**Rationale**: É a interpretação mais fiel possível da decisão já tomada com o usuário
("categoria dedicada, separada da categoria de vendas, para rastrear o que foi enquadrado
automaticamente"), adaptada à única restrição real do schema que a torna inviável ao pé da
letra. Não muda o comportamento visível: para o operador, cada lançamento antigo aparece com uma
categoria "Outras receitas" ou "Outras despesas" (coerente com o tipo do lançamento), nunca uma
categoria de vendas ou uma categoria inexistente.

**Alternatives considered**: Uma única conta "Outras" fora de qualquer `FinancialGroup`
(tornando `financialGroupId` opcional) — rejeitado: mudaria uma constraint de schema usada por
`chart-of-accounts` como um todo (fora do escopo autorizado, "não altere contratos/schema de
módulos que não são donos desta fatia" não se aplica tecnicamente aqui pois `ChartOfAccount` é
do mesmo módulo `finance`, mas tornar o campo opcional afetaria toda a feature de plano de
contas, não só o backfill). Usar só `'outras-receitas'` para os dois casos — rejeitado por gerar
relatórios de DRE incoerentes (uma despesa aparecendo dentro do grupo de receitas).

---

### D8 — Centro de custo do lançamento auto-gerado pelo fechamento de `SaleOrder`: `comercial`

**Decision**: O rateio de 100% criado automaticamente para o recebível de venda (FR-025) usa
`chartOfAccountId` = conta de sistema `vendas-mercadorias` (já existe no seed, sem mudança) e
`costCenterId` = centro de custo de sistema `comercial` (já existe no seed:
`administrativo`, `comercial`, `financeiro`, `operacional`, `marketing`).

**Rationale**: FR-010 exige centro de custo em **toda** linha de rateio, sem exceção para
lançamentos gerados pelo sistema — então o fechamento de `SaleOrder` precisa escolher um. Vendas
pertencem naturalmente ao departamento comercial; é o único mapeamento sem ambiguidade dentre os
5 centros de custo do seed.

**Alternatives considered**: Deixar `costCenterId` nulo só para esse caso — rejeitado, violaria
FR-010 diretamente (a regra foi definida sem exceção). Criar um centro de custo de sistema novo
"Vendas automáticas" só para isso — rejeitado por over-engineering: não há requisito pedindo
segregar esse relatório por origem (manual vs automático), e o `comercial` já existente cobre o
caso com fidelidade suficiente.

---

### D9 — Centro de custo do backfill de lançamentos legados: `administrativo`

**Decision**: Toda `FinancialEntryAllocation` criada pelo script de backfill (para lançamentos
que existiam antes desta feature) usa `costCenterId` = centro de custo de sistema
`administrativo`.

**Rationale**: Mesma restrição de FR-010 (centro de custo obrigatório) se aplica ao backfill.
Dados históricos não têm informação de departamento — `administrativo` é o catch-all mais neutro
dos 5 centros do seed para dados sem essa granularidade, e é consistente com D7 (contas
"Outras" também são o catch-all de categoria).

**Alternatives considered**: Nenhuma alternativa melhor identificada sem inventar um 6º centro
de custo de sistema só para isso (rejeitado pela mesma razão de D8 — sem requisito pedindo essa
segregação).

---

### D10 — Backfill é um script standalone, fora do fluxo de `prisma migrate dev`

**Decision**: `apps/erp/api/scripts/backfill-financial-entry-allocations.ts`, executado uma vez
via `tsx`/`ts-node` (não via `prisma migrate dev`, que só expressa diffs de schema, não lógica de
negócio como "casar nome de categoria com string livre"). Ordem de execução:
1. Aplicar a migration de schema normal (`db:migrate:dev`) — cria as 3 tabelas novas + coluna
   `status` + FKs novas + os 2 `systemKey` novos no `finance.seed.ts` (só afeta orgs criadas
   *depois* deste ponto).
2. Rodar o script de backfill — para cada organização existente: garante (`upsert` por
   `systemKey`) as contas `outras-receitas`/`outras-despesas` e o centro `administrativo`; para
   cada `FinancialEntry` sem `allocations[]`, cria 1 `FinancialEntryAllocation` de 100% do total,
   casando `categoryName` (trim + case-insensitive) com `ChartOfAccount.name` da mesma
   organização, caindo no fallback (D7) quando não casar. Loga quantos casos foram para o
   fallback, por organização.

**Rationale**: A regra do `AGENTS.md` ("migrations só via `db:migrate:dev`, proibido editar
`.sql` à mão") governa migrações de **schema**; um backfill de dados condicionado a lógica de
negócio (comparação de string, fallback por tipo de operação) não é um diff de schema e não deve
ser forçado dentro de um arquivo de migration. Isolar num script explícito e documentado no
`quickstart.md` também torna o passo auditável/reexecutável em ambientes diferentes (dev,
staging, produção) sem depender da ordem de deploy da migration em si.

**Alternatives considered**: Gerar a migration com `--create-only` e editar o SQL manualmente
para incluir os `INSERT`/`UPDATE` de backfill — tecnicamente suportado pelo Prisma, mas
explicitamente proibido pela regra do `AGENTS.md` deste projeto ("é proibido escrever/editar
`.sql` em `prisma/migrations/` à mão"); descartado sem hesitação por violar uma restrição
explícita.

---

### D11 — Forma de pagamento: enum fixo de string (sem cadastro)

**Decision**: `FinancialEntryPayment.paymentMethod` é uma `String` validada por um enum de
aplicação fixo (`dinheiro | pix | debito | credito | boleto | deposito | transferencia`), não um
model Prisma novo nem FK.

**Rationale**: Já documentado como Assumption no `spec.md` (recomendação do prompt original,
sem objeção do usuário) — não existe cadastro de formas de pagamento na API hoje
(`/configuracoes/formas-pagamento` é placeholder). Um enum fixo resolve a validação sem criar um
módulo novo só para isso.

**Alternatives considered**: Criar `PaymentMethod` como model — adiado explicitamente para
quando a tela de configurações existir (fora do escopo desta feature).

---

### D12 — Bandeira do cartão: campo `String?` livre, com sugestões (não enum, não FK)

**Decision**: `FinancialEntryPayment.cardBrand` é `String?` opcional. No frontend, o
`Autocomplete` do campo aceita texto livre, mas sugere valores distintos já usados em
`CardPaymentMethod.brand` (contratos de cartão ativos da organização) via uma query leve — não
existe cadastro de bandeiras hoje, e `CardPaymentMethod.brand` já é `String?` livre no schema
real (confirmado por leitura direta).

**Rationale**: Consistente com o campo equivalente já existente em `card-contracts`
(`CardPaymentMethod.brand`) — mesmo tipo, mesma ausência de cadastro formal.

**Alternatives considered**: Enum fixo de bandeiras (Visa/Master/Elo/...) — rejeitado porque
`CardPaymentMethod.brand` já não usa enum hoje; inventar uma trava mais rígida só para
`financial-entries` criaria inconsistência entre os dois cadastros de bandeira do mesmo domínio.

---

### D13 — Anexos: 2 hooks de options novos no frontend, no molde de `useBankAccountOptionsQuery`

**Decision**: `useChartOfAccountOptionsQuery()` (`features/chart-of-accounts/hooks/`) e
`useCostCenterOptionsQuery()` (`features/cost-centers/hooks/`) são criados replicando
exatamente `useBankAccountOptionsQuery` (`useQuery` com `queryKey` de escopo, `enabled: ready`,
`staleTime: 5*60_000`, retorno `{id, name}[]`, endpoint `GET /v1/{recurso}?perPage=100&tab=active`).

**Rationale**: Hoje só existe listagem paginada completa (`useChartOfAccountsQuery`/
`useCostCentersQuery`) para essas duas features — nenhum hook "slim" de opções para popular um
`Select`/`Autocomplete` de formulário, ao contrário de `bank-accounts`/`customers`/`suppliers`,
que já têm essa variante. O formulário de lançamento precisa de opções leves (id+nome), não da
listagem paginada com filtros/abas.

**Alternatives considered**: Usar `useChartOfAccountsQuery`/`useCostCentersQuery` diretamente
com `perPage` alto — rejeitado por trazer campos e metadados desnecessários (paginação,
`tabCounts`) para um simples preenchimento de `Select`, além de acoplar o formulário à forma de
paginação da listagem completa.

---

### D14 — Anexos: limite de 5MB por arquivo, PDF ou imagem, seguindo o padrão `ImageFileValidator`

**Decision**: Novo `AttachmentFileValidator` (paralelo ao `ImageFileValidator` já usado em
imagem de produto), validando assinatura binária (magic bytes) de PDF/PNG/JPEG/WEBP e tamanho
≤ 5MB — mesma mecânica (`FileInterceptor` com `limits.fileSize`, mais checagem de assinatura no
use case, não confiar só no `mimetype` declarado pelo cliente).

**Rationale**: Decisão já fechada com o usuário na clarificação (5MB, PDF e imagens). O
`ImageFileValidator` existente cobre só imagem (4MB) — precisa de uma variante que também aceite
PDF e outro teto de tamanho; a mecânica de verificação (assinatura binária, não só `mimetype`) é
reaproveitada integralmente.

**Alternatives considered**: Confiar só no `Content-Type` declarado pelo `multipart/form-data` —
rejeitado, mesmo risco de spoofing que o `ImageFileValidator` já existe para mitigar.

---

### D15 — Frontend: sem Vitest novo em `erp-web` nesta feature

**Decision**: Esta feature não introduz infraestrutura de teste automatizado no frontend. A
verificação end-to-end de cada cenário de aceite do `spec.md` é feita manualmente via os passos
documentados em `quickstart.md`. O gate de PR permanece `pnpm --filter @citybox/erp-web
typecheck && pnpm --filter @citybox/erp-web lint`, como já documentado em `apps/erp/AGENTS.md`
§5 — nenhum comando `test` é adicionado a esse gate para `erp-web` por esta feature.

**Rationale**: `apps/erp/web` não tem nenhuma infraestrutura de teste hoje (confirmado por
varredura: zero `*.test.tsx`, sem `vitest`/`@testing-library` no `package.json`) — nem
`card-contracts` (a feature de referência mais madura do módulo finance) tem testes. Introduzir
Vitest do zero (config, dependências, CI) é um investimento de tooling ortogonal ao valor de
negócio desta feature e infla desnecessariamente um escopo já classificado como "o maior prompt
do módulo" no material de origem. As regras gerais do projeto (`.claude/rules/ecc/react/testing.md`)
recomendam Vitest, mas a regra local mais específica de gate por pacote
(`apps/erp/AGENTS.md` §5) não exige `test` para `erp-web` hoje — regra específica prevalece
sobre a geral neste ponto, e a lacuna é registrada como débito técnico separado (fora desta
feature) para não bloquear a entrega do valor de negócio principal.

**Alternatives considered**: Introduzir Vitest + testes de componente para as seções novas do
formulário — desejável a médio prazo, mas adiado; ver "Débitos técnicos assumidos" no
`quickstart.md`.

---

## Resumo das decisões (para referência rápida em `tasks.md`)

| # | Decisão | Impacto |
|---|---|---|
| D1 | Pagamentos/rateio: nested writes numa transação (padrão `SaleOrder`) | Repositório Prisma |
| D2 | Anexos: rota HTTP própria, fora do payload principal | Módulo + frontend |
| D3 | FK de categoria/centro de custo/cliente/fornecedor: import de módulo completo | Módulo NestJS |
| D4 | `customerId`/`supplierId` ganham FK real; `saleOrderId` não | Schema |
| D5 | `status` é coluna persistida, recalculada no save | Schema + repositório |
| D6 | `totalCents` nunca persistido; `categoryName` fica, mas morta | Schema |
| D7 | Fallback do backfill: `outras-receitas` (reuso) + `outras-despesas` (nova) | Seed + backfill |
| D8 | Centro de custo do recebível auto-gerado por venda: `comercial` | `sales` repository |
| D9 | Centro de custo do backfill: `administrativo` | Script de backfill |
| D10 | Backfill é script standalone, fora de `prisma migrate dev` | Processo de deploy |
| D11 | Forma de pagamento: enum fixo de string | DTO/domínio |
| D12 | Bandeira do cartão: `String?` livre com sugestões | DTO/domínio + frontend |
| D13 | 2 hooks de options novos (`chart-of-accounts`, `cost-centers`) | Frontend |
| D14 | Anexos: 5MB, PDF/imagem, validador de assinatura binária | Backend |
| D15 | Sem Vitest novo em `erp-web` nesta feature | Processo/gate |

Nenhum `[NEEDS CLARIFICATION]` remanescente — todas as lacunas técnicas identificadas ao
confrontar a spec com o código real foram resolvidas acima.
