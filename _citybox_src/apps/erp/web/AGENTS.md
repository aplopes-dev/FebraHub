# AGENTS.md — ERP · web

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre este módulo.
> Leia-o integralmente antes de qualquer ação. Ao modificar código neste módulo,
> atualize as seções relevantes deste arquivo na mesma operação. Nunca remova
> seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo                                | Valor                                                          |
| ------------------------------------ | -------------------------------------------------------------- |
| **Nome**                             | `apps/erp/web` · pacote `@citybox/erp-web`   |
| **Tipo**                             | App Next.js (frontend) · Backoffice de comércio (scaffold)     |
| **Responsável**                      | Bruno Lopes — Aplopes Tecnologia                               |
| **Status**                           | 🟢 **Autenticado (Keycloak)** + multi-empresa; **shell Dual MUI** (`@citybox/mui`); **catálogo + Estoque + Clientes + Finanças + Vendas 100% MUI**; **Produtos, Categorias, Fornecedores, Transportadoras, Listas de preço, Clientes, Estoque, Pedidos/Vendas, OS, Contratos, Promoções, Contas bancárias, Lançamentos, Centros de custo, Grupos financeiros, Plano de contas, Contratos de cartões, Cadastros de PDV, Relatórios de resultados (DRE), Análise por centro de custo e Extrato consomem a API** |
| **Porta**                            | `3107`                                                         |
| **Última atualização deste arquivo** | 2026-08-20 (`specs/erp/031-os-conciliacao-clientes-correcoes` — três correções de teste manual: **D1** `generate-sale` de OS passa a incluir linhas de serviço (`linesForGenerateSale`), com guarda de "nenhuma linha" no cliente antes de chamar o servidor; **D2** campo "Cliente ou fornecedor" da Conciliação bancária vira `Autocomplete` real sobre o cadastro (mesmo padrão de Lançamentos financeiros), gravando `customerId`/`supplierId`; **D3** listagem de Clientes ganha ação Editar visível por linha — a edição em si já existia desde spec erp/029/B2, o gap era só de affordance. Ver `apps/erp/api/AGENTS.md` para as duas mudanças de backend correspondentes.) |
| **Última atualização deste arquivo** | 2026-08-16 (`specs/erp/029-pagamento-nfe-edicao-cliente-downloads` — três frentes achadas em teste manual. **B1**: correção do `tPag=99` fixo é 100% erp-api (ver `apps/erp/api/AGENTS.md`) — sem mudança de comportamento aqui além do pedido de venda continuar mandando os mesmos `payments[]` que já existiam. **B2 (edição de cliente)**: nova rota `/clientes/[id]` (`CustomerEditPage`) reaproveita `CustomerFormView` (molde `suppliers`/`carriers`/`branches`) — `useCustomerFormValuesQuery` chama o mapper `toCustomerFormValues` que já existia em `customer.mapper.ts` sem nenhum consumidor; fallback "Cliente não encontrado" quando o id não existe/não pertence à empresa ativa; `formKey={customerId}` remonta o form ao navegar entre dois clientes (achado B11 da spec 019). `customer-list-table.tsx` ganha `getRowHref` para a nova rota. **B3 (download XML/DANFE/DANFSE)**: `downloadFiscalDocument` novo em `lib/api/fiscal-client.ts` (Blob + `<a download>` — precisa estar anexado ao DOM antes do `click()`, achado react-review, senão alguns browsers ignoram o download) consumido em 3 pontos: menu ⋯ de `features/sales-orders`/`features/sales` (2 novos `MenuItem` — XML/DANFE, com `Tooltip`+`<span>` porque o item fica `disabled` quando não há NF-e `AUTHORIZED`) e coluna "Ações" nova de `features/facilita-nfe` (XML/PDF, cobre NF-e/NFC-e **e** NFS-e, decisão do clarify: download só na tela do Facilita NF-e para NFS-e, não nas telas de Vendas). O `MenuItem` só fecha o menu **depois** do download terminar (`finally`), não no clique — achado react-review: fechar antes desmontava o item no mesmo tick e o rótulo "Baixando…" nunca chegava a renderizar. ⚠️ **Proxy `/api/proxy/fiscal` — achado security-review CRITICAL, corrigido nesta mesma operação**: a primeira versão do resolvedor de dono para `/v1/nfe/:id/xml|danfe`/`/v1/nfse/:id/xml|danfse` (`resolveFiscalDocumentOwnerCompanyId`, nova em `lib/api/fiscal-tenant-guard.ts`) era correta isoladamente, mas o `isCompanyScopedRoute` **pré-existente** do proxy tinha um disjunto `Boolean(queryCompanyId)` sem restrição de rota — qualquer request com `?companyId=<próprio-companyId-do-atacante>` (obtenível legitimamente da própria organização) caía no branch de token de serviço **antes** do novo resolvedor de dono ser alcançado, elevando sem nunca checar se o documento do path pertencia àquele companyId. Corrigido restringindo esse disjunto a um allowlist explícito (`isCertificateStatusRoute`, só `GET /v1/certificates/:id/status?companyId=`, a única rota legítima com `companyId` por query — BUG-03) em vez de "qualquer rota com `?companyId=`". Re-verificado pelo security-reviewer após a correção: PASS. Ver `apps/erp/web/src/app/api/proxy/fiscal/[...path]/route.ts`. Anterior: `specs/erp/028-nfe-destinatario-e-feedback` — três correções achadas em teste manual em produção após a 027 destravar a emissão. **B1 (crítico)**: a NF-e saía sem `enderDest` (endereço do destinatário) → rejeição SEFAZ `719` — a tela reusava `CustomerFiscalInfo` de `nfse-issuance` (sem endereço; a NFS-e não precisa, a NF-e exige). Novo resolvedor próprio (`getCustomerNfeFiscalInfoApi`/`CustomerNfeFiscalInfo` em `features/nfe-issuance/api/`) lê `Customer.addresses[]` (já vinha na resposta de `GET /v1/customers/:id`, só não era lido), escolhe o endereço `principal` (fallback: primeiro da lista) e resolve o código IBGE via `resolveCityCodeIbge` — `lib/ibge-lookup.ts` **subiu** de `features/fiscal-certificate/lib/` para `src/lib/` (DRY, mesma tabela estática Ilhéus+região, agora usada pelas duas features). Sem endereço utilizável (ausente ou cidade fora da tabela) → `canEmit` bloqueia com `Alert` explicando o motivo, antes de transmitir. **B2 (alto)**: as duas telas anunciavam `REJECTED` do órgão como `toast.success`, em inglês, sem motivo — corrigido para `toast.success` só em `AUTHORIZED`, `toast.warning` (decisão do clarify: rejeição é resultado de negócio, não erro técnico) com status traduzido (`resolveFiscalDocumentStatusLabel`, reusado de `features/facilita-nfe/lib/fiscal-document-format.ts`) + código/mensagem do órgão em português — exige a erp-api parar de descartar `errorCode`/`errorMessage`, que a fiscal-api já devolvia na resposta da própria emissão (ver `apps/erp/api/AGENTS.md`). **B3 (visual)**: os botões "Emitir NF-e"/"Emitir NFS-e" ganham `variant="contained"` (só o padrão já usado no resto do ERP — decisão do clarify: sem destaque adicional). Anterior: `specs/erp/027-destravar-emissao-vendas` — destrava a emissão real nas duas telas, que falhavam com "Não foi possível resolver o Emitente fiscal da organização" por um `FISCAL_API_URL` mal configurado na erp-api (causa raiz é config/backend, ver `apps/erp/api/AGENTS.md`; nenhuma mudança de comportamento no `erp-web` além dos 2 ajustes triviais abaixo). **B2**: subtítulo fixo de `nfse-issuance-page.tsx` ("... ambiente de homologação.") removido — contradizia o `Chip` de ambiente real quando o Emitente estava em PRODUÇÃO; `nfe-issuance-page.tsx` já não tinha o problema (conferido, sem mudança). **B3**: `noOptionsText` dos dois `Autocomplete` (tomador em NFS-e, pedido de venda em NF-e) trocou o "No options" em inglês do MUI por texto em português — **sem link embutido** (achado do react-reviewer: um `<Link>` dentro de `noOptionsText` do MUI Autocomplete fica fora do `listboxRef` que segura o foco no blur, então Tab fecha o dropdown antes do link ganhar foco — inacessível por teclado, ainda que clicável por mouse). O atalho ("Cadastrar cliente"/"Ver pedidos de venda") virou um `Alert` separado, fora do popper, mostrado quando a lista carregou vazia — normalmente focável. Anterior: `specs/erp/026-emissao-nfe-vendas` — `/vendas/nfe` deixa de ser placeholder desabilitado: nova `features/nfe-issuance` emite NF-e a partir de um pedido de venda fechado. Escolhe o pedido via `Autocomplete` (`GET /v1/sale-orders?statuses=closed`, busca com debounce 400ms embutido no hook — molde `useBankAccountList`), busca uma **prévia** (`GET /v1/nfe-issuances/preview`) que mostra os itens e avisa, por item/tributo, quando algum vai sair com valor de fallback (ICMS/PIS-COFINS/IPI sem grupo fiscal configurado) — **não bloqueia a emissão**, só avisa antes de confirmar. CPF/CNPJ do tomador resolvido pelo `customerId` do pedido (reusa `useCustomerFiscalInfoQuery`/`getCustomerFiscalInfoApi` de `features/nfse-issuance` — mesmo padrão, não duplicado); pedido sem cliente identificado é bloqueado explicitamente (`customerMissing`), não silenciosamente com documento vazio. Mesmo selo de ambiente real do Emitente + bloqueio em PRODUCTION da spec 025. `FiscalScrollablePage` desde o início (não repete o gap que `nfse-issuance` teve na spec 018). Estrutura: `api/` (dto+service, `listEligibleSaleOrdersApi`/`previewNfeIssuanceApi`/`issueNfeApi`) · `hooks/` · `pages/nfe-issuance-page.tsx` · `GUIA.md`. Sem testes de frontend (D0, gap já documentado). Anterior: `specs/erp/025-emissao-vendas-e-padrao-visual` — **P2**: `useFiscalCompany()` passa a expor `defaultEnvironment` real do Emitente (`HOMOLOGATION`/`PRODUCTION`, nunca assume fallback); `NfseIssuancePage` mostra o selo do ambiente real e bloqueia "Emitir" com aviso quando o Emitente está em PRODUCTION (a plataforma só sustenta emissão em homologação); tela mostra `EmptyState` com atalho para cadastro quando não há Grupo de ISSQN. **P3**: rodapé "Salvar" padronizado com `EntityFormFooter` (mode `dirty`) + `position: sticky` nas 10 telas do Menu Fiscal que ainda tinham botão solto (`fiscal-settings`, `pos-fiscal-document-type`, `fiscal-default-taxes`, `fiscal-icms-group`, `fiscal-ipi-group`, `fiscal-pis-cofins-group`, `fiscal-issqn-group`, `fiscal-operation-natures`) — bugfix real embutido em `entity-form-footer.tsx`: a prop `saveDisabled` era silenciosamente ignorada em `mode="dirty"` (só funcionava em `mode="simple"`), deixando o Salvar clicável mesmo com validação de negócio reprovada. Anterior: `specs/erp/024-fiscal-exclusoes` — duas exclusões que faltavam no Menu Fiscal: **Parte A** `fiscal-operation-natures` ganha ação Excluir na listagem (`RowActionsMenu`+`ConfirmationDialog`, molde do hub de Grupos fiscais); **Parte B** `csc-section.tsx` ganha botão "Remover CSC" (só quando configurado), novo guard `lib/api/pos-fiscal-model-guard.ts` no proxy `/api/proxy/fiscal` bloqueia (409) `DELETE .../csc` quando o PDV está em Modelo 65 — consulta `GET /v1/pos-fiscal-settings` na erp-api com o token do usuário antes de repassar à fiscal-api; `fiscal-client.ts` ganha um branch em `extractErrorInfo` pro formato de erro `{error:"code", message}` que esse guard usa (distinto do `{error:{code,message}}` da fiscal-api). Anterior: `specs/erp/023-fiscal-emissao-e-ux` — segundo re-teste achou 5 defeitos residuais (N1-N5) + 2 pedidos de UX (N6/N7): **N3 scroll** — `FiscalScrollablePage` também nos 4 formulários de grupo (`grupos-{icms,ipi,issqn,pis-cofins}/{novo,[id]}`), que tinham ficado de fora da spec 022 (as *listas* ganharam o wrapper via `features/fiscal-groups`, mas os formulários continuavam sem); varredura completa do Menu Fiscal confirmou que não sobrou mais nenhuma tela. **N4** — `rateLabel`/`taxSituationLabel` (`features/fiscal-groups/lib/tributo-options.ts`) passam a checar `== null` (cobre `undefined`, não só `null` — era a causa do "undefined%" visto em produção antes do deploy da erp-api). **N5** — `business-error-message.ts` ganha um branch pra 401/403 sem `code` reconhecível (erro cru do NestJS, não traduzido pelo `AppExceptionFilter`) → mensagem acionável em vez do "Forbidden" literal. **N6** — seção "Justificativas padrão" sai de `disabled-soon-sections.tsx` e vira campos reais em `fiscal-settings` (validação de 15–255 caracteres espelhando o backend). **N7** — bloco "Outros cadastros fiscais" do hub de Padrões fiscais vira 2 cards (`OtherFiscalCard`) no mesmo padrão visual dos 4 de tributo, com contagem real (endpoint novo `GET /v1/fiscal-additional-infos/count` na erp-api + `.length` de `useOperationNaturesQuery`). N1/N2 (permissão de Séries; deploy da erp-api) tratados no `services/fiscal-api/AGENTS.md`. Anterior: `specs/erp/022-fiscal-acesso-scroll-ux` — re-teste como lojista comum achou 3 problemas novos no Menu Fiscal: **P2 scroll** — `FiscalScrollablePage` (wrapper `m:-3`+`ScrollArea`, molde `product-form-view`) aplicado nas 5 abas de `/configuracoes/fiscal` + `fiscal-operation-natures` + `nfse-issuance` (`fiscal-additional-info` já tinha o padrão manual); **P3 UX** — 4 telas de lista de grupo fiscal (`/grupos-icms` etc.) viram uma só (`features/fiscal-groups`, `/configuracoes/fiscal/grupos?tributo=`) com abas por tributo, listagem rica (situação tributária + alíquota + nº de produtos, backend sem N+1) e exclusão bloqueada se em uso (`DeleteFiscalGroupUseCase`, 4 novas rotas `DELETE /v1/fiscal-{tributo}-groups/:id`); Padrões fiscais vira hub de cards (`fiscal-default-taxes-hub.tsx`). P1 (autorização) tratada no `services/fiscal-api/AGENTS.md`. Anterior: `specs/erp/021-correcoes-fiscal` — 7 bugs de teste em produção do Menu Fiscal corrigidos: BUG-01 `X-Acting-Sub` no proxy fiscal (companion do BUG-01 da fiscal-api), BUG-03 rotas `/v1/sequences/:id[...]`/`/v1/certificates/:id/status?companyId=` elevadas ao token de serviço, BUG-04 `usePosFiscalType` escopado por organização, BUG-05 `businessErrorMessage` compartilhado (`lib/api/business-error-message.ts`) filtra `ValidatorDomainError`/5xx cru em 10 formulários fiscais, BUG-06 aviso de CSC no Modelo 65 derivado no render, BUG-07 `fiscal-series-tab` usa `isPending` em vez de `isLoading` contra falso empty-state em retry) |
| **Última atualização deste arquivo** | 2026-08-16 (**auditoria do módulo Estoque — lotes crítico + alto**: inventário deixa de zerar saldo por balanço truncado; data da movimentação com fuso UTC-safe; formulário de movimentação não se auto-reseta; `setState` em efeito removido de 4 drawers — ver §12). Anterior: 2026-08-16 (Fornecedores: CEP com máscara + lookup `GET /v1/cep/:cep`, molde de clientes). Anterior: 2026-08-16 (Produtos: drawer Gerenciar variação usa `Drawer.footer` + espaçamento padrão do DS, sem padding/footer duplicados). Anterior: 2026-08-16 (Produtos: Gerenciar variação — drawer alinhado aos props reais de `ProductVariationOptionsBlock` / `ProductVariationGridConfig` / `VariationNameMultiSelect`; crash `options is not iterable`). Anterior: 2026-08-16 (Produtos: DataTable `getRowHref` sem nesting inválido `<a><td>`; checkbox de seleção no `onClick` + `stopRowNavigation`; `isLoading` deixa de usar `isFetching`). Anterior: 2026-08-16 (Produtos hardening: disponibilidade ERP/PDV, addons/sugestões persistidos, import XLSX, bulk-delete UI, imagem de opção de variação, ações de linha/duplicar, filtros por categoria UUID). Anterior: 2026-08-16 (Produtos: importação XLSX pela API; Variações: upload multipart de imagem por opção). Anterior: 2026-08-16 (módulos: um switch Delivery; nav sem mesas/comandas). Anterior: 2026-08-15 (Pedidos de venda: `SaleOrderFiltersDrawer` com `Drawer.footer` fixo). Anterior: 2026-08-15 (Pedidos: filtro `channelId` + Canal/Pedido delivery no detalhe; perfil Restaurante com delivery). Anterior: 2026-08-15 (Gerenciar caixas: Código `#N` + Operador na venda; `statusLabel` no lugar de “Natureza de operação”). Anterior: 2026-08-14 (Vendas/Pedidos: cancelado ou com `stockMovementId` → formulário só leitura + menu **Visualizar**; listagem `/vendas` ganha coluna Status + riscado em canceladas). Anterior: `specs/erp/024-fiscal-exclusoes` — duas exclusões que faltavam no Menu Fiscal: **Parte A** `fiscal-operation-natures` ganha ação Excluir na listagem (`RowActionsMenu`+`ConfirmationDialog`, molde do hub de Grupos fiscais); **Parte B** `csc-section.tsx` ganha botão "Remover CSC" (só quando configurado), novo guard `lib/api/pos-fiscal-model-guard.ts` no proxy `/api/proxy/fiscal` bloqueia (409) `DELETE .../csc` quando o PDV está em Modelo 65 — consulta `GET /v1/pos-fiscal-settings` na erp-api com o token do usuário antes de repassar à fiscal-api; `fiscal-client.ts` ganha um branch em `extractErrorInfo` pro formato de erro `{error:"code", message}` que esse guard usa (distinto do `{error:{code,message}}` da fiscal-api). Anterior: `specs/erp/023-fiscal-emissao-e-ux` — segundo re-teste achou 5 defeitos residuais (N1-N5) + 2 pedidos de UX (N6/N7): **N3 scroll** — `FiscalScrollablePage` também nos 4 formulários de grupo (`grupos-{icms,ipi,issqn,pis-cofins}/{novo,[id]}`), que tinham ficado de fora da spec 022 (as *listas* ganharam o wrapper via `features/fiscal-groups`, mas os formulários continuavam sem); varredura completa do Menu Fiscal confirmou que não sobrou mais nenhuma tela. **N4** — `rateLabel`/`taxSituationLabel` (`features/fiscal-groups/lib/tributo-options.ts`) passam a checar `== null` (cobre `undefined`, não só `null` — era a causa do "undefined%" visto em produção antes do deploy da erp-api). **N5** — `business-error-message.ts` ganha um branch pra 401/403 sem `code` reconhecível (erro cru do NestJS, não traduzido pelo `AppExceptionFilter`) → mensagem acionável em vez do "Forbidden" literal. **N6** — seção "Justificativas padrão" sai de `disabled-soon-sections.tsx` e vira campos reais em `fiscal-settings` (validação de 15–255 caracteres espelhando o backend). **N7** — bloco "Outros cadastros fiscais" do hub de Padrões fiscais vira 2 cards (`OtherFiscalCard`) no mesmo padrão visual dos 4 de tributo, com contagem real (endpoint novo `GET /v1/fiscal-additional-infos/count` na erp-api + `.length` de `useOperationNaturesQuery`). N1/N2 (permissão de Séries; deploy da erp-api) tratados no `services/fiscal-api/AGENTS.md`. Anterior: `specs/erp/022-fiscal-acesso-scroll-ux` — re-teste como lojista comum achou 3 problemas novos no Menu Fiscal: **P2 scroll** — `FiscalScrollablePage` (wrapper `m:-3`+`ScrollArea`, molde `product-form-view`) aplicado nas 5 abas de `/configuracoes/fiscal` + `fiscal-operation-natures` + `nfse-issuance` (`fiscal-additional-info` já tinha o padrão manual); **P3 UX** — 4 telas de lista de grupo fiscal (`/grupos-icms` etc.) viram uma só (`features/fiscal-groups`, `/configuracoes/fiscal/grupos?tributo=`) com abas por tributo, listagem rica (situação tributária + alíquota + nº de produtos, backend sem N+1) e exclusão bloqueada se em uso (`DeleteFiscalGroupUseCase`, 4 novas rotas `DELETE /v1/fiscal-{tributo}-groups/:id`); Padrões fiscais vira hub de cards (`fiscal-default-taxes-hub.tsx`). P1 (autorização) tratada no `services/fiscal-api/AGENTS.md`. Anterior: `specs/erp/021-correcoes-fiscal` — 7 bugs de teste em produção do Menu Fiscal corrigidos: BUG-01 `X-Acting-Sub` no proxy fiscal (companion do BUG-01 da fiscal-api), BUG-03 rotas `/v1/sequences/:id[...]`/`/v1/certificates/:id/status?companyId=` elevadas ao token de serviço, BUG-04 `usePosFiscalType` escopado por organização, BUG-05 `businessErrorMessage` compartilhado (`lib/api/business-error-message.ts`) filtra `ValidatorDomainError`/5xx cru em 10 formulários fiscais, BUG-06 aviso de CSC no Modelo 65 derivado no render, BUG-07 `fiscal-series-tab` usa `isPending` em vez de `isLoading` contra falso empty-state em retry) |
| **Última atualização deste arquivo** | 2026-08-16 (`specs/erp/030-proxy-documentos-pagamento-real` — três defeitos achados em teste manual logo após o deploy da 029. **B1 (proxy fiscal)**: o allowlist estreito que fechou o CRITICAL da 029 (`isCertificateStatusRoute`) excluiu por engano `GET /v1/fiscal-documents?companyId=` (lista) — novo `isFiscalDocumentsListRoute` (2 segmentos, `GET`) reintroduz essa rota sem reabrir o disjunto genérico. A causa raiz de "Facilita NF-e não carrega" acabou sendo outra, no erp-api (ver `apps/erp/api/AGENTS.md`) — não neste app. O branch de download (`fiscalDocumentDownloadId`) passa a mandar `X-Company-Id` na chamada upstream quando eleva (`documentOwnerCompanyId`), porque DANFE/DANFSE exigem esse header via `@CompanyId()` na fiscal-api (achado: mesmo com a elevação corrigida, PDF continuaria 400 sem esse header). **B2 (pagamento real)**: os 5 formulários que liam formas de pagamento do catálogo mock (`purchases/data/mock-payment-methods.ts`, agora removido) — Pedidos de venda/Vendas (mesmo form), Compras, Ordens de Serviço **e Contratos de venda** (achado ao investigar: também consumia o mesmo mock, não citado no pedido original, mas quebraria se o mock fosse removido sem migrar) — passam a ler `/v1/payment-methods` via `usePaymentMethodsQuery` + novo `toPaymentMethodOptions` (`features/payment-methods/lib/payment-method-option.mapper.ts`), que deriva `cardPaymentType` (discriminador do motor de recebíveis) do `systemKey` real em vez do catálogo mock — exigiu expor `systemKey` no `PaymentMethod` do frontend (era só backend). Backfill de dado (não schema) trata pedidos já gravados com os 5 ids mock antigos — ver `apps/erp/api/AGENTS.md`. **B3 (alíquota ISSQN)**: bug era no `services/fiscal-api` (`dps-xml.builder.ts`), não neste app — a exibição de `issqnRate` aqui sempre esteve correta (percentual, sem conversão); ver `services/fiscal-api/AGENTS.md`. Anterior: `specs/erp/029-pagamento-nfe-edicao-cliente-downloads` — três frentes achadas em teste manual. **B1**: correção do `tPag=99` fixo é 100% erp-api (ver `apps/erp/api/AGENTS.md`) — sem mudança de comportamento aqui além do pedido de venda continuar mandando os mesmos `payments[]` que já existiam. **B2 (edição de cliente)**: nova rota `/clientes/[id]` (`CustomerEditPage`) reaproveita `CustomerFormView` (molde `suppliers`/`carriers`/`branches`) — `useCustomerFormValuesQuery` chama o mapper `toCustomerFormValues` que já existia em `customer.mapper.ts` sem nenhum consumidor; fallback "Cliente não encontrado" quando o id não existe/não pertence à empresa ativa; `formKey={customerId}` remonta o form ao navegar entre dois clientes (achado B11 da spec 019). `customer-list-table.tsx` ganha `getRowHref` para a nova rota. **B3 (download XML/DANFE/DANFSE)**: `downloadFiscalDocument` novo em `lib/api/fiscal-client.ts` (Blob + `<a download>` — precisa estar anexado ao DOM antes do `click()`, achado react-review, senão alguns browsers ignoram o download) consumido em 3 pontos: menu ⋯ de `features/sales-orders`/`features/sales` (2 novos `MenuItem` — XML/DANFE, com `Tooltip`+`<span>` porque o item fica `disabled` quando não há NF-e `AUTHORIZED`) e coluna "Ações" nova de `features/facilita-nfe` (XML/PDF, cobre NF-e/NFC-e **e** NFS-e, decisão do clarify: download só na tela do Facilita NF-e para NFS-e, não nas telas de Vendas). O `MenuItem` só fecha o menu **depois** do download terminar (`finally`), não no clique — achado react-review: fechar antes desmontava o item no mesmo tick e o rótulo "Baixando…" nunca chegava a renderizar. ⚠️ **Proxy `/api/proxy/fiscal` — achado security-review CRITICAL, corrigido nesta mesma operação**: a primeira versão do resolvedor de dono para `/v1/nfe/:id/xml|danfe`/`/v1/nfse/:id/xml|danfse` (`resolveFiscalDocumentOwnerCompanyId`, nova em `lib/api/fiscal-tenant-guard.ts`) era correta isoladamente, mas o `isCompanyScopedRoute` **pré-existente** do proxy tinha um disjunto `Boolean(queryCompanyId)` sem restrição de rota — qualquer request com `?companyId=<próprio-companyId-do-atacante>` (obtenível legitimamente da própria organização) caía no branch de token de serviço **antes** do novo resolvedor de dono ser alcançado, elevando sem nunca checar se o documento do path pertencia àquele companyId. Corrigido restringindo esse disjunto a um allowlist explícito (`isCertificateStatusRoute`, só `GET /v1/certificates/:id/status?companyId=`, a única rota legítima com `companyId` por query — BUG-03) em vez de "qualquer rota com `?companyId=`". Re-verificado pelo security-reviewer após a correção: PASS. Ver `apps/erp/web/src/app/api/proxy/fiscal/[...path]/route.ts`. Anterior: `specs/erp/028-nfe-destinatario-e-feedback` — três correções achadas em teste manual em produção após a 027 destravar a emissão. **B1 (crítico)**: a NF-e saía sem `enderDest` (endereço do destinatário) → rejeição SEFAZ `719` — a tela reusava `CustomerFiscalInfo` de `nfse-issuance` (sem endereço; a NFS-e não precisa, a NF-e exige). Novo resolvedor próprio (`getCustomerNfeFiscalInfoApi`/`CustomerNfeFiscalInfo` em `features/nfe-issuance/api/`) lê `Customer.addresses[]` (já vinha na resposta de `GET /v1/customers/:id`, só não era lido), escolhe o endereço `principal` (fallback: primeiro da lista) e resolve o código IBGE via `resolveCityCodeIbge` — `lib/ibge-lookup.ts` **subiu** de `features/fiscal-certificate/lib/` para `src/lib/` (DRY, mesma tabela estática Ilhéus+região, agora usada pelas duas features). Sem endereço utilizável (ausente ou cidade fora da tabela) → `canEmit` bloqueia com `Alert` explicando o motivo, antes de transmitir. **B2 (alto)**: as duas telas anunciavam `REJECTED` do órgão como `toast.success`, em inglês, sem motivo — corrigido para `toast.success` só em `AUTHORIZED`, `toast.warning` (decisão do clarify: rejeição é resultado de negócio, não erro técnico) com status traduzido (`resolveFiscalDocumentStatusLabel`, reusado de `features/facilita-nfe/lib/fiscal-document-format.ts`) + código/mensagem do órgão em português — exige a erp-api parar de descartar `errorCode`/`errorMessage`, que a fiscal-api já devolvia na resposta da própria emissão (ver `apps/erp/api/AGENTS.md`). **B3 (visual)**: os botões "Emitir NF-e"/"Emitir NFS-e" ganham `variant="contained"` (só o padrão já usado no resto do ERP — decisão do clarify: sem destaque adicional). Anterior: `specs/erp/027-destravar-emissao-vendas` — destrava a emissão real nas duas telas, que falhavam com "Não foi possível resolver o Emitente fiscal da organização" por um `FISCAL_API_URL` mal configurado na erp-api (causa raiz é config/backend, ver `apps/erp/api/AGENTS.md`; nenhuma mudança de comportamento no `erp-web` além dos 2 ajustes triviais abaixo). **B2**: subtítulo fixo de `nfse-issuance-page.tsx` ("... ambiente de homologação.") removido — contradizia o `Chip` de ambiente real quando o Emitente estava em PRODUÇÃO; `nfe-issuance-page.tsx` já não tinha o problema (conferido, sem mudança). **B3**: `noOptionsText` dos dois `Autocomplete` (tomador em NFS-e, pedido de venda em NF-e) trocou o "No options" em inglês do MUI por texto em português — **sem link embutido** (achado do react-reviewer: um `<Link>` dentro de `noOptionsText` do MUI Autocomplete fica fora do `listboxRef` que segura o foco no blur, então Tab fecha o dropdown antes do link ganhar foco — inacessível por teclado, ainda que clicável por mouse). O atalho ("Cadastrar cliente"/"Ver pedidos de venda") virou um `Alert` separado, fora do popper, mostrado quando a lista carregou vazia — normalmente focável. Anterior: `specs/erp/026-emissao-nfe-vendas` — `/vendas/nfe` deixa de ser placeholder desabilitado: nova `features/nfe-issuance` emite NF-e a partir de um pedido de venda fechado. Escolhe o pedido via `Autocomplete` (`GET /v1/sale-orders?statuses=closed`, busca com debounce 400ms embutido no hook — molde `useBankAccountList`), busca uma **prévia** (`GET /v1/nfe-issuances/preview`) que mostra os itens e avisa, por item/tributo, quando algum vai sair com valor de fallback (ICMS/PIS-COFINS/IPI sem grupo fiscal configurado) — **não bloqueia a emissão**, só avisa antes de confirmar. CPF/CNPJ do tomador resolvido pelo `customerId` do pedido (reusa `useCustomerFiscalInfoQuery`/`getCustomerFiscalInfoApi` de `features/nfse-issuance` — mesmo padrão, não duplicado); pedido sem cliente identificado é bloqueado explicitamente (`customerMissing`), não silenciosamente com documento vazio. Mesmo selo de ambiente real do Emitente + bloqueio em PRODUCTION da spec 025. `FiscalScrollablePage` desde o início (não repete o gap que `nfse-issuance` teve na spec 018). Estrutura: `api/` (dto+service, `listEligibleSaleOrdersApi`/`previewNfeIssuanceApi`/`issueNfeApi`) · `hooks/` · `pages/nfe-issuance-page.tsx` · `GUIA.md`. Sem testes de frontend (D0, gap já documentado). Anterior: `specs/erp/025-emissao-vendas-e-padrao-visual` — **P2**: `useFiscalCompany()` passa a expor `defaultEnvironment` real do Emitente (`HOMOLOGATION`/`PRODUCTION`, nunca assume fallback); `NfseIssuancePage` mostra o selo do ambiente real e bloqueia "Emitir" com aviso quando o Emitente está em PRODUCTION (a plataforma só sustenta emissão em homologação); tela mostra `EmptyState` com atalho para cadastro quando não há Grupo de ISSQN. **P3**: rodapé "Salvar" padronizado com `EntityFormFooter` (mode `dirty`) + `position: sticky` nas 10 telas do Menu Fiscal que ainda tinham botão solto (`fiscal-settings`, `pos-fiscal-document-type`, `fiscal-default-taxes`, `fiscal-icms-group`, `fiscal-ipi-group`, `fiscal-pis-cofins-group`, `fiscal-issqn-group`, `fiscal-operation-natures`) — bugfix real embutido em `entity-form-footer.tsx`: a prop `saveDisabled` era silenciosamente ignorada em `mode="dirty"` (só funcionava em `mode="simple"`), deixando o Salvar clicável mesmo com validação de negócio reprovada. Anterior: `specs/erp/024-fiscal-exclusoes` — duas exclusões que faltavam no Menu Fiscal: **Parte A** `fiscal-operation-natures` ganha ação Excluir na listagem (`RowActionsMenu`+`ConfirmationDialog`, molde do hub de Grupos fiscais); **Parte B** `csc-section.tsx` ganha botão "Remover CSC" (só quando configurado), novo guard `lib/api/pos-fiscal-model-guard.ts` no proxy `/api/proxy/fiscal` bloqueia (409) `DELETE .../csc` quando o PDV está em Modelo 65 — consulta `GET /v1/pos-fiscal-settings` na erp-api com o token do usuário antes de repassar à fiscal-api; `fiscal-client.ts` ganha um branch em `extractErrorInfo` pro formato de erro `{error:"code", message}` que esse guard usa (distinto do `{error:{code,message}}` da fiscal-api). Anterior: `specs/erp/023-fiscal-emissao-e-ux` — segundo re-teste achou 5 defeitos residuais (N1-N5) + 2 pedidos de UX (N6/N7): **N3 scroll** — `FiscalScrollablePage` também nos 4 formulários de grupo (`grupos-{icms,ipi,issqn,pis-cofins}/{novo,[id]}`), que tinham ficado de fora da spec 022 (as *listas* ganharam o wrapper via `features/fiscal-groups`, mas os formulários continuavam sem); varredura completa do Menu Fiscal confirmou que não sobrou mais nenhuma tela. **N4** — `rateLabel`/`taxSituationLabel` (`features/fiscal-groups/lib/tributo-options.ts`) passam a checar `== null` (cobre `undefined`, não só `null` — era a causa do "undefined%" visto em produção antes do deploy da erp-api). **N5** — `business-error-message.ts` ganha um branch pra 401/403 sem `code` reconhecível (erro cru do NestJS, não traduzido pelo `AppExceptionFilter`) → mensagem acionável em vez do "Forbidden" literal. **N6** — seção "Justificativas padrão" sai de `disabled-soon-sections.tsx` e vira campos reais em `fiscal-settings` (validação de 15–255 caracteres espelhando o backend). **N7** — bloco "Outros cadastros fiscais" do hub de Padrões fiscais vira 2 cards (`OtherFiscalCard`) no mesmo padrão visual dos 4 de tributo, com contagem real (endpoint novo `GET /v1/fiscal-additional-infos/count` na erp-api + `.length` de `useOperationNaturesQuery`). N1/N2 (permissão de Séries; deploy da erp-api) tratados no `services/fiscal-api/AGENTS.md`. Anterior: `specs/erp/022-fiscal-acesso-scroll-ux` — re-teste como lojista comum achou 3 problemas novos no Menu Fiscal: **P2 scroll** — `FiscalScrollablePage` (wrapper `m:-3`+`ScrollArea`, molde `product-form-view`) aplicado nas 5 abas de `/configuracoes/fiscal` + `fiscal-operation-natures` + `nfse-issuance` (`fiscal-additional-info` já tinha o padrão manual); **P3 UX** — 4 telas de lista de grupo fiscal (`/grupos-icms` etc.) viram uma só (`features/fiscal-groups`, `/configuracoes/fiscal/grupos?tributo=`) com abas por tributo, listagem rica (situação tributária + alíquota + nº de produtos, backend sem N+1) e exclusão bloqueada se em uso (`DeleteFiscalGroupUseCase`, 4 novas rotas `DELETE /v1/fiscal-{tributo}-groups/:id`); Padrões fiscais vira hub de cards (`fiscal-default-taxes-hub.tsx`). P1 (autorização) tratada no `services/fiscal-api/AGENTS.md`. Anterior: `specs/erp/021-correcoes-fiscal` — 7 bugs de teste em produção do Menu Fiscal corrigidos: BUG-01 `X-Acting-Sub` no proxy fiscal (companion do BUG-01 da fiscal-api), BUG-03 rotas `/v1/sequences/:id[...]`/`/v1/certificates/:id/status?companyId=` elevadas ao token de serviço, BUG-04 `usePosFiscalType` escopado por organização, BUG-05 `businessErrorMessage` compartilhado (`lib/api/business-error-message.ts`) filtra `ValidatorDomainError`/5xx cru em 10 formulários fiscais, BUG-06 aviso de CSC no Modelo 65 derivado no render, BUG-07 `fiscal-series-tab` usa `isPending` em vez de `isLoading` contra falso empty-state em retry) |

**Propósito em uma linha:**
App Next.js de backoffice de **comércio** — login via Keycloak (BFF com cookies
httpOnly), escopo por **empresa e unidade**, shell **`DualSidebar` MUI**
(`@citybox/mui` · `DualDashboardLayout`) e features de domínio (parte real,
parte mock; **catálogo + estoque + clientes + finanças + Vendas (pedidos/vendas/contratos/OS/promoções) em MUI**).

---

## 2. Posição no Monorepo

```
citybox/
├── apps/
│   ├── erp/
│   │   ├── web/                ← VOCÊ ESTÁ AQUI (@citybox/erp-web · :3107)
│   │   └── api/                ← @citybox/erp-api (:3114)
│   └── pdv/frontend/          ← PDV PWA (:3109)
├── packages/
│   ├── mui/                   ← @citybox/mui (shell Dual do comércio)
│   └── ui/                    ← @citybox/ui (features ainda usam shadcn)
└── AGENTS.md
```

**Depende de:**
- `@citybox/mui` (`workspace:*`) — shell Dual + **listagem Produtos**;
  `transpilePackages: ['@citybox/mui']`.
  Shell: `DualSidebar` + `DualDashboardLayout`; tema em `src/theme/`
  (presets `v1` | `v2` — troca em `COMERCIO_THEME_PRESET`).
  Listagem: `PageHeader`, `DataTable`, `Tabs`, `Drawer`, `SearchInput`, etc.
- `@mui/material` + `@mui/icons-material` + Emotion — Material UI direto no app
  (ícones **sempre** via `@mui/icons-material`, incl. rail/painel — `lib/nav-icons.tsx`;
  import por arquivo: `@mui/icons-material/DragIndicator`; peers do `@citybox/mui`).
- `@citybox/ui` (`workspace:*`) — **`Logo`** do rail no shell (features de domínio de Vendas já migradas para `@citybox/mui`).
- `next-themes` — tema claro/escuro via classe `.dark` (features Tailwind).
- `sonner` — runtime do toast MUI (`Toaster`/`toast` de `@citybox/mui`; não importar de `sonner` direto).
- `lucide-react` — legado residual (não usar em shell/nav; preferir Material).

