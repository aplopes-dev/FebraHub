# AGENTS.md — ERP · api

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre este módulo.
> Leia-o integralmente antes de qualquer ação. Ao modificar código neste módulo,
> atualize as seções relevantes deste arquivo na mesma operação. Nunca remova
> seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo                                | Valor                                                          |
| ------------------------------------- | --------------------------------------------------------------- |
| **Nome**                             | `apps/erp/api` · pacote `@citybox/erp-api`   |
| **Tipo**                             | API NestJS (backend) · Clean Architecture · **multi-empresa** |
| **Responsável**                      | Bruno Lopes — Aplopes Tecnologia                               |
| **Status**                           | 🟡 Em desenvolvimento — módulos **`tenancy`** (+ **consumidor de eventos da plataforma**, §9.1), **`store-setup`** (template de dados de sistema), **`catalog`**, **`stock`**, **`customers`** (clientes CRM + categorias; soft-delete/restore) , **`sales`** (pedidos de venda com baixa de estoque, §9), **`finance`** (contas bancárias + lançamentos, §9) e **`pos-terminals`** / **`pos-operators`** / **`pos-policies`** / **`pos-modules`** / **`pos-catalog`** / **`pos-customers`** / **`pos-payment-methods`** / **`pos-cash-sessions`** / **`pos-sales`** / **`pos-delivery`** (integração PDV↔ERP, §9) implementados |
| **Porta**                            | `3114`                                                          |
| **Última atualização deste arquivo** | 2026-08-20 (spec erp/031-os-conciliacao-clientes-correcoes — duas correções de backend. **D1**: `SaleOrderLine.productId` vira opcional (migration `sale_order_line_optional_product`) — OS com linha de serviço sem produto de catálogo agora gera venda de verdade (`generate-sale`/`extractServiceOrderSaleLines`), sem descartar a linha silenciosamente; consumidores da relação `product` corrigidos para `null` (`sales`, `nfe-issuance`, `pos-cash-sessions`). Migração revisada pelo `database-reviewer` antes de aplicar. **D2**: `POST .../create-entry` da Conciliação bancária ganha `customerId`/`supplierId` opcionais e mutuamente exclusivos, validados contra o cadastro real — antes só `partyName` (texto livre, sem vínculo). Ver §9 `Sales`/`Finance` e §12.) |
| **Última atualização deste arquivo** | 2026-08-16 (spec erp/029-pagamento-nfe-edicao-cliente-downloads — três frentes. **B1 (crítico)**: `IssueNfeUseCase` parava de mandar `tPag=99` fixo (`DEFAULT_PAYMENT_METHOD_CODE`, comentário desatualizado — o dado real já existia em `PaymentMethod.fiscalCode`, só nunca era consultado) — novo `resolvePayments(organizationId, payments)` resolve o `tPag` real de cada pagamento do `SaleOrder` via `PaymentMethodRepository.findByIds` (novo método no repositório), suporta **múltiplos pagamentos** (um `detPag` por pagamento, decisão do clarify — não consolida), e **bloqueia a emissão** (não emite 99 silencioso) com `FiscalApiEmissionError` nomeando a forma sem `fiscalCode` configurado, se algum pagamento usar uma forma sem código fiscal (decisão do clarify: bloquear, não cair em 99+xPag). `IssueNfeRequest.payments: FiscalApiNfePayment[]` novo no client HTTP; `xPag` só é preenchido quando o código resolvido é `99` (nome da forma de pagamento). **B3 (fiscalDocumentId)**: mesma classe de gap da spec 028 (`errorCode`/`errorMessage`) — a fiscal-api já devolvia `documentId` no corpo de sucesso de `POST /v1/nfe`/`POST /v1/nfse`, mas `NfeIssuance`/`NfseIssuance` nunca capturavam; migration `nfe_nfse_fiscal_document_id` adiciona `fiscal_document_id` (nullable) nos dois modelos, threading completo `HttpFiscalApiClient` → `IssueNfeResult`/`IssueNfseResult` → entidade → repositório → presenter — é o que o erp-web usa para montar a URL de download (`/v1/nfe/:fiscalDocumentId/xml`). **B3 (listagem)**: `ListSaleOrdersUseCase` passa a expor `nfeIssuance: {id, status, fiscalDocumentId} | null` por linha (`SaleOrderListItemDto`) — novo `NfeIssuanceRepository.findByIds`/`findBySaleOrderIds` (batch, evita N+1), consumido via `forwardRef()` **bidirecional** entre `SalesModule` e `NfeIssuanceModule` (molde `financial-entries.module.ts`↔`bank-reconciliation.module.ts` — dependência genuinamente circular: `NfeIssuanceModule` lê pedidos pra emitir, `SalesModule` agora lê `NfeIssuanceRepository` pra expor o vínculo na listagem); `NfeIssuanceModule` passa a exportar `NfeIssuanceRepository` além de `IssueNfeUseCase`. Anterior: spec erp/028-nfe-destinatario-e-feedback — dois módulos ganham `errorCode`/`errorMessage` (nullable) em `NfeIssuance`/`NfseIssuance` (migration `nfe_nfse_issuance_error_fields`): a fiscal-api **já devolvia** os dois no corpo de sucesso de `POST /v1/nfe`/`POST /v1/nfse` (mesmo presenter de `GET /v1/fiscal-documents`) — o erp-api os lia e descartava em `HttpFiscalApiClient` (`FiscalApiSuccessBody`); agora `IssueNfeResult`/`IssueNfseResult` os carregam, `IssueNfeUseCase`/`IssueNfseUseCase` os repassam para a entidade, e o presenter HTTP os expõe. Motivo: a tela de emissão anunciava toda `REJECTED` como `toast.success`, sem mostrar por quê — a correção de UI (erp-web) precisava desse dado na própria resposta do `POST /v1/{nfe,nfse}-issuances`, não só via `GET /v1/fiscal-documents` da fiscal-api (acoplamento maior, round-trip extra). Confirmado (não alterado): `indIEDest` fixo em `'9'` no `nfe-xml.builder.ts` da fiscal-api não é a causa do `719` (que é ausência total de `enderDest`, corrigido do lado erp-web — ver `apps/erp/web/AGENTS.md`) e continua aceitável para destinatário PJ sem IE informada nesta plataforma. Anterior: spec erp/027-destravar-emissao-vendas — hardening de `FISCAL_API_URL`: a variável sem o sufixo `/api` derrubava toda emissão de NF-e/NFS-e em produção com 404 silencioso, disfarçado de "Não foi possível resolver o Emitente fiscal da organização" — causa raiz era config (`.env.example`/`docker-compose.yml` de produção sem `/api`, divergente do default correto do código), não lógica de negócio. Correção: `normalizeFiscalApiUrl(raw, logger)` (nova, duplicada verbatim nos dois `http-fiscal-api-client.ts` — `nfse-issuance` e `nfe-issuance`, mesma justificativa ADR C-17 do token de serviço) — `trim()` + remove barra final + garante sufixo `/api`; entrada vazia/só espaço cai no default `http://127.0.0.1:3116/api` com `logger.warn('[FiscalConfig] ...')` (nunca falha o boot — decisão do `/speckit-clarify` da spec: um `FISCAL_API_URL` mal configurado não deve tirar a erp-api inteira do ar por um problema isolado à emissão fiscal). Testes novos (5 casos cada arquivo): falta sufixo, sufixo duplicado, barra final, vazio, só espaços em branco. `apps/erp/api/.env.example:53` e o `FISCAL_API_URL` do `erp-api` em `services/platform/docker-compose.yml` corrigidos para incluir `/api`. Anterior: spec erp/026-emissao-nfe-vendas — `modules/nfe-issuance` **novo**, molde 1:1 de `nfse-issuance`: liga um pedido de venda fechado (`SaleOrder`) à emissão real de NF-e, conectando pela primeira vez os 3 resolvedores fiscais já existentes e testados (`ResolveItemIcmsUseCase`/`ResolveItemPisCofinsUseCase`/`ResolveItemIpiUseCase`, `modules/fiscal-defaults` — antes só registrados em DI, nenhum caso de uso real os injetava). `ResolveSaleOrderItemsService` (novo) resolve os itens do pedido → `FiscalApiNfeItem[]` (cadeia produto→grupo→padrão da organização→fallback) e coleta `FallbackWarning[]` por item/tributo quando falta grupo — **não bloqueia a emissão** (decisão do clarify da spec), a tela mostra o aviso antes de confirmar. Entidade nova `NfeIssuance` (`nfe_issuances`, `TENANT_SCOPED_MODELS`) — único por `saleOrderId` (FK composta pra `SaleOrder`, `onDelete: Restrict`): é o mecanismo real de "nenhum pedido pode ter duas NF-e emitidas com sucesso", não um campo de status novo em `SaleOrder`. Rotas `v1/nfe-issuances`: `POST` emitir (`store.fiscal.issue`), `GET` listar (`org.view`), `GET /preview` (`org.view`, resolve os mesmos itens sem chamar a fiscal-api nem persistir — usado pela tela pra mostrar os avisos antes de confirmar). Reusa `fiscal-service-token.ts`/o padrão de `HttpFiscalApiClient` de `nfse-issuance` (import relativo dentro da mesma erp-api — não é pacote compartilhado, ADR C-17 continua intacta) e a mesma guarda de PRODUCTION da spec 025. **fiscal-api**: `POST /v1/nfe` ganhou `icmsAliquota`/`origem`/`pis`/`cofins`/`ipi` por item (ver `services/fiscal-api/AGENTS.md`) — sem isso a NF-e emitida por esta tela sairia com PIS/COFINS zerado e IPI ausente mesmo tendo grupo cadastrado. Testes: `issue-nfe.use-case.spec.ts` (7 casos: emissão com tudo configurado, fallback sem bloquear, recusa reemissão, recusa PRODUCTION antes de qualquer side effect, recusa sem Emitente, recusa pedido inexistente). Anterior: spec erp/025, P1+P2 — `modules/nfse-issuance`: token de serviço M2M próprio (`fiscal-service-token.ts`, cópia local por ADR C-17, substitui o `FISCAL_API_TOKEN`/fallback `dev-admin` antigo) + ambiente de emissão real do Emitente (`ResolvedFiscalCompany.defaultEnvironment`, bloqueia emissão em PRODUCTION antes de qualquer side effect) — ver §"Grupos de ISSQN + emissão de NFS-e". Anterior: spec erp/024, Parte A — `modules/operation-natures` ganha exclusão: `DELETE /v1/operation-natures/:id`, `DeleteOperationNatureUseCase` (hard delete, sem checagem de "em uso" — nenhuma FK externa aponta pra `OperationNature`, só as duas filhas com `onDelete: Cascade`), `OperationNatureRepository.deleteById`. Anterior: spec erp/023, N7 — `modules/fiscal-additional-info`: novo `GET /v1/fiscal-additional-infos/count` (declarado antes de `:id` no controller — rota estática precisa vir antes da paramétrica), `CountFiscalAdditionalInfosUseCase` + `FiscalAdditionalInfoRepository.countByDocumentType` (1 `groupBy`, mesmo padrão D2 de `fiscal-defaults`) — usado pelo card "Informações adicionais" no hub de Padrões fiscais (`apps/erp/web`). Anterior: spec erp/022, P3 — `modules/fiscal-defaults`: `GET /v1/fiscal-groups` vira listagem rica (`taxSituation`/`rate`/`productCount` por grupo, `ListFiscalGroupsUseCase` + `FiscalGroupRepository.countProductsByGroup`, 1 `groupBy` por tributo, sem N+1); `DELETE /v1/fiscal-{tributo}-groups/:id` novo nos 4 controllers, `DeleteFiscalGroupUseCase` compartilhado bloqueia (409) se o grupo tem produto vinculado ou é o padrão fiscal da org — frontend correspondente unificou as 4 telas de lista numa só (`apps/erp/web` `features/fiscal-groups`). Anterior: spec erp/020 — módulo `operation-natures` documentado: entidade agregada `OperationNature` (cfopRules+groupRules), tabela de CFOP estática, `ResolveOperationNatureUseCase`, CRUD `v1/operation-natures`, migration `operation_natures` — fecha a fila do Menu Fiscal, 11/11; código já existia acumulado desde o commit `989443cd0`, doc estava pendente) |
| **Última atualização deste arquivo** | 2026-08-16 (**auditoria do módulo Estoque — lotes crítico + alto**: escalação de privilégio em `fine-to-coarse`/`PermissionGuard`; inventário aceita saldo negativo; corrida no recebimento de compra; `linesTotalCents` exclui linha cancelada — ver §12). Anterior: 2026-08-16 (`catalog`: `availableOnErp`/`availableOnPdv`, `POST …/duplicate`, import XLSX, imagem de opção de variação). Anterior: 2026-08-16 (`pos-modules`: force `tables`/`tabs` → `disabled` até salão/comanda; catálogo configurável omite switches). Anterior: 2026-08-15 (`pos-delivery`: pago ≠ `delivered`; list/detail com `saleOrderId`/`paid`; checkout não avança Kanban). Anterior: 2026-08-15 (`pos-sales`/`pos-delivery`: checkout atômico + cancel reabre delivery + fulfillment na venda + unique parcial). Anterior: 2026-08-15 (`pos-delivery`: nested lines sem `organizationId` no create). Anterior: 2026-08-15 (`pos-delivery`: CRUD device, couriers, checkout/cancelamento vinculados e filtro de vendas por canal). Anterior: 2026-08-15 (SessionSale HTTP: `operatorName` + `methodId`/`methodSystemKey` nos payments). Anterior: 2026-08-15 (pareamento PDV: branding do redeem em `runWithoutTenantScope` **antes** de consumir o código; 8 migrations fiscais pendentes aplicadas via `db:migrate:deploy`). |
| **Última atualização deste arquivo** | 2026-08-16 (spec erp/030-proxy-documentos-pagamento-real — três defeitos achados em teste manual logo após o deploy da 029. **B1 (causa raiz real de "Facilita NF-e não carrega")**: não era o proxy do erp-web — `HttpFiscalApiAdapter` (`modules/fiscal/infrastructure/http-fiscal-api.adapter.ts`) mandava `companyId` só como header `X-Company-Id` para `listDocuments`/`getSummary`, mas `GET /v1/fiscal-documents[/summary]` na fiscal-api exige `companyId` como **query param** (`@Query`, 400 sem ele) — toda chamada falhava, virava 503 no erp-api, "Não foi possível carregar" no erp-web. Corrigido: `companyId` vai também via `URLSearchParams`. **Segundo bug, dormente atrás do primeiro**: mesmo corrigido o param, `FiscalDocumentsPage`/`FiscalDocumentsSummary` (`domain/providers/fiscal-api.provider.ts`) tinham a forma errada (`{items, meta}`/`{...,canceled}`) — a fiscal-api sempre devolveu `{data, meta}`/`{data:{...,cancelled}}` (grafia com "ll"), e a rota do erp-api repassa o retorno do adapter **verbatim** pro erp-web, que já espera exatamente o envelope que a fiscal-api produz. Corrigidos os dois tipos pra espelhar a resposta real — sem remapeamento, só a correção do contrato declarado. Zero teste cobria esse módulo antes (`http-fiscal-api.adapter.spec.ts`, novo). **B2 (pagamento real)**: `PaymentMethodPresenter.toHttp` passa a expor `systemKey` (só existia internamente, protegendo formas de sistema) — o frontend precisa dele pra derivar `cardPaymentType` sem catálogo mock (ver `apps/erp/web/AGENTS.md`). Backfill de dado via **script** (não migration — `apps/erp/api/AGENTS.md` §5.9 proíbe `.sql` escrito à mão em `prisma/migrations/`; a primeira versão desta entrega tentou uma migration só-de-dado e o database-review bloqueou, citando o precedente de `scripts/backfill-financial-*.ts`), novo `scripts/backfill-sale-order-payment-method-ids.ts` + `pnpm --filter @citybox/erp-api db:backfill:sale-order-payment-method-ids` — `sale_order_payments.method_id` gravado com ids do catálogo mock antigo (`pm-dinheiro` etc., sem FK — nada travava a gravação errada) é resolvido para o UUID real de `payment_methods` pelo par `(organizationId, systemKey)` (`@@unique`, sem ambiguidade possível), ignorando formas excluídas (`deletedAt != null`); `pm-cartao-credito` (mock) mapeia pro `systemKey` `pm-cartao` (a forma real de crédito tem esse `systemKey`, não `pm-cartao-credito`); `pm-transferencia` (mock, sem forma de sistema correspondente) fica de fora, permanece como está. Idempotente por construção. Lógica pura exportada (`backfillSaleOrderPaymentMethodIds`) separada do `main()` CLI para ser testável sem subir `NestApplicationContext` — teste em `src/modules/sales/infrastructure/database/backfill-sale-order-payment-method-ids.spec.ts` (jest só descobre specs sob `src/`, por isso o teste mora lá e importa o script por caminho relativo) cobre isolamento entre organizações (mesmo `systemKey`, organizações diferentes nunca se cruzam) e exclusão de forma soft-deleted, além do caminho feliz e idempotência (rodar 2x não muda nada). `IssueNfeUseCase.resolvePayments` distingue "método não encontrado" (mensagem nova: forma não está mais cadastrada, edite o pedido) de "método encontrado sem `fiscalCode`" (mensagem já existente da 029) — a mensagem única anterior induzia a "configurar" uma forma que já estava correta quando a causa real era um `methodId` órfão. **B3**: bug era 100% `services/fiscal-api`, sem mudança aqui — ver `services/fiscal-api/AGENTS.md`. Anterior: spec erp/029-pagamento-nfe-edicao-cliente-downloads — três frentes. **B1 (crítico)**: `IssueNfeUseCase` parava de mandar `tPag=99` fixo (`DEFAULT_PAYMENT_METHOD_CODE`, comentário desatualizado — o dado real já existia em `PaymentMethod.fiscalCode`, só nunca era consultado) — novo `resolvePayments(organizationId, payments)` resolve o `tPag` real de cada pagamento do `SaleOrder` via `PaymentMethodRepository.findByIds` (novo método no repositório), suporta **múltiplos pagamentos** (um `detPag` por pagamento, decisão do clarify — não consolida), e **bloqueia a emissão** (não emite 99 silencioso) com `FiscalApiEmissionError` nomeando a forma sem `fiscalCode` configurado, se algum pagamento usar uma forma sem código fiscal (decisão do clarify: bloquear, não cair em 99+xPag). `IssueNfeRequest.payments: FiscalApiNfePayment[]` novo no client HTTP; `xPag` só é preenchido quando o código resolvido é `99` (nome da forma de pagamento). **B3 (fiscalDocumentId)**: mesma classe de gap da spec 028 (`errorCode`/`errorMessage`) — a fiscal-api já devolvia `documentId` no corpo de sucesso de `POST /v1/nfe`/`POST /v1/nfse`, mas `NfeIssuance`/`NfseIssuance` nunca capturavam; migration `nfe_nfse_fiscal_document_id` adiciona `fiscal_document_id` (nullable) nos dois modelos, threading completo `HttpFiscalApiClient` → `IssueNfeResult`/`IssueNfseResult` → entidade → repositório → presenter — é o que o erp-web usa para montar a URL de download (`/v1/nfe/:fiscalDocumentId/xml`). **B3 (listagem)**: `ListSaleOrdersUseCase` passa a expor `nfeIssuance: {id, status, fiscalDocumentId} | null` por linha (`SaleOrderListItemDto`) — novo `NfeIssuanceRepository.findByIds`/`findBySaleOrderIds` (batch, evita N+1), consumido via `forwardRef()` **bidirecional** entre `SalesModule` e `NfeIssuanceModule` (molde `financial-entries.module.ts`↔`bank-reconciliation.module.ts` — dependência genuinamente circular: `NfeIssuanceModule` lê pedidos pra emitir, `SalesModule` agora lê `NfeIssuanceRepository` pra expor o vínculo na listagem); `NfeIssuanceModule` passa a exportar `NfeIssuanceRepository` além de `IssueNfeUseCase`. Anterior: spec erp/028-nfe-destinatario-e-feedback — dois módulos ganham `errorCode`/`errorMessage` (nullable) em `NfeIssuance`/`NfseIssuance` (migration `nfe_nfse_issuance_error_fields`): a fiscal-api **já devolvia** os dois no corpo de sucesso de `POST /v1/nfe`/`POST /v1/nfse` (mesmo presenter de `GET /v1/fiscal-documents`) — o erp-api os lia e descartava em `HttpFiscalApiClient` (`FiscalApiSuccessBody`); agora `IssueNfeResult`/`IssueNfseResult` os carregam, `IssueNfeUseCase`/`IssueNfseUseCase` os repassam para a entidade, e o presenter HTTP os expõe. Motivo: a tela de emissão anunciava toda `REJECTED` como `toast.success`, sem mostrar por quê — a correção de UI (erp-web) precisava desse dado na própria resposta do `POST /v1/{nfe,nfse}-issuances`, não só via `GET /v1/fiscal-documents` da fiscal-api (acoplamento maior, round-trip extra). Confirmado (não alterado): `indIEDest` fixo em `'9'` no `nfe-xml.builder.ts` da fiscal-api não é a causa do `719` (que é ausência total de `enderDest`, corrigido do lado erp-web — ver `apps/erp/web/AGENTS.md`) e continua aceitável para destinatário PJ sem IE informada nesta plataforma. Anterior: spec erp/027-destravar-emissao-vendas — hardening de `FISCAL_API_URL`: a variável sem o sufixo `/api` derrubava toda emissão de NF-e/NFS-e em produção com 404 silencioso, disfarçado de "Não foi possível resolver o Emitente fiscal da organização" — causa raiz era config (`.env.example`/`docker-compose.yml` de produção sem `/api`, divergente do default correto do código), não lógica de negócio. Correção: `normalizeFiscalApiUrl(raw, logger)` (nova, duplicada verbatim nos dois `http-fiscal-api-client.ts` — `nfse-issuance` e `nfe-issuance`, mesma justificativa ADR C-17 do token de serviço) — `trim()` + remove barra final + garante sufixo `/api`; entrada vazia/só espaço cai no default `http://127.0.0.1:3116/api` com `logger.warn('[FiscalConfig] ...')` (nunca falha o boot — decisão do `/speckit-clarify` da spec: um `FISCAL_API_URL` mal configurado não deve tirar a erp-api inteira do ar por um problema isolado à emissão fiscal). Testes novos (5 casos cada arquivo): falta sufixo, sufixo duplicado, barra final, vazio, só espaços em branco. `apps/erp/api/.env.example:53` e o `FISCAL_API_URL` do `erp-api` em `services/platform/docker-compose.yml` corrigidos para incluir `/api`. Anterior: spec erp/026-emissao-nfe-vendas — `modules/nfe-issuance` **novo**, molde 1:1 de `nfse-issuance`: liga um pedido de venda fechado (`SaleOrder`) à emissão real de NF-e, conectando pela primeira vez os 3 resolvedores fiscais já existentes e testados (`ResolveItemIcmsUseCase`/`ResolveItemPisCofinsUseCase`/`ResolveItemIpiUseCase`, `modules/fiscal-defaults` — antes só registrados em DI, nenhum caso de uso real os injetava). `ResolveSaleOrderItemsService` (novo) resolve os itens do pedido → `FiscalApiNfeItem[]` (cadeia produto→grupo→padrão da organização→fallback) e coleta `FallbackWarning[]` por item/tributo quando falta grupo — **não bloqueia a emissão** (decisão do clarify da spec), a tela mostra o aviso antes de confirmar. Entidade nova `NfeIssuance` (`nfe_issuances`, `TENANT_SCOPED_MODELS`) — único por `saleOrderId` (FK composta pra `SaleOrder`, `onDelete: Restrict`): é o mecanismo real de "nenhum pedido pode ter duas NF-e emitidas com sucesso", não um campo de status novo em `SaleOrder`. Rotas `v1/nfe-issuances`: `POST` emitir (`store.fiscal.issue`), `GET` listar (`org.view`), `GET /preview` (`org.view`, resolve os mesmos itens sem chamar a fiscal-api nem persistir — usado pela tela pra mostrar os avisos antes de confirmar). Reusa `fiscal-service-token.ts`/o padrão de `HttpFiscalApiClient` de `nfse-issuance` (import relativo dentro da mesma erp-api — não é pacote compartilhado, ADR C-17 continua intacta) e a mesma guarda de PRODUCTION da spec 025. **fiscal-api**: `POST /v1/nfe` ganhou `icmsAliquota`/`origem`/`pis`/`cofins`/`ipi` por item (ver `services/fiscal-api/AGENTS.md`) — sem isso a NF-e emitida por esta tela sairia com PIS/COFINS zerado e IPI ausente mesmo tendo grupo cadastrado. Testes: `issue-nfe.use-case.spec.ts` (7 casos: emissão com tudo configurado, fallback sem bloquear, recusa reemissão, recusa PRODUCTION antes de qualquer side effect, recusa sem Emitente, recusa pedido inexistente). Anterior: spec erp/025, P1+P2 — `modules/nfse-issuance`: token de serviço M2M próprio (`fiscal-service-token.ts`, cópia local por ADR C-17, substitui o `FISCAL_API_TOKEN`/fallback `dev-admin` antigo) + ambiente de emissão real do Emitente (`ResolvedFiscalCompany.defaultEnvironment`, bloqueia emissão em PRODUCTION antes de qualquer side effect) — ver §"Grupos de ISSQN + emissão de NFS-e". Anterior: spec erp/024, Parte A — `modules/operation-natures` ganha exclusão: `DELETE /v1/operation-natures/:id`, `DeleteOperationNatureUseCase` (hard delete, sem checagem de "em uso" — nenhuma FK externa aponta pra `OperationNature`, só as duas filhas com `onDelete: Cascade`), `OperationNatureRepository.deleteById`. Anterior: spec erp/023, N7 — `modules/fiscal-additional-info`: novo `GET /v1/fiscal-additional-infos/count` (declarado antes de `:id` no controller — rota estática precisa vir antes da paramétrica), `CountFiscalAdditionalInfosUseCase` + `FiscalAdditionalInfoRepository.countByDocumentType` (1 `groupBy`, mesmo padrão D2 de `fiscal-defaults`) — usado pelo card "Informações adicionais" no hub de Padrões fiscais (`apps/erp/web`). Anterior: spec erp/022, P3 — `modules/fiscal-defaults`: `GET /v1/fiscal-groups` vira listagem rica (`taxSituation`/`rate`/`productCount` por grupo, `ListFiscalGroupsUseCase` + `FiscalGroupRepository.countProductsByGroup`, 1 `groupBy` por tributo, sem N+1); `DELETE /v1/fiscal-{tributo}-groups/:id` novo nos 4 controllers, `DeleteFiscalGroupUseCase` compartilhado bloqueia (409) se o grupo tem produto vinculado ou é o padrão fiscal da org — frontend correspondente unificou as 4 telas de lista numa só (`apps/erp/web` `features/fiscal-groups`). Anterior: spec erp/020 — módulo `operation-natures` documentado: entidade agregada `OperationNature` (cfopRules+groupRules), tabela de CFOP estática, `ResolveOperationNatureUseCase`, CRUD `v1/operation-natures`, migration `operation_natures` — fecha a fila do Menu Fiscal, 11/11; código já existia acumulado desde o commit `989443cd0`, doc estava pendente) |

**Propósito em uma linha:**
Backend do backoffice de **comércio** (`@citybox/erp-web`) — API
**multi-empresa** que expõe **`tenancy`** (organizações, unidades e equipe),
**`catalog`** (produtos da empresa, com vínculo por unidade, + cadastros de
apoio + **listas de preço**), **`stock`** (depósitos + categorias + ledger de
movimentações/saldo + inventário + transferências + **compras** + fornecedores + transportadoras),
**`customers`** (clientes CRM + categorias), **`sales`** (pedidos de venda,
que fecham gerando saída de estoque; + submódulos finos para OS, contratos e
promoções) e **`finance`** (contas bancárias + lançamentos a pagar/receber, em
Clean Architecture). Toda organização nova recebe automaticamente os **dados de
sistema** (`store-setup` / `ERP_SEED_TEMPLATE`: unidades, estoque, categorias de
movimentação, finanças, status) marcados com `isSystem`/`systemKey` — não
excluíveis.

> **Referência arquitetural:** este scaffold replica deliberadamente o padrão de
> [`apps/verticals/food/api`](../../verticals/food/AGENTS.md) (Clean Architecture,
> Prisma 7, guards Keycloak, Zod + class-validator). Onde este doc for omisso,
> consulte o AGENTS.md da food — a intenção é manter os dois em paridade de padrão.

---

## 2. Posição no Monorepo

```
citybox/
├── apps/
│   └── erp/
│       ├── web/                  ← @citybox/erp-web (frontend, :3107)
│       └── api/                  ← VOCÊ ESTÁ AQUI (@citybox/erp-api · :3114)
├── packages/
└── AGENTS.md
```

**Depende de (infra externa):**
- **PostgreSQL** — banco `citybox_platform`, **schema `erp`** (via `DATABASE_URL`).
- **Keycloak** — verificação de JWT do realm **próprio** `citybox-erp` (ADR C-16: um realm por sistema) **e Admin API** para cadastrar membros com senha provisória (§5.10), autenticando com o service account `erp-provisioning`. Em dev usa-se `AUTH_DEV_BYPASS=true` + `Bearer dev-admin` (exige `NODE_ENV` de dev — §5.3).
- **RabbitMQ** — desde a Fase 11 do ADR PLAT-001 (§9.1): a API consome `citybox.store.*` do `platform-api` na fila `erp-comercio.store-setup` e devolve os callbacks `citybox.provisioning.*`. **Opcional para a API subir** — sem `RABBITMQ_URL` o HTTP funciona igual e só o provisionamento automático deixa de acontecer.

**Consumido por:**
- `apps/erp/web` — **Produtos**, **Categorias**, **Unidade de medida**, **Listas de preço**, **Fornecedores** e **Estoque (cadastro de depósitos)** consomem a API via proxy `/api/proxy/comercio`. Demais features de estoque (balanço/movimentações/…) e outras áreas seguem mock (ver `web/AGENTS.md`).

> **Arquitetura idêntica à `apps/verticals/food/api`** (Clean Architecture, Prisma 7,
> guards Keycloak). ~~Principal diferença hoje: sem worker/RabbitMQ e sem object
> storage~~ — **superado**: o object storage (MinIO) entrou em 2026-07-27 e o
> consumidor RabbitMQ em 2026-07-30 (§9.1). Não há processo worker separado: o
> consumidor sobe no mesmo processo da API (`OnApplicationBootstrap`), diferente
> da `clinica-api`, que tem `main-worker` próprio.

---

## 3. Stack e Versões

| Tecnologia       | Versão    | Observação                                            |
| ---------------- | --------- | ----------------------------------------------------- |
| pnpm              | workspace | **Package manager do monorepo** — nunca npm/yarn      |
| TypeScript       | ~5.7.3    |                                                       |
| NestJS           | 11.x (`catalog:`) | versões fixadas via `pnpm catalog`           |
| Prisma           | 7.8.0     | generator `prisma-client` → `generated/prisma/`; adapter `@prisma/adapter-pg` + `pg` Pool |
| PostgreSQL       | —         | **schema `erp`** (banco `citybox_platform`) — tenancy + catálogo + `Supplier*` + **`Stock`/`StockBranch`** |
| Zod              | ^4.4.3    | validação de domínio (`error.issues`, nunca `error.errors`) |
| class-validator / class-transformer | ^0.14.1 / ^0.5.1 | DTOs HTTP + `ValidationPipe` global  |
| jose             | ^5.9.6    | verificação de JWT do Keycloak                        |
| Swagger          | catalog   | UI em `/api/v1/docs`                                   |
| Jest + ts-jest   | 30.x      | testes `*.spec.ts` com repositórios in-memory (426 testes) |

---

## 4. Estrutura de Pastas

**Clean Architecture / Hexagonal por módulo** (domain / application /
infrastructure), igual à `food/api`. Módulos de negócio: **`tenancy`**,
**`store-setup`**, **`catalog`**, **`stock`**, **`customers`**, **`sales`**,
**`finance`**, **`pos-terminals`**, **`pos-operators`** e **`pos-policies`**.

```
apps/erp/api/
├── src/
│   ├── main.ts                   ← ValidationPipe, prefixo "api", Swagger, porta 3114
│   ├── app.module.ts             ← PrismaModule + TenancyModule + CatalogModule + StockModule + CustomersModule + SalesModule + FinanceModule + PosTerminalsModule + 3 guards (auth → tenant → permission) + filtro + middleware de contexto
│   ├── modules/
│   │   ├── tenancy/              ← ORGANIZAÇÕES + unidades (branches) + membros (ver §5.10 e §9)
│   │   │   └── infrastructure/messaging/  ← consumidor `citybox.store.*` + dedupe de evento (§9.1)
│   │   ├── store-setup/          ← TEMPLATE de dados de sistema (`ERP_SEED_TEMPLATE` + `ProvisionOrganizationDataUseCase`)
│   │   ├── catalog/              ← PRODUTOS + categorias + UoM + variações + price-lists + fiscal-parameters + technical-sheets + product-addons (adicionais/sugestões) (ver §9)
│   │   ├── stock/                ← DEPÓSITOS + categorias + ledger (movimentações/balanço) + suppliers + carriers — ver §9
│   │   │   ├── suppliers/        ← FORNECEDORES (organization-scoped, soft-delete + restore)
│   │   │   └── carriers/         ← TRANSPORTADORAS (organization-scoped, soft-delete + restore — réplica de suppliers)
│   │   ├── customers/            ← CLIENTES CRM + categorias (organization-scoped, soft-delete + restore) — ver §9
│   │   │   └── customer-categories/ ← CATEGORIAS de cliente (hard delete; 409 se em uso)
│   │   ├── sales/                ← PEDIDOS DE VENDA (Clean Architecture, integrado ao estoque) — ver §9
│   │   │   ├── service-orders/   ← ordens de serviço (submódulo fino direto sobre Prisma — fases 5-8)
│   │   │   ├── sales-contracts/  ← contratos de venda + parcelas (submódulo fino — fases 5-8)
│   │   │   └── promotions/       ← promoções (submódulo fino — fases 5-8)
│   │   ├── finance/              ← FINANÇAS — cada submódulo em Clean Architecture completa; ver §9
│   │   │   ├── cost-centers/     ← CENTROS DE CUSTO (nome único, soft-delete + restore; `isSystem` não removível)
│   │   │   ├── payment-methods/  ← FORMAS DE PAGAMENTO (nome único, soft-delete + restore; `isSystem` não editável nem removível; 409 se em uso em pagamento)
│   │   │   ├── financial-groups/ ← GRUPOS FINANCEIROS (receita/despesa; 409 se plano em uso; `isSystem` não removível)
│   │   │   ├── chart-of-accounts/← PLANO DE CONTAS (FK para grupo; soft-delete + restore; `isSystem` não removível)
│   │   │   ├── card-contracts/   ← CONTRATOS DE CARTÃO + métodos + faixas progressivas
│   │   │   ├── bank-accounts/    ← CONTAS BANCÁRIAS (organization-scoped, soft-delete + restore)
│   │   │   └── financial-entries/ ← LANÇAMENTOS a pagar/receber (soft-delete + restore; valida a conta bancária)
│   │   ├── pos-terminals/        ← TERMINAIS de PDV (organization+branch-scoped, soft-delete sem restore) + código de pareamento — ver §9
│   │   ├── pos-operators/        ← DEVICE only (`v1/pos/operators*`): auth/list/sync via Membership + PIN — ver §9
│   │   ├── pos-policies/         ← ALÇADAS do PDV (organization-scoped, **uma por organização**) — ver §9
│   │   ├── pos-modules/          ← MÓDULOS do PDV por terminal (defaults org + overrides) — ver §9 / histórico
│   │   ├── pos-catalog/          ← SNAPSHOT de catálogo para o terminal (`GET v1/pos/catalog`) — ver §9
│   │   ├── pos-customers/        ← CLIENTES do terminal (`GET/POST v1/pos/customers*`) — ver §9
│   │   ├── pos-payment-methods/  ← FORMAS DE PAGAMENTO ativas (`GET v1/pos/payment-methods`) — ver §9
│   │   ├── pos-sales/            ← CHECKOUT Device (`POST v1/pos/sales` → SaleOrder closed) — ver §9
│   │   └── _example/             ← MOLDE de pastas (arquivos `*.gitkeep`, não é módulo real) — ver src/modules/_example/README.md e §4.1
│   └── shared/                   ← NÚCLEO + INFRA TRANSVERSAL
│       ├── core/                 ← entity.ts, use-case.interface.ts, errors/*, types/optional.type.ts, utils/{zod-utils,document}.ts (independe de framework)
│       ├── domain/
│       │   └── validators/validator.interface.ts
│       └── infra/
│           ├── prisma/           ← PrismaModule (global) + PrismaService (adapter-pg) + tenant-scope.extension (filtro global)
│           ├── keycloak/         ← keycloak-jwt (JWKS) + keycloak-admin.service (Admin API) + provisional-password
│           ├── tenancy/          ← tenant-context (ALS) + guard + middleware + errors — a espinha multi-empresa (§5.10)
│           └── http/
│               ├── guards/        ← auth.guard (JWT/dev-bypass) + permission.guard
│               ├── decorators/    ← @Public, @RequirePermission, @CurrentUser, @SkipTenant, @OrganizationId, @BranchId, @Tenant, @Actor
│               ├── filters/app-exception.filter.ts  (AppError → HTTP status pelo nome)
│               ├── auth/authenticated-user.ts
│               └── health.controller.ts            ← GET /api/health (público)
├── prisma/
│   ├── schema.prisma             ← datasource (schema "erp") + models de tenancy, catálogo, vínculos e fornecedores
│   ├── migrations/               ← geradas SÓ por `db:migrate:dev` (§5.9)
│   └── seed.ts                   ← organização + unidades + responsável + `applyErpSeedTemplate` + catálogo/demo
├── scripts/
│   └── provision-organizations.ts ← reprovisiona template em orgs existentes (`pnpm provision:orgs [-- --force]`)
├── generated/prisma/             ← CLIENTE PRISMA GERADO (não editar à mão; gitignored — rodar db:generate)
├── package.json · prisma.config.ts · nest-cli.json · tsconfig*.json · eslint.config.mjs
├── .env.example · .env (local, gitignored)
└── AGENTS.md ← ESTE ARQUIVO
```

