# Research — spec erp/030

## D1 — Allowlist de rota para `GET /v1/fiscal-documents` no proxy

**Decisão**: nova função `isFiscalDocumentsListRoute(segments, method)` — `norm[0]==='v1' &&
norm[1]==='fiscal-documents' && segments.length===2 && method==='GET'` — adicionada ao disjunto de
`isCompanyScopedRoute` junto de `isCertificateStatusRoute`, não revertendo para
`Boolean(queryCompanyId)` genérico.

**Motivo**: o CRITICAL da spec 029 era exatamente "qualquer rota com `?companyId=`" elevar — a
correção certa é *adicionar* rotas ao allowlist conforme necessário, nunca voltar ao padrão
aberto. `segments.length===2` exclui `/v1/fiscal-documents/:id` (que tem seu próprio mecanismo,
usado só server-to-server por `resolveFiscalDocumentOwnerCompanyId`, nunca pelo browser
diretamente) e `/v1/fiscal-documents/summary` (2 segmentos a mais — se precisar, entra depois,
sob demanda, mesmo padrão).

**Alternativas consideradas**: reverter para `Boolean(queryCompanyId)` — rejeitada (reabre o
CRITICAL). Migrar a leitura de volta para o proxy do erp-web — fora de escopo (a aba já migrou
para erp-api por decisão de outra spec; não desfazer aqui).

## D2 — `companyId` como query param no adapter do erp-api

**Decisão**: `HttpFiscalApiAdapter.call()` ganha um parâmetro extra para path que já inclui a
query, e `listDocuments`/`getSummary` passam a montar a URL com `companyId` no `URLSearchParams`
(mesmo `params` que já existe para os outros filtros), mantendo o header `X-Company-Id` também
(não usado por essas 2 rotas hoje na fiscal-api, mas inofensivo mantê-lo — outras rotas do mesmo
adapter podem precisar dele).

**Motivo**: `GET /v1/fiscal-documents` na fiscal-api exige `companyId` via `@Query`, não header —
confirmado lendo `list-fiscal-documents.route.ts`. Sem isso, toda chamada é um 400.

## D3 — `X-Company-Id` no branch de download do proxy (erp-web)

**Decisão**: dentro do `else if (fiscalDocumentDownloadId(segments))`, quando a elevação é
confirmada (`ownerCompanyId === identity.companyId`), adicionar `headers.set('X-Company-Id',
identity.companyId)` no request upstream — feito no bloco de montagem de headers existente
(`usingServiceToken` já sinaliza que deve elevar; o `identity.companyId` já está resolvido nesse
escopo).

**Motivo**: `GetDanfseRoute` (e o par NF-e, `get-danfe.route.ts`) usam `@CompanyId()`, que lança
`BadRequestException` sem o header. XML não precisa (rota sem `@CompanyId()`), mas enviar o
header sempre que a elevação acontece é seguro e uniforme — não há downside em mandar um header
que a rota-alvo simplesmente ignora.

## D4 — Backfill de `SaleOrderPayment.methodId`

**Decisão (revisada após database-review — ver nota abaixo)**: script standalone
`apps/erp/api/scripts/backfill-sale-order-payment-method-ids.ts` (`pnpm --filter @citybox/erp-api
db:backfill:sale-order-payment-method-ids`), molde exato de `scripts/backfill-financial-*.ts`
(`NestFactory.createApplicationContext` + `PrismaService`). Resolve `sale_order_payments`
escopado aos 5 ids mock conhecidos, por organização, buscando `PaymentMethod` por
`(organizationId, systemKey)` (mapeando `pm-cartao-credito` → `systemKey='pm-cartao'`, os outros
1:1) e ignorando formas soft-deleted (`deletedAt != null`). Lógica pura exportada
(`backfillSaleOrderPaymentMethodIds`), separada do `main()` CLI, para ser testável sem subir o
`NestApplicationContext` inteiro.

**Nota de correção**: a primeira versão desta decisão (implementada e já testada localmente)
era uma migration Prisma só-de-dado (`UPDATE ... FROM` num `migration.sql` hand-written). O
database-reviewer bloqueou essa versão com CRITICAL: `apps/erp/api/AGENTS.md` §5.9 proíbe
explicitamente criar/editar `.sql` em `prisma/migrations/` manualmente, e o próprio repositório
já tinha 3 precedentes de backfill de dado feitos como `scripts/backfill-*.ts` +
`pnpm db:backfill:*` (`backfill-financial-entry-allocations.ts`,
`backfill-financial-group-classification.ts`, `backfill-financial-group-catalog-order.ts`) — a
migration hand-written divergia dessa convenção estabelecida sem justificativa registrada. A
migration já aplicada localmente foi revertida (arquivo removido, linha correspondente apagada
de `_prisma_migrations` no banco de dev) antes de reescrever como script.