**Consumido por:** ponta da UI — nada interno consome este app ainda.

---

## 3. Stack e Versões

| Tecnologia        | Versão   | Observação                                              |
| ----------------- | -------- | ------------------------------------------------------- |
| pnpm              | workspace| **Único** package manager — nunca npm/yarn             |
| TypeScript        | ~5.8.3   | `strict: true`                                          |
| Next.js           | 16.2.7   | App Router; `output: 'standalone'`; `src/`              |
| React / React DOM | 19.2.7   |                                                         |
| TailwindCSS       | 4.3.0    | `@citybox/ui/styles` + `tailwind.config.ts` (features) |
| MUI Material      | **9.x**  | `@mui/material` + `@mui/icons-material` + `@citybox/mui` (Material UI v9) |
| next-themes       | ^0.4.6   | `ThemeProvider attribute="class"`                       |
| lucide-react      | ^0.469   | ícones                                                  |
| sonner            | ^2.0.7   | runtime do Toaster MUI (`@citybox/mui`)                 |
| jspdf             | ^4.2     | PDF client-side (compras: baixar/imprimir)              |
| @dnd-kit/*        | 6/10/3   | drag-and-drop (variações, adicionais, sugestões e composição da ficha técnica) |
| @tanstack/react-query | ^5.101 | **server state** (`features/products`, `features/categories`, `features/suppliers`, `features/customers`, `features/customer-categories`) — queries, mutations, cache |
| zustand           | ^5       | **estado de UI** das listagens de produtos, categorias, fornecedores e clientes (aba/busca/página/seleção) |

---

## 4. Estrutura de Pastas

```
apps/erp/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← html lang=pt-BR, AppProviders, Toaster (@citybox/mui); metadata icons
│   │   ├── providers.tsx           ← Session → QueryClient → Org → AppRouterCache → CityboxMui → ThemeProvider + BrandFaviconSync
│   │   ├── icon.tsx · apple-icon.tsx ← favicon PNG (logobrand + DEFAULT_BRAND_COLOR)
│   │   ├── login/                  ← tela de entrada (redireciona ao Keycloak)
│   │   ├── auth/callback/ · auth/sso/  ← callback OAuth e deep-link de convite
│   │   ├── entrada/                ← bifurcação pós-login (0 / 1 / N empresas)
│   │   ├── selecionar-organizacao/ · selecionar-unidade/ · sem-organizacao/ · sem-unidade/
│   │   ├── api/auth/{token,session,refresh,logout}/ ← BFF de sessão
│   │   ├── api/proxy/comercio/     ← proxy same-origin: cookie → Bearer + headers de escopo
│   │   ├── globals.css             ← @citybox/ui/styles + comercio-theme.css
│   │   └── (app)/                  ← route group com shell
│   │       ├── layout.tsx          ← ComercioErpLayout (DualDashboardLayout MUI)
│   │       ├── page.tsx            ← redirect → /visao-geral
│   │       ├── visao-geral/
│   │       ├── vendas/ ← painel próprio (Pedidos, Vendas, Contratos + SERVIÇOS/FISCAL/BENEFÍCIOS)
│   │       ├── vendas ← SaleListPage (features/sales)
│   │       ├── vendas/novo ← SaleCreatePage (features/sales; reaproveita SaleOrderFormView com status travado em "Fechado")
│   │       ├── vendas/pedidos-de-venda ← SaleOrderListPage (features/sales-orders)
│   │       ├── vendas/pedidos-de-venda/novo ← SaleOrderCreatePage
│   │       ├── vendas/promocoes ← PromotionListPage (features/promotions)
│   │       ├── vendas/promocoes/novo ← PromotionCreatePage (features/promotions; form multi-etapas 3 passos)
│   │       ├── vendas/promocoes/[id] ← PromotionEditPage (features/promotions; mesmo form, modo edição)
│   │       ├── vendas/contratos-de-vendas ← SalesContractListPage (features/sales-contracts)
│   │       ├── vendas/contratos-de-vendas/novo ← SalesContractCreatePage
│   │       ├── vendas/contratos-de-vendas/[id] ← SalesContractEditPage
│   │       ├── vendas/ordem-de-servicos ← ServiceOrderListPage (features/service-orders)
│   │       ├── vendas/ordem-de-servicos/novo ← ServiceOrderCreatePage
│   │       ├── vendas/ordem-de-servicos/[id] ← ServiceOrderEditPage (mesmo form, fallback "não encontrada")
│   │       ├── vendas/{nfe,sat-cfe} (placeholders)
│   │       ├── financas/ → redirect `/financas/extratos`
│   │       ├── financas/lancamentos ← FinancialEntryListPage (features/financial-entries; unifica Contas a pagar/receber)
│   │       ├── financas/lancamentos/novo ← FinancialEntryCreatePage
│   │       ├── financas/lancamentos/[id] ← FinancialEntryEditPage (mesmo form, fallback "não encontrado")
│   │       ├── financas/conciliacao-bancaria ← BankStatementListPage (features/bank-reconciliation; import de extrato OFX + conciliação — não é mais placeholder, correção desta linha)
│   │       ├── financas/conciliacao-bancaria/[id] ← BankStatementDetailPage
│   │       ├── financas/{extratos,boletos,…} (placeholders)
│   │       ├── financas/relatorios-de-resultados ← FinancialResultPage (features/financial-results)
│   │       ├── financas/contas-bancarias ← BankAccountListPage (features/bank-accounts)
│   │       ├── financas/contas-bancarias/[id] ← BankAccountDetailPage (tabs Transações | Histórico; `?view=historico` abre no extrato)
│   │       ├── financas/centro-de-custo ← CostCenterListPage (features/cost-centers)
│   │   ├── financas/contratos-de-cartoes-e-outros ← CardContractListPage (features/card-contracts)
│   │   ├── financas/contratos-de-cartoes-e-outros/novo ← CardContractCreatePage (features/card-contracts)
│   │   ├── financas/contratos-de-cartoes-e-outros/[id] ← CardContractEditPage (features/card-contracts, com seção Métodos de pagamento)
│   │       ├── financas/grupo-financeiro ← FinancialGroupListPage (features/financial-groups)
│   │       ├── financas/plano-de-contas ← ChartOfAccountListPage (features/chart-of-accounts)
│   │       ├── financas/facilita-nfe ← FacilitaNfePage (features/facilita-nfe; só aba "Emitido" real — "Recebido"/"Histórico de Envios" placeholder)
│   │       ├── financas/contabilidade (placeholder)
│   │       ├── relatorios/
│   │       ├── clientes ← CustomerListPage (features/customers)
│   │       ├── clientes/novo ← CustomerCreatePage (features/customers)
│   │       ├── clientes/categoria ← CustomerCategoryListPage (features/customer-categories)
│   │       ├── clientes/campanha ← placeholder (disabled no painel)
│   │       ├── estoque/ + /novo + /[id] ← Stock{List,Create,Edit}Page (features/stock)
│   │       ├── estoque/[id]/balanco ← StockBalancePage (features/stock)
│   │       ├── estoque/[id]/inventario + /novo + /[inventoryId] ← Inventory{List,Create,Detail}Page (features/stock-inventory)
│   │       ├── estoque/movimentacoes + /novo ← StockMovement{List,Create}Page (features/stock-movements)
│   │       ├── estoque/transferencias + /novo ← StockTransfer{List,Create}Page (features/stock-transfers)
│   │       ├── estoque/compras + /novo + /[id] ← Purchase{List,Create,Edit}Page (features/purchases)
│   │       ├── estoque/categorias-de-movimentacao ← MovementCategoryListPage (features/movement-categories)
│   │       ├── estoque/transportadoras + /novo + /[id] ← Carrier{List,Create,Edit}Page (features/carriers)
│   │       ├── estoque/fornecedores + /novo + /[id] ← Supplier{List,Create,Edit}Page (features/suppliers)
│   │       ├── estoque/producao ← ProductionPage (features/production, tela única: Kanban/Lista + criar/finalizar em drawers)
│   │       ├── estoque/pedido-producao + /novo ← redirect → /estoque/producao?novo=1 (legado)
│   │       ├── estoque/finalizacao ← redirect → /estoque/producao (legado)
│   │       ├── estoque/{nfe-de-entrada,facilita-nfe,…} (placeholders)
│   │       ├── catalogo/produtos   ← ProductListPage (features/products)
│   │       ├── catalogo/produtos/novo ← ProductCreatePage
│   │       ├── catalogo/variacoes-e-opcoes ← VariationListPage (features/variations)
│   │       ├── catalogo/fichas-tecnicas ← TechnicalSheetListPage (features/technical-sheets)
│   │       ├── catalogo/fichas-tecnicas/[id] ← TechnicalSheetDetailPage
│   │       ├── catalogo/categorias ← CategoryListPage (features/categories)
│   │       ├── catalogo/unidade-de-medida ← UnitOfMeasurePage (features/unit-of-measure)
│   │       ├── catalogo/lista-de-precos + /[id] ← PriceList{List,Detail}Page (features/price-lists)
│   │       ├── catalogo/parametros-fiscais + /[id] ← FiscalParameters{List,Detail}Page (features/fiscal-parameters)
│   │       ├── ponto-de-venda/cadastros ← PosRegisterListPage (features/pos-registers)
│   │       ├── ponto-de-venda/operadores ← redirect → /configuracoes/usuarios-permissoes
│   │       ├── ponto-de-venda/caixas ← PosCashSessionListPage (features/pos-cash-sessions)
│   │       ├── ponto-de-venda/kds ← KdsListPage (features/kds)
│   │       ├── ponto-de-venda/kds/[id]/produtos ← KdsProductsPage (vínculo de produtos)
│   │       ├── ponto-de-venda/{mesas,comandas} placeholders (ocultos na nav até a feature) + configuracoes/*
│   │       ├── configuracoes/formas-pagamento ← PaymentMethodListPage (features/payment-methods)
│   │       ├── configuracoes/usuarios-permissoes ← UserListPage (features/users-permissions)
│   │       ├── configuracoes/usuarios-permissoes/novo + /[id] ← User{Create,Edit}Page
│   │       ├── configuracoes/usuarios-permissoes/perfis ← PermissionProfileListPage
│   │       ├── configuracoes/usuarios-permissoes/perfis/novo + /[id] ← PermissionProfile{Create,Edit}Page
│   │       ├── dispositivos/ · meu-plano/ · configuracoes/{dados-empresa,unidades-filiais,formas-pagamento,integracoes,…} · perfil/
│   ├── features/                   ← cada feature tem um GUIA.md (negócio, p/ leigo)
│   │   ├── kds/                    ← KDS (mock): lista + Dialog criar/editar + vínculo de produtos + GUIA.md
│   │   ├── pos-policies/           ← Alçadas do PDV **via API** (`/v1/pos-policy`): formulário único (singleton), sem lista + GUIA.md
│   │   ├── pos-registers/          ← Cadastros PDV **via API** (`/v1/pos-terminals`, React Query + Zustand): lista + Dialog Novo/Editar + gerar código de pareamento + GUIA.md
│   │   │   ├── api/                ← DTOs, mapper, pos-terminals.service (comercioFetch)
│   │   │   ├── hooks/              ← queries/mutations/list + query-keys
│   │   │   └── store/              ← Zustand (busca/página)
│   │   ├── pos-cash-sessions/      ← Gerenciar caixas (API `/v1/pos-cash-sessions`): filtros + lista + drawer vendas/movimentos + fechamento + GUIA.md
│   │   ├── customers/              ← listagem + Novo cliente via API (React Query) + GUIA.md
│   │   │   ├── api/                ← DTOs, mapper, customers.service (comercioFetch)
│   │   │   ├── hooks/              ← queries/mutations/list + query-keys
│   │   │   ├── store/              ← Zustand (aba/busca/página/seleção)
│   │   │   └── data/               ← mock residual só para Vendas/Finanças ainda mock
│   │   ├── customer-categories/    ← CRUD categorias via API (React Query + Dialog MUI) + GUIA.md
│   │   │   ├── api/ · hooks/ · store/ · data/ (mock residual p/ contratos)
│   │   ├── products/               ← listagem + cadastro de produtos (domínio)
│   │   │   ├── GUIA.md             ← manual de negócio da funcionalidade
│   │   │   ├── pages/              ← ProductListPage, ProductCreatePage
│   │   │   ├── components/         ← list + form (tabs, basics, units, variants drawer…)
│   │   │   ├── data/               ← mock
│   │   │   ├── hooks/ · services/ · types/ · lib/
│   │   │   └── index.ts
│   │   ├── variations/             ← CRUD integrado à API (React Query + Zustand)
│   │   │   ├── pages/              ← VariationListPage
│   │   │   ├── components/         ← table, row actions, form drawer, sortable options
│   │   │   ├── api/ · hooks/ · store/ · types/
│   │   │   └── index.ts
│   │   ├── technical-sheets/       ← ficha técnica **via API** (React Query; listagem server-side + upsert BOM)
│   │   │   ├── GUIA.md             ← manual de negócio da funcionalidade
│   │   │   ├── pages/              ← TechnicalSheetListPage, TechnicalSheetDetailPage
│   │   │   ├── components/         ← list (table/tabs/toolbar/filtros) + detalhe (selector, tabs, composição DnD, custo, variações accordion)
│   │   │   ├── api/ · hooks/ · lib/ · types/
│   │   │   └── index.ts
│   │   ├── categories/             ← CRUD drawer de categorias (**integrado à API**) + GUIA.md
│   │   ├── unit-of-measure/        ← CRUD integrado à API (React Query) + GUIA.md
│   │   ├── fiscal-parameters/      ← lista→detalhe integrado à API (React Query; listagem server-side) + GUIA.md + TESTES.md
│   │   ├── price-lists/            ← listas de preço integradas à API (React Query + Zustand; listagem server-side) + GUIA.md
│   │   ├── stock/                  ← estoque: lista/criar/editar **via API** + Balanço **via API** + GUIA.md
│   │   ├── stock-inventory/        ← inventário: lista + contagem + detalhe **via API** + GUIA.md
│   │   ├── stock-movements/        ← movimentações: lista + create **via API** + GUIA.md
│   │   ├── movement-categories/    ← categorias de movimentação: CRUD drawer via API (sem mock) + GUIA.md
│   │   ├── stock-transfers/        ← transferências: lista + create + cancel **via API** + GUIA.md
│   │   ├── purchases/              ← compras: lista + CRUD **via API** (payments stub) + GUIA.md
│   │   ├── sales-orders/           ← pedidos de venda **UI MUI**: lista + Novo pedido (`/novo`) + GUIA.md
│   │   ├── sales/                  ← "Vendas" (`/vendas`) **UI MUI**: lista enxuta sobre o mesmo store de sales-orders + GUIA.md
│   │   ├── sales-contracts/        ← contratos de venda **UI MUI**: lista + novo/editar + drawer status + GUIA.md
│   │   ├── service-orders/         ← ordens de serviço **UI MUI**: lista (tabs por etapa) + novo/editar + status gerenciáveis + gerar venda + GUIA.md
│   │   ├── promotions/             ← promoções **UI MUI**: lista + form multi-etapas 3 passos + GUIA.md
│   │   ├── chart-of-accounts/      ← plano de contas API: lista + Dialog CRUD + abas Ativos/Excluídos + GUIA.md
│   │   ├── financial-groups/       ← grupos financeiros API: lista + Dialog CRUD + filtro Tipo + abas + GUIA.md
│   │   ├── cost-centers/           ← centros de custo API: lista + Dialog CRUD + abas + GUIA.md
│   │   ├── card-contracts/         ← contratos de cartões API: lista + form + detalhe + payment-methods + GUIA.md
│   │   ├── financial-results/      ← DRE: resumo + árvore grupo→conta por competência + filtro de período + GUIA.md
│   │   ├── bank-accounts/          ← contas bancárias: lista com saldo + Nova conta (drawer) + detalhe Transações/Histórico (extrato) + GUIA.md
│   │   ├── financial-entries/      ← lançamentos: unifica Contas a pagar/receber + rateio pagamentos/categorias + Transferências + GUIA.md
│   │   ├── branches/               ← unidades e filiais **UI MUI + API**: lista + criar/editar via `/v1/branches` + GUIA.md
│   │   ├── company-settings/       ← dados da empresa **UI MUI + API** (GET/PUT `/v1/organizations/current` na aba Cadastro; Cobrança/Uso Em breve; brandColor localStorage) + GUIA.md
│   │   ├── payment-methods/        ← formas de pagamento **UI MUI** (mock): 15 formas da plataforma (`isSystem`) + CRUD das criadas pela empresa + GUIA.md
│   │   ├── users-permissions/      ← usuários e permissões **UI MUI + API** (`/v1/members` + profiles + catalog): lista + CRUD, senha provisória, Perfis com árvore ERP/PDV; sessões "Em breve" + GUIA.md
│   │   │   ├── api/                ← DTOs, mappers, members/profiles/catalog.service (comercioFetch)
│   │   │   ├── hooks/ · store/     ← React Query + Zustand (aba/busca/página)
│   │   ├── carriers/               ← transportadoras: lista + CRUD **via API** + GUIA.md
│   │   ├── production/             ← produção **via API** (React Query): Kanban/Lista + drawers; BOM da ficha técnica; GUIA.md
│   │   │   ├── api/ · hooks/ · pages/ · components/ · types/ · lib/
│   │   │   └── index.ts
│   │   └── suppliers/              ← fornecedores (**integrado à API**): lista Ativos/Excluídos + criar/editar (SUFRAMA, observação, unidades) + GUIA.md
│   ├── styles/
│   │   └── comercio-theme.css      ← light + dark overrides; tokens Tailwind das features
│   ├── theme/
│   │   ├── comercio-mui-theme.ts   ← seleciona preset ativo (`COMERCIO_THEME_PRESET`)
│   │   └── presets/
│   │       ├── comercio-theme-v1.ts  ← app branco / col2 `#F8FAFB`
│   │       └── comercio-theme-v2.ts  ← app `#F8FAFB` / col2 branco
│   ├── shell/
│   │   ├── comercio-erp-layout.tsx ← DualDashboardLayout + DualSidebar (@citybox/mui)
│   │   ├── comercio-header.tsx     ← empresa/unidade | Command | theme | ajuda/notif/user (MUI)
│   │   ├── organization-switcher.tsx ← troca de empresa (some com 1 empresa só)
│   │   ├── branch-switcher.tsx     ← troca de unidade (+ "Todas as unidades")
│   │   ├── theme-mode-switch.tsx   ← botão toggle Moon/Sun (next-themes)
│   │   ├── command-search.tsx      ← CommandDialog ⌘K
│   │   ├── notifications-menu.tsx  ← dropdown notificações mock
│   │   └── panel-menu.tsx          ← submenus coluna 2 (List MUI)
│   ├── lib/
│   │   ├── navigation.ts           ← seções Menu/Canais, footer, helpers path→module
│   │   ├── nav-icons.tsx           ← NavIcon + mapa semântico → `@mui/icons-material` (rail/painel)
│   │   ├── stores.ts               ← MOCK_STORES — resta só para `features/fiscal-parameters` (mock)
│   │   ├── auth-cookie.ts · oauth-pkce.ts · auth-server.ts · auth.ts · auth-fetch.ts
│   │   ├── session-context.tsx · session-bridge.ts · session-utils.ts
│   │   ├── organization-context.tsx ← OrganizationProvider / useOrganization / useCatalogScope
│   │   ├── api/active-scope.ts     ← escopo ativo fora do React (headers de toda chamada)
│   │   └── api/tenancy.ts          ← organizações e unidades do usuário
│   └── components/
│       ├── placeholder-page.tsx    ← PageHeader + texto “Em construção”
│       └── ui/
│           ├── data-table/         ← DataTable padrão MUI (`@citybox/mui` + ListPagePanel)
│           ├── data-table-shadcn/  ← legado TanStack + `@citybox/ui` (features ainda shadcn)
│           ├── list-page/          ← ListPageShell, ListLoadErrorAlert, RowActionsMenu
│           ├── form/               ← BackButton, EntityFormHeader, EntityFormFooter, FiscalScrollablePage, form-section-styles
│           ├── picker/             ← ProductPickerDrawer (adicionar produtos em forms)
│           ├── kanban/             ← KanbanBoard (@dnd-kit + ScrollArea MUI; produção)
│           └── status/             ← ActiveStatusBadge
├── next.config.ts
└── AGENTS.md
```

### 4.1 Navegação (rail)

| Grupo | Itens | Painel (coluna 2) |
| ----- | ----- | ----------------- |
| Menu | Visão Geral, Vendas, Produtos, Estoque, Clientes, Finanças, Relatórios | **Vendas**, **Produtos**, **Estoque**, **Clientes** e **Finanças** |
| Canais de Venda | Pontos de venda, Dispositivos | **Pontos de venda** |
| Footer | Meu plano, Configurações | — |

**Pontos de venda** (`/ponto-de-venda/cadastros` + painel):
- Leaves: Cadastros, Gerenciar Caixas, KDS, Mesas, Comandas
- Grupo **CONFIGURAÇÕES**: Geral/modos de pedido, Consignado, Crediário, Painel de senhas, Recibos e notas impressas, Troca & Devolução
- **Cadastros** (**API + UI MUI**): lista em `features/pos-registers` (`/v1/pos-terminals`, React Query + Zustand) — busca por nome (server-side, debounce 400ms), colunas Nome/Impressora/Balança/Status; **Novo PDV**/**Editar** abrem o mesmo Dialog (nome, status, NFC-e contingência, ponto de impressão, balança, servidor offline); terminal é vinculado à **unidade ativa** do cabeçalho (sem seletor no formulário — cadastro bloqueado com toast se nenhuma unidade estiver selecionada); menu ⋯ com Editar, **Gerar código de pareamento** (código opaco de 8 chars, 15min, exibido em Dialog com copiar), Marcar como inativo/ativo e Excluir (soft-delete), todos via mutation real
- **Gerenciar Caixas** (**UI MUI**, integrado à `erp-api`): `features/pos-cash-sessions` — `api/` (dto/mapper/service) + React Query; filtros PDV (terminais vivos)/operador/período; DataTable com paginação server-side (§8.1); Drawer de vendas/movimentos/fechamento. Turnos abertos no PDV Flutter alimentam `/v1/pos-cash-sessions`.
- **KDS** (mock, **UI MUI**): `features/kds` (`/ponto-de-venda/kds` + `/[id]/produtos`) — lista com seleção (Nome/Status/Expedição), Dialog **Novo KDS**/**Editar** (nome · status · tela de expedição), menu ⋯ com **Vincular produtos** / **Marcar como inativo|ativo** / Editar / Excluir; página de produtos vinculados (Nome · Código (SKU) · Categoria · Opções) com `ProductPickerDrawer` sobre o **catálogo real** (`useCatalogProductsQuery`)
- Demais subrotas ainda `PlaceholderPage`; `/ponto-de-venda` redireciona para `/ponto-de-venda/cadastros`
- **Dispositivos** permanece item separado no rail (sem painel)

**Vendas** (`/vendas` + painel):
- Leaves: Pedidos de venda, Vendas, Contrato de vendas
- Grupo **SERVIÇOS**: Ordem de serviços
- Grupo **FISCAL**: NF-e (real desde 2026-08-15, spec erp/026 — `features/nfe-issuance`), NFS-e, SAT CF-e (`disabled` no painel — opaco, não clicável; fora do ⌘K)
- Grupo **BENEFÍCIOS**: Promoções
- **Pedidos de venda** (real, **UI MUI**): lista + novo pedido mock em `features/sales-orders` (`/vendas/pedidos-de-venda` + `/novo`)
- **Promoções** (real, **UI MUI**): lista + cadastro/edição mock (form multi-etapas) em `features/promotions` (`/vendas/promocoes` + `/vendas/promocoes/novo` + `/vendas/promocoes/[id]`)
- **Contratos de venda** (real, **UI MUI**): lista + novo/editar + drawer Status em `features/sales-contracts` (`/vendas/contratos-de-vendas` + `/novo` + `/[id]`)
- **Ordens de serviço** (real, **UI MUI**): lista + novo/editar + drawer Status em `features/service-orders` (`/vendas/ordem-de-servicos` + `/novo` + `/[id]`)
- Demais subrotas ainda `PlaceholderPage`

**Produtos** (`/catalogo/produtos` + painel):
- Leaves: Produtos, Fichas técnicas, Variações e opções
- Grupo **GERAL**: Categorias, Unidade de medida, Lista de preços, Parâmetros fiscais
- Tela real: `features/products` — **listagem e form create/edit em `@citybox/mui`**
  (`PageHeader`, `Tabs`, `DataTable`, `Drawer`, `ConfirmationDialog`, `CurrencyInput`,
  `NumberInput`, etc.)
- Cadastro: `/catalogo/produtos/novo` (`ProductCreatePage`) — header voltar + tabs (Dados Básicos + Variações + Adicionais + **Sugestões**) + footer sticky dirty/save
- Edição/detalhe: `/catalogo/produtos/[id]` (`ProductEditPage`) — mesmo layout do cadastro com campos preenchidos (mock); clique na linha da lista ou ação **Editar** do dropdown
- Variações: `/catalogo/variacoes-e-opcoes` (`VariationListPage`) — **UI MUI**; busca no `PageHeader` + Nova variação; `DataTable` com seleção/highlight; drawer MUI (Opções / Cálculo)
- Fichas técnicas: `/catalogo/fichas-tecnicas` (`TechnicalSheetListPage`) — header com **Gerenciar produtos**; tabs Todos / Produção; toolbar busca + Select categoria + Filtro + Ordenação; colunas Nome (imagem/placeholder) · SKU · Categoria · Tipo de produção (badge) · ações. Detalhe: `/catalogo/fichas-tecnicas/[id]` (`TechnicalSheetDetailPage`)
- DataTable MUI: **`@/components/ui/data-table`** (wrapper de `@citybox/mui` + `ListPagePanel`).
  Preferir **`getRowHref`** (linha = `next/link`, top loader) a `onRowClick`+`router.push`.
  Controles internos usam `stopRowNavigation`. Em **Checkbox** de seleção: aplicar o toggle
  no `onClick` (junto com `stopRowNavigation`) — `preventDefault` cancela o `onChange` nativo.
  Nunca usar `TableRow component={Link}` (HTML inválido `<a><td>`). O `DataTable` do `@citybox/mui`
  já estica o link sobre a `<tr>`.
  `RowActionsMenu` aceita `href` nos itens de rota.
  Listagens migradas (produtos, categorias, variações, fichas técnicas, unidade de medida,
  parâmetros fiscais, listas de preço, **finanças** (plano de contas, grupos, contas bancárias, DRE, lançamentos)) **devem** usar este path —
  não importar `DataTable` de `@citybox/mui` direto nas features.
- Shells compartilhados MUI: `ListPageShell`, `ListLoadErrorAlert`, `RowActionsMenu`,
  `BackButton`, `EntityFormHeader`, `EntityFormFooter`, `ActiveStatusBadge`, `ProductPickerDrawer`,
  `KanbanBoard` em `components/ui/{list-page,form,picker,kanban,status}`.
  Preferir `BackButton` / `EntityFormHeader` para “Voltar” de página (não reinventar botão
  muted/ghost). Exceção: Voltar de step em wizard/drawer (`onClick`, sem `href`).
- DataTable shadcn (legado): **`@/components/ui/data-table-shadcn`** — sem features de Vendas restantes; **não** usar em catálogo, estoque,
  clientes, finanças, `sales-orders`, `sales`, `sales-contracts`, `service-orders` nem `promotions`.
- Drawers Importar / Filtros (`ScrollArea`)
- Grupo GERAL do catálogo (**Unidade de medida**, **Lista de preços**, **Parâmetros fiscais**):
  **UI 100% `@citybox/mui`** + DataTable local — zero `@citybox/ui` / `data-table-shadcn`.
  Primitivos do DS: `MultiSelect`, `DateRangePicker`, `Dialog`, `Tooltip`, `EmptyState`, `Alert`.

**Estoque** (`/estoque` + painel) — **UI 100% MUI** (`@citybox/mui` + `@/components/ui/*`):
- Leaves: Estoque, Movimentações, Transferências, Compras
- Grupo **LOGÍSTICA**: Transportadoras, Fornecedores
- Grupo **COMPRAS**: NF-e de entrada, Facilita NF-e (`disabled` no painel — opacos, não clicáveis; fora do ⌘K)
- Grupo **PRODUÇÃO**: Pedido produção, Produção, Finalização
- Grupo **CONFIGURAÇÕES**: Categorias de Movimentação (`features/movement-categories`)
- **Cadastro de depósitos** (API): lista/criar/editar/excluir (`features/stock` → `/v1/stocks`); unidades via `useBranchUnits`; `MOCK_STOCKS` permanece só para features ainda mock (produção, OS, warehouses)
- **Movimentações** (API): lista + registrar (`features/stock-movements` → `/v1/stock-movements`); categorias via `/v1/movement-categories/options`; produtos `trackStock=true`; mapper reais↔`costCents`
- **Balanço** (API): `/estoque/[id]/balanco` → `/v1/stocks/:id/balance` (search/status/paginação server-side) + drawer histórico `/v1/stocks/:stockId/products/:productId/movements`
- **Transferências** (API): lista Ativas/Canceladas + nova + cancel (`features/stock-transfers`)
- **Compras** (API): lista Ativas/Excluídas + nova/editar + soft-delete/restore (`features/purchases`); payments stub local
- **Categorias de movimentação** (API): CRUD drawer (`features/movement-categories` → `/v1/movement-categories`); sem mock local
- Match ativo no painel: `matchLeafByPath` (path mais específico) — evita `/estoque` destacar junto com `/estoque/compras`

**Clientes** (`/clientes` + painel) — **UI 100% MUI** (`@citybox/mui` + `@/components/ui/*`):
- Leaves (sem grupo): Clientes (`/clientes`), Categoria (`/clientes/categoria`)
- Grupo **MARKETING**: Campanha (`/clientes/campanha`, `disabled` / opaco — em breve)
- **API**: listagem + cadastro em `features/customers` (`/v1/customers`, React Query + Zustand) — `ListPagePanel` + tabs CRM + `SearchInput` + `DataTable` 1-based; `/clientes/novo` form full-page; `salesTotal` ainda 0 na API
- **Categoria (API)**: CRUD em **`Dialog` MUI** — `features/customer-categories` → `/v1/customer-categories`. Tabela (Nome, Desconto, Clientes) +
  `Menu` row actions + `ConfirmationDialog`; criar/editar abre `Dialog` (não `Drawer`) com Nome e
  Porcentagem de desconto (`NumberSpinner` 0–100)

**Finanças** (`/financas/extratos` + painel) — **features reais 100% MUI** (`@citybox/mui` + `@/components/ui/*`):
- Leaves: Extratos, Lançamentos, Conciliação bancária, Relatórios de resultados, Análise por centro de custo, Boletos
- Grupo **ORGANIZAÇÃO FINANCEIRA**: Contratos de cartões e outros, Contas bancárias, Grupo financeiro, Plano de contas, Centro de custo
- Grupo **NOTAS FISCAIS**: Facilita NF-e, Contabilidade
- `/financas` redireciona para `/financas/extratos`
- **Extrato** (real, MUI+API, 2026-08-07 — spec `007-financeiro-ajustes-ui`): consulta somente-leitura em `features/financial-statement` (`/financas/extratos`) — filtro por período (competência **ou** vencimento), tipo, status, categoria, centro de custo, conta bancária e busca livre; resumo do topo é **só** os 3 cards Entradas/Saídas/Saldo do período (`GET /v1/financial-entries/summary`) — **saldo por conta bancária removido do resumo** (`BankAccountBalancesPanel`/`use-bank-account-balances` excluídos; saldo por conta segue disponível em `/financas/contas-bancarias`); grade com Competência, Vencimento, Categoria, Método de pagamento, Valor original, Valor final, Status (as duas colunas de data ficam sempre visíveis juntas, sem alternar por filtro); seleção de linhas com soma client-side. Zero ação de escrita — "Ver" só navega até `/financas/lancamentos/[id]`
- **Grupo financeiro** (real, MUI+API): React Query → `/v1/financial-groups` (`/financas/grupo-financeiro`); abas Ativos/Excluídos; mock `data/mock-financial-groups.ts` **removido** (2026-08-06) — só existia para sustentar a DRE mock
- **Plano de contas** (real, MUI+API): React Query → `/v1/chart-of-accounts` (`/financas/plano-de-contas`); abas Ativos/Excluídos; mock `data/mock-chart-of-accounts.ts` **removido** (2026-08-06 — idem; `financial-entries` já usava `useChartOfAccountOptionsQuery` real desde 2026-08-05)
- **Análise por centro de custo** (real, MUI+API): React Query → `/v1/reports/cost-centers` (`/financas/analise-centro-de-custo`, novo)
- **Centro de custo** (real, MUI+API): React Query → `/v1/cost-centers` (`/financas/centro-de-custo`); abas Ativos/Excluídos + Dialog CRUD
- **Contratos de cartões** (real, MUI+API): React Query → `/v1/card-contracts` + payment-methods aninhados (`/financas/contratos-de-cartoes-e-outros`)
- **Relatórios de resultados** (real, MUI+API): DRE real (`/v1/reports/income-statement`) em `features/financial-results` (`/financas/relatorios-de-resultados`)
- **Contas bancárias** (real, MUI): lista + drawer + detalhe em `features/bank-accounts` (`/financas/contas-bancarias`)
- **Lançamentos** (real, MUI+API): lista + form + anexos + transferências em `features/financial-entries` (`/financas/lancamentos`)
- **Facilita NF-e** (2026-08-10, spec `009-facilita-nfe-screen`, MUI + **`services/fiscal-api`**, :3116, novo proxy `/api/proxy/fiscal`): `features/facilita-nfe` (`/financas/facilita-nfe`) — **só a aba "Emitido" é real**; "Recebido" e "Histórico de Envios" são placeholder por decisão explícita (dependem de backend que não existe: manifestação do destinatário e envio de e-mail/agendamento, respectivamente — ver `spec.md` `## Clarifications` da feature). Aba "Emitido": `GET /v1/fiscal-documents` (busca/filtro/paginação **backend-driven**, `search` novo nesta feature) + `GET /v1/fiscal-documents/summary` (novo, cards Total/Autorizadas/Canceladas — "Manifestações finais"/"Não manifestadas" sempre zerados, não têm equivalente para documento emitido). `companyId` resolvido pelo CNPJ da organização ativa (`GET /v1/organizations/current` + `GET /v1/companies?cnpj=`, `features/facilita-nfe/hooks/use-fiscal-company.ts`). Estado "Emitente fiscal não configurado" quando não há `Company` cadastrado para o CNPJ.
- Demais subrotas ainda `PlaceholderPage`

> ⚠️ **`/api/proxy/fiscal` — identidade de saída não é o token do usuário (2026-08-13, bugfix).**
> Achado ao testar a área Fiscal logada como usuário comum (`lojista`, sem `platform_admin`):
> a `fiscal-api` autoriza por **role de Keycloak** (`fiscal_operator`/`platform.admin`), não
> pelas permissões `org.view`/`store.catalog.manage` da erp-api — repassar o token do próprio
> usuário (como o proxy fazia até então) dava **403 até numa leitura inofensiva** ("o Emitente
> existe?"), e a tela caía no erro genérico em vez do aviso correto "emitente não configurado".
> Correção: `/api/proxy/fiscal/[...path]/route.ts` autentica com um **token de serviço**
> (client Keycloak `fiscal-m2m`, realm `citybox-erp`, Service Accounts + role `fiscal_operator`
> — mesmo client que a `erp-api` usa; **não** `citybox-fiscal-service`, que vivia no extinto
> realm `citybox-dev` e dava "unauthorized" quando usado aqui, achado 2026-08-14 —
> `KEYCLOAK_FISCAL_M2M_CLIENT_SECRET`) só
> nas rotas com **dono verificado no servidor** (`companyId` no path/query, `/v1/companies`
> list-by-cnpj/create) — `lib/api/fiscal-tenant-guard.ts` resolve o `companyId` esperado a
> partir da sessão do usuário (`GET /v1/organizations/current` na erp-api, que valida
> `Membership`) e **rejeita (403)** qualquer request cujo `companyId` não bata, fechando o
> cross-tenant que o token de serviço sozinho abriria. **Todas as outras rotas da fiscal-api**
> (cancelar/corrigir/inutilizar NF-e-NFC-e-NFS-e, ativar certificado, mutar sequência por id,
> `sefaz-status`) continuam saindo com **o token do próprio usuário** — comportamento de sempre
> (403 pra quem não tem a role), não uma regressão; cobri-las é follow-up (autorização por
> Emitente dentro da própria fiscal-api, ou resolvedor de dono por recurso aqui). `fiscalFetch`/
> `fiscalUpload` (`lib/api/fiscal-client.ts`) passam a mandar `X-Organization-Id` (mesmo escopo
> ativo do `comercioFetch`) — só o proxy usa esse header; a fiscal-api em si continua sem headers
> de escopo. Reviewers: security-review achou CRITICAL na primeira versão (token de serviço sem
> checagem cobria só 3 formas de rota, as ~40 restantes ficavam sem dono nenhum) — corrigido pro
> desenho atual (token de serviço só onde há checagem; resto cai no fallback seguro) e
> re-verificado.

### 4.5 Features (domínio)

Domínio em inglês sob `src/features/<feature>/` (`pages`, `components`, `data`, `hooks`, `services`, `types`, `lib`). Rotas em `app/(app)/…` só reexportam a page da feature.

> **Obrigatório — `GUIA.md` por feature:** toda feature em `src/features/<feature>/`
> deve ter um arquivo **`GUIA.md`** na raiz da pasta. É um **manual de negócio da
> funcionalidade, escrito para uma pessoa leiga** aprender a usar o sistema —
> explica o que é, para que serve e como usar, em passo a passo. **Sem termos
> técnicos de programação** (nada de componentes, hooks, rotas, mock, DnD, etc.),
> apenas linguagem de negócio. Ao **criar** uma feature, crie o `GUIA.md`; ao
> **alterar** o comportamento visível ao usuário, **atualize** o `GUIA.md` na
> mesma operação. Referência de tom/estrutura: [`products/GUIA.md`](src/features/products/GUIA.md)
> e [`technical-sheets/GUIA.md`](src/features/technical-sheets/GUIA.md). O `GUIA.md`
> é para o **usuário final**; o `AGENTS.md` continua sendo a doc técnica.

> **Roteiro E2E Catálogo + Estoque:**
> [`TESTES-CATALOGO-ESTOQUE.md`](TESTES-CATALOGO-ESTOQUE.md) na raiz do `web/` —
> cenários ponta a ponta (produto → ficha → entrada/compra → transferência →
> inventário → produção → coluna estoque). Detalhe por feature: `features/*/TESTES.md`.

**`features/customers`:** **integrado à `erp-api`** (`/v1/customers`, React Query + Zustand). Listagem server-side (tabs CRM + busca debounce 400ms + paginação); colunas: seleção · Nome · E-mail · Telefone · Vendas (BRL, sempre 0 nesta fase) · Data da criação. **Cadastro** (`/clientes/novo`): POST via mutation; seções **Dados pessoais** (categoria via `useAllCustomerCategoriesQuery` + “Nova categoria” → mutation) e **Endereços** com máscara CEP + lookup `GET /v1/cep/:cep` (`useCustomerCepLookup`, debounce 400 ms; loading desabilita demais campos; toast em falha). **`CustomerQuickCreateDialog`**: POST real + mesmo lookup. `data/mock-customers.ts` residual para Vendas/Finanças ainda mock. **Spec erp/031 D3 (2026-08-20):** a listagem ganha uma ação **Editar** visível por linha (`RowActionsMenu`, `@/components/ui/list-page`) — a edição em si (`/clientes/[id]`, `CustomerEditPage`, backend `PUT /v1/customers/:id`) já existia desde spec erp/029/B2; o único gap era descoberta — a listagem só levava à edição pelo clique implícito na linha inteira (`getRowHref`), sem nenhum ícone/botão indicando a ação.

**`features/customer-categories`:** CRUD via `/v1/customer-categories` (React Query + Zustand) — sem store mock na listagem. Autocomplete do formulário de cliente usa `useAllCustomerCategoriesQuery`.

**`features/products` — primeira feature integrada à API.** Não é mock: consome a
`erp-api` (`/v1/products`) via proxy `/api/proxy/comercio`, com
**React Query** para dados e **Zustand** para estado de UI. Estrutura extra em
relação às demais features: `api/` (dto + mapper + service), `hooks/query-keys.ts`,
`hooks/use-product-queries.ts`, `hooks/use-product-mutations.ts` e
`store/product-list.store.ts`.

> ⚠️ **O que é persistido no produto:** nome, SKU, categoria, preço, tipo,
> unidade de medida, perecível, descrição, controla-estoque, códigos de barras,
> **unidades/filiais** (`branchIds`), **fornecedores** (`suppliers`), **imagem**
> (MinIO via `POST/GET/DELETE /v1/products/:id/image`; upload multipart com
> `comercioUpload`; `<img src>` usa `productImageProxyUrl` com
> `?organizationId=` porque o browser não manda headers de escopo),
> **variações** (`variationFormat` + `variations[]`), **adicionais**
> (`v1/product-addons` + `addonSettings`/`addonLines`), **sugestões**
> (`suggestions[]`) e **disponibilidade** (`availableOnErp` / `availableOnPdv`).
> As abas Adicionais/Sugestões usam catálogos reais via React Query. A seção
> Disponibilidade persiste só ERP + PDV; produtos com `availableOnPdv=false`
> não entram em `GET /v1/pos/catalog`.
>
> ⚠️ **`data/mock-products.ts` continua existindo** para features ainda mock
> (vendas, promoções, ordens de serviço, company-settings). Features de estoque/
> catálogo integradas **não** o usam mais.
>
> **Importação XLSX (2026-08-16):** drawer habilitado — template
> `GET /v1/products/import/template` + `POST /v1/products/import`. Bulk delete
> via barra de seleção + `POST /v1/products/bulk-delete`. Ações de linha:
> estoque (`/estoque/:id?search=sku`), movimentações, venda nova, duplicar
> (`POST /v1/products/:id/duplicate`).
>
> **Fase A catálogo (2026-07-28):** fichas técnicas, parâmetros fiscais e detalhe
> de lista de preços passam a derivar produtos reais via `useCatalogProductsQuery`
> (`listAllProducts` na API).
>
> **Fase B.1 (2026-07-28):** `features/variations` integrado à API; aba Variações
> do produto persiste vínculos; fichas técnicas leem vínculos reais do produto.
>
> **Fase 9 (2026-07-29):** coluna **Estoque** vem da API (`stock` branch-aware +
> `trackStock` — mostra `"0"` se controla estoque e saldo zero, `—` se não
> controla); filtro do drawer `in_stock`/`out_of_stock` e sort `stock_*` vão no
> query string. **Lista de preço** real; **Canais** = ERP/PDV a partir dos flags
> de disponibilidade.

Descrição da listagem: **UI MUI** (`@citybox/mui` — `PageHeader`, `Tabs`/`Badge`, `SearchInput`, `Drawer` filtros/import, `DataTable` com paginação 1-based + `isLoading`/`getRowHref` (linha = `next/link`, dispara `nextjs-toploader`; não usar `router.push` na linha), `Menu` row actions com `href` quando for rota, `Popover` canais). **Importação XLSX:** o drawer baixa o template real em `GET /v1/products/import/template`, envia `file` multipart para `POST /v1/products/import`, mostra contagens/erros por linha e invalida o catálogo. **Form create/edit** também em MUI via `ProductFormView` (`ScrollArea`, `Tabs`, `FormField`, `Select`, `Autocomplete` em fornecedores/sugestões, `Switch`, `CurrencyInput`, `NumberInput`, `Drawer`, `ConfirmationDialog`; layout `sx` em `lib/product-form-section-styles.ts`). O **drawer de variações do produto** (`product-variants-drawer`) reutiliza `VariationForm`/`VariationOptionForm` já em `@citybox/mui` — fluxo create/edit de produto 100% MUI na aba Variações. Hooks/store/API inalterados. Listagem: clique na linha ou **Editar** → página do produto.

**`features/variations`:** **integrado à `erp-api`** (React Query + Zustand, molde categorias/UoM). Listagem server-side (`page`/`perPage`/`search`, debounce 400ms); CRUD drawer; exclusão com `ConfirmationDialog` + 409 se produto vinculado. Preço das opções: **reais no form** ↔ **centavos na API**. `useAllVariationsQuery` alimenta o drawer de variações do produto e o resumo “Variações anexadas” na aba do produto. Formato do produto é **XOR** (`grid` **ou** `composite`, não os dois). Imagens escolhidas ficam em `pendingImageFile` (fora do JSON); depois de criar/atualizar, as opções salvas são casadas por `sortOrder` (fallback nome) e enviadas via multipart para `POST /v1/variations/:variationId/options/:optionId/image`. URLs `blob:` nunca são persistidas em `imageUrl`.

**`features/technical-sheets`:** **integrado à `erp-api`** (`/v1/technical-sheets`, React Query). Listagem server-side (§8.1: `page`/`perPage`/`search`/`tab`/`category`/`sort`/`productionTypes`, debounce 400ms). Detalhe `GET`/`PUT` por `productId`; insumos = products `type=supply`; custos derivados de `basePriceCents`. Estrutura de variações vem de `useProductQuery` + `useAllVariationsQuery`; merge de `optionComponents` da API. Mock de composição removido. **Imagem:** `hasImage` → `productImageProxyUrl(id)` (object key nunca no `<img src>`). **Loading do detalhe:** `TechnicalSheetDetailSkeleton` (espelha header + tipo + seções + footer) enquanto as queries carregam; erro com `ListLoadErrorAlert`. **Preço atual** na seção de custos = `Product.basePriceCents` (via `useProductQuery`); “Aplicar sugerido” só grava no produto ao **Salvar** (`applyBasePriceCents`). Mutations de produto invalidam fichas técnicas. **Linha de composição:** tokens em `compositionCol` (Insumo min 260, Quantidade 120); seções de composição usam `formCompositionSectionGridSx` (título empilha até `xl` — em 1280 o título à esquerda esmagava o Autocomplete). Não voltar a `formSectionGridSx` nessas seções.

**`features/production`:** **integrado à `erp-api`** (`/v1/production-orders`, React Query). Tela única `/estoque/producao` (Kanban + Lista paginada server-side). Create/start/cancel/finalize + histórico/comentários via API. BOM ao vivo da ficha `productive_process` (insumos no detalhe). Finalize gera `consumo-interno` + `entrada-avulsa` no ledger. Mocks `mock-recipes` / `mock-production-orders` removidos.
**`features/unit-of-measure`:** **integrado à `erp-api`** (React Query + Zustand, molde categorias). CRUD drawer com listagem server-side (`page`/`perPage`/`search`, debounce 400ms). `GET ?active=true` alimenta dropdown de produtos e fichas técnicas.

**`features/categories`:** CRUD integrado à `erp-api` via proxy `/api/proxy/comercio` — React Query + Zustand (mesmo padrão de `features/products`). Listagem server-side (`page`/`perPage`/`search`, debounce 400ms): colunas Nome · Produtos · Status; drawer Nova/Editar (Nome + Ativo); excluir via `ConfirmDialog` (bloqueado na API se houver produtos vinculados). Campos de hierarquia/cor/descrição do mock anterior **não** existem no backend nesta fase.

**`features/fiscal-parameters`:** integrado à `erp-api` (`/v1/fiscal-parameters`) via proxy — React Query. Listagem server-side (§8.1: `page`/`perPage`/`search`/`tab`/`category`/`sort`/`statuses`, debounce 400ms). Detalhe: `GET`/`PUT` por `productId`; pesos/FCP string↔Decimal no mapper; unidades = branches reais da org (`useOrganization().branches`), não `MOCK_STORES`. Opções em `data/fiscal-options.ts` via **`Autocomplete`** (NCM, origem, CEST, CST IBS/CBS, classificação, ICMS, IPI, PIS & Cofins, CFOP, **ISSQN**). **Imagem:** `hasImage` → `productImageProxyUrl(id)`. **2026-08-13 (spec erp/014):** ganhou o 5º campo de grupo **ISSQN** (`ISSQN_OPTIONS` — situações LC 116/NFS-e nacional) no grupo e no override por filial, percorrendo types/dto/mapper/form-values/settings-section. **Herança:** a `fiscal-parameters-detail-page` busca os padrões da org (`useFiscalDefaultTaxesQuery`/`useFiscalGroupsQuery` de `features/fiscal-default-taxes`) e, para cada campo de grupo **vazio** do produto, mostra a legenda "Herdado do padrão: …" (`FiscalSettingsSection` prop `inherited`; `buildInheritedLabels` resolve nome do grupo / label do CFOP). Só exibição — a emissão não consome.

**`features/price-lists`:** integrado à `erp-api` (`/v1/price-lists`) via proxy — React Query + Zustand (UI: search/page). Listagem server-side (§8.1). Detalhe: itens via `GET/PUT …/items` (substitui conjunto); preços em reais no UI / centavos na API. Priorização DnD → `PUT …/reorder`. Mock removido.

**`features/stock`:** cadastro de depósitos via API (`/v1/stocks`, React Query). **Lista** (`StockListPage`, `/estoque`): PageHeader + DataTable server-side com **skeleton** (`isLoading`) e **`getRowHref`** (`/estoque/:id`, Link/top-loader); atalhos do menu via `href` (entrada/saída/balanço/inventário/editar). Exclusão bloqueada se `isDefault` ou `hasMovements` (API). **Criar/Editar** via `StockFormView`. **Balanço** (`StockBalancePage`): `GET /v1/stocks/:id/balance` com search debounce 400ms, filtro status (ok/low/empty), paginação server-side (§8.1); cards de resumo; `ProductMovementsDrawer` via `GET /v1/stocks/:stockId/products/:productId/movements`. **Imagem no balanço:** API `hasProductImage` → `productImageProxyUrl(productId)` no mapper (object key nunca no `<img src>`). Stubs in-memory `stock.service` / `stock-balance.service` **removidos** (Fase 9). Roteiro: `TESTES.md`.

**`features/stock-inventory`:** inventário (contagem física) **via API** (React Query). **Lista** (`InventoryListPage`): `GET /v1/stocks/:stockId/inventories` + `useStockQuery`. **Contagem** (`InventoryCreatePage`): produtos `listAllProducts({ trackStock: true })`; saldo UI via `listStockBalanceApi`; **POST** `{ name, lines: [{ productId, countedQuantity }] }` (servidor captura `systemQuantity`); loading no confirmar (`isPending`); invalida balance + movements + products. **Detalhe** (`InventoryDetailPage`): `GET /v1/inventories/:id`. Divergência = `counted − system` (`lineDivergence`). Mock `mock-inventories` / `finalizeInventory` removidos.

**`features/stock-movements`:** entradas/saídas manuais via API (`/v1/stock-movements`, React Query). **Motivo (`reason`)**: enum vindo da API (`sale`, `purchase_entry`, `production_in/out`, `transfer_in/out`, `inventory_in/out`, `manual`); rótulos e `resolveStockMovementReasonLabel` em `types/stock-movement-reason.ts` — no manual o rótulo é a categoria escolhida (`categoryName`), nos demais é o próprio motivo. Coluna, título do drawer e kardex mostram o motivo; `categoryName` chega **nulo** fora do manual. **Lista**: tabs + busca debounce 400ms + filtro de motivo (`StockMovementReasonFilter` → query `reason`) + `tabCounts` da API; drawer de detalhe (`GET :id` com lines). **Registrar** (`/estoque/movimentacoes/novo`): estoques via `listStocksApi`, categorias via `/v1/movement-categories/options?type=`, produtos `listAllProducts({ trackStock: true })`, saldo da coluna = balanço do depósito selecionado; mapper `warehouseId`↔`stockId`, `costPrice` reais ↔ `costCents`; Salvar com `loading={isPending}`. Deep link `?type=&estoque=` permanece. `services/stock-movement.service.ts` guarda **só** `listAvailableProducts` / `listWarehouses` para vendas/OS ainda mock; `createStockMovement` e `mock-movement-category-options` **removidos** (Fase 9). `MOCK_WAREHOUSES` / `MOCK_STOCKS` / `MOCK_PRODUCTS` preservados para vendas. Roteiro: `TESTES.md`.

**`features/movement-categories`:** CRUD via `/v1/movement-categories` (React Query) — **sem store mock**. **Lista** (`MovementCategoryListPage`, `/estoque/categorias-de-movimentacao`): PageHeader + Nova categoria; toolbar busca (código/nome, debounce 400ms) + Select Tipo; colunas Código · Nome · Tipo · ações Editar/Excluir (`canRemoveMovementCategory` — `isSystem` desabilita exclusão com caption); `ListLoadErrorAlert` + loading na tabela. **Drawer:** Nome (max 60) · Tipo (locked se `isSystem`) · unidades (`useBranchUnits` + `ProductUnitsDrawer`); Salvar com `loading={isSaving}`. Código `CM-NNN` gerado no backend. Form de movimentações usa `/v1/movement-categories/options`. Roteiro: `TESTES.md`.

**`features/stock-transfers`:** remanejamento entre depósitos **via API** (React Query). **Lista** (`StockTransferListPage`, `/estoque/transferencias`): `GET /v1/stock-transfers` — tabs **Ativas** / **Canceladas** + busca debounce 400ms + drawer Filtro (estoque saída/entrada via `useStocksQuery`); colunas ID · Data · Estoque saída · Estoque entrada · Responsável; row action **Cancelar** → `POST …/cancel` (estorno no backend; toast da mutation). **Nova** (`StockTransferCreatePage`, `/estoque/transferencias/novo`): estoques via `listStocksApi`; produtos `listAllProducts({ trackStock: true })`; saldo coluna = `listStockBalanceApi` do depósito de saída; POST `{ fromStockId, toStockId, operatedAt, carrierId?, responsibleName, notes, lines }`; mapper `warehouseId`↔`stockId`; loading no save (`isPending`). Transportadora: `useCarrierOptionsQuery` (ativas da API). Sem detalhe/`[id]`. Mock `mock-stock-transfers` / service in-memory removidos.

**`features/sales-orders`:** pedidos de venda (API). **UI MUI** (`@citybox/mui` + `@/components/ui/*`). **Lista** (`SaleOrderListPage`, `/vendas/pedidos-de-venda`): `ListPageShell` + `PageHeader` + `ListPagePanel`; tabs **Aberto** / **Excluídos** + Badge; toolbar `SearchInput` + Drawer **Filtro** (status multi + **canal** `Select` → query `channelId` + valor mín/máx `CurrencyInput` + período presets / `DateRangePicker`; Limpar/Aplicar no `footer` fixo do `Drawer`) + Ordenação (`Menu`); query da lista: `statuses` (append por status), `channelId` opcional, e período via `resolveSaleOrderPeriodRange` → `dateFrom`/`dateTo` ISO (**não** envia `periodPreset`); `DataTable` 1-based. Colunas: seleção · Pedido (`#N` + cliente) · Valor · Status (`SaleOrderStatusBadge`) · Criado por · Canais de venda · Criado em · ações. Menu ⋯ (`Menu`/`MenuItem` aninhados): **Alterar status**, **Gerar nota fiscal** (NFe/NFCe disabled), Imprimir / Baixar PDF / Gerar venda / Editar (toast em breve), Excluir (soft-delete). **Detalhe/edição:** painel Informações mostra **Canal** (com sufixo **· Entrega** / **· Retirada** quando `posDeliveryFulfillment` vem da API) e, quando houver, **Pedido delivery #N** (`posDeliveryOrderNumber`) só leitura. **Novo** (`SaleOrderCreatePage`, `/vendas/pedidos-de-venda/novo`): form full-bleed (`m: -3`) + `ScrollArea` + `EntityFormHeader`/`EntityFormFooter` mode dirty; layout `formSplitLayoutGridSx` — **Produtos** (`Select` estoque, busca, `ProductPickerDrawer` via `StockMovementAddProductsDrawer`, `DataTable` + `NumberInput`/`CurrencyInput`) + **Pagamentos** (recebimentos; auto-sync/`splitAmountEvenly`/`computeRemainingPaymentAmount` inalterados; dialogs Taxa/Descontos) + sidebar **Cliente** (`Autocomplete` + `CustomerQuickCreateDialog`) + **Informações** (`DatePicker`/`Select`, `statusLocked`) + **Observações** (`Dialog`). Lógica mock/store inalterada (`data/mock-sale-orders.ts`). Zero `@citybox/ui` / `lucide-react` / `data-table-shadcn` nesta pasta. **2026-08-06 (motor de recebíveis):** o painel de Pagamentos captura `cardPaymentType` (`pix`/`debit`/`credit`, resolvido pela forma de pagamento escolhida — `MOCK_PAYMENT_METHODS` de `features/purchases/data/` separou "Cartão de débito" de "Cartão de crédito", que antes era uma entrada genérica única), Bandeira (`Select` sobre `card-contracts/data/card-brands.ts` — catálogo fixo compartilhado, não texto livre) e Parcelas (`NumberSpinner`, só para crédito); trocar a forma de pagamento limpa bandeira/parcelas. `SaveSaleOrderPayload`/`SaleOrderPayment` (tipos) e o mapper ganharam os 3 campos nos dois sentidos.

**`features/sales-contracts`:** contratos de venda recorrentes (mock). **UI MUI** (`@citybox/mui` + `@/components/ui/*`). **Lista** (`SalesContractListPage`, `/vendas/contratos-de-vendas`): `ListPageShell` + `PageHeader` (**Status** + **Novo contrato**) + `ListPagePanel`; tabs **Ativos** / **Excluídos** (`Tabs`/`Badge`); toolbar `SearchInput` + Drawer **Filtro** (`Drawer` MUI: status multi, cliente `Autocomplete`, categoria `Select`, vencimento `DateRangePicker`, produtos checkboxes, status pagamento) + Ordenação (`Menu`); `DataTable` 1-based com `getRowHref`; colunas seleção · Contrato (`#N` + cliente) · Status · Vigência · Próx. vencimento · Pagamento · Valor · ações (`Menu` — editar / soft-delete / restaurar). **Form** (`SalesContractCreatePage` / `SalesContractEditPage` compartilham `SalesContractFormView`): full-bleed (`m: -3`) + `ScrollArea` + `EntityFormHeader`/`EntityFormFooter` mode dirty; seções `formSectionGridSx` — Informações gerais (`Autocomplete` cliente + `CustomerQuickCreateDialog`, vendedor, datas, status) · Produtos/serviços (`SaleOrderProductsTable` + `ProductPickerDrawer`) · Pagamento e recorrência (`RadioGroup`/`DatePicker`/`NumberInput`); ao salvar `generateContractInstallments` materializa parcelas no store mock + toast. **Drawer Status** (`ContractStatusDrawer`): `Drawer` MUI + CRUD inline + DnD `@dnd-kit` (`DragIndicator`, `reorderContractStatuses`); exclusão via `ConfirmationDialog`; seed Ativo/Aberto/Inativo; bloqueia exclusão se em uso. Zero `@citybox/ui` / `data-table-shadcn` / `lucide-react`. Sem rota `/status` dedicada.

**`features/service-orders` — Ordens de serviço** (PRD: `.claude/prds/varejo/ordem-de-servico.prd.md`). **UI MUI** (`@citybox/mui` + `@/components/ui/*`). **Status gerenciáveis com tipo-base fixo**: `ServiceOrderStatus` tem `baseType` (`open`/`in_progress`/`ready`/`closed`/`canceled`) — as **tabs da lista agrupam por baseType** (via `resolveTab`), então status personalizados nunca quebram navegação/contadores; 8 status seed em `mock-service-order-statuses.ts`; gerenciador (`ServiceOrderStatusDrawer` + `service-order-status-form-panel` + `sortable-row`) espelha o de Contratos (`Drawer` MUI + DnD `@dnd-kit` + `DragIndicator` + CRUD + `ConfirmationDialog`; bloqueia exclusão se em uso via `isServiceOrderStatusInUse`), com campo extra **Etapa (tipo-base)** (`Select`). **Lista** (`ServiceOrderListPage`, `/vendas/ordem-de-servicos`): `ListPageShell` + `PageHeader` (**Gerenciar status** + **Nova OS**) + `ListPagePanel`; tabs por etapa (`Tabs`/`Badge`); toolbar `SearchInput` + Drawer **Filtro** (`Drawer` MUI: status multi, técnico `Select`, período `DateRangePicker`) + Ordenação (`Menu`); `DataTable` 1-based com `getRowHref`; colunas seleção · OS (código+cliente) · Equipamento (1º nome `+N`) · Técnico · Prazo (badge **Vencido** via `isOverdue`) · Total · Status · ações (`Menu` — Editar, Imprimir submenu toast, Gerar venda, Cancelar → `ConfirmationDialog`). **Form** (`ServiceOrderFormView`, `/novo` + `/[id]`): full-bleed (`m: -3`) + `ScrollArea` + `ProductFormHeader`/`ServiceOrderFormFooter`; seções `formSectionGridSx` (`ServiceOrderSection`) — Informações gerais (`Autocomplete` cliente, `Select` status/vendedor/técnico, `ServiceOrderDateTimeField` MUI) · Equipamentos 1..N com laudo · Serviços/produtos (`DataTable` + `Autocomplete`/`CurrencyInput`/`NumberInput`) · Orçamento (`CurrencyInput`/`DatePicker`/`RadioGroup`). **Gerar venda** (`ServiceOrderPaymentDialog`): `Dialog`/`CurrencyInput`/`Select` MUI; `generateSaleFromServiceOrder` → `SALE_ORDERS_STORE`. Zero `@citybox/ui` / `data-table-shadcn` / `lucide-react`. Store mock inalterado. Roadmap no GUIA. **Spec erp/031 D1 (2026-08-20):** `linesForGenerateSale()` (`api/service-order.mapper.ts`) passa a incluir linhas `kind === "service"` (com `description`, sem `productId`) em `payloadJson.lines` — antes só linhas de produto de catálogo entravam, e uma OS só-serviço batia sempre no 400 "A OS precisa de ao menos uma linha..." do backend mesmo tendo itens visíveis. `handleConfirm()` de `ServiceOrderPaymentDialog` ganha uma guarda de "nenhuma linha" (`order.lines.length === 0`) antes de chamar a mutation — bloqueia no cliente com mensagem clara em vez de deixar o erro cru da API chegar ao usuário.

**`features/bank-accounts` — Contas bancárias** (`/financas/contas-bancarias`, **integrado à `erp-api`**: `/v1/bank-accounts` + `/v1/bank-accounts/:id/{transactions,statement}` + `/v1/bank-transfers`). **UI MUI** (`@citybox/mui` + `@/components/ui/*`). Contas **virtuais** que espelham as contas reais (sem integração bancária; conciliação por importação OFX — ação em toast "em breve"). **Lista** (`BankAccountListPage`): `PageHeader` + `ListPagePanel` + `SearchInput`; busca por nome/banco; colunas Conta (ícone + nome + banco) · Abertura · Unidades vinculadas · **Saldo atual calculado** (negativo em `error.main`, nunca o saldo de abertura estático — FR-004) · ⋯ (`Menu` — Transações / Histórico com deep-link `?view=historico` / Importar OFX toast); linha clicável → detalhe; busca e paginação server-side (`use-bank-account-list.ts`, debounce 400ms). **Nova/editar conta** (`BankAccountCreateDrawer`, `Drawer` MUI width 480, um só componente para os dois modos via prop `account?`): banco (`Select` sobre `lib/bank-catalog.ts` — catálogo de referência estático, não mock de dados; `code` persistido em `bankCode` garante o round-trip do `Select` ao reabrir a conta — FR-015), apelido opcional, saldo inicial (`CurrencyInput`), data de abertura (`DatePicker`) e unidades via card + `ProductUnitsDrawer` externo; POST/PUT reais (`createBankAccountApi`/`updateBankAccountApi`); a movimentação `initial_balance` nasce no **backend**, não mais no front. **Detalhe** (`BankAccountDetailPage`, `[id]`, `EmptyState` se não encontrada, `Skeleton` durante o carregamento): `EntityFormHeader` + botão **Editar** (abre o mesmo drawer em modo edição) + card de saldo real (`useBankAccountQuery`) + `Tabs` MUI **Transações** (`BankAccountTransactionsTable`, `DataTable` paginado server-side + filtro de tipo/período) e **Histórico** (`BankAccountStatement`, extrato paginado com saldo acumulado — `runningBalanceCents` já vem correto da API mesmo entre páginas). `signedAmount` continua no client só para colorir/formatar o valor exibido; o saldo em si é sempre o que a API devolve. `services/bank-account.service.ts` e `data/mock-bank-accounts.ts` **removidos** (2026-08-06) — zero store em memória na feature. **2026-08-07 (spec `007-financeiro-ajustes-ui`, US7):** `lib/bank-catalog.ts` (`BANK_CATALOG`) trocou os 10 slugs semânticos antigos (`bank-bb`, `bank-nubank`, …) pelos 19 bancos + Conta PDV especificados, com `code` = código numérico como string (ex.: `"237"` Bradesco, `"-30"` Conta PDV) — round-trip código→nome (`getBankNameByCode`) inalterado; contas já cadastradas com `bankCode` fora da nova lista continuam existindo, só caem no fallback `"—"` do nome (Assumption do spec — sem migração de dado histórico).

**`features/financial-entries` — Lançamentos** (`/financas/lancamentos`, **integrado à `erp-api`**: `/v1/financial-entries` + `/v1/financial-entries/:id/attachments`). **UI MUI** (`@citybox/mui` + `@/components/ui/*`). Unifica **Contas a pagar** e **Contas a receber** (`FinancialEntryOperation` = `receivable`/`payable`). React Query (`api/` dto+mapper+service, `hooks/use-financial-entry-{queries,mutations,list,form}.ts`) — sem store mock na feature; lookups reais via `useChartOfAccountOptionsQuery`/`useCostCenterOptionsQuery`/`useActiveCustomersQuery`/`useActiveSuppliersQuery`/`useBankAccountOptionsQuery`/`usePaymentMethodOptionsQuery` (**2026-08-07**). **Status vem do backend** (`entry.status`, nunca recalculado no cliente — `FinancialEntryStatusBadge` só formata). **Lista** (`FinancialEntryListPage`): tabs **Ativos**/**Excluídos** (`FinancialEntryListTabs`) + `PageHeader` + CTAs Transferências/`Dialog` + Novo; `ListPagePanel` + toolbar (`SearchInput`, filtro com badge, ordenação `Menu`) + `DataTable` 1-based (`categoryLabel`/`status` direto da API; **2026-08-07, spec `007-financeiro-ajustes-ui` US2:** coluna "Valor" separada em "Valor original" (`entry.baseAmount`) e "Valor final" (`computeEntryTotal`) — demais colunas inalteradas); `FinancialEntryFiltersDrawer` (`Drawer` MUI + `Checkbox`/`DateRangePicker`, opções reais); `TransferDialog` (`Dialog` MUI; contas via `useBankAccountOptionsQuery`, forma de pagamento via `usePaymentMethodOptionsQuery` (**2026-08-07**, era `FINANCIAL_ENTRY_PAYMENT_METHODS` fixo), centro de custo real; `useCreateBankTransferMutation` grava de verdade em `/v1/bank-transfers` — 2026-08-06). **Form** (`FinancialEntryFormView`, layout full-bleed `m: -3`): `EntityFormHeader` + `ScrollArea` + seções — Financeiro (`RadioGroup`, `CurrencyInput`, `Select` conta bancária real, `DatePicker`) · **Pagamentos** (linhas dinâmicas; **2026-08-07, spec `007-financeiro-ajustes-ui` US3:** os 3 campos Data/Forma de pagamento/Valor têm label acima do campo, no mesmo padrão visual — antes só Valor tinha (FR-005); forma de pagamento via `usePaymentMethodOptionsQuery` (cadastro real de `/configuracoes/formas-pagamento`, não mais `FINANCIAL_ENTRY_PAYMENT_METHODS`); **2026-08-09, spec `007-financeiro-ajustes-ui` US9:** o campo Bandeira ganha label ("Bandeira", mesmo padrão dos outros 3) e vira `Select` fechado sobre `CARD_BRAND_OPTIONS` (`card-contracts/data/card-brands.ts`, catálogo compartilhado com `sales-orders`/contratos de cartão — ampliado nesta US com Sorocred/Credicard/Ticket/VR Benefícios/Banricompras) — deixou de ser `Autocomplete freeSolo` com sugestões dinâmicas; `hooks/use-card-brand-suggestions.ts` (`useCardBrandSuggestionsQuery`) **removido**, sem outro consumidor; um pagamento com valor histórico fora do catálogo continua exibido (opção extra "(valor histórico)" injetada só para aquele registro, não altera a lista de opções válidas para escolha nova)) · Cliente/fornecedor (`Autocomplete` combinado, real) · Categoria & anexos (rateio categoria+centro de custo **obrigatório**, bloqueia salvar se a soma não fechar com o total — 422 do backend também mapeado; anexos reais via `FinancialEntryAttachmentUpload` — PDF/imagem até 5MB, upload só depois do lançamento existir, `syncAttachments` no `handleSave`, molde `syncImage` de `products`). `readOnly` (lançamento gerado por venda, FR-016): todos os campos desabilitados + `Alert`, sem rodapé de salvar. Rodapé `EntityFormFooter` mode dirty com `isSaving`. `services/financial-entry.service.ts` e `data/mock-financial-entries.ts` **removidos**. ⚠️ **`FINANCIAL_ENTRY_PAYMENT_METHODS`/`FINANCIAL_ENTRY_PAYMENT_METHOD_LABELS`** (`types/financial-entry.ts`) **não foram removidos** — continuam como fallback de rótulo para lançamentos antigos cujo `paymentMethodId` ainda guarda um dos 7 valores do enum histórico em vez de um `PaymentMethod.id` real (`resolvePaymentMethodLabel` em `lib/financial-entry-format.ts`, consumida pelo Extrato); nunca mais alimentam um select. **2026-08-06 (motor de recebíveis):** `types/financial-entry.ts` ganha `grossAmount`/`acquirerFee` (reais, `null` fora do motor)/`installmentSequence`/`installmentCount`/`cardSettlementFallback`; seção Financeiro (`financial-entry-financial-section.tsx`, novo tipo exportado `FinancialEntryCardSettlementInfo`, prop `cardSettlement` opcional) mostra um bloco Bruto/Taxa/Líquido quando presentes, e badge `SemanticBadge` tom `warning` ("Gerado sem contrato de cartão aplicável") quando `cardSettlementFallback`; mesmo badge (texto "Sem contrato aplicável") na linha da lista (`financial-entry-list-table.tsx`). `financial-entry-edit-page.tsx` monta o objeto a partir do `entry` carregado — `financial-entry-create-page.tsx` não passa nada (lançamento manual nunca tem esses campos).