### 4.1 Anatomia de um módulo (mesmo padrão da `food/api`)
```
modules/<modulo>/
├── <modulo>.module.ts            ← liga controllers (rotas), use cases e repositórios (DI por TOKEN abstrato → impl Prisma)
├── domain/        entities/ · repositories/<x>.repository.interface.ts (token, abstract class) · validators/*.zod.validator.ts · factories/ · errors/
├── application/   use-cases/<acao>/<acao>.use-case.ts (implements IUseCase) + .spec.ts · dtos/ · types/
├── infrastructure/database/prisma-<x>.repository.ts · http/routes/<acao>/{<acao>.route.ts,<acao>.dto.ts} · http/routes/shared/*.presenter.ts
└── tests/         in-memory-<x>.repository.ts (fake p/ unit, implementa a mesma interface abstrata)
```

Duas referências, use as duas:
- **`src/modules/_example/`** (neste repo) — o mesmo esqueleto acima já existe fisicamente em disco, com um arquivo `*.gitkeep` por camada nomeado como o arquivo real seria (ex.: `example.entity.ts.gitkeep`). Copie a árvore, renomeie e apague os `.gitkeep`. Não é código de verdade — ver `src/modules/_example/README.md`.
- **`src/modules/tenancy/`** (neste repo) — módulo real mais recente e a referência a copiar em módulo novo: 4 entidades, 14 use cases, 4 repositórios Prisma, 14 rotas **organization-scoped**, porta para provedor de identidade (`IdentityProvider`) e fakes in-memory.
- **`src/modules/catalog/`** (neste repo) — módulo real completo, porém ainda **store-scoped** (§5.4): 3 entidades, 12 use cases com testes, 3 repositórios Prisma, 12 rotas.
- **`apps/verticals/food/api/src/modules/store-profile/`** — exemplo mínimo da food (inclui upload de imagem, que o catalog ainda não tem).

---

## 5. Restrições Críticas

> ⚠️ Estas restrições causam erros em build/runtime ou quebram a arquitetura se ignoradas.

### 5.1 Package Manager
```
SEMPRE: pnpm --filter @citybox/erp-api <script>
NUNCA:  npm install / yarn add
```

### 5.2 Prisma — cliente gerado em `generated/prisma/`, schema `erp`
```ts
import { PrismaClient } from '...generated/prisma/client';   // NÃO de "@prisma/client"
// Models devem usar @@schema("erp") + @@map("snake_case"). Banco: citybox_platform.
// Cliente em generated/prisma/ (gitignored). Após mudar schema: pnpm --filter @citybox/erp-api db:generate
```

### 5.3 Guards GLOBAIS (Keycloak) já ligados, mesmo sem rota de negócio
```ts
// AuthGuard (JWT Keycloak via JWKS) + PermissionGuard rodam em TODA rota nova.
@Public()                                    // libera (ex.: health)
@RequirePermission('store.settings.manage')  // permissões em shared/infra/http/decorators/permissions.ts
// Dev: AUTH_DEV_BYPASS=true + "Bearer dev-admin" — já no .env local.
```

**O bypass exige `NODE_ENV` explícito** (`development`, `test` ou `local`). A
checagem é allow-list, não `!== 'production'`: sem `NODE_ENV` definido — bare
`node dist/main`, PaaS que não injeta a variável — um teste de negação liberaria
o bypass justamente onde ele é mais perigoso. O token é fixo e concede
`platform.admin`, que entra em **qualquer** organização. Se `AUTH_DEV_BYPASS=true`
aparecer com `NODE_ENV` ausente ou de produção, a API **não sobe**
(`assertDevBypassIsSafe` em `main.ts`).

O bypass é avaliado **antes** da verificação do token, nunca como fallback de
erro: um JWT inválido não pode cair no bypass (ADR C-17, bloco 3).

### 5.3.1 Realm próprio: `citybox-erp` (ADR C-16 / C-17)

Desde 2026-08-13 o ERP **não compartilha realm com nenhum outro sistema**. O
realm compartilhado `citybox-dev` e o client `citybox-backoffice` — que servia
quatro apps ao mesmo tempo — deixaram de existir. Realm isola **identidade**
(unicidade de e-mail), **sessão SSO** e **escopo de service account**; client
isola só a aplicação, e por isso não resolvia nenhum dos três defeitos que
motivaram a mudança (ver ADR C-16, §Os três defeitos).

| Peça | Valor | Arquivo |
|---|---|---|
| Realm | `citybox-erp` | `infra/keycloak/import/citybox-erp-realm.json` |
| Client web | `erp-web` (confidencial + PKCE) | `apps/erp/web` |
| Service account de provisionamento | `erp-provisioning` | `KeycloakAdminService` |
| Chamador M2M do admin | `admin-m2m` (realm role `platform.admin`) | `admin-api` |

O que o `AuthGuard` (`shared/infra/http/guards/auth.guard.ts`) faz, nesta ordem:

1. rota `@Public()` passa direto;
2. **dev bypass** (`Bearer dev-admin`), *antes* da verificação — nunca como
   fallback de erro;
3. `verifyKeycloakJwt` com **issuer único** vindo de `KEYCLOAK_ISSUER`
   (`shared/infra/keycloak/keycloak-jwt.ts`);
4. **`azp` na allow-list** de `KEYCLOAK_ALLOWED_AZP` (`erp-web,admin-m2m`) —
   token de outro client do mesmo realm não passa;
5. `authenticatedUserFromJwtPayload(payload, { clientId: KEYCLOAK_CLIENT_ID })`.

> **Por que `azp` e não `aud`:** o Keycloak só coloca o client em `aud` quando há
> um *audience mapper*; por padrão `aud` é `account`. Validar `aud` sem mapper
> rejeitaria todo token válido. `azp` carrega sempre o `client_id` que pediu o
> token.

**Papéis do Keycloak sumiram quase por completo.** Não existem mais
`store_staff`, `vertical.comercio.view` nem a realm role global de plataforma:
**estar no realm já é o gate de acesso**. Sobrou uma única role, `platform.admin`
(`PLATFORM_ADMIN_ROLE` em `shared/infra/http/decorators/permissions.ts`),
**local ao realm** e atribuída exclusivamente ao service account `admin-m2m`.
A consequência prática: `resolvePermissions` virou uma regra só — *role com
ponto é o próprio nome da permissão* — e `IdentityProvider` perdeu
`ensureComercioBackofficeAccess()`. A autorização do lojista continua onde
sempre esteve: `Membership` + `PermissionProfile` no schema `erp` (§5.10).

O molde canônico destes arquivos está em
`packages/docs/platform/ADR-C-17-padrao-auth-tenancy.md` (blocos 1 a 6) — não há
pacote compartilhado de auth, então **divergir dele é dívida invisível**.

### 5.4 Escopo: organização, e vínculo por unidade

Todo módulo é **organization-scoped**. Não existe mais `X-Store-Id` nem o
decorator `@StoreId` — foram removidos com a migração do catálogo.

```ts
async handle(@OrganizationId() organizationId: string, @Body() dto: …) { … }
// quando a rota precisa do papel ou da unidade ativa:
async handle(@Tenant() tenant: TenantContext, …) { … }
```

**Produto pertence à empresa e opera em N unidades** (`ProductBranch`). Um
produto sem vínculo existe no cadastro mas não aparece em filial nenhuma — é o
estado de um item recém-criado ou descontinuado. O mesmo vale para fornecedor
(`SupplierBranch`).

A listagem de produtos recorta pela unidade quando o header `X-Branch-Id` vem
na requisição, ou pela query `?branchId=`. Sem nenhum dos dois, devolve o
catálogo da empresa inteira.

**SKU é único na empresa**, não por unidade: o produto é da organização e um SKU
identifica um item em toda a rede.

### 5.5 Camadas só "para dentro" + controllers finos
```
infrastructure → application → domain     (nunca o inverso)
```
- `domain`/`application` não importam NestJS/Prisma/Express.
- Use cases dependem da **interface** (abstract class) do repositório, nunca da impl Prisma.
- `*.route.ts` só faz: ler `@OrganizationId`/`@Tenant`/DTO → chamar use case → presenter.

### 5.6 Erros: hierarquia AppError + filtro por nome
```ts
// Lançar subclasses de AppError (Domain/Application/Infrastructure/ValidatorDomain) com
// { internalMessage, externalMessage, context }. O AppExceptionFilter mapeia o HTTP status
// pelo SUFIXO do nome: *NotFound→404 · *Taken/*Duplicate→409 · *Forbidden→403 ·
// *Unauthorized→401 · *Unavailable→503 · ValidatorDomainError→422 · resto DomainError→422.
```

### 5.7 Validação dupla (não escolher uma só)
```
class-validator  → DTOs HTTP (ValidationPipe global em main.ts)
Zod              → validação de domínio, dentro da entidade via *.zod.validator.ts + factory
```

### 5.8 `start:prod` — confirmar o caminho de saída do build antes de usar em deploy
```
tsconfig/nest-cli são idênticos aos da food/api, que emite em dist/src/ (não dist/).
package.json já assume node dist/src/main — reconfirme com `pnpm build` após o
primeiro módulo real (esta linha foi escrita antes de haver deploy configurado).
```

### 5.9 Migrations: **SEMPRE pelo comando do Prisma — nunca escrever SQL à mão**
```bash
# ÚNICA forma correta de criar uma migration:
pnpm --filter @citybox/erp-api db:migrate:dev     # prisma migrate dev --name <nome>

# PROIBIDO: criar/editar arquivos .sql em prisma/migrations/ manualmente,
# ou inventar uma pasta de migration na mão.
```
O fluxo é sempre: **editar `prisma/schema.prisma` → rodar `db:migrate:dev` → o Prisma
gera o SQL e aplica**. Migration escrita à mão sai de sincronia com o schema, quebra o
`migrate status`/`migrate deploy` e não sobrevive a um `migrate reset`.

Se precisar de algo que o Prisma não modela (extensão, função, trigger), leve à
discussão antes — não contorne com SQL manual.

### 5.10 Multi-empresa: **Keycloak autentica, o ERP autoriza**

A hierarquia é **Organization → Branch**. A regra que orienta tudo:

```
Keycloak  → AUTENTICAÇÃO: quem é a pessoa (credencial, token, MFA). Nada de negócio.
Banco erp → AUTORIZAÇÃO: em qual organização ela está, com que papel e em quais unidades.
```

Não crie roles/grupos no Keycloak para representar papel de ERP. O mesmo usuário
pode ser `OWNER` numa organização e `MEMBER` em outra — modelar isso no Keycloak
vira um pesadelo de manutenção. Quem decide é a tabela `memberships`.

**As três camadas, e o arquivo de cada uma:**

| Camada | Arquivo | O que faz |
| ------ | ------- | --------- |
| Interceptação | `shared/infra/tenancy/tenant-context.guard.ts` | Valida o JWT (via `AuthGuard`), resolve o `User` local pelo `sub` — criando *just-in-time* no primeiro acesso —, lê `X-Organization-Id`, confere `Membership` ativa e carrega o `BranchAccess` |
| Contexto | `shared/infra/tenancy/tenant-context.ts` | `AsyncLocalStorage` que carrega organização, papel e unidades pela requisição inteira, sem passar `organizationId` de mão em mão |
| Acesso a dados | `shared/infra/prisma/tenant-scope.extension.ts` | Injeta `organizationId` no `where`/`data` de toda query dos models da allowlist |

```ts
// Headers das rotas de negócio
X-Organization-Id: <uuid>   // obrigatório, menos em @Public() e @SkipTenant()
X-Branch-Id: <uuid>         // opcional — unidade ativa; validada contra o acesso do membro
```

**Regras que não se negociam:**

1. **Repositório de model tenant-scoped usa `prisma.scoped`, nunca `prisma` cru.**
   O cru é reservado ao `TenantContextGuard` (que lê antes de existir contexto) e
   a `Organization`/`User`, que não têm tenant a recortar.
2. **Model novo com `organization_id` entra em `TENANT_SCOPED_MODELS`** na mesma
   operação. É o que impede uma query dele de escapar do recorte.
3. **Consulta cross-tenant precisa ser declarada** com `runWithoutTenantScope()`.
   Sem a marca, uma query em model tenant-scoped dentro de uma requisição sem
   contexto lança `TenantScopeMissingError` (500) em vez de devolver linhas de
   todas as empresas — falha alto de propósito.
4. **Papel decide acesso a unidade:** `OWNER`/`ADMIN` operam todas as unidades da
   organização (`branchIds: null` no contexto); `MEMBER` só as de `BranchAccess`.
5. **Toda organização tem ao menos um `OWNER` ativo.** Remover, rebaixar ou
   desativar o último devolve 403 (`LastOwnerForbiddenError`).
6. **`@SkipTenant()`** é só para rotas que existem antes de haver organização
   (criar a primeira, listar as minhas). Elas ainda exigem autenticação.
7. **Permissões vêm do papel + perfil** — `resolveMembershipPermissions(role)`
   unido a `resolveCoarseFromFine(tenant.permissionIds)` no `PermissionGuard`.
   O perfil fino (`PermissionProfile`) é seedado na criação da org
   (`SYSTEM_PERMISSION_PROFILES`: Administrador, Financeiro, Gerente, Caixa,
   Vendedor, Contador, Atendimento). **Só Administrador** nasce com
   `isSystem=true` (não edita/exclui); os demais são editáveis/excluíveis. O
   OWNER nasce no `administrador`. Membro sem perfil (legado) fica com
   `permissionIds: []` e cai só no fallback do papel. Platform admin recebe
   `ALL_PERMISSION_ITEM_IDS`.

> **Suporte da plataforma:** um JWT com a role `platform.admin` entra em qualquer
> organização sem `Membership`, com papel efetivo `OWNER`. O contexto marca isso
> em `viaPlatformAdmin: true`. É o que permite o suporte operar e o Swagger ser
> testável com o bypass de dev.

**Cadastro de membro** (`POST /v1/members`): cria a identidade no Keycloak via
Admin API, define uma **senha provisória** (`temporary: true` + `UPDATE_PASSWORD`)
e devolve a senha em `meta.provisionalPassword` — uma única vez, nunca
persistida. Se a gravação local falhar depois disso, a identidade recém-criada é
removida do Keycloak (compensação): sem isso, sobraria uma conta órfã bloqueando
a próxima tentativa com o mesmo e-mail. Exige
`KEYCLOAK_PROVISIONING_CLIENT_ID/SECRET` (§7); sem elas a rota responde 503.
`lastName` pode ser string vazia (nome único no formulário do ERP); o nome
persistido junta só partes não vazias (`"Bruno"` — não `"Bruno Bruno"`).

---

## 6. Padrões de Código

(Idênticos à `food/api` — ver `apps/verticals/food/AGENTS.md` §6. Resumo:)

- **Use case**: `@Injectable() class XUseCase implements IUseCase<In, Out>`; injeta repositório por token; orquestra domínio.
- **Entidade**: `extends Entity<Props>`, `static create()/with()`, getters, `validate()` (Zod via factory).
- **Repositório**: interface abstrata (token) em `domain/repositories` + impl Prisma em `infrastructure/database`; DI no `<modulo>.module.ts`.
- **Rota**: `@Controller('v1/...')`, controller fino, `@OrganizationId()` + `@Body() DTO` (class-validator) → use case → presenter.
- **Testes**: Jest `*.spec.ts` com repositórios in-memory.

---

## 7. Variáveis de Ambiente

| Variável            | Obrigatória | Descrição                                              |
| ------------------- | ----------- | ------------------------------------------------------ |
| `NODE_ENV`          | ⚠️          | Obrigatório quando `AUTH_DEV_BYPASS=true` — o bypass só liga em `development`/`test`/`local` (§5.3) |
| `PORT`              | ➖ (3114)   | Porta HTTP                                              |
| `DATABASE_URL`      | ✅          | Postgres `citybox_platform` (schema `erp`)             |
| `KEYCLOAK_BASE_URL` | ➖          | Host do Keycloak — só documental, o código lê `KEYCLOAK_ISSUER` |
| `KEYCLOAK_REALM`    | ➖          | `citybox-erp` — só documental, idem                    |
| `KEYCLOAK_ISSUER`   | ✅          | Issuer **único** do realm `citybox-erp` (JWKS p/ validar JWT). **Sem lista de fallback** — aceitar mais de um issuer é aceitar token de mais de um realm (ADR C-16, invariante 1) |
| `KEYCLOAK_CLIENT_ID` | ✅         | `erp-web` — client de onde as client roles são lidas em `resource_access` |
| `KEYCLOAK_CLIENT_SECRET` | ➖     | Secret do `erp-web`. Consumido pelo `web` (BFF), não pela API |
| `KEYCLOAK_ALLOWED_AZP` | ✅       | Clients cujos tokens a API aceita, separados por vírgula: `erp-web,admin-m2m`. **Sem default** — o `AuthGuard` lança se faltar |
| `AUTH_DEV_BYPASS`   | ➖          | `true` libera `Bearer dev-admin` fora de produção      |
| `AUTH_DEV_USERNAME` / `AUTH_DEV_EMAIL` | ➖ | Identidade do usuário de bypass dev            |
| `KEYCLOAK_PROVISIONING_CLIENT_ID`     | ⚠️ | Service account da Admin API (`erp-provisioning`). **Sem ela, `POST /v1/members` responde 503** |
| `KEYCLOAK_PROVISIONING_CLIENT_SECRET` | ⚠️ | Secret do mesmo client. Em dev: `erp-provisioning-dev-secret` |
| `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | ⚠️ | Object storage das imagens de produto. Endpoint default `127.0.0.1:9000`. **Credenciais devem casar com `infra/minio/.env`** (`MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` — tipicamente `aplopes` / `citybox-minio-dev`). Sem MinIO no ar o produto salva, mas o upload de imagem falha. |
| `MINIO_BUCKET` | ➖ (`erp`) | Bucket dedicado do ERP Comércio |
| `MINIO_USE_SSL` | ➖ | `true` liga SSL |
| `RABBITMQ_URL`      | ⚠️          | Broker dos eventos da plataforma (§9.1). **Ausente = a API sobe, mas nenhuma loja criada no admin é provisionada** (fica em `PROVISIONING` lá). Mesmo nome usado por `clinica-api`/`food-api` |
| `RABBITMQ_EXCHANGE` | ➖ (`citybox.events`) | Topic exchange do barramento |
| `RABBITMQ_DLX`      | ➖ (`citybox.dlx`)    | Dead-letter exchange das mensagens que o handler rejeita |
| `ERP_COMERCIO_WORKER_ENABLED` | ➖ | `false` desliga só o consumidor, mantendo a API HTTP (útil para rodar N instâncias com uma só consumindo) |
| `FISCAL_API_URL` | ➖ (`http://127.0.0.1:3116/api`) | Base da `services/fiscal-api` para o `FiscalApiClient` (emissão de NFS-e — spec erp/018). **Sempre precisa terminar em `/api`** — os dois `http-fiscal-api-client.ts` (`nfse-issuance`/`nfe-issuance`) normalizam automaticamente e logam `[FiscalConfig]` se vier sem o sufixo, vazia ou só com espaços (spec erp/027; incidente de produção 2026-08-15, ver linha "Última atualização" acima), mas configurar já certo evita o aviso. |
| `FISCAL_API_TOKEN` | ⚠️ (prod) | Token de serviço enviado à fiscal-api (`Authorization: Bearer`). Em dev cai no bypass `dev-admin`; **em `NODE_ENV=production` a emissão falha rápido se ausente** (não usa o bypass — ver `http-fiscal-api-client.ts`). |

O client `erp-provisioning` precisa das roles `manage-users`, `view-users` e
`query-users` do client `realm-management` **do realm `citybox-erp` e de mais
nenhum** (ADR C-16, invariante 2) — já provisionadas por
`infra/keycloak/import/citybox-erp-realm.json` +
`infra/keycloak/scripts/sync-realm.mjs`. Comprometer esta API expõe os usuários
do ERP e de nenhum outro sistema.

Referência: `.env.example` (já existe um `.env` local pronto neste scaffold, gitignored).

---

## 8. Scripts

```bash
pnpm --filter @citybox/erp-api dev              # nest start --watch :3114 (predev roda prisma generate)
pnpm --filter @citybox/erp-api build             # nest build → dist/
pnpm --filter @citybox/erp-api start:prod         # node dist/src/main
pnpm --filter @citybox/erp-api lint               # eslint --fix
pnpm --filter @citybox/erp-api typecheck          # tsc --noEmit
pnpm --filter @citybox/erp-api test               # jest (unit *.spec.ts)
pnpm --filter @citybox/erp-api db:generate        # prisma generate → generated/prisma
pnpm --filter @citybox/erp-api db:migrate:dev     # prisma migrate dev
pnpm --filter @citybox/erp-api db:migrate:deploy  # prisma migrate deploy --config prisma.config.ts
pnpm --filter @citybox/erp-api db:migrate:status  # prisma migrate status --config prisma.config.ts
pnpm --filter @citybox/erp-api db:seed            # seed de desenvolvimento (usa `applyErpSeedTemplate`)
pnpm --filter @citybox/erp-api provision:orgs     # reprovisiona template em orgs existentes (`-- --force` força)

# Grade Tamanho×Cor para testar o PDV (Camiseta/Calça nas orgs Bruno e Kika):
docker cp apps/erp/api/scripts/seed-pdv-grid-variants.sql citybox_postgres:/tmp/seed-pdv-grid-variants.sql
docker exec citybox_postgres psql -U citybox -d citybox_platform -f /tmp/seed-pdv-grid-variants.sql

# Swagger: http://localhost:3114/api/v1/docs   ·   Health: http://localhost:3114/api/health
```

Prefixo global de rotas: **`/api`**.

---

## 9. Módulos e Endpoints

> Atualize esta seção sempre que um endpoint nascer ou mudar.
> **Todas as rotas são organization-scoped** (`X-Organization-Id`, §5.10) e
> passam pelos guards globais. O `X-Branch-Id` é opcional e recorta o que é por
> unidade (§5.4).


### Store setup — dados de sistema (`modules/store-setup`)

Fonte única: `ERP_SEED_TEMPLATE` (versão incrementável). Aplica **perfis de acesso de
sistema** (`SYSTEM_PERMISSION_PROFILES`, v2+), unidades de medida,
categoria `Geral`, estoque padrão, categorias de movimentação, grupos financeiros,
plano de contas, centros de custo e status de OS/contrato — todos com `systemKey` +
`isSystem=true`. As categorias de movimentação são só sugestão inicial do select de
lançamento manual: **nenhum fluxo automático depende delas** (§9, motivo do movimento).
O upsert de perfis também **backfill** memberships com `permissionProfileId` nulo →
perfil `administrador`.

**Perfil Caixa (seed):** `CAIXA_PERMISSIONS` em `fine-to-coarse.ts` inclui
`pdv.operacao.*` **exceto** `pdv.operacao.alcada.authorize` e
`pdv.operacao.caixa.withdrawal` (sangria). Reforço, abertura/fechamento e vendas
permanecem. Gerente/Admin mantêm sangria via `PDV_IDS`. Orgs já provisionadas
não perdem `permissionIds` customizados no upsert — para remover sangria do
perfil `systemKey=caixa` existente: `pnpm db:strip:caixa-withdrawal` (dry-run)
ou `pnpm db:strip:caixa-withdrawal -- --apply`
(`scripts/strip-caixa-withdrawal-permission.ts`).

| Gatilho | Quando |
| ------- | ------ |
| `CreateOrganizationUseCase` | `POST /v1/organizations` |
| `StorePlatformConsumer.provision` | evento `citybox.store.created` (vertical Comércio) |
| `pnpm provision:orgs [-- --force]` | reprovisionamento em lote |
| `prisma/seed.ts` via `applyErpSeedTemplate` | seed de desenvolvimento |

Exclusão de registro `isSystem` → **409** (`*NotRemovableError`). Campos estruturais
imutáveis (ex.: `type` de grupo financeiro / categoria de movimentação, `baseType`
de status de OS). Presenters expõem `isSystem` para o front desabilitar a ação.

### Tenancy — organizações, unidades e equipe (`modules/tenancy`)

| Método | Rota (base `/api/`) | Use case | Permissão | Notas |
| ------ | ------------------- | -------- | --------- | ----- |
| `POST`   | `v1/organizations`          | CreateOrganization    | — (autenticado) | `@SkipTenant` · quem cria vira `OWNER` · 409 documento repetido · 422 CNPJ/CPF inválido · **dispara `ProvisionOrganizationDataUseCase`** (dados de sistema) |
| `GET`    | `v1/organizations`          | ListMyOrganizations   | — (autenticado) | `@SkipTenant` · seletor de empresa: devolve `role` e `branchCount` |
| `GET`    | `v1/organizations/current`  | FindOrganizationById  | `org.view`   | A organização do header. `OrganizationPresenter.toHttp` expõe **`platformStoreId`** (`string \| null`) — usado pelo erp-web para provisionar o Emitente na `services/fiscal-api` (spec `erp/010-fiscal-certificate-screen`) |
| `PUT`    | `v1/organizations/current`  | UpdateOrganization    | `org.manage` | Documento e tipo de pessoa **não** são editáveis |
| `POST`   | `v1/branches`               | CreateBranch          | `org.branches.manage` | 409 código/documento repetido ou segunda matriz · 422 documento inválido |
| `GET`    | `v1/branches`               | ListBranches          | `org.view`   | `search`, `active`, `page`, `perPage` (teto 100) · `MEMBER` só vê as suas |
| `GET`    | `v1/branches/:id`           | FindBranchById        | `org.view`   | 404 se não existir **ou** for de outra organização |
| `PUT`    | `v1/branches/:id`           | UpdateBranch          | `org.branches.manage` | Semântica PUT: campo omitido é limpo · 409 se já há outra matriz |
| `DELETE` | `v1/branches/:id`           | DeleteBranch          | `org.branches.manage` | **soft-delete** → `204` |
| `POST`   | `v1/members`                | CreateMember          | `org.members.manage` | Exige `permissionProfileId` · perfil `administrador` → role `ADMIN` · cria no Keycloak + senha provisória em `meta` · `isSeller` default **true** · 409 já é membro · 503 Keycloak indisponível |
| `GET`    | `v1/members`                | ListMembers           | `org.view`   | `search` (nome/e-mail), `active`, `isSeller`, paginação · `OWNER` primeiro · inclui `permissionProfile` |
| `PUT`    | `v1/members/:id`            | UpdateMember          | `org.members.manage` | Papel, situação, `permissionProfileId`, `isSeller` e unidades · 403 se deixar a organização sem `OWNER` ativo |
| `DELETE` | `v1/members/:id`            | RemoveMember          | `org.members.manage` | Remove só o vínculo; a conta no Keycloak sobrevive → `204` |
| `POST`   | `v1/members/:id/reset-password` | ResetMemberPassword | `org.members.manage` | Nova senha provisória; invalida a anterior |
| `GET`    | `v1/permission-catalog`     | — (catálogo estático) | `org.view`   | Catálogo fino canônico (`getPermissionCatalog`) |
| `GET`    | `v1/permission-profiles`    | ListPermissionProfiles | `org.view` | `search`, `activeOnly`, paginação |
| `GET`    | `v1/permission-profiles/:id` | FindPermissionProfileById | `org.view` | Inclui excluídos |
| `POST`   | `v1/permission-profiles`    | CreatePermissionProfile | `org.members.manage` | `isSystem=false` · 409 nome · 422 ids inválidos |
| `PUT`    | `v1/permission-profiles/:id` | UpdatePermissionProfile | `org.members.manage` | 409 se `isSystem` (só Administrador) · custom: nome/descrição/ids |
| `DELETE` | `v1/permission-profiles/:id` | DeletePermissionProfile | `org.members.manage` | Soft-delete · 409 se `isSystem` (só Administrador) ou membros vinculados |
| `POST`   | `v1/permission-profiles/:id/restore` | RestorePermissionProfile | `org.members.manage` | Idempotente |
| `POST`   | `v1/platform/stores/:platformStoreId/provision` | ProvisionPlatformStore | `platform.admin` | `@SkipTenant` · M2M admin → org+OWNER+template+`{ username, provisionalPassword }` |
| `GET`    | `v1/platform/stores/:platformStoreId/owner` | FindPlatformStoreOwner | `platform.admin` | `@SkipTenant` · M2M admin → shape `VerticalMember` |
| `POST`   | `v1/platform/stores/:platformStoreId/owner/reset-password` | ResetPlatformStoreOwnerPassword | `platform.admin` | `@SkipTenant` · M2M admin → `{ username, provisionalPassword }` |

**Papel → permissões** (`shared/infra/http/decorators/permissions.ts`):

| Papel | Permissões |
| ----- | ---------- |
| `OWNER`  | `org.*` + operação da loja (`store.catalog/settings/stock/sales/finance.manage`) |
| `ADMIN`  | `org.view` + branches/members/suppliers/customers + operação da loja (inclui `store.finance.manage`) |
| `MEMBER` | `org.view`, `store.catalog.manage`, `store.stock.manage`, `store.sales.manage` — **sem** `store.finance.manage` |

### 9.1 Platform sync — consumidor de `citybox.store.*` (`modules/tenancy`)

*Fase 11 do ADR PLAT-001, 2026-07-30.* Até aqui o ERP era uma ilha: uma loja de
comércio cadastrada no admin da plataforma publicava `citybox.store.created`,
ninguém consumia, e a loja ficava em `deploymentStatus = PROVISIONING` **para
sempre**. Este consumidor fecha o ciclo.

**Não é rota HTTP** — roda fora de requisição, em `OnApplicationBootstrap` do
mesmo processo da API (não há `main-worker` separado como na `clinica-api`).

| Peça | Arquivo |
| ---- | ------- |
| Consumidor | `infrastructure/messaging/consumers/store-platform.consumer.ts` |
| Dedupe | `infrastructure/messaging/event-dedupe.service.ts` (model `ProcessedEvent`) |
| Regra de negócio | `application/use-cases/sync-organization-from-store/` |
| Contrato dos eventos | `packages/messaging/src/contracts/store-events.ts` — **fonte de verdade**, não duplicar |

**Fila `erp-comercio.store-setup`, binding `citybox.store.#`** (cada vertical tem
a sua: `food.store-setup`, `clinic.store-setup`).

| Evento consumido | Efeito local |
| ---------------- | ------------ |
| `citybox.store.created.v1`      | **Ignorado** (provisionamento só via `POST …/platform/stores/:id/provision`) |
| `citybox.store.updated.v1`      | Se a org **já existe** → atualiza o cadastro (campo ausente no evento **não** apaga o local). Sem org → no-op (não cria) |
| `citybox.store.plan_changed.v1` | Atualiza só o snapshot `planId`/`planTier`/`planMaxBranches`/`planMaxUsers` |
| `citybox.store.suspended.v1`    | `status = SUSPENDED` + `suspendedReason` |
| `citybox.store.reactivated.v1`  | Volta a `ACTIVE` e limpa o motivo |

**Provision HTTP (admin).** `POST /api/v1/platform/stores/:platformStoreId/provision` cria org+matriz+OWNER+template e devolve `{ username, provisionalPassword }`. O admin marca a loja `ACTIVE`/`FAILED` a partir dessa resposta — **não** depende mais de callback RabbitMQ no create.

**Callbacks `citybox.provisioning.*`** ainda existem para fluxos legados/outros desfechos do consumer; o path on-demand do admin **não** espera o callback para liberar a senha.

**Filtro por vertical:** `HANDLED_VERTICALS = ['Comércio']` — a única vertical que
este ERP atende. Desde 2026-07-30 o catálogo da plataforma tem **uma vertical por
sistema**: `'Food'` e `'Varejo'` fundiram em `'Comércio'` (este ERP atende os dois
ramos), e `'Serviços'` saiu. O produtor não emite mais `'Food'`, então a
`food-api` não recebe nada e **não há risco de provisionamento em dobro** — o
motivo que mantinha `'Food'` fora do filtro deixou de existir.

**Regras que sustentam a correção:**

1. **Idempotência em duas camadas.** `EventDedupeService.claim` grava o `id` do
   CloudEvent em `ProcessedEvent` antes de processar e o **libera no catch** (a
   falha transitória volta pela fila em vez de ficar marcada como concluída);
   além disso, `provision` procura por `platformStoreId` e cai no caminho de
   atualização se a organização já existir. O outbox entrega at-least-once.
2. **Evento fora de ordem é descartado.** `Organization.platformUpdatedAt` guarda
   o `updatedAt` **da origem**; evento com carimbo anterior é ignorado
   (`isStalePlatformEvent`). `setSuspended` é a exceção deliberada: status é
   last-write-wins, porque uma reativação descartada deixaria o lojista pagando e
   sem acesso.
3. **Escrita fora de escopo de tenant é declarada.** O consumidor envolve o
   dispatch em `runWithoutTenantScope()` (§5.10, regra 3) — sem isso a gravação
   da `Branch` (model tenant-scoped) estouraria `TenantScopeMissingError`.
4. **Campo obrigatório ausente falha alto.** Na `Store` quase tudo é nullable; em
   `Organization`/`Branch` não. Faltando CNPJ/CPF, razão social, e-mail de
   cobrança ou nome do responsável, `StorePayloadIncompleteError` nomeia os
   campos e o motivo vai inteiro para o callback `failed`. **Nunca inventar
   placeholder.**

### Customers — clientes CRM (`modules/customers`)

Cadastro de clientes da organização (PF/PJ), com estágio CRM, N endereços tipados e vínculo por unidade. Molde estrutural de `suppliers` (documento único por org, soft-delete + restore, `assertBranchesBelongToOrganization`). Submódulo `customer-categories/` sob o mesmo módulo de topo.

| Método | Rota (base `/api/`) | Use case | Permissão | Notas |
| ------ | ------------------- | -------- | --------- | ----- |
| `GET`    | `v1/customers`             | ListCustomers    | `org.view` | `search`, `tab` (`all`/`lead`/`opportunity`/`active`/`inactive`), `page`, `perPage` · `tabCounts` sobre ativos · sort `createdAt desc` · `salesTotal` = soma de `SaleOrder` fechados do cliente |
| `GET`    | `v1/customers/:id`         | FindCustomerById | `org.view` | Inclui soft-deleted |
| `POST`   | `v1/customers`             | CreateCustomer   | `org.customers.manage` | Documento opcional; 409 se repetido (inclui excluídos) · 404 categoria/unidade · 422 CPF/CNPJ inválido ou >1 endereço `principal` |
| `PUT`    | `v1/customers/:id`         | UpdateCustomer   | `org.customers.manage` | Semântica PUT: omitido limpa |
| `DELETE` | `v1/customers/:id`         | DeleteCustomer   | `org.customers.manage` | soft-delete → `204` |
| `POST`   | `v1/customers/:id/restore` | RestoreCustomer  | `org.customers.manage` | Idempotente |