**Motivo (mantido)**: `SaleOrderPayment` é uma tabela relacional real (não JSON embutido) —
`model SaleOrderPayment { methodId String @map("method_id") ... }`, sem FK declarada para
`PaymentMethod`, exatamente por isso o mock vazou sem nada travar. `(organizationId, systemKey)`
é `@@unique` em `PaymentMethod` — nunca há ambiguidade de qual forma resolver. Idempotente por
construção (rodar de novo é no-op, já que depois da primeira vez nenhum pagamento mais casa a
lista de ids mock conhecidos) — coberto por teste que roda a função 2x e confere que a segunda
não muda nada.

**Alternativas consideradas**: migration Prisma hand-written — rejeitada pelo motivo acima.
Use-case/endpoint administrativo — over-engineering para uma correção de um-tiro.

## D5 — Seletores de forma de pagamento (4 formulários)

**Decisão**: os 4 formulários (`sale-order-form-view.tsx` — reaproveitado por Vendas — ,
`purchase-*`, `service-order-payment-dialog.tsx`) trocam a chamada síncrona
`listPaymentMethods()` (mock) pelo hook já existente `usePaymentMethodOptionsQuery()`
(`features/payment-methods/hooks/use-payment-method-options-query.ts`), mesmo hook que
`financial-entries` já usa. `mock-payment-methods.ts` e o `listPaymentMethods()` síncrono de
`purchases/services/purchase.service.ts` são removidos depois que os 4 formulários migrarem —
zero consumidor restante.

**Motivo**: reuso total, zero código novo de fetch — o hook e o endpoint (`/v1/payment-methods`)
já existem e já são usados em produção por Lançamentos financeiros.

**Nota de tipo**: `PaymentMethodOption` (tipo do mock, com `cardPaymentType` opcional) precisa de
um mapeamento para `PaymentMethod` (tipo real da API, com `id` UUID/`fiscalCode`/`systemKey`) nos
3 pontos que consomem `cardPaymentType` (motor de recebíveis de `sales-orders`) — `PaymentMethod`
real não tem esse campo hoje; resolvido inferindo `cardPaymentType` a partir do `systemKey`
resolvido (`pm-cartao` → `credit`, `pm-cartao-debito` → `debit`, `pm-pix` → `pix`, os demais
`undefined`), mesma lógica que o mock já codificava, só que derivada do dado real em vez de
hardcoded no catálogo.

## D6 — Mensagem de bloqueio (FR-009)

**Decisão**: em `IssueNfeUseCase.resolvePayments`, distinguir dois `catch`: `method` não
encontrado no `Map` (id órfão) → nova mensagem "A forma de pagamento do pedido não está mais
cadastrada; edite o pedido e selecione uma forma válida."; `method` encontrado mas
`fiscalCode` nulo → mensagem já existente da spec 029 (nomeia a forma, aponta para
Configurações). Nenhuma mudança de contrato HTTP — é só o texto de `FiscalApiEmissionError`.

## D7 — `pAliq` no builder da DPS

**Decisão**: `dps-xml.builder.ts` linha 275, trocar `(input.service.issRate * 100).toFixed(2)`
por `input.service.issRate.toFixed(2)`. Fixture de teste
(`issue-nfse-test-context.ts:214`, `issRate: 0.05`) passa a `issRate: 5` (5%, consistente com o
resto do sistema). Testes que hoje verificam o `pAliq` resultante são reconferidos para `5.00`
em vez de `5.00` calculado a partir de `0.05*100` — resultado numérico igual, só a premissa do
dado de entrada muda, então nenhum `expect` de valor final deve mudar, só o `issRate` do fixture.

**Motivo**: erp-api resolve `issRate: group.issqnRate` direto, sem conversão, e `issqnRate` é
validado como percentual 0–100 no domínio (`MAX_ALIQUOTA = 100`) e exibido como percentual no
formulário de cadastro e na tela de emissão. O builder é o único ponto da cadeia tratando o valor
como fração — inconsistência confirmada por leitura de código, não por suposição.

## Correção de dado (fora do código, para o usuário)

O grupo "Principal" com `issqnRate = 0.05` no banco de produção da RR EMPREENDIMENTOS precisa de
correção manual pelo usuário (editar o grupo em Configurações → Fiscal → Grupos de ISSQN,
trocar para `5`) — a correção de código não altera dado já gravado, e alterar automaticamente
teria efeito fiscal sem confirmação explícita (mesma cautela pedida no prompt original).