**`features/facilita-nfe` — Facilita NFE** (2026-08-10, `/financas/facilita-nfe`, spec
`009-facilita-nfe-screen`, **primeiro consumidor de `services/fiscal-api` neste app**).
**UI MUI**. 3 abas do mockup (`facilita-nfe-tabs.tsx`), mas **só "Emitido" tem dado
real** — "Recebido" e "Histórico de Envios" renderizam `facilita-nfe-placeholder-tab.tsx`
(cards zerados, busca/filtro desabilitados, "Sem dados no momento", zero chamada de
rede), decisão explícita registrada em `spec.md` `## Clarifications` da feature: as duas
abas e as ações "Agendar envio"/"Enviar por e-mail" dependem de backend que não existe
ainda (manifestação do destinatário; envio de e-mail/agendamento). **Aba "Emitido"**
(`facilita-nfe-issued-tab.tsx`): `GET /v1/fiscal-documents` (busca — parâmetro `search`
novo nesta feature, casa contra `number`/`series` — e paginação **100% backend-driven**,
Constitution Princípio II) + `GET /v1/fiscal-documents/summary` (endpoint novo desta
feature: cards Total/Autorizadas/Canceladas; "Manifestações finais"/"Não manifestadas"
não têm equivalente no domínio de documento emitido — sempre renderizados zerados com
`Tooltip`, sem chamada de API). **Proxy novo**: `app/api/proxy/fiscal/[...path]/route.ts`
(molde `app/api/proxy/comercio/`, mas sem headers de escopo `X-Organization-Id`/
`X-Branch-Id` — a `fiscal-api` isola por `companyId` explícito, não por header) +
`lib/api/fiscal-client.ts` (`fiscalFetch`, molde `comercio-client.ts`). **Resolução de
`companyId`**: `hooks/use-fiscal-company.ts` — `GET /v1/organizations/current` (CNPJ da
organização ativa, reaproveita `company-settings/api/organization-current.service.ts`) →
`GET /v1/companies?cnpj=` na `fiscal-api` (`Company.id`); sem `Company` cadastrado para o
CNPJ, a aba mostra "Emitente fiscal não configurado" em vez de tabela vazia. **2026-08-15 (spec
erp/025, P2):** `useFiscalCompany()` passa a expor também `defaultEnvironment`
(`"HOMOLOGATION" | "PRODUCTION" | null` — `null` enquanto não carregado, nunca um fallback
implícito aqui; quem consome decide o fallback conservador) lido de `Company.defaultEnvironment`
na resposta de `findFiscalCompanyByCnpjApi`; primeiro consumidor é `nfse-issuance-page.tsx` (selo
de ambiente real + bloqueio de Emitir em PRODUCTION, ver `features/nfse-issuance` acima). Estrutura:
`api/` (dto+mapper+service) · `hooks/` (`use-fiscal-company`, `use-facilita-nfe-list`
molde `use-bank-account-list.ts`, `use-facilita-nfe-summary`) · `components/` ·
`pages/facilita-nfe-page.tsx`. ⚠️ **Sem testes automatizados** — achado na implementação:
`apps/erp/web` não tem nenhum harness de teste frontend hoje (zero `vitest.config`, zero
`@testing-library/*`, zero arquivo `.test.ts(x)` em todo o pacote); instalar esse harness
é uma decisão de escopo do pacote inteiro, fora desta feature — reportado, não assumido
silenciosamente. `GUIA.md` cobre só o que existe (aba "Emitido").

**`features/fiscal-certificate` — Certificado Digital A1 (tela Fiscal)** (2026-08-12,
`/configuracoes/fiscal`, spec `erp/010-fiscal-certificate-screen`, **segundo consumidor de
`services/fiscal-api`** neste app). **UI MUI**. Substitui o `PlaceholderPage` de
`/configuracoes/fiscal`. Cadastro e acompanhamento do certificado A1 (.pfx/.p12) do Emitente,
com **provisionamento automático do Emitente** a partir da **filial matriz** (`GET /v1/branches`,
`isHeadquarters:true`) quando ele não existe. Estrutura: `api/` (dto+mapper+service) · `hooks/`
(`use-fiscal-certificates` lista+status, `use-upload-certificate` provisiona+envia) · `lib/`
(`ibge-lookup` tabela estática city+UF→código IBGE — a filial **não** tem o campo e o CEP
lookup BrasilAPI v1 **não** devolve IBGE; `regime-map` MEI/ISENTO→bloqueia; `error-translate`;
`build-provision-payload`; `select-current` vigente=VALID mais recente) · `components/`
(`certificate-dropzone`, `upload-modal`, `current-certificate-card`, `history-table`
somente-leitura, `empty-state`, `certificate-status-badge`) · `pages/`. Reusa
`useFiscalCompany` de `facilita-nfe` (resolve `companyId` por CNPJ; não duplicado) e o proxy
`/api/proxy/fiscal`. **`fiscalUpload`** novo em `lib/api/fiscal-client.ts` (multipart sem
`Content-Type` manual — `fiscalFetch` força `application/json` e apagaria o boundary; espelha
`comercioUpload`). Estados de tela: Loading / **StoreNotEnabled** (`platformStoreId` nulo →
avisa, sem upload) / Empty / WithCurrent (card do vigente com badges "vence em breve"≤30d /
"vencido" + histórico). A senha do certificado vive só no estado do modal e é descartada após
o envio (nunca em cache/URL/storage). ⚠️ **Sem testes automatizados de frontend** (o pacote
não tem harness — decisão registrada; só o backend, o presenter, foi testado). Riscos e
decisões em `specs/erp/010-fiscal-certificate-screen/research.md` (D0–D6). Removeu a seção mock
"Certificado digital (NF-e)" de `company-settings/components/company-usage-tab.tsx` (substituída
por atalho para `/configuracoes/fiscal`) e o componente `company-certificate-field.tsx`.
**2026-08-13 (spec `erp/011`):** `/configuracoes/fiscal` passou a ser uma **página de abas**
(`app/(app)/configuracoes/fiscal/fiscal-tabs.tsx`, aba ativa na URL via `?aba=`,
`useSearchParams`+`router.replace`, `PageHeader` único no container). `FiscalCertificatePage` virou
**`FiscalCertificateTab`** (sem `PageHeader` próprio). **2026-08-13 (spec `erp/012`):** terceira aba
`geral` (`?aba=geral`) — Configurações gerais (`features/fiscal-settings`). **2026-08-13 (spec erp/014):**
aba `padroes` (`?aba=padroes`) — Padrões fiscais (`features/fiscal-default-taxes`). Abas atuais:
`certificado` · `geral` · `pdv` · `padroes` · `series`. `handleChange` chama `confirmDiscardIfDirty()`
(guarda de alterações não salvas das abas com formulário).