| Método | Rota | Use case | Permissão | Notas |
| ------ | ---- | -------- | --------- | ----- |
| `GET`    | `v1/customer-categories`     | ListCustomerCategories    | `org.view` | `search`, paginação · `customerCount` = clientes ativos vinculados |
| `GET`    | `v1/customer-categories/:id` | FindCustomerCategoryById  | `org.view` | |
| `POST`   | `v1/customer-categories`     | CreateCustomerCategory    | `org.customers.manage` | 409 nome repetido · `discountPercentage` 0–100 |
| `PUT`    | `v1/customer-categories/:id` | UpdateCustomerCategory    | `org.customers.manage` | |
| `DELETE` | `v1/customer-categories/:id` | DeleteCustomerCategory    | `org.customers.manage` | **hard delete** · **409** se houver clientes |

Models Prisma: `CustomerCategory`, `Customer`, `CustomerAddress`, `CustomerBranch` + enums `CustomerStage`, `CustomerAddressType`. Todos em `TENANT_SCOPED_MODELS`. Seed: 2 categorias + 4 clientes.

### Sales — pedidos de venda (`modules/sales`, fases 1-4)

`SaleOrder` + `SaleOrderLine` + `SaleOrderPayment` (Clean Architecture completa,
igual a `customers`/`tenancy` — não flat como as fatias mais novas de `stock`).
Mesma entidade cobre os canais `pdv`/`delivery`/`marketplace`/`cardapio`
(`channelId`). `customerId` é opcional — `customerName` é denormalizado e cobre
cliente avulso sem cadastro. `number` é sequencial por organização, atribuído
uma única vez na criação (`SaleOrderRepository.nextNumber`, `MAX(number)+1`
dentro da mesma transação de escrita).

**Baixa de estoque idempotente.** Ao fechar (`status=closed`) — seja na
criação já fechada, seja via `PATCH …/status` — o pedido gera **no máximo 1**
`StockMovement` de saída (`buildSaleOutboundMovement`, `sourceType=sale` ⇒
`reason=sale`, `categoryId` nulo, `sourceId=saleOrder.id`) e grava `stockMovementId`
na mesma transação (`persistStockMovementInTx`, reexportado de `stock`).
Só entram no movimento as linhas cujo produto tem `trackStock=true` — linhas
de serviço/não-controlado ficam no pedido mas nunca tocam o ledger. Fechar um
pedido com ao menos uma linha controlada exige `stockId`
(`SaleOrderStockRequiredError`, 422); **saldo insuficiente não bloqueia** —
a saída deixa o saldo negativo (política deliberada; PDV só sinaliza).

**Imutabilidade pós-baixa** (mesma regra de `Purchase`): com `stockMovementId`
já gravado, `PUT /v1/sale-orders/:id` recusa com **409**
(`SaleOrderAlreadyClosedError`) e `PATCH …/status` para `cancelled` também
recusa com **409** (`SaleOrderMovementInUseError`) — estornar exigiria mexer no
ledger manualmente, fora do escopo desta fase.

**`SaleOrderLine.productId` é opcional (spec erp/031 D1, 2026-08-20).**
Linha de serviço sem vínculo de catálogo tem `productId: null` +
`description: string` (rótulo próprio); linha de produto tem `productId`
preenchido e `description: null` — nunca as duas ao mesmo tempo
(`SaleOrder.entity.ts normalizeLines()`, mais um `CHECK` no banco como defesa
em profundidade, migration `sale_order_line_optional_product`). Consequência
em cada consumidor: `assertSaleOrderReferences` pula a validação de produto
para linha sem `productId`; `buildSaleOutboundMovement` nunca inclui linha de
serviço no movimento de saída (nunca é "controlada"); o presenter usa
`description` como rótulo quando não há produto. **`generate-sale` da OS**
(abaixo) foi o motivador — antes só linhas de produto entravam na venda
gerada, então uma OS só-serviço nunca conseguia faturar.

| Método | Rota (base `/api/`) | Use case | Permissão | Notas |
| ------ | ------------------- | -------- | --------- | ----- |
| `GET`    | `v1/sale-orders`             | ListSaleOrders          | `org.view` | `tab` (`open`\|`deleted`), `search` (número/cliente), `statuses` (array; `@Transform(toArray)` — valor único `?statuses=closed` ok), `amountMinCents`/`amountMaxCents`, `dateFrom`/`dateTo` (ISO; sem `periodPreset` — o web resolve presets → intervalo), `sort`, `page`, `perPage`; `tabCounts` ignora os demais filtros |
| `POST`   | `v1/sale-orders`             | CreateSaleOrder         | `store.sales.manage` | body: `customerId?`, `customerName`, `stockId?`, `status?`, `channelId?`, `sellerId?` (texto livre ≤64 — não é FK), `sellerName?`, `notes?`, `deliveryFeeCents?`, `discountsCents?`, `lines[]` (`productId`, `quantity` Decimal-string, `unitPriceCents`), `payments?[]` (`amountCents`, `methodId`, `bankAccountId?`, **`cardPaymentType?`** `pix\|debit\|credit`, **`brand?`**, **`installments?`** — motor de recebíveis, ver abaixo); `status=closed` já gera a saída; 404 cliente/estoque/produto; 422 sem linhas; 409 saldo insuficiente |
| `GET`    | `v1/sale-orders/:id`         | FindSaleOrderById       | `store.sales.manage` | detalhe com linhas + pagamentos + nomes (cliente/estoque/produto); 404 se outra organização |
| `PUT`    | `v1/sale-orders/:id`         | UpdateSaleOrder         | `store.sales.manage` | semântica PUT — substitui linhas e pagamentos; **409** se já tem `stockMovementId` |
| `PATCH`  | `v1/sale-orders/:id/status`  | UpdateSaleOrderStatus   | `store.sales.manage` | troca só `status`; → `closed` sem movimento ainda gera a saída; → `cancelled` com movimento já gerado → 409 |
| `DELETE` | `v1/sale-orders/:id`         | DeleteSaleOrder         | `store.sales.manage` | **soft-delete** → `204`; não estorna movimento já gerado |
| `POST`   | `v1/sale-orders/:id/restore` | RestoreSaleOrder        | `store.sales.manage` | Idempotente; sem efeito no ledger |

Permissão nova `store.sales.manage` em `OWNER`/`ADMIN`/`MEMBER` (paridade com
`store.stock.manage`). Money sempre em **centavos**; `linesTotalCents` e
`totalCents` (linhas + frete − descontos) são calculados na entidade, não
persistidos. Models `SaleOrder`/`SaleOrderLine`/`SaleOrderPayment` + enums
`SaleOrderStatus`/`SaleOrderChannel` em `TENANT_SCOPED_MODELS`.

### Submódulos finos de `sales` (fases 5-8) — sem camada de domínio própria

`service-orders/`, `sales-contracts/` e `promotions/` sob
`modules/sales/` acessam o Prisma **direto** (`<x>.service.ts` + `<x>.controller.ts`,
sem `domain`/`application` em camadas — molde deliberadamente mais raso que
`SaleOrder`, para viabilizar CRUD rápido). Cada um registra sua própria
instância de `SaleOrderRepository` (token de `sales/domain/repositories`, impl
`PrismaSaleOrderRepository`) quando precisa gerar venda, para não depender de
`SalesModule` e evitar import circular — mesma implementação Prisma, sem
divergência de comportamento. Todos exigem `store.sales.manage` para escrita e
`org.view` para leitura; `payloadJson`/`rulesJson` (`Prisma.InputJsonValue`)
carregam dados livres não modelados.

| Submódulo | Rotas (base `/api/`) | Notas |
| --------- | --------------------- | ----- |
| `service-orders/` | `v1/service-orders` (list/find/create/update), `v1/service-order-statuses` (CRUD) | `payloadJson.lines` guarda equipamentos/linhas livres; `code` auto `OS-NNNNNN`; `POST :id/generate-sale` cria um `SaleOrder` fechado a partir das linhas e grava `generatedSaleId` — idempotente (devolve o mesmo pedido se já gerado). **Spec erp/031 D1 (2026-08-20):** `extractServiceOrderSaleLines` (função pura, `extract-service-order-sale-lines.ts`) aceita linha de produto (`productId`) **e** de serviço (`productId: null` + `description`) — antes só linha de produto entrava, e uma OS só-serviço batia sempre no 400 "A OS precisa de ao menos uma linha..." mesmo tendo itens |
| `sales-contracts/` | `v1/sales-contracts` (list/find/create/update), `v1/contract-statuses` (CRUD) | `create`/`update` geram `ContractInstallment[]` automaticamente a partir de `frequency`/`durationType`/`durationValue`/`firstDueDate` (divide `totalCents` com resto na última parcela); `update` só regenera as parcelas se nenhuma tiver saído de `status=open` — preserva histórico financeiro de contratos já em cobrança |
| `promotions/` | `v1/promotions` (list/find/create/update/delete/restore), `POST v1/promotions/preview` | `type` = `PromotionType` (7 valores); soft-delete + restore; `preview` é **stub** — motor de regras por `type`/`rulesJson` fica para fase futura, sempre devolve `discountCents: 0` |

> **`financial/` saiu daqui em 2026-07-31.** Contas bancárias e lançamentos
> financeiros viraram submódulos Clean em `modules/finance/` — ver
> "Finance — contas bancárias e lançamentos" abaixo. As URLs `v1/bank-accounts`
> e `v1/financial-entries` não mudaram.

Nenhum desses 3 tem teste automatizado ainda (só os use cases de `SaleOrder`
propriamente dito têm `.spec.ts` com repositório in-memory) — cobertura fica
para quem evoluir cada fase.

### Finance — cadastros de suporte + contas + lançamentos (`modules/finance`)

Módulo de topo em Clean Architecture (um submódulo Clean por cadastro). Criado
em 2026-07-31: primeiro os cadastros de suporte (centro de custo, grupo
financeiro, plano de contas, contratos de cartão), depois a migração do
submódulo fino `sales/financial/` (contas bancárias + lançamentos). As URLs de
contas/lançamentos são as mesmas de antes; o que mudou no contrato HTTP:

- **Escrita exige `store.finance.manage`** (OWNER/ADMIN; MEMBER só lê via `org.view`).
  Contas/lançamentos antes usavam `store.sales.manage` (MEMBER tinha escrita).
- Listagem: `tab=active|deleted`, `tabCounts` (ignora search/filtros) e paginação
  server-side (`page`/`perPage`, default 20, teto 100).
- Item único envelopado em `{ data }`.
- `POST :id/restore` em todos (soft-delete uniforme).
- Models novos: migration `20260731121355_add_finance_support_cadastros`.
  `BankAccount`/`FinancialEntry` **inalterados** (só mudaram de módulo).
- Dívida: `BankAccount.branchIds` é `String[]` (não pivot `BankAccountBranch`).
- **2026-08-05 — Lançamentos ganham rateio real (feature "Lançamentos
  financeiros"):** `FinancialEntry.categoryName` deixa de ser a única fonte de
  categoria — passa a ser só o valor histórico pré-rateio, preservado por
  compatibilidade e usado como entrada do backfill (abaixo). `FinancialEntry`
  ganha `feesCents`/`finesCents`/`note`/`supplierId` (FK, mutuamente exclusivo
  com `customerId`) e `status` (`pending`\|`paid`, recalculado no servidor a
  cada save a partir de `sum(payments[].amountCents)` — nunca aceito bruto do
  cliente). 3 models novos, todos `TENANT_SCOPED_MODELS`:
  `FinancialEntryPayment` (rateio de pagamento — valor, data, forma fixa,
  bandeira livre; substituído por completo a cada `save()`, sem identidade
  estável — mesmo padrão de `SaleOrder.lines`), `FinancialEntryAllocation`
  (rateio de categoria + centro de custo **obrigatórios**; a soma precisa
  fechar com `totalCents` — tolerância 1 centavo, `AllocationMismatchError` →
  422 — é esse vínculo real que passa a alimentar a DRE) e
  `FinancialEntryAttachment` (comprovante — CRUD HTTP próprio via
  `FinancialEntryAttachmentRepository`, imutável, MinIO em
  `{organizationId}/financeiro/lancamentos/{financialEntryId}/{attachmentId}.{ext}`,
  validado por `AttachmentFileValidator` — PDF/PNG/JPEG/WebP, assinatura
  binária, ≤5MB). Migration
  `20260805180448_add_financial_entry_payments_allocations_attachments`.
  Lançamento com `saleOrderId` preenchido fica `readOnly` (FR-016) —
  `SaleOrderLinkedEntryForbiddenError` (403) em qualquer tentativa de `PUT`;
  exclusão/restauração continuam permitidas. Backfill de dados legados:
  `scripts/backfill-financial-entry-allocations.ts`
  (`pnpm db:backfill:financial-entries`) — cria 1 `FinancialEntryAllocation`
  de 100% por `FinancialEntry` sem rateio, casando `categoryName` com
  `ChartOfAccount.name` da organização (fallback nas contas de sistema
  `outras-receitas`/`outras-despesas` + centro `administrativo` quando não
  casa). 3 rotas novas de anexo: `POST`/`GET`/`DELETE`
  `v1/financial-entries/:id/attachments[/:attachmentId]`.
- **2026-08-06 — Contas bancárias ganham livro-razão real (feature
  "Contas bancárias — saldo real, extrato e transferência",
  `specs/erp/002-bank-account-ledger/`):** o saldo exibido em
  `GET /v1/bank-accounts[/:id]` deixa de ser `openingBalanceCents` estático e
  passa a ser **calculado** por agregação on-the-fly (`groupBy` por `kind` em
  `bank_transactions`, decisão A do prompt — nunca uma coluna materializada;
  ver `research.md` D2) — `currentBalanceCents` no presenter, `balances`
  (mapa `id → cents`) no retorno de `ListBankAccountsUseCase`.
  `BankAccount` ganha `bankCode` (identificador estável do catálogo de bancos
  do frontend, corrige o round-trip do `Select` — antes só `bankName`, texto
  livre, quebrava ao reabrir a conta). 2 models novos, ambos
  `TENANT_SCOPED_MODELS`: `BankTransaction` (livro-razão — `kind`
  `initial_balance`\|`credit`\|`debit` dá o sinal, `amountCents` sempre
  positivo, `sourceType`/`sourceId` apontam para o agregado de origem sem FK
  — `BankAccount`/`BankTransfer`/`FinancialEntry` conforme o caso, resolução
  por aplicação) e `BankTransfer` (registro da transferência). Migration
  `20260805233442_add_bank_transactions_and_transfers`.

  A origem `initial_balance` (criada/ressincronizada por
  `PrismaBankAccountRepository.save()`, dentro da mesma `$transaction` do
  upsert da conta) e a origem `bank_transfer` (criada por
  `PrismaBankTransferRepository.save()`) são append-only de verdade. Já a
  origem `financial_entry_payment` é uma **projeção ressincronizada** —
  `PrismaFinancialEntryRepository` apaga+recria as `BankTransaction` do
  lançamento (`sourceId = FinancialEntry.id`, não o id do pagamento — que não
  tem identidade estável entre saves) a cada `save()`/`softDelete()`/
  `clearDeletedAt()`, via a função pura compartilhada
  `financial-entries/domain/services/derive-bank-transaction-inputs.ts` (o
  mesmo cálculo é usado pelo repositório Prisma real e pelo repositório
  in-memory de teste, para os dois nunca divergirem sobre "o que este
  lançamento gera"). O recebível que `PrismaSaleOrderRepository.maybeCreateReceivable`
  grava direto via Prisma ao fechar um pedido de venda (sem popular
  `payments[]`) também cria sua movimentação ali mesmo, na mesma transação —
  sem isso o extrato da conta nunca saberia da venda. Detalhe completo da
  decisão de sincronização em `specs/erp/002-bank-account-ledger/research.md` D1.

  2 rotas novas aninhadas em `bank-accounts/:id` (`/transactions` — aba
  Transações, analítica, filtrável por `kind`/`effectiveFrom`/`effectiveTo`;
  `/statement` — aba Histórico, extrato com `runningBalanceCents` por linha,
  **correto entre páginas**: a origem busca as `skip+take` movimentações mais
  recentes e caminha do saldo total da conta para baixo, em vez de
  reagregar por página — ver D3). Ordenação de todo o ledger:
  `effectiveAt DESC, createdAt DESC, id DESC` (tiebreak determinístico, D7).

- **2026-08-06 — DRE real e análise por centro de custo
  (`specs/erp/003-financial-reports-cost-center/`):** o vínculo real
  lançamento ↔ conta do plano ↔ centro de custo (`FinancialEntryAllocation`)
  já existia desde a feature de Lançamentos — esta fatia só **consome** esse
  dado. Submódulo novo `reports/`, só leitura, sem entidade de domínio
  própria (`domain/repositories/finance-report.repository.interface.ts` +
  `PrismaFinanceReportRepository`, agregação via `groupBy` do Prisma sobre
  `financial_entry_allocations` — nunca `findMany` + soma em memória, ver
  `research.md` D1/D3/D5). `FinancialGroup` ganha `classification`
  (`resultado`\|`patrimonial`, ver linha `financial-groups/` abaixo) para
  corrigir um bug de dado vivo: os grupos de sistema `caixa-e-bancos`/`ativo`
  estavam tipados `receita` mas são patrimoniais (sangria/suprimento de
  caixa, recebimento de cliente) — sem a correção, entravam na DRE como
  receita e inflavam o resultado. Migration
  `20260806033844_add_financial_group_classification`; organizações
  existentes corrigidas por `scripts/backfill-financial-group-classification.ts`
  (`pnpm db:backfill:financial-group-classification`, idempotente —
  organizações novas já nascem corretas via `finance.seed.ts`/`finance.writer.ts`).

| Submódulo | Rotas (base `/api/`) | Notas |
| --------- | -------------------- | ----- |
| `cost-centers/` | `GET`/`POST` `v1/cost-centers`, `GET`/`PUT`/`DELETE` `v1/cost-centers/:id`, `POST …/restore` | Só `name` (único por org, case-insensitive entre ativos). Soft-delete + restore |
| `payment-methods/` | `GET`/`POST` `v1/payment-methods`, `GET`/`PUT`/`DELETE` `v1/payment-methods/:id`, `POST …/restore` | Novo (2026-08-07, spec `007-financeiro-ajustes-ui`). `name`/`fiscalCode`/`installmentPermission`, nome único (case-insensitive entre ativos). `isSystem` bloqueia **edição e** exclusão (diferente de `cost-centers`, que só bloqueia exclusão — `PaymentMethodNotEditableError`/`PaymentMethodNotRemovableError`, ambos 409). Exclusão de forma própria em uso em algum `FinancialEntryPayment.paymentMethod` → 409 (`PaymentMethodInUseError`, `countUsage` no repositório). **Sem endpoint `/options`** — o select de `financial-entries` consome esta mesma listagem com `perPage` alto (mesmo padrão de `cost-centers`). `FinancialEntryPayment.paymentMethod` continua `String` solto no schema (sem FK) — ver bloco `financial-entries` abaixo e `research.md` R1 da spec |
| `financial-groups/` | `GET`/`POST` `v1/financial-groups`, `GET`/`PUT`/`DELETE` `v1/financial-groups/:id`, `POST …/restore` | `type` = `receita`\|`despesa`. Nome único. **409** `FinancialGroupInUseError` se houver contas do plano ativas. Filtro `type` na listagem. Exporta `FinancialGroupRepository`. **2026-08-06:** `classification` (`resultado`\|`patrimonial`) — não é input do formulário nem sai no presenter; grupo criado pelo lojista é sempre `resultado`, só os grupos de sistema `caixa-e-bancos`/`ativo` nascem/são corrigidos como `patrimonial` (seed + `scripts/backfill-financial-group-classification.ts`) — usado pela DRE (`reports/`) para excluir grupos patrimoniais do resultado |
| `chart-of-accounts/` | `GET`/`POST` `v1/chart-of-accounts`, `GET`/`PUT`/`DELETE` `v1/chart-of-accounts/:id`, `POST …/restore` | `financialGroupId` (FK Restrict) + `availableForPdv` (editável, mas **sem consumidor** — não há módulo de PDV na `erp-api`; pendência registrada, não implementada nesta fatia — ver `specs/erp/003-financial-reports-cost-center/spec.md` Assumptions). Presenter enriquecido com `financialGroupName`/`financialGroupType`. Importa `FinancialGroupsModule` |
| `card-contracts/` | `GET`/`POST` `v1/card-contracts`, `GET`/`PUT`/`DELETE` `v1/card-contracts/:id`, `POST …/restore`; aninhado `v1/card-contracts/:contractId/payment-methods` (GET/POST + PUT/DELETE `:id`) | Contrato + métodos + `CardRateTier[]`. `paymentMethodCount` via `_count`. `bankAccountId?` validado por porta local `BankAccountLookup`. Faixas progressivas: sem sobreposição (ValidatorDomainError → 422). **Contrato HTTP inalterado desde 2026-08-06** — o cadastro passou a produzir efeito via `domain/services/` novo (motor de recebíveis, ver bloco abaixo), consumido só por `sales`, sem endpoint próprio novo |
| `bank-accounts/` | `GET`/`POST` `v1/bank-accounts`, `GET`/`PUT`/`DELETE` `v1/bank-accounts/:id`, `POST …/restore`; `GET` `v1/bank-accounts/:id/transactions`, `GET` `v1/bank-accounts/:id/statement` | Nome **não** é único. Busca casa `name` **ou** `bankName`. `openedAt` `@db.Date`. `branchIds` `String[]`. `bankCode` (round-trip do catálogo do front, FR-015). `currentBalanceCents` calculado (nunca `openingBalanceCents` estático). Exporta `BankAccountRepository` **e** `BankTransactionRepository` (leitura do ledger, consumida por `bank-transfers`/`financial-entries`) |
| `bank-transfers/` | `POST` `v1/bank-transfers` | Submódulo novo (2026-08-06). Grava, numa única transação, a `BankTransfer` + 2 `BankTransaction` vinculadas (débito na origem, crédito no destino). Sem `GET`/`PUT`/`DELETE` — não editável/cancelável nesta fase (correção = nova transferência em sentido oposto). `paymentMethod` é `PaymentMethod.id` (UUID, validado por `assertPaymentMethodExists`) desde **2026-08-07** — antes reaproveitava o enum fixo de `FinancialEntryPayment`. Importa `BankAccountsModule`/`CostCentersModule`/`PaymentMethodsModule` |
| `financial-entries/` | `GET`/`POST` `v1/financial-entries`, `GET`/`PUT`/`DELETE` `v1/financial-entries/:id`, `POST …/restore`; `POST`/`GET`/`DELETE` `v1/financial-entries/:id/attachments[/:attachmentId]`; `GET` `v1/financial-entries/summary` (**2026-08-06**, extrato) | `operation` = `receivable`\|`payable`. Filtros da listagem/resumo (`FinancialEntryFilterQueryDto`, base comum aos dois): `operation`, `status[]`, `chartOfAccountId[]`/`costCenterId[]` (via `allocations.some`), `bankAccountId`, `search`, `dueFrom`/`dueTo` sobre `dueDate`, **`competenceFrom`/`competenceTo`** sobre `competenceDate` (eixo alternativo, extrato); listagem ainda aceita `sort`/`tab`/paginação. **`FinancialEntryListCriteria` (interface de domínio, não o HTTP DTO acima) ganhou `customerId`/`supplierId`/`paidFrom`/`paidTo`/`paymentMethod`/`cardBrand` (2026-08-11, research.md D17 de `006-bank-reconciliation`)** — sem uso pelo `ListFinancialEntriesUseCase`/HTTP ainda; consumidos hoje só pelo `SearchEligibleEntriesUseCase` de `bank-reconciliation` (bloco abaixo), que chama `findAll` diretamente. `paidFrom`/`paidTo`/`paymentMethod`/`cardBrand` filtram sobre a relação `payments` (`payments.some`), não sobre colunas do próprio lançamento. `dueTo < dueFrom` **ou** `competenceTo < competenceFrom` → `InvalidStatementPeriodError` (422). `GET summary` soma `amountCents` por `operation` (`groupBy`, sempre só ativos) → `{ receivableCents, payableCents, netCents }`; **precisa estar registrada antes de `FindFinancialEntryByIdRoute` (`GET :id`) no `controllers`** do módulo, senão `/summary` casa com `:id`. Corpo de escrita inclui `payments[]`/`allocations[]` (rateio completo, substituído por inteiro a cada save). Valida `bankAccountId`/`chartOfAccountId`/`costCenterId`/`customerId`/`supplierId`/`payments[].paymentMethod` via os módulos importados (**`payments[].paymentMethod` é `PaymentMethod.id`, UUID validado por `assertPaymentMethodExists` — 2026-08-07**, era `@IsIn` de enum fixo; schema `FinancialEntryPayment.paymentMethod` continua `String` solto, sem FK, para não quebrar dado histórico — ver `specs/erp/007-financeiro-ajustes-ui/research.md` R1). `readOnly` no presenter quando `saleOrderId != null` (FR-016). Cada `save()`/`softDelete()`/`clearDeletedAt()` ressincroniza as `BankTransaction` do lançamento na conta vinculada (RN-12/FR-016/FR-017 — ver bloco de Contas bancárias acima). **`DELETE :id` bloqueia com 409 (`FinancialEntryNotRemovableError`) quando o lançamento tem um pagamento com conciliação bancária ativa (2026-08-09, spec `007-financeiro-ajustes-ui` US10)** — `DeleteFinancialEntryUseCase` consulta `BankStatementMatchRepository.findActiveFinancialEntryIds` (mesmo método já usado por `reconcile-transaction`); volta a permitir assim que o match é removido (`bank-reconciliation` → `.../reconcile/undo`, ver bloco abaixo). Importa `PaymentMethodsModule` e, desde US10, `BankReconciliationModule` via `forwardRef` (ciclo real entre módulos irmãos — `bank-reconciliation` também importa `financial-entries`, `research.md` R9 da spec) |
| `reports/` | `GET` `v1/reports/income-statement` (DRE), `GET` `v1/reports/cost-centers` (análise por centro de custo) | Só leitura, `org.view`. Sem paginação (volume limitado ao tamanho do cadastro, não ao histórico de lançamentos). `from`/`to` obrigatórios (`@IsDateString`); `to < from` → `InvalidReportPeriodError` (422). **DRE reestruturada (2026-08-07, spec `007-financeiro-ajustes-ui` US5):** `GetIncomeStatementUseCase` deixou de devolver `revenue`/`expense` binário — agora devolve `groups[]` (sempre os `FinancialGroup`s `classification=resultado` **com `sign` preenchido**, na ordem fixa de `catalogOrder`, **mesmo os sem lançamento no período** — `totalCents: 0`, nunca omitidos) + `operatingResultCents` (soma de todos os grupos já com o `sign` aplicado, positivo soma/negativo subtrai). Cada grupo carrega as `ChartOfAccount`s que genuinemente existirem nele (`loadChartOfAccountsByGroup` — vários dos 9 grupos têm contas legadas reais além de `Receitas Operacionais`/`Juros e Multas`, não é ficção "só 2 grupos têm sub-categoria" do `data-model.md` original desta spec, corrigido durante a implementação). Grupos fora do modelo de 9 (`sign: null`, inclui os `classification=patrimonial`) não entram no relatório. Centro de custo (`GetCostCenterAnalysisUseCase`, DTO/lógica própria) **não foi tocado** por esta mudança — continua no shape anterior, filtra `FinancialEntry.operation` conforme `type` (`despesa`→`payable`, `receita`→`receivable`); centro de custo não resolvido cai no bucket `"Outros"` (defensivo — `costCenterId` é obrigatório desde `financial-entries`, hoje inatingível na prática). Importa `FinancialGroupsModule`/`ChartOfAccountsModule`/`CostCentersModule` |
| `bank-reconciliation/` | `POST`/`GET` `v1/bank-statements`, `GET` `v1/bank-statements/:id`, `GET` `v1/bank-statements/:id/transactions`, `POST` `v1/bank-statements/:id/transactions/:transactionId/{suggest-matches,reconcile}`; `POST` `v1/bank-statements/preview` (**novo, 2026-08-07**); `POST` `v1/bank-statements/:id/transactions/:transactionId/reconcile/undo` (**novo, 2026-08-09, spec `007-financeiro-ajustes-ui` US10**); `POST` `v1/bank-statements/:id/transactions/:transactionId/discard` e `POST` `v1/bank-statements/:id/transactions/:transactionId/create-entry` (**novos, 2026-08-10, fecha US3/US5/US6 de `006-bank-reconciliation` — ver histórico**); `GET` `v1/bank-statements/:id/transactions/:transactionId/eligible-entries` (**novo, 2026-08-11, research.md D17 — ver histórico**) | Importação de extrato OFX (`ofx-parser.ts`, charset CP1252/UTF-8/ISO-8859-1 + OFX 1.x SGML/2.x XML) + conciliação com `FinancialEntry`. **`bankAccountId` de `BankStatement`/`BankStatementTransaction` é opcional desde `007-financeiro-ajustes-ui` FR-007** (migration `20260807173058_make_bank_statement_account_optional`, aditiva) — ausente no `POST`, o use case tenta resolver sozinho pelo `BANKACCTFROM.BANKID` do arquivo via `resolveBankAccountByCode` (`BankAccountRepository.findActiveByBankCode`): exatamente 1 conta ativa da organização com esse `bankCode` resolve automaticamente, 0 ou 2+ deixam `bankAccountId: null` sem bloquear a importação. `POST .../preview` (multipart, mesmo arquivo) só faz o parse e devolve `{bankCode, suggestedBankAccountId}`, sem persistir — existe para o diálogo do frontend pré-selecionar a conta antes da confirmação. **Dedupe de transações duplicadas passou de escopo "por conta" para "por organização"** (`@@unique([organizationId, dedupeKey])`, era `(bankAccountId, dedupeKey)`) — `computeDedupeKey` (`domain/services/dedupe-key.ts`) agora namespaceia a chave por `bankCode:accountNumber` do próprio arquivo antes de aplicar o `FITID`/hash, para não colidir entre contas diferentes da mesma organização (achado do gate `database-reviewer` na migration). `suggest-matches` busca candidatos na organização inteira (`bankAccountId: undefined` no critério) quando a transação não tem conta resolvida. **`.../reconcile/undo` (2026-08-09, US10):** `UndoReconciliationUseCase` fecha um gap pré-existente — o frontend já chamava esta rota e `BankStatementTransaction.undoReconciliation()` já existia, mas não havia use-case/controller ligando os dois. Exige `status === 'reconciled'` (senão `BankStatementTransactionNotReconciledError`, 422, mesmo fallback dos demais erros de precondição de `reconcile-transaction`); volta a transação para `pending` e **hard-deleta** os `BankStatementMatch` da transação (`deleteByTransactionId` — o vínculo só existe enquanto ativo, D6 de `006-bank-reconciliation`); recalcula os contadores do `BankStatement` (`withRecalculatedCounts`, mesmo padrão de `reconcile-transaction`). **Não remove** o `FinancialEntryPayment` criado pela conciliação original — fica como pagamento manual no lançamento até ajuste do usuário (decisão de menor risco, `research.md`/`contracts/financial-entry-delete-guard.md` da spec). **`.../discard` (2026-08-10, US6):** `DiscardTransactionUseCase` — só `pending → discarded` (senão `BankStatementTransactionNotPendingError`, 422); transação já conciliada precisa de `.../reconcile/undo` primeiro (decisão de `/speckit-clarify` 2026-08-10: sem "desfazer implícito" dentro do excluir). **`.../create-entry` (2026-08-10, US5):** `CreateEntryFromTransactionUseCase` — cria o `FinancialEntry` (`operation`/`amountCents`/datas sempre derivados da transação, nunca do corpo) + `addPayment()` antes do 1º `save()` (research.md D9) + 1 `BankStatementMatch`, tudo numa operação; **corpo ganhou `chartOfAccountId`/`costCenterId` obrigatórios** (fora do desenho original do `research.md`/`contracts/` — `FinancialEntry.create()` exige ao menos 1 linha de rateio, regra que só existe desde `007-financeiro-ajustes-ui`) **e `bankAccountId` editável** (2026-08-10, `/speckit-clarify` de layout, research.md D14 — pré-preenchido no cliente com a conta do extrato, validado via `assertBankAccountExists`, mas não travado: nem sempre o OFX identifica a conta com certeza; diferente de valor/data/sinal, trocar a conta não afeta a conciliação com a transação de origem); por isso o módulo agora também importa `ChartOfAccountsModule`/`CostCentersModule`. **Spec erp/031 D2 (2026-08-20):** corpo ganha `customerId`/`supplierId` opcionais (mutuamente exclusivos — `FinancialEntry.create()` já lançava `FinancialEntryPartyConflictError` se os dois viessem preenchidos, só não eram alcançáveis a partir deste endpoint); validados via `assertCustomerExists`/`assertSupplierExists` (mesmos helpers de `create-financial-entry`), por isso o módulo também passa a importar `CustomersModule`/`SuppliersModule`. Antes só havia `partyName` (texto livre, sem vínculo real de cadastro). **`GET .../transactions` ganha `postedFrom`/`postedTo` (2026-08-10, research.md D15):** filtra por `postedAt` (data em que o banco processou), combinável com `status`/`search`; o rótulo é sempre "Período" no frontend, nunca "vencimento" — a transação de extrato não tem esse conceito. **`.../reconcile` ganha ramo de "vínculo apenas" para lançamento `paid` (2026-08-11, research.md D16):** `ReconcileTransactionUseCase` não filtra mais por `entry.status !== 'pending'` — consulta `bankStatementMatchRepository.findActiveFinancialEntryIds` explicitamente (FR-033, deixou de ser implícito por status) e ramifica por `entry.status`: `pending` mantém o `addPayment()` de sempre; `paid` (sem vínculo ativo) exige `entry.payments.length === 1` (senão `FinancialEntryPaymentAmbiguousError`, 422) e cria só o `BankStatementMatch` referenciando o `financialEntryPaymentId` já existente — sem `addPayment()`/`save()` no lançamento, porque a movimentação bancária desse pagamento já existe desde que ele foi registrado (evita duplicar saldo). Novo helper puro `domain/services/eligible-amount.ts` (`calculateEligibleAmountCents`) generaliza "saldo em aberto" (`pending`) vs. "valor total" (`paid`), usado tanto aqui quanto no endpoint novo abaixo. **`GET .../eligible-entries` (2026-08-11, research.md D17):** `SearchEligibleEntriesUseCase` substitui a antiga busca do frontend direto em `GET /v1/financial-entries` (que filtrava `status=pending`, bug relatado pelo usuário) — chama `FinancialEntryRepository.list(...)` sem filtro de status, com os filtros novos de `FinancialEntryListCriteria` (`paidFrom`/`paidTo`/`paymentMethod`/`cardBrand`/`supplierId`, sobre a relação `payments`), exclui explicitamente os `financialEntryId` já vinculados, e devolve `eligibleAmountCents` calculado por `calculateEligibleAmountCents`. `bankAccountId` nunca vem do cliente — sempre o do `BankStatement` (FR-037), `undefined` quando o extrato não tem conta resolvida (busca na organização inteira, mesmo padrão de `suggest-matches`). Importa `FinancialEntriesModule` (via `forwardRef`, ver bloco `financial-entries` acima)/`BankAccountsModule`/`ChartOfAccountsModule`/`CostCentersModule` |

**Motor de recebíveis do contrato de cartões (`specs/erp/005-card-receivables-engine/`,
2026-08-06).** `PrismaSaleOrderRepository.maybeCreateReceivable` deixou de
gerar sempre **1** `FinancialEntry` bruto por pedido — agora itera
`saleOrder.payments` e trata cada um conforme `cardPaymentType`:

- **Pagamento em cartão/Pix** (`cardPaymentType` setado): resolve o contrato +
  método aplicável (`sales/infrastructure/database/resolve-card-settlement.ts`,
  Prisma direto — busca `CardContract` por `organizationId`+`bankAccountId`+
  `active=true`+`deletedAt=null`, depois `CardPaymentMethod` por `type`+`brand`
  exatos) e calcula com `calculateCardSettlement`
  (`finance/card-contracts/domain/services/card-settlement-calculator.ts` —
  **função pura**, sem Prisma/NestJS: taxa efetiva via faixa progressiva ou
  taxa base, valor líquido, datas via `business-day-calendar.ts`). Gera 1
  `FinancialEntry` por parcela — `paidCents=0`, `status=pending`,
  `grossAmountCents`/`acquirerFeeCents`/`cardContractId`/`cardPaymentMethodId`/
  `saleOrderPaymentId`/`installmentSequence`/`installmentCount` preenchidos,
  `bankAccountId` = conta do contrato.
- **Sem contrato/método correspondente** (ou qualquer erro na resolução/
  cálculo — ex.: faixa progressiva sem cobertura): fallback para **1**
  `FinancialEntry` no formato antigo (bruto, `paidCents=amountCents`,
  `status=paid`, `dueDate=hoje`) com `cardSettlementFallback=true` — a venda
  **nunca falha** por causa do motor.
- **Pagamento sem `cardPaymentType`** (dinheiro/boleto/transferência): somados
  num único `FinancialEntry` agregado, no formato de sempre — só quando a soma
  é > 0. Um pedido pago 100% em dinheiro continua gerando **exatamente 1**
  `FinancialEntry`, idêntico ao comportamento anterior a esta entrega (zero
  regressão).

Idempotente por `(saleOrderPaymentId, installmentSequence)` para as entradas
do motor (índice único no schema) e por `saleOrderId` (sem
`saleOrderPaymentId`) para o agregado — checagem feita 1x no início do método
(`financialEntry.findMany` + `Set` em memória), não por linha. Depende de
`payment.id` ser estável entre saves — só é, na prática, porque
`UpdateSaleOrderStatusUseCase` (o único caminho que fecha um pedido já
existente) nunca reescreve `payments` (`updateStatus()` espalha `this.props`
sem tocar neles) e `UpdateSaleOrderUseCase` (PUT completo) já bloqueia edição
pós-fechamento via `SaleOrderAlreadyClosedError` — `saveWithOptionalMovement`
resolve o id de cada pagamento (`payment.id ?? randomUUID()`) **uma única vez**
e reaproveita o mesmo valor tanto na gravação de `SaleOrderPayment` quanto no
motor, para não divergir.

Continua criando a `FinancialEntryAllocation` de 100% (conta
`vendas-mercadorias` + centro `comercial`, por `systemKey`) para cada
`FinancialEntry` gerado — sem essa linha o lançamento ficaria sem
categoria/DRE. `BankTransaction` de crédito só é criada quando `paidCents > 0`
(um recebível pendente do motor ainda não é dinheiro em conta — diferente do
comportamento anterior, em que todo recebível nascia já quitado).

Sem model novo: `SaleOrderPayment` ganha `cardPaymentType?`/`brand?`/
`installments?`; `FinancialEntry` ganha os 8 campos citados acima + índice
`@@unique([saleOrderPaymentId, installmentSequence])` — migration
`20260806140000_add_card_settlement_engine`, gerada via `prisma migrate diff`
(ambiente não-interativo não suporta `migrate dev`, ver §5 dev workflow) e
aplicada com `db:migrate:deploy`. `resolveCardSettlement` filtra
`active=true` **e** `deletedAt=null` explicitamente — a listagem de
`card-contracts` só filtra por `deletedAt` (abas Ativos/Excluídos), então um
contrato inativado mas não excluído não é considerado aplicável aqui.
**Fora de escopo desta entrega** (documentado no spec, não implementado):
`cutoffPeriod`, `anticipationPeriods`/`anticipationRate`, agrupamento
(`grouping`, sem efeito nos dados — nenhuma estrutura de "lote de repasse"
criada), suporte a `voucher`, interruptor de ativação por organização, taxa da
adquirente como lançamento de despesa separado (fica só como campo
rastreável), cálculo de dia útil sem calendário de feriados (considera só
segunda–sexta), e recálculo retroativo de vendas fechadas antes desta entrega.
**Achado durante a documentação desta entrega** (campos que já existiam no
cadastro e continuam sem consumidor, não cobertos pelo spec original):
`CardContract.depositFeeCents` (distinto de `CardPaymentMethod.feeCents`, esse
sim aplicado), `allEntriesPaidInContract`, `businessDaysDeposit` (distinto de
`CardContract.businessDaysOnly`, esse sim aplicado), e
`CardPaymentMethod.minInstallments`/`maxInstallments` (cadastráveis, mas
`resolveCardSettlement` não valida se `payment.installments` está dentro da
faixa do método resolvido) — sinalizados no `card-contract-form-view.tsx`
(`erp-web`) e no `GUIA.md` da feature, não implementados.

Testes: `card-settlement-calculator.spec.ts` (7) + `business-day-calendar.spec.ts`
(9), unitários, sem Prisma. `prisma-sale-order.repository.card-settlement.spec.ts`
(11) é o **primeiro teste do `erp-api` a rodar contra Postgres real** — não
havia precedente no repositório; confirmado que `tenant-scope.extension.ts`
não exige contexto de tenant fora de requisição HTTP (`getTenantScopeState()`
devolve `{kind:'absent'}` e a query passa sem filtro), então nenhuma
configuração extra de `AsyncLocalStorage` foi necessária — só `new
PrismaService()` direto no teste. Cada teste usa sua própria `BankAccount`
(helper `createBankAccount()` no spec): como a resolução busca entre *todos*
os contratos ativos de uma conta, reaproveitar a mesma conta entre testes faz
um contrato de um teste "vazar" e ser escolhido no lugar do que outro teste
acabou de criar (o mais antigo por `createdAt` vence, D6) — achado real
durante a escrita dos testes, não um problema no motor em si.

### Stock — depósitos (`modules/stock`)

Cadastro de espaços de armazenagem. Submódulo `suppliers/` permanece com rotas `/v1/suppliers` inalteradas.

| Método | Rota (base `/api/`) | Use case | Permissão | Notas |
| ------ | ------------------- | -------- | --------- | ----- |
| `GET`    | `v1/stocks`     | ListStocks    | `org.view` | `search`, `page`, `perPage` (teto 100) |
| `GET`    | `v1/stocks/:id` | FindStockById | `org.view` | 404 se outra organização |
| `POST`   | `v1/stocks`     | CreateStock   | `store.stock.manage` | `isDefault=false`; 404 unidade inválida |
| `PATCH`  | `v1/stocks/:id` | UpdateStock   | `store.stock.manage` | substitui `branchIds` |
| `DELETE` | `v1/stocks/:id` | DeleteStock   | `store.stock.manage` | hard-delete · **409** se `isDefault` **ou** `hasMovements` |

Presenter: `branchIds`, `isDefault`, `hasMovements` (via `StockMovementRepository.hasMovementsOrBalance`, `EXISTS` no Prisma). `DeleteStock` bloqueia com **409** (`StockNotRemovableError`) se `isDefault` **ou** se `hasMovements`. Front mapeia `branchIds` ↔ `unitIds`.

### Movement categories — categorias de movimentação (`modules/stock`)

Cadastro do lojista que alimenta o select do **lançamento manual** de movimentação. O seed provisiona 10 categorias com `systemKey` + `isSystem=true` (não removíveis), mas elas são só ponto de partida: **nenhum fluxo automático as procura** desde que o motivo virou enum (ver "Motivo do movimento" abaixo) — `MovementCategoryRepository.findBySystemKey` foi removido junto.

| Método | Rota (base `/api/`) | Use case | Permissão | Notas |
| ------ | ------------------- | -------- | --------- | ----- |
| `GET`    | `v1/movement-categories` | ListMovementCategories | `org.view` | `search` (nome/código), `type` (`entrada`\|`saida`), `page`, `perPage`; ordem `code` ASC |
| `POST`   | `v1/movement-categories` | CreateMovementCategory | `store.stock.manage` | gera `code` `CM-NNN`; `isSystem=false`; exige ≥1 `branchId` |
| `GET`    | `v1/movement-categories/options` | ListMovementCategoryOptions | `org.view` | `{ id, name, type }[]`; filtro opcional `type`; ordem nome — **antes** de `:id` |
| `GET`    | `v1/movement-categories/:id` | FindMovementCategoryById | `org.view` | 404 se outra organização |
| `PATCH`  | `v1/movement-categories/:id` | UpdateMovementCategory | `store.stock.manage` | `isSystem`: `type`/`code`/`systemKey` imutáveis (400 `ImmutableField`); nome e `branchIds` editáveis |
| `DELETE` | `v1/movement-categories/:id` | DeleteMovementCategory | `store.stock.manage` | hard-delete · **409** se `isSystem` |

Presenter: `branchIds`, `isSystem`, `systemKey` (nullable). Front mapeia `branchIds` ↔ `unitIds`.

### Stock movements — ledger de movimentações + saldo (`modules/stock`, Fase 3)

Ledger **imutável** (`StockMovement` + `StockMovementLine`, `create`-only — sem update/delete; correções são novos movimentos) e `StockBalance` (saldo por depósito × produto, `Decimal(18,6)`, atualizado só na transação de `createWithBalances` / inventário / transferência). Só produtos com `trackStock=true` podem movimentar (`ProductNotTrackableError`, 422); **saída pode deixar saldo negativo** (política deliberada — PDV só sinaliza visualmente “Sem estoque”; CHECK `stock_balances_quantity_non_negative` removido em `20260812210000_allow_negative_stock_balance`). `sourceType` fixo em `manual` na criação via API HTTP; inventário grava `sourceType=inventory` + `sourceId`; transferência grava `sourceType=transfer` + `sourceId`; compras gravam `sourceType=purchase` + `sourceId`; produção grava `sourceType=production` + `sourceId`. `createdByUserId` vem do `@Actor()`.

**Motivo do movimento (`reason`).** O porquê de o estoque mexer é o enum `StockMovementReason` (`domain/entities/stock-movement-reason.ts`), derivado do par (`sourceType`, `type`) que a movimentação já grava — `sale`, `purchase_entry`, `production_in/out`, `transfer_in/out`, `inventory_in/out`, `manual`. **`categoryId` é nulo em todo fluxo automático** e obrigatório só quando `sourceType=manual` (invariante da entidade); nesse caso a categoria deve ter o mesmo `type` da movimentação (`MovementCategoryTypeMismatchError`, 422). Isso substituiu o `findBySystemKey` por categoria: antes, uma organização sem a linha certa em `movement_categories` derrubava o fechamento de pedido com 404.

| Método | Rota (base `/api/`) | Use case | Permissão | Notas |
| ------ | ------------------- | -------- | --------- | ----- |
| `GET`    | `v1/stock-movements`     | ListStockMovements    | `org.view` | `tab` (`all`\|`entrada`\|`saida`), `search`, `reason` (enum), `page`, `perPage`; devolve `tabCounts` (ignora `search`) |
| `POST`   | `v1/stock-movements`     | CreateStockMovement   | `store.stock.manage` | só lançamento manual ⇒ `categoryId` obrigatório. body: `stockId`, `categoryId`, `type`, `operatedAt`, `lines[]` (`productId`, `quantity` Decimal-string, `costCents` Int); upsert atômico (entrada) / `UPDATE … WHERE quantity >=` (saída); unique `(stockMovementId, productId)`; CHECK `quantity >= 0` |
| `GET`    | `v1/stock-movements/:id` | FindStockMovementById | `org.view` | detalhe com linhas + nomes (depósito/usuário/produto) + `reason`; `categoryName` nulo fora do manual; 404 se outra organização |
| `GET`    | `v1/stocks/:id/balance`  | ListStockBalance      | `org.view` | `search`, `status` (`ok`\|`low`\|`empty`), `page`, `perPage`; `LOW_STOCK_THRESHOLD=5`; item com `hasProductImage` (nunca object key MinIO — paridade catálogo) |
| `GET`    | `v1/stocks/:stockId/products/:productId/movements` | ListProductStockMovements | `org.view` | histórico de linhas do produto naquele depósito, mais recente primeiro |

Rotas fixas sob `v1/stocks/:id/*` (balance, products/:productId/movements, **inventories**) são registradas **antes** de `FindStockByIdRoute` (`:id`) no `stock.module.ts` para não colidir com o parâmetro genérico.

Acesso a produto sem depender do `CatalogModule` (evita import circular, já que `catalog.module.ts` importa `StockModule`): `StockProductLookup` (`domain/repositories/stock-movement.repository.interface.ts`) é implementado por `PrismaStockProductLookup`, que consulta `Product` direto via `PrismaService`.

### Inventories — contagem física (`modules/stock`, Fase 4)

`Inventory` + `InventoryLine` (`systemQuantity`/`countedQuantity` Decimal). **POST já finaliza** (`status=completed`, `completedAt=now`) e, na **mesma transação**, aplica deltas no ledger: `diff = counted − system` (servidor captura `system` do `StockBalance`); `>0` → movimento de entrada (`reason=inventory_in`); `<0` → saída (`reason=inventory_out`); `=0` → só snapshot. Até **2** `StockMovement` por inventário (`sourceType=inventory`, `sourceId=inventoryId`, `costCents=0`, sem categoria). Sem rota `finalize` nesta fase (schema mantém `open` para rascunho futuro). Só `trackStock=true`.

| Método | Rota (base `/api/`) | Use case | Permissão | Notas |
| ------ | ------------------- | -------- | --------- | ----- |
| `GET`    | `v1/stocks/:stockId/inventories` | ListInventories     | `org.view` | `page`/`perPage`; ordem `createdAt` DESC; `itemsCount`/`divergentCount` |
| `POST`   | `v1/stocks/:stockId/inventories` | CreateInventory     | `store.stock.manage` | body: `name`, `lines[]` (`productId`, `countedQuantity` — **sem** `systemQuantity`); 404 stock; 422 produto sem track / linhas vazias |
| `GET`    | `v1/inventories/:id`             | FindInventoryById   | `org.view` | lines + nome/SKU/unit do produto; 404 outra org |

### Stock transfers — remanejamento entre depósitos (`modules/stock`, Fase 5)

`StockTransfer` + `StockTransferLine` (`quantity` Decimal, `batch` opcional texto — **sem** rastreio de saldo). **POST** grava transfer `active` + **2** `StockMovement` na mesma tx (saída no origem / entrada no destino; `sourceType=transfer` ⇒ `reason=transfer_out`/`transfer_in`, `sourceId=transferId`, `costCents=0`, sem categoria); persiste `outboundMovementId` / `inboundMovementId`. **Cancel** = estorno automático (entrada no from + saída no to) + `status=cancelled` + `cancelledAt`; **idempotente** se já cancelado; **409** se saldo no destino insuficiente para estornar. `fromStockId ≠ toStockId`; só `trackStock=true`; `carrierId` opcional com FK simples → `Carrier` (`ON DELETE SET NULL`); create valida existência (não soft-deleted). Sem rota de detalhe nesta fase. Defesa no banco: `CHECK (from_stock_id <> to_stock_id)`, `CHECK (quantity > 0)` nas linhas, unique parcial em `outbound/inbound_movement_id`.

| Método | Rota (base `/api/`) | Use case | Permissão | Notas |
| ------ | ------------------- | -------- | --------- | ----- |
| `GET`    | `v1/stock-transfers`            | ListStockTransfers  | `org.view` | `tab` (`active`\|`cancelled`), `search`, `fromStockId`, `toStockId`, `page`, `perPage`; ordem `operatedAt` DESC; `tabCounts` (ignora search/filtros de depósito); presenter com `fromStockName`/`toStockName` |
| `POST`   | `v1/stock-transfers`            | CreateStockTransfer | `store.stock.manage` | body: `fromStockId`, `toStockId`, `operatedAt`, `carrierId?`, `responsibleName`, `notes?`, `lines[]` (`productId`, `quantity`, `batch?`); 422 same-stock / linhas vazias / produto sem track; 409 saldo insuficiente |
| `POST`   | `v1/stock-transfers/:id/cancel` | CancelStockTransfer | `store.stock.manage` | estorno + cancelled; 404 outra org; 409 destino sem saldo |

### Suppliers — fornecedores (`modules/stock/suppliers`)

Rotas **organization-scoped** (`X-Organization-Id`), no molde da `tenancy`.

| Método | Rota (base `/api/`) | Use case | Permissão | Notas |
| ------ | ------------------- | -------- | --------- | ----- |
| `GET`    | `v1/suppliers`             | ListSuppliers     | `org.view` | `search`, `tab` (`active`/`deleted`), `page`, `perPage` (teto 100) |
| `GET`    | `v1/suppliers/:id`         | FindSupplierById  | `org.view` | 404 se não existir **ou** for de outra organização · devolve também o excluído (a aba "Excluídos" leva até ele) |
| `POST`   | `v1/suppliers`             | CreateSupplier    | `org.suppliers.manage` | 409 documento repetido (inclui excluídos) · 404 unidade de outra organização · 422 CPF/CNPJ inválido |
| `PUT`    | `v1/suppliers/:id`         | UpdateSupplier    | `org.suppliers.manage` | Semântica PUT: campo omitido é limpo · documento **é** editável (409 só se for de outro fornecedor) |
| `DELETE` | `v1/suppliers/:id`         | DeleteSupplier    | `org.suppliers.manage` | **soft-delete** → `204` |
| `POST`   | `v1/suppliers/:id/restore` | RestoreSupplier   | `org.suppliers.manage` | Idempotente: restaurar quem já está ativo devolve 200 |

**Envelope da listagem** (mesma forma da de produtos):
```jsonc
{
  "data": [ /* SupplierResponse[] */ ],
  "meta": { "total": 8, "page": 1, "perPage": 20, "totalPages": 1 },
  "tabCounts": { "active": 6, "deleted": 2 }
}
```

`tabCounts` conta o cadastro inteiro da organização, **ignorando a busca**
(paridade com o front). `SupplierResponse` espelha o tipo `Supplier` de
`web/src/features/suppliers/types/supplier.ts`, com três diferenças:
`personType` é `PF`/`PJ` (não `fisica`/`juridica`), campos vazios vêm como
`null` (não `""`) e as unidades atendidas chamam-se `branchIds` (não `unitIds`)
— o mapper do front converte, como já faz em produtos.

### Carriers — transportadoras (`modules/stock/carriers`)

Réplica estrutural de `suppliers` (mesmo molde de pastas, mesma checagem de
unidade via `assertBranchesBelongToOrganization` reexportada de `suppliers`),
adaptada para os campos de transportadora: sem `sufamaRegistration` /
`foundationDate` / `note`; com `deliveryType` (`transportadora`/`entregador`),
`icmsExempt` e `registerInNfe`.

| Método | Rota (base `/api/`) | Use case | Permissão | Notas |
| ------ | ------------------- | -------- | --------- | ----- |
| `GET`    | `v1/carriers`             | ListCarriers     | `org.view` | `search`, `tab` (`active`/`deleted`), `page`, `perPage` (teto 100) |
| `GET`    | `v1/carriers/:id`         | FindCarrierById  | `org.view` | 404 se não existir **ou** for de outra organização · devolve também a excluída (a aba "Excluídas" leva até ela) |
| `POST`   | `v1/carriers`             | CreateCarrier    | `store.stock.manage` | 409 documento repetido (inclui excluídas) · 404 unidade de outra organização · 422 CPF/CNPJ inválido |
| `PUT`    | `v1/carriers/:id`         | UpdateCarrier    | `store.stock.manage` | Semântica PUT: campo omitido é limpo · documento **é** editável (409 só se for de outra transportadora) |
| `DELETE` | `v1/carriers/:id`         | DeleteCarrier    | `store.stock.manage` | **soft-delete** → `204` |
| `POST`   | `v1/carriers/:id/restore` | RestoreCarrier   | `store.stock.manage` | Idempotente: restaurar quem já está ativa devolve 200 |

**Envelope da listagem** (mesma forma da de fornecedores):
```jsonc
{
  "data": [ /* CarrierResponse[] */ ],
  "meta": { "total": 3, "page": 1, "perPage": 20, "totalPages": 1 },
  "tabCounts": { "active": 2, "deleted": 1 }
}
```

`tabCounts` conta o cadastro inteiro da organização, **ignorando a busca**.
`CarrierResponse`: `personType` (`PF`/`PJ`), `deliveryType`
(`transportadora`/`entregador`), campos vazios como `null`, unidades atendidas
em `branchIds`.

### Purchases — compras de fornecedor (`modules/stock`, Fase 7)

`Purchase` + `PurchaseLine` (flat sob `modules/stock`, como inventário/transferências — não em subpasta própria). **Sem pagamento** nesta fase (fica em outro módulo). Ao salvar (create **ou** update — PUT sempre substitui o conjunto de linhas) com `deliveryStatus=received` e ao menos 1 linha `status=received`, gera **no máximo 1** `StockMovement` de entrada (`sourceType=purchase` ⇒ `reason=purchase_entry`, sem categoria, `sourceId=purchase.id`, `costCents` das linhas, `operatedAt=purchasedAt` ao meio-dia UTC) e grava `stockMovementId` na mesma transação — idempotente: se já houver `stockMovementId`, nunca gera de novo, mesmo que o PUT seguinte ainda venha `received`. `DELETE` é **soft-delete** (`deletedAt`) **sem estornar** o movimento já gerado; `POST :id/restore` limpa `deletedAt` (idempotente se já ativa) e também **não** mexe no ledger — ajustar o saldo depois é operação manual à parte. Valida `stockId`, `supplierId` (não excluído) e `carrierId` opcional (não excluído); linhas exigem `productId` único, `trackStock=true`, `quantity` Decimal-string `> 0`, `costCents ≥ 0`.

| Método | Rota (base `/api/`) | Use case | Permissão | Notas |
| ------ | ------------------- | -------- | --------- | ----- |
| `GET`    | `v1/purchases`     | ListPurchases     | `org.view` | `tab` (`active`\|`deleted`), `status` (`all`\|`pending`\|`received`), `search`, `stockId`, `supplierId`, `dateFrom`, `dateTo`, `page`, `perPage`; ordem `purchasedAt` DESC; `tabCounts` (ignora os demais filtros) |
| `POST`   | `v1/purchases`     | CreatePurchase    | `store.stock.manage` | body: `stockId`, `supplierId`, `carrierId?`, `deliveryStatus`, `purchasedAt`, `series?`, `invoiceNumber?`, `notes?`, `freightCents?`, `discountsCents?`, `otherExpensesCents?`, `lines[]` (`productId`, `quantity`, `costCents`, `status?`); 404 estoque/fornecedor/transportadora; 422 produto sem track ou linhas vazias |
| `GET`    | `v1/purchases/:id` | FindPurchaseById  | `org.view` | detalhe com `stockName`/`supplierName`/`carrierName` + linhas com nome/SKU do produto; devolve também a excluída |
| `PUT`    | `v1/purchases/:id` | UpdatePurchase    | `store.stock.manage` | mesmo body do create; substitui as linhas; gera o movimento na 1ª vez `received`+linha recebida; **409/erro de domínio** se já existe `stockMovementId` (`PurchaseAlreadyReceivedError`) |
| `DELETE` | `v1/purchases/:id`         | DeletePurchase    | `store.stock.manage` | **soft-delete** → `204`; não estorna o movimento de entrada já gerado |
| `POST`   | `v1/purchases/:id/restore` | RestorePurchase   | `store.stock.manage` | Idempotente: restaurar quem já está ativa devolve 200; sem efeito no ledger |

`createdByUserId` do movimento vem do `@Actor()` da rota (create/update), não é campo do model `Purchase`. `PurchaseRepository.saveWithOptionalMovement(purchase, movement | null)` grava documento + linhas + (se houver) o `StockMovement` na mesma transação (`persistStockMovementInTx`, reexportado dos outros módulos de ledger).

### Production orders — ordens de produção (`modules/stock`, Fase 8)

`ProductionOrder` + `ProductionHistoryEntry` (flat sob `modules/stock`, como compras/transferências — sem subpasta própria). Consome os insumos da **ficha técnica ao vivo** (`TechnicalSheet` do `catalog`, `productionType=productive_process`) — a ordem nunca copia a receita, `ProductionBomLookup` lê a ficha atual a cada chamada. Origem e destino **podem** ser o mesmo depósito (produzir "no lugar" é cenário legítimo, diferente de `StockTransfer`). Fluxo de status: `pending → in_progress → completed`, com `cancelled` a partir de `pending`/`in_progress`. `POST :id/start` e `POST :id/cancel` só atualizam estado + histórico (sem ledger); **`POST :id/finalize`** é quem gera o(s) `StockMovement`: saída dos insumos (se a ficha tiver componentes) no depósito de origem + entrada do produto acabado no depósito de destino, ambos `sourceType=production` (⇒ `reason=production_out`/`production_in`, sem categoria), `sourceId=order.id`, na mesma transação (`persistStockMovementInTx`). Custo da entrada = custo total dos insumos ÷ quantidade produzida (sem componentes, custo `0`). `finalize`/`cancel` são **idempotentes**: repetir sobre uma ordem já `completed`/`cancelled` devolve a ordem como está, sem novo evento de histórico nem novo movimento.

| Método | Rota (base `/api/`) | Use case | Permissão | Notas |
| ------ | ------------------- | -------- | --------- | ----- |
| `GET`  | `v1/production-orders` | ListProductionOrders | `org.view` | `tab` (`all`\|`pending`\|`in_progress`\|`completed`\|`cancelled`), `search` (id/nome/SKU do produto), `page`, `perPage`; `tabCounts` ignora a busca |
| `POST` | `v1/production-orders` | CreateProductionOrder | `store.stock.manage` | valida depósitos + `ProductionBomLookup` (404 produto/insumo inexistente, 422 sem ficha `productive_process` ou produto `supply`); cria em `pending` |
| `POST` | `v1/production-orders/:id/start` | StartProductionOrder | `store.stock.manage` | `pending → in_progress` |
| `POST` | `v1/production-orders/:id/cancel` | CancelProductionOrder | `store.stock.manage` | `pending`/`in_progress` → `cancelled`; idempotente |
| `POST` | `v1/production-orders/:id/finalize` | FinalizeProductionOrder | `store.stock.manage` | body `{ producedQuantity, observation? }`; gera os movimentos do ledger; idempotente |
| `GET`  | `v1/production-orders/:id/history` | ListProductionHistory | `org.view` | timeline (`system` + `comment`), mais antigo primeiro |
| `POST` | `v1/production-orders/:id/history` | AddProductionHistoryComment | `store.stock.manage` | body `{ description }`; sempre `kind=comment`, `title` fixo ("Comentário") |
| `GET`  | `v1/production-orders/:id` | FindProductionOrderById | `org.view` | detalhe com nomes de produto/depósitos + `insumos` calculados (BOM × quantidade produzida ou planejada) |

`userName` da timeline vem de `resolveActorName(actor)` (`infrastructure/http/routes/shared/resolve-actor-name.ts`): `actor.name` → `actor.email` → `'Usuário'`. Rotas fixas (`:id/start`, `:id/cancel`, `:id/finalize`, `:id/history`) registradas **antes** de `FindProductionOrderByIdRoute` (`:id`) no `stock.module.ts`.

### Catalog — produtos (`modules/catalog`)

| Método | Rota (base `/api/`) | Use case | Notas |
| ------ | ------------------- | -------- | ----- |
| `GET`    | `v1/products`             | ListProducts       | `page`, `perPage` (teto 100), `tab`, `search`, `sort` (incl. **`stock_asc`/`stock_desc`** reais), `types`, `variants`, `categories`, **`branchId`** (ou `X-Branch-Id`), **`trackStock`**, **`stock`** (`in_stock` \| `out_of_stock` — saldo agregado server-side), **`availableOnErp`**, **`availableOnPdv`** (boolean; omitidos = sem filtro). Pickers de venda no FE: `availableOnErp=true` |
| `GET`    | `v1/products/import/template` | GetProductImportTemplate | XLSX de template (download) · `store.catalog.manage` |
| `POST`   | `v1/products/import`      | ImportProducts     | multipart `file` (máx. 5 MB / 500 linhas) · `{ data: { created, failed, errors[{row,message}] } }` · categoria por nome (case-insensitive, **sem** auto-criar) · `branchIds` = `X-Branch-Id` se presente |
| `GET`    | `v1/products/:id`         | FindProductById    | 404 se não existir ou for de outra loja |
| `POST`   | `v1/products`             | CreateProduct      | 409 SKU repetido (na **empresa**) · 404 categoria/unidade/filial/fornecedor/variação/opção · aceita `branchIds`, `suppliers`, `variationFormat`, `variations`, **`availableOnErp`/`availableOnPdv`** (default true) |
| `PUT`    | `v1/products/:id`         | UpdateProduct      | 409 só se o SKU pertencer a **outro** produto · substitui `branchIds`, `suppliers` e `variations` · sincroniza `hasVariants`/`variantsCount` · flags de disponibilidade |
| `POST`   | `v1/products/:id/duplicate` | DuplicateProduct | Clona escalares + branches + barcodes + adicionais/sugestões · **sem** imagem MinIO · SKU `{sku}-COPIA` (+ `-N` se conflito) · nome `{name} (cópia)` · `store.catalog.manage` |
| `DELETE` | `v1/products/:id`         | DeleteProduct      | **soft-delete** → `204` |
| `POST`   | `v1/products/:id/restore` | RestoreProduct     | devolve o produto às abas ativas |
| `POST`   | `v1/products/bulk-delete` | BulkDeleteProducts | soft-delete em lote → `{ data: { affected } }` |
| `POST`   | `v1/products/:id/image`   | UploadProductImage | multipart `file` (PNG/JPEG/WebP, máx 4 MB) · grava object key em `imageUrl` |
| `GET`    | `v1/products/:id/image`   | GetProductImage    | stream do buffer (`Content-Type` do objeto) · 404 se sem imagem |
| `DELETE` | `v1/products/:id/image`   | DeleteProductImage | remove objeto no MinIO + limpa a key |
| `GET`    | `v1/product-categories`   | ListProductCategories | `?active=true` (dropdown) · `page`/`perPage`/`search` (tela de categorias) |
| `POST`   | `v1/product-categories`   | CreateProductCategory | 409 nome duplicado |
| `PUT`    | `v1/product-categories/:id` | UpdateProductCategory | 404 · 409 nome duplicado |
| `DELETE` | `v1/product-categories/:id` | DeleteProductCategory | 404 · 409 se houver produtos vinculados |
| `GET`    | `v1/units-of-measure`     | ListUnitsOfMeasure    | `?active=true` (dropdown) · `page`/`perPage`/`search` (tela de cadastro) |
| `POST`   | `v1/units-of-measure`     | CreateUnitOfMeasure   | 409 sigla duplicada (case-insensitive, por organização) |
| `PUT`    | `v1/units-of-measure/:id`  | UpdateUnitOfMeasure   | 404 · 409 sigla duplicada |
| `DELETE` | `v1/units-of-measure/:id` | DeleteUnitOfMeasure   | 404 · 409 se houver produto vinculado (`UnitOfMeasureInUseError`) |
| `GET`    | `v1/variations`           | ListVariations        | Sem `page`/`perPage` = lista simples (drawer) · com paginação = tela de cadastro · `search` |
| `GET`    | `v1/variations/:id`       | FindVariationById     | 404 |
| `POST`   | `v1/variations`           | CreateVariation       | nome + cálculo + opções (preço em centavos) |
| `PUT`    | `v1/variations/:id`       | UpdateVariation       | substitui conjunto de opções (preserva ids enviados) |
| `DELETE` | `v1/variations/:id`       | DeleteVariation       | 404 · 409 se houver produto vinculado (`VariationInUseError`) |
| `POST`/`GET`/`DELETE` | `v1/variations/:variationId/options/:optionId/image` | Upload/Get/DeleteVariationOptionImage | MinIO · key `{org}/catalogo/variations/{variationId}/options/{optionId}.{ext}` · atualiza `VariationOption.imageUrl` |
| `GET`    | `v1/price-lists`          | ListPriceLists        | `page`/`perPage`/`search` · inclui `productCount` |
| `GET`    | `v1/price-lists/:id`      | FindPriceListById     | 404 |
| `POST`   | `v1/price-lists`          | CreatePriceList       | `priority` = max+1 · 409 nome duplicado |
| `PUT`    | `v1/price-lists/:id`      | UpdatePriceList       | metadados · 404 · 409 nome |
| `DELETE` | `v1/price-lists/:id`      | DeletePriceList       | **hard delete** + cascade itens → `204` |
| `PUT`    | `v1/price-lists/reorder`  | ReorderPriceLists     | `{ orderedIds }` · rota fixa antes de `:id` |
| `GET`    | `v1/price-lists/:id/items` | GetPriceListItems    | `{ data: [{ productId, priceCents }] }` |
| `PUT`    | `v1/price-lists/:id/items` | ReplacePriceListItems | **substitui** o conjunto · valida produtos da org |
| `GET`    | `v1/fiscal-parameters`     | ListFiscalParameters  | `page`/`perPage`/`search`/`tab`/`category`/`categories`/`sort`/`statuses` · `tabCounts` |
| `GET`    | `v1/fiscal-parameters/:productId` | FindFiscalParametersByProductId | 404 se produto inexistente · sem ficha → payload vazio + units das branches |
| `PUT`    | `v1/fiscal-parameters/:productId` | UpsertFiscalParameters | upsert ficha + **substitui** overrides `ProductFiscalBranch` |
| `GET`    | `v1/technical-sheets`     | ListTechnicalSheets   | `page`/`perPage`/`search`/`tab`/`category`/`categories`/`productionTypes`/`sort` · `tabCounts` (`all` \| `production`) |
| `GET`    | `v1/technical-sheets/:productId` | FindTechnicalSheetByProductId | 404 se produto inválido/supply · sem ficha → defaults vazios + `currentPriceCents` |
| `PUT`    | `v1/technical-sheets/:productId` | UpsertTechnicalSheet | upsert ficha + **substitui** linhas base/option · `applyBasePriceCents?` atualiza `Product.basePriceCents` |
| `GET`    | `v1/product-addons`       | ListProductAddons     | Sem `page`/`perPage` = lista simples (seletor da aba Adicionais) · com paginação = tela futura · `?active=false` traz também os excluídos (default: só ativos) |
| `POST`   | `v1/product-addons`       | CreateProductAddon    | 409 nome duplicado (case-insensitive, entre ativos) |
| `PUT`    | `v1/product-addons/:id`   | UpdateProductAddon    | 404 · 409 nome duplicado |
| `DELETE` | `v1/product-addons/:id`   | DeleteProductAddon    | **soft-delete** → `204` (sem restore nesta fatia) — vínculos já existentes em produtos permanecem |

**Listas de preço (dentro de `catalog`):** models `PriceList` / `PriceListItem` +
enum `PriceAdjustmentType`. Escopo `organizationId`. Canais = `String[]` de códigos
(`pdv`, `delivery`, `marketplace`, `cardapio`). Dinheiro em **centavos**;
`adjustmentValue` = % nos tipos percentuais, centavos em `fixed_over_base`, `0` em
`manual`. Sem `@RequirePermission` nesta fatia (auth + tenant apenas).
`ProductResponse.priceLists` = **nomes** das listas que contêm o produto.
A API **não** recalcula ajuste — o client envia `priceCents` já resolvido.

**Parâmetros fiscais (dentro de `catalog`):** models `ProductFiscal` (1:1 com
`Product`) + `ProductFiscalBranch` (overrides por unidade). Códigos fiscais
(NCM, CST, ICMS…) = `String`; pesos/FCP = `Decimal`. `configured` = existe ficha
**e** `ncm`/`origin` não vazios. Body PUT: `{ info, group, units[{ branchId, … }] }`.
Sem `@RequirePermission` nesta fatia. Catálogo de opções do select permanece no web.
**Imagem na listagem/detalhe:** `imageUrl: null` + `hasImage` (`toProductImageFlags`),
igual ao `ProductResponse` — nunca a object key do MinIO.

**Fichas técnicas / BOM (dentro de `catalog`):** models `TechnicalSheet` (1:1 com
produto acabado) + `TechnicalSheetComponent` (composição base) +
`TechnicalSheetOptionComponent` (composição por opção de variação) + enum
`ProductionType` (`automatic` \| `productive_process`). Insumos = `Product` com
`type = supply` da mesma org. Custo unitário **lido** de `Product.basePriceCents`
do supply (não persistido na linha). Quantidade `Decimal(18,6)`;
`markupPercent` na ficha. Produto elegível = `type ≠ supply` e `deletedAt IS NULL`.
Composição por opção só se `productionType === automatic`. TENANT_SCOPED.
Sem `@RequirePermission` nesta fatia (paridade fiscais). Consumo no módulo
Produção (estoque) fica fora deste escopo. **Imagem na listagem/detalhe:**
mesmo contrato de produtos — `imageUrl: null` + `hasImage` (`toProductImageFlags`);
a object key **não** vazará na response.

**Variações (Fase B.1):** models `Variation` / `VariationOption` (template da empresa) +
`ProductVariation` / `ProductVariationOption` (vínculos do produto). `Product.variationFormat`
é `grid` | `composite` | null. Ao salvar o produto, `hasVariants` / `variantsCount` = nº de
vínculos. Payload do produto: `variations: [{ variationId, optionIds, minChoices, maxChoices, optionOverrides }]`.
Preço das opções e overrides em **centavos**. Imagem da opção: upload MinIO em
`POST/GET/DELETE v1/variations/:variationId/options/:optionId/image`.

**Disponibilidade ERP/PDV (2026-08-16):** `Product.availableOnErp` / `availableOnPdv`
(default `true`). Listagem filtra via query params; `GetTerminalCatalogUseCase`
sempre aplica `availableOnPdv=true`. Vendas **não** têm listagem própria de produtos —
pickers usam `GET /v1/products?availableOnErp=true`.

**Adicionais e Sugestões (`specs/erp/008-catalogo-adicionais-sugestoes/`, 2026-08-09):**
mesmo padrão de payload aninhado de `variations` — sem endpoints CRUD por linha,
substituição total (`deleteMany` + `createMany`) na mesma `$transaction` de
`CreateProductUseCase`/`UpdateProductUseCase`. Duas peças distintas:

- **Catálogo de adicionais** (`ProductAddon`, organization-scoped, soft-delete
  sem restore): nome (único por organização, case-insensitive, checado na
  aplicação) + preço padrão em centavos. CRUD próprio em `v1/product-addons`
  (molde `product-categories`) — alimenta o seletor da aba Adicionais do
  produto. Independente de `Product`: não é um item de estoque, é um catálogo
  simples (reflete `MOCK_PRODUCT_ADDONS` do frontend, que também não deriva de
  `MOCK_PRODUCTS`).
- **Config. de adicionais do produto**: `ProductAddonSettings` (1:1 com
  `Product`; `minQuantity`/`maxQuantity`/`chargeFromSelectedQuantity`/
  `chargeFromQuantity`; ausência de linha = defaults `{0, 0, false, 1}`) +
  `ProductAddonLine[]` (produto ↔ `ProductAddon`, com `maxQuantity` e
  `priceCents` **próprios da linha** — o preço é copiado do catálogo só como
  sugestão inicial no frontend e depois congelado no vínculo; mudar o preço
  padrão do catálogo não afeta linhas já salvas). `minQuantity <= maxQuantity`
  e `chargeFromQuantity >= 1` (quando a flag está ativa) são regras de domínio
  via `.refine()` no `ProductZodValidator` → 422. `addonId` duplicado na lista
  → 409 (`ProductAddonDuplicateLineError`); `addonId` inexistente na org → 404.
- **Sugestões**: `ProductSuggestion[]` (produto dono ↔ produto sugerido,
  ambos `Product` reais). Autossugestão → 422
  (`ProductSuggestionSelfReferenceError`); `suggestedProductId` duplicado →
  409 (`ProductSuggestionDuplicateLineError`).
- **Leitura filtra, não cascade:** adicional excluído (soft-delete) ou produto
  sugerido excluído somem do `GET`/`PUT` do produto que os referenciava
  (`addonLines`/`suggestions` no `productInclude` do `PrismaProductRepository`
  filtram `deletedAt IS NULL` no relacionamento), mas a linha em si
  (`ProductAddonLine`/`ProductSuggestion`) permanece no banco — só some
  quando o próprio produto dono é excluído (cascade via FK).
- **Fora de escopo desta fatia:** o frontend (`apps/erp/web`) segue 100% mock
  nas duas abas — ver `apps/erp/web/AGENTS.md` §4.5. Sem tela de cadastro
  dedicada (lista própria no menu) para o catálogo de adicionais; ele é
  gerenciado só via API por ora.

**Envelope da listagem** (política §8.1 do `AGENTS.md` raiz — busca/paginação/ordenação
sempre no banco):
```jsonc
{
  "data": [ /* ProductResponse[] */ ],
  "meta": { "total": 13, "page": 1, "perPage": 10, "totalPages": 2 },
  "tabCounts": { "all": 13, "with_variants": 6, "supplies": 3, "deleted": 2 }
}
```

**Abas:** `all` (não excluídos) · `with_variants` · `supplies` · `deleted`.
`tabCounts` é calculado sobre o catálogo da empresa (ou da **unidade ativa**,
quando `X-Branch-Id`/`branchId` está presente), **ignorando busca e filtros**
da toolbar (paridade com a listagem).

**Aba × filtro combinam com AND.** Uma aba e um filtro podem tocar a mesma coluna
(ex.: `tab=supplies` + `types=simple`); o `where` compõe tudo num `AND`, então a
combinação contraditória devolve lista vazia — nunca linhas a mais.

**`ProductResponse`** espelha o tipo `Product` do front, com diferenças:
`basePriceCents` (centavos), `hasImage` (boolean; a object key **não** vai na
response — `imageUrl` fica `null`), **`stock`** = soma dos `StockBalance` (com
unidade ativa / `branchId`: só depósitos com `StockBranch` dessa unidade; sem
unidade: org inteira; `trackStock=false` → sempre `0`), e `priceLists: string[]`
(nomes das listas que incluem o produto). List/find/create/update/restore/image
enriquecem `stock` via `sumQuantitiesByProductIds`. Sort/filtro por estoque
acontecem no `ListProductsUseCase` (agregação antes da paginação).

### Pos-terminals — cadastro e pareamento de PDV (`modules/pos-terminals`)

Primeiro módulo real da integração PDV↔ERP (ver
`.claude/plans/_platform/pos-terminals-pdv-integration.plan.md`). Terminal é o
dispositivo físico (desktop/tablet) de uma unidade — **organization+branch-scoped**,
molde `customers` para a forma do módulo, mas com **soft-delete sem restore**
nesta fatia (como `branches`, não como `customers`) e **`PATCH` real** em vez do
`PUT` de `branches`/`customers`: campo ausente no corpo não muda, `null`
explícito limpa (`printer`/`scale`/`offlineServerId`).

| Método   | Rota (base `/api/`)          | Use case             | Permissão                 | Notas |
| -------- | ----------------------------- | --------------------- | -------------------------- | ----- |
| `POST`   | `v1/pos-terminals`             | CreatePosTerminal      | `org.pos_terminals.manage` | 422 nome curto/`branchId` ausente · 404 se `branchId` não existir na organização |
| `GET`    | `v1/pos-terminals`             | ListPosTerminals       | `org.view`                 | `search`, `status`, `page`, `perPage` (teto 100) · `MEMBER` só vê terminais das suas unidades (mesmo recorte de `ListBranches`) |
| `GET`    | `v1/pos-terminals/:id`         | FindPosTerminalById    | `org.view`                 | 404 se não existir, for de outra organização, ou estiver excluído (sem restore nesta fatia) |
| `PATCH`  | `v1/pos-terminals/:id`         | UpdatePosTerminal      | `org.pos_terminals.manage` | Semântica **PATCH real**: só os campos enviados mudam |
| `DELETE` | `v1/pos-terminals/:id`         | DeletePosTerminal      | `org.pos_terminals.manage` | Soft-delete → `204`; sem endpoint de restore |
| `POST`   | `v1/pos-terminals/pair/redeem` | RedeemPairingCode      | **`@Public()`** + throttle | **Única rota pública de negócio.** Troca o código por um **device token**; consome o código (uso único de fato: `pairDevice` limpa `pairingCode`). O token sai em claro **uma vez** — o banco guarda SHA-256. Terminal inativo não parea. Resposta inclui `organizationName`/`branchName` para branding do PDV. Todas as falhas devolvem o mesmo erro, para não contar a quem adivinha quais tentativas chegaram perto |
| `POST`   | `v1/pos-terminals/:id/revoke-device` | RevokeDevice     | `org.pos_terminals.manage` | Derruba a credencial; idempotente (revogar quem já não está pareado não é erro) |
| `GET`    | `v1/pos/terminal`              | GetCurrentTerminal     | **`DeviceAuthGuard`**      | "Quem sou eu" do PDV. Inclui `organizationName`/`branchName`. Responde 401 se a credencial foi revogada ou o terminal desativado |
| `POST`   | `v1/pos-terminals/:id/pair`    | GeneratePairingCode    | `org.pos_terminals.manage` | Gera/regenera código opaco de 8 chars (sem caracteres ambíguos), `expiresAt = +15min`; sobrescreve o código anterior (não cumulativo); resposta `{ data: { code, expiresAt } }` — é o único momento em que o código sai da API (o presenter de detalhe/lista só expõe `hasPairingCode`) |

`org.pos_terminals.manage` é concedido a `OWNER`/`ADMIN`, **não** a `MEMBER`
(mesmo padrão de `org.suppliers.manage`/`org.customers.manage`) —
`permissions.ts`. `PosTerminalPairingCodeInvalidError` existe no domínio desde
já, mas nenhum use case desta fatia o lança — é para a futura troca do código
por credencial de longa duração (fatia de autenticação do PDV) poder falhar
com um erro de domínio em vez de inventar um na hora.

### Pos-operators — login de caixa no device (`modules/pos-operators`)

Identidade do caixa = **`Membership`** (código + PIN em `pdvCode`/`pdvPinHash` +
perfil com `pdv.operacao.*`). A tabela `pos_operators` e o CRUD JWT
`/v1/pos-operators` foram **removidos** (2026-08-13). No backoffice: Usuários &
Permissões (`PUT /v1/members/:id` + `PUT /v1/members/:id/pdv-pin`). Supervisor =
permissão fina `pdv.operacao.alcada.authorize` (Caixa seed **não** inclui;
Gerente/Admin sim). Sangria no PDV exige `pdv.operacao.caixa.withdrawal`
(constante `PDV_CAIXA_WITHDRAWAL_PERMISSION`; Caixa seed **não** inclui —
ver store-setup acima).

Script histórico (antes do drop): `pnpm db:migrate:pos-operators-to-memberships`
(`scripts/migrate-pos-operators-to-memberships.ts` — raw SQL; no-op se a tabela
já não existir).

| Método   | Rota (base `/api/`)       | Use case            | Auth | Notas |
| -------- | ------------------------- | ------------------- | ---- | ----- |
| `GET`    | `v1/pos/operators`         | ListTerminalOperators | **`DeviceAuthGuard`** | Memberships elegíveis da unidade do terminal (`id` = **userId**, `permissionIds`) |
| `POST`   | `v1/pos/operators/authenticate` | AuthenticatePosOperator | **`DeviceAuthGuard`** | Código + PIN. Unidade do **terminal**. **401** código/PIN; **423** bloqueado |
| `GET`    | `v1/pos/operators/sync`    | SyncTerminalOperators | **`DeviceAuthGuard`** | ⚠️ **Única rota que devolve `pinHash`** + `permissionIds`; TTL 48 h |
| `GET`    | `v1/pos/sellers`           | ListTerminalSellers | **`DeviceAuthGuard`** | Memberships ativos `isSeller` com acesso à unidade (`id` = **userId**, `code` = `pdvCode` ou `""`) |

**Invariantes que não são óbvias no código:**

0. **Os dois 401 de `v1/pos/*` são distinguíveis pelo `code`.**
   `PosTerminalDeviceUnauthorizedError` (credencial do **dispositivo**: token
   desconhecido, revogado ou terminal desativado) e
   `PosOperatorCredentialsUnauthorizedError` (PIN de **caixa** errado)
   compartilham o status, e o PDV reage de formas opostas — o primeiro despareia
   o terminal e volta para a ativação; o segundo só conta uma tentativa. Por isso
   o `DeviceAuthGuard` lança um **erro de domínio**, não `UnauthorizedException`
   do Nest: só o erro de domínio passa pelo `AppExceptionFilter` e ganha
   `error.code` no envelope. ⚠️ Trocar a classe por `UnauthorizedException` de
   novo quebraria a revogação no app **em silêncio** — a mensagem continuaria
   igual.
1. **`pinHash` sai por uma rota só: `GET v1/pos/operators/sync`.** O
   `PdvCashierPresenter` monta o pacote campo a campo — nunca spread de entidade.
2. **PIN de backoffice só entra por `PUT /v1/members/:id/pdv-pin`.** O body
   aceita `pdvCode` opcional — o create do ERP web manda código + PIN juntos;
   omitir o campo no DTO HTTP faz o ValidationPipe descartar o código e o
   membro nascer sem acesso ao PDV (lista vazia no terminal).
3. **O bloqueio é progressivo e limitado** na entidade `Membership`
   (`MEMBERSHIP_PDV_*`). Três erros abrem o primeiro bloqueio; dobra até 15 min.
4. **Unicidade de `pdvCode`** entre memberships ativos **com PIN** na org
   (validada nos use cases de member).

`PinHasher` (`shared/infra/crypto/pin-hasher.ts`) é o único lugar que conhece o
algoritmo. O valor gravado se descreve sozinho (`scrypt$N$r$p$salt$hash`), então
trocar de algoritmo depois é re-hashear na próxima verificação, sem migration.

⚠️ **O formato é contrato com o PDV desde o M4.** `apps/pdv/app` reimplementa a
*verificação* em Dart (`core/crypto/pdv_pin_hasher.dart`, com `pointycastle`)
para conferir o PIN offline. Ele lê `N`, `r` e `p` do próprio valor gravado, e
não de constantes locais — por isso mudar o custo aqui **não** quebra terminal
nenhum, e hash antigo continua conferindo com os parâmetros com que foi criado.
Trocar de **algoritmo** (Argon2id, por exemplo) é outra história: exige o
espelho do outro lado antes, senão o login offline para. Medição do lado Dart:
**~750 ms com N=65536** num desktop de desenvolvimento — se precisar baixar por
causa de tablet fraco, o parâmetro desce sem migration.

#### Credencial de dispositivo e as duas consultas sem tenant

`DeviceAuthGuard` (`shared/infra/http/guards/`) autentica o **terminal**, não o
usuário: `Authorization: Device <token>`. Use sempre com `@Public()` — o
`@Public()` desliga a cadeia global (`AuthGuard` → `TenantContextGuard` →
`PermissionGuard`) e este guard passa a segurar a porta. Organização e unidade
saem do **terminal**, nunca de header enviado pelo cliente.

⚠️ **`redeem` e a busca do terminal dentro do guard são consultas fora do
escopo de tenant** — por definição, nenhum dos dois sabe a organização antes
de encontrar o terminal. Elas usam `runWithoutTenantScope` (ver
`shared/infra/tenancy/tenant-context.ts`); sem isso a extensão de tenant-scope
**lança**. O redeem também busca `Organization`/`Branch` para o branding do
PDV: essa leitura tem que ser unscoped **e** acontecer **antes** de
`pairDevice` (que apaga o código). Sem isso, `Branch.findFirst` estoura
`TenantScopeMissingError` depois de consumir o código e a segunda tentativa do
PDV vira `not_found`. É o ponto mais fácil de errar ao mexer nesse caminho.

Depois de resolver o terminal, porém, o guard **estabelece o `TenantContext`
da requisição** (`setTenantContext({ organizationId: terminal.organizationId,
branchId: terminal.branchId, branchIds: [terminal.branchId], … })`) —
*correção de 2026-08-07*. Rotas `@Public()` nunca passam pelo
`TenantContextGuard` (o único outro lugar que chama `setTenantContext`), então
sem esse passo o contexto ficava `pending` a requisição inteira e **todo**
repositório que usa `prisma.scoped` (`PosOperator`, `PosPolicy`) lançava
`TenantScopeMissingError` — o PDV via "Erro interno ao consultar os dados da
organização" em `v1/pos/operators`, `v1/pos/operators/sync`,
`v1/pos/operators/authenticate` e `v1/pos/policy`, sempre, não só em cenários
raros. `v1/pos/terminal` nunca deu erro porque o repositório de `PosTerminal`
usado ali é o `saveUnscoped`/`findByDeviceTokenHash`, que já rodam fora do
escopo de propósito.

`DeviceToken` (`shared/infra/crypto/`) usa **SHA-256**, e não scrypt como o
PIN — não é descuido: 256 bits aleatórios não têm força bruta viável, e hash
determinístico é o que permite ao guard *encontrar* o terminal por índice em
vez de varrer a tabela a cada requisição. É o tratamento usual de chave de API.

O throttle (`@nestjs/throttler`) é aplicado **só** em `pair/redeem`, via
`@UseGuards(ThrottlerGuard)`. Não é guard global de propósito: limitaria também
as rotas internas de alto volume.

### Pos-policies — alçadas do PDV (`modules/pos-policies`)

Até onde o operador de caixa vai sozinho. **Uma política por organização**
(`organizationId @unique`, sem `branchId`): limite por terminal seria explorável
escolhendo o caixa mais frouxo, e limite por unidade transformaria "desconto
máximo" numa negociação de loja.

| Método | Rota (base `/api/`) | Permissão | Notas |
| ------ | -------------------- | --------- | ----- |
| `GET`  | `v1/pos-policy`      | `org.view` | **Nunca 404**: cria com os defaults na primeira leitura |
| `PUT`  | `v1/pos-policy`      | `org.pos_policies.manage` | Sem `:id` — há sempre uma. Campo ausente não muda |
| `GET`  | `v1/pos/policy`      | **`DeviceAuthGuard`** | O que o PDV cacheia para saber, offline, o que exige supervisor |

### Pos-fiscal-settings — tipo de NF emitida pelo PDV (`modules/pos-fiscal-settings`, spec erp/013)

Qual modelo de documento fiscal o PDV emite ao concluir a venda. **Uma por organização**
(`organizationId @unique`), entidade própria **ao lado** de `PosPolicy` (não dentro: tipo de
documento fiscal não é alçada de operador). `posDocumentModel` = `MODEL_55` (NF-e) | `MODEL_65`
(NFC-e) | `null` (não configurado → venda conclui sem documento). Guarda `updatedByUserId`
(quem alterou). **Não** mora no Emitente da fiscal-api (que não conhece PDV/organização).

| Método | Rota (base `/api/`) | Permissão | Notas |
| ------ | -------------------- | --------- | ----- |
| `GET`  | `v1/pos-fiscal-settings` | `org.view` | **Nunca 404**: cria a padrão (não configurada) na 1ª leitura |
| `PUT`  | `v1/pos-fiscal-settings` | `org.pos_policies.manage` | Sem `:id` — há sempre uma. Grava modelo + `updatedByUserId` |
| `GET`  | `v1/pos/fiscal-settings` | **`DeviceAuthGuard`** | O PDV lê para saber qual modelo emitir |

⚠️ O **bloqueio de "Modelo 65 sem CSC"** vive na **tela** (erp-web), não aqui: o CSC é da
fiscal-api, que o erp-api não conhece. Migration `20260813140000_pos_fiscal_settings` (schema
`erp`). ⚠️ **Consumo/emissão no PDV é entrega própria (deferida)** — o app PDV é Flutter
(`apps/pdv/app`)/legado (`apps/pdv/legado`), sem integração fiscal hoje; esta entrega só expõe a
config pela rota device. 4 specs jest (in-memory).

**Novo consumidor de `GET v1/pos-fiscal-settings` (spec erp/024, Parte B, 2026-08-14)**: o proxy
`app/api/proxy/fiscal/[...path]/route.ts` do `erp-web` passou a chamar esta rota (com o token do
**usuário**, `org.view`) antes de repassar `DELETE /v1/companies/:id/csc` à fiscal-api — se
`posDocumentModel === "MODEL_65"`, o proxy bloqueia com 409 sem chegar a chamar a fiscal-api
(`lib/api/pos-fiscal-model-guard.ts` no erp-web). É a direção inversa do bloqueio existente
("Modelo 65 sem CSC" bloqueia salvar aqui): agora também não dá pra remover o CSC com o Modelo 65
já ativo, sem trocar o modelo antes — mantém a regra simétrica nos dois sentidos.

**Três decisões que o código depende:**

1. **`GET` não devolve 404.** Se devolvesse, a tela do ERP e o PDV inventariam
   cada um o seu fallback — e inventariam diferente.
2. **Defaults restritivos** (`POS_POLICY_DEFAULTS`): cancelamento e devolução já
   nascem exigindo supervisor. Nascer permissivo seria uma loja sem alçada sem
   ninguém ter decidido isso.
3. **O limite é exclusivo.** Com o teto em 10%, um desconto de exatamente 10%
   passa — é como o lojista lê "até 10%". A regra mora na entidade
   (`requiresSupervisorForDiscount`/`ForWithdrawal`), não espalhada nas telas.

### Fiscal-defaults — padrões fiscais da organização (`modules/fiscal-defaults`, spec erp/014)

Base de 015/016/018/019. Dois conceitos:

- **`FiscalGroup`** (tabela `fiscal_groups`, schema `erp`): grupo fiscal mínimo por
  organização + tributo (`taxType` = `ICMS` | `IPI` | `PIS_COFINS` | `ISSQN`, `name`).
  CRUD completo desde 015/016/018/019 (create/update por tributo) + **delete** desde
  022 (ver abaixo). ⚠️ **Distinto** do tipo `FiscalGroupField` (`{value, applyToAll}`)
  já existente dentro de `ProductFiscal`.
- **`FiscalDefaultTaxes`** (tabela `fiscal_default_taxes`, `organizationId @unique`):
  **um padrão por organização** — grupo padrão por tributo (`icmsGroupId`/`ipiGroupId`/
  `pisCofinsGroupId`/`issqnGroupId`, FK opcional → `FiscalGroup`, `onDelete: SetNull`) +
  `cfop` (String = código do catálogo estático, **não** um grupo/Natureza — plan D1).

| Método | Rota (base `/api/`) | Permissão | Notas |
| ------ | -------------------- | --------- | ----- |
| `GET`  | `v1/fiscal-groups?taxType=` | `org.view` | Grupos da org (listagem rica — spec erp/022 D2: `taxSituation`/`rate`/`productCount` por grupo, sem N+1), filtro opcional por tributo |
| `GET`  | `v1/fiscal-default-taxes` | `org.view` | **Nunca 404**: cria o padrão vazio na 1ª leitura |
| `PUT`  | `v1/fiscal-default-taxes` | `store.catalog.manage` | Sem `:id` — há sempre um. Valida cada `groupId` (é da org **e** do tributo certo) |
| `DELETE` | `v1/fiscal-{icms\|ipi\|pis-cofins\|issqn}-groups/:id` | `store.catalog.manage` | spec erp/022 D3 — ver subseção abaixo |

#### Exclusão de grupo (spec erp/022, D3 — frontend unificou as 4 telas de lista, `features/fiscal-groups`)

`DeleteFiscalGroupUseCase` (novo, compartilhado pelos 4 controllers de grupo) bloqueia
com `FiscalGroupInUseError` (409) quando o grupo está **em uso** por qualquer um dos
dois vínculos que existem hoje a um `FiscalGroup`:
1. **Produtos**: `FiscalGroupRepository.countProductsByGroup(org, taxType)` — um único
   `groupBy` em `product_fiscal` por tributo (mesma técnica de D2, não por grupo).
2. **Padrão fiscal**: o grupo é referenciado em `FiscalDefaultTaxes` da organização.

Sem essas duas referências, `deleteById` apaga de fato (hard delete — `FiscalGroup` não
tem `deletedAt`; adicionar soft-delete ficaria pra quando houver um caso de uso real de
"restaurar grupo excluído", que não existe ainda). `fiscalGroupUfRate` (filha, só ICMS)
é apagada primeiro na mesma transação — sem cascade declarado no schema Prisma. 6 testes
novos em `delete-fiscal-group.use-case.spec.ts` (sem uso, não encontrado, tributo errado,
em uso por produto, em uso por padrão, e o caso "é padrão de OUTRO tributo → não bloqueia").

`UpsertFiscalDefaultTaxesUseCase` valida, via `FiscalGroupRepository.listByOrganization(org, taxType)`,
que cada `groupId` referenciado pertence à organização e é do tributo correto (não deixa apontar
grupo de ICMS no slot de IPI, nem grupo de outra org) → `ValidatorDomainError` (422). Herança é
**só exibição** no frontend (`fiscal-parameters`); a emissão **não** consome (limitação declarada).
Migration `20260813150000_fiscal_default_taxes` (schema `erp`; aplicada em local via
`pnpm --filter @citybox/erp-api db:migrate:deploy` em 2026-08-15). Testes jest
in-memory (list por tributo; get cria default; upsert persiste + rejeita groupId de tributo/org
errados; trim do cfop).

**`ProductFiscal` ganhou ISSQN** (mesmo módulo `catalog`): `issqn` (`FiscalGroupField`) +
`issqnApplyToAll`, e `issqn` no override por filial (`ProductFiscalBranch.issqn`). Percorre todo o
pipeline de `/v1/fiscal-parameters` (entity/dto/mapper/presenter/rotas), no mesmo padrão dos outros
quatro tributos. No HTTP DTO o `issqn` do grupo é **opcional** (tolera payloads anteriores à 014).

#### Grupos de PIS/COFINS (spec erp/015 — CRUD + resolução para emissão)

`FiscalGroup` deixou de ser só-leitura: ganhou a **regra de PIS/COFINS** (colunas nuláveis
`pisCst`/`pisAliquota`/`cofinsCst`/`cofinsAliquota`, usadas quando `taxType=PIS_COFINS`) + `create`/
`update`. CST suportado: **01/02** (tributado, `PISAliq`/`COFINSAliq`, exige alíquota 0–100) e
**04–09** (não tributado, `PISNT`/`COFINSNT`, sem alíquota). Fora: 03 (`PISQtde`) e 49–99 (a
entidade recusa → `ValidatorDomainError` 422). NT normaliza a alíquota para `null` (evita "06 com 1.65").

| Método | Rota (base `/api/`) | Permissão | Notas |
| ------ | -------------------- | --------- | ----- |
| `GET`  | `v1/fiscal-pis-cofins-groups` | `org.view` | Lista os grupos PIS/COFINS da org |
| `GET`  | `v1/fiscal-pis-cofins-groups/:id` | `org.view` | 404 se não for da org / não for PIS_COFINS |
| `GET`  | `v1/fiscal-pis-cofins-groups/:id/products` | `org.view` | Produtos que usam o grupo (aba Produtos, leitura) |
| `POST` | `v1/fiscal-pis-cofins-groups` | `store.catalog.manage` | Cria (validação de CST/alíquota na entidade) |
| `PUT`  | `v1/fiscal-pis-cofins-groups/:id` | `store.catalog.manage` | Edita |

**`ResolveItemPisCofinsUseCase`** (exportado pelo módulo, plan D5): resolve, por item da emissão,
`productPisCofinsGroupId` → grupo do produto → `FiscalDefaultTaxes.pisCofinsGroupId` (padrão da org)
→ `null` (fallback). O emissor lê `ProductFiscal.pisCofinsGroupId` e passa aqui; devolve
`{pis:{cst,aliquota}, cofins:{cst,aliquota}}` ou `null`. `null` = produto sem grupo e sem padrão →
o emissor manda o item sem PIS/COFINS e a **fiscal-api** aplica CST 01 zerado (não-regressão). A
fiscal-api **não** conhece grupos/produto — recebe pronto (`NfeItemInput.pis`/`cofins`).

**`ProductFiscal.pisCofinsGroupId`** (FK → `FiscalGroup`, `onDelete SetNull`) + override por unidade
(`ProductFiscalBranch.pisCofinsGroupId`), percorrendo o pipeline de `/v1/fiscal-parameters` (no HTTP
DTO é opcional). Convive com o campo livre `pisCofins` (legado da 014); a emissão usa a FK.
Migration `20260813160000_fiscal_pis_cofins_group` (aplicada em local via `db:migrate:deploy` em 2026-08-15). Testes jest
in-memory (grupo persiste + valida CST/alíquota + normaliza NT; resolvedor com grupo/herança/fallback).
⚠️ **Emissão real (disparo PDV→fiscal-api) é B7 (deferida)** — entregamos o resolvedor + o contrato; o
builder test da fiscal-api prova o XML.

#### Grupos de ICMS (spec erp/016 — CRUD + resolução por UF; **resolve B1**)

`FiscalGroup` ganhou a **situação de ICMS** (`icmsCst` **ou** `icmsCsosn`, exatamente uma; CST
suportado só **00**, CSOSN só **102/103/300/400** — a entidade recusa o resto → 422) + `createIcms`/
`updateIcms`. As **alíquotas por UF** vivem na **tabela filha `FiscalGroupUfRate`** (`grupo × UF ×
rateType` INTERNA|INTERESTADUAL, `aliquota Decimal`; `@@unique([fiscalGroupId, uf, rateType])`),
persistida em transação (deleteMany + createMany) e normalizada (dedup por UF+tipo). `FiscalGroupUfRate`
registrada em `TENANT_SCOPED_MODELS`.

| Método | Rota (base `/api/`) | Permissão | Notas |
| ------ | -------------------- | --------- | ----- |
| `GET`  | `v1/fiscal-icms-groups` | `org.view` | Lista (resumo, sem a matriz) |
| `GET`  | `v1/fiscal-icms-groups/:id` | `org.view` | 404 se não for da org / não for ICMS; traz a matriz |
| `GET`  | `v1/fiscal-icms-groups/:id/products` | `org.view` | Produtos que usam o grupo |
| `POST` | `v1/fiscal-icms-groups` | `store.catalog.manage` | Cria (validação na entidade) |
| `PUT`  | `v1/fiscal-icms-groups/:id` | `store.catalog.manage` | Edita (substitui a matriz) |

**`ResolveItemIcmsUseCase`** (exportado): produto → grupo do produto → `FiscalDefaultTaxes.icmsGroupId`
→ fallback null. Escolhe a alíquota **INTERNA** se `destinationUf === emitterUf`, senão
**INTERESTADUAL** (`FiscalGroup.ufRate(uf, tipo)`; UF sem alíquota → 0). Devolve `{cst, csosn,
aliquota}` ou `null` (fallback → emissor manda item sem ICMS → fiscal-api aplica `ICMS00` zerado). A
origem (`orig`) vem de `ProductFiscal.origin`, resolvida pelo caller.

**`ProductFiscal.icmsGroupId`** (FK → `FiscalGroup`, SetNull) + override por unidade, no pipeline de
`/v1/fiscal-parameters`, validado na escrita (org + `taxType=ICMS`, mesma trava do pisCofins).
Migration `20260813170000_fiscal_icms_group` (aplicada em local via `db:migrate:deploy` em 2026-08-15). Testes jest in-memory (grupo + uf
rates persistem; valida situação; resolvedor interna/interestadual/herança/fallback). **A apuração no
XML (`ICMS00` real, fecha B1) é provada pelos builder tests da fiscal-api.** Emissão real no PDV = B7.

⚠️ **A alçada é enforçada no app, não no servidor.** Não há rota de venda para
reconferir. Quando o checkout contra a `erp-api` entrar, o servidor **tem** que
revalidar — senão a alçada vale só para quem usa o app oficial.

### Fiscal-additional-info — informações adicionais da nota (`modules/fiscal-additional-info`, spec erp/017)

Módulo **próprio** (não é `FiscalGroup` — é outro conceito): texto fixo que o emissor
concatena por tipo de documento e destino e injeta no XML transmitido. Entidade
`FiscalAdditionalInfo` (tabela `fiscal_additional_infos`, schema `erp`): `organizationId`,
`name`, `text`, `documentType` (`NFE`|`NFCE`|`NFSE`), `target` (`INF_CPL`|`INF_AD_FISCO`),
timestamps; index `(organizationId, documentType)`. Registrada em `TENANT_SCOPED_MODELS`.
Migration `20260813180000_fiscal_additional_info` (aplicada em local via `db:migrate:deploy` em 2026-08-15).

**Regra central (plan D10):** a NFS-e nacional **não** tem `infAdFisco` (o `DPS_v1.01.xsd`
não possui o campo) — a entidade **recusa** `documentType=NFSE` com `target=INF_AD_FISCO`
(422). Tetos do XSD por campo, validados na entidade: NF-e/NFC-e `infCpl` ≤ **5000**,
`infAdFisco` ≤ **2000**; NFS-e `infCpl` (→ `xInfComp`) ≤ **2000**. `documentType` é **imutável**
na edição (troca o limite e a aba — vira outro cadastro).

| Método | Rota (base `/api/`) | Permissão | Notas |
| ------ | -------------------- | --------- | ----- |
| `GET`  | `v1/fiscal-additional-infos?documentType=` | `org.view` | Lista (filtro opcional por tipo), ordem de criação |
| `GET`  | `v1/fiscal-additional-infos/count` | `org.view` | spec erp/023, N7 — `{NFE, NFCE, NFSE, total}`, 1 `groupBy`. **Declarada antes de `:id`** no controller — senão o Nest tentaria casar `count` como valor de `:id` |
| `GET`  | `v1/fiscal-additional-infos/:id` | `org.view` | 404 se não for da org |
| `POST` | `v1/fiscal-additional-infos` | `store.catalog.manage` | Cria (validação na entidade) |
| `PUT`  | `v1/fiscal-additional-infos/:id` | `store.catalog.manage` | Edita nome/texto/destino (não o tipo) |
| `DELETE` | `v1/fiscal-additional-infos/:id` | `store.catalog.manage` | 204; 404 se inexistente |

**`ResolveDocumentAdditionalInfoUseCase`** (exportado): dado `documentType`, busca as infos do
tipo, concatena por destino na **ordem de criação** (separador = espaço), valida o total ≤ teto
do XSD (senão `AdditionalInfoOverflowError`, 422 — **impede, nunca trunca**: o texto entra num
documento transmitido) e devolve `{ infCpl?, infAdFisco? }` pronto para o emissor repassar à
fiscal-api (que recebe texto, não conhece o cadastro). Para NFS-e só `infCpl` (→ `xInfComp`).
Disparo real PDV→fiscal-api = **B7** (deferido). Testes jest in-memory (14): CRUD, isolamento de
tenant, recusa NFSE+INF_AD_FISCO, concatenação por destino, overflow, tetos por campo. **A
emissão do `infAdic`/`infoCompl` no XML é provada pelos builder tests da fiscal-api.**

### Grupos de ISSQN + emissão de NFS-e (spec erp/018)

**Fatia grande — liga o ERP à emissão de NFS-e da `fiscal-api` (que ninguém acionava).**

**Cadastro (`modules/fiscal-defaults`, estende `FiscalGroup`):** `taxType='ISSQN'` ganhou a
situação do serviço (`issqnServiceCode` código municipal `NN.NN`, `issqnNationalCode` `cTribNac`
6 díg., `issqnRate` Decimal, `issqnTribType` exigibilidade) + `createIssqn`/`updateIssqn`/
`validateIssqn` (formato NN.NN + cTribNac 6 díg + `tribISSQN ∈ {1,2,4}` — 3 exportação fora da
fatia). CRUD `v1/fiscal-issqn-groups` (`org.view`/`store.catalog.manage`, molde do ICMS).
`ResolveServiceIssqnUseCase` (exportado): item → `issqnGroupId` → grupo → `{municipalServiceCode,
nationalServiceCode, issRate, tribISSQN}`. **`ProductFiscal.issqnGroupId` + `ProductFiscalBranch.
issqnGroupId`** (FK → FiscalGroup, SetNull) validados na escrita (`assertGroupOfType('ISSQN')`) no
pipeline `/v1/fiscal-parameters`. Migration `20260813190000_nfse_issqn_groups` (aplicada em local via `db:migrate:deploy` em 2026-08-15;
inclui CHECK de `tribISSQN`).

**Emissão (`modules/nfse-issuance`, novo):** liga o ERP à `fiscal-api` server-to-server.
`FiscalApiClient` (interface + `HttpFiscalApiClient` → `POST {FISCAL_API_URL}/v1/nfse`, traduz
E0116/E0310/E0625 em `FiscalApiEmissionError` legível). `IssueNfseUseCase`:
resolve o Grupo de ISSQN, monta o `IssueNfseDto` (a fiscal-api não conhece grupos), **idempotência
local** (`NfseIssuance.findByIdempotency` — mesma operação não reemite), registra o vínculo
`NfseIssuance` (documento↔operação, tabela `nfse_issuances`,
`TENANT_SCOPED_MODELS`). Rotas `v1/nfse-issuances` (POST emitir **`store.fiscal.issue`** — permissão
nova de alto impacto, distinta do cadastro; GET listar `org.view`). **Não-regressão E0625**: `pAliq`
só sai com retenção — regra no builder da fiscal-api; o erp-api repassa `issRate`+`issWithheld`.
`tribISSQN` vem do grupo (não mais fixo). Testes jest in-memory: resolve+emite+registra,
idempotência, tribISSQN propagado, retenção, grupo ausente, erro traduzido (transporte mockado).
⚠️ **Pré-requisito operacional (produção, não código):** IM da empresa no CNC do município (E0116).

**2026-08-15 (spec erp/025, P1+P2) — auth M2M própria + ambiente real do Emitente, com bloqueio de
PRODUCTION.** Duas mudanças no `HttpFiscalApiClient`/`IssueNfseUseCase`:
- **P1 — token de serviço próprio na erp-api** (`infrastructure/providers/fiscal-service-token.ts`,
  novo): substitui o antigo `FISCAL_API_TOKEN` estático (que incluía um fallback `'dev-admin'` fora
  de produção — removido) por `client_credentials` contra o Keycloak (`KEYCLOAK_ISSUER` +
  `KEYCLOAK_FISCAL_M2M_CLIENT_ID`/`_SECRET`, o mesmo client `fiscal-m2m` que o `erp-web` já usa),
  com cache de token em memória de processo (60s de folga antes do vencimento) e dedupe de chamadas
  concorrentes (`inFlight`). **É uma cópia local, não um pacote compartilhado com o `erp-web`** — ADR
  C-17 (`Molde de autenticação e tenancy por sistema`) proíbe pacote/symlink de auth compartilhado
  entre sistemas; a duplicação é intencional (ver `.claude/plans`/ADRs). Correção de bug real
  embutida: `resolveToken()` roda **antes** de qualquer `fetch()`, num try/catch próprio (log
  `[FiscalAuth]`) — antes, uma falha ao obter token caía no catch genérico do `fetch` e virava a
  mensagem enganosa "não foi possível contatar", escondendo a causa real até nos logs.
- **P2 — ambiente de emissão real, não mais fixo em HOMOLOGATION.** `findCompanyIdByCnpj` passa a
  retornar `ResolvedFiscalCompany` (`{id, defaultEnvironment}`, tipo em
  `domain/providers/fiscal-api-client.interface.ts`) em vez de só `string | null` — lê
  `defaultEnvironment` da resposta da fiscal-api, com fallback conservador para `HOMOLOGATION` se o
  campo vier ausente/inválido (nunca assume `PRODUCTION` por omissão). `IssueNfseUseCase` recusa a
  emissão (`FiscalApiEmissionError`) quando `environment === 'PRODUCTION'` — guarda posicionada
  **antes** de qualquer efeito colateral (idempotency key, `NfseIssuance.save`, chamada à fiscal-api),
  já que a plataforma só sustenta emissão real em homologação nesta fase. Testes novos:
  `fiscal-service-token.spec.ts` (fetch único, cache, renovação por skew, dedupe concorrente, erro de
  config ausente), `http-fiscal-api-client.spec.ts` (distinção de log `[FiscalAuth]`/
  `[FiscalTransport]`/`[FiscalBusiness]`, fallback de ambiente), 2 casos novos em
  `issue-nfse.use-case.spec.ts` (recusa em PRODUCTION; recusa acontece antes de qualquer side effect).

### Grupos de IPI + emissão do bloco IPI (spec erp/019)

**Fatia vertical — cadastro + emissão do bloco `IPI` na NF-e (última das telas de grupos fiscais).**

**Cadastro (`modules/fiscal-defaults`, estende `FiscalGroup`):** `taxType='IPI'` ganhou `ipiCst`
(situação tributária de **saída** — o v1 só emite saída), `ipiEnquadramento` (`cEnq`, Código de
Enquadramento Legal) e `ipiRate` (Decimal, percentual). `createIpi`/`updateIpi`/`validateIpi`:
`ipiCst ∈ {50,51,52,53,54,55,99}`, `cEnq` válido pela tabela estática, e percentual **obrigatório
só p/ CST tributado (50/99)** — normalizado a `null` p/ 51–55. Tabela `cEnq` **versionada em código**
(`domain/ipi-enquadramento.table.ts`, subconjunto curado + `999` padrão) com teste de imutabilidade
(inclui assertivas de código único). CRUD `v1/fiscal-ipi-groups` (`org.view`/`store.catalog.manage`,
molde do ISSQN). `ResolveItemIpiUseCase` (exportado): item → `ipiGroupId` → grupo → `{cst, cEnq,
aliquota}` **ou `null`** (produto sem grupo → **emissor NÃO emite bloco IPI**, não-regressão).
**`ProductFiscal.ipiGroupId` + `ProductFiscalBranch.ipiGroupId`** (FK → FiscalGroup, SetNull)
validados na escrita (`assertGroupOfType('IPI')`) no pipeline `/v1/fiscal-parameters`. Migration
`20260813200000_fiscal_ipi_group` (aplicada em local via `db:migrate:deploy` em 2026-08-15; CHECK de `ipi_cst` só saída, FK indexada).
A coluna livre legada `ProductFiscal.ipi` (`@default("")`) permanece — o caminho novo é a FK.

**Emissão:** a fiscal-api recebe o IPI já resolvido em `NfeItemInput.ipi` e monta `IPITrib`/`IPINT`
(ver `services/fiscal-api/AGENTS.md`). O erp-api é o "emissor" que resolve produto→grupo→valores.
Testes jest in-memory: domínio IPI (CST/cEnq/percentual condicional/faixa) + use-cases
create/update/resolve + coverage de `ipiGroupId` em `upsert-fiscal-parameters`. ⚠️ **B7**: a emissão
real (fiscal-api `issue-nfe` repassando `ipi`) ainda é deferida — hoje só cadastro + resolver + builder.

### Operation-natures — Naturezas de Operação (`modules/operation-natures`, spec erp/020)

**Última feature da fila do Menu Fiscal.** Regra de-para que, dada uma operação de **entrada**,
determina o **CFOP e os grupos fiscais** da **saída** correspondente (caso canônico: devolução de
mercadoria para fornecedor). **Não** estende `FiscalGroup` (015/016/018/019) — é entidade agregada
própria com duas coleções filhas.

**Domínio**: `OperationNature` (nome, descrição ≤300, `keepBenefitInUf` sempre `false` — depende de
`cBenef` por UF, fora de escopo) + `cfopRules[]` (`fromCfop` entrada → `toCfop` saída + condição
`icmsLivre` `AMBOS`/`SIM`/`NAO`; rejeita duplicata exata `fromCfop`+`icmsLivre`) + `groupRules[]`
(`taxType` `ICMS`/`PIS_COFINS` + `fromGroupId`→`toGroupId`, validado contra a tabela `FiscalGroup`
na escrita). **Tabela de CFOP estática versionada** (`domain/cfop.table.ts`) — curadoria de
entrada (`1xxx`/`2xxx`) e saída (`5xxx`/`6xxx`) mais usados, com teste de imutabilidade (mesmo
padrão do `cEnq` do IPI); `isIcmsLivre(cst, csosn)` deriva "ICMS livre" do CST/CSOSN do grupo de
ICMS do item (tributado = CST `00`/CSOSN `102`; livre = CSOSN `103`/`300`/`400` — só o conjunto que
016 suporta), **não** de flag manual no produto.

**Resolvedor** (`ResolveOperationNatureUseCase`, exportado): dado `{organizationId,
operationNatureId, fromCfop, itemIcmsLivre, itemIcmsGroupId?, itemPisCofinsGroupId?}` →
`{toCfop, toIcmsGroupId, toPisCofinsGroupId} | null`. Casa por `fromCfop`; entre as linhas que
casam, a **mais específica vence** (`SIM`/`NAO` > `AMBOS`); nenhuma linha casa → `null` (mantém o
item original, **não bloqueia** a operação); regra de grupo com `fromGroupId` órfão (grupo
deletado) é ignorada, não quebra a resolução.

**Infra**: schema `erp` — `operation_natures` (pai) + `operation_nature_cfop_rules` +
`operation_nature_group_rules` (filhas, `@@index` em `operationNatureId`+`organizationId`, CHECK de
`icms_livre`/`tax_type`, FK de grupo `SetNull` nos dois lados). Prisma repo grava pai+filhas em
transação (molde `FiscalGroupUfRate`). CRUD `v1/operation-natures` (`org.view` leitura,
`store.catalog.manage` escrita). `TENANT_SCOPED_MODELS` += `OperationNature` + as 3 filhas.
Migration `20260813210000_operation_natures` (aplicada em local via `db:migrate:deploy` em 2026-08-15). **36 testes jest in-memory** (entidade, CRUD, resolvedor: casa-
uma, casa-duas especificidade Ambos×Sim×Não, não-casa, mapeamento de grupos, regra órfã ignorada,
tabela de CFOP).

⚠️ **fiscal-api NÃO é tocada** — emissão de entrada/devolução não existe lá (o builder fixa
`tpNF: '1'`, saída); a regra é resolvida e testada em isolamento, mas não é disparada por nenhum
fluxo de emissão real (mesma natureza do B7, dormant até existir emissão de entrada). Frontend:
`apps/erp/web` feature `fiscal-operation-natures` (`/configuracoes/fiscal/naturezas-operacao`).

**Exclusão** (spec erp/024, Parte A, 2026-08-14): `DELETE /v1/operation-natures/:id`
(`store.catalog.manage`, mesma permissão das outras escritas), `DeleteOperationNatureUseCase` —
hard delete, sem checagem de "em uso": confirmado por leitura do schema que **nenhuma** outra
tabela referencia `OperationNature` (diferente de `FiscalGroup`, que bloqueia por produto/padrão) —
só as duas filhas, ambas `onDelete: Cascade`, removidas junto pelo próprio Postgres. Escopado por
organização (`findById` antes de `deleteById`, 404 se a natureza é de outra org — teste
cross-tenant obrigatório cobre isso). UI: menu de ações na listagem (`RowActionsMenu` +
`ConfirmationDialog`, mesmo padrão do hub de Grupos fiscais), com aviso de que a exclusão afeta a
resolução de emissões futuras. `PrismaOperationNatureRepository.deleteById` usa `deleteMany({where:
{organizationId, id}})` — filtra pelos dois campos sem precisar do nome da chave composta.

### Pos-catalog — snapshot de produtos para o PDV (`modules/pos-catalog`)

O Balcão e a Consulta de preço precisam do conjunto em memória. **Não** reutiliza
`GET /v1/products` (JWT + `store.catalog.manage`): o terminal autentica com
`Authorization: Device <token>`.

| Método | Rota (base `/api/`) | Auth | Notas |
| ------ | -------------------- | ---- | ----- |
| `GET`  | `v1/pos/catalog`     | **`DeviceAuthGuard`** (`@Public()`) | Snapshot da **unidade do terminal**: categorias, produtos vendáveis, adicionais, `syncedAt` |

**Regras do snapshot:**

1. Só `ProductBranch` com `branchId` do terminal e `active=true`; exclui
   `type=supply` e soft-deleted (`branchActiveOnly` no `ProductRepository`).
2. **Preço resolvido no servidor** (`resolvePdvSellPriceCents`): listas ativas
   com canal `pdv`, dentro da vigência, menor `priority` primeiro; senão
   `basePriceCents`. O app **não** remescla listas.
3. Variantes `grid` flattenadas (produto cartesiano); `composite` → `variants: []`
   nesta fatia. `allowsHalf` fixo `false` (ERP ainda não modela meia).
   Id da variante = `${product.id}:${optionIds.join(':')}`; barcode só se
   **exatamente uma** opção do combo tiver `ProductVariationOption.barcode`
   (código da opção do catálogo **não** vira barcode). Preço = preço do canal
   `pdv` + soma dos `override.priceCents ?? option.priceCents`.
4. `soldByWeight` quando a UoM tem `kind === 'weight'`; `pricePerKgCents` =
   preço resolvido nesses casos.
5. **Estoque no snapshot:** `trackStock` (do produto) + `stockQty` (saldo no
   depósito default da unidade — mesmo critério de `CreatePosSaleUseCase`).
   Sem depósito vinculado à branch → `stockQty=null` mesmo com `trackStock`.
   Produto sem controle → `stockQty=null`. Sem linha de saldo → `"0"`.

**Seed de grade para o PDV** (`scripts/seed-pdv-grid-variants.sql`): cria
variações Tamanho (P/M/G) e Cor (Preto/Branco) + Camiseta (grade 2 eixos,
barcode só no pai `7891000000103`) e Calça (só Tamanho, barcode por SKU)
nas orgs Bruno Arouca e Kika Modas, com `ProductBranch.active` na unidade
do terminal pareado. Liga `variant_grid: available` em `pos_module_defaults`
(Bruno, PDV Teste, Kika). Idempotente (`ON CONFLICT DO NOTHING` / merge
JSON). Sem isso o flatten devolve `variants: []` — produtos "com variação"
do seed antigo têm `variation_format` nulo e zero linhas em
`product_variations`.

Reusa repositórios de `catalog` via `CatalogModule` — sem copiar CRUD.

### Pos-customers — clientes CRM para o PDV (`modules/pos-customers`)

O seletor/cadastro rápido do PDV **não** usa `GET/POST /v1/customers` (JWT +
`org.view` / `org.customers.manage`): o terminal autentica com
`Authorization: Device <token>`. Org e unidade vêm do terminal.

| Método | Rota (base `/api/`) | Auth | Notas |
| ------ | -------------------- | ---- | ----- |
| `GET`  | `v1/pos/customers` | **`DeviceAuthGuard`** | `search`, `page`, `perPage`; `tab=all` (sem soft-deleted); list item com `document`/`phones` |
| `GET`  | `v1/pos/customers/:id` | **`DeviceAuthGuard`** | Detail; 404 se soft-deleted |
| `POST` | `v1/pos/customers` | **`DeviceAuthGuard`** | Cadastro rápido; `branchIds=[terminal.branchId]`; `stage=active` |
| `GET`  | `v1/pos/customer-categories` | **`DeviceAuthGuard`** | Dropdown do form |

Reusa `ListCustomersUseCase` / `FindCustomerByIdUseCase` / `CreateCustomerUseCase`
/ `ListCustomerCategoriesUseCase` exportados de `CustomersModule`. Fora de escopo
nesta fatia: PUT/DELETE device, checkout com `customerId`.

### CEP — lookup BrasilAPI (`shared/infra/cep-lookup.module.ts`)

Espelho do admin-api. Provider `BrasilApiCepProvider` → `LookupCepUseCase`.

| Método | Rota (base `/api/`) | Auth | Notas |
| ------ | -------------------- | ---- | ----- |
| `GET`  | `v1/cep/:cep` | JWT + `org.view` + `X-Organization-Id` | 8 dígitos; `{ data: { zipCode, street, neighborhood, city, state } }` |
| `GET`  | `v1/pos/cep/:cep` | **`DeviceAuthGuard`** | Mesmo contrato; PDV |

Erros: `CepNotFoundError` (404), `CepProviderUnavailableError` (503), CEP inválido (422).

### Pos-payment-methods — formas de pagamento para o PDV (`modules/pos-payment-methods`)

| Método | Rota (base `/api/`) | Auth | Notas |
| ------ | -------------------- | ---- | ----- |
| `GET`  | `v1/pos/payment-methods` | **`DeviceAuthGuard`** | Ativos da org; sem paginação; `{ id, name, fiscalCode, systemKey, installmentPermission }` |

Reusa `PaymentMethodRepository` (`tab=active`). PDV mapeia `systemKey` (`pm-dinheiro`, `pm-cartao`, `pm-pix`, …).

### Pos-cash-sessions — turno de caixa (`modules/pos-cash-sessions`)

Turno por terminal: abrir (fundo) → reforço/sangria + vendas → fechar (contagem por canal). Models `PosCashSession` / `PosCashMovement`; FKs em `SaleOrder` (`cashSessionId`, `posTerminalId`, `operatorUserId`). Uma sessão `open` por terminal (use case + unique parcial SQL `pos_cash_sessions_one_open_per_terminal`).

**Device** (`DeviceAuthGuard` + `CurrentTerminal`):

| Método | Rota (base `/api/`) | Use case | Notas |
| ------ | -------------------- | -------- | ----- |
| `GET` | `v1/pos/cash-sessions/current` | GetCurrentCashSession | Sessão `open` do terminal ou `data: null` |
| `GET` | `v1/pos/cash-sessions/current/sales` | ListCurrentSessionSales | Vendas do turno aberto deste terminal (`page`/`perPage`); sem sessão → `data: []` |
| `POST` | `v1/pos/cash-sessions` | OpenCashSession | `openingFloatCents` + `operatorUserId`; **409** se já open |
| `POST` | `v1/pos/cash-sessions/:id/movements` | AddCashMovement | `reinforcement` \| `withdrawal`; sangria → `pdv.operacao.caixa.withdrawal` no operador **ou** `authorizedByUserId`; acima de `PosPolicy.withdrawalSupervisorAboveCents` exige autorizador |
| `POST` | `v1/pos/cash-sessions/:id/close` | CloseCashSession | Contagens; `expectedCash` = float + reforços − sangrias + pagamentos cash (`pm-dinheiro` / nome dinheiro\|cash) |

**JWT** (`org.view` + `X-Organization-Id`, paginação §8.1):

| Método | Rota (base `/api/`) | Use case |
| ------ | -------------------- | -------- |
| `GET` | `v1/pos-cash-sessions` | ListCashSessions (`posTerminalId`, `operatorName`, `openedFrom`/`openedTo`, `page`/`perPage`) |
| `GET` | `v1/pos-cash-sessions/:id` | GetCashSessionById |
| `GET` | `v1/pos-cash-sessions/:id/sales` | ListSessionSales |
| `GET` | `v1/pos-cash-sessions/:id/sales/:saleOrderId` | GetSessionSale |
| `GET` | `v1/pos-cash-sessions/:id/movements` | ListSessionMovements |
| `GET` | `v1/pos-cash-sessions/:id/closing-report` | GetClosingReport |

`GET …/sales` e `…/sales/:id` devolvem `number`, `operatorName`
(`SaleOrder.createdByName`) e, em cada payment, `methodId` +
`methodSystemKey` (o PDV recalcula `cashNetCents` / esperado em gaveta).

`PosCashSession` / `PosCashMovement` em `TENANT_SCOPED_MODELS`. Exporta `PosCashSessionRepository` (usado por `pos-sales`).

### Pos-sales — checkout Device (`modules/pos-sales`)

| Método | Rota (base `/api/`) | Auth | Notas |
| ------ | -------------------- | ---- | ----- |
| `POST` | `v1/pos/sales` | **`DeviceAuthGuard`** | Cria `SaleOrder` `closed` + `channelId=pdv`; pagamentos obrigatórios; `consumerDocument` opcional; `discountAuthorizedByUserId` quando desconto > alçada |
| `POST` | `v1/pos/sales/:id/cancel` | **`DeviceAuthGuard`** | Cancela venda PDV: `status=cancelled`, entrada reversa de estoque se houver `stockMovementId`, soft-delete dos `FinancialEntry` ligados (`saleOrderId`) |

**Cancelamento** (`CancelPosSaleUseCase`): exige turno **open** no mesmo terminal da venda; `channelId=pdv`; `operatorId` com `pdv.operacao.venda.cancel`; se `PosPolicy.cancellationRequiresSupervisor` → `authorizedByUserId` com `pdv.operacao.alcada.authorize`. **409** se algum recebível tiver conciliação bancária ativa (`PosSaleReceivablesInUseError`). Idempotente se já `cancelled`. Body: `operatorId`, `authorizedByUserId?`, `reason?`.

Regras do create: exige turno **open** no terminal (`PosSaleCashSessionRequiredError`); grava `cashSessionId` / `posTerminalId` / `operatorUserId` após o create. Valida `operatorId` = **userId** com Membership elegível na branch; `methodId` ativo; soma pagamentos ≥ total; resolve `stockId` (default da unidade); `createdByName` = nome do membro; `createdByUserId` do ledger = **o próprio userId**. Se `sellerId` vier preenchido, exige Membership ativa `isSeller` na org (não exige branch do vendedor). Inferência `cardPaymentType` por `systemKey`. **Desconto:** se `discountsCents` / total das linhas > `PosPolicy.discountSupervisorAbovePercent`, exige `discountAuthorizedByUserId` com `pdv.operacao.alcada.authorize` (`PosSaleSupervisorRequiredError`).

`SaleOrder.consumerDocument` (migration `20260812160000_add_sale_order_consumer_document`) — também exposto no create/update JWT de `/v1/sale-orders`.

Fora: fila offline, TEF, NFC-e, reabrir venda cancelada.

⚠️ **`credit` / `refund` / `tables` / `tabs` em `resolveTerminalModules`:** após o merge do núcleo, a resolução **força `disabled`** nesses ids (todas as orgs, sem migration). `credit`/`refund` até existirem APIs de crédito/devolução; `tables`/`tabs` até o salão/comanda existirem de ponta a ponta (hoje só locais no PDV). **`delivery` espelha `delivery_orders`:** um switch **Delivery** no backoffice (`POS_ALIAS_OPTIONAL_MODULE_IDS`); o id `delivery` permanece no contrato PDV. O catálogo HTTP do backoffice usa `POS_CONFIGURABLE_OPTIONAL_MODULES` (omite mesas/comandas e o alias). Remover os forces quando as features existirem. O PDV espelha em `ModuleSetValidator`.

### Pos-delivery — pedidos de entrega/retirada (`modules/pos-delivery`)

Rotas Device (`@Public()` + `DeviceAuthGuard`): `POST/GET v1/pos/delivery-orders`,
`GET/PATCH v1/pos/delivery-orders/:id`, `PUT .../:id/lines`,
`PATCH .../:id/status` e `GET v1/pos/couriers`. A listagem é branch-scoped,
server-side (`status`, `fulfillment`, `search`, `page`, `perPage`); entregadores são
`Carrier.deliveryType=entregador` ativos vinculados à unidade.
Criação e substituição aceitam `lines: []`: o PDV cria primeiro o cabeçalho e
sincroniza o carrinho depois; esvaziar o carrinho também precisa substituir por vazio.

Fluxo de status operacional: `received → preparing → dispatched → delivered`
(Concluído no Kanban = só `delivered` físico). Delivery exige endereço; despacho
de delivery exige entregador. **Pagamento ≠ Concluído:** `POST v1/pos/sales` com
`posDeliveryOrderId` grava o vínculo na mesma TX (`posMeta`) e **não** altera o
status operacional. Pago = existe `SaleOrder` ativa (`status <> cancelled`)
naquele delivery — list/detail devolvem `saleOrderId` + `paid`. Segundo checkout
com venda ativa → `AlreadySold`. Cliente/endereço/linhas bloqueados após pago;
entregador ainda pode mudar. Cancelamento operacional recusado se pago ou se
já `delivered`. Cancelar a venda remove o vínculo de pago; se o status legado
ainda era `delivered`, reabre (`dispatched` / `preparing`) — fluxo novo não
força `delivered` no checkout. Unique parcial em `sale_orders(pos_delivery_order_id,
organization_id)` onde `status <> 'cancelled'` permite re-checkout após estorno.
O perfil `Restaurante` habilita `delivery` e `delivery_orders`. `GET v1/sale-orders`
aceita `channelId`; listagem e detalhe devolvem `posDeliveryOrderId` /
`posDeliveryOrderNumber` / `posDeliveryFulfillment` (`delivery` \| `pickup`).

### Shared
- **Health** — `GET /api/health`, `GET /api/health/ready` — `@Public()`.
- **Keycloak** — `keycloak-jwt` (verificação JWKS); sem Admin API aqui.

---

## 10. Decisões de Arquitetura

| Decisão                                                       | Motivo                                                       |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| **Motor de recebíveis (`sales`↔`finance/card-contracts`): função pura + `import` direto, sem DI/`FinanceModule`** — *decidido 2026-08-06 (`specs/erp/005-card-receivables-engine/`)* | Reabrir a dependência `sales`→`finance` via injeção repetiria o import circular que já motivou a reversão histórica registrada mais abaixo ("`SalesModule` deixa de importar `FinanceModule`") e em §9 ("cada submódulo fino registra sua própria instância de `SaleOrderRepository`... para não depender de `SalesModule`"). Em vez disso, `finance/card-contracts/domain/services/{card-settlement-calculator,business-day-calendar}.ts` são funções puras (sem Prisma/NestJS) importadas por **TS import comum** — não por token de DI — em `sales/infrastructure/database/{resolve-card-settlement,prisma-sale-order.repository}.ts`, que fazem as consultas Prisma direto na mesma transação (mesmo padrão já usado ali para resolver `ChartOfAccount`/`CostCenter` por `systemKey`). O acoplamento existe (arquivo importa arquivo), mas é unidirecional, em tempo de compilação, sem módulo NestJS envolvido — preserva a decisão original sem reabri-la |
| **Saldo de conta bancária: agregação on-the-fly, nunca coluna materializada** — *decidido 2026-08-06* | `BankTransactionRepository.sumBalancesByAccountIds` faz 1 `groupBy` por `kind` reduzido em código — sem risco de dessincronia entre os 4+ pontos de escrita do ledger (criação/edição de conta, transferência, pagamento/exclusão/restauração de lançamento). Custo de agregação é desprezível no volume de uma única loja; migrar para saldo materializado fica para se houver evidência de lentidão (`specs/erp/002-bank-account-ledger/research.md` D2) |
| **Movimentações de origem `financial_entry_payment` são ressincronizadas (apaga+recria), não append-only puro** — *decidido 2026-08-06* | `FinancialEntryPayment` não tem identidade estável entre saves — amarrar o ledger a `paymentId` obrigaria reconciliar ids voláteis a cada `save()`. O limite de sync natural é `financialEntryId`: `PrismaFinancialEntryRepository` apaga tudo com `sourceId=entry.id` e recria a partir de `deriveBankTransactionInputsFromEntry()` (função pura compartilhada com o repositório in-memory de teste). As origens `initial_balance`/`bank_transfer` continuam genuinamente imutáveis depois de criadas (`research.md` D1) |
| **`BankTransaction.sourceId` não é FK** | Aponta para 3 agregados diferentes conforme `sourceType` (`BankAccount`/`BankTransfer`/`FinancialEntry`) — resolução por aplicação, mesmo padrão de `FinancialEntry.saleOrderId` (referência solta já documentada como dívida pré-existente, aqui reaplicada deliberadamente por ser a única forma de um campo polimórfico sem tabela de junção extra) |
| **`bank-transfers` é submódulo novo, não uma rota dentro de `bank-accounts`** — *decidido 2026-08-06* | É seu próprio agregado (`BankTransfer`), com validação própria (mesma conta, contas/centro de custo inexistentes) e sem CRUD completo (só `POST` — FR-020, não editável/cancelável). Mora fora de `bank-accounts/` para não inflar aquele submódulo com uma rota que só cria, nunca lista/edita a conta em si |
| **`FinancialEntryAllocation.costCenterId` obrigatório, validado no servidor (soma == total, tolerância 1 centavo)** — *decidido 2026-08-05* | O rateio por categoria alimenta a DRE de verdade — validar só no front deixaria a integridade do dado dependendo do cliente obedecer. `AllocationMismatchError` → 422 bloqueia qualquer `create`/`update` fora da soma; a checagem fica fora do construtor compartilhado da entidade (só em `create()`/`update()`) para não quebrar `with()` ao reconstruir lançamentos legados sem rateio ainda não migrados pelo backfill |
| **`FinancialEntryAttachment` é `Entity` própria com repositório dedicado, não um value object embutido no agregado `FinancialEntry`** — *decidido 2026-08-05* | Ao contrário de `payments`/`allocations` (substituídos por inteiro a cada `save()`, sem identidade estável para o cliente), um anexo tem upload/download/remoção assíncronos fora do payload principal e precisa manter identidade entre requisições — CRUD HTTP próprio (`FinancialEntryAttachmentRepository`), imutável (só cria e apaga) |
| **`pos-terminals` usa PATCH real, ao contrário de `branches`/`customers` (PUT)** — *decidido 2026-08-04* | Editar um terminal é normalmente pontual (trocar só a impressora, só o status) — PUT obrigaria o cliente a reenviar o objeto inteiro sob risco de zerar campo por omissão. Documentado aqui para não virar inconsistência silenciosa: o padrão do módulo (`update-member`-like) é a exceção, não a regra, dentro da API |
| **`pos-terminals` não tem restore, ao contrário de `customers`** — *decidido 2026-08-04* | Nenhuma tela desta fatia expõe "reativar terminal excluído" (molde `branches`, não `customers`); `FindPosTerminalById` trata excluído como 404. Se o produto pedir restore depois, é aditivo — endpoint novo, sem mudar o soft-delete existente |
| **`PosTerminalPairingCodeInvalidError` existe sem nenhum use case lançá-lo** — *decidido 2026-08-04* | A troca do código por credencial de longa duração é a próxima fatia (autenticação do PDV), que precisa desse erro de domínio pronto para não inventar um ad-hoc na hora — o custo de declará-lo cedo é uma classe não referenciada, não uma dívida |
| **`authenticate` não emite token de sessão de operador** — *decidido 2026-08-06, revisa o plano M3* | O plano previa "sessão de operador (token curto)". Nenhuma rota precisa hoje saber *qual* operador está agindo — quem autentica a requisição é a credencial do terminal. Um token emitido e não verificado por ninguém é peso morto com aparência de segurança. Quando o checkout contra a API entrar, o `operatorId` vai no payload da venda e o servidor valida contra a unidade do terminal; se aí houver necessidade de prova mais forte, o token entra com um verificador junto |
| **Device token com SHA-256, não com o mesmo hash lento do PIN** — *decidido 2026-08-06* | Os dois protegem segredos de entropia oposta. Um PIN de 4 dígitos precisa de hash lento para encarecer a força bruta; um token de 256 bits não tem força bruta viável, e o hash lento só custaria por requisição. Além disso o `DeviceAuthGuard` precisa **encontrar** o terminal a partir do token — com hash salgado seria varredura da tabela a cada chamada, com determinístico é índice. Mesmo tratamento que se dá a chave de API |
| **Operador de caixa é `Membership` com credencial PDV** — *revisado 2026-08-13 (supersede §D1 antigo)* | Código+PIN vivem no `Membership`; login device usa `userId` + `permissionIds`. Conta Keycloak por caixa é custo aceito pela unificação. Tabela `pos_operators` dropada. |
| **PIN hasheado com scrypt (`node:crypto`), não Argon2id** — *decidido 2026-08-06, revisa o PRD/plano* | O PRD dizia Argon2id. Ficou scrypt porque vem no Node e evita dependência nativa com node-gyp na imagem da API. Os dois são recomendados pela OWASP; o que protege um PIN de 4 dígitos de verdade é o bloqueio por tentativas, não o hash. O formato gravado carrega algoritmo e parâmetros (`scrypt$N$r$p$salt$hash`), então migrar depois é re-hashear na próxima verificação bem-sucedida — sem migration de dados |
| **Provisionamento por evento cria o responsável como OWNER, mas NÃO define senha provisória** — *decidido 2026-07-30* | Organização sem OWNER seria reportada como `ACTIVE` ao admin e continuaria inacessível ao lojista — pior que falhar. Então o consumidor cria (ou reaproveita, `createUser` é idempotente por e-mail) a identidade de `owner.billingEmail` e a vincula como OWNER. A senha fica de fora por dois motivos: **(a)** o fluxo HTTP devolve a provisória em `meta.provisionalPassword` e um consumidor não tem para quem devolvê-la — seria um segredo gerado e perdido; **(b)** sobrescrever a credencial de uma conta preexistente trancaria para fora alguém que já é OWNER de outra empresa. O primeiro acesso sai por `POST /v1/members/:id/reset-password`, que um JWT `platform_admin` alcança em qualquer organização (§5.10) |
| **Consumidor no mesmo processo da API, sem `main-worker`** — *decidido 2026-07-30* | A `clinica-api` separa porque tem seed pesado de agenda; aqui o handler é curto (duas escritas) e um segundo processo dobraria deploy e observabilidade sem ganho. `ERP_COMERCIO_WORKER_ENABLED=false` cobre o caso de N réplicas com uma só consumindo |
| **`HANDLED_VERTICALS = ['Comércio']`** — *2026-07-30 (revisa a decisão do mesmo dia sobre `'Food'`)* | O catálogo da plataforma passou a ter uma vertical por sistema, e food+varejo viraram `'Comércio'` — que é este ERP. `'Food'`/`'Varejo'`/`'Serviços'` não são mais emitidos, então o risco de provisionar a mesma loja em dois bancos (motivo original de deixar `'Food'` de fora) desapareceu. A `food-api` continua no repositório, mas a fila dela ficou sem evento |
| **Endereço malformado no evento vira `null`, não falha** — *2026-07-30* | CEP com 7 dígitos ou UF por extenso reprovariam o validador da `Branch` e derrubariam o provisionamento inteiro por um campo que ninguém precisa no dia 1. Documento, razão social, e-mail e responsável **continuam** falhando alto — a diferença é que sem eles a empresa não existe juridicamente |
| **CNPJ já cadastrado no ERP recusa o provisionamento em vez de adotar a organização** — *2026-07-30* | `Organization.document` é único global. Vincular a loja da plataforma a um tenant que nasceu fora do admin seria sequestrar dado de outra empresa com base num CNPJ digitado igual; recusar com motivo acionável deixa a decisão com quem tem contexto |
| **`customers` é módulo de topo (não sob `stock`)** — *decidido 2026-07-30* | Cliente é domínio comercial/CRM, não estoque. Endereços em tabela 1:N (`CustomerAddress`) porque o form do web permite vários tipados (`principal`/`entrega`/`outro`); documento nullable (unique Postgres permite vários nulls). Categorias com hard delete + 409 se em uso (paridade com o mock do FE). |
| **`carriers` é réplica estrutural de `suppliers`** — *decidido 2026-07-28* | Mesmo formato de cadastro de terceiro (documento único por organização, editável; vínculo por unidade; soft-delete + restore). `assertBranchesBelongToOrganization` é reexportada de `suppliers` em vez de duplicada — uma única implementação da checagem de unidade para os dois módulos |
| **Produto é da organização, com vínculo por unidade (`ProductBranch`)** — *decidido 2026-07-27* | Cadastro único na rede: muda o nome numa tela só e vale em todas. O que é local (existir ou não na filial) fica no pivot. Preço por unidade **não** entra aqui — pertence à Lista de preços |
| **SKU único na empresa** (antes por loja) | Um SKU identifica um item em toda a rede; casa com o cadastro único e com integração fiscal |
| **Pivot carrega só vínculo + `active`** | Preço e estoque por unidade têm casa própria (Lista de preços, Estoque). Pivot com preço duplicaria a regra em dois lugares |
| **Fornecedor com documento editável** (ao contrário de `Branch`) | Fornecedor é cadastro de terceiro: corrigir um CNPJ digitado errado é rotina, não troca de identidade |
| **`X-Store-Id` e `@StoreId` removidos** | Com o catálogo migrado, o header perdeu função. Um escopo só no app inteiro |
| **Autorização no banco do ERP, não no Keycloak** — *decidido 2026-07-27* | Um ERP tem regra de acesso complexa e por empresa (gerente na filial A, vendedor na B). Mapear isso em roles/grupos do Keycloak transforma o servidor de auth em pesadelo de manutenção. O Keycloak cuida da porta de entrada; `memberships` decide o que se faz dentro |
| **Escopo por header `X-Organization-Id`** (não path nem claim no token) | Deixa a URL limpa e concentra a validação num guard só. Claim no token amarraria troca de empresa a novo login e devolveria dado de negócio ao Keycloak |
| **Filtro global via extensão Prisma + escopo explícito nos repositórios** | Duas travas de natureza diferente: o `where` explícito pega o bug de chamada, a extensão pega o esquecimento. Uma sozinha deixa buraco |
| **`AsyncLocalStorage` nativo em vez de `nestjs-cls`**         | Uma dependência a menos para ~90 linhas. O middleware abre o escopo e o guard preenche — guard sozinho não consegue envolver o resto do pipeline num `run()` |
| **FK composta carregando `organization_id` em `BranchAccess`** | O banco torna fisicamente impossível ligar membro da organização A a unidade da B. Defesa estrutural sobrevive a bug de código e a query manual |
| **Senha provisória devolvida na resposta HTTP** (não por e-mail) | Mesmo fluxo do `platform/api`, e é o que permite testar pelo Swagger sem servidor SMTP. `crypto.randomInt` no lugar do `Math.random` do original — é material de credencial |
| **Rollback da identidade no Keycloak quando a gravação local falha** | Corrige um problema conhecido do `platform/api`: sem a compensação, sobra conta órfã que bloqueia a próxima tentativa com o mesmo e-mail |
| **Matriz única validada no use case, não por índice parcial**  | Unique parcial exigiria SQL manual, proibido por §5.9 |
| **Unidade desativada continua ocupando código e documento** | O unique do banco não conhece soft-delete. A checagem de duplicidade inclui as desativadas e a mensagem manda reativar — sem isso o INSERT estourava como 500 |
| **`GET /v1/branches/:id` respeita o `BranchAccess`** — *revisão de segurança 2026-07-27* | Saber o id de uma unidade não pode dar acesso ao cadastro fiscal dela. Fora do acesso do membro responde 404, igual a unidade de outro tenant |
| **Enumeração de CNPJ na criação de organização é aceita** | `Organization.document` é único global e a rota é `@SkipTenant`, então qualquer autenticado descobre se um CNPJ já é tenant. É o custo do dedup de contratante — no nível de `Branch` a mesma exposição foi evitada com unique por organização |
| **Documento do fornecedor é editável, ao contrário do da unidade** — *decidido 2026-07-27* | A unidade tem identidade fiscal própria e aparece em nota já emitida; o fornecedor é cadastro de terceiro, e corrigir um CNPJ digitado errado é rotina. O conflito só dispara se o documento pertencer a **outro** fornecedor (mesma regra do SKU do produto) |
| **Fornecedor isento não guarda inscrição estadual** | `stateExempt` limpa `stateRegistration` na gravação (e o validador reforça). Manter o número gravado deixaria o cadastro afirmando duas coisas contrárias |
| **Vínculos com unidades gravados dentro do `save` do fornecedor**, sem `replaceBranchAccess` separado | As unidades atendidas fazem parte do cadastro que o formulário envia de uma vez; salvar em duas chamadas abriria a janela em que o fornecedor existe apontando para a lista antiga. Transação via `prisma.scoped.$transaction` — o cliente cru perderia o recorte por organização |
| **`GET /v1/suppliers/:id` devolve também o excluído** | A aba "Excluídos" da listagem leva até ele, e a tela precisa mostrar o cadastro antes de restaurar. Diferente de `Branch`, cujo `:id` recorta por `BranchAccess` |
| ~~`catalog` continua em `storeId`~~ — **concluído em 2026-07-27** | Migrado para `organizationId` + `ProductBranch`; o header `X-Store-Id` deixou de existir |
| Clean Architecture por módulo, réplica de `food/api`          | Padrão único entre serviços NestJS clean-arch do monorepo; testável com repos in-memory |
| Schema Prisma `erp` no banco `citybox_platform`         | Vertical/app lazily provisionado no tenant único (ADR C-15)  |
| Sem worker/RabbitMQ no scaffold inicial | Nenhum módulo exige fila ainda |
| **Object storage MinIO** (`StorageModule` + bucket `erp`) — *2026-07-27* | Imagens de produto; key `{organizationId}/catalogo/products/{productId}.{ext}`; coluna `imageUrl` guarda a object key; response expõe `hasImage` (nunca a key crua) |
| `db:seed` recria ambiente | Organização + unidades + responsável + catálogo + fornecedores |
| **IDs com `@default(uuid())`** (não `citybox_uuid_v7()`) — *decidido 2026-07-27* | Decisão do responsável. Alinha com `food/api` e `platform/api`, os outros schemas do mesmo banco `citybox_platform`. O `citybox_uuid_v7()` **não existe** nesse banco (o init `infra/postgres/init/02-*.sql` só cobre bancos novos) e criá-lo exigiria SQL manual, proibido por §5.9 |
| **Migrations só via `prisma migrate dev`** (§5.9)             | SQL manual sai de sincronia com o schema e não sobrevive a `migrate reset` |
| Denormalizados `hasVariants` / `variantsCount` no `Product`   | Derivados de `productVariations.length` no create/update (Fase B.1). Continuam denormalizados para a aba "Com variação" da listagem |
| `stock` **não** persistido aqui · `priceLists` = nomes via join | Estoque é módulo futuro. Listas de preço vivem no mesmo `catalog` (`PriceList`/`PriceListItem`); o presenter de produto devolve só os **nomes** |
| Dinheiro em **centavos** (`basePriceCents` / `priceCents` / `adjustmentValue` em fixed) | Convenção do monorepo; o front converte para reais no mapper |

---

## 11. Contexto para a IA

### O que NÃO fazer
- **Não criar rota de negócio sem escopo de organização** — use `@OrganizationId()` (§5.10). `@SkipTenant()` só para o que existe antes de haver organização.
- **Não reintroduzir `X-Store-Id` nem `@StoreId`** — foram removidos; o escopo é organização + unidade (§5.4).
- **Não usar `prisma` cru em model tenant-scoped** — é `prisma.scoped`. O cru é do guard e dos models sem tenant (`Organization`, `User`).
- **Não adicionar model com `organization_id` sem registrá-lo em `TENANT_SCOPED_MODELS`** — sem isso, as queries dele escapam do recorte.
- **Não representar papel de ERP como role/grupo do Keycloak** — a autorização mora em `memberships` (§5.10).
- Não importar de `@prisma/client` — usar `generated/prisma/`.
- Não colocar regra de negócio em `*.route.ts` nem em repositórios.
- Não fazer `domain`/`application` importarem NestJS/Prisma/Express.
- Não injetar a impl Prisma no use case — depender da interface (token).
- Não lançar `HttpException` solta — usar subclasse de `AppError` com sufixo de nome correto.
- Não usar `error.errors` do Zod — é `error.issues` (v4).
- Não instalar pacotes com npm/yarn — usar pnpm.
- Não copiar worker/RabbitMQ da `food/api` sem necessidade real. **Storage MinIO**, **Keycloak Admin API** e o **consumidor RabbitMQ de `citybox.store.*`** já foram adotados (imagem de produto, tenancy e provisionamento por evento — §9.1).
- **Não reintroduzir `'Food'`/`'Varejo'`/`'Serviços'` em `HANDLED_VERTICALS`** — esses valores saíram de `StoreVertical` no `platform-api`; o filtro trata `'Comércio'` e ponto (§9.1).
- **Não duplicar o contrato dos eventos de loja** — o tipo mora em `packages/messaging/src/contracts/store-events.ts`. Foi exatamente a duplicação `platform-api`/`clinica-api` que fez as cópias divergirem.
- **Não processar evento sem `EventDedupeService.claim`**, nem esquecer o `release` no catch: a entrega é at-least-once e um erro transitório ficaria marcado como processado, perdendo o evento para sempre.
- **Não deixar `store.created` terminar sem callback** — a loja fica presa em `PROVISIONING` no admin. É o bug que a Fase 11 consertou.
- Não escrever migration à mão — só `db:migrate:dev` (§5.9).
- Não esquecer `db:generate` depois de mexer em `@default`/tipos do schema: o client gerado fica desatualizado e, com `@default(uuid())`, o id vai **NULL** para o banco (`P2011`) em vez de ser gerado no client.
- Não usar `upsert` com `update: {}` vazio em model com `@updatedAt`: o Prisma não preenche a coluna e o INSERT viola o NOT NULL. Passe `updatedAt` explícito (ver `prisma/seed.ts`).

### Ao criar o **primeiro módulo**
1. Ler `apps/verticals/food/api/src/modules/store-profile/` como referência mínima completa.
2. `domain/entities/<x>.entity.ts` (`extends Entity<Props>`) + `domain/validators/<x>.zod.validator.ts` + `domain/factories/<x>-validator.factory.ts` + `domain/repositories/<x>.repository.interface.ts` (abstract class).
3. `application/use-cases/<acao>/<acao>.use-case.ts` (`implements IUseCase`) + `.spec.ts` com repo in-memory (`tests/in-memory-<x>.repository.ts`).
4. `infrastructure/database/prisma-<x>.repository.ts` + `infrastructure/http/routes/<acao>/{route,dto}.ts` (+ `presenter.ts` em `routes/shared/` se houver mais de uma rota).
5. `<modulo>.module.ts` — registrar controllers/providers, bind da interface → impl Prisma.
6. Adicionar o `model` em `prisma/schema.prisma` (`@@schema("erp")`) + `pnpm db:migrate:dev`.
7. Importar o módulo em `src/app.module.ts`.
8. Atualizar as seções 4, 9, 10 e 12 deste `AGENTS.md`.

---

## 12. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data       | Mudança                                             | Impacto                          |
| ---------- | --------------------------------------------------- | --------------------------------- |
| 2026-08-20 | **`SaleOrderLine.productId` vira opcional (spec erp/031 D1):** migration `sale_order_line_optional_product` (`productId String?` + `description String?` + `CHECK` produto-xor-serviço) — Postgres trata `NULL` como distinto em `@@unique([saleOrderId, productId])`, então múltiplas linhas de serviço na mesma venda continuam válidas sem índice parcial. `SaleOrderLine.product` vira relação opcional — todo consumidor que fazia `line.product.name` sem checar `null` foi corrigido (`prisma-sale-order.repository.ts` `findById`, `resolve-sale-order-items.ts` do `nfe-issuance` — NF-e passa a filtrar só linhas de mercadoria, linha de serviço não entra no documento fiscal — e `prisma-pos-cash-session.repository.ts`). Revisado pelo `database-reviewer` antes de implementar | `sale-order.entity.ts` (`SaleOrderLineProps`/`normalizeLines`); `assert-sale-order-references.ts`/`build-sale-outbound-movement.ts` (pulam linha sem `productId`); `sale-order.presenter.ts`; `sale-order.repository.interface.ts` (`SaleOrderDetailLine`); `service-orders.service.ts`/`extract-service-order-sale-lines.ts` (novo, função pura testável sem banco) |
| 2026-08-20 | **`CreateEntryFromTransactionUseCase` ganha `customerId`/`supplierId` (spec erp/031 D2):** módulo `bank-reconciliation` passa a importar `CustomersModule`/`SuppliersModule`; valida existência via `assertCustomerExists`/`assertSupplierExists` (mesmos helpers de `create-financial-entry`), mutuamente exclusivos (`FinancialEntry.create()` já lançava `FinancialEntryPartyConflictError`, só não era alcançável por este endpoint) | `create-entry-from-transaction.dto.ts` (HTTP + application); `create-entry-from-transaction.use-case.ts`; `bank-reconciliation.module.ts` |
| 2026-08-15 | **`NfeIssuance`/`NfseIssuance` ganham `errorCode`/`errorMessage` (spec erp/028):** nullable, migration `nfe_nfse_issuance_error_fields` — a fiscal-api já devolvia os dois na resposta de sucesso da própria emissão (`POST /v1/nfe`/`POST /v1/nfse`), o erp-api os descartava em `HttpFiscalApiClient`; motivo foi permitir a tela de emissão mostrar o motivo da rejeição sem round-trip extra a `GET /v1/fiscal-documents` | `IssueNfeResult`/`IssueNfseResult` (interface); `http-fiscal-api-client.ts` (2); `issue-{nfe,nfse}.use-case.ts`; `prisma-nfe-issuance.repository.ts`/`prisma-nfse-issuance.repository.ts`; `nfe-issuance.presenter.ts`/`nfse-issuance.presenter.ts` |
| 2026-08-15 | **`FISCAL_API_URL` sempre normalizada para terminar em `/api` (spec erp/027):** `normalizeFiscalApiUrl(raw, logger)` nos dois `http-fiscal-api-client.ts` (`nfse-issuance`/`nfe-issuance`) — trim + remove barra final + garante `/api`; vazia/só espaço cai no default com `logger.warn('[FiscalConfig] ...')`, nunca falha o boot. Incidente de produção: variável sem `/api` (`.env.example`/`docker-compose.yml` desalinhados do default correto do código) causava 404 silencioso, log `[FiscalBusiness]`, mensagem genérica "Não foi possível resolver o Emitente fiscal" — parecia bug de negócio, era config | `apps/erp/api/.env.example`; `services/platform/docker-compose.yml` (env `erp-api`); ambos `http-fiscal-api-client.ts` + specs |
| 2026-08-16 | **Auditoria do Estoque — performance.** (1) **N+1 do `GET /v1/stocks` eliminado**: o controller chamava `hasMovementsOrBalance` (2 COUNTs) por linha dentro de um `Promise.all` — com `perPage=100` eram **200 queries simultâneas** contra um pool default de 10, degradando todas as outras rotas do processo, não só a tela. Novo `findStockIdsWithMovementsOrBalance` (2 `groupBy` para a página inteira); a resolução saiu do controller e foi para `ListStocksUseCase` (a rota injetava `StockMovementRepository` direto, furando a camada), e `ListStocksResult` ganhou `stockIdsWithMovements`. (2) **N+1 sequencial do inventário**: laço com 2 `await` por linha — 1.000 SKUs = 2.000 round-trips **em série** antes de a transação abrir. Agora 2 queries no total, via `getBalancesForStockProducts` (já existia em lote e não era usado) + `findTrackableMany` (novo em `StockProductLookup`). (3) **5 índices compostos** (migration `20260816230000_stock_composite_indexes`): `production_orders` não tinha **nenhum** índice com `created_at`, que é a ordenação padrão da listagem; `purchases` e `stock_transfers` filtravam e ordenavam por colunas em índices separados (planner só usa um); `inventories` por `stock_id + created_at`; `stock_balances` por `stock_id + quantity` para o filtro de situação | ⚠️ **Migration criada mas NÃO aplicada** — rode `pnpm --filter @citybox/erp-api db:migrate:deploy`. Índice não altera comportamento, então nada de teste depende disso. SQL sem `CONCURRENTLY` (Prisma roda em transação); tabelas do módulo são pequenas, mas o comentário na migration registra a alternativa |
| 2026-08-16 | **Auditoria do Estoque — decisões de produto (lote 3).** (1) **Custo do insumo na produção deixa de ser preço de venda**: o BOM lookup usava `Product.basePriceCents`, então um insumo de R$ 2,00 que vende a R$ 6,00 entrava no ledger a R$ 6,00 e o acabado saía com custo 3× inflado — CMV e margem invertidos, com o número exibido na tela como "custo". Passa a usar `PurchaseLine.costCents` da **última compra recebida** (`findLastPurchaseCosts`, uma query só para todos os insumos). Sem compra recebida ainda → 0, deliberadamente: melhor não valorar do que valorar pelo preço de venda. **Decisão registrada:** custo médio ponderado seria mais correto, mas exige coluna nova + backfill + tocar todos os fluxos de entrada — fica como spec própria; a troca da fonte depois é local a este helper. (2) **Recebimento all-or-nothing** (`Purchase.assertReceiptIsComplete`): rejeita `deliveryStatus='received'` com linha `pending`. Antes, o movimento saía só com as linhas recebidas mas o `stockMovementId` era gravado assim mesmo, e a compra ficava **travada para sempre** — a linha pendente não tinha caminho de recebimento. O diálogo da UI já forçava `received`/`cancelled`; o invariante fecha a mesma porta no contrato da API. Recebimento em etapas (`purchase_receipts`) fica como spec própria | 4 casos novos em `purchase.entity.spec.ts`. ⚠️ `findLastPurchaseCosts` reduz "mais recente por produto" em memória (não `DISTINCT ON`) — aceitável no volume atual (dezenas de compras por insumo); se virar gargalo, o caminho é materializar custo no produto |
| 2026-08-16 | **Auditoria do Estoque — lote 2 (alto).** (1) **Três 500 reproduzíveis viraram 409**: excluir categoria de movimentação já usada (`MovementCategoryRepository.isInUse`, FK `Restrict` que a rota já documentava como 409 e nunca cumpria); excluir depósito referenciado por compra/inventário/transferência/OP pendente (`StockRepository.hasDependents` — nenhum deles gera movimento, então passavam em `hasMovementsOrBalance`); corrida no `nextCode` de categoria (`P2002` → `MovementCategoryCodeTakenError`, com o use-case recalculando o código em até 3 tentativas). (2) **Guardas de concorrência**: `finalizeWithMovements` e `cancelWithReversal` passam a fazer `updateMany` condicionado ao status **dentro** da transação e devolvem `null` quando perdem a corrida — o use-case relê e devolve o estado atual, preservando a idempotência que já existia no caminho sequencial. Antes, duas requisições simultâneas duplicavam consumo+entrada de produção e geravam 4 movimentos de estorno numa transferência. (3) **Produção valida `trackStock` e respeita `optional`**: o BOM lookup rejeitava só `type === 'supply'`, então finalizar um acabado com `trackStock=false` criava linha em `stock_balances` que o balanço filtra — saldo **invisível na tela** que ainda travava a exclusão do depósito; e componentes marcados como `optional` eram consumidos em toda ordem | Novos testes: corrida de cancelamento (prova 6 movimentos sem a guarda vs 4 com), corrida de finalização, exclusão bloqueada de categoria/depósito. ⚠️ `in-memory-production-bom.lookup` não modela `trackStock`/`optional` — o item (3) só seria coberto por teste de integração contra Postgres |
| 2026-08-16 | **Autorização — escalação de privilégio corrigida (auditoria do módulo Estoque).** (1) `resolveCoarseFromFine` avaliava o prefixo **antes** do sufixo: `estoque.inventarios.view` casava a regra `estoque.` e recebia `store.stock.manage` — a capability de escrita de todas as rotas do módulo. O `if (fine.endsWith('.view'))` vinha depois do `break` e era inalcançável para esse fim. Agora `.view` sai cedo concedendo só `org.view`. **O perfil de sistema `Financeiro` era o caso concreto**: nasce de `withSuffix(withPrefix(ERP_IDS, ['estoque.']), '.view')` e portanto podia apagar depósitos e lançar movimentações. (2) `PermissionGuard` **unia** as permissões do papel com as do perfil, tornando o perfil puramente aditivo — como `MEMBER` já concede `store.stock.manage`, atribuir perfil restritivo não restringia nada e a tela de Perfis de Acesso era decorativa para todo `store.*`. Agora, havendo perfil, ele é a autoridade; papel vira fallback para membro sem perfil (contrato já declarado em `TenantContext.permissionIds`). **OWNER é exceção deliberada** — mantém o papel mesmo com perfil, senão atribuir um perfil restritivo ao dono cria estado sem saída (ninguém mais teria `org.members.manage` para desfazer) | ⚠️ **Mudança de comportamento em produção:** membros ADMIN/MEMBER com perfil atribuído passam a ser efetivamente restringidos por ele. Novos specs: `fine-to-coarse.spec.ts` (10 casos) e `permission.guard.spec.ts` (9 casos) |
| 2026-08-16 | **Inventário aceita saldo de sistema negativo.** `systemQuantity` é snapshot do ledger, não entrada do usuário, e o ledger admite negativo de propósito — mas passava por `normalizeNonNegativeQuantity` e derrubava a contagem inteira com *"A quantidade contada não pode ser negativa"*, culpando o campo errado. O inventário é o **único** mecanismo para corrigir saldo negativo e recusava-se a rodar nesse caso. Separado em `normalizeSystemQuantity` (só finito) e `normalizeCountedQuantity` (mantém não-negativo, mensagem própria) | `inventory.entity.ts`; 3 casos novos em `create-inventory.use-case.spec.ts` |
| 2026-08-16 | **Recebimento de compra: corrida fechada.** A guarda `stockMovementId` era read-modify-write sem trava (leitura no use-case, fora da transação) e o `upsert` não exigia `stockMovementId = null`. Dois `PUT` concorrentes (duplo clique em Salvar) geravam **dois** movimentos de entrada — saldo dobrado e um movimento órfão, com a compra travada por `PurchaseAlreadyReceivedError` a partir daí. Trocado por `updateMany` guardado por `stockMovementId: null`: em READ COMMITTED o segundo writer bloqueia na linha, reavalia o WHERE e casa 0. Caminho de criação (id fresco, sem corrida) cai em `create` | `prisma-purchase.repository.ts`. **Follow-up recomendado:** índice único parcial em `(source_type, source_id)` para `purchase` como garantia no nível do banco |
| 2026-08-16 | **`Purchase.linesTotalCents` exclui linha `cancelled`.** O frontend já aplicava essa regra (`sumLineCosts`); o domínio somava todas as linhas, e o total divergia entre a tela de edição e a listagem/detalhe. Linha cancelada foi marcada como não recebida no diálogo de recebimento e não é cobrada; `pending` continua contando. `totalCents` é derivado na leitura (não há coluna `total_cents` em `Purchase`), então não exigiu migração | `purchase.entity.ts`; novo `purchase.entity.spec.ts` (7 casos) |
| 2026-08-14 | **`POST /v1/members` nome único:** `lastName` vazio permitido; join do nome ignora partes vazias — evita `"Bruno Bruno"` quando o ERP manda só um nome | DTO `CreateMemberHttpDto` + `CreateMemberUseCase` + teste |
| 2026-08-14 | **`PUT /v1/members/:id/pdv-pin` aceita `pdvCode`:** o DTO HTTP só tinha `pin`; o create do ERP web mandava `{ pin, pdvCode }` e o ValidationPipe descartava o código → membro sem PIN/código → lista vazia no PDV | Rota + use case já suportavam; teste de regressão `set-member-pdv-pin.use-case.spec.ts` |
| 2026-08-13 | **Realm próprio `citybox-erp` (ADR C-16 + C-17, tarefa T1.B):** `keycloak-jwt.ts` perde a lista de issuers de fallback (`auth.citybox.com`, `127.0.0.1:8080`) — issuer único e obrigatório vindo de `KEYCLOAK_ISSUER`, e ganha `allowedAuthorizedParties()`; `AuthGuard` valida `azp` contra `KEYCLOAK_ALLOWED_AZP` e roda o dev bypass **antes** da verificação; `authenticatedUserFromJwtPayload` recebe `{ clientId }` em vez de ler dois client ids fixos, e não promove mais service account a operador de plataforma; `KeycloakAdminService` autentica com `KEYCLOAK_PROVISIONING_CLIENT_ID/_SECRET` (`erp-provisioning`, `manage-users` só neste realm) e perdeu `ensureComercioBackofficeAccess`/`ensureRealmRole`/`assignBackofficeClientRole`; a porta `IdentityProvider`, o `KeycloakIdentityAdapter`, o `FakeIdentityProvider` e `SyncOrganizationFromStoreUseCase` perderam `ensureComercioBackofficeAccess`; `permissions.ts` perde os mapas de papel global e passa a regra única *role com ponto é a permissão*, exportando `PLATFORM_ADMIN_ROLE`; `tenant-context.guard.ts` e o dev bypass passam a falar `platform.admin` | **Envs renomeadas:** `KEYCLOAK_ADMIN_CLIENT_ID/_SECRET` → `KEYCLOAK_PROVISIONING_CLIENT_ID/_SECRET`; **novas:** `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_ALLOWED_AZP`, `KEYCLOAK_REALM`, `KEYCLOAK_BASE_URL`. Um `.env` antigo faz `POST /v1/members` responder 503 e o `AuthGuard` lançar por `KEYCLOAK_ALLOWED_AZP` ausente. Ver §5.3.1 |
| 2026-08-13 | **Caixa sem sangria no seed:** `CAIXA_PERMISSIONS` exclui `pdv.operacao.caixa.withdrawal`; constante `PDV_CAIXA_WITHDRAWAL_PERMISSION`; script `db:strip:caixa-withdrawal` para orgs já provisionadas | PDV pede PIN de quem tem a permissão fina de sangria |
| 2026-08-13 | **`Membership.isSeller` (“Usuário vendedor”):** coluna `is_seller` default **true**; create/update/list (`?isSeller=`); `GET /v1/pos/sellers` (device); create POS sale valida `sellerId` = userId com membership ativa `isSeller` | Listas de vendedor ERP+PDV; independente do perfil de permissões |
| 2026-08-13 | **Operadores PDV → Membership:** campos `pdvCode`/`pdvPinHash`/lockout no `Membership`; device `v1/pos/operators*` lê Membership (`id`=userId, `permissionIds`); `PUT /v1/members/:id/pdv-pin`; permissão `pdv.operacao.alcada.authorize`; drop `pos_operators` + CRUD JWT; script `db:migrate:pos-operators-to-memberships`; POS sale `createdByUserId` = operador | Unifica identidade caixa/backoffice; supersede decisão §D1 antiga (PosOperator separado) |
| 2026-08-11 | **Conciliação bancária — busca manual sem bug de status + layout de referência (spec `006-bank-reconciliation`, research.md D16/D17):** `reconcile-transaction.use-case.ts` deixa de filtrar candidatos por `status === 'pending'` — passa a checar `bankStatementMatchRepository.findActiveFinancialEntryIds` explicitamente (FR-033) e ramifica por status: `pending` mantém `addPayment()`; `paid` sem vínculo ativo concilia só criando o `BankStatementMatch` (vínculo ao pagamento já existente, sem `addPayment`/`save`, exige exatamente 1 pagamento no lançamento — `FinancialEntryPaymentAmbiguousError` senão). Novo `domain/services/eligible-amount.ts` (`calculateEligibleAmountCents`). Novo endpoint `GET v1/bank-statements/:id/transactions/:transactionId/eligible-entries` (`SearchEligibleEntriesUseCase`) substitui a chamada direta do frontend a `GET /v1/financial-entries` (que causava o bug — filtrava `status=pending` fixo). `FinancialEntryListCriteria` ganha `customerId`/`supplierId`/`paidFrom`/`paidTo`/`paymentMethod`/`cardBrand` | Corrige o bug relatado pelo usuário (busca manual só mostrava lançamentos pendentes) sem quebrar o invariante "nunca conciliação parcial"; fecha os filtros completos (FR-038) e a exclusão explícita de já-vinculados (FR-033) no novo endpoint dedicado |
| 2026-08-10 | **Conciliação bancária — layout de referência: soma de N lançamentos, conta editável, filtro de período (spec `006-bank-reconciliation`, US4/D14/D15):** confirmado que `reconcile-transaction.use-case.ts` já validava soma de N lançamentos antes de qualquer escrita (US4 já estava implementada no backend, só faltava a UI multi-select — sem mudança de backend aqui). `CreateEntryFromTransactionUseCase` ganha `bankAccountId` no corpo (`assertBankAccountExists`), substituindo o `bankStatement.bankAccountId` fixo. `ListStatementTransactionsUseCase`/`PrismaBankStatementTransactionRepository`/`InMemoryBankStatementTransactionRepository` ganham `postedFrom`/`postedTo` opcionais, filtrando por `postedAt` | Fecha os 3 mockups de layout enviados pelo usuário (tela principal com filtro de período, drawer "Buscar Registros" com seleção múltipla, "Novo Registro" com conta editável) — decisões registradas em `/speckit-clarify` 2026-08-10 (research.md D14/D15) |
| 2026-08-10 | **Conciliação bancária — excluir transação e criar lançamento (spec `006-bank-reconciliation`, US3/US5/US6):** `DiscardTransactionUseCase` + `POST v1/bank-statements/:id/transactions/:transactionId/discard` (só `pending → discarded`, 422 se já tratada) e `CreateEntryFromTransactionUseCase` + `POST .../create-entry` (cria o `FinancialEntry` já pago + concilia numa operação, `operation`/valor/datas sempre derivados da transação). `create-entry` ganhou `chartOfAccountId`/`costCenterId` obrigatórios no corpo — não previstos no `contracts/` original da spec, necessários porque `FinancialEntry.create()` passou a exigir ao menos 1 linha de rateio (regra introduzida por `007-financeiro-ajustes-ui`, depois do desenho inicial de `006`); módulo `bank-reconciliation` passa a importar `ChartOfAccountsModule`/`CostCentersModule`. Busca manual (US3) e "Conciliar" (US2) continuam reaproveitando a rota `.../reconcile` já existente (`research.md` D7, N=1) — nenhuma rota nova para isso | Fecha o gap reportado pelo usuário: a tela de conciliação bancária só tinha o botão "Conciliar" da sugestão automática implementado; busca manual, criar lançamento e excluir existiam na spec/plano mas nunca foram codados (`tasks.md` Phases 5/7/8 ficaram com todas as tasks `[ ]`) |
| 2026-08-09 | **Adicionais e Sugestões do produto (`specs/erp/008-catalogo-adicionais-sugestoes/`):** módulo `catalog` ganha 4 models Prisma (`ProductAddon`, `ProductAddonSettings`, `ProductAddonLine`, `ProductSuggestion`, migration `20260809184744_add_product_addons_and_suggestions`, aditiva) + CRUD `v1/product-addons` (molde `product-categories`) + `addonSettings`/`addonLines`/`suggestions` aninhados em `GET`/`PUT /v1/products/:id` (mesmo padrão replace-all de `variations`). `CreateProductUseCase`/`UpdateProductUseCase` ganham `ProductAddonRepository` no construtor + `resolveProductAddonLines`/`resolveProductSuggestions` (novos utils, moldados em `resolve-product-variations.ts`, mas duplicata é erro 409 em vez de "o último vence"). Validação cruzada `minQuantity <= maxQuantity` / `chargeFromQuantity >= 1` via `.refine()` no `ProductZodValidator` | Ver §9 bloco "Adicionais e Sugestões". Frontend (`erp-web`) segue 100% mock nas duas abas — próxima fatia troca o mock pela API, mesma sequência de Variações (Fase B.1) |
| 2026-08-12 | **Provision on demand:** `POST /api/v1/platform/stores/:id/provision` (org+matriz+OWNER+template+senha); consumer `store.created` ignorado; `store.updated` só atualiza se a org já existir | Senha volta no HTTP do admin; fila deixa de criar org sozinha |
| 2026-08-09 | **Bloqueio de exclusão de lançamento conciliado + rota de desfazer conciliação (spec `007-financeiro-ajustes-ui`, US10):** `DeleteFinancialEntryUseCase` (módulo `financial-entries`) passa a consultar `BankStatementMatchRepository.findActiveFinancialEntryIds` (método já existente, mesmo usado por `reconcile-transaction`) antes do `softDelete()` — lançamento com pagamento em conciliação ativa → 409 `FinancialEntryNotRemovableError` (nome com sufixo "NotRemovable" para o `app-exception.filter.ts` mapear automaticamente). Novo `UndoReconciliationUseCase` + rota `POST v1/bank-statements/:id/transactions/:transactionId/reconcile/undo` (módulo `bank-reconciliation`) fecham um gap pré-existente — o frontend já chamava essa rota e `BankStatementTransaction.undoReconciliation()` já existia, mas nenhum use-case os ligava; hard-deleta os `BankStatementMatch` da transação ao desfazer. `financial-entries.module.ts`↔`bank-reconciliation.module.ts` agora usam `forwardRef()` nos dois lados (ciclo real novo entre módulos irmãos: `financial-entries` passou a precisar de `BankStatementMatchRepository`, e `bank-reconciliation` já importava `financial-entries` desde `006-bank-reconciliation`). Nenhuma migration Prisma — `BankStatementMatch` já existia | Fecha a lacuna reportada em teste manual: soft-delete de lançamento não verificava pagamento de conciliação ativa, permitindo excluir um lançamento já conciliado sem desfazer o vínculo primeiro |
| 2026-08-07 | **Fix `TenantScopeMissingError` nas rotas de dispositivo:** `DeviceAuthGuard` passa a chamar `setTenantContext` depois de resolver o terminal (`organizationId`/`branchId` dele) | `v1/pos/operators`, `v1/pos/operators/sync`, `v1/pos/operators/authenticate` e `v1/pos/policy` lançavam **sempre** (não intermitente) porque nenhuma rota `@Public()` estabelecia `TenantContext` antes de repositórios `prisma.scoped` (`PosOperator`, `PosPolicy`) rodarem; PDV via "Erro interno ao consultar os dados da organização" na tela de login do operador |
| 2026-08-07 | **DRE reestruturada em 9 categorias fixas (spec `007-financeiro-ajustes-ui`, US5):** `GetIncomeStatementUseCase`/`IncomeStatementReportDto` reescritos — sai a forma binária `revenue`/`expense` (`ResultSection` com `shareOfSection`/`shareOfGroup`), entra `groups: IncomeStatementGroupDto[]` (sempre os grupos `classification=resultado` com `sign` preenchido, ordenados por `FinancialGroup.catalogOrder`, incluindo grupos sem lançamento no período com `totalCents: 0`) + `operatingResultCents` (soma de todos os grupos com o `sign` aplicado). `FinancialGroup.entity`/`PrismaFinancialGroupRepository` expõem `catalogOrder`/`sign` (campos adicionados na migration de US8, `save()` **não grava** os dois — só o seed/backfill os define, API de cadastro não deixa o lojista alterá-los). `get-income-statement.use-case.spec.ts` reescrito para o novo shape | Corrige uma imprecisão do `data-model.md` desta spec: vários dos 9 grupos (não só 2) têm `ChartOfAccount`s legadas reais com dado de produção — a implementação itera as contas que cada grupo genuinamente tem, em vez de hardcodar quais grupos "deveriam" ter sub-categoria |
| 2026-08-07 | **Conciliação bancária — conta bancária opcional (spec `007-financeiro-ajustes-ui`, US4):** `BankStatement.bankAccountId`/`BankStatementTransaction.bankAccountId` viram `String?` (migration `20260807173058_make_bank_statement_account_optional`); auto-detecção por `bankCode` do arquivo (`resolveBankAccountByCode`, novo `BankAccountRepository.findActiveByBankCode`); endpoint novo `POST v1/bank-statements/preview` (só parse, sem persistir); dedupe de transações migra de `(bankAccountId, dedupeKey)` para `(organizationId, dedupeKey)`, com `computeDedupeKey` namespaceando por `bankCode:accountNumber` para não colidir entre contas | Achado do `database-reviewer` na revisão da migration: dedupe org-wide sem namespace por conta colidiria (`FITID` só é único dentro da conta emissora no spec OFX) — corrigido antes de aplicar |
| 2026-08-07 | **Formas de pagamento (`specs/erp/007-financeiro-ajustes-ui/`):** módulo novo `finance/payment-methods/` (Clean Architecture completa, molde `cost-centers`) — `model PaymentMethod` (migration `20260807161459_add_payment_methods_and_income_statement_categories`, aditiva); 15 formas de sistema semeadas via `store-setup` (`SEED_PAYMENT_METHODS`, template v4). `FinancialGroup` ganha `catalogOrder`/`sign` (mesma migration) para a DRE reestruturada em 9 categorias fixas — 4 dos 9 grupos reaproveitam as `systemKey`s originais (`receitas`/`despesas`/`custos`/`outras-receitas`, renomeadas), a conta `outras-despesas` foi movida para um grupo próprio novo (`outras-despesas-grupo`); `scripts/backfill-financial-group-catalog-order.ts` renomeia grupos/contas de organizações já provisionadas (writers de `store-setup` não reescrevem `name` por design). `financial-entries`: validação de `paymentMethod` muda de enum fixo para UUID existente em `PaymentMethod` (schema **inalterado** — `String` solto, ver `research.md` R1 da spec) | Corrige bug pré-existente: `scripts/provision-organizations.ts` não tinha `import 'dotenv/config'` e falhava com `ECONNREFUSED` — corrigido nesta mesma operação |
| 2026-08-06 | **Motor de recebíveis do contrato de cartões (`specs/erp/005-card-receivables-engine/`):** `card-contracts` ganha `domain/services/{card-settlement-calculator,business-day-calendar}.ts` (funções puras); `sales` ganha `infrastructure/database/resolve-card-settlement.ts` e reescreve `maybeCreateReceivable` (agora 1 `FinancialEntry` por parcela em pagamentos cartão/Pix, com fallback bruto seguro e agregado inalterado para dinheiro/boleto — ver §9 "Finance"). `SaleOrderPayment` ganha `cardPaymentType?`/`brand?`/`installments?`; `FinancialEntry` ganha 8 campos (`grossAmountCents`, `acquirerFeeCents`, `cardContractId`, `cardPaymentMethodId`, `saleOrderPaymentId`, `installmentSequence`, `installmentCount`, `cardSettlementFallback`) + índice único `(saleOrderPaymentId, installmentSequence)`. Migration `20260806140000_add_card_settlement_engine` (aditiva, sem backfill). Contrato HTTP de `/v1/card-contracts` inalterado. **Primeiro teste do `erp-api` contra Postgres real** (`prisma-sale-order.repository.card-settlement.spec.ts`, 11 casos) — sem precedente no repo até aqui | Contrato de cartão cadastrado passa a produzir efeito financeiro de verdade (antes era só CRUD sem consumidor); pré-requisito da futura conciliação bancária (`specs/erp/003-financeiro-conciliacao-bancaria`, ainda não iniciada). Fora de escopo, documentado: `cutoffPeriod`, antecipação, agrupamento (`grouping`), `voucher`, feature flag por organização, despesa separada da taxa, calendário de feriados |
| 2026-08-06 | **Extrato financeiro consolidado (`specs/erp/004-financial-statement/`):** `finance/financial-entries` estendido, sem módulo novo — `FinancialEntryListCriteria`/`FinancialEntryFilterQueryDto` ganham `competenceFrom`/`competenceTo` (eixo alternativo ao `dueFrom`/`dueTo`) e `bankAccountId`; `assertValidPeriodRange` valida os 2 eixos (`to < from` → `InvalidStatementPeriodError`, 422 — antes `dueFrom`/`dueTo` invertidos devolviam lista vazia silenciosa); repositório ganha `sumAmountsByOperation` (`groupBy(['operation'])`, reaproveita o `buildWhere` da listagem); rota nova `GET v1/financial-entries/summary` (cards de resumo do extrato, mesmos filtros da listagem, sem paginação). Nenhuma migration — zero model/campo Prisma novo | `/financas/extratos` (`erp-web`) deixa de ser placeholder; `GET v1/financial-entries` existente ganha 2 filtros novos sem quebrar contrato — consumidores antigos (tela de Lançamentos) inalterados |
| 2026-08-06 | **DRE real e análise por centro de custo (`specs/erp/003-financial-reports-cost-center/`):** submódulo novo `finance/reports/` (só leitura, sem entidade de domínio — `FinanceReportRepository` + `PrismaFinanceReportRepository`, agregação via `groupBy` sobre `financial_entry_allocations`), 2 rotas (`GET v1/reports/income-statement`, `GET v1/reports/cost-centers`); `FinancialGroup` ganha `classification` (`resultado`\|`patrimonial`, migration `20260806033844_add_financial_group_classification`) — não exposto na API de cadastro, só usado pela DRE para excluir grupos patrimoniais (`caixa-e-bancos`/`ativo`) do resultado; `scripts/backfill-financial-group-classification.ts` corrige organizações existentes | Fecha o ciclo dos 3 cadastros de suporte financeiro (grupo/plano/centro de custo) — a DRE deixa de ser mock no `erp-web`; corrige um bug de dado vivo (grupos patrimoniais inflando a receita da DRE) |
| 2026-08-06 | **Seed perfis v3:** só `Administrador` com `isSystem=true`; Financeiro/Gerente/Caixa/Vendedor/Contador/Atendimento nascem editáveis/excluíveis; template `version: 3` | Orgs já provisionadas em v2 precisam de `pnpm provision:orgs` (ou próximo store-setup) para destravar |
| 2026-08-06 | **CRUD `PermissionProfile` + catálogo + store-setup v2:** repos Prisma/in-memory; 6 use cases + rotas; `GET /v1/permission-catalog`; `CreateMember`/`UpdateMember` exigem/aceitam `permissionProfileId` (perfil `administrador` → `ADMIN`); template seed v2 upserta perfis e backfill memberships nulos → `administrador` | Autorização fina editável pelo lojista; membros legados recebem perfil no reprovisionamento |
| 2026-08-06 | **Domínio `PermissionProfile`:** entidade + erros + repositório abstrato; `Membership.permissionProfileId`; seed `SYSTEM_PERMISSION_PROFILES` em `createWithOwner`; `TenantContext.permissionIds` + união no `PermissionGuard` via `resolveCoarseFromFine` | Base para CRUD de perfis de acesso e autorização fina |
| 2026-08-04 | **M2M admin→ERP do responsável:** `authenticatedUserFromJwtPayload` promove `azp=citybox-core-admin` a `platform_admin` (paridade clinica-api); `store.updated` sempre chama `provision()` (idempotente) para recuperar FAILED onde a org já existia; `CLINICA_API_URL` default `http://clinica_api:3172` | Fecha 403 no card do responsável e falhas de provisionamento por migration/`store_setup` pendente |
| 2026-08-04 | **Provisionamento Comércio robusto + M2M do responsável:** `store.updated` sem org → `provision()`; `requireFields` faz fallback `tradeName→legalName`; `ensureComercioBackofficeAccess` (`store_staff` + `vertical.comercio.view`) após `createUser`; rotas M2M `GET/POST /api/v1/platform/stores/:platformStoreId/owner*` (`platform.admin` + `@SkipTenant`) | Fecha falhas por razão social vazia, permite reprocessar lojas FAILED ao editar no admin, e habilita o card "Responsável" do admin via `ERP_API_URL` |
| 2026-07-31 | **Motivo do movimento de estoque vira enum:** `StockMovementReason` derivado de (`sourceType`, `type`); `stock_movements.category_id` passa a ser **nullable** (migration `20260731145000_stock_movement_optional_category`) e só o lançamento manual exige categoria (invariante da entidade); venda, compra, produção, transferência e inventário deixam de chamar `findBySystemKey`; `reason` exposto em listagem/detalhe/kardex e disponível como filtro em `GET /v1/stock-movements?reason=` | Um cadastro incompleto de `movement_categories` não derruba mais fluxo automático (era o 404 `MovementCategoryNotFoundError`). As categorias seed continuam existindo, agora só como sugestão do select manual |
| 2026-07-31 | **Módulo `store-setup`:** template versionado `ERP_SEED_TEMPLATE` + `ProvisionOrganizationDataUseCase` idempotente; flags `systemKey`/`isSystem` em UoM, ProductCategory, Stock, MovementCategory, FinancialGroup, ChartOfAccount, CostCenter, ServiceOrderStatus, ContractStatus; model `StoreSetupLog`; gatilhos em `CreateOrganization`, consumidor `store.created` e `pnpm provision:orgs`; deletes bloqueados (409); `prisma/seed.ts` passa a usar `applyErpSeedTemplate` | Toda org nova já nasce com dados mínimos; fecha o 404 `MovementCategoryNotFoundError` no fechamento de pedido |
| 2026-07-31 | **Módulo `finance` completo (cadastros de suporte + migração):** models `FinancialGroup`/`ChartOfAccount`/`CostCenter`/`CardContract`/`CardPaymentMethod`/`CardRateTier` + enums; migration `20260731121355_add_finance_support_cadastros`; permissão `store.finance.manage` (OWNER/ADMIN); 6 submódulos Clean sob `modules/finance/`; `sales/financial/` removido; seed de grupos/plano/centros; `BankAccount`/`FinancialEntry` reescritos em Clean com URLs intactas | Fecha a fatia de suporte financeiro; plano de contas/centros ainda não entram como FK em `FinancialEntry.categoryName` |
| 2026-07-31 | **Contas bancárias e lançamentos migram para `modules/finance/` em Clean Architecture:** `sales/financial/` (serviços + controllers direto sobre Prisma) **removido**; novos submódulos `finance/bank-accounts/` e `finance/financial-entries/` com entidade, repositório abstrato, 6 use cases cada, repo Prisma + in-memory e uma rota por arquivo. URLs `v1/bank-accounts` e `v1/financial-entries` preservadas; models Prisma **inalterados** (sem migration). Escrita passa a exigir `store.finance.manage` (era `store.sales.manage`); listagens ganham `tab`/`tabCounts`/paginação; item único passa a responder `{ data }`; `POST :id/restore` é novo. `FinancialEntriesModule` importa `BankAccountsModule` para validar `bankAccountId`. Web (`bank-accounts.service.ts`, `financial-entries.service.ts`) ajustado para busca/paginação server-side e para o envelope `{ data }` | `SalesModule` deixa de importar `FinancialModule`; `PrismaSaleOrderRepository.maybeCreateReceivable` segue criando o recebível via Prisma direto na TX da venda, sem depender dos módulos novos. 17 testes novos |
| 2026-07-31 | **`sellerId` do pedido de venda deixa de ser UUID:** `SaleOrderWritableHttpDto.sellerId` valida `@IsString() @MaxLength(64)` | O campo não é FK no schema — guarda a identidade do vendedor na origem (usuário Keycloak/membro). Web passou a enviar o `userId` de `/v1/members` |
| 2026-07-30 | **Promoções `tab` + `salesTotal` real:** `GET /v1/promotions?tab=active\|deleted` + `tabCounts`; listagem de clientes soma `SaleOrder` fechados em `salesTotal` | Completa fases 7–8 no consumo web |
| 2026-07-30 | **Módulo `sales` (fases 1-4) — pedidos de venda:** models `SaleOrder`/`SaleOrderLine`/`SaleOrderPayment` + enums `SaleOrderStatus`/`SaleOrderChannel`; `sale` novo em `StockMovementSourceType`; CRUD completo `/v1/sale-orders` (+ `PATCH status` + `restore`) Clean Architecture (entidade, repositório abstrato, 7 use cases, repo in-memory + Prisma); fechar o pedido gera **no máx. 1** `StockMovement` de saída (categoria de sistema `venda`, só linhas `trackStock=true`), idempotente via `stockMovementId`; `PUT`/cancelar após a baixa → 409; permissão nova `store.sales.manage` (OWNER/ADMIN/MEMBER); seed categoria `venda`; migration `20260731012500_add_sales_module` | Primeira fatia do módulo `sales`; abre espaço para os submódulos finos de OS/contratos/promoções/financeiro (fases 5-8) sob `modules/sales/*` |
| 2026-07-30 | **Submódulos finos `sales` (fases 5-8):** models `ServiceOrder(Status)`, `SalesContract`+`ContractStatus`+`ContractInstallment`, `Promotion` (+enum `PromotionType`), `BankAccount`, `FinancialEntry` (+enum `FinancialEntryOperation`) — todos schema `erp`, TENANT_SCOPED; 4 submódulos (`service-orders/`, `sales-contracts/`, `promotions/`, `financial/`) direto sobre Prisma (sem `domain`/`application` em camadas); `PrismaSaleOrderRepository.saveWithOptionalMovement` ganha `maybeCreateReceivable` (gera `FinancialEntry` ao fechar venda com pagamento) | Fecha o escopo inicial de `sales`; ver §9 para as rotas de cada submódulo. Sem testes automatizados ainda nesses 4 |
| 2026-07-31 | **Rename `apps/erp-comercio/api` → `apps/erp/api`:** pacote `@citybox/erp-comercio-api` → `@citybox/erp-api`; porta 3111 → 3114 (evita a colisão pré-existente com `imoveis-web`, que também usava 3111) | Substitui o antigo shell multi-vertical `apps/erp` (:3107) — ver `../AGENTS.md` §9. Fila RabbitMQ `erp-comercio.store-setup` e env `ERP_COMERCIO_WORKER_ENABLED` mantidos sem alteração (fora de escopo) |
| 2026-07-30 | **Fase 11 (ADR PLAT-001) — ponte com a plataforma:** `Organization` ganha snapshot de plano + `suspendedReason`/`platformUpdatedAt`/`syncedAt`; model `ProcessedEvent`; `SyncOrganizationFromStoreUseCase` (provision/update/applyPlanChange/setSuspended); `StorePlatformConsumer` na fila `erp-comercio.store-setup` (`citybox.store.#`, só `Comércio` — era `Varejo`/`Serviços` antes da redução do catálogo em 2026-07-30) com callback `citybox.provisioning.*` em qualquer desfecho; `OrganizationRepository.findByPlatformStoreId`; novas envs `RABBITMQ_*` e `ERP_COMERCIO_WORKER_ENABLED` | O ERP deixa de ser ilha: loja de comércio criada no admin vira organização + matriz + OWNER, e sai de `PROVISIONING`. **Dependência nova: `@citybox/messaging`.** Ver §9.1 |
| 2026-07-30 | **Módulo `customers`:** models `Customer`/`CustomerAddress`/`CustomerBranch`/`CustomerCategory` + enums `CustomerStage`/`CustomerAddressType`; CRUD `/v1/customers` (+ restore) e `/v1/customer-categories`; permissão `org.customers.manage`; TENANT_SCOPED; seed 2 categorias + 4 clientes; 18 testes | API + web de clientes integrados (`features/customers`) |
| 2026-07-29 | **Compras — restore:** `POST /v1/purchases/:id/restore` (limpa `deletedAt`, idempotente; sem efeito no ledger) | Paridade com suppliers/carriers; aba Excluídas no web |
| 2026-07-29 | **Fase 9 — Polish catálogo/estoque:** `sumQuantitiesByProductIds({ branchId? })`; sort `stock_*` + filtro `stock=in_stock\|out_of_stock` no `ListProductsUseCase`; enrich `stock` em create/update/restore/image | Lista de produtos com saldo da unidade; filtro Em/Sem estoque server-side |
| 2026-07-29 | **Fase 8 — Ordens de produção:** models `ProductionOrder`/`ProductionHistoryEntry` + enums `ProductionOrderStatus`/`ProductionHistoryKind` (flat sob `modules/stock`); `ProductionBomLookup` lê a `TechnicalSheet` ao vivo; CRUD + `start`/`cancel`/`finalize`/`history` em `/v1/production-orders`; `finalize` gera até 2 `StockMovement` (`consumo-interno` + `entrada-avulsa`) na mesma transação; `start`/`cancel`/`finalize` idempotentes | Backend + web `features/production` via API (React Query); mocks removidos |
| 2026-07-29 | **Fichas técnicas (BOM) no `catalog`:** models `TechnicalSheet`/`TechnicalSheetComponent`/`TechnicalSheetOptionComponent` + enum `ProductionType`; list/get/upsert `/v1/technical-sheets*`; insumos = products `type=supply`; custo derivado de `basePriceCents`; TENANT_SCOPED; seed 2 fichas | Web `features/technical-sheets` integra React Query; lista server-side; Catálogo GERAL fecha BOM |
| 2026-07-29 | **Fase 7 — Compras:** models `Purchase`/`PurchaseLine` + enums `PurchaseDeliveryStatus`/`PurchaseLineStatus` (flat sob `modules/stock`, sem `purchases.module.ts` próprio); CRUD `/v1/purchases`; sem pagamento nesta fase; gera **no máx. 1** `StockMovement` de entrada (`entrada-avulsa`) ao receber, idempotente via `stockMovementId`; soft-delete sem estorno | Backend compras via API; front e módulo de pagamento ficam para fases seguintes |
| 2026-07-29 | **Fase 6 — Transportadoras:** models `Carrier`/`CarrierBranch` + enum `CarrierDeliveryType`; CRUD `/v1/carriers` (`store.stock.manage`); soft-delete/restore; FK simples `StockTransfer.carrierId` → Carrier SET NULL; seed 3 carriers; 33+ testes | Backend + web carriers via API; selects de transfers/purchases unificados |
| 2026-07-29 | **Fase 5 — Transferências:** models `StockTransfer`/`StockTransferLine` + enum `StockTransferStatus`; create atômico (2 movimentos ledger) + cancel com estorno; `carrierId` sem FK (FK na Fase 6); `batch` texto opcional | Backend + web transferências via API; transportadoras seguem mock local até Fase 6 |
| 2026-07-29 | **Fase 4 — Inventário:** models `Inventory`/`InventoryLine` + enum `InventoryStatus`; POST completed + deltas ledger (`ajuste-entrada`/`ajuste-saida`); seed migra `ajuste`→`ajuste-saida`; `findBySystemKey` | Backend + web inventário via API; compras/produção seguem stub mock local |
| 2026-07-29 | **Fase 3 — Ledger de movimentações + saldo:** models `StockBalance`/`StockMovement`/`StockMovementLine` + enums; rotas create/list/find + balance + histórico; create com UPDATE condicional / upsert atômico (race-safe) + CHECK `quantity >= 0` + unique linha por produto; `hasMovements` real; `list-products?trackStock=` | Backend + web movimentações/balanço via API; inventário/compras/produção seguem stub mock local |
| 2026-07-28 | **Categorias de movimentação:** models `MovementCategory`/`MovementCategoryBranch` + enum; CRUD `/v1/movement-categories` (+ `options`); seed 8 `systemKey`; `isSystem` não removível / type imutável; `code` auto `CM-NNN` | Web integra listagem; selects de movimentações/compras ainda no mock até Fase 3 |
| 2026-07-28 | **Módulo `stock`:** models `Stock`/`StockBranch` + enums; CRUD `/v1/stocks`; permissão `store.stock.manage`; `suppliers` movido para `modules/stock/suppliers` (rotas `/v1/suppliers` intactas); seed com estoque padrão; `hasMovements` sempre false até ledger | Web integra cadastro de depósitos; demais features de estoque seguem mock |
| 2026-07-28 | **Parâmetros fiscais no `catalog`:** models `ProductFiscal`/`ProductFiscalBranch`; list/get/upsert `/v1/fiscal-parameters`; `configured` derivado; TENANT_SCOPED; seed ~metade dos produtos | Web `features/fiscal-parameters` integra React Query + branches reais |
| 2026-07-28 | **Listas de preço no `catalog`:** models `PriceList`/`PriceListItem` + enum `PriceAdjustmentType`; CRUD + reorder + GET/PUT items; `ProductResponse.priceLists` = nomes; seed com 5 listas; sem permissões novas | Web `features/price-lists` deixa o mock e integra via React Query |
| 2026-07-28 | **Fase B.1 — Variações:** models `Variation`/`VariationOption`/`ProductVariation`/`ProductVariationOption` + `Product.variationFormat`; CRUD `/v1/variations`; create/update/find product aceitam vínculos e sincronizam `hasVariants`/`variantsCount`; TENANT_SCOPED_MODELS atualizado | Web integra cadastro de variações e aba Variações do produto |
| 2026-07-28 | **CRUD `units-of-measure`:** `Create`/`Update`/`Delete`/`ListUnitsOfMeasure` (paginação + busca); sigla única por organização; exclusão bloqueada se produto vinculado; testes unitários nos use cases | Web integra cadastro de unidades; dropdown de produtos continua em `GET ?active=true` |
| 2026-07-27 | **Imagem de produto (MinIO):** `StorageModule` (cópia do padrão food); bucket `erp`; policy `{orgId}/catalogo/products/{id}.{ext}`; rotas `POST/GET/DELETE v1/products/:id/image`; presenter com `hasImage`; testes in-memory | Fecha upload ponta a ponta; `imageUrl` na coluna = object key |
| 2026-07-27 | **Catálogo por organização + vínculo por unidade + módulo `suppliers`:** `Product`/`ProductCategory`/`UnitOfMeasure` trocam `storeId` por `organizationId` com FK real; novos models `ProductBranch`, `Supplier`, `SupplierBranch`, `ProductSupplier` (FKs compostas carregando `organization_id`); `@StoreId` e `X-Store-Id` **removidos**; produto aceita `branchIds` e `suppliers`, com 404 para filial/fornecedor de outra empresa; listagem recorta por `X-Branch-Id`/`?branchId`; 7 models novos na allowlist do filtro global; módulo `suppliers` completo (6 rotas, soft-delete + restore, permissão `org.suppliers.manage`); **seed recria o ambiente inteiro** (organização, 3 unidades, responsável via Keycloak, catálogo distribuído, fornecedores) | **Banco resetado** (autorizado) — migration única em vez de expand/contract. SKU passa a ser único na empresa. Toda rota é organization-scoped: `@OrganizationId()` obrigatório, sem exceção |
| 2026-07-27 | **Módulo `tenancy` + arquitetura multi-empresa:** models `Organization`/`Branch`/`User`/`Membership`/`BranchAccess` no schema `erp`; `shared/infra/tenancy` (contexto por `AsyncLocalStorage`, `TenantContextGuard`, middleware); filtro global no Prisma (`tenant-scope.extension`); `KeycloakAdminService` para criar identidade com senha provisória; 14 use cases e 14 rotas; `PermissionGuard` passa a resolver permissões pelo papel do `Membership`; Swagger com `Authorize` e headers `X-Organization-Id`/`X-Branch-Id` | A API deixa de ser single-tenant. **Toda rota de negócio nova precisa de `@OrganizationId()` e de entrada em `TENANT_SCOPED_MODELS`** (§5.10). Novas envs `KEYCLOAK_ADMIN_CLIENT_ID/SECRET` |
| 2026-07-27 | **Módulo `catalog` (Fase A do plano de Produtos):** models `Product`/`ProductCategory`/`UnitOfMeasure` no schema `erp`, 9 use cases (42 testes), 3 repositórios Prisma, 9 rotas store-scoped, seed com os 15 produtos do mock do web. IDs passam a `@default(uuid())` (v7 revertido, §10) e o schema Postgres passa a `erp` no banco `citybox_platform` | Primeiro módulo real da API; a tela de Produtos do web deixa de ser mock |
| 2026-07-27 | `AppExceptionFilter`: `*Taken` genérico → 409 (antes só `EmailTaken`/`DocumentTaken`/`SlugTaken`, e `ProductSkuTakenError` caía em 422) | Corrige o status de conflito de SKU; alinha o filtro à regra documentada em §5.6 |
| 2026-07-26 | `src/modules/_example/` criado — molde físico do esqueleto de pastas de um módulo (arquivos `*.gitkeep` nomeados como o arquivo real seria, mais `README.md` explicando cada camada) | `src/modules/` deixa de estar vazio; nenhum código real, só a árvore de referência (ver §4/§4.1) |
| 2026-07-26 | Scaffold criado: `nest new` do usuário reestruturado para Clean Architecture (réplica de `apps/verticals/food/api`) — `shared/core` (Entity, errors, IUseCase, ZodUtils), `shared/domain` (Validator), `shared/infra` (http: guards/decorators/filters/health, prisma, keycloak); Prisma 7 com schema `erp_comercio` sem models; pacote renomeado para `@citybox/erp-comercio-api`, porta `3111` | Base pronta para o primeiro módulo de domínio; nenhuma rota de negócio ainda |

| 2026-08-06 | **`pos-operators`:** operadores de caixa (organization+branch-scoped) com PIN hasheado — 6 rotas, `PinHasher` (scrypt, `shared/infra/crypto/`), `org.pos_operators.manage`, `PosOperator` em `TENANT_SCOPED_MODELS`. Decisões registradas em §10: operador **não é** `User`/`Membership` (PRD §D1) e scrypt no lugar de Argon2id. PIN só entra por `PUT /:id/pin` e o hash nunca sai em resposta. Unicidade de código validada no use case (unique de banco bloquearia reaproveitar o código de quem saiu). M1 do `.claude/plans/_platform/pdv-erp-auth.plan.md`. |
| 2026-08-06 | **Pareamento de terminal (M2):** `PosTerminal` ganhou `deviceTokenHash`/`pairedAt`/`pairedDeviceLabel`/`lastSeenAt`; use cases `RedeemPairingCode` (consome o código, emite device token) e `RevokeDevice`; rota **pública** `POST v1/pos-terminals/pair/redeem` com `@nestjs/throttler`; `DeviceAuthGuard` + `@CurrentTerminal()` + `GET v1/pos/terminal`. As duas consultas fora do escopo de tenant (`findByPairingCode`, `findByDeviceTokenHash`) usam `runWithoutTenantScope` — sem isso a extensão lança. `DeviceToken` (SHA-256) em `shared/infra/crypto/`, com a decisão registrada em §10. M2 do `.claude/plans/_platform/pdv-erp-auth.plan.md`. |
| 2026-08-06 | **Login de operador (M3):** `AuthenticatePosOperator` (bloqueio progressivo: 3 erros → 1 min, dobrando até 15 min) e `ListTerminalOperators`, as duas sob `DeviceAuthGuard` no prefixo `v1/pos/*`. Erros novos: `PosOperatorCredentialsUnauthorizedError` (401, o **mesmo** para código inexistente e PIN errado) e `PosOperatorLockedError` (423). `AppExceptionFilter` ganhou o sufixo `Locked` → 423. Decisão de **não** emitir token de sessão de operador registrada em §10. M3 do `.claude/plans/_platform/pdv-erp-auth.plan.md`. |
| 2026-08-06 | **`pos-policies`:** alçadas do PDV (organization-scoped, **uma por organização**) — `GET`/`PUT v1/pos-policy` + `GET v1/pos/policy` sob `DeviceAuthGuard`. `GET` nunca responde 404: cria com defaults restritivos na primeira leitura. A regra "isto exige supervisor?" mora na entidade, e o limite é **exclusivo** (exatamente no teto passa). `org.pos_policies.manage` + `PosPolicy` em `TENANT_SCOPED_MODELS` (e na spec da allowlist). M5 do `.claude/plans/_platform/pdv-erp-auth-offline.plan.md`. |
| 2026-08-06 | **`pos-policies` + rota de sincronização de operadores (M5/M4 do plano de auth do PDV).** `PosPolicy` (uma por **organização**, sem `branchId` — limite por terminal seria contornável escolhendo o caixa mais frouxo), `GET`/`PUT v1/pos-policy` (backoffice) e `GET v1/pos/policy` (device). `GET` nunca 404: cria com defaults restritivos na primeira leitura, senão a tela e o PDV inventariam cada um o seu. Limite **exclusivo** (exatamente 10% passa num teto de 10%). Nova `GET v1/pos/operators/sync` sob `DeviceAuthGuard`: **única rota do sistema que devolve `pinHash`**, com presenter dedicado (`PosOperatorSyncPresenter`) e `expiresAt = now + 48 h`. O formato `scrypt$N$r$p$salt$hash` virou contrato com o PDV, que reimplementa a verificação em Dart — ver a nota em §9. ⚠️ **A alçada é enforçada no app**: não há rota de venda para o servidor revalidar a exceção; quando o checkout entrar, tem que revalidar lá. |
| 2026-08-06 | **`DeviceAuthGuard` passou a lançar erro de domínio.** Era `UnauthorizedException` do Nest, que não passa pelo `AppExceptionFilter` e portanto sai **sem `error.code`** — o PDV não tinha como distinguir "terminal revogado" de "PIN de operador errado", já que os dois são 401 em `v1/pos/*`. Novo `PosTerminalDeviceUnauthorizedError` (sufixo `Unauthorized` → 401 pelo filtro), com a mesma mensagem externa para os quatro casos (token ausente, vazio, desconhecido/revogado, terminal desativado) e um `code` estável. É esse `code` que o app usa para desparear sozinho e voltar à ativação. ⚠️ Voltar a usar `UnauthorizedException` aqui quebraria a revogação no PDV **em silêncio**: a mensagem seguiria igual e só o `code` sumiria. Ver §9. |
| 2026-08-07 | **`pos-modules` — módulos do PDV por terminal.** `PosModuleDefaults` (um por organização, `Json`) + `PosTerminal.moduleOverrides` (`Json?`, **`null` = herda**). 5 rotas: `GET`/`PUT v1/pos-module-defaults`, `GET`/`PUT v1/pos-terminals/:id/modules` e `GET v1/pos/modules` (device). ⚠️ **`resolveTerminalModules` é o único lugar que mescla** — a rota de device devolve o **resolvido**, nunca as duas camadas: mandar os ingredientes obrigaria o PDV a reimplementar a receita, e uma divergência mostraria mesa que o ERP diz estar desligada. Núcleo (9 ids) sai `available` mesmo com o banco dizendo o contrário — a tela não pode oferecer switch sem efeito. `Json` em vez de tabela de junção porque o conjunto é lido inteiro, nunca por módulo, nunca agregado; em troca **nada valida no banco**, e por isso `sanitizeModuleStates` roda na **leitura** também. ⚠️ **Catálogo duplicado com o PDV** (TS × Dart, sem pacote compartilhado possível): a trava é `pos-module.catalog.spec.ts` aqui e `module_catalog_contract_test.dart` lá — e ela já pegou uma divergência real (`settings` faltava no núcleo daqui). **Não confundir com o catálogo de módulos do `admin-api`** (`kds`/`autoatendimento`/`pdv_mobile`): aquele responde "a loja pagou?", este responde "este caixa usa?". Ver `.claude/plans/_platform/pdv-modulos-por-terminal.plan.md`. |
| 2026-08-11 | **Seed de grade para o PDV:** `scripts/seed-pdv-grid-variants.sql` — Tamanho×Cor + Camiseta/Calça nas orgs Bruno e Kika, `ProductBranch` na unidade do terminal pareado, `variant_grid` no padrão da loja. Sem isso o flatten de `pos-catalog` não emitia variantes (produtos fashion tinham `has_variants` stale e `variation_format` nulo). Ver §8 e §9. |
| 2026-08-12 | **`pos-customers` — clientes CRM para o PDV.** `GET`/`POST /v1/pos/customers`, `GET /v1/pos/customers/:id`, `GET /v1/pos/customer-categories` sob `DeviceAuthGuard`. Reusa use cases de `customers` (list/get/create + categories). Create força `stage=active` e `branchIds=[terminal.branchId]`. Fora: PUT/DELETE device, checkout com `customerId`. Ver §9. |
| 2026-08-12 | **CEP lookup (BrasilAPI):** `CepLookupModule` — `GET /v1/cep/:cep` (JWT/`org.view`) e `GET /v1/pos/cep/:cep` (Device). Mesmo contrato do admin-api. Ver §9. |
| 2026-08-12 | **Checkout POS online:** `consumerDocument` em `SaleOrder`; `GET /v1/pos/payment-methods`; `POST /v1/pos/sales` (SaleOrder closed/`pdv`). Alçada de desconto ainda só no app. Ver §9. |
| 2026-08-12 | **`pos-catalog` — estoque no snapshot:** `trackStock` + `stockQty` (depósito default da branch, paridade com POS sales); `getBalancesForStockProducts` em lote. PDV usa para badge visual. Ver §9. |
| 2026-08-12 | **Ledger permite saldo negativo:** `persistStockMovementInTx` (e in-memory) deixam de bloquear saída sem saldo; vendas/transferências/produção/movimentos manuais podem negativar. PDV só sinaliza visualmente. Removido `InsufficientStockError`. Migration `20260812210000_allow_negative_stock_balance` dropa CHECK `stock_balances_quantity_non_negative`. Ver §9. |
| 2026-08-15 | **SessionSale HTTP — operador + chave do meio:** `operatorName` + `methodId`/`methodSystemKey` nos payments de `toHttpSale` (lista/detalhe JWT e `current/sales` Device). Corrige Operador `—` no PDV/ERP e esperado em gaveta após sync. Ver §9 pos-cash-sessions. |
| 2026-08-16 | **Produtos hardening:** `availableOnErp`/`availableOnPdv` (migration `20260816204823_product_availability_flags`, via `db:migrate:dev`); `POST /v1/products/:id/duplicate`; `GET/POST /v1/products/import` (exceljs); `POST/GET/DELETE /v1/variations/:variationId/options/:optionId/image`; terminal catalog filtra `availableOnPdv=true` | Ver §9 Catalog |
| 2026-08-16 | **`pos-modules` — Delivery unificado:** um switch `delivery_orders` (rótulo Delivery); `delivery` é alias espelhado na resolução/sanitize; fora de `POS_CONFIGURABLE_OPTIONAL_MODULES`. | catalog, resolve, sanitize |
| 2026-08-16 | **`pos-modules` — mesas/comandas desligados até a feature:** `resolveTerminalModules` força `tables`/`tabs` → `disabled`; `POS_TEMPORARILY_DISABLED_MODULE_IDS` + `POS_CONFIGURABLE_OPTIONAL_MODULES` (switches omitidos no backoffice); perfis Restaurante/Lanchonete sem mesas/comandas; neutral defaults com esses ids off. | `pos-module.catalog`, `resolve-terminal-modules`, presenter, perfis |
| 2026-08-15 | **`pos-delivery` pago ≠ Concluído:** checkout não seta `delivered`; `saleOrderId`/`paid` no presenter; header/linhas imutáveis após pago (entregador ok); cancel venda só reabre se legado `delivered`. | `create-pos-sale`, `pos-delivery` use-cases/presenter, cancel-pos-sale |
| 2026-08-15 | **`pos-sales` checkout atômico + cancel reabre delivery:** `posMeta` na mesma TX de `saveWithOptionalMovement`; unique parcial via `migrate dev` (`20260816013008_sale_orders_pos_delivery_partial_unique` + append SQL `WHERE`); list/detail expõem `posDeliveryFulfillment`. | `create-pos-sale`, `cancel-pos-sale`, `prisma-sale-order.repository`, migration Prisma |
| 2026-08-15 | **`pos-delivery` create lines:** nested `lines.create` não aceita `organizationId` (herdado do pedido pai via FK composta) — removido do `lineData` no repositório Prisma. | `prisma-pos-delivery-order.repository.ts` |
| 2026-08-15 | **`pos-delivery`:** módulo Clean Architecture para pedidos de entrega/retirada, quadro branch-scoped, entregadores, máquina de status e vínculo bidirecional com checkout/cancelamento de `pos-sales`; filtro `channelId` em vendas. | Ver §9 pos-delivery / pos-sales |
| 2026-08-15 | **Pareamento PDV + migrations fiscais:** `RedeemPairingCodeUseCase` lê org/unidade com `runWithoutTenantScope` **antes** de consumir o código (senão `TenantScopeMissingError` em `Branch.findFirst` e a 2ª tentativa vira `not_found`). 8 migrations fiscais pendentes (`pos_fiscal_settings` … `operation_natures`) aplicadas via `pnpm --filter @citybox/erp-api db:migrate:deploy` — a tabela `erp.pos_fiscal_settings` faltava e derrubava `GET v1/pos/fiscal-settings`. | Ver §9 pos-terminals / pos-fiscal-settings |
| 2026-08-15 | **PDV A–E (API):** redeem/`GET v1/pos/terminal` com `organizationName`/`branchName`; `GET v1/pos/cash-sessions/current/sales`; `CreatePosSale` revalida alçada de desconto (`discountAuthorizedByUserId`). Ver §9. |
| 2026-08-14 | **Cancelamento de venda PDV:** `POST /v1/pos/sales/:id/cancel` (`CancelPosSaleUseCase`) — status `cancelled`, entrada reversa de estoque, soft-delete de recebíveis (409 se conciliados); alçada `pdv.operacao.venda.cancel` + supervisor via política. **`resolveTerminalModules` força `credit`/`refund` → `disabled`** até existirem APIs. Ver §9 pos-sales. |
| 2026-08-13 | **`pos-cash-sessions` — turno de caixa no servidor.** Models `PosCashSession`/`PosCashMovement` + FKs em `SaleOrder`; device `v1/pos/cash-sessions*` + JWT `v1/pos-cash-sessions*`; sangria com `pdv.operacao.caixa.withdrawal` / supervisor via `PosPolicy.withdrawalSupervisorAboveCents`; `CreatePosSale` exige sessão open e grava FKs. Ver §9. |
| 2026-08-10 | **`pos-catalog` — snapshot de produtos para o PDV.** `GET /v1/pos/catalog` sob `DeviceAuthGuard`: categorias + produtos da unidade do terminal (`ProductBranch.active`) + adicionais + preço efetivo do canal `pdv` (`resolvePdvSellPriceCents`) + variantes `grid` flattenadas. Reusa repositórios de `catalog` (sem CRUD duplicado). Critérios: AC-1 unidade ativa; AC-2 lista `pdv` vence base; AC-3 barcodes no snapshot; AC-7 exclui `supply`/soft-deleted. Fora de escopo nesta fatia original: checkout, imagens, Drift, `allowsHalf` (clientes passaram a `pos-customers`). Ver §9. |