**`features/pos-fiscal-document-type` — Tipo de NF emitida pelo PDV (aba pdv)** (2026-08-13,
`/configuracoes/fiscal?aba=pdv`, spec `erp/013`). **UI MUI**. 4ª aba. Escolhe o modelo que o PDV
emite (Modelo 55 - NF-e / Modelo 65 - NFC-e / não configurado) via `comercioFetch` (erp-api
`GET/PUT /v1/pos-fiscal-settings`, `{data}`). **Bloqueia salvar Modelo 65 sem CSC** — lê
`cscConfigured` do Emitente por `getFiscalCompanyByIdApi` (fiscal-api, via `useFiscalCompany`) e
mostra Alerta com link para `?aba=geral`. **Avisa (não bloqueia)** quando não há certificado A1
`VALID` (reusa `listCertificatesApi`). Aviso legal Lei 8.846. Toggle "ICMS consumidor final"
**desabilitado** (DIFAL inexistente — backlog). Guarda de alterações não salvas reusa
`fiscal-settings/lib/unsaved-guard` (fonte `"pos-fiscal"`). ⚠️ **A emissão em si (consumo no app
do PDV) é entrega própria/deferida** — o PDV é Flutter (`apps/pdv/app`)/legado; esta feature só
configura. Sem testes de front (D0); backend (erp-api) testado (4 specs). Estrutura: `api/`
(dto+service) · `hooks/use-pos-fiscal-type` · `components/` · `GUIA.md`.

**`features/fiscal-settings` — Configurações Gerais Fiscais (aba geral)** (2026-08-13,
`/configuracoes/fiscal?aba=geral`, spec `erp/012`, consome `services/fiscal-api`). **UI MUI**.
Edita dados do Emitente via `PATCH /v1/companies/{id}` (regime/CRT com `REGIME_OPTIONS`, IE, IM,
ambiente, autXML=`accountingOfficeDocument`, `nationalNfseEnabled`, e desde **2026-08-14 (spec
erp/023, N6)** as duas **Justificativas padrão** — inutilização/cancelamento, `Input` multiline,
validação de 15–255 caracteres no cliente espelhando o `CompanyZodValidator` da fiscal-api, Salvar
bloqueado se algum dos dois campos estiver fora da faixa) num único Salvar, e o **CSC**
(`csc-section.tsx`) via `PUT /v1/companies/{id}/csc` — **write-only**: mostra só
`cscConfigured`, token vive só no estado do form, nunca em cache/URL/log. Mudar p/ Produção pede
confirmação (`ConfirmationDialog`). **Remover CSC** (2026-08-14, spec erp/024, Parte B): botão
"Remover CSC" ao lado de "Substituir", só quando `configured === true`, `DELETE .../csc`
(`useClearCscMutation`/`clearCscApi`) + `ConfirmationDialog` próprio. Bloqueado com 409 pelo proxy
`/api/proxy/fiscal` quando o PDV da organização está em Modelo 65 — mensagem do backend aparece
como toast de negócio (não texto genérico); o diálogo de confirmação não antecipa esse aviso (só
avisa a consequência genérica), pra não alarmar quem não está em Modelo 65. ⚠️ **Justificativas persistidas mas não aplicadas
automaticamente ainda** — não há tela em `erp-web` que chame inutilizar/cancelar documento fiscal
(rotas só existem no backend, chamadas por outros clientes internos); limitação declarada em
`specs/erp/023-fiscal-emissao-e-ux/plan.md`. Campos sem backend renderizados **desabilitados** com
"em breve" (`disabled-soon-sections.tsx` — restam só "Vendas e base de cálculo" e "Outras
configurações", fora de escopo por decisão do usuário no `/speckit-clarify` da 023; backlog nomeado
em `plan.md` D1: identidade→fiscal-api, defaults de emissão→erp-api). Guarda de alterações não salvas: `lib/unsaved-guard.ts`
(`beforeunload` + flag de módulo lido pelo container de abas). Form remontado via `key={updatedAt}`
após salvar. Estrutura: `api/` (dto+service, `{data}`) · `hooks/use-fiscal-settings` (query +
mutations) · `lib/` · `components/` · `GUIA.md`. Resolve `companyId` por `useFiscalCompany`. Sem
testes de frontend (D0); backend do contrato de update coberto por teste (fiscal-api).

**`features/fiscal-invoice-series` — Séries de Nota Fiscal (aba Séries)** (2026-08-13,
`/configuracoes/fiscal?aba=series`, spec `erp/011`, consome `services/fiscal-api` módulo
`fiscal-sequences`). **UI MUI**. Lista as séries do Emitente com **filtro de ambiente**
(`ToggleButtonGroup` Homologação/Produção — numeração independente por ambiente; padrão
Homologação, simplificação do `defaultEnvironment` já que a plataforma opera em homologação),
criar série (`SeriesFormDialog`: tipo NF-e/NFC-e/NFS-e via rótulo de domínio, série 1–3 dígitos,
número inicial), **ajustar número** (`EditNumberDialog`, só aumento + confirmação; reduzir bloqueado
client+API), **desativar** (`ConfirmationDialog` avisando que bloqueia emissão) / reativar, **excluir**
(`RowActionsMenu` `confirmDelete`, só com número 0 — senão item desabilitado com caption). Estrutura:
`api/` (dto+service `fiscalFetch`, resposta `{data}`) · `hooks/` (`use-fiscal-sequences`,
`use-sequence-mutations`, `query-keys`) · `lib/labels.ts` · `components/` · `GUIA.md`. Resolve
`companyId` por `useFiscalCompany`; `isCompanyMissing` → aviso para configurar o certificado primeiro.
Erros da API (duplicidade, redução, série em uso) já vêm com mensagem de negócio → `toast`. **Sem
testes de frontend** (sem harness — D0).

**`features/fiscal-groups` — Grupos fiscais unificados** (2026-08-14, spec erp/022, D1/D2/D3).
**UI MUI**. Substitui as 4 telas de **lista** separadas por uma só, em
`/(app)/configuracoes/fiscal/grupos` (`FiscalGroupsPage`, envolta em `FiscalScrollablePage`),
com abas por tributo na URL (`?tributo=icms|ipi|pis_cofins|issqn`, molde `fiscal-additional-info`).
As 4 rotas antigas (`/grupos-icms`, `/grupos-ipi`, `/grupos-pis-cofins`, `/grupos-issqn`) viram
`redirect()` para a aba certa daqui — link salvo não quebra. **Cadastrar e editar continuam
nos 4 formulários já existentes** (`IcmsGroupFormView` etc., rotas `/novo` e `/[id]` inalteradas
de cada feature abaixo) — esta feature só entrega a casca de lista/navegação/exclusão, sem
duplicar a lógica de formulário. **Listagem rica** (D2): nome, situação tributária (CST/CSOSN/
exigibilidade conforme o tributo — `lib/tributo-options.ts` resolve o rótulo humano a partir do
código cru), alíquota (`null`/"—" no ICMS, que não tem alíquota única — vive na matriz por UF) e
**quantidade de produtos vinculados**, vinda pronta do backend (`GET /v1/fiscal-groups?taxType=`,
presenter `toHttpRichList`) — sem N+1 no cliente. **Excluir** (D3): `DELETE /v1/fiscal-{tributo}-
groups/:id` (novo em cada um dos 4 controllers do `fiscal-defaults` da erp-api, mesmo
`DeleteFiscalGroupUseCase` compartilhado) — 409 se o grupo tem produto vinculado **ou** é o padrão
fiscal da organização (`FiscalGroupInUseError`, mensagem nomeia o motivo). Estrutura: `api/` (dto +
service, prefixo de rota por tributo) · `hooks/use-fiscal-groups.ts` (query rica + mutation de
exclusão, toast no próprio hook — molde `financial-groups`) · `lib/tributo-options.ts` (rótulos +
rota herdada por tributo) · `pages/fiscal-groups-page.tsx` · `GUIA.md`. Sem testes de frontend (D0
do Menu Fiscal); backend testado (6 casos novos do `DeleteFiscalGroupUseCase`, 54/54 verdes no
módulo `fiscal-defaults`).

**2026-08-14 (spec erp/023, N3/N4) — scroll nos formulários + `rateLabel` nullish.** A spec 022
aplicou `FiscalScrollablePage` na lista unificada, mas não nos 8 formulários herdados
(`/novo`+`/[id]` de cada um dos 4 tributos, abaixo) — ficaram de fora porque eram os únicos que
sobraram das telas antigas, e são justamente os mais longos (matriz de 27 UFs do ICMS cortava
588px em 1366×768). Corrigido nas 4 features abaixo (`icms/ipi/issqn/pis-cofins-group`), todas as
branches (loading/erro/não-encontrado/sucesso). `lib/tributo-options.ts`: `rateLabel`/
`taxSituationLabel` passam a checar `== null` (cobre `undefined`, não só `null`) — o `undefined%`
visto em produção vinha do campo nem existir na resposta antes do deploy da erp-api (N2), não de um
`null` legítimo (que continua existindo — ICMS não tem alíquota única).

**`features/fiscal-icms-group` — Grupos de ICMS** (2026-08-13, spec erp/016, consome **erp-api** via
`comercioFetch`; **resolve B1**). **UI MUI**. **Cadastro em rota própria** sob o leaf `fiscal` (D3):
`/(app)/configuracoes/fiscal/grupos-icms` (**lista superseded por `features/fiscal-groups`, spec
erp/022 — rota vira `redirect()`**) + `/novo` + `/[id]` (inalterados, ainda os formulários reais).
Lista com estado vazio ("Novo
grupo ICMS") → `GET /v1/fiscal-icms-groups`. **Formulário** (`IcmsGroupFormView`, abas Configuração +
Produtos): **Situação do ICMS** via `Select` filtrado pelo regime (`icmsSituacaoOptions` — Regime Normal
CST 00, Simples CSOSN 102/103/300/400; o resto desabilitado com o motivo) → grava `icmsCst` **ou**
`icmsCsosn`; **2 matrizes de 27 UFs** (`UfRateMatrix`: ICMS interno pré-preenchido por UF via
`UF_INTERNAL_DEFAULTS` + interestadual em 0) com alternância **valor único / valores personalizados**
(o valor único reflete nas 27 UFs ao ativar o personalizado); **aviso do limite no Simples** (CSOSN sem
alíquota → matriz sem efeito). Barra de estado sujo (dirty por serialização, sem effect) +
`useUnsavedChangesGuard("icms-group")`. Aba **Produtos** somente-leitura, desabilitada até salvar.
`POST`/`PUT` `store.catalog.manage`. Reusa `useEmitterRegime` de `fiscal-pis-cofins-group`. Estrutura:
`api/` · `hooks/` · `lib/icms-options` (27 UFs + defaults + situação por regime) · `components/`
(`uf-rate-matrix` + form) · `pages/` · `GUIA.md`. Entrada pela aba **Padrões fiscais** ("Gerenciar grupos
de ICMS →"). Sem testes de front (D0); backend (erp-api + fiscal-api builder) testado. ⚠️ Emissão real no
PDV = B7 (deferida).

**`features/fiscal-additional-info` — Informações adicionais da nota** (2026-08-13, spec erp/017,
consome **erp-api** via `comercioFetch`). **UI MUI**. **Rota própria** sob o leaf `fiscal` (D3):
`/(app)/configuracoes/fiscal/informacoes-adicionais`, com **abas por tipo de documento na URL**
(`?tipo=NFE|NFCE|NFSE`, `useSearchParams` + `router.replace`, molde `fiscal-tabs`) + busca por
nome/texto (client-side) + **Dialog** criar/editar (`FiscalAdditionalInfoFormDialog`, `formKey`
remonta o corpo — sem `setState` em effect; `formKey` via `useRef` monotônico, **não** `Date.now()`
que o lint `react-hooks/purity` bloqueia). Campos: Nome, Descrição (`multiline`, contador +
`maxLength` do XSD por destino), **Destino** (`RadioGroup` `INF_CPL`/`INF_AD_FISCO` — **`INF_AD_FISCO`
desabilitado com o motivo na aba NFS-e**, plan D10) — **sem** toggle "automático" (D5). `documentType`
fixado pela aba (imutável). Lista em `@mui/material/Table` + `RowActionsMenu` (Editar/Excluir com
`confirmDelete`). `GET/POST/PUT/DELETE /v1/fiscal-additional-infos` (`{data}`; `org.view` leitura,
`store.catalog.manage` escrita). Estrutura: `api/` (dto+service) · `hooks/` (queries/mutations
escopadas por `useCatalogScope` + query-keys) · `lib/document-type-options` (rótulos, destinos,
tetos por campo) · `components/` · `pages/` · `GUIA.md`. Entrada pela aba **Padrões fiscais**
("Gerenciar informações adicionais →"). Sem testes de front (D0); backend (erp-api + fiscal-api
builder) testado. ⚠️ Emissão real no PDV = B7 (deferida).

**`features/fiscal-issqn-group` — Grupos de ISSQN** (2026-08-13, spec erp/018, consome **erp-api**
via `comercioFetch`). **UI MUI**. **Rota própria** sob o leaf `fiscal`: `/(app)/configuracoes/fiscal/
grupos-issqn` (lista) + `/novo` + `/[id]` (molde 015/016). Form de seção única "Informações Gerais":
Nome, Código municipal (`NN.NN`), cTribNac (6 díg.), Alíquota do ISS (aviso "só transmitida com
retenção") e Exigibilidade (`Select` sobre `ISSQN_TRIB_TYPE_OPTIONS` — 1/2/4; **3 Exportação
desabilitado com o motivo**). Estado sujo por serialização (sem effect) + `useUnsavedChangesGuard`.
`GET/POST/PUT /v1/fiscal-issqn-groups`. Estrutura: `api/` · `hooks/` · `lib/issqn-options` ·
`components/` (form) · `pages/` · `GUIA.md`. Entrada pela aba **Padrões fiscais** ("Gerenciar grupos
de ISSQN →"). Sem testes de front (D0); backend testado.

**`features/fiscal-ipi-group` — Grupos do IPI** (2026-08-13, spec erp/019, consome **erp-api**
via `comercioFetch`). **UI MUI**. **Rota própria** sob o leaf `fiscal` (molde 016/018):
`/(app)/configuracoes/fiscal/grupos-ipi` (lista) + `/novo` + `/[id]`. Lista com estado vazio
("Novo Grupo IPI") → `GET /v1/fiscal-ipi-groups`. **Formulário** (`IpiGroupFormView`, abas
**Configuração** + **Produtos**): Nome, **Grupo tributário de IPI** (`Select` sobre `IPI_CST_OPTIONS`
— só CSTs de saída 50/51/52/53/54/55/99), **Grupo de Enquadramento Legal** (`Select` sobre
`IPI_ENQUADRAMENTO_OPTIONS`, espelho curado da tabela `cEnq` da erp-api) e **Percentual (%)
CONDICIONAL** — renderiza só p/ CST tributado (50/99, `isIpiCstTributado` derivado no render, sem
effect); ao salvar, `ipiRate: showRate ? rate : null` (CST não tributado nunca vaza percentual).
Estado sujo por serialização (sem effect) + `useUnsavedChangesGuard("ipi-group")`. Aba **Produtos**
somente-leitura (`GET .../:id/products`), desabilitada até salvar. Edit page usa `key={group.id}`
(remonta o form ao trocar de grupo). `POST`/`PUT` `store.catalog.manage`. Estrutura: `api/`
(dto+service) · `hooks/use-ipi-groups` (queries/mutations escopadas por `useCatalogScope`) ·
`lib/ipi-options` (CST + cEnq + `isIpiCstTributado`) · `components/` · `pages/` · `GUIA.md`. Entrada
pela aba **Padrões fiscais** ("Gerenciar grupos de IPI →"). Sem testes de front (D0); backend
(erp-api + fiscal-api builder) testado. ⚠️ Emissão real no PDV = B7 (deferida).

**`features/nfse-issuance` — Emitir NFS-e** (2026-08-13, spec erp/018, **primeira tela que transmite
NFS-e pelo ERP**; consome **erp-api** `v1/nfse-issuances`). **UI MUI**. Tela em **Vendas › FISCAL**
(`/vendas/nfse`, novo leaf `vendas-nfse` em `navigation.ts`, ícone `receipt`). Fluxo: escolher
**tomador** (`Autocomplete` sobre `useActiveCustomersQuery`; ⚠️ o model `Customer` do erp-web **não**
carrega documento/tipo de pessoa — busca o detalhe cru `/v1/customers/:id` via `getCustomerFiscalInfoApi`
para montar `documentType`/`document`; avisa se o cliente não tem CPF/CNPJ) → **Grupo de ISSQN**
(`Select`, mostra código/cTribNac/exigibilidade/alíquota resolvidos) → descrição + valor
(`CurrencyInput`) + **retenção** (`Switch`, aviso "alíquota só transmitida com retenção") → **Emitir**
(`ConfirmationDialog`, selo do **ambiente real do Emitente** — ver 2026-08-15 abaixo). Guarda de
Emitente via `useFiscalCompany` (isCompanyMissing → avisa e leva a `/configuracoes/fiscal`).
`externalReference` gerado por tentativa (`crypto.randomUUID`
no handler, não no render). Erros do órgão (E0116/E0310/E0625) já vêm traduzidos do backend → toast.
Estrutura: `api/` (dto+service) · `hooks/` (list + emit mutation + customer-fiscal) · `pages/` · `GUIA.md`.
Sem testes de front (D0); backend (erp-api + fiscal-api) testado. ⚠️ Ancoragem em Vendas/OS e produção
fora de escopo; pré-requisito operacional de produção = IM no CNC (E0116).

**2026-08-15 (spec erp/025, P2) — selo de ambiente real + bloqueio de PRODUCTION.** O selo fixo
"HOMOLOGAÇÃO" some — `environment = fiscalCompany.defaultEnvironment` (novo campo exposto por
`useFiscalCompany`, ver `features/facilita-nfe` abaixo) reflete o ambiente real configurado em
Configurações gerais do Emitente. Quando `environment === "PRODUCTION"`, a tela mostra um `Alert`
de erro com atalho "Ajustar ambiente" (`/configuracoes/fiscal?aba=geral`) e **desabilita o botão
Emitir** — a plataforma só sustenta emissão real em homologação nesta fase (o `IssueNfseUseCase` já
recusava no backend; o bloqueio de UI evita o usuário só descobrir isso no 422). Quando não há
nenhum Grupo de ISSQN cadastrado, o `Select` é substituído por um `EmptyState` (`@citybox/mui`) com
botão "Cadastrar Grupo de ISSQN" → `/configuracoes/fiscal/grupos?tributo=issqn`, em vez de um select
vazio sem contexto.

**`features/nfe-issuance` — Emitir NF-e** (2026-08-15, spec erp/026, consome **erp-api**
`v1/nfe-issuances`, novo). **UI MUI**. Tela em **Vendas › FISCAL** (`/vendas/nfe`, deixa de ser
placeholder desabilitado). Diferente de `nfse-issuance`, **não** é avulsa — parte de um **pedido de
venda fechado** já existente: escolher (`Autocomplete` sobre `GET /v1/sale-orders?statuses=closed`,
`useEligibleSaleOrdersQuery`, debounce 400ms embutido no hook — achado do react-review: `staleTime`
sozinho não evita 1 requisição por tecla, o debounce real precisa de `useState`+`useEffect`, molde
`useBankAccountList`) → **prévia** (`GET /v1/nfe-issuances/preview`, `useNfePreviewQuery`) mostra os
itens do pedido com o valor de cada um e, por item/tributo (ICMS/PIS-COFINS/IPI), um `Chip` de aviso
quando aquele tributo vai sair com valor de **fallback** (produto sem grupo fiscal configurado) —
**não bloqueia a emissão** (decisão do clarify da spec: "emitir com fallback explícito e visível").
CPF/CNPJ do tomador resolvido pelo `customerId` do pedido, reusando
`useCustomerFiscalInfoQuery`/`getCustomerFiscalInfoApi` de `features/nfse-issuance` (mesmo padrão,
sem duplicar); pedido sem cliente identificado é bloqueado com `Alert` explícito, não manda um
`document` vazio pro backend. Mesmo selo de ambiente real do Emitente + bloqueio de emissão em
PRODUCTION que `nfse-issuance` já tem (spec 025 P2). `FiscalScrollablePage` desde a criação — não
repete o gap que `nfse-issuance` teve (criada sem o wrapper na spec 018, corrigida só na 022).
Estrutura: `api/` (dto+service: `listEligibleSaleOrdersApi`/`previewNfeIssuanceApi`/`issueNfeApi`) ·
`hooks/` · `pages/nfe-issuance-page.tsx` · `GUIA.md`. Sem testes de frontend (D0); backend (erp-api
`modules/nfe-issuance` + fiscal-api `POST /v1/nfe` estendido) testado. ⚠️ **Limitação conhecida**: a
tela usa CFOP/natureza de operação/forma de pagamento fixos por decisão de escopo — `SaleOrder` não
modela esses campos em vocabulário de NF-e ainda (ver `apps/erp/api/AGENTS.md`, módulo
`nfe-issuance`).

**`features/fiscal-pis-cofins-group` — Grupos de PIS/COFINS** (2026-08-13, spec erp/015,
consome **erp-api** via `comercioFetch`). **UI MUI**. **Cadastro em rota própria** sob o leaf
`fiscal` (decisão plan D3, que 016/019 herdam), **não** aba: `/(app)/configuracoes/fiscal/
grupos-pis-cofins` (lista) + `/novo` + `/[id]`. Lista com estado vazio ("Novo Grupo PIS/COFINS") →
`GET /v1/fiscal-pis-cofins-groups`. **Formulário** (`PisCofinsGroupFormView`, abas Configuração +
Produtos): Situação PIS/COFINS via `Select` MUI (CST fora do conjunto suportado — 03/49 —
desabilitado com o motivo, de `lib/pis-cofins-options.ts`), **alíquotas condicionais** ao CST
(só tributado 01/02), **espelhamento** PIS→COFINS ao escolher (situação copiada; alíquotas
pré-preenchidas), **aviso de divergência** de faixa (tributado × NT — não bloqueia), **pré-preenchimento
por regime** do Emitente (`useEmitterRegime` → `getFiscalCompanyByIdApi.taxRegime`: Presumido 0,65/3,00;
Real 1,65/7,60), barra de estado sujo + `useUnsavedChangesGuard("pis-cofins-group")`. Aba **Produtos**
somente-leitura (`GET .../:id/products`), desabilitada até salvar. `POST`/`PUT` `store.catalog.manage`.
Estrutura: `api/` (dto+service) · `hooks/` (queries/mutations escopadas + `use-emitter-regime`) · `lib/`
· `components/` · `pages/` · `GUIA.md`. Entrada pela aba **Padrões fiscais** ("Gerenciar grupos de
PIS/COFINS →"). Sem testes de front (D0); backend (erp-api + fiscal-api builder) testado. ⚠️ Emissão
real no PDV é B7 (deferida).

**`features/fiscal-default-taxes` — Padrões Fiscais (aba padroes)** (2026-08-13,
`/configuracoes/fiscal?aba=padroes`, spec erp/014, consome **erp-api** via `comercioFetch`). **UI MUI**.
5ª aba da tela Fiscal. Define o **padrão fiscal da organização**: grupo padrão por tributo
(ICMS/IPI/PIS_COFINS/ISSQN — `SelectField` sobre `GET /v1/fiscal-groups`) + CFOP padrão
(`FiscalSelectField` sobre `CFOP_OPTIONS` de `fiscal-parameters/data/fiscal-options.ts`), gravados num
único Salvar em `PUT /v1/fiscal-default-taxes` (`{data}`, `store.catalog.manage`). **Estado vazio por
tributo** quando não há grupo cadastrado ("Nenhum grupo de X cadastrado ainda"). Guarda de alterações
não salvas reusa `fiscal-settings/lib/unsaved-guard` (fonte `"fiscal-defaults"`); form remontado via
`key={updatedAt}`. Estrutura: `api/` (dto+service) · `hooks/use-fiscal-default-taxes` (queries de grupos
+ padrão + mutation; `fiscalGroupsKey` compartilhado com a herança em `fiscal-parameters`) · `components/`
(tab + `fiscal-default-taxes-hub.tsx`) · `GUIA.md`. ⚠️ **Grupos são só leitura** nesta entrega (cadastro real =
`features/fiscal-groups` + os 4 formulários por tributo). ⚠️ **A emissão não consome os padrões** — a herança é
exibição em `fiscal-parameters` (limitação declarada). Sem testes de frontend (D0); backend (erp-api) testado.

**2026-08-14 (spec erp/022, D4) — hub de cards.** `fiscal-default-taxes-form.tsx` (lista plana de 4
selects) virou `fiscal-default-taxes-hub.tsx`: um `Card` MUI por tributo (ícone + nº de grupos
cadastrados + o mesmo `SelectField` de escolha do padrão, agora dentro do card + botão "Gerenciar
grupos de X" → `/configuracoes/fiscal/grupos?tributo=X`), grid responsivo 2 colunas (1 em mobile).
CFOP padrão + links de Informações adicionais/Naturezas de operação continuam abaixo dos cards,
mesmo comportamento (não são grupo, não entram nos cards). O arquivo antigo (`fiscal-default-taxes-
form.tsx`) foi removido — `fiscal-default-taxes-tab.tsx` é o único import do hub, e o formulário
propriamente dito (estado/mutation/guard) não mudou, só a moldura visual.

**2026-08-14 (spec erp/023, N7) — "Outros cadastros fiscais" também vira cards.** Achado do
re-teste: os 2 links de texto cru ("Informações adicionais da nota →", "Naturezas de operação →")
destoavam dos 4 cards de tributo já redesenhados. Substituídos por 2 `OtherFiscalCard` (componente
local novo, mesmo grid dos cards de tributo) com **contagem real** — nunca placeholder: "Informações
adicionais" usa o endpoint novo `GET /v1/fiscal-additional-infos/count` (`useFiscalAdditionalInfoCountsQuery`,
`erp-api` fiscal-additional-info) e "Naturezas de operação" reusa `useOperationNaturesQuery().length`
(sem endpoint novo — já lista tudo sem paginação). Estado vazio explica pra que o cadastro serve, em
vez de um link sem contexto; botão "Gerenciar X" no mesmo estilo dos cards de tributo.

**`features/fiscal-operation-natures` — Naturezas de Operação** (2026-08-13, spec erp/020,
consome **erp-api** via `comercioFetch`; **última feature do Menu Fiscal, 11/11**). **UI MUI**.
**Rota própria** sob o leaf `fiscal` (molde 016/018/019): `/(app)/configuracoes/fiscal/
naturezas-operacao` (lista) + `/novo` + `/[id]`. Regra de-para: dada uma operação de **entrada**,
determina o **CFOP e os grupos fiscais** da **saída** correspondente (caso canônico: devolução de
mercadoria para fornecedor). **Formulário** (`OperationNatureFormView`, seção única — não abas):
Nome + Descrição (≤300) + checkbox **"Manter Código de Benefício Fiscal na UF"** sempre
**desabilitado com o motivo** (depende de `cBenef` por UF, fora de escopo) + **3 blocos de-para com
linhas adicionáveis/removíveis** — CFOP (`De` só CFOP de entrada / `Para` só CFOP de saída, via
`lib/cfop-options.ts`, espelho da tabela estática da erp-api + condição **ICMS Livre**
`AMBOS`/`SIM`/`NAO`), Grupo de ICMS e Grupo de PIS/COFINS (`De`/`Para` sobre `useFiscalGroupsQuery`
de `fiscal-default-taxes`, filtrado por `taxType` no cliente — reuso, sem duplicar query). Cada
linha tem uma `key` de UI só local (`stripKey` remove antes de enviar ao backend); estado inicial
via `useState(() => initialState(nature))` — **lazy**, não valor plano, porque `initialState` chama
o contador de chave de linha (achado react-review: valor plano reinvocaria a cada render). Estado
sujo por serialização (sem effect) + `useUnsavedChangesGuard("operation-nature")`. Edit page usa
`key={nature.id}` (remonta o form ao trocar de natureza, padrão dos irmãos). `POST`/`PUT`
`store.catalog.manage`; leitura `org.view`. Estrutura: `api/` (dto+service) · `hooks/
use-operation-natures` (queries/mutations escopadas por `useCatalogScope`) · `lib/cfop-options`
(CFOPs entrada/saída + condição ICMS Livre — espelho de UX, backend revalida) · `components/`
(form) · `pages/` · `GUIA.md`. Entrada pela aba **Padrões fiscais** ("Gerenciar naturezas de
operação →"). Sem testes de front (D0); backend (erp-api módulo `operation-natures`, 36 testes)
testado — resolvedor prova casa-uma/casa-duas com especificidade (SIM/NAO > AMBOS)/não-casa mantém
original sem bloquear/regra de grupo órfã ignorada. ⚠️ **Aplicação real da regra numa emissão de
entrada/devolução é fora de escopo** (a fiscal-api não emite entrada — pré-requisito não
implementado, mesma natureza do B7); esta feature entrega cadastro + resolvedor testados em
isolamento.

**Exclusão** (2026-08-14, spec erp/024, Parte A): `operation-nature-list-page.tsx` ganha coluna
Ações — `RowActionsMenu` (`@/components/ui/list-page`, mesmo import do hub de Grupos fiscais) com
item "Excluir" + `confirmDelete` (aviso de que a exclusão afeta a resolução de emissões futuras).
O nome deixou de ser *stretched-link* (cobria a linha inteira) — virou link só no texto, pra não
colidir com o clique do menu de ações. Novo `useDeleteOperationNatureMutation()` (hook) e
`deleteOperationNatureApi` (service), `DELETE /v1/operation-natures/:id`. Sem checagem de "em uso"
no backend (ver `apps/erp/api/AGENTS.md`) — hard delete direto. O card de contagem em Padrões
fiscais decrementa sozinho: reusa a mesma query key que a mutation invalida.

**`features/bank-reconciliation` — Conciliação bancária** (`/financas/conciliacao-bancaria` +
`/[id]`, **integrado à `erp-api`**: `spec 006-bank-reconciliation`). **UI MUI**. Importa um extrato
`.ofx` associado a uma conta bancária e concilia (casa) cada transação extraída com um lançamento
financeiro do ERP. **Lista** (`BankStatementListPage`): `ListPageShell` + `PageHeader` (**Importar
extrato**, `statement-import-dialog.tsx`) + `ListPagePanel` + `DataTable`; cada linha mostra
instituição/conta/período/status/contadores. **Detalhe** (`BankStatementDetailPage`,
`statement-header-card.tsx` + `TransactionTabs` Pendentes/Conciliadas/Excluídas): a aba Pendentes tem
um filtro de **Período** (`DateRangePicker`, sobre `postedAt` — rótulo nunca "vencimento", a
transação de extrato não tem esse conceito) + busca por descrição, ambos em
`transaction-list-panel.tsx` (`use-bank-statement-transaction-list.ts`). Cada transação vira um
**cartão** (`transaction-card.tsx`, `Card` MUI — substitui `transaction-row.tsx`, **2026-08-11**,
FR-039): data/descrição/valor (entrada verde, saída vermelho, RN-07), botões reais
Novo Registro/Buscar registro/ícone de excluir, e a sugestão automática embutida
(`match-suggestion-card.tsx`, botão **Conciliar** por candidato) — sem checkbox de seleção em lote
na lista principal. No rodapé da aba Pendentes, `suggested-entries-panel.tsx` (**novo,
2026-08-11, FR-041**) consolida as mesmas sugestões num painel colapsável com ação "Adicionar"
(`useAllSuggestionsQueries`, reaproveita o cache de `useSuggestionsQuery` — sem requisição
duplicada). **Buscar registro** (`manual-match-drawer.tsx`, **reescrito 2026-08-11**): busca
`GET .../eligible-entries` (`search-eligible-entries.use-case`, substitui a antiga chamada direta a
`GET /v1/financial-entries?status=pending`, que causava o bug relatado pelo usuário de só mostrar
lançamentos pendentes) via `use-eligible-entries-search.ts`; filtros completos em
`manual-match-filters.tsx` (Período + tipo de data Competência/Vencimento/Recebimento-Pagamento,
Categoria, Fornecedor — `useActiveCustomersQuery`/`useActiveSuppliersQuery`, um único select
mutuamente exclusivo —, Conta travada/desabilitada, Método de pagamento, Bandeira); resultados em
tabela (`@mui/material/Table`) com **seleção múltipla** via `Set<string>` — cobre busca manual (1
selecionado) e soma de N lançamentos/repasse agrupado (2+ selecionados) no mesmo drawer; o botão
Conciliar fica desabilitado até a soma dos `eligibleAmount` selecionados fechar exatamente com o
valor da transação. **2026-08-14 (3ª comparação CPLUG, spec `006-bank-reconciliation` D18/D20/D21):** três ajustes de
UI/UX no cartão e nos painéis. (1) **"Conciliar" virou o 1º botão da linha de ações**
(`transaction-card.tsx`, ordem final Conciliar → Novo Registro → Buscar registro → Excluir, FR-039):
antes ele só existia dentro de `match-suggestion-card.tsx`. É alimentado pelo `useSuggestionsQuery`
que o cartão **já** consumia — nenhuma requisição nova. ⚠️ O kind positivo da sugestão é **`"exact"`**
(não `"match"`); habilitado só quando há candidato exato. Com **1** candidato concilia direto; com
**vários**, faz `scrollIntoView` + destaque no bloco de candidatos em vez de escolher sozinho
(FR-014). O destaque é limpo em `onPointerEnter`/`onPointerDown` do bloco — sem timer e sem efeito
de limpeza, que vazaria no unmount. "Novo Registro" passou de `contained` para `outlined` (Conciliar
assume a ação primária). (2) **Divergência de valor migrou para o cartão** (FR-031/FR-039, D18):
`match-suggestion-card.tsx` retorna `null` no kind `value_divergence` (renderizar nos dois lugares
duplicaria o aviso) e o cartão mostra `SemanticBadge` tom `warning` com a diferença calculada como
`transaction.amount - candidates[0].openBalance` — rótulo "faltam"/"excedem". (3) **O drawer de busca
perdeu o alerta de divergência**: `manual-match-drawer.tsx` não tem mais o `Alert` "a conciliação
será recusada…" e o rodapé virou totalizador **neutro** (Selecionados / Transação / Diferença, sem
`warning.dark`/`success.main`) — é feedback mecânico para montar a soma exata de FR-017, não
veredito; o botão Conciliar continua `disabled` enquanto a soma não fecha.
**Novo Registro** (`create-entry-from-transaction-drawer.tsx` — **renomeado de `…-dialog.tsx` e
convertido de `Dialog` centralizado para `Drawer` ancorado à direita em 2026-08-14**, FR-040/D21,
mesmo `Drawer` de `@citybox/mui` já usado em `manual-match-drawer.tsx`, `width={640}`; corpo em
`ScrollArea` + rodapé `Stack` no lugar de `DialogContent`/`DialogActions`; símbolos
`CreateEntryFromTransactionDrawer{,Props,Body}`. **Estruturado
2026-08-11 em seções**, FR-040: Transação Financeira/Dados de pagamento/Classificação — os campos
travados da transação (valor/taxas-despesas/multas-juros/total/datas) aparecem como texto somente
leitura dentro das seções, não inputs; **Conta** via `useBankAccountOptionsQuery` (pré-selecionada
com a conta do extrato, mas editável) e Categoria/Centro de custo via
`useChartOfAccountOptionsQuery`/`useCostCenterOptionsQuery` continuam editáveis; sem rateio
múltiplo) e **Excluir** (`ConfirmationDialog`, só em Pendentes — uma transação conciliada precisa de
**Desfazer conciliação** primeiro, botão que aparece na aba Conciliadas). **Spec erp/031 D2 (2026-08-20):** o campo "Cliente ou fornecedor" do drawer deixa de ser `Input` de texto livre — vira o mesmo `Autocomplete` combinado (cliente+fornecedor) de `financial-entry-party-section.tsx` (`listPartyOptions`/`parsePartyValue`, `useSelectableCustomersQuery`/`useActiveSuppliersQuery`), e `CreateEntryFromTransactionInput` ganha `customerId`/`supplierId` (mutuamente exclusivos) repassados ao `POST .../create-entry`, que agora os aceita e valida contra o cadastro. Hooks em
`use-bank-reconciliation-mutations.ts` (`useReconcileTransactionMutation`,
`useCreateEntryFromTransactionMutation`, `useDiscardTransactionMutation`,
`useUndoReconciliationMutation`) + `use-eligible-entries-search.ts` (busca manual/soma — substitui
`use-financial-entry-search.ts`, removido). **2026-08-11 (comparação CPLUG x ERP Citybox,
`/speckit-clarify`):** usuário apontou divergência real de layout (não só de tema) entre as 3 telas
implementadas e os mockups de referência + o bug de busca já citado; motivou o redesenho acima
(cards/tabela/seções/painel) e o novo ramo de backend `research.md` D16 (lançamento `paid` concilia
por vínculo, sem duplicar pagamento). **Fora de escopo ainda:** filtro/busca avançada e download de
extrato (US7, `T100-T106` ainda não implementadas). `GUIA.md` cobre o estado atual.

**`features/chart-of-accounts` — integrado à `erp-api`** (`/v1/chart-of-accounts`). React Query + abas Ativos/Excluídos + restore. Dialog create/edit (nome · grupo financeiro via `useFinancialGroupOptionsQuery` · `availableForPdv`). PUT sempre envia `availableForPdv`. **Lista** (`ChartOfAccountListPage`): `ListPageShell` + tabs + `DataTable` server-side. Mock `data/mock-chart-of-accounts.ts` e `getChartOfAccountById` **removidos** (2026-08-06) — só existiam para sustentar a DRE mock; `financial-entries` já usava o hook real desde 2026-08-05.

**`features/financial-groups` — integrado à `erp-api`** (`/v1/financial-groups`). React Query + abas Ativos/Excluídos + restore + filtro Tipo (query param). Dialog create/edit (nome · tipo receita/despesa). Delete 409 se grupo tem contas do plano vinculadas (mensagem da API no toast). **`tabCounts` ignora o filtro `type`** (backend). Mock `data/mock-financial-groups.ts` e `getFinancialGroupById` **removidos** (2026-08-06) — só existiam para sustentar a DRE mock. ⚠️ O grupo ganhou no backend um campo `classification` (`resultado`/`patrimonial`, usado pela DRE) — não exposto neste cadastro (nem no formulário nem no presenter de listagem), ver `api/AGENTS.md` §9.

**`features/cost-centers` — integrado à `erp-api`** (`/v1/cost-centers`). React Query + abas Ativos/Excluídos + restore. Dialog create/edit (nome) com `loading` no Salvar. Exclusão desabilitada quando `isSystem` (`canRemoveCostCenter`). Sem consumidores cross-feature — mock removido.

**`features/card-contracts` — integrado à `erp-api`** (`/v1/card-contracts` + `/v1/card-contracts/:id/payment-methods`). React Query + abas Ativos/Excluídos + restore. `bankAccountId` (FK, options via `useBankAccountOptionsQuery`); `depositFeeCents`/`feeCents` em centavos (UI em reais via mapper). PUT destrutivo — corpo completo. Payment-methods: listagem sem paginação; `progressiveTiers` descartados se `progressiveEnabled=false`. Mock removido. **2026-08-06 (motor de recebíveis):** `data/card-brands.ts` (novo, `CARD_BRAND_OPTIONS`, extraído de `payment-method-form-dialog.tsx`) e `data/card-providers.ts` (novo, `CARD_PROVIDER_SUGGESTIONS`, extraído de `types/card-contract.ts` — `MOCK_PROVIDERS` removido do arquivo de tipos) — o primeiro é reaproveitado por `features/sales-orders` para o campo Bandeira do painel de pagamentos (mesmo catálogo dos dois lados, garante correspondência exata com o que o motor de recebíveis da API compara). Contrato HTTP inalterado; o cadastro passa a produzir efeito real no fechamento de venda (ver `api/AGENTS.md` §9/§10). **2026-08-07 (spec `007-financeiro-ajustes-ui`, US6):** o campo **Provedor** de `/financas/contratos-de-cartoes-e-outros/novo` (`card-contract-form-view.tsx`) deixa de ser texto livre (`FormField`) e vira `Autocomplete` **fechado** (sem `freeSolo`, `disableClearable`) sobre `CARD_PROVIDER_SUGGESTIONS` (20 provedores: Elavon, Conductor, Bin, RV, Firstdata Corban, Fillip, Libercard, Cielo, Rede, Credsystem, Infocards, Nddcargo, Global, Vero, Stone, Mercado Pago, Accentiv, Alelo, Aspeb, A Vista) — lista fechada só no frontend, sem entidade nova no backend (`provider` continua `string` solto na API). Não há tela de edição do Provedor (`/financas/contratos-de-cartoes-e-outros/[id]` é só `CardContractDetailView`, somente leitura) — sem impacto em contratos existentes com provedor fora da lista.

**`features/financial-results`:** relatórios de resultados = **DRE real** (2026-08-06, `GET /v1/reports/income-statement`; reestruturada em 9 categorias fixas em 2026-08-07, spec `007-financeiro-ajustes-ui` US5). **UI MUI** — **Tela** (`FinancialResultPage`, `/financas/relatorios-de-resultados`, layout/período inalterados nesta reestruturação): `PageHeader` + `FinancialResultSummary` + toolbar (`Select` presets + `DateRangePicker` MUI) + CTAs PDF/Excel (permanecem toast "em breve" — fora de escopo). `api/` (dto + mapper `financial-result.mapper.ts`, centavos → reais + envelope no shape que a UI já consumia) + `hooks/use-financial-result.ts` (React Query; `report` continua `null` até o período estar resolvido; expõe `isLoading`/`isError`/`refetch` — página trata carregando/erro/vazio). **Base:** lançamentos reais agregados no banco por data de competência → conta do plano → grupo financeiro. **2026-08-07 (US5):** o DTO deixou de ter `revenue`/`expense` binário (com `shareOfSection`/`shareOfGroup`) — agora é `groups: ResultGroupBlock[]`, sempre os **9 grupos fixos do modelo** (`FinancialGroup.classification=resultado` com `sign` preenchido), na ordem de `catalogOrder`, **mesmo os sem lançamento no período** (`total: 0`, nunca omitidos) + `operatingResult` (soma de todos já com o `sign` aplicado). `FinancialResultSection` deixou de receber duas seções tipadas Receitas/Despesas — recebe a lista única `groups` e cada `FinancialResultGroupRow` colore pelo `sign` do próprio grupo (`formatResultAmount(value, sign)`, era `formatResultAmount(value, type)`). Cartões de resumo (Receitas/Despesas/Lucro-Prejuízo) continuam existindo, mas agora são somados no client a partir de `groups` (`sumBySign` em `financial-result-page.tsx`), não vêm mais prontos da API. O card de total no rodapé passou de "Resultado do período" para **"Resultado Operacional"**. `shareOfGroup`/`shareOfSection`/`formatResultShare` saíram do escopo da DRE — `formatResultShare` continua em `lib/financial-result-format.ts` só porque `features/cost-center-analysis` (relatório sem relação, não tocado nesta US) ainda a usa. `services/financial-result.service.ts` e `data/mock-result-entries.ts` **removidos** (já antes desta US).

**`features/cost-center-analysis` — Análise por centro de custo** (2026-08-06, `/financas/analise-centro-de-custo`, nova, **integrado à `erp-api`**: `GET /v1/reports/cost-centers`). **UI MUI**. Percentual e valor de despesa ou receita do período por centro de custo — a "visão macro" que a tela `/relatorios` (`PlaceholderPage`) nunca chegou a entregar. `hooks/use-cost-center-analysis.ts` reaproveita `FinancialResultPeriod`/`resolveFinancialResultPeriodRange` de `financial-results` (mesmos presets de período — sem duplicar) + estado local de tipo (Despesa/Receita, default Despesa). **Tela** (`CostCenterAnalysisPage`): `PageHeader` + `CostCenterAnalysisToolbar` (reaproveita `FinancialResultToolbar` + `ToggleButtonGroup` MUI Despesa/Receita) + `ListPagePanel` com `CostCenterAnalysisTable` → `CostCenterShareBar` por linha (nome, valor, percentual, barra `LinearProgress` de `@mui/material` — **sem** biblioteca de gráfico nova). Lançamentos sem centro de custo resolvido entram sob `"Outros"` (o backend já entrega agregado). Estados de carregando/erro/vazio explícitos. Novo item de navegação em `lib/navigation.ts` (`financas-analise-centro-custo`) + ícone `pie-chart` em `lib/nav-icons.tsx` (`PieChartOutlineOutlined`).

**`features/financial-statement` — Extrato** (2026-08-06, `/financas/extratos`, nova, **integrado à `erp-api`**: `GET /v1/financial-entries` estendido + `GET /v1/financial-entries/summary` novo + `GET /v1/bank-accounts` reaproveitado). **UI MUI**. Substitui o `PlaceholderPage` que existia desde sempre em `/financas/extratos` (destino do redirect de `/financas`) — consulta somente-leitura consolidada das movimentações financeiras, sem nenhuma ação de escrita (FR-003). `api/financial-statement.mapper.ts` centraliza `buildFinancialStatementQuery` (filtros comuns à lista e ao resumo, incl. o eixo de data — só um par `competenceFrom`/`competenceTo` **ou** `dueFrom`/`dueTo` por vez, nunca os dois); `api/financial-statement.service.ts` reaproveita `toFinancialEntryListItem`/`FinancialEntryListResponseDto` de `financial-entries` para a lista (mesmo shape de item, zero duplicação). **Tela** (`FinancialStatementPage`): `PageHeader` + `FinancialStatementSummaryCards` (3 cards — Entradas/Saídas/Saldo do período, molde de `financial-result-summary.tsx`; **único conteúdo do resumo desde 2026-08-07** — `BankAccountBalancesPanel` removido, spec `007-financeiro-ajustes-ui` FR-002) no cabeçalho; `FinancialStatementToolbar` + `FinancialStatementFiltersDrawer` (molde de `financial-entry-filters-drawer.tsx` + toggle Competência/Vencimento, que segue controlando o eixo de data do **filtro** de busca, não mais a coluna exibida da tabela + Select de conta bancária) + `FinancialStatementTable` (`DataTable`; colunas fixas Competência + Vencimento (sempre as duas, não alternadas) + Categoria + Método de pagamento (`resolvePaymentMethodLabel`, `financial-entries/lib/financial-entry-format.ts`) + Valor original (`entry.baseAmount`) + Valor final (`computeEntryTotal`) + Status; coluna "Ver" só navega até `/financas/lancamentos/[id]`) dentro de `ListPagePanel`; `FinancialStatementSelectionBar` no rodapé. **Seleção com soma** (`use-financial-statement-selection.ts`): coluna de checkbox nova na tabela (nem `@citybox/mui` nem o wrapper local tinham suporte — construída via `render()` de coluna + `stopPropagation`, mesmo padrão já documentado no `DataTable`); soma 100% client-side sobre as linhas carregadas, sem chamada de API extra; reset ao trocar filtro/eixo/busca/página feito por ajuste de estado durante o render (não `useEffect`, evita `react-hooks/set-state-in-effect`). Estados de carregando/erro/vazio explícitos — duas variantes de vazio (`"no-data"` sem filtro vs. `"no-match"` com filtro, com botão "Limpar filtros" — FR-014). Nenhuma mudança de navegação (`financas-extratos` já existia em `lib/navigation.ts`).

**`features/promotions`:** promoções/benefícios de venda (mock). **UI MUI** (`@citybox/mui` + `@/components/ui/*`). **Lista** (`PromotionListPage`, `/vendas/promocoes`): `ListPageShell` + `PageHeader` (**Nova promoção**) + `ListPagePanel`; tabs **Ativas** / **Excluídas** (`Tabs`/`Badge`); toolbar `SearchInput` (debounce 400ms); `DataTable` 1-based com `getRowHref`; colunas Nome · Tipo · Período · Status (`PromotionStatusBadge`) · ações (`Menu` — Cupom baixar CSV / Editar / Excluir → `ConfirmationDialog`; Restaurar nas excluídas). Store mock inalterado. Zero `@citybox/ui` / `data-table-shadcn` / `lucide-react`.

**`features/promotions` — Nova promoção / edição** (`PromotionCreateView`, `/vendas/promocoes/novo` + `/[id]`): **UI MUI** wizard 3 passos. Full-bleed (`m: -3`) + `ScrollArea` + `ProductFormHeader` + **`PromotionStepper`** local MUI + **`PromotionFormFooter`** sticky (bloco “PROMOÇÃO SELECIONADA” + Voltar/Continuar/Salvar — não usa dirty-mode de `EntityFormFooter`). Seções via `PromotionSection` (`formSectionGridSx`). **Etapa 1** `PromotionTypeStep`/`PromotionTypeCard` (`RadioGroup` + cards `sx` + ícones Material no catálogo; `typeLocked` → `Alert`). **Etapa 2** `PromotionGeneralStep` (`FormField`/`Checkbox`/`DatePicker`/`RadioGroup`/`PromotionUnitsSelector` + `ProductUnitsDrawer`). **Etapa 3** rules/`MultiSelect`/`Autocomplete`/`CurrencyInput`/`NumberInput`/`Switch`. Hooks/service/types/mock inalterados. Zero shadcn/lucide.

**`features/sales`:** "Vendas" (`/vendas`), listagem enxuta **UI MUI** **sobre o mesmo `SALE_ORDERS_STORE`** de `features/sales-orders` (cross-feature import — não é uma entidade nova, é outra visão do mesmo pedido de venda). `SaleListPage`: `ListPageShell` + `PageHeader` (título "Vendas" + botão **Nova venda** → `/vendas/novo`) + `ListPagePanel` → `SaleListToolbar` (`SearchInput` + Filtro + Ordenação `Menu` — **sem tabs**, mostra só pedidos com `deletedAt == null`) → `SaleListTable` (`DataTable` local 1-based). Reaproveita direto de `sales-orders` (sem duplicar): `SaleOrderFiltersDrawer` (mesmo drawer de Status/Valor/Período), `SALE_ORDER_SORT_OPTIONS`/`countActiveSaleOrderFilters`/`createEmptySaleOrderFilters`, `formatSaleOrderAmount`/`formatSaleOrderCreatedAt`, `formatSaleOrderChannel`, `isCreatedAtInPeriod`, `deleteSaleOrder` (exportado como `removeSale`) e o tipo `SaleOrder`. Colunas próprias (diferentes de `sales-orders`): seleção · **Venda** (nome do cliente) · **Nº do pedido** (`#N`) · Valor · **Status** (`SaleOrderStatusBadge`) · Canal de venda · Criação · ações. Canceladas: texto riscado + menu **Visualizar** (não Editar). `isSaleOrderReadOnly` = `cancelled` **ou** `stockMovementId` — form compartilhado só leitura (Alert + sem footer), molde compras. Zero `@citybox/ui` / `data-table-shadcn` / `lucide-react`. **Nova venda** (`SaleCreatePage`, `/vendas/novo`): **mesmo `SaleOrderFormView`** de `sales-orders` (zero duplicação de formulário) — props `headerTitle`/`headerSubtitle`/`backHref`/`initialStatus`/`statusLocked`/`redirectPath` para título "Nova Venda"/"Venda", `backHref="/vendas"`, `initialStatus="closed"`, `statusLocked` e `redirectPath="/vendas"`. `statusLocked` trava o `Select` de Status em "Fechado". Todo o resto (produtos, pagamentos, cliente, observações, validação, footer dirty/save) é idêntico.

**Detalhe de Vendas/Pedidos (atualizado em 2026-08-15):** `SaleOrderFormView` usa
`fieldset disabled` no modo somente leitura para os controles HTML nativos e
também propaga `disabled` explicitamente aos controles compostos de
`@citybox/mui`/Base UI (Select, Autocomplete, NumberInput/NumberSpinner,
CurrencyInput e ações). Essa propagação explícita é obrigatória porque esses
componentes não herdam o bloqueio do `fieldset`. As ações **Editar/Visualizar** são
`MenuItem component={Link}` (não `router.push`) para acionar o top loader do
Next. `SaleOrderFormSkeleton` ocupa a estrutura completa enquanto a query do
detalhe carrega.

**`features/purchases` — integrado à `erp-api`** (`/v1/purchases`). React Query: lista/create/edit/delete/restore; mapper `warehouseId`↔`stockId`, `costPrice`↔`costCents`, extras↔`freightCents`/`discountsCents`/`otherExpensesCents`. Estoques/fornecedores/produtos (`trackStock`)/carriers via APIs reais. Entrada no ledger no servidor (idempotente via `stockMovementId`) quando `deliveryStatus=received` + linhas `received`. Soft-delete + restore sem estorno/criação de movimento. **Recebimento:** ao salvar com status Recebido abre modal para confirmar itens (recebido/cancelado + qtd); após `stockMovementId`, compra fica **só visualização** (API rejeita PUT). **Payments** stub UI local — não enviados à API. Lista: coluna Compra = NF/série + fornecedor; aba Excluídas com **Restaurar**. PDF client-side permanece.

⚠️ **Badges das listagens:** usar `SemanticBadge`/`semanticBadgeSx` de `@/components/ui/status` (fundo `*.light`, texto `*.dark`, borda `alpha(main, .35)`, tom `neutral` para "sem valor"). **Não** usar `<Badge color="success|info|muted" variant="outlined" />` cru: o Chip pinta texto e borda com `*.main`, que na paleta pastel do ERP é claríssimo (`muted.main` = `#F5F5F5`) e some no fundo branco da tabela. `ActiveStatusBadge` já usa o helper; `carriers` (coluna Tipo) e as tabs com contador ainda usam `color="muted"` cru.

**`features/pos-policies` — Alçadas do PDV** (`/ponto-de-venda/configuracoes/alcadas`,
`/v1/pos-policy`). **Formulário único, não lista**: há uma política por
organização, então não existe CRUD — só `GET` e `PUT`, e o `GET` nunca responde
404 (a API cria com os defaults na primeira leitura).

O estado do formulário é sincronizado por **`key`**, não por `useEffect`:
`<PosPolicyEditor key={policy.updatedAt} …>` remonta quando o servidor devolve
uma versão nova. É o mesmo padrão de `formKey` dos diálogos de cadastro, e evita
o `setState` dentro de efeito que o lint bloqueia (`react-hooks/set-state-in-effect`).

`CentsField` (local) digita dinheiro **em centavos, no comportamento de caixa
registradora** — de propósito igual ao `PdvMoneyField` do app do PDV: o número
configurado aqui é lido lá, e duas convenções de digitação para o mesmo valor
produzem "configurei R$ 500 e o caixa entendeu R$ 5".

**`features/users-permissions` — Usuários e Permissões** (`/configuracoes/usuarios-permissoes` …): inclui **credenciais de caixa PDV** no formulário do membro (`UserPdvSection`: `pdvCode` + `PUT /v1/members/:id/pdv-pin`) e flag **`isSeller` (“Usuário vendedor”, default true)** em settings. No **create**, **Definir PIN** grava o PIN em estado local (`pendingPdvPin`) e, após `createMember`, chama `setMemberPdvPin` (+ `updateMember` com `pdvCode` se necessário). A feature `pos-operators` e o item de nav **Operadores** foram removidos; `/ponto-de-venda/operadores` redireciona para esta tela.

**`features/pos-registers` — Cadastros de PDV** (`/ponto-de-venda/cadastros`, **integrado à `erp-api`**: `/v1/pos-terminals`, React Query + Zustand). Estrutura: `api/` (`pos-terminal.dto.ts` · `pos-terminal.mapper.ts` · `pos-terminals.service.ts`), `hooks/` (`query-keys.ts` · `use-pos-terminal-queries.ts` · `use-pos-terminal-mutations.ts` · `use-pos-register-list.ts`) e `store/pos-register-list.store.ts` (busca/página — sem tabs). ⚠️ **`nfceContingency` diverge entre API e UI**: a API guarda `boolean`, o tipo do front (`PosRegisterFormValues`) usa `"enabled"`/`"disabled"` (herdado do mock) — o mapper traduz nos dois sentidos. **Impressora/balança** continuam seleção por opção mock local (`data/pos-register-options.ts`, sem cadastro próprio no backend); o mapper resolve o **rótulo** escolhido (ex.: "EPSON TM-T20") para o texto livre que a API salva em `printer`/`scale`, e o inverso na edição (`findPosOptionIdByLabel`). **Terminal é sempre da unidade ativa do cabeçalho** — não há seletor de unidade no formulário (diferente de `customers`/`suppliers`, que têm `branchIds` múltiplos); cadastrar sem unidade selecionada mostra toast e bloqueia. **Lista**: busca por nome (server-side, debounce 400ms) + colunas Nome/Impressora/Balança/Status + skeleton (`isLoading`) + `ListLoadErrorAlert`. **Dialog** único para Novo/Editar (`PosRegisterFormDialog`, `formKey` remonta o corpo); Salvar com `loading={isPending}`. **Excluir** com `ConfirmationDialog` (soft-delete); **Marcar como inativo/ativo** alterna via `PATCH`. **Gerar código de pareamento** (`POST .../pair`): código opaco de 8 caracteres, válido 15 minutos, exibido num `Dialog` simples com botão copiar — é o que o app PDV vai pedir na tela "Ativar terminal" quando a fatia de autenticação entrar em escopo (ver `.claude/plans/_platform/pos-terminals-pdv-integration.plan.md`). `services/pos-register.service.ts` e `data/mock-pos-registers.ts` **removidos**; `features/pos-cash-sessions` (ainda mock) parou de importar o mock removido e passou a derivar as opções de PDV do próprio `mock-pos-cash-sessions.ts` (`POS_CASH_REGISTER_OPTIONS`).

**`features/kds` — KDS (Kitchen Display System)** (`/ponto-de-venda/kds` + `/[id]/produtos`, **mock**). A `erp-api` ainda não tem módulo de KDS, então o estado vive em `services/kds.service.ts` (store in-memory). ⚠️ **O store expõe `subscribeKds`/`getKdsSnapshot` e as telas leem por `useSyncExternalStore`** (`hooks/use-kds-store.ts`) — nada de contador de `revision` em `useMemo` (dep artificial que o `exhaustive-deps` acusa) nem `setState` em efeito. O array do store é sempre **substituído**, nunca mutado: a referência é o snapshot. Seleção/paginação são funções puras (`selectKdsList`, `selectKdsById`). **Lista** (`KdsListPage`): `PageHeader` (busca + **Novo KDS**) + `DataTable` com coluna de seleção; colunas Nome · Status (`ActiveStatusBadge`) · Expedição (`Badge` Sim/Não) · ações. Menu ⋯ (`KdsRowActions`): **Vincular produtos** (`href`, top loader) · **Marcar como inativo/ativo** · **Editar** · **Excluir** (`ConfirmationDialog`). **Criar/editar** em `Dialog` (`KdsFormDialog`, `formKey` remonta o corpo a cada abertura): nome · status · switch **Tela de expedição**. **Vínculo de produtos** (`KdsProductsPage`): `EntityFormHeader` (voltar + sobretítulo "KDS") + **Adicionar produtos** → `ProductPickerDrawer` sobre o **catálogo real** (`useCatalogProductsQuery`); tabela Nome · Código (SKU) · Categoria · Opções (remover com confirmação). O picker só oferece produtos ainda não vinculados. Fora do escopo desta fatia (não consegui inspecionar na referência — sessão expirou): o filtro (funil) da tela de produtos e campos extras que o form "Novo KDS" da ConnectPlug possa ter além de nome/status/expedição.

**`features/branches` — Unidades e Filiais** (`/configuracoes/unidades-filiais`, **integrado à `erp-api`**: `/v1/branches`, módulo `tenancy`). React Query + Zustand (UI: busca/página/seleção), molde `carriers`. Estrutura: `api/` (`branch.dto` · `branch.mapper` · `branches.service`), `hooks/` (query-keys · queries · mutations · `use-branch-list` · `use-branch-form`), `lib/branch-format.ts`, `store/`, `components/`, `pages/`. **Escopo da queryKey é só `organizationId`** (não `useCatalogScope`): a lista de filiais não muda ao trocar a unidade ativa no header. As mutations chamam `useOrganization().reload()` além de invalidar o cache — o seletor de unidade do header vem do contexto de tenancy, não do React Query. **Lista** (`BranchListPage`): `PageHeader` (**Nova filial**) + `ListPagePanel` + `SearchInput` (server-side, debounce 400ms) + `DataTable` com coluna de seleção; colunas Nome fantasia (badge **Matriz** + código/razão social) · CNPJ · ações. **Linha não é clicável** — editar sai pelo menu ⋯ (decisão de produto). **Nova filial** é `Button component={Link}` (não `router.push`), para o `nextjs-toploader` interceptar o `<a>`. **Form** (`BranchFormView`, `/nova` + `/[id]`): `EntityFormHeader` + **`Tabs`** Cadastro / Cobrança / Definições de uso, espelhando a referência: **Cobrança sempre desabilitada** (assinatura é da empresa) e **Definições de uso só na edição**. Seções `FormSection` — Informações gerais (código/tipo de pessoa/documento **bloqueados na edição**: identidade fiscal imutável na API; máscara CNPJ↔CPF acompanha o tipo) · Endereço · Definições de uso (fuso + `active`). ⚠️ **Mapper:** a API devolve o documento só com dígitos e aceita POST/PUT com ou sem máscara — `toBranch` aplica a máscara (`maskBranchDocument`); campo em branco é **omitido** do corpo (`""` quebraria `@IsEmail`/tamanhos). Excluir = **soft-delete** (`DELETE`, 204) e é bloqueado no UI para `isHeadquarters`; **não há endpoint de restore** — reativar é `active: true` no PUT. Campos da referência que a API não tem (segmento, data de fundação, CNAE, logotipo, contatos financeiro/proprietário, "Salvar e selecionar plano") ficaram **fora** — mandá-los seria descartar dado silenciosamente.

**`features/company-settings` — Dados da empresa** (`/configuracoes/dados-empresa`, **aba Cadastro integrada à `erp-api`**). **UI 100% MUI**. Header + **`Tabs` MUI com 3 abas** (`registration` / `billing` / `usage`) + `EntityFormFooter` mode `dirty`. Estado em `hooks/use-company-settings-form.ts` (React Query `GET/PUT /v1/organizations/current` + `isDirty` só no que a API persiste). **Cadastro (API):** razão social, nome fantasia, e-mail, telefone, contato do responsável; documento/tipo só leitura; campos sem API (logo, CNAE, segmento, endereço completo, certificado, etc.) ficam disabled / "Em breve". **`brandColor`:** `lib/brand-color-store.ts` via `useSyncExternalStore` (`localStorage`). **Cobrança / Definições de uso:** UI informativa / "Em breve" — sem backend neste ciclo. `data/mock-company.ts` só fornece `EMPTY_*` / plano mock da aba Cobrança.

**`features/payment-methods` — Formas de pagamento** (`/configuracoes/formas-pagamento`, **integrado à `erp-api`** desde 2026-08-07, spec `007-financeiro-ajustes-ui`, US8). **UI 100% MUI**. A `erp-api` ganhou entidade real `PaymentMethod` (`/v1/payment-methods`, módulo `payment-methods` — mesmo padrão Clean Architecture de `cost-centers`, `isSystem`/`systemKey` protegendo as 15 formas de sistema); a tela deixou de ler um store in-memory e passa a usar React Query (`api/` dto+mapper+service, `hooks/use-payment-method-{queries,mutations}.ts`, molde `cost-centers`). Sem endpoint `/options` dedicado — `listPaymentMethodsApi` reaproveita a listagem normal com `perPage=100&tab=active` (mesmo padrão de `listCostCenterOptionsApi`). ⚠️ **Não é `DataTable`** — a referência (ConnectPlug) é uma tela de configuração: `PageHeader` (título + **Nova forma de pagamento**) + **`FormSection`** ("Tipos de pagamento" à esquerda, card à direita) com **duas listas empilhadas** dentro do card, renderizadas pelo mesmo `PaymentMethodList` (caixa com linhas divididas por borda; sem busca, filtro, abas ou paginação — `usePaymentMethodsQuery` traz só as ativas, `selectPaymentMethodGroups` em `api/payment-method.mapper.ts` separa sistema/próprias, sistema na ordem do backend). Lista 1 = formas da plataforma (`isSystem: true`, 15 registros semeados via `store-setup`) — **sem menu ⋯**, já que a API recusa edição/exclusão (`PaymentMethodNotEditableError`/`PaymentMethodNotRemovableError`, 409). Lista 2 = formas criadas pela empresa (ordem alfabética pt-BR) com `RowActionsMenu` **Editar** / **Excluir** (`ConfirmationDialog`, `mutateAsync` real); começa **vazia** por organização nova, com caixa de estado vazio. **Dialog** único Novo/Editar (`PaymentMethodFormDialog`, `formKey` remonta o corpo, `isSaving` das mutations): Nome (`FormField`, `maxLength` 40 + contador de caracteres **restantes** sobreposto à direita, padrão de `suppliers`), Código do método de pagamento na nota fiscal e Permissão de parcelamento — os dois em **`Autocomplete`** (limpáveis, como na referência), com defaults `01 - Dinheiro` / `Não permitir` na criação. Códigos fiscais = tabela `tPag` da NF-e (NT 2023.004) em `data/payment-method-options.ts` (inalterado — catálogo estático, não é dado da entidade). Nome duplicado é bloqueado pela API (409, toast da mutation) — checagem client-side removida, a API é a única fonte de verdade agora. `services/payment-method.service.ts`, `hooks/use-payment-method-store.ts` e `data/mock-payment-methods.ts` **removidos**. **2026-08-16 (spec erp/030):** o dia mencionado abaixo chegou — `features/purchases/data/mock-payment-methods.ts` também foi removido; `lib/payment-method-option.mapper.ts` (novo, nesta feature) exporta `toPaymentMethodOption(s)` que reusam a mesma forma `{id, name, cardPaymentType?}` que `sales-orders`/`purchases`/`service-orders`/`sales-contracts` já esperavam, derivando `cardPaymentType` do `systemKey` real (`pm-cartao`→crédito, `pm-cartao-debito`→débito, `pm-pix`→pix) — exigiu expor `systemKey` no `PaymentMethod` do frontend (só existia no backend). Os 5 seletores agora usam `usePaymentMethodsQuery()` (lista completa) + esse mapper, não mais `usePaymentMethodOptionsQuery()` (que só devolve `{id,name}`, sem `systemKey`).

**`features/users-permissions` — Usuários e Permissões** (`/configuracoes/usuarios-permissoes` + `/novo` + `/[id]` + `/perfis` + `/perfis/novo` + `/perfis/[id]`, **integrado à `erp-api`**). React Query + Zustand (UI de lista) no molde `carriers`/`branches`. Estrutura: `api/` (`member.dto`/`mapper` · `members.service` · `permission-profile.dto`/`mapper` · `permission-profiles.service` · `permission-catalog.service`), `hooks/` (query-keys · member/profile queries+mutations · catalog query · list), `store/` (Zustand busca/aba/página). **Membros** (`/v1/members`): listagem `active=true|false` (soft-deactivate via `PUT { active }`, não hard DELETE); create devolve `meta.provisionalPassword` → `ProvisionalPasswordDialog`; edit sem alterar nome/e-mail; **Resetar senha**; unidades via `ProductUnitsDrawer` quando o perfil não é administrador; **`isSeller`** (“Usuário vendedor”) no create/update (default true). `splitFullName` no create: nome único → `lastName: ""` (não duplica o primeiro nome). **Perfis** (`/v1/permission-profiles` + soft-delete/restore); seed na org: Administrador (**protegido** `isSystem`), Financeiro, Gerente, Caixa, Vendedor, Contador, Atendimento (editáveis); árvore alimentada por `GET /v1/permission-catalog`. **Sessões ativas:** drawer "Em breve" (sem backend). Settings de e-mails legados **não** vão à API nesta fatia. **Credenciais de caixa** (`pdvCode`, `hasPdvPin`, lockout) sim — seção PDV no form + `PUT /v1/members/:id/pdv-pin`. ⚠️ **Sem enforcement fino** nas demais telas ainda — cadastro/organização. Escopo da queryKey = `organizationId` (como `branches`).

**`features/carriers` — integrado à `erp-api`** (`/v1/carriers`, organization-scoped), padrão suppliers: React Query + Zustand. Estrutura: `api/` (`carrier.dto.ts` · `carrier.mapper.ts` · `carriers.service.ts`), `hooks/` (queries/mutations/list/form + `useCarrierOptionsQuery` para selects slim `{id,name}`). Mapper: `tradeName`↔`name`, `fisica`/`juridica`↔`PF`/`PJ`, `unitIds`↔`branchIds`, `fiscal.noStateRegistration`↔`stateExempt`. Unidades via `useBranchUnits`. Soft-delete/restore. Mock `data/mock-carriers.ts` removido; selects de transfers/purchases usam `useCarrierOptionsQuery` (não mais mocks locais).

**`features/suppliers` — integrado à `erp-api`** (`/v1/suppliers`, rotas **organization-scoped**), no mesmo padrão de `features/products`/`features/categories`: React Query para dados + Zustand para estado de UI. Estrutura: `api/` (`supplier.dto.ts` · `supplier.mapper.ts` · `suppliers.service.ts`), `hooks/` (`query-keys.ts` · `use-supplier-queries.ts` · `use-supplier-mutations.ts` · `use-supplier-list.ts` · `use-supplier-form.ts`) e `store/supplier-list.store.ts`. `services/supplier.service.ts` guarda **só** os helpers puros do formulário (`createEmptySupplierFormValues`, `supplierToFormValues`); o mock `data/mock-suppliers.ts` foi removido. ⚠️ **O contrato da API diverge do tipo `Supplier` do front e o mapper traduz nos dois sentidos:** `PF`/`PJ` ↔ `fisica`/`juridica`, `null` ↔ `""`, `branchIds` ↔ `unitIds`; além disso a **resposta aninha** `contact`/`address` mas o **corpo de POST/PUT é flat**, e campo em branco é **omitido** (semântica de PUT: omitir = limpar; mandar `""` quebraria `@IsEmail`/`@IsDateString`). **Lista** (`SupplierListPage`, `/estoque/fornecedores`): igual carriers — busca (server-side, debounce 400ms) + tabs **Ativos** / **Excluídos** com `tabCounts` da API + tabela Nome · CPF/CNPJ · Tipo (`PERSON_TYPE_LABELS`) · info `Tooltip` · ações (Editar/Excluir/Restaurar via mutations). **Criar/Editar** (`SupplierFormView`, `/novo` e `/[id]`): mesmas seções de antes — **Dados do fornecedor** (Tipo de pessoa, Nome com contador, Razão social, CNPJ/CPF, Inscrição Estadual + Isento, Inscrição municipal, **Inscrição SUFRAMA** com `Tooltip`, Data de fundação `DatePicker`, **Unidades** `ProductUnitsDrawer` agora alimentado por `useBranchUnits()` (**filiais reais** da empresa ativa, não mais `MOCK_PRODUCT_UNITS`), Observação `Textarea` 600) · **Contato** · **Endereço** (máscara CEP + `useCustomerCepLookup` → `GET /v1/cep/:cep`, debounce 400 ms, loading desabilita os demais campos, toast em falha — mesmo molde de clientes); footer dirty/save. `useSupplierForm` valida nome **e documento** antes de chamar a mutation (o documento é obrigatório e validado como CPF/CNPJ no backend). `/[id]` carrega por `useSupplierQuery` e mostra fallback "Fornecedor não encontrado" (não redireciona mais). `useActiveSuppliersQuery` alimenta o combobox Cliente+Fornecedor de `features/financial-entries` — `listPartyOptions(suppliers)` passou a **receber** os fornecedores por parâmetro. Standalone — não consome/altera os mocks de fornecedor/transportadora de `purchases`/`stock-transfers` (consolidação futura).


### 4.2 Comportamento do Dual (`DualSidebar` MUI)

- Coluna 1 (rail) **sempre comprimida** (só ícones + tooltips), com ou sem painel aberto.
- Módulo **sem** submenu → clique no rail **navega** para a página; coluna 2 oculta.
- Módulo **com** submenu (Vendas, Produtos, Estoque, Clientes, Finanças, Pontos de venda) → clique no rail **só abre a coluna 2** (não navega). A página só muda ao clicar num leaf da coluna 2.
- Botão **toggle do painel** acima de Meu plano / Configurações — fecha/abre a coluna 2; permanece no rail mesmo com a coluna 2 fechada (para reabrir).
- **Sem `user` no Dual** — o `NavUser` fica no header (`variant="header"`).
- **Logo** no rail: `brandNodeCollapsed` (symbol), pois o rail não expande.
- Implementação: `@citybox/mui` (`DualSidebar` + `DualDashboardLayout`), orquestrado em `shell/comercio-erp-layout.tsx`.

### 4.3 Header (`headerFullBleed`)

| Esquerda | Centro | Direita |
| -------- | ------ | ------- |
| `OrganizationSwitcher` + `BranchSwitcher` | `CommandSearch` (⌘K) | `ThemeModeSwitch` · Ajuda · Notificações · `NavUser` (sessão real, Sair = logout SSO) |

- Empresa/unidade: `useOrganization()` sobre a API; chaves `citybox-comercio-active-org` / `-active-branch`.
- Tema: `ThemeModeSwitch` (IconButton MUI); `enableSystem={false}`; `palette.mode` do MUI sincronizado com `next-themes` em `providers.tsx`.
- **Ícones dos botões** (tema / ajuda / notificações): `fontSize: 22`.
- **Ícones do rail/painel:** `NavIcon` / DualSidebar em **18px**.
- Command: grupos Navegação (rotas reais) + Produtos/Clientes mock.
- User: nome/e-mail vêm da sessão; Editar perfil → `/perfil`; **Sair** faz logout SSO no Keycloak.

### 4.4 Cor de marca e favicon

- Cor default: `DEFAULT_BRAND_COLOR` (`#3F43BF`, mesma do preset MUI) em `src/theme/brand-color.ts` — alimenta `primary` do MUI e o favicon.
- Runtime: `localStorage.company_brand_color` + evento `brand-color-changed` em `providers.tsx` (também seta `--primary` no `<html>`).
- Favicon: símbolo Citybox (`packages/mui/src/logobrand.svg`) com fundo = cor de marca e glifo branco.
  - SSR/default: `app/icon.tsx`, `app/apple-icon.tsx`, `public/favicon.svg`.
  - Runtime (troca de marca): `BrandFaviconSync` + `lib/brand-favicon.ts` (`data:` SVG; sem `next/og` no client).
  - PNG server-only: `lib/generate-brand-favicon.tsx` (`ImageResponse`).

---
## 5. Restrições Críticas

### 5.0 Autenticação e escopo multi-empresa (leia antes de mexer em rota ou fetch)

**O login é BFF próprio, não NextAuth** — mesmo padrão de
`apps/admin/web`: OAuth2 Authorization Code + **PKCE S256** iniciado no
browser, troca de código no servidor, tokens em **cookies httpOnly** que o
JavaScript da página nunca enxerga.

```
proxy.ts (middleware)  → sem cookie de sessão? 302 /login
SessionProvider        → sessão em runtime + polling (120s + jitter)
RequireAuth            → cobre expiração com a aba aberta
/api/proxy/comercio/*  → injeta o Bearer a partir do cookie; 401 sem sessão
                       → GET/HEAD: aceita ?organizationId=&branchId= (ex.: <img>)
                       → e promove a X-Organization-Id / X-Branch-Id
```

| Peça | Arquivo |
| ---- | ------- |
| Cookies | `lib/auth-cookie.ts` (`citybox_comercio_access` / `_refresh` / `_id`) |
| PKCE | `lib/oauth-pkce.ts` — pending por aba, `state` contra CSRF |
| Núcleo server | `lib/auth-server.ts` — issuer, refresh com dedupe, `resolveAccessTokenForBff` |
| Cliente | `lib/auth.ts`, `lib/auth-fetch.ts` (retry 1× em 401), `lib/session-context.tsx` |
| Rotas BFF | `app/api/auth/{token,session,refresh,logout}/route.ts` |
| Portão de rota | `src/proxy.ts` (no Next 16 o middleware tem esse nome) |
| Páginas | `/login`, `/auth/callback`, `/auth/sso`, `/entrada`, `/selecionar-organizacao`, `/selecionar-unidade`, `/sem-organizacao`, `/sem-unidade` |

**Escopo multi-empresa** (`lib/organization-context.tsx`): a organização e a
unidade ativas vivem em `localStorage` e viajam como `X-Organization-Id` /
`X-Branch-Id` até o proxy (`comercioFetch`). Em tags `<img>` (imagem de produto)
o escopo vai na query (`productImageProxyUrl`) — o proxy promove a header.
**Forjar o header não dá acesso a nada** — quem valida vínculo e acesso à
unidade é o `TenantContextGuard` da API a cada request (ver `../api/AGENTS.md` §5.10).

```tsx
const { organizationId, branchId, organizations, branches } = useOrganization();
const { storeId, ready } = useCatalogScope();  // só para o catálogo (§5.6)
```

**Como os headers chegam na API:** o `OrganizationProvider` publica o escopo em
`lib/api/active-scope.ts` **durante o render** (não num efeito — efeitos de
filhos rodam antes dos do pai, e um `useQuery` habilitado no mesmo commit sairia
com o escopo anterior). O `comercioFetch` lê de lá e injeta os headers em toda
chamada. Sem isso, qualquer rota de negócio responde **400 — "Header
X-Organization-Id obrigatório"**, porque o `TenantContextGuard` da API cobre
todas as rotas, inclusive as do catálogo.

Regras:
- **Não use `fetch` cru** para a API — use `comercioFetch` (catálogo) ou os
  helpers de `lib/api/tenancy.ts`; ambos passam por `fetchWithSession` e levam o
  escopo ativo.
- **Não guarde token em `localStorage`** — a sessão é cookie httpOnly.
- Trocar de organização **invalida o cache do React Query**; ao criar query
  nova, inclua o escopo na `queryKey`.
- Rota pública nova precisa entrar em `PUBLIC_PREFIXES` no `src/proxy.ts`.

### 5.6 Catálogo ainda usa `X-Store-Id` (interino)

O módulo `catalog` da API continua escopado por loja. O `useCatalogScope()`
resolve `storeId = unidade ativa ?? organização` e o proxy repassa o header.
**Consequência:** produtos semeados com as lojas mockadas antigas
(`boteco-do-cais`, …) não aparecem — é esperado; re-semeie com o id de uma
unidade real. Some quando o catálogo migrar (ver `../api/AGENTS.md` §5.4).

### 5.1 Package Manager
```
SEMPRE: pnpm --filter @citybox/erp-web <script>
NUNCA:  npm install / yarn add
```

### 5.2 UI — shell MUI + features de domínio migradas (Vendas 100% MUI)
```tsx
// Shell (layout / Dual / panel-menu): @citybox/mui
import { DualDashboardLayout, DualSidebar } from "@citybox/mui";

// Features migradas (catálogo, estoque, clientes, finanças, vendas completo): @citybox/mui + @/components/ui/*
import { Button, PageHeader, Drawer, Dialog } from "@citybox/mui";
import { DataTable, ListPagePanel } from "@/components/ui/data-table";
```

### 5.2.1 Ícones — fonte única (`@mui/icons-material`)
```
Todo o app (rail DualSidebar, painel de leaves, header, features, menus, forms):
   import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
   import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
   <EditOutlinedIcon sx={{ fontSize: 16 }} />

Navegação (rail + coluna 2):
   import { NavIcon } from "@/lib/nav-icons";
   // `navigation.ts` tipa com `NavIconName`; layout/panel-menu renderizam <NavIcon />
   <NavIcon name="products" size={18} />
   Cores do item ativo vêm do DualSidebar / ListItemButton — não forçar
   primary/text.secondary no ícone do rail.
   Novo ícone de menu: mapear em `lib/nav-icons.tsx` (nome semântico → glifo Material).

Catálogo: https://mui.com/material-ui/material-icons/

Proibido: `@citybox/mui/icons` / Solar / Iconify neste app; proibido lucide no shell/nav.
```

### 5.2.2 Densidade de campos MUI (`size`)
```
Padrão do app: NÃO passar size — o default do tema é 44px (medium).

Usar size="small" (36px) SOMENTE quando o campo (FormField / Input /
Select / SearchInput / Autocomplete / CurrencyInput / DatePicker) fica
na MESMA linha de um Button e precisa bater a altura do botão.

Exemplos válidos:
  • toolbar de lista: SearchInput size="small" ao lado de Filtro / Ordenação
  • painel Produtos do pedido: SearchInput size="small" ao lado de Adicionar

Proibido: size="small" em formulários full-page, drawers de formulário,
dialogs de cadastro ou qualquer campo que não compartilhe a linha com botão.
```

### 5.3 Consumo via source + transpile
```
transpilePackages: ['@citybox/ui', '@citybox/mui'] no next.config.ts
tsconfig paths: @citybox/ui → packages/ui; @citybox/mui → packages/mui
globals.css: @import "@citybox/ui/styles" + @source do pacote UI (features)
Tema MUI: presets em `src/theme/presets/` (`v1` | `v2`); ativo via
  `COMERCIO_THEME_PRESET` → `comercioMuiThemeOptions` em `comercio-mui-theme.ts`.
  Semântica pastel em `src/theme/semantic-palette.ts` (`success`/`error`/`warning`/`info`:
  `light` = fundo de badge, `dark` = texto, `main` = accent).
  `AppProviders` (`providers.tsx`) chama `createAppTheme(comercioMuiThemeOptions, {
  palette: { primary } })` — só a cor de marca é dinâmica; `shape.borderRadius`,
  superfícies, sidebar e semântica vêm do preset (não duplicar em `providers.tsx`).
  CityboxMuiProvider withCssBaseline=false enquanto Tailwind/shadcn coexistirem.
```

### 5.4 Tema no app
```
ThemeProvider (attribute="class", defaultTheme="light", enableSystem={false}).
Toggle: shell/theme-mode-switch.tsx (botão ghost ícone Moon/Sun).
Dark: overrides em comercio-theme.css sob html.dark[data-comercio-theme].
Não injetar tema dentro do pacote @citybox/ui.
```

### 5.5 Shell Dual MUI
```
Usar DualDashboardLayout + DualSidebar (@citybox/mui) com panelOpen controlado
no layout (não só pathname).
Rail sempre comprimido (só ícones); fechar a coluna 2 não expande a coluna 1.
Itens com panelGroups: clique no rail abre coluna 2 sem navegar; navegação só pelos leaves.
Itens sem painel: clique no rail navega normalmente.
Botão toggle acima do footer (Meu plano) fecha/abre a coluna 2 e permanece no rail.
Header full-bleed via slot header={ <ComercioHeader /> } (`@citybox/mui`: switchers, `CommandPalette`, `NavUser`).
Não reintroduzir AppSidebarDual do @citybox/ui no shell.
Não reintroduzir smoke-test como home — `/` redireciona para /visao-geral.
Nav/menus vivem em lib/navigation.ts — atualizar lá ao adicionar rotas.
```

---

## 6. Padrões de Código

- Componentes de UI de domínio: preferir `@citybox/ui` (atoms/molecules/organisms) **até migrarem**.
- Shell: `ComercioErpLayout` (`DualDashboardLayout` / `DualSidebar` de `@citybox/mui`) + `ComercioHeader` + `ComercioPanelMenu` (MUI).
- Campos numéricos (qtd, %, peso, casas decimais): `NumberInput` de `@citybox/ui/molecules` — **não** `Input type="number"`.
- Listagens MUI: `DataTable` + `ListPagePanel` de `@/components/ui/data-table` (wrapper `@citybox/mui`).
- Listagens ainda shadcn: `@/components/ui/data-table-shadcn` (TanStack + atoms `@citybox/ui`).
- Estilos das features: tokens OKLCH via `@citybox/ui/styles` + `comercio-theme.css`.
- Páginas novas: `PlaceholderPage` até haver domínio; domínio real em `features/<name>/`.
- Listagens: DataTable local com paginação server-side; busca debounce 400ms; filtros em Drawer.
- **`GUIA.md` por feature (obrigatório):** manual de negócio p/ leigo em `features/<name>/GUIA.md` — criar ao nascer a feature, atualizar quando o comportamento visível mudar; sem termos técnicos (ver §4.5).
- **Loading em botões com requisição (obrigatório):** todo botão que dispara mutate/fetch (Salvar, Excluir, Confirmar, etc.) deve mostrar loader até a Promise terminar.
  - Preferir `loading={isPending}` no `Button` de `@citybox/mui` (spinner nativo MUI) + `disabled` enquanto pendente.
  - Forms com `EntityFormFooter`: passar `isSaving={createMutation.isPending || updateMutation.isPending}` (o footer aplica `loading` no Salvar).
  - Confirmações: `ConfirmationDialog` / `RowActionsMenu.confirmDelete` com `onConfirm` **async** (`await mutateAsync`) — o dialog já propaga `loading`.
  - Não usar só troca de label (`"Salvando…"`) sem o spinner; não deixar o usuário clicar de novo enquanto a request roda.

---

## 7. Variáveis de Ambiente

| Variável | Escopo | Obrigatória | Descrição    |
| -------- | ------ | ----------- | ------------ |
| `PORT`   | server | ➖ (3107)   | Porta do app |
| `ERP_API_URL` | server | ➖ | Base da `erp-api` usada pelo proxy (default `http://127.0.0.1:3114/api`) |
| `FISCAL_API_URL` | server | ➖ | Base da `services/fiscal-api` usada pelo proxy `/api/proxy/fiscal` (default `http://127.0.0.1:3116/api`) — ver `features/facilita-nfe` |
| `KEYCLOAK_FISCAL_M2M_CLIENT_SECRET` | server | ✅ (rotas fiscais com `companyId`) | Secret do client Keycloak `fiscal-m2m` (realm `citybox-erp`, Service Accounts, role `fiscal_operator`) — o proxy `/api/proxy/fiscal` autentica com ele (client_credentials), não com o token do usuário, nas rotas com dono verificado (ver §4.5 `features/fiscal-*`, 2026-08-13/14). Mesmo client que a `erp-api` usa para chamar a fiscal-api — **não** `citybox-fiscal-service` (client do extinto realm `citybox-dev`, dava "unauthorized", achado 2026-08-14) |
| `KEYCLOAK_FISCAL_M2M_CLIENT_ID` | server | ➖ (`fiscal-m2m`) | Client id do client de serviço acima — só precisa mudar se o client for renomeado |
| `NEXT_PUBLIC_KEYCLOAK_ISSUER` | público | ✅ | Issuer do realm — o browser monta a URL de `authorize` com ele |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT` | público | ✅ | `erp-web` no realm dedicado `citybox-erp` (confidential + PKCE S256) |
| `NEXT_PUBLIC_BACKOFFICE_ORIGIN` | público | ✅ | Origem do app — base dos redirects OAuth e do logout |
| `KEYCLOAK_CLIENT_SECRET` | server | ✅ | Secret do client `erp-web`. **Nunca** prefixar com `NEXT_PUBLIC_` |
| `KEYCLOAK_INTERNAL_ISSUER` | server | ➖ | Issuer interno servidor→Keycloak (evita hairpin de proxy) |
| `COOKIE_SECURE` | server | ➖ | Força cookies `secure` fora de produção |

Referência: `.env.example`. O `.env` local é gitignored.

---

## 8. Scripts

```bash
pnpm --filter @citybox/erp-web dev         # next dev -p 3107
pnpm --filter @citybox/erp-web build        # next build
pnpm --filter @citybox/erp-web start        # next start -p 3107
pnpm --filter @citybox/erp-web typecheck    # tsc --noEmit
pnpm --filter @citybox/erp-web lint         # tsc --noEmit && eslint .
```

---

## 9. Módulos Implementados

| Área              | Status     | Notas                                              |
| ----------------- | ---------- | -------------------------------------------------- |
| Scaffold Next     | 🟢         | App Router + shell MUI + features `@citybox/ui`        |
| Tema (next-themes)| 🟢         | light padrão; toggle header; `enableSystem=false`  |
| Shell Dual        | 🟢         | **MUI** `DualSidebar` + `DualDashboardLayout`; **sem** NavUser no rail |
| Header            | 🟢         | **MUI** — switchers, `CommandPalette`, theme, ajuda, notif, `NavUser` |
| Tema por loja     | 🟢         | mock 3 lojas; gradiente primary→dark nos botões e Logo |
| Placeholders      | 🟢         | demais rotas do menu + `/perfil` + subrotas de Estoque/Vendas/Finanças/PDV |
| Pontos de venda   | 🟡 misto | painel Dual; **Cadastros via API** (`pos-registers` → `/v1/pos-terminals`); **caixa = Usuários & Permissões** (`pdvCode` + PIN no Membership); **Alçadas via API** (`pos-policies` → `/v1/pos-policy`); Gerenciar Caixas (`pos-cash-sessions` → `/v1/pos-cash-sessions`); KDS (`kds`, mock); demais leaves placeholder |
| KDS               | 🟢 **MUI** | `/ponto-de-venda/kds` (+ `/[id]/produtos`) — CRUD mock + inativar; vínculo de produtos sobre o catálogo real |
| Dados da empresa  | 🟢 **MUI+API** | `/configuracoes/dados-empresa` — Cadastro via `GET/PUT /v1/organizations/current`; Cobrança/Uso Em breve; `brandColor` localStorage |
| Unidades e Filiais| 🟢 **MUI+API** | `/configuracoes/unidades-filiais` (+ `/nova` + `/[id]`) — React Query → `/v1/branches`; soft-delete; matriz protegida |
| Finanças (nav) | 🟢 | painel coluna 2; **8 features reais 100% MUI** (extrato, grupo, plano, DRE, análise por centro de custo, contas, lançamentos, centro de custo); demais placeholders |
| Extrato | 🟢 **MUI+API** | `GET /v1/financial-entries` (estendido) + `GET /v1/financial-entries/summary` (novo) + `GET /v1/bank-accounts` (`/financas/extratos`): filtro competência/vencimento/tipo/status/categoria/centro de custo/conta bancária, cards de resumo, saldo por conta, seleção com soma — somente leitura |
| Contas bancárias | 🟢 **MUI+API** | saldo real + Nova/editar conta (`Drawer` + `ProductUnitsDrawer`) + detalhe tabs Transações/Histórico paginados + transferência real (`/financas/contas-bancarias` + `/[id]`) |
| Lançamentos | 🟢 **MUI+API** | unifica pagar/receber + rateio de pagamentos/categorias (persistido) + anexos reais (MinIO) + Transferências (`/financas/lancamentos` + `/novo` + `/[id]`) |
| Conciliação bancária | 🟢 **MUI+API** | importar extrato OFX + conciliar por sugestão/busca manual (inclui lançamentos `paid` sem vínculo)/soma de N lançamentos/criar lançamento/excluir/desfazer + filtro de período (`/financas/conciliacao-bancaria` + `/[id]`); cards + drawer com filtros completos/tabela + painel "Registros sugeridos" (2026-08-11); filtro/busca avançada e download de extrato (US7) ainda não têm UI |
| Facilita NF-e | 🟡 **MUI+API (parcial)** | `/financas/facilita-nfe` — só aba "Emitido" real, via `services/fiscal-api` (novo proxy `/api/proxy/fiscal`, `GET /v1/fiscal-documents` + `/summary` novo); "Recebido"/"Histórico de Envios" placeholder por decisão explícita (spec `009-facilita-nfe-screen`) |
| Fiscal (certificado) | 🟢 **MUI+API** | `/configuracoes/fiscal?aba=certificado` — certificado digital A1 (`services/fiscal-api`); upload multipart (`fiscalUpload`), provisionamento do Emitente da filial matriz, vigente + histórico somente-leitura (spec `erp/010-fiscal-certificate-screen`). Front sem testes (sem harness); backend do presenter testado |
| Fiscal (séries) | 🟢 **MUI+API** | `/configuracoes/fiscal?aba=series` — séries/numeração (`services/fiscal-api` `fiscal-sequences`); lista com filtro de ambiente, criar, ajustar número (só aumentar + confirmação), desativar/reativar, excluir (só nº 0) (spec `erp/011-fiscal-invoice-series`). Front sem testes; backend testado (13 specs) |
| Fiscal (configurações gerais) | 🟢 **MUI+API** | `/configuracoes/fiscal?aba=geral` — dados do Emitente (regime/IE/IM/ambiente/autXML/NFS-e nacional via `PATCH /v1/companies/:id`) + CSC write-only (`PUT …/csc`); campos sem backend "em breve" (spec `erp/012-fiscal-general-settings`). Front sem testes; contrato de update testado (fiscal-api) |
| Fiscal (tipo NF do PDV) | 🟢 **MUI+API (config)** | `/configuracoes/fiscal?aba=pdv` — modelo emitido pelo PDV (55/65) via erp-api `pos-fiscal-settings`; bloqueio Modelo 65 sem CSC, aviso de certificado (spec `erp/013-pos-fiscal-document-type`). ⚠️ **consumo/emissão no PDV deferido** (app Flutter/legado). Front sem testes; erp-api testado (4 specs) |
| Relat. resultados | 🟢 **MUI+API** | DRE real (`GET /v1/reports/income-statement`, `/financas/relatorios-de-resultados`): `DateRangePicker` + árvore Grupo → Plano, agregada por competência no backend |
| Análise centro de custo | 🟢 **MUI+API** | `GET /v1/reports/cost-centers` (`/financas/analise-centro-de-custo`, novo): valor/percentual por centro de custo, filtro Despesa/Receita, barra `LinearProgress` |
| Grupo financeiro  | 🟢 **MUI+API** | React Query → `/v1/financial-groups`; abas Ativos/Excluídos; Dialog CRUD; filtro Tipo |
| Plano de contas   | 🟢 **MUI+API** | React Query → `/v1/chart-of-accounts`; abas Ativos/Excluídos; Dialog CRUD |
| Centro de custo   | 🟢 **MUI+API** | React Query → `/v1/cost-centers`; abas Ativos/Excluídos; Dialog CRUD |
| Contratos cartões | 🟢 **MUI+API** | React Query → `/v1/card-contracts` + payment-methods; abas Ativos/Excluídos; `bankAccountId` + centavos; **2026-08-06:** cadastro passa a produzir efeito real no fechamento de venda (motor de recebíveis, backend) |
| Vendas (nav)      | 🟢         | painel coluna 2; Vendas, Pedidos, Promoções e Contratos reais; demais placeholders |
| Pedidos de venda  | 🟢 **MUI** | lista + Novo pedido (`/vendas/pedidos-de-venda` + `/novo`) — zero shadcn |
| Contratos de venda| 🟢 **MUI** | lista + novo/editar + drawer Status (`/vendas/contratos-de-vendas` + `/novo` + `/[id]`) — zero shadcn |
| Ordens de serviço | 🟢 **MUI** | lista + novo/editar + drawer Status (`/vendas/ordem-de-servicos` + `/novo` + `/[id]`) — zero shadcn; tabs por etapa; gerar venda → dialog pagamento |
| Promoções         | 🟢 **MUI** | lista + novo/editar wizard 3 passos (`/vendas/promocoes` + `/novo` + `/[id]`) — zero shadcn; Cupom baixar CSV |
| Vendas            | 🟢 **MUI+API** | lista enxuta (`/vendas`) — mesmos endpoints de pedidos (`/v1/sale-orders`); PDF/impressão; Nova venda (`/vendas/novo`) com Status travado em "Fechado" |
| Pedidos de venda  | 🟢 **MUI+API** | React Query → `/v1/sale-orders`; baixa estoque no `closed`; pagamentos no documento |
| Ordens de serviço | 🟢 **MUI+API** | React Query → `/v1/service-orders` + generate-sale |
| Contratos         | 🟢 **MUI+API** | React Query → `/v1/sales-contracts` + parcelas na API |
| Promoções         | 🟢 **MUI+API** | React Query → `/v1/promotions` (rulesJson; preview stub) |
| Contas bancárias  | 🟢 **MUI+API** | React Query → `/v1/bank-accounts` + `/transactions` + `/statement`; saldo real, extrato/transações paginados, `POST /v1/bank-transfers` real |
| Lançamentos       | 🟢 **MUI+API** | React Query → `/v1/financial-entries`; create/update/delete/restore + payments[]/allocations[] persistidos + anexos (`/attachments`) + `readOnly` quando gerado por venda (receivable ao fechar venda); pagamentos geram movimentação na conta bancária vinculada (RN-12); **2026-08-06:** exibe Bruto/Taxa/Líquido + badge de aviso nos recebíveis do motor de recebíveis do contrato de cartões |
| Produtos          | 🟢 **real**| lista + novo + edição `/catalogo/produtos/[id]` — **integrado à `erp-api`** (React Query + Zustand); núcleo + unidades + fornecedores + imagem MinIO (ver §4.5) |
| Estoque (nav)     | 🟢         | painel coluna 2 + placeholders das subrotas        |
| Clientes          | 🟢         | lista CRM + Novo cliente MUI (`/clientes` + `/novo`); categoria CRUD Dialog MUI (`/clientes/categoria`) |
| Estoque (tela)    | 🟢         | lista + criar/editar (`/estoque` + `/novo` + `/[id]`); unidades via drawer de products |
| Balanço           | 🟢         | saldo por produto (`/estoque/[id]/balanco`) + drawer histórico por produto |
| Inventário        | 🟢         | lista + contagem + detalhe (`/estoque/[id]/inventario`); finalizar ajusta saldo |
| Movimentações     | 🟢         | lista + registrar entrada/saída (`/estoque/movimentacoes` + `/novo`) + drawer de detalhe (usuário + itens) |
| Transferências    | 🟢         | lista + create + cancel **via API** (`/estoque/transferencias` + `/novo`) |
| Compras           | 🟢         | lista + CRUD **via API** (`/estoque/compras` + `/novo` + `/[id]`); payments stub; entrada ledger no receive |
| Transportadoras   | 🟢         | lista + CRUD **via API** (`/estoque/transportadoras` + `/novo` + `/[id]`); selects unificados |
| Fornecedores      | 🟢         | lista Ativos/Excluídos + criar/editar (`/estoque/fornecedores` + `/novo` + `/[id]`); SUFRAMA + observação + unidades |
| Produção          | 🟢 **real**| tela única (`/estoque/producao`) via `/v1/production-orders`; Kanban/Lista; BOM da ficha; ledger no finalize |
| Cat. movimentação | 🟢         | CRUD drawer (`/estoque/categorias-de-movimentacao`) |
| Variações         | 🟢         | lista + drawer Nova/Editar em MUI (`/catalogo/variacoes-e-opcoes`); forms compartilhados com cadastro de produto |
| Fichas técnicas   | 🟢 **real**| lista + detalhe via `/v1/technical-sheets`; insumos = products supply |
| Categorias        | 🟢 **real**| CRUD drawer (`/catalogo/categorias`) — **integrado à `erp-api`** |
| Unidade de medida | 🟢 **real**| CRUD drawer (`/catalogo/unidade-de-medida`) — **integrado à API** |
| Parâmetros fiscais| 🟢 **real**| listagem + detalhe via `/v1/fiscal-parameters` |
| Lista de preços   | 🟢 **real**| listagem + detalhe/itens via `/v1/price-lists` |
| Home              | 🟢         | `/` → redirect `/visao-geral`                      |
| Auth (Keycloak)   | 🟢 **real** | Login SSO com PKCE, cookies httpOnly, `proxy.ts` barrando rota privada, logout SSO; páginas `/login`, `/auth/callback`, `/auth/sso`, `/entrada` |
| Empresa / unidade | 🟢 **real** | `OrganizationProvider` + `needsBranchSelection` / `accessesAllBranches`; `/entrada` → 0/1/N unidades; `/selecionar-unidade` · `/sem-unidade`; BranchSwitcher: "Todas as unidades" só OWNER/ADMIN |
| APIs              | 🟢 **real** | Proxy `/api/proxy/comercio`; **Produtos**, **Categorias**, **Unidade de medida** + derivados de catálogo (fichas/fiscais/preços) |

---

## 10. Decisões de Arquitetura

| Data       | Decisão                                      | Motivo                                                                 |
| ---------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| 2026-08-09 | **Bandeira do pagamento em `financial-entries` também vira `Select` fechado sobre `CARD_BRAND_OPTIONS`** (spec `007-financeiro-ajustes-ui` US9), alinhando com a decisão de 2026-08-06 abaixo — a distinção "select fechado (venda) vs. texto livre (lançamento manual)" que motivou a decisão anterior deixou de existir por pedido explícito do usuário (Clarification 2026-08-09: "pode usar o mesmo card brand options") | Reduz divergência de dado entre os dois pontos de captura de bandeira; catálogo ampliado com 5 opções novas (Sorocred, Credicard, Ticket, VR Benefícios, Banricompras) sem remover nenhuma das 10 já existentes, preservando `value`s persistidos |
| 2026-08-06 | **Bandeira do pagamento em `sales-orders` é `Select` sobre catálogo fixo compartilhado, não `Autocomplete` livre** (diferente do campo `cardBrand` de `financial-entries`, que era texto livre com sugestões até 2026-08-09, ver linha acima) | O campo de `sales-orders` alimenta o motor de recebíveis (`FR-004` — precisa bater exatamente com `CardPaymentMethod.brand` para o matching funcionar); o de `financial-entries` era só informativo num lançamento manual, sem matching a jusante. Reaproveitar `card-contracts/data/card-brands.ts` nos catálogos garante que o valor escolhido sempre exista como opção válida no cadastro |
| 2026-07-31 | **Dados de sistema (`isSystem`) no UI de finanças** — `cost-centers` / `financial-groups` / `chart-of-accounts` leem `isSystem` da API e desabilitam Excluir (`canRemove*`, mesmo padrão de `movement-categories`) | Alinha o front à proteção 409 da API / `store-setup` |
| 2026-07-31 | **Finanças suporte → API** — `cost-centers`, `financial-groups`, `chart-of-accounts`, `card-contracts` (React Query + abas Ativos/Excluídos + restore; formulários novos em grupos/plano; `bankAccountId` + centavos em contratos). Mocks de grupos/plano mantidos para `financial-results`/`financial-entries` | Cadastros de apoio do módulo finance da `erp-comercio-api` |
| 2026-07-28 | **Módulo Finanças (5 features reais) migrado para MUI** — `chart-of-accounts`, `financial-groups`, `bank-accounts`, `financial-results`, `financial-entries` (`@citybox/mui` + `@/components/ui/data-table`, `EntityFormHeader`/`EntityFormFooter`, `Drawer`/`Dialog` sempre montados, zero `@citybox/ui`/`lucide-react`/`data-table-shadcn` nessas pastas) | Paridade visual com catálogo/estoque/clientes; Vaul/ComboboxSelect substituídos por `Drawer`/`Autocomplete` MUI |
| 2026-07-27 | Shell Dual migra de `AppSidebarDual` (@citybox/ui) para `DualSidebar` + `DualDashboardLayout` (@citybox/mui); tema pluggable `comercioMuiTheme`; features continuam em shadcn | 1ª fatia da substituição UI→MUI; CssBaseline off para coexistir com Tailwind |
| 2026-07-27 | **Auth: BFF próprio com PKCE + cookies httpOnly** (sem NextAuth), client Keycloak **próprio** `citybox-erp-comercio` | Mesmo padrão de `apps/erp`/`admin`; secret separado do backoffice — vazamento em um app não atinge o outro |
| 2026-07-27 | **`src/proxy.ts` (middleware) checando presença do cookie**, ao contrário do `apps/erp` que é só client-side | Redireciona antes de servir HTML privado: sem flash de tela protegida. Validação real segue nos route handlers e na API |
| 2026-07-27 | **Escopo ativo em `localStorage` + headers `X-Organization-Id`/`X-Branch-Id`** (cliente escolhe, API valida) | O `TenantContextGuard` já confere `Membership` e `BranchAccess` a cada request; validar de novo no proxy custaria um round-trip sem ganho de segurança |
| 2026-07-27 | **Sessão sem permissões no payload** — só identidade e validade | Autorização do ERP vive no `Membership` (banco da API), não em claims do token (ver `../api/AGENTS.md` §5.10) |
| 2026-07-27 | **Tema por loja removido** (`apply-store-theme`, `MOCK_STORES` no shell) | Organizações reais não têm cor no backend; o app passa a usar a paleta padrão. `lib/stores.ts` fica só para `features/fiscal-parameters` (mock) |
| 2026-07-23 | Feature `production`: fluxo Pedido → Produção → Finalização desenhado do zero (ConnectPlug não documenta essas telas); finalização chama `createStockMovement` 2× (saída insumos + entrada produto) em vez de `applyStockMovement` avulso | Um único ponto de verdade para saldo E histórico de Movimentações; menos acoplamento a criar |
| 2026-07-23 | Feature `purchases`: estoque só atualiza com status Recebido; Contas a Pagar via `payableTitle` mock + toast | Finanças ainda placeholder; regra de negócio da entrega sem inventar módulo financeiro |
| 2026-07-23 | Feature `stock-transfers`: lista Ativas/Canceladas + cancelar na linha; form Nova com saída/entrada | Remanejamento entre estoques (ConnectPlug ERP 2.0) |
| 2026-07-23 | Feature `stock-movements`: tela única Entrada/Saída (tipo no formulário) + lista com tabs | Alinha ConnectPlug ERP 2.0; unifica fluxos separados da v1 |
| 2026-07-23 | Feature `stock` (tela de estoque) reaproveita o `ProductUnitsDrawer` de `features/products` para selecionar unidades/filiais | Reuso do drawer de unidades já pronto (filtro UF + checkboxes); evita duplicar componente |
| 2026-07-23 | Exclusão de estoque bloqueada quando `isDefault` ou `hasMovements` (`canRemoveStock`) | Convenção de ERP: preserva o estoque padrão e a rastreabilidade de saldo/movimentações |
| 2026-07-23 | Saldo por estoque (`stock-balance.service`) é a fonte única de Balanço + Inventário; movimentações e inventário ajustam esse saldo | Coerência: entrada/saída/contagem refletem no mesmo saldo |
| 2026-07-23 | Atalhos "Registrar entrada/saída" abrem a tela unificada de movimentação com tipo+estoque pré-preenchidos (via query) em vez de telas separadas | Concilia os 2 atalhos do dropdown com o fluxo unificado do ERP 2.0 |
| 2026-07-23 | Composição das variações (ficha técnica) deriva das variações vinculadas ao produto (`mock-product-variations` + catálogo) em vez de mock fixo | Aderência ao fluxo modular do ConnectPlug ERP 2.0 (etapa 4→5) |
| 2026-07-23 | `ProductAttachedVariation` ganha override por produto (min/máx + preço adicional/código por opção); UI "Configuração da grade" | ConnectPlug permite reajustar qtd/preço específicos do produto |
| 2026-07-23 | Unidade de medida do produto integrada à feature `unit-of-measure`; quantidade do insumo respeita casas decimais da unidade | Fonte única de unidades; precisão coerente com o cadastro |
| 2026-07-23 | Catálogo — 4 features via orquestração (workflow): `categories`, `unit-of-measure`, `fiscal-parameters`, `price-lists` | Categorias/Unidade/Fiscais/Lista de preços saem do placeholder |
| 2026-07-23 | Lista de preços: detalhe começa sem produtos (usuário seleciona via "Gerenciar produtos"); edição de valores em lote; priorização DnD | Alinha com o fluxo do ConnectPlug ERP 2.0 |
| 2026-07-23 | Parâmetros/Fichas técnicas seguem molde lista→detalhe; Categorias/Unidade seguem molde CRUD-drawer | Reuso de padrão; só CRUD para dados de suporte |
| 2026-07-23 | `GUIA.md` obrigatório por feature (manual de negócio p/ leigo, sem termos técnicos) | Onboarding do usuário final; separado da doc técnica (`AGENTS.md`) |
| 2026-07-23 | Feature `technical-sheets` (lista + detalhe/composição) ref. ConnectPlug ERP 2.0 | Fichas técnicas sai do placeholder |
| 2026-07-23 | Aba "Produção" = `productionType === "productive_process"`; lista exclui insumos (`supply`) | Semântica: indústria com ordem de produção; insumo não tem ficha própria |
| 2026-07-23 | Composição reusa padrão DnD `@dnd-kit` dos adicionais (`ComponentSortableRow` + `ComponentListEditor`) | Consistência com cadastro de produto |
| 2026-07-23 | Aba Sugestões no Novo produto: layout left/right + lista DnD de produtos relacionados | Completa as 4 abas do cadastro mock |
| 2026-07-23 | Aba Adicionais no Novo produto: layout left/right + lista DnD (`@dnd-kit`) | Mesmo padrão de Dados básicos / variações |
| 2026-07-23 | Aba Variações do produto reusa catálogo `features/variations` (mesmo drawer, steps internos) | Evita duplicar formulários |
| 2026-07-23 | Feature `variations`: lista + drawer xl com opções DnD | Catálogo: Variações e opções sai do placeholder |
| 2026-07-23 | Cadastro Novo produto: form mock + footer dirty/save sticky na área de conteúdo | Sem portal full-viewport; 4 abas do form |
| 2026-07-22 | DataTable local em `components/ui` + layout flat produtos (ref. Vehicles) | Sem organism DataTable do DS |
| 2026-07-22 | Feature `products`: listagem mock + sheets Importar/Filtro | `/catalogo/produtos` sai do placeholder |
| 2026-07-22 | Dark mode: `ThemeModeSwitch` no header + overrides `html.dark[data-comercio-theme]` | Light padrão; `enableSystem=false` |
| 2026-07-22 | App separado `erp-comercio` (:3110)           | Scaffold de comércio distinto do ERP multi-vertical (:3107)            |
| 2026-07-22 | Setup canônico `@citybox/ui` (source + ThemeProvider) | Mesmo padrão documentado em `packages/ui/AGENTS.md` §7          |
| 2026-07-22 | Tema multicor por loja: `comercio-theme.css` + `applyStoreTheme` + Logo `brandColor` | 3 lojas mock (food/varejo) |
| 2026-07-22 | Header full-bleed: StoreSwitcher + Command + user no header | User sai do rail Dual |
| 2026-07-22 | `AppSidebarDual` `railVariant="expandable"`   | Coluna 1 com labels sem painel; compacta quando coluna 2 abre          |
| 2026-07-22 | `panelOpen` derivado do pathname              | Painel só quando o módulo ativo tem `panelGroups`                      |

---

## 11. Contexto para a IA

### O que NÃO fazer
- Não instalar com npm/yarn nem commitar `package-lock.json` / `node_modules`.
- Não recriar o shell Dual com `AppSidebarDual` do `@citybox/ui` — usar `@citybox/mui`.
- Não recriar primitivos de `@citybox/ui` nas features (ainda).
- Não hardcodar cores — usar tokens MUI no shell / tokens Tailwind nas features.
- Não esquecer `transpilePackages` de **ambos** `@citybox/ui` e `@citybox/mui`.
- Não adicionar item de menu sem rota placeholder + entrada em `lib/navigation.ts`.
- **Não usar `fetch` cru para a API** — use `comercioFetch` ou `lib/api/tenancy.ts` (passam por `fetchWithSession`).
- **Não guardar token em `localStorage`** — a sessão é cookie httpOnly (§5.0).
- **Não criar rota privada sem conferir `PUBLIC_PREFIXES`** no `src/proxy.ts`.
- Não reintroduzir `useComercioStore()` — o escopo agora é `useOrganization()`/`useCatalogScope()`.

### Ao evoluir o app
1. Shell / layout → `@citybox/mui`. Features → `@citybox/ui` até migrarem.
2. Novos módulos: `navigation.ts` → rota fina → `features/<feature>/` (ou PlaceholderPage).
3. Criar/atualizar o **`GUIA.md`** da feature (manual de negócio p/ leigo, sem termos técnicos — ver §4.5) na mesma operação.
4. Auth e proxy já estão no padrão do monorepo (§5.0) — estender, não recriar.
5. Atualizar este `AGENTS.md` e a raiz se porta/estrutura mudarem.

---

## 12. Histórico de Mudanças Estruturais

| Data       | Mudança                                              | Impacto                |
| ---------- | ---------------------------------------------------- | ---------------------- |
| 2026-08-20 | **Correções OS/Conciliação/Clientes (spec erp/031):** `linesForGenerateSale()` inclui linhas de serviço (D1); "Cliente ou fornecedor" da Conciliação bancária vira `Autocomplete` real com `customerId`/`supplierId` (D2); listagem de Clientes ganha ação **Editar** visível por linha (D3, funcionalidade já existia — gap era só de descoberta) | `service-orders/api/service-order.mapper.ts`; `service-orders/components/service-order-payment-dialog.tsx`; `bank-reconciliation/{components,types}/*`; `customers/components/customer-list-table.tsx` |
| 2026-08-15 | **Destinatário completo + feedback honesto (spec erp/028):** B1 — novo resolvedor `getCustomerNfeFiscalInfoApi`/`CustomerNfeFiscalInfo` (endereço do destinatário na NF-e, causa raiz do `719`); `lib/ibge-lookup.ts` movido de `features/fiscal-certificate/lib/` para `src/lib/` (DRY). B2 — toast honesto: `AUTHORIZED`→sucesso, qualquer outro status→`toast.warning` com status traduzido + código/mensagem do órgão (reusa `resolveFiscalDocumentStatusLabel` do Facilita NF-e); depende de `errorCode`/`errorMessage` novos na erp-api (ver `apps/erp/api/AGENTS.md`, migration). B3 — botões de emitir ganham `variant="contained"` | `features/nfe-issuance/{api,hooks,pages}/*`; `features/nfse-issuance/{api,pages}/*`; `features/fiscal-certificate/lib/build-provision-payload.ts`; `lib/ibge-lookup.ts` (novo) |
| 2026-08-15 | **Destrava emissão de vendas (spec erp/027):** causa raiz era `FISCAL_API_URL` mal configurado na erp-api (ver `apps/erp/api/AGENTS.md`) — sem mudança de lógica no `erp-web`. **B2** subtítulo fixo de `nfse-issuance-page.tsx` removido (contradizia o `Chip` de ambiente real). **B3** `noOptionsText` dos dois `Autocomplete` (NFS-e/NF-e) trocou texto em inglês por português, **sem link embutido** (achado do react-reviewer: link dentro de `noOptionsText` do MUI Autocomplete é inacessível por teclado — fica fora do `listboxRef` que segura foco no blur); atalho movido para `Alert` separado fora do popper | `features/nfse-issuance/pages/nfse-issuance-page.tsx`; `features/nfe-issuance/pages/nfe-issuance-page.tsx` |
| 2026-08-15 | **Emissão de NF-e pela tela de Vendas (spec erp/026):** `/vendas/nfe` deixa de ser placeholder — nova `features/nfe-issuance` emite NF-e a partir de um pedido de venda fechado, com ICMS/PIS-COFINS/IPI reais resolvidos do cadastro fiscal do produto (não fallback zerado/dado manual, como a emissão via Swagger expunha). Prévia (`GET /v1/nfe-issuances/preview`) mostra avisos de fallback por item/tributo sem bloquear. `POST /v1/nfe` da fiscal-api ganhou os campos que faltavam (ver `services/fiscal-api/AGENTS.md`); erp-api ganhou o módulo `nfe-issuance` (ver `apps/erp/api/AGENTS.md`) | `features/nfe-issuance/**`; `app/(app)/vendas/nfe/page.tsx`; `lib/navigation.ts` (remove `disabled` do leaf NF-e) |
| 2026-08-15 | **Emissão de vendas + padrão visual (spec erp/025):** **P1** (erp-api) — token de serviço M2M próprio na erp-api pra chamar a fiscal-api, substituindo o `FISCAL_API_TOKEN` estático/`dev-admin`; erro de autenticação agora tem log e mensagem distintos (`[FiscalAuth]`) em vez de cair no catch genérico de transporte. **P2** — `useFiscalCompany()` expõe `defaultEnvironment` real; `NfseIssuancePage` mostra o ambiente real e bloqueia Emitir se PRODUCTION (backend já recusava; agora a UI evita o usuário só descobrir no 422), `EmptyState` quando não há Grupo de ISSQN. **P3** — rodapé "Salvar" das 10 telas do Menu Fiscal padronizado com `EntityFormFooter` mode `dirty` + `position: sticky`; bugfix real em `entity-form-footer.tsx` (`saveDisabled` era ignorado em `mode="dirty"`) | `entity-form-footer.tsx`; `features/facilita-nfe/hooks/use-fiscal-company.ts`; `features/nfse-issuance/pages/nfse-issuance-page.tsx`; `features/{fiscal-settings,pos-fiscal-document-type,fiscal-default-taxes,fiscal-icms-group,fiscal-ipi-group,fiscal-pis-cofins-group,fiscal-issqn-group,fiscal-operation-natures}`; `apps/erp/api` (ver `apps/erp/api/AGENTS.md`) |
| 2026-08-16 | **Acoplamento invertido resolvido + limpeza de código morto.** Vendas, Contratos e OS importavam de dentro de Compras e Movimentações — apagar mock do Estoque quebrava três features de Vendas. Desfeito: **`lib/option-types.ts` (novo)** recebe `PaymentMethodOption`/`BankAccountOption`/`CostCenterOption`/`FinanceCategoryOption`/`WarehouseOption`, que moravam em `purchases/types/purchase.ts` por acidente histórico e eram consumidos por ~10 features (Finanças, Vendas, OS, conciliação, extrato) — quase todas **menos** Compras; `mock-payment-methods.ts` + `listPaymentMethods` foram para `sales-orders/data/` (dono real: pedidos, contratos e OS); `listAvailableProducts` virou `sales-contracts/data/mock-available-products.ts` (consumidor único). **Removidos por estarem mortos:** `purchase.service.ts` inteiro e `stock-movement.service.ts` inteiro, `mock-stocks.ts`, `mock-warehouses.ts`, `current-user.ts`, e `mock-{bank-accounts,cost-centers,finance-categories}.ts` — estes três ficaram sem consumidor quando o painel de Pagamentos saiu. **Duplicações eliminadas:** `br-states.ts` (idêntico byte a byte em carriers/suppliers) → `BR_STATES` em `lib/br-format.ts`, que já era dono de `BR_STATE_OPTIONS`; `date.ts` (triplicado em suppliers/customers/production) → `lib/date.ts`; `WarehouseOption` (declarado 3×, com `sales-orders` importando arbitrariamente a cópia de `purchases`) → `lib/option-types.ts` | Mudança **só de tipo e de caminho** — zero runtime. O compilador prova a completude. `purchases/` e `stock/` perderam a pasta `data/`, e ambas as features perderam `services/` |
| 2026-08-16 | **`perPage: 100` deixa de ser usado como "traz tudo".** `MAX_PER_PAGE` é **teto** da API, não "sem limite" — pedir a primeira página e assumir que veio tudo truncava em silêncio, sem paginação, sem "carregar mais" e sem aviso. Corrigido em 4 frentes: (1) **options de transportadora e fornecedor** (`listCarrierOptions`/`listActiveSuppliers`) percorrem todas as páginas — acima de 100 cadastros o item **não era selecionável**, o pior caso porque bloqueia operação; (2) **`useAllStocksQuery`** novo (`listAllStocksApi`) substitui `useStocksQuery({perPage:100})` nos **8 selects** de movimentação, transferência, compra, produção, venda e OS; (3) **saldo nos formulários** de movimentação e transferência passa a usar `useFullStockBalanceQuery` — com uma página de 100, produto fora dela exibia "Saldo 0" indistinguível de zero real, e o operador ou deixava de registrar a saída ou duplicava a entrada; (4) **cards do balanço** deixam de contar 100 itens no cliente e passam a ler `meta.total` de três consultas com `perPage=1` filtradas por status — antes um depósito de 400 SKUs mostrava "400 produtos / 12 sem saldo", números que se contradiziam na mesma tela | `listStocksApi` continua existindo para listagem paginada de verdade. O `?? 0` do saldo agora é legítimo: `stock_balances` só tem linha para produto que já movimentou |
| 2026-08-16 | **Compras — painel de Pagamentos removido (decisão de produto).** O painel deixava o usuário escolher forma de pagamento, conta bancária e montar rateio por categoria/centro de custo, mostrava "Rateio restante R$ 0,00", salvava com sucesso — e o dado sumia ao reabrir. A investigação mostrou que **não é fio desligado**: o DTO de compra da `erp-api` não tem `payments`/`allocations` e **nenhum `FinancialEntry` é criado** ao salvar uma compra. Não existe integração Compras → Financeiro; construí-la é feature, não correção. Removidos o `PurchasePaymentsPanel` (arquivo deletado) e o consumo dos 4 mocks locais no formulário; o `GUIA.md` deixou de afirmar que "gera automaticamente um título em Contas a Pagar" (era falso) e passa a apontar para Finanças › Lançamentos. ⚠️ **`data/mock-{payment-methods,bank-accounts,cost-centers,finance-categories}.ts` e `services/purchase.service.ts` continuam no disco** — Compras não os usa mais, mas `sales-orders`, `sales-contracts` e `service-orders` importam de lá. É o acoplamento invertido já mapeado: mover/eliminar exige tocar essas 3 features. A plumbing de `payments`/`allocations` em `use-purchase-form`/`types` foi mantida de propósito — é a forma que a spec de Compras→Financeiro vai precisar de volta | Também documentado no GUIA que o recebimento é all-or-nothing (espelha o novo invariante da API) |
| 2026-08-16 | **Auditoria do Estoque — lote 2 (alto).** (1) **Falso empty-state eliminado em 6 telas**: estoques, transferências, inventários, compras, board de produção e os 2 drawers de movimentação ignoravam `isError` e exibiam "Nenhum registro" quando a API caía — o lojista concluía que tinha perdido o cadastro. Todos ganham `ListLoadErrorAlert` + retry, no molde de `stock-movement-list-page`; os hooks de transferências e compras passaram a **expor** `isError`/`refresh` (não expunham) e as duas tabelas a aceitar `isLoading`. O drawer de detalhe era o pior caso: misturava dado bom da lista ("8 produtos · R$ 1.240") com "Nenhum produto nesta movimentação" logo abaixo. (2) **`isFetching` deixa de ser usado como `isLoading`** no board de produção — a cada Iniciar/Finalizar/Cancelar o Kanban inteiro virava skeleton e remontava pelo `key`, com flash duplo (mesmo fix já aplicado em Produtos). (3) **Read-only da compra recebida virou real**: `pointerEvents: none` não bloqueia teclado, então Tab editava quantidade, custo, série, NF e fornecedor de uma compra que já deu entrada no estoque; e `PurchaseExtrasDialog`/`PurchaseReceiveConfirmDialog` renderizam **em portal**, fora da subárvore bloqueada, ficando 100% clicáveis. Agora: `fieldset disabled` (fecha o teclado e tira da ordem de tabulação) + os diálogos não são montados no modo leitura. Também removido `purchaseId: readOnly ? undefined : purchaseId` — zerar o id fazia o hook cair no ramo de **criação**, então qualquer save que escapasse gravaria uma compra duplicada em vez de falhar | 12 arquivos |
| 2026-08-16 | **Inventário deixa de zerar saldo real (auditoria do Estoque, achado crítico).** O payload é só `{ productId, countedQuantity }` — o servidor recalcula `systemQuantity` do ledger e trata a contagem como verdade. Mas a tela pré-preenchia `countedQuantity = balance?.quantity ?? 0` a partir de **uma página de 100** do balanço: produto fora do top-100 entrava com 0, a UI exibia "Sem divergência" (para ela sistema e contagem batiam) e o servidor calculava `0 − saldoReal` e **zerava o estoque** — em ação declarada irreversível. Novo `listAllStockBalanceApi` (percorre todas as páginas) + `useFullStockBalanceQuery` + `stockBalanceKeys.full`; **Finalizar** e **Adicionar produtos** bloqueados enquanto o balanço carrega ou falha, com `ListLoadErrorAlert` e retry | `inventory-create-page.tsx`, `stock-movements/api/stock-movements.service.ts`, `hooks/use-stock-movement-queries.ts`, `hooks/query-keys.ts`. ⚠️ O `?? 0` continua correto **depois** desta correção: `stock_balances` só tem linha para produto que já movimentou |
| 2026-08-16 | **Data da movimentação exibia um dia a menos.** A API grava `new Date('2026-08-16')` (meia-noite **UTC**) e o presenter devolve `toISOString()`; `toOperatedAtDate` relia com getters **locais** (`getFullYear`/`getMonth`/`getDate`). Em UTC−3 toda movimentação retrocedia um dia na lista, no drawer e no kardex — e na virada de ano retrocedia o **ano** (`2026-01-01` → `2025-12-31`). Trocado por leitura UTC-safe (`toISOString().slice(0,10)`), alinhando com o mapper de transferências | `stock-movements/api/stock-movement.mapper.ts`. O valor gravado sempre esteve certo — só a leitura errava, por isso passava despercebido |
| 2026-08-16 | **Formulário de movimentação parava de se auto-resetar.** `useEffect([initial])` reatribuía o objeto inteiro quando `initialWarehouseId` chegava (depois de `useStocksQuery` resolver), descartando categoria, data e produtos já digitados 1-2 s antes, sem aviso — o atalho "Registrar entrada/saída" do menu do depósito caía exatamente nisso. Passa a semear **só o campo vazio**, por ajuste durante o render. Mesmo tratamento aplicado a `use-stock-transfer-form` (que tinha a guarda mas ainda usava efeito) | `use-stock-movement-form.ts`, `use-stock-transfer-form.ts` |
| 2026-08-16 | **`setState` em efeito removido dos 4 drawers/dialogs de rascunho** (`purchase-extras-dialog`, `purchase-filters-drawer`, `purchase-receive-confirm-dialog`, `stock-transfer-filters-drawer`). O dep `value`/`lines` é referência nova a cada tecla no formulário, então o efeito **reescrevia o rascunho do usuário com o diálogo aberto** — no de recebimento, apagava as quantidades já conferidas. Trocado pelo padrão React de ajuste durante o render na transição fechado→aberto (mesma abordagem de `financial-statement`) | Zera os erros de `react-hooks/set-state-in-effect` em todo o escopo de Estoque — o lint do módulo estava vermelho |
| 2026-08-16 | **Fornecedores — CEP:** máscara `formatCep` + `useCustomerCepLookup` (`GET /v1/cep/:cep`) no form criar/editar; loading desabilita rua/bairro/cidade/UF; toast se a consulta falhar | `supplier-address-section.tsx`; GUIA.md |
| 2026-08-16 | **Drawer Gerenciar variação — layout:** passou a usar `Drawer.footer` (padding `px: 2` / `py: 1.5` do DS) em vez de um segundo chrome interno (`px: 3`/`py: 2` + footer próprio); gaps internos 1.5; bloco de opções sem card extra | `product-variants-drawer.tsx`; `product-variation-options-block.tsx` |
| 2026-08-16 | **Gerenciar variação no produto:** o drawer passava `variation`/`attached`/`onCreateRequested` para componentes que esperam `options`/`optionIds`/`onCreateNew` — crash `options is not iterable` ao abrir o drawer | `product-variants-drawer.tsx`; fallback `options=[]` em `product-variation-options-block.tsx` |
| 2026-08-14 | **Create usuário com nome único:** `splitFullName` deixava de duplicar o primeiro nome em `lastName` (causava `"Bruno Bruno"` na API) | `features/users-permissions/api/member.mapper.ts` |
| 2026-08-14 | **Duas exclusões do Menu Fiscal (spec erp/024):** Parte A — `fiscal-operation-natures` ganha ação Excluir (`RowActionsMenu`+`ConfirmationDialog`); Parte B — `csc-section.tsx` ganha "Remover CSC" com guard novo no proxy `/api/proxy/fiscal` (`lib/api/pos-fiscal-model-guard.ts`) que bloqueia (409) enquanto o PDV estiver em Modelo 65, consultando `GET /v1/pos-fiscal-settings` na erp-api com o token do usuário antes de repassar o `DELETE` à fiscal-api — a fiscal-api nunca aprende sobre `pos_fiscal_settings`. `fiscal-client.ts` ganha um branch em `extractErrorInfo` pro formato `{error:"code", message}` que esse guard usa (diferente do `{error:{code,message}}` da fiscal-api) | `app/api/proxy/fiscal/[...path]/route.ts`; `lib/api/fiscal-client.ts`; `features/fiscal-operation-natures`; `features/fiscal-settings` |
| 2026-08-14 | **`unauthorized` em produção na aba Certificado (hotfix pós-merge):** o merge de `main` (`a8041435b`) trouxe o refactor M2M por vertical, que cortou `erp-web`→`fiscal-api` do `docker-compose.yml` de propósito ("erp-web não fala com fiscal") esperando que as 6 telas fiscais restantes (certificados, séries, NFS-e, tipo de NF do PDV, regime do Emitente, configurações gerais) migrassem para o padrão erp-api-resolve-companyId — só a aba "Emitido" migrou de fato, e essas 6 continuaram no proxy antigo (`use-fiscal-company.ts`, restaurado no commit anterior desta mesma sessão). Sem `FISCAL_API_URL`/credencial no compose do `erp-web`, e com `KEYCLOAK_FISCAL_SERVICE_SECRET` apontando pro client `citybox-fiscal-service` do extinto realm `citybox-dev`, a aba caía com "unauthorized". **Hotfix (decisão do usuário, não migração completa):** `erp-web` volta a ter `FISCAL_API_URL` + `KEYCLOAK_FISCAL_M2M_CLIENT_ID`/`_SECRET` no compose, reusando o **mesmo** client `fiscal-m2m` que a `erp-api` já usa (único no allowlist da fiscal-api) em vez de reviver `citybox-fiscal-service`; `fiscal-service-token.ts` trocou os nomes das env vars. `depends_on: fiscal-api` passou de `service_started` para `service_healthy`. `lib/api/fiscal-tenant-guard.ts` não mudou — continua resolvendo `companyId` pela sessão do usuário, então isso não reabre acesso cross-tenant. **Pendente real:** migrar essas 6 telas para dentro da `erp-api` (como "Emitido" já foi) é o fix arquiteturalmente correto; o hotfix foi escolhido para desbloquear produção agora | `docker-compose.yml`; `platform-apps.env`; `lib/api/fiscal-service-token.ts`; §7 acima |
| 2026-08-16 | **Módulos PDV — um Delivery:** catálogo HTTP omite alias `delivery`; rótulo único no switch. GUIA atualizado. | `pos-module` catalog API + GUIA |
| 2026-08-16 | **Mesas/Comandas ocultos na nav PDV** até a feature existir: removidos `pdv-mesas`/`pdv-comandas` de `navigation.ts`; placeholders de rota mantidos. Espelho do force `tables`/`tabs` na erp-api (switches somem do catálogo HTTP). | `navigation.ts`, `pos-module-defaults-page` copy |
| 2026-08-15 | **Pedidos de venda — drawer Filtros:** Limpar/Aplicar em `Drawer.footer` (fixo ao scroll), molde `product-filters-drawer`. | `sale-order-filters-drawer.tsx` |
| 2026-08-15 | **Caixas — Código `#N` + Operador na venda:** `PosCashSale.number`/`operatorName` mapeados da API; UI deixa de usar UUID via `formatPosCashSaleCode(id)`; detalhe mostra Operador; rótulo “Natureza de operação” → **Status** (`statusLabel`). | |
| 2026-08-14 | **Conciliação bancária — excluir extrato, dedupe ignora excluídas, e cliente sem filtro de CRM (spec `006-bank-reconciliation` FR-044/FR-045/FR-046):** teste do usuário em produção expôs um **loop sem saída** — as transações do extrato legado foram excluídas (única ação disponível), o que travou a dedupe (`findExistingDedupeKeys` era por organização e contava excluídas), então reimportar o arquivo devolvia extratos **vazios**, e não havia rota nem UI para apagá-los. Três correções: (1) **FR-046** dedupe passa a ignorar `discarded`; (2) **FR-045** nova rota `DELETE /v1/bank-statements/:id` (204, hard delete de extrato+transações+arquivo, recusa 422 com conciliação ativa — semântica confirmada pelo usuário no CPLUG) + `statement-row-actions.tsx` e coluna de ações na listagem; (3) **FR-044** `listActiveCustomers`→`listSelectableCustomers` e `useActiveCustomersQuery`→`useSelectableCustomersQuery` perdem o `tab=active`, que filtrava pelo estágio de CRM "Cliente ativo" — estágio que **nenhuma tela permite editar** (todo cliente nasce `lead` em `customer.entity.ts:154`), então cliente cadastrado por `/clientes` nunca aparecia no select | ⚠️ **Gate não executado** (deps não instaladas). A renomeação do hook atinge **9 arquivos** em 6 features (vendas, OS, contratos, NFS-e, lançamentos, conciliação) — a mudança de comportamento é intencional e vale para todas. `customerKeys.active` foi mantido como chave de cache (nome interno, sem efeito). Falta o select de cliente no formulário da conciliação, que ainda é texto livre (D27/T190–T192, T194) |
| 2026-08-14 | **Conciliação bancária — conta bancária volta a ser obrigatória na importação (spec `006-bank-reconciliation` FR-001, research.md D26):** achado testando em produção — "Buscar registro" ficava desabilitado em 100% das transações porque o extrato não resolvia a conta. Causa estrutural, não do botão: `BankAccount` guarda só `bankCode`, o OFX traz agência e número de conta, e **não existe chave confiável entre os dois** (arquivo dizia "Banco 1", org tinha Banco do Brasil). Reverte a auto-resolução da `007-financeiro-ajustes-ui` FR-007a/FR-007b — `import-bank-statement.use-case.ts` passa a exigir `bankAccountId` (2 erros de domínio novos: `BankAccountRequiredError` e `NoBankAccountRegisteredError`, distintos para a tela orientar "selecione" vs. "cadastre"); `statement-import-dialog.tsx` volta com campo obrigatório + Salvar bloqueado + aviso quando a org não tem conta; `importBankStatementApi`/mutation deixam de aceitar `null`. `POST .../preview` **permanece**, agora só pré-selecionando | ⚠️ **Gate não executado** (deps não instaladas nesta máquina). `resolveBankAccountByCode` continua em uso pelo `preview-bank-statement.use-case.ts` — não ficou órfão. Os 3 testes da 007 que cobriam importar sem conta foram **substituídos** por 3 novos em `import-bank-statement.use-case.spec.ts` |
| 2026-08-14 | **Conciliação bancária — ajustes de UI/UX da 3ª comparação CPLUG (spec `006-bank-reconciliation`, research.md D18/D20/D21):** "Conciliar" vira o 1º botão do cartão (`transaction-card.tsx`, kind `"exact"`; 1 candidato concilia direto, vários levam à escolha); divergência de valor sai de `match-suggestion-card.tsx` e passa a ser sinalizada no cartão com a diferença (faltam/excedem); `manual-match-drawer.tsx` perde o `Alert` de divergência e o rodapé vira totalizador neutro; `create-entry-from-transaction-dialog.tsx` → `create-entry-from-transaction-drawer.tsx` (`Dialog` → `Drawer` à direita) | ⚠️ **Gate não executado** — `node_modules` da máquina contém shims de outro host (`/home/bruno/aplopes/citybox-review/`), `typescript` ausente e `pnpm` fora do PATH: `build`/`lint`/`typecheck` **não** rodaram nesta entrega. Restante da Phase 10 (backend D19/D22/D23/D25 + T171/T176/T177) segue pendente |
| 2026-08-14 | Dockerfile e compose de produção passam a embutir `citybox-erp` / `erp-web`; runtime usa `KEYCLOAK_CLIENT_SECRET` | Build e BFF deixam de depender de `citybox-dev` / `citybox-backoffice` |
| 2026-08-13 | **`/api/proxy/fiscal` — token de serviço + guarda cross-tenant (bugfix pós-deploy):** achado testando como usuário comum (`lojista`): toda tela Fiscal (Configurações gerais, Tipo de NF do PDV, etc.) mostrava "Não foi possível carregar" porque a fiscal-api exige role de Keycloak (`fiscal_operator`/`platform.admin`) que nenhum usuário final tem — só `platform_admin` (usado nos testes de implementação) passava. Correção: proxy autentica com token de serviço (`citybox-fiscal-service`, já provisionado desde 2026-08-10, nunca ligado a código) **só** nas rotas com `companyId` verificável no servidor (`lib/api/fiscal-tenant-guard.ts`, resolve via `GET /v1/organizations/current` + `Membership`); demais rotas continuam com o token do usuário (sem regressão). `fiscalFetch`/`fiscalUpload` passam a mandar `X-Organization-Id`. Novo env `KEYCLOAK_FISCAL_SERVICE_SECRET` no compose do erp-web | security-review achou CRITICAL na 1ª versão (token de serviço cobria só 3 formas de rota, ~40 restantes sem checagem) — redesenhado pra fail-closed (só eleva onde há dono verificado) e re-verificado aprovado |
| 2026-08-13 | **Naturezas de Operação — frontend (spec erp/020, fecha o Menu Fiscal 11/11):** nova feature `fiscal-operation-natures` (`/configuracoes/fiscal/naturezas-operacao` + `/novo` + `/[id]`) — o backend (erp-api módulo `operation-natures`, 36 testes) já existia acumulado no commit `989443cd0`, mas sem o frontend; esta sessão entregou o cadastro (form com 3 listas de-para adicionáveis: CFOP+ICMS Livre, Grupo de ICMS, Grupo de PIS/COFINS) + link em Padrões fiscais. Achado react-review corrigido: `useState` com lazy initializer (`() => initialState(nature)`) em vez de valor plano, porque `initialState` invoca um contador de chave de linha (efeito colateral que rodaria a cada render sem a forma lazy) | Fila do Menu Fiscal completa (010–020); emissão real de entrada/devolução na fiscal-api segue fora de escopo (mesma natureza do B7) |
| 2026-08-13 | **Gerenciar caixas via API:** `pos-cash-sessions` sai do mock — `api/` + React Query contra `/v1/pos-cash-sessions` (lista, vendas, movimentos, closing-report); PDV do filtro vem de `/v1/pos-terminals`. |
| 2026-08-13 | **Caixas mock + PIN no create:** `pos-cash-sessions` ganha movimentos de sangria/reforço no mock, colunas Operador/Vendedor/Sangrias e aba de movimentos no drawer; `UserPdvSection` permite **Definir PIN** já no create (`pendingPdvPin` → `setMemberPdvPin` pós-create). Sync real de `CashShift` permanece fora de escopo. | UX de autorização/sangria + preview da tela de caixas |
| 2026-08-11 | **Conciliação bancária — comparação CPLUG x ERP Citybox: cards, drawer com filtros completos, seções no formulário, painel de sugestões (spec `006-bank-reconciliation`, research.md D16/D17):** `transaction-row.tsx` → `transaction-card.tsx` (`Card` MUI, botões reais, sem checkbox em lote, FR-039); novo `suggested-entries-panel.tsx` no rodapé de Pendentes (FR-041, `useAllSuggestionsQueries`); `manual-match-drawer.tsx` reescrito — filtros completos (`manual-match-filters.tsx`, novo) + tabela de resultados, consumindo o endpoint novo `GET .../eligible-entries` via `use-eligible-entries-search.ts` (substitui `use-financial-entry-search.ts`, que chamava `GET /v1/financial-entries?status=pending` — a causa do bug relatado pelo usuário); `create-entry-from-transaction-dialog.tsx` reescrito em seções Transação Financeira/Dados de pagamento/Classificação (FR-040), campos travados como texto somente leitura. Tipos `FinancialEntrySearchResult`/`FinancialEntrySearchItemDto` substituídos por `EligibleEntry`/`EligibleEntryDto` (campo `openBalance` → `eligibleAmount`, cobre tanto saldo em aberto quanto valor total de um lançamento já pago) | Fecha o gap de layout apontado pelo usuário na comparação com os mockups CPLUG (estrutura, não só tema) e o bug funcional da busca manual; `GUIA.md` atualizado |
| 2026-08-12 | **CEP no cadastro de clientes:** máscara `formatCep` + `useCustomerCepLookup` → `GET /v1/cep/:cep` (BrasilAPI na erp-api); loading desabilita demais campos; toast em falha. Em `customer-address-card` e `CustomerQuickCreateAddressFields`. | Paridade com admin; PDV usa `/v1/pos/cep` |
| 2026-08-10 | **Conciliação bancária — layout de referência: soma de N lançamentos, conta editável, filtro de período (spec `006-bank-reconciliation`, US4/D14/D15):** `manual-match-drawer.tsx` deixa de ser single-select (`Radio`) e vira multi-select (`Checkbox` + `Set<string>`), unificando busca manual e soma de N lançamentos no mesmo drawer — mostra soma corrente vs. valor da transação e a diferença antes de confirmar; `transaction-row.tsx` passa `financialEntryIds: string[]`. `create-entry-from-transaction-dialog.tsx` ganha `Select` de Conta (`useBankAccountOptionsQuery`, pré-selecionado com a conta do extrato). `transaction-list-panel.tsx` ganha `DateRangePicker` de "Período" (filtra por `postedAt`, nunca chamado de "vencimento"), com estado em `use-bank-statement-transaction-list.ts` (`postedFrom`/`postedTo`). Nenhuma rota nova — `reconcile-transaction` já cobria N ids desde o desenho original (research.md D7); só a UI estava incompleta | Fecha os 3 mockups enviados pelo usuário via `/speckit-clarify`; `GUIA.md` atualizado (removida a ressalva de "Somar lançamentos" pendente) |
| 2026-08-10 | **Conciliação bancária — Buscar lançamento, Criar lançamento, Excluir e Desfazer (spec `006-bank-reconciliation`, US3/US5/US6):** `transaction-row.tsx` ganha 3 ações novas na aba Pendentes (`manual-match-drawer.tsx`, `create-entry-from-transaction-dialog.tsx`, `ConfirmationDialog` de excluir) + 1 na aba Conciliadas (Desfazer). Novos hooks `use-financial-entry-search.ts` (debounce 400ms sobre `GET /v1/financial-entries`) e `useCreateEntryFromTransactionMutation` em `use-bank-reconciliation-mutations.ts` (`useDiscardTransactionMutation`/`useUndoReconciliationMutation` já existiam, só faltava o botão). O diálogo de criar lançamento pede Categoria/Centro de custo (`useChartOfAccountOptionsQuery`/`useCostCenterOptionsQuery`) — campos novos exigidos pelo backend, não previstos no desenho original da spec | Fecha o gap reportado pelo usuário: a spec/tasks.md já cobriam esses 4 pontos desde a criação da feature, mas só o MVP (importar + conciliar por sugestão) tinha sido codado; `GUIA.md` da feature já descrevia esse comportamento como existente antes de existir de fato |
| 2026-08-10 | **Facilita NF-e — aba "Emitido" real (spec `009-facilita-nfe-screen`):** `/financas/facilita-nfe` sai de `PlaceholderPage`. Novo `features/facilita-nfe` (**primeiro consumidor de `services/fiscal-api`** neste app) + novo proxy `app/api/proxy/fiscal/[...path]/route.ts` + `lib/api/fiscal-client.ts`. Só a aba "Emitido" tem dado real; "Recebido"/"Histórico de Envios" e as ações "Agendar envio"/"Enviar por e-mail" ficam placeholder — dependem de backend que não existe ainda (decisão explícita, ver `spec.md` `## Clarifications` da feature). `fiscal-api` ganhou `search` em `GET /v1/fiscal-documents` e o endpoint novo `GET /v1/fiscal-documents/summary` (ver `services/fiscal-api/AGENTS.md`) | Nova env `FISCAL_API_URL` (§7); tabela de portas do `AGENTS.md`/`CLAUDE.md` raiz ganhou a linha `fiscal-api` (3116), que estava ausente. **Achado:** `apps/erp/web` não tem harness de teste frontend nenhum (zero Vitest/RTL/`.test.ts(x)` no pacote inteiro) — feature entregue sem testes automatizados por essa razão, reportado explicitamente, não decidido silenciosamente |
| 2026-08-09 | **Backend de Adicionais e Sugestões (spec `008-catalogo-adicionais-sugestoes`, só `erp-api`):** catálogo `ProductAddon` (`v1/product-addons`) + `addonSettings`/`addonLines`/`suggestions` aninhados em `GET`/`PUT /v1/products/:id` — ver `apps/erp/api/AGENTS.md` §9. **Sem mudança neste app**: `ProductAddonsSection`/`ProductSuggestionsSection` continuam lendo/gravando só `data/mock-addons.ts`/`data/mock-suggestions.ts` | Prepara a próxima fatia (trocar o mock destas duas abas pela API, mesma sequência de Variações → Fase B.1) |
| 2026-08-07 | **DRE reestruturada em 9 categorias fixas (spec `007-financeiro-ajustes-ui`, US5):** `features/financial-results` deixa o DTO/tipos binários `revenue`/`expense` — `IncomeStatementReportDto`/`FinancialResultReport` ganham `groups: ResultGroupBlock[]` (sempre 9, ordenados por `catalogOrder`, com `sign`) + `operatingResult`; `FinancialResultSection` recebe a lista única em vez de duas seções tipadas; `FinancialResultGroupRow` colore pelo `sign` do grupo; card final "Resultado do período" → "Resultado Operacional"; `shareOfGroup`/`shareOfSection` saíram do shape da DRE (mantidos só em `cost-center-analysis`, relatório não tocado) | Layout/período da tela (`FinancialResultPage`) preservados por decisão da spec — só a árvore de categorias e o DTO mudam |
| 2026-08-07 | **Importação de extrato sem conta obrigatória (spec `007-financeiro-ajustes-ui`, US4):** `statement-import-dialog.tsx` perde a validação client-side que exigia Conta bancária; ao selecionar o arquivo, chama `POST v1/bank-statements/preview` (`usePreviewBankStatementMutation`, novo) e pré-preenche a conta quando o backend sugere uma única correspondência por código de banco — campo continua editável, rótulo passa a "Conta bancária (opcional)" | `financas/conciliacao-bancaria` corrigido de "placeholder" para rota real na árvore acima (estava desatualizado antes desta mudança) |
| 2026-08-07 | **Select de forma de pagamento vira real (spec `007-financeiro-ajustes-ui`, US3):** `financial-entry-payments-section.tsx` e `transfer-dialog.tsx` trocam `FINANCIAL_ENTRY_PAYMENT_METHODS` (enum fixo) por `usePaymentMethodOptionsQuery` (novo hook em `features/payment-methods/hooks/`); seção Pagamentos ganha labels em Data/Forma de pagamento (antes só Valor tinha, causava desalinhamento) | Depende de US8 (T033-T041). Enum antigo mantido só como fallback de rótulo no Extrato (lançamentos históricos) |
| 2026-08-07 | **Formas de pagamento vira real (spec `007-financeiro-ajustes-ui`, US8):** `features/payment-methods` sai do store mock in-memory — `api/` (dto/mapper/service) + `hooks/` (React Query) contra `/v1/payment-methods` (novo módulo `erp-api`). `services/payment-method.service.ts`, `hooks/use-payment-method-store.ts`, `data/mock-payment-methods.ts` removidos | Pré-requisito de US3 (select de lançamentos deixa de usar enum fixo) |
| 2026-08-07 | **Lançamentos — grade (spec `007-financeiro-ajustes-ui`, US2):** coluna "Valor" separada em "Valor original"/"Valor final" em `financial-entry-list-table.tsx` | Sem mudança de API — os dois valores já vinham no item da lista |
| 2026-08-07 | **Extrato — resumo e colunas (spec `007-financeiro-ajustes-ui`, US1):** resumo do topo perde o saldo por conta bancária (`BankAccountBalancesPanel`/`use-bank-account-balances` removidos); grade passa a Competência, Vencimento, Categoria, Método de pagamento, Valor original, Valor final, Status (as duas datas sempre visíveis, sem alternar por filtro) | `financial-statement-table.tsx` perde o prop `dateAxis`; novo helper `resolvePaymentMethodLabel` em `financial-entries/lib/financial-entry-format.ts` |
| 2026-08-06 | **Perfis seed:** só Administrador protegido na UI (`isSystem`); demais perfis do seed editáveis/excluíveis | Alinha ao seed v3 da `erp-api` |
| 2026-08-06 | **Ciclo org (web):** `/selecionar-unidade` + `/sem-unidade`; `needsBranchSelection` / `accessesAllBranches` no `OrganizationProvider`; Cadastro de `company-settings` via `GET/PUT /v1/organizations/current` | Fecha login multi-unidade e dados cadastrais da empresa |
| 2026-08-06 | **Usuários e permissões via API:** `features/users-permissions` sai do mock — `api/` + React Query + Zustand contra `/v1/members`, `/v1/permission-profiles`, `/v1/permission-catalog`; senha provisória (create/reset) + soft-deactivate; catálogo da API na árvore de perfis; sessões ativas "Em breve"; settings PDV/e-mail fora do payload | Fecha cadastro de equipe no ERP web; enforcement fino nas demais telas permanece pendente |
| 2026-08-06 | **Ícones shell:** DualSidebar rail **18px**; botões do header (tema/ajuda/notif) **22px** | Densidade visual do chrome |
| 2026-08-06 | **Motor de recebíveis do contrato de cartões (`specs/erp/005-card-receivables-engine/`):** contrato de cartão deixa de ser só cadastro — passa a produzir recebíveis reais no fechamento de venda (...) |
| 2026-08-06 | **Extrato financeiro consolidado (`specs/erp/004-financial-statement/`):** `/financas/extratos` deixa de ser `PlaceholderPage` (...) |
| 2026-08-06 | **DRE real e análise por centro de custo:** `financial-results` (...) |
| 2026-08-06 | **Contas bancárias — saldo real, extrato/transações paginados, transferência persistente:** (...) |
| 2026-08-05 | **Lançamentos financeiros — persistência real ponta a ponta:** `financial-entries` (...) |
| 2026-08-04 | **Cadastros de PDV via API:** `features/pos-registers` sai do mock — `api/` (dto/mapper/service) + `hooks/` (React Query) + `store/` (Zustand busca/página) contra `/v1/pos-terminals` (erp-api, novo). Editar passa a funcionar de verdade (Dialog único Novo/Editar); Marcar como inativo/ativo e Excluir viram mutations reais; nova ação **Gerar código de pareamento** (`POST .../pair`, Dialog com o código + copiar). Terminal vinculado à unidade ativa do cabeçalho (sem seletor no form). `services/pos-register.service.ts` e `data/mock-pos-registers.ts` removidos | Primeira fatia da integração PDV↔ERP (`.claude/plans/_platform/pos-terminals-pdv-integration.plan.md`) do lado do `erp-web`. `features/pos-cash-sessions` (ainda mock) passou a derivar as opções de PDV do próprio mock local (`POS_CASH_REGISTER_OPTIONS`) em vez de importar `mock-pos-registers` |
| 2026-08-03 | **KDS:** feature `kds` (`/ponto-de-venda/kds` + `/[id]/produtos`) — lista com seleção (Nome/Status/Expedição), Dialog criar/editar, inativar/reativar, excluir e **vínculo de produtos** via `ProductPickerDrawer` sobre `useCatalogProductsQuery`. Store in-memory lido por **`useSyncExternalStore`** (`subscribeKds`/`getKdsSnapshot`) | KDS sai do PlaceholderPage. Padrão novo para stores mock do módulo PDV: preferir `useSyncExternalStore` ao contador de `revision` de `pos-registers`/`pos-cash-sessions` (que gera warning de `exhaustive-deps`) |
| 2026-08-03 | **Unidades e Filiais (via API):** feature `branches` (`/v1/branches`) — lista com busca/seleção + `/nova` + `/[id]` com abas Cadastro/Cobrança(off)/Definições de uso(só edição); soft-delete com matriz protegida; mutations chamam `useOrganization().reload()`. Compartilhados novos: **`FormSection`/`formFieldGridSx`/`formFieldSpanSx`** e **`SelectField`** em `components/ui/form`, **`lib/br-format.ts`** (máscaras CNPJ/CPF/telefone/CEP + `BR_STATE_OPTIONS`) | `company-settings` migrou para esses compartilhados: `company-settings-section.tsx` e `company-select-field.tsx` **removidos**, `company-formatters.ts` ficou só com `evaluatePasswordStrength`, `STATE_OPTIONS` saiu de `company-options.ts`. `BR_STATES` de `suppliers`/`carriers` seguem duplicados (consolidação futura) |
| 2026-08-03 | **Gerenciar caixas:** feature `pos-cash-sessions` (mock MUI) em `/ponto-de-venda/caixas` — filtros PDV/vendedor/operador/período, lista de sessões, Drawer de vendas (paginação + lupa → detalhe + Valores de fechamento → comprovante) | Sai do PlaceholderPage |
| 2026-08-03 | **Ícones nav/header:** rail + painel deixam `@citybox/mui/icons` (Solar/Iconify); `lib/nav-icons.tsx` + `NavIcon` com `@mui/icons-material`; header já era Material; §5.2.1 vira fonte única | App pronto para remoção do registry Solar do `@citybox/mui` |
| 2026-08-03 | **Dados da empresa refeita:** `features/company-settings` ganha 3 abas (`Tabs` MUI: Cadastro / Cobrança / Definições de uso) no molde da referência ConnectPlug; view quebrada em `hooks/use-company-settings-form` + componentes por aba + `CompanyAddressFields`/`CompanyLogoField`/`CompanyCertificateField`/`CompanySelectField`; estoques via `useStocksQuery` (API) no lugar de `MOCK_STOCKS`; `brandColor` sai do estado do form e passa a `useSyncExternalStore` sobre `lib/brand-color-store`; `GUIA.md` criado | Campos novos no mock (`companyCode`, `segment`, `billing`, `usage.defaultPriceListReports`, `usage.adminPassword`, `address.street`/`state`); `AddressInfo.address` virou `street`. Quem importar `CompanySettings` precisa acompanhar |
| 2026-08-03 | **Pontos de venda:** módulo Dual com painel (Cadastros, Caixas, KDS, Mesas, Comandas + CONFIGURAÇÕES); feature `pos-registers` (lista mock + Dialog Novo PDV com NFC-e/impressão/balança/servidor offline; inativar/excluir; Editar = em breve); demais leaves PlaceholderPage | Canais de Venda deixa de ser leaf único sem painel |
| 2026-07-31 | **Motivo do movimento de estoque:** `reason` (enum da API) substitui `categoryName` como rótulo do movimento na lista, no drawer de detalhe e no kardex do produto; `types/stock-movement-reason.ts` centraliza rótulos e `resolveStockMovementReasonLabel`; toolbar ganha `StockMovementReasonFilter` (query `reason`, server-side) | `categoryName`/`categoryId` agora chegam **nulos** em movimento automático — quem exibir categoria crua mostra vazio. O select de categoria do form de lançamento manual continua obrigatório |
| 2026-07-31 | **Contas bancárias e lançamentos acompanham a migração da API para Clean Architecture:** `listBankAccountsApi` deixa de baixar o cadastro inteiro e filtrar/paginar no cliente — passa `search`/`page`/`perPage` e lê `meta` (política §8.1); `listBankAccountOptionsApi` vira `?perPage=100&tab=active` (a API agora pagina, default 20); `createBankAccountApi` e `createFinancialEntryApi` leem `res.data` (item único virou envelope `{ data }`). Novo hook `use-bank-account-list.ts` com debounce de **400ms** — sem ele a busca server-side dispararia uma requisição por tecla; `BankAccountListPage` ficou só de composição | Escrita nas duas features passa a exigir `store.finance.manage` na API: papel `MEMBER` **perde** acesso de escrita (só OWNER/ADMIN) |
| 2026-07-31 | **Vendedores e contas bancárias reais no form de venda:** `useSaleOrderSellersQuery` (`/v1/members`, guarda o `userId`) e `useBankAccountOptionsQuery` (`/v1/bank-accounts`) substituem os mocks `seller-*`/`ba-*` em `SaleOrderFormView` e no dialog de pagamento da OS | Corrige 400 do `POST /v1/sale-orders` (ids mock em `sellerId`/`payments[].bankAccountId`, este último FK real) |
| 2026-07-30 | **Vendas via API (web):** pedidos/vendas React Query (`/v1/sale-orders`); OS/contratos/promoções/contas/lançamentos ligados; PDF/impressão; `salesTotal` do cliente na listagem | Fecha plano de ordem Vendas (fases 0–9) no front |
| 2026-07-30 | **Migração MUI — Promoções:** `features/promotions` deixa `@citybox/ui`/`data-table-shadcn`/`lucide-react`; lista (tabs Ativas/Excluídas) + wizard 3 passos (stepper/footer locais MUI, type-cards, rules com `MultiSelect`/`Autocomplete`) ; mock inalterado | Fecha Vendas no DS MUI |
| 2026-07-30 | **Migração MUI — Ordens de serviço:** `features/service-orders` deixa `@citybox/ui`/`data-table-shadcn`/`lucide-react`; lista (tabs `baseType`) + form full-bleed + drawer Status (DnD + Etapa) + filtros `Drawer`/`DateRangePicker` + dialog pagamento; mock inalterado | Quarta feature de Vendas no DS MUI |
| 2026-07-30 | **§5.2.2 Densidade campos MUI:** default = medium (44px); `size="small"` só quando campo e botão na mesma linha | Evita formulários “apertados”; documenta exceção toolbar |
| 2026-07-30 | **Migração MUI — Contratos de venda:** `features/sales-contracts` deixa `@citybox/ui`/`data-table-shadcn`/`lucide-react`; lista + form full-bleed + drawer Status (DnD) + filtros `Drawer`/`Autocomplete`/`DateRangePicker`; mock inalterado | Terceira feature de Vendas no DS MUI |
| 2026-07-30 | **Migração MUI — Vendas:** `features/sales` lista (`/vendas`) deixa `@citybox/ui`/`data-table-shadcn`/`lucide-react`; `ListPageShell`/`ListPagePanel`/`DataTable` + toolbar/ações `Menu`; mock e `/vendas/novo` inalterados | Segunda feature de Vendas no DS MUI |
| 2026-07-30 | **Migração MUI — Pedidos de venda:** `features/sales-orders` deixa `@citybox/ui`/`data-table-shadcn`/`lucide-react`; lista (`ListPageShell`/`ListPagePanel`/`DataTable`) + form full-bleed (`EntityFormHeader`/`EntityFormFooter`, `Autocomplete`, `DateRangePicker`); mock inalterado | Primeira feature de Vendas no DS MUI; `/vendas/novo` reaproveita o form já MUI |
| 2026-07-31 | **Rename `apps/erp-comercio/web` → `apps/erp/web`:** pacote `@citybox/erp-comercio-web` → `@citybox/erp-web`; porta 3110 → 3107 (liberada pelo shell legado removido); envs `ERP_COMERCIO_API_URL`/`NEXT_PUBLIC_ERP_COMERCIO_ORIGIN`/`KEYCLOAK_ERP_COMERCIO_SECRET` → `ERP_API_URL`/`NEXT_PUBLIC_BACKOFFICE_ORIGIN`/`KEYCLOAK_BACKOFFICE_SECRET`; client Keycloak passa a ser `citybox-backoffice` (reaproveitado do legado) em vez de `citybox-erp-comercio` | Substitui o antigo shell multi-vertical `apps/erp` (:3107) — ver `../AGENTS.md` §9. Identificadores internos (`comercioFetch`, `/api/proxy/comercio`, `ComercioErpLayout`, etc.) não foram renomeados |
| 2026-07-29 | Palette semântica pastel (`semantic-palette.ts`) nos presets v1/v2; badge de produção usa `*.light`/`*.dark` | Contraste em Concluído/Pendente/Em andamento |
| 2026-07-29 | **Ícones:** `@citybox/mui/icons` só em navegação (`panel-menu` + `navigation.ts`); features/menus/forms usam `@mui/icons-material` | Política §5.2.1 rígida; dropdowns ⋯ Material |
| 2026-07-29 | Compras: **Restaurar** na aba Excluídas (`POST /v1/purchases/:id/restore`) | Soft-delete reversível sem mexer no estoque |
| 2026-07-29 | Balanço: `hasProductImage` → `productImageProxyUrl` (object key MinIO nunca no `<img>`) | Imagens na página de balanço do depósito |
| 2026-07-29 | Roteiro E2E **Catálogo + Estoque** em [`TESTES-CATALOGO-ESTOQUE.md`](TESTES-CATALOGO-ESTOQUE.md) (blocos A–G + mapa de rotas + links aos `TESTES.md` por feature) | Validação ponta a ponta dos módulos ligados |
| 2026-07-29 | **Fase 9 — Polish + catálogo:** filtro/sort de estoque na lista de produtos; `trackStock` na coluna; stubs órfãos removidos (`stock.service`, `stock-balance.service`, `createStockMovement`, `mock-movement-category-options`); `TESTES.md` em 9 features de estoque/catálogo | Fecha plano de estoque |
| 2026-07-29 | **Fase 8 — Produção via API:** React Query em `features/production`; BOM da ficha `productive_process`; finalize via ledger; mocks removidos | Fecha produção (estoque) ponta a ponta |
| 2026-07-29 | **Fichas técnicas via API:** React Query; lista server-side; upsert composição; insumos = supplies | Fecha Catálogo BOM; Pré-req da Fase 8 |
| 2026-07-29 | **Fase 7 — Compras via API:** React Query em `purchases`; entrada ledger no receive; payments stub local; mocks de pedido removidos | Fecha compras (estoque) ponta a ponta |
| 2026-07-29 | **Fase 6 — Transportadoras via API:** React Query em `carriers`; `useCarrierOptionsQuery` em transfers/purchases; mocks removidos | Fecha cadastro de transportadoras ponta a ponta |
| 2026-07-29 | **Fase 5 — Transferências via API:** React Query em `stock-transfers`; create/cancel com ledger; saldo via balance API; mock removido; carriers ainda mock local | Fecha gap de transferência sem saldo no front |
| 2026-07-29 | **Fase 4 — Inventário via API:** React Query em `stock-inventory`; POST finalized; mock removido; stub `applyStockCount` só purchases/production | Fecha contagem física no front |
| 2026-07-28 | **Fase 3 — Movimentações + Balanço via API:** React Query em `stock-movements` + balanço/`ProductMovementsDrawer`; stub local só para purchases/production/inventory | Fecha o ledger no front; inventário/compras/produção ainda mock |
| 2026-07-28 | **Categorias de movimentação na API:** `features/movement-categories` lista/criar/editar/excluir via `/v1/movement-categories`; `useBranchUnits`; bloqueio UI de `isSystem`; mock `listMovementCategoryOptions` só para features ainda mock | Fecha cadastro de categorias ponta a ponta |
| 2026-07-28 | **Estoque (cadastro) na API:** `features/stock` lista/criar/editar/excluir via `/v1/stocks` (React Query); unidades reais (`useBranchUnits`); balanço e demais features de estoque seguem mock | Fecha cadastro de depósitos ponta a ponta |
| 2026-07-28 | **Parâmetros fiscais na API:** `features/fiscal-parameters` deixa mock de configured/save/`MOCK_STORES`; api/hooks React Query; listagem server-side; detalhe PUT; branches reais | Fecha parâmetros fiscais ponta a ponta |
| 2026-07-28 | **Listas de preço na API:** `features/price-lists` deixa o mock (api/hooks/store React Query); listagem server-side; detalhe persiste itens; prioridade via reorder | Fecha lista de preços ponta a ponta; `company-settings` lê listas reais |
| 2026-07-28 | **Favicon brand:** símbolo `logobrand` (`@citybox/mui`) com fundo = cor de marca (`DEFAULT_BRAND_COLOR` / runtime); `app/icon.tsx`, `apple-icon.tsx`, `public/favicon.svg` + `BrandFaviconSync` | Aba do browser segue o tema; troca de marca em Configurações atualiza o ícone |
| 2026-07-28 | **Toast MUI:** `Toaster`/`toast` de `@citybox/mui` (template `progress` com barra pastel); imports `sonner` migrados | Notificações seguem o tema MUI; reutilizável por outros apps |
| 2026-07-28 | **Fase B.1 — Variações:** `features/variations` deixa o mock (api/hooks/store React Query); aba Variações do produto persiste `variationFormat`/`variations`; fichas técnicas leem vínculos reais | Fecha catálogo de variações ponta a ponta; Adicionais/Sugestões/Canais ainda mock |
| 2026-07-28 | **Fase A catálogo:** CRUD **Unidade de medida** integrado (`features/unit-of-measure/{api,hooks,store}`); fichas técnicas, parâmetros fiscais e detalhe de lista de preços derivam produtos via `useCatalogProductsQuery`; importação XLSX descopada (botão desabilitado) | Remove mock de UoM; reduz dependência de `MOCK_PRODUCTS` no catálogo GERAL |
| 2026-07-28 | **Header shell MUI:** `comercio-header` + switchers + `CommandSearch` (`CommandPalette`) + theme/notif/ajuda + `NavUser`; `providers.tsx` sincroniza `palette.mode` com `next-themes` | Header deixa `@citybox/ui`; rail `Logo` ainda shadcn |
| 2026-07-28 | **Migração MUI — módulo Clientes:** `features/customers` + `features/customer-categories` deixam `@citybox/ui`/`data-table-shadcn`/`lucide-react`; lista (`PageHeader`, `Tabs`, `DataTable` 1-based), form full-page (`EntityFormHeader`/`EntityFormFooter`, `FormField`, `Autocomplete`, `DatePicker`), categorias em `Dialog` + `NumberSpinner`; `CustomerQuickCreateDialog` MUI | Clientes inteiro no DS MUI (mock inalterado); `/clientes/campanha` permanece placeholder |
| 2026-07-28 | **Ícones Material no app:** `@mui/icons-material` já é dependência direta; política §5.2.1 (Solar vs Material vs lucide); DnD de listas de preço usa `DragIndicator` | Glifos Material quando preferidos; sem depender do registry Solar para drag |
| 2026-07-28 | **Densidade campos MUI:** default 44px; `size="small"` = 36px (altura do botão) via `control-sizes.ts` | Alinhar campo ao botão = `size="small"` explícito (ex.: `company-settings-view`) |
| 2026-07-28 | **Migração MUI — módulo Estoque (9 features):** `stock`, `stock-movements`, `stock-transfers`, `stock-inventory`, `movement-categories`, `purchases`, `suppliers`, `carriers`, `production` deixam `@citybox/ui`/`data-table-shadcn`/`lucide-react`; shared `EntityFormFooter`, `ProductPickerDrawer`, `KanbanBoard`; DS `@citybox/mui` ganha `DatePicker`/`IconButton` + estrutura interna kebab-case | Estoque inteiro no DS MUI (mock/API inalterados); placeholders (`facilita-nfe`, etc.) fora do escopo |
| 2026-07-27 | **Upgrade Material UI 7 → 9** (`@mui/material`/`icons-material`/`material-nextjs`); codemod system-props; `inputProps`→`slotProps`; Button theme variants | Alinha ao latest MUI 9.2; APIs deprecated removidas no v9 |
| 2026-07-27 | **UX form variação:** nome fixo no topo; abas Opções/Cálculo com badge; opções em cards DnD (labels, remover, add tracejado); cálculo com seções e cartões de método | Melhora usabilidade do drawer `/catalogo/variacoes-e-opcoes` e do create-option do produto |
| 2026-07-27 | **Listagem variações em MUI:** `VariationListPage`, `variation-list-table`, `variation-row-actions`, `variation-form-drawer` migrados de `@citybox/ui` → `@citybox/mui` (`PageHeader`, `SearchInput`, `DataTable`, `Menu`, `Drawer`) | Catálogo `/catalogo/variacoes-e-opcoes` 100% MUI (mock inalterado) |
| 2026-07-27 | **Forms de variação em MUI:** `VariationForm`, `VariationOptionForm` e filhos diretos (`variation-calculation-section`, `variation-option-sortable-row`, `variation-option-image-box`) migrados para `@citybox/mui`; listagem `/catalogo/variacoes-e-opcoes` permanece shadcn (`variation-form-drawer` só embute os forms MUI) | Drawer de variações do cadastro de produto fica 100% MUI; catálogo de variações migra depois |
| 2026-07-27 | Listagem Produtos migrada para `@citybox/mui` (PageHeader, Tabs, DataTable, Drawer, SearchInput); form create/edit ainda shadcn | 1ª feature de domínio no DS MUI |
| 2026-07-27 | Presets MUI `v1` (salvo) + `v2` (app `#F8FAFB`, col2 branca); troca em `COMERCIO_THEME_PRESET` | Comparação visual de superfícies sem perder o tema original |
| 2026-07-27 | **Shell Dual MUI:** `DualSidebar` + `DualDashboardLayout` (@citybox/mui) substituem `AppSidebarDual`; `comercio-mui-theme` + `CityboxMuiProvider` + `AppRouterCacheProvider`; `panel-menu` em List MUI; header ainda shadcn | 1ª fatia da migração UI→MUI; features seguem em `@citybox/ui` |
| 2026-07-27 | **Login Keycloak + multi-empresa (Fases 0–7 do plano `.claude/plans/erp-comercio-auth-keycloak.plan.md`):** client `citybox-erp-comercio` no realm; núcleo de sessão (`lib/auth*`, `session-*`); BFF `/api/auth/{token,session,refresh,logout}`; `src/proxy.ts` protegendo rota; páginas `/login`, `/auth/callback`, `/auth/sso`, `/entrada`, `/selecionar-organizacao`, `/sem-organizacao`; `OrganizationProvider` + switchers de empresa/unidade substituindo `MOCK_STORES`; proxy passa a injetar o token da sessão (**dev-bypass removido**); `lib/api/active-scope.ts` leva empresa/unidade em toda chamada; catálogo migrado de `boteco-do-cais` para a unidade real no banco de dev | O app deixa de ser aberto: toda rota exige sessão. `store-context.tsx`, `store-switcher.tsx` e `apply-store-theme.ts` **removidos** — quem consumia `useComercioStore()` passa a `useOrganization()`/`useCatalogScope()`. Novas envs de Keycloak (§7) |
| 2026-07-27 | **Categorias integrado à API:** `features/categories/{api,store}` + hooks query/mutation; listagem paginada server-side; CRUD na `erp-api` (`POST/PUT/DELETE v1/product-categories`); form reduzido a Nome + Ativo (paridade com schema Prisma) | Categorias deixa de ser mock na tela `/catalogo/categorias`; invalida cache de categorias do módulo Produtos |
| 2026-07-27 | **Form produto create/edit migrado para `@citybox/mui`:** `ProductFormView` + seções/drawers/rows do cadastro deixam de importar `@citybox/ui`; novos primitivos `Switch`, `Divider`, `CurrencyInput`, `NumberInput` no pacote MUI | Paridade visual com a listagem MUI; demais features do app seguem shadcn |
| 2026-07-27 | **Form produto create/edit migrado para `@citybox/mui`:** `ProductFormView` + seções/drawers/rows do cadastro deixam de importar `@citybox/ui`; novos primitivos `Switch`, `Divider`, `CurrencyInput`, `NumberInput` no pacote MUI | Paridade visual com a listagem MUI; demais features do app seguem shadcn |
| 2026-07-27 | **Fase A produtos:** fornecedores do form ligados à API (`suppliers` no payload + `useActiveSuppliersQuery`); imagem via MinIO (`comercioUpload` + `POST/GET/DELETE …/image`, preview pela URL do proxy) | Fecha o gap do cadastro alinhado à entidade `Product` (exceto variações/adicionais/sugestões/disponibilidade) |
| 2026-07-26 | `apps/erp-comercio/api` criada como scaffold (Clean Architecture, réplica de `food/api`; sem módulos de negócio) — ver `../AGENTS.md` e `../api/AGENTS.md` | Ainda **sem integração** com este `web/` (segue 100% mock); auth/proxy continuam pendentes |
| 2026-07-26 | Reestruturação: `apps/erp-comercio` → `apps/erp-comercio/web`; pacote `@citybox/erp-comercio` → `@citybox/erp-web`; paths relativos p/ `packages/ui` ganham um nível (`tsconfig.json`/`tailwind.config.ts`: `../../` → `../../../`; `globals.css` `@source`: `../../../../` → `../../../../../`) | Abre espaço para `apps/erp-comercio/api`; nenhuma mudança de comportamento |
| 2026-07-25 | Feature `financial-results` + rota `/financas/relatorios-de-resultados` (DRE mock: filtro de período por competência, cards de resumo, árvore Grupo financeiro → Plano de contas, despesas com sinal negativo); mocks de Finanças ganham grupo "Despesas fixas" + contas Internet/Telefone/Energia | Relatórios de resultados sai do placeholder; DRE liga grupos + plano de contas |
| 2026-07-25 | Feature `financial-groups` + rota `/financas/grupo-financeiro` (lista mock: seleção · Nome · Tipo Receita/Despesa · ações; filtro Tipo) + `GUIA.md` | Grupo financeiro sai do placeholder |
| 2026-07-25 | Feature `chart-of-accounts` + rota `/financas/plano-de-contas` (lista mock: seleção · Nome · Grupo financeiro · Disponível para PDV · ações Editar/Excluir) + `GUIA.md` | Plano de contas sai do placeholder |
| 2026-07-25 | Painel Finanças (coluna 2): Extratos / Lançamentos / Conciliação / Relatórios / Boletos + ORGANIZAÇÃO FINANCEIRA + NOTAS FISCAIS; placeholders das subrotas; `/financas` → `/financas/extratos` | Nav Dual espelha ConnectPlug |
| 2026-07-24 | `promotions`: sessões do form em grid de 2 colunas (`PROMOTION_SECTION_GRID_CLASS`, título/descrição à esquerda + box à direita, padrão da página de Produtos), incl. grupos da Etapa 1; no modo edição o tipo é bloqueado (`typeLocked` → `Alert` + `RadioGroup`/cards `disabled`) | Layout consistente com Produtos; impede trocar o tipo ao editar |
| 2026-07-28 | **Card contract create form:** rota `/financas/contratos-de-cartoes-e-outros/novo` (`CardContractCreatePage`); formulário full-page com 3 seções (Dados do contrato, Prazos de pagamento, Taxas e antecipações), footer sticky dirty/save; Autocomplete provedor/conta/períodos, RadioGroup agrupar/corte/prazos, CurrencyInput tarifa, NumberSpinner taxa, Checkbox flags | Cadastro de contrato sai do placeholder (toast → formulário funcional) |
| 2026-07-28 | **Migração MUI catálogo GERAL:** `unit-of-measure`, `fiscal-parameters` e `price-lists` deixam `@citybox/ui`/`data-table-shadcn`; shared `ListPageShell`/`EntityFormHeader`/`RowActionsMenu`/`ActiveStatusBadge`; DS ganha `MultiSelect`/`DateRangePicker`/`Dialog`/`Tooltip`/`EmptyState`/`Alert` + layout `Box`/`Stack`/`Paper` | Grupo GERAL do catálogo 100% MUI (mock inalterado) |
| 2026-07-28 | **DataTable padrão MUI** em `components/ui/data-table` (wrapper `@citybox/mui` + `ListPagePanel`); shadcn/TanStack movido para `data-table-shadcn`; produtos/categorias/variações/fichas técnicas passam a consumir o wrapper local; categorias alinhadas ao shell de produtos | Padroniza listagens MUI e evita import direto de `DataTable` do DS nas features |
| 2026-07-28 | `categories`: refatoração completa da página e componentes para MUI (`/catalogo/categorias`); substituição de PageHeader/SearchInput/Button/Switch/ConfirmDialog/Drawer e integração com o DataTable do `@citybox/mui` | Paridade visual com a listagem e formulário de produtos |
| 2026-07-28 | `technical-sheets`: refatoração completa do formulário p/ MUI (`/catalogo/fichas-tecnicas/[id]`); layout de coluna dupla (`formSectionGridSx`), seletor de tipo de produção card-based com ícones, composição DnD híbrida (insumo selecionado vira texto) e Autocomplete na busca superior | UX premium alinhada ao design system MUI, com menos Selects pesados em tela |
| 2026-07-24 | `promotions`: edição — rota `/vendas/promocoes/[id]` (`PromotionEditPage`) reaproveita `PromotionCreateView` (props `promotionId`/`initialValues`, default = criação); `usePromotionCreateForm(initialValues?)`, `promotionToFormValues`, `updatePromotion`, `saveLabel` no footer, fallback "não encontrada"; "Editar" da lista agora navega p/ a rota | Editar/abrir promoção reusando o mesmo form, sem duplicação |
| 2026-07-24 | `promotions`: rota `/vendas/promocoes/novo` (`PromotionCreatePage`) — form multi-etapas de 3 passos (Selecionar tipo → Informações gerais → Regras finais dinâmicas por tipo), 7 tipos agrupados, rodapé fixo com bloco "Promoção selecionada", `createPromotion` no store; ação de lista **Baixar códigos do cupom** (CSV) só p/ tipo Cupom; botão Nova promoção agora linka a rota; `GUIA.md` atualizado | Cadastro de promoção sai do "em breve"; cobre os 7 modelos de campanha |
| 2026-07-25 | `bank-accounts`: drawer Nova conta alargado (`sm:max-w-md`→`lg`) e unidades passam de checkboxes inline p/ **etapa interna no mesmo drawer** (Item resumo + Selecionar → view com voltar/busca/rascunho/Aplicar seleção) | UX do drawer: form principal mais limpo, seleção de unidades com mais espaço |
| 2026-07-25 | Feature `financial-entries` + rotas `/financas/lancamentos` (+`/novo`, `/[id]`): unifica Contas a pagar/receber numa lista sem tabs; form 4 seções (Financeiro, Pagamentos, Cliente ou fornecedor, Categoria & anexos) no padrão produtos/novo; rateio de pagamentos (advisory) e de categorias (bloqueia salvar se não bater com o total, padrão `purchases`); status derivado da soma dos pagamentos; `TransferDialog` (`recordBankTransfer` novo em `bank-accounts`); combobox Cliente/Fornecedor com fallback p/ cadastro excluído + `GUIA.md` | Lançamentos sai do placeholder; primeira feature financeira real de fato (Contas a Pagar/Receber existiam só como mock em `purchases`/`sales-orders`) |
| 2026-07-25 | Feature `bank-accounts` + rotas `/financas/contas-bancarias` (+`/[id]` com `?view=historico`): lista com saldo por conta, Nova conta em drawer (banco/saldo inicial/abertura/unidades; saldo inicial vira o 1º registro), detalhe com Transações (analítica) e Histórico (extrato com saldo acumulado); `DatePicker` do `@citybox/ui` ganhou `portalContainer` (fix de Select/Popover dentro de Drawer Vaul) + `GUIA.md` | Contas bancárias sai do placeholder; contas virtuais com conciliação OFX no roadmap |
| 2026-07-25 | Feature `service-orders` + rotas `/vendas/ordem-de-servicos` (+`/novo`, `/[id]`): lista com tabs por tipo-base de status, status gerenciáveis (drawer DnD, padrão contratos), form com equipamentos 1..N + laudo 4 campos, serviços/produtos com totais automáticos, orçamento com aprovação do cliente, dialog de pagamento "Salvar e gerar venda" → `createSaleOrder` (venda aparece em `/vendas`) + `GUIA.md` + PRD em `.claude/prds/varejo/ordem-de-servico.prd.md` | Ordem de serviço sai do placeholder; cobre o fluxo completo entrada→laudo→orçamento→execução→faturamento |
| 2026-07-24 | Feature `sales-contracts` + rotas `/vendas/contratos-de-vendas` (lista + filtros + novo/editar + status com DnD) + geração mock de parcelas + `GUIA.md` | Contratos de venda sai do placeholder |
| 2026-07-24 | `sales`: rota `/vendas/novo` (`SaleCreatePage`) reaproveita `SaleOrderFormView` de `sales-orders` (mesmo form/lógica/layout) — `SaleOrderFormView` ganha props opcionais (`headerTitle`/`headerSubtitle`/`backHref`/`initialStatus`/`statusLocked`/`redirectPath`, default = comportamento antigo) e `SaleOrderInfoPanel` ganha `statusLocked` (trava o Select de Status em "Fechado") | Nova venda sem duplicar o formulário de Novo pedido — só o Status muda |
| 2026-07-24 | Feature `sales` + rota `/vendas` (lista enxuta reaproveitando o store de `sales-orders`: seleção · Venda · Nº do pedido · Valor · Canal de venda · Criação · ações com submenus Imprimir/Baixar PDF sem-ou-com-valor) + `GUIA.md` | Vendas sai do placeholder |
| 2026-07-24 | `sales-orders`: split de pagamento — `addPayment` rateia o total em partes iguais entre todos os recebimentos (`splitAmountEvenly`) a cada novo recebimento adicionado; indicador "Restante a receber"/"cobre o total"/"recebido a mais" (`computeRemainingPaymentAmount`) no painel de Pagamentos quando há 2+ recebimentos | Cliente pode pagar parte em dinheiro + parte no cartão sem ficar sem saber quanto falta |
| 2026-07-24 | `sales-orders`: `syncSinglePaymentAmount` (`lib/sale-order-form-values.ts`) preenche sozinho o valor do recebimento único = total do pedido, reaplicado em `addProducts`/`removeProduct`/`setQuantity`/`setUnitPrice`/`setDeliveryFee`/`setDiscounts` | Ao selecionar produto, o valor do pagamento já vem calculado — menos digitação manual |
| 2026-07-23 | Feature `customer-categories` + rota `/clientes/categoria` (CRUD: Nome + Porcentagem de desconto, criar/editar em `Dialog` — não `Drawer`, único caso do módulo) + `GUIA.md` | Categoria de clientes sai do placeholder |
| 2026-07-24 | `stock-movements`: drawer de detalhe (`StockMovementDetailDrawer`) — clique na linha ou "Visualizar" (antes um toast "em breve"); mostra categoria/estoque/data/**usuário que executou** (`userName`, campo novo em `StockMovement`) + tabela read-only dos produtos movimentados (`resolveMovementLineDetails`) | Fecha a lacuna de "ver detalhes" da lista de Movimentações |
| 2026-07-24 | Dual expandable: rail sempre comprimido; fechar coluna 2 não expande coluna 1 | UX menu ConnectPlug-like |
| 2026-07-24 | Dual expandable: rail com painel não navega (só abre coluna 2); botão Fechar menu acima do footer; `panelOpen` controlado no layout | UX menu ConnectPlug-like |
| 2026-07-24 | Feature `promotions` + rota `/vendas/promocoes` (lista mock Ativas/Excluídas, tipos de promoção, status por período, soft-delete/restore) + `GUIA.md` | Promoções sai do placeholder |
| 2026-07-24 | Feature `sales-orders` + rota `/vendas/pedidos-de-venda` (lista mock Aberto/Excluídos, período, filtros, menu com submenus) + `GUIA.md` | Pedidos de venda sai do placeholder |
| 2026-07-24 | Novo pedido de venda (`SaleOrderCreatePage` + `/vendas/pedidos-de-venda/novo`): form split produtos/pagamentos + cliente/info/observações + footer dirty/save; `createSaleOrder` mock | Cadastro de pedido sai do toast “em breve” |
| 2026-07-24 | Painel Vendas (coluna 2): Pedidos / Vendas / Contratos + SERVIÇOS / FISCAL / BENEFÍCIOS; placeholders das subrotas | Nav Dual espelha ConnectPlug |
| 2026-07-24 | Cadastro Novo cliente: campo Categoria com `ComboboxSelect` (@citybox/ui) + dialog de nova categoria; `listAllCustomerCategories` | Select com busca/criar reutilizável no monorepo |
| 2026-07-24 | Cadastro Novo cliente (`CustomerCreatePage` + `/clientes/novo`): Dados pessoais + Endereços múltiplos + footer dirty/save; `createCustomer` no store | Completa o fluxo de cadastro mock |
| 2026-07-23 | Feature `customers` + rota `/clientes` (listagem por estágio CRM: Lead / Oportunidade / Cliente ativo / Inativo) + `GUIA.md` | Clientes sai do placeholder |
| 2026-07-23 | Produção: `ProductionFinalizeDialog` extraído para diálogo independente da página (não mais aninhado no `Drawer`); drawer e Kanban (arraste Em andamento→Concluído) chamam o mesmo `onRequestFinalize`, que fecha o drawer antes de abrir o diálogo | Corrige 2 bugs reais: Dialog aninhado no Drawer (vaul) travava clique/digitação (`modal` padrão) ou fechava sozinho (`modal={false}`) — incompatibilidade sem solução via props; arrastar pra Concluído não abria nenhuma confirmação |
| 2026-07-23 | Produção: `Dialog` de finalização ganha `modal={false}` — sem isso, aninhado dentro do `Drawer` (vaul), não dava para clicar/digitar nos campos (Quantidade/Observação) — **substituído pela entrada acima** | Bug real reportado pelo usuário: conflito de scroll-lock/focus-trap entre Dialog modal e Drawer |
| 2026-07-23 | Produção: card do Kanban perde a borda esquerda colorida por status (`PRODUCTION_STATUS_ACCENT_CLASS` removida) — mantém só a bolinha no header da coluna | Ajuste de preferência visual |
| 2026-07-23 | Produção: "Finalizar Produção" abre `Dialog` próprio com Quantidade produzida (editável) + Observação (opcional, vira parte do evento "Produção finalizada" no histórico), em vez do `ConfirmDialog` genérico | Confirmação com edição de última hora + espaço para justificar divergência antes de mexer no estoque |
| 2026-07-23 | Produção: header próprio de 3 colunas (título + Tabs Kanban/Lista centralizado + busca/Novo pedido na mesma linha, sem `PageHeader`), Tabs com fundo branco/ativo na cor da loja, bolinha de status no header do Kanban, card com mais informações (origem→destino, divergência, cancelamento) e borda colorida por status; drawer ganha painel de **Comentários + Histórico** (`Textarea` + `AuditTimeline`, sem scroll próprio — reaproveita o `ScrollArea` do drawer) alimentado por `production-history.service.ts` (eventos automáticos + comentário manual, sempre com usuário mock `CURRENT_USER_NAME`); `ProductionInsumosTable` troca `overflow-hidden` por `overflow-x-auto` para não cortar a tabela de custo | Melhoria visual + rastreabilidade de quem fez o quê no pedido |
| 2026-07-23 | Produção: colunas do Kanban alargadas (288→360px), toggle Kanban/Lista centralizado (fora do `actions` do `PageHeader`), novo status `cancelled` + botão "Cancelar produção" (Pendente/Em andamento, sem efeito no estoque) | Ajustes de UX + cobre o caso "produção que não vai prosseguir" |
| 2026-07-23 | Consolidação de Produção: 3 páginas (Pedido/Produção/Finalização) → 1 tela (`ProductionPage`, `/estoque/producao`) com drawers de criar/detalhe unificados; Kanban ganha coluna Concluído; rotas antigas viram `redirect()`; menu "PRODUÇÃO" some para 1 item | Elimina redundância entre as 3 telas; mesma entidade/status, menos navegação |
| 2026-07-23 | Feature `production` + rotas `/estoque/pedido-producao` (+`/novo`), `/estoque/producao` (Kanban+Lista), `/estoque/finalizacao`; receita mock (`mock-recipes`) + `GUIA.md` | Módulo de Produção sai do placeholder (fluxo desenhado, sem referência ConnectPlug) |
| 2026-07-23 | Feature `movement-categories` + rota `/estoque/categorias-de-movimentacao` (CRUD drawer; catálogo compartilhado com movimentações) + `GUIA.md` | Categorias de movimentação sai do placeholder |
| 2026-07-23 | Features `carriers` + `suppliers` + rotas `/estoque/transportadoras` e `/estoque/fornecedores` (+ `/novo` + `/[id]`), lista Ativas/Excluídas + form full-page com Tooltip/unidades; standalone; ambas com `GUIA.md` | Logística (transportadoras/fornecedores) sai do placeholder |
| 2026-07-23 | Feature `purchases` + rotas `/estoque/compras` e `/novo` (lista Ativas/Excluídas + nova com rateio/frete) + `GUIA.md` | Compras sai do placeholder |
| 2026-07-23 | Feature `stock-transfers` + rotas `/estoque/transferencias` e `/novo` (lista Ativas/Canceladas + nova) + `GUIA.md` | Transferências sai do placeholder |
| 2026-07-23 | Feature `stock-movements` + rotas `/estoque/movimentacoes` e `/novo` (lista + registrar entrada/saída unificada) + `GUIA.md` | Movimentações sai do placeholder |
| 2026-07-23 | Ações do estoque: Balanço (`/estoque/[id]/balanco`) + feature `stock-inventory` (`/estoque/[id]/inventario` + `/novo` + `/[inventoryId]`) + saldo por estoque (`stock-balance.service`) + atalhos entrada/saída pré-preenchidos; todas com `GUIA.md` | Dropdown do estoque sai do "em breve"; contagem ajusta saldo |
| 2026-07-23 | Feature `stock` + rotas `/estoque` (lista), `/estoque/novo`, `/estoque/[id]` (criar/editar) com `GUIA.md`; unidades via `ProductUnitsDrawer` reaproveitado | Tela de estoque (mock) sai do placeholder |
| 2026-07-23 | Gaps ConnectPlug: composição de variações ligada ao produto (`mock-product-variations`, `product-variation-compositions`), override por produto (`ProductVariationGridConfig`), unidade de medida integrada + casas decimais na quantidade do insumo | Aderência ao ERP 2.0 |
| 2026-07-23 | Painel Estoque (coluna 2) + placeholders das subrotas; `matchLeafByPath` | Nav Dual espelha Produtos |
| 2026-07-23 | Features `categories`, `unit-of-measure`, `fiscal-parameters`, `price-lists` + rotas do catálogo (todas com `GUIA.md`) | Catálogo completo (mock): CRUD-drawer + lista→detalhe |
| 2026-07-23 | Lista de preços reformulada: seleção de produtos no detalhe (`MOCK_PRICE_LIST_ITEMS` + drawer Gerenciar produtos), edição em lote (`PriceListBulkEditDialog`), priorização DnD (`priority` + `reorderPriceLists`) | Fluxo alinhado ao ConnectPlug |
| 2026-07-23 | `GUIA.md` por feature (`products/GUIA.md`, `technical-sheets/GUIA.md`) + convenção em §4.5 | Manual de negócio p/ usuário final |
| 2026-07-23 | Feature `technical-sheets` + rotas `/catalogo/fichas-tecnicas` e `[id]` (lista + composição do produto/variações, custo, DnD) | Fichas técnicas real (mock) |
| 2026-07-23 | Aba Sugestões no Novo produto (`ProductSuggestionsSection` + DnD + `mock-suggestions`) | Form mock Sugestões |
| 2026-07-23 | Aba Adicionais no Novo produto (`ProductAddonsSection` + DnD + `mock-addons`) | Form mock Adicionais |
| 2026-07-23 | Detalhe/edição de produto: `/catalogo/produtos/[id]` reusa `ProductFormView`; clique na linha + Editar no dropdown | Form mock preenchido |
| 2026-07-23 | Aba Variações no Novo produto: formatos grade/composto + drawer multi-step (seleção / criar variação / criar opção) reusando `features/variations` | Form mock completo na aba |
| 2026-07-23 | Feature `variations` + rota `/catalogo/variacoes-e-opcoes`; DataTable `getRowClassName`; deps `@dnd-kit/*` | Lista + drawer mock |
| 2026-07-23 | Página Novo produto (`ProductCreatePage`) + rota `/catalogo/produtos/novo` | Form mock Dados Básicos + footer |
| 2026-07-22 | DataTable local + layout flat produtos | `components/ui/data-table` |
| 2026-07-22 | Feature `products`: listagem mock + sheets Importar/Filtro | Estrutura `features/` |
| 2026-07-22 | Dark mode: `ThemeModeSwitch` + overrides `html.dark[data-comercio-theme]` | Light padrão; toggle no header |
| 2026-07-22 | Header full-bleed: StoreSwitcher + Command ⌘K + NavUser no header; `user` omitido no Dual | Multilojas mock; busca Command |
| 2026-07-22 | Shell `AppSidebarDual` expandable + nav + placeholders | Layout ERP Comércio |
| 2026-07-22 | Scaffold Next + `@citybox/ui` + porta 3110 + página padrão / smoke test | Módulo criado   |
| 2026-08-13 | **Usuário vendedor (`isSeller`):** checkbox no form de membro (default true); `listSaleOrderSellersApi` filtra `?isSeller=true&active=true`; OS usa `useSaleOrderSellersQuery` (sem mock). | Alinha ERP e PDV na mesma flag de Membership |
| 2026-08-13 | **Operadores PDV → Usuários:** credenciais de caixa (`pdvCode` + PIN) no form de `users-permissions` (`UserPdvSection` + `PUT /v1/members/:id/pdv-pin`); feature `pos-operators` removida; `/ponto-de-venda/operadores` redireciona para Usuários & Permissões; item de nav Operadores retirado. | Unifica identidade com Membership — ver `erp-api` AGENTS § pos-operators device |
| 2026-08-06 | **Operadores de PDV:** `features/pos-operators` (`/ponto-de-venda/operadores`) contra `/v1/pos-operators` — lista com busca por nome/código, Dialog Novo/Editar (PIN **só** no cadastro), Dialog Redefinir PIN com confirmação (também destrava), cadeado na linha quando bloqueado, ativar/inativar e excluir. Item "Operadores" no painel Pontos de venda. | **Superseded 2026-08-13** — cadastro migrado para Usuários & Permissões |
| 2026-08-06 | **Estado de pareamento no cadastro de PDV:** `features/pos-registers` ganhou a coluna **Dispositivo** (rótulo do aparelho + "há X min" do último sinal, ou "Não pareado") e a ação **Revogar dispositivo** no menu ⋯, que só aparece com terminal pareado. `PosRegister` ganhou `paired`/`pairedAt`/`pairedDeviceLabel`/`lastSeenAt`. | M2 do `.claude/plans/_platform/pdv-erp-auth.plan.md`. O "visto por último" é o que responde "o Caixa 2 está ligado?" sem ninguém ir até a loja |
| 2026-08-06 | **Alçadas do PDV:** `features/pos-policies` (`/ponto-de-venda/configuracoes/alcadas`) contra `/v1/pos-policy` — limites de desconto e sangria mais os liga/desliga de cancelamento e devolução. Formulário único (uma política por organização), estado sincronizado por `key` em vez de `useEffect`. Item "Alçadas" no grupo CONFIGURAÇÕES de Ponto de venda. | M5 do `.claude/plans/_platform/pdv-erp-auth-offline.plan.md`. O GUIA.md explica por que o limite é da empresa e não do terminal — é a pergunta que o lojista faz primeiro |
| 2026-08-07 | **Módulos do PDV:** `features/pos-modules` — tela **Padrão da loja** (`/ponto-de-venda/configuracoes/modulos`) com seletor de perfil (Restaurante / Lanchonete com delivery / Loja / Mercado) + 6 chaves, e seção **Módulos** dentro do cadastro de PDV com a chave **"Usar o padrão da loja"**. `ModuleSwitchList` é compartilhado pelas duas telas — a pergunta é a mesma, e duplicar produziria listas que divergem no primeiro módulo novo. O catálogo (rótulo + descrição) vem **da API**, junto com o padrão: buscá-lo numa segunda rota criaria dois lugares para divergir. ⚠️ **O estado "herdando" é visível de propósito**: um formulário que mostra seis chaves sem dizer de onde vieram faz o gerente achar que já sobrescreveu, e depois estranhar que mudar o padrão mexeu naquele caixa. Desligar a chave **copia** o padrão como ponto de partida. O save é em **duas chamadas** (terminal, depois módulos) porque a rota de módulos precisa do id — que no cadastro novo só nasce na resposta do create; e só dispara **quando mudou**, senão um PUT a cada save gravaria `{}` num terminal que herdava. `PosRegister` ganhou `moduleOverrides`. Ver `.claude/plans/_platform/pdv-modulos-por-terminal.plan.md`. |
