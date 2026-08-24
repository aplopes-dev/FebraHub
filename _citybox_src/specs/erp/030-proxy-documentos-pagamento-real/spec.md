# Feature Specification: Proxy de documentos fiscais e pagamento real na NF-e

**Feature Branch**: `030-proxy-documentos-pagamento-real`

**Created**: 2026-08-16

**Status**: Draft

**Input**: Três defeitos achados em teste manual (RR EMPREENDIMENTOS, 15/08): (B1) Facilita
NF-e não carrega e download de XML/DANFSE falha com 401 "Client não autorizado: erp-web"; (B2)
NF-e do pedido #8 bloqueada porque o pagamento guarda um id de catálogo mock (`pm-dinheiro`) em
vez do UUID real de `PaymentMethod`; (B3) alíquota do grupo de ISSQN exibida como "0.05%" quando
a intenção era 5%.

## Investigação prévia (achados de código, antes de especificar)

O prompt pedia para "descobrir por quê antes de mudar" no B1(a) e "investigar antes de mudar" no
B3. Leitura do código (não só do relato de teste) mudou o diagnóstico em dois pontos:

1. **B1(a) é uma regressão real da spec erp/029.** O `isCompanyScopedRoute` do proxy
   (`apps/erp/web/.../route.ts`) tinha um disjunto `Boolean(queryCompanyId)` sem restrição de
   rota até a correção do CRITICAL de segurança da spec 029 — que trocou esse disjunto por
   `Boolean(queryCompanyId) && isCertificateStatusRoute(segments)`, um allowlist que cobre **só**
   `GET /v1/certificates/:id/status`. Isso fechou o buraco de segurança, mas também **derrubou**
   qualquer outro consumidor legítimo de `?companyId=` que existisse — inclusive
   `GET /v1/fiscal-documents` (lista), que o cabeçalho do próprio arquivo cita como exemplo.

2. **A causa raiz de "Facilita NF-e não carrega" não é o proxy do erp-web — é um bug separado no
   erp-api.** A aba "Emitido" migrou para `comercioFetch` → `GET /v1/fiscal/documents` (erp-api),
   não fala mais com o proxy `/api/proxy/fiscal` para listar. O erp-api, por sua vez, tem
   `HttpFiscalApiAdapter.call()` (`apps/erp/api/.../fiscal/infrastructure/http-fiscal-api.adapter.ts`)
   mandando o `companyId` **só como header `X-Company-Id`** para `listDocuments`/`getSummary` —
   mas a rota da fiscal-api (`GET /v1/fiscal-documents`) exige `companyId` como **query param**
   obrigatório (`@Query('companyId')`, `BadRequestException` se ausente) e não lê esse header
   nessas duas rotas. Toda chamada falha com 400 na fiscal-api → 503 no erp-api → "Não foi
   possível carregar os documentos emitidos" no erp-web. As duas causas (proxy do erp-web E o
   adapter do erp-api) precisam de correção — a segunda é a que efetivamente bloqueia a tela hoje.

3. **B1(b), rotas de download**: o resolvedor de dono (`fiscalDocumentDownloadId` +
   `resolveFiscalDocumentOwnerCompanyId`) está estruturalmente correto para XML. Mas
   `GET /v1/nfse/:id/danfse` na fiscal-api exige o header `X-Company-Id` (`@CompanyId()`
   decorator, valida contra a participação do usuário na loja) — e o proxy, mesmo quando eleva
   corretamente, **nunca envia esse header** nesse branch. PDF (DANFE/DANFSE) continuaria
   falhando (agora com 400, não 401) mesmo depois de qualquer correção de elevação.

4. **B3 tem resposta com evidência de código, não é mais "verificar".** `issqnRate` é validado no
   erp-api como percentual 0–100 (`MAX_ALIQUOTA = 100`, mesma convenção de ICMS/IPI/PIS-COFINS) e
   o formulário de cadastro (`issqn-group-form-view.tsx`) grava o número digitado sem conversão —
   digitar "5" grava `5` (= 5%), consistente do cadastro à exibição. O bug real está no lado
   **fiscal-api**: `dps-xml.builder.ts` calcula `pAliq: (issRate * 100).toFixed(2)`, tratando o
   valor como **fração** (0–1) — um pedido com `issqnRate = 5` (5%, correto) geraria
   `pAliq = "500.00"` na DPS quando há retenção (`issWithheld`). O grupo "Principal" mostrando
   "0.05%" na tela é dado cadastrado errado (alguém digitou `0.05` pensando em fração), não um bug
   de exibição — a exibição está correta e consistente com o resto do sistema.

## Clarifications

### Session 2026-08-16

- Q: No backfill dos pedidos com `methodId` de catálogo mock, o slug `pm-cartao` é ambíguo
  (crédito ou débito). O que fazer? → A: Mapear para Cartão de Crédito (`systemKey` do sistema).
- Q: Migrar os 4 seletores de forma de pagamento (Pedidos de venda, Vendas, Compras, OS) de uma
  vez, ou só o de Pedidos de venda? → A: Os 4 de uma vez.

**Nota de precisão (achado ao investigar o mock real, pós-clarify):** o catálogo mock
(`purchases/data/mock-payment-methods.ts`) usa `pm-cartao-debito` e `pm-cartao-credito` — não
existe um `pm-cartao` genérico ambíguo nos dados reais. A ambiguidade que motivou a pergunta não
se aplica a esses dois ids (cada um já diz a bandeira); a resposta do usuário (mapear para
Crédito) vale como regra de segurança **só** para um eventual `methodId` literal `pm-cartao` sem
sufixo, se algum registro histórico o tiver. O mock também tem `pm-transferencia`, sem forma de
sistema correspondente nas 15 seedadas — fica fora do backfill (FR-008), como qualquer id não
reconhecido.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Facilita NF-e carrega e documentos ficam disponíveis para download (Priority: P1)

Um lojista abre Finanças → Facilita NF-e e vê a lista de notas emitidas pela organização,
incluindo notas recém-autorizadas. Ele consegue baixar o XML e o PDF (DANFE/DANFSE) de uma nota
autorizada, pelas telas de Vendas, Pedidos de venda e Facilita NF-e.

**Why this priority**: bloqueia toda a tela de Facilita NF-e (não é degradação parcial — a aba
inteira falha) e o download de documentos fiscais já emitidos, que a spec erp/029 entregou mas
nunca chegou a funcionar de ponta a ponta em produção.

**Independent Test**: abrir Facilita NF-e com a organização RR EMPREENDIMENTOS ativa e ver a
lista carregar; baixar XML e DANFSE da NFS-e `188c3ec0-e828-4937-9c42-4303290ee15c`.

**Acceptance Scenarios**:

1. **Given** uma organização com Emitente fiscal configurado e notas emitidas, **When** o
   lojista abre Facilita NF-e, **Then** a lista de documentos aparece (não o erro "Não foi
   possível carregar os documentos emitidos").
2. **Given** uma nota autorizada, **When** o lojista clica em baixar XML, **Then** o arquivo XML
   é baixado com sucesso.
3. **Given** a mesma nota autorizada, **When** o lojista clica em baixar PDF (DANFE/DANFSE),
   **Then** o arquivo PDF é baixado com sucesso.
4. **Given** um documento fiscal de **outra** organização, **When** um usuário autenticado tenta
   baixá-lo (por id direto, sem ser dono), **Then** o sistema recusa (403), nunca entrega o
   arquivo.
5. **Given** o dono de um documento não é resolvível (erro de rede, documento inexistente),
   **When** o download é tentado, **Then** o sistema não eleva privilégio e a chamada segue com a
   identidade do usuário comum (fail-closed).

---

### User Story 2 - NF-e emite com o meio de pagamento real do pedido (Priority: P1)

Um lojista emite a NF-e de um pedido de venda cujo pagamento foi registrado como "Dinheiro" e a
nota sai com o código fiscal correto (`tPag=01`), sem a mensagem enganosa de "forma de pagamento
desconhecida" quando a forma está corretamente configurada.

**Why this priority**: bloqueia a emissão de NF-e de qualquer pedido criado antes desta correção
(e continuaria bloqueando pedidos novos, já que o formulário ainda grava o id do catálogo mock) —
mesma severidade de negócio do B1 da spec erp/029 que este bug reabre por trás.

**Independent Test**: emitir a NF-e do pedido `#8 — Cliente Teste` (pagamento em Dinheiro) e ver
`tPag=01`, sem a rejeição por forma de pagamento desconhecida.

**Acceptance Scenarios**:

1. **Given** um pedido de venda novo, **When** o lojista escolhe uma forma de pagamento no
   formulário, **Then** o pagamento é gravado com o id real (UUID) da forma cadastrada em
   Configurações → Formas de pagamento, não um slug do catálogo interno.
2. **Given** um pedido já existente com `methodId` de catálogo mock reconhecível
   (`pm-dinheiro`, `pm-boleto`, `pm-pix`, `pm-cartao-debito`, `pm-cartao-credito`), **When** a
   migração de dados roda, **Then** o pagamento passa a apontar para o UUID real da forma
   correspondente pelo `systemKey` (`pm-cartao-credito` → `pm-cartao`/Cartão de Crédito,
   `pm-cartao-debito` → `pm-cartao-debito`/Cartão de Débito, os demais 1:1 pelo mesmo texto).
3. **Given** um pedido cujo pagamento aponta para uma forma que não existe mais (id órfão, não
   reconhecível como slug antigo), **When** o lojista tenta emitir a NF-e, **Then** a mensagem diz
   que a forma de pagamento do pedido não está mais cadastrada e pede para editar o pedido — não
   "configure o código fiscal" (que induz a corrigir algo já correto).
4. **Given** uma forma de pagamento existente mas sem `fiscalCode` configurado, **When** o
   lojista tenta emitir a NF-e, **Then** a mensagem nomeia a forma e aponta para Configurações →
   Formas de pagamento (comportamento já existente da spec erp/029, preservado).
5. **Given** os seletores de forma de pagamento de Pedidos de venda, Vendas, Compras e Ordens de
   Serviço, **When** o lojista abre qualquer um desses formulários, **Then** a lista de formas
   vem do cadastro real (`/v1/payment-methods`), não do catálogo mock local.

---

### User Story 3 - Alíquota de ISSQN correta na nota de serviço (Priority: P2)

Quando um grupo de ISSQN tem retenção e alíquota configuradas, a alíquota transmitida ao órgão
(`pAliq` na DPS) reflete o percentual real configurado, sem multiplicar ou dividir por 100 na
direção errada.

**Why this priority**: só tem efeito visível quando a nota usa retenção de ISS — não bloqueia a
emissão comum (o teste de 15/08 emitiu com sucesso, sem retenção), mas é um erro de valor fiscal
transmitido ao órgão quando o cenário ocorre.

**Independent Test**: emitir uma NFS-e com um grupo de ISSQN que tem retenção marcada e alíquota
configurada (ex.: 5%); conferir que o `pAliq` no XML/DPS reflete 5.00, não 500.00 nem 0.05.

**Acceptance Scenarios**:

1. **Given** um grupo de ISSQN com `issqnRate = 5` (cadastrado como "5" no campo "Alíquota do
   ISS (%)") e retenção marcada, **When** uma NFS-e é emitida com esse grupo, **Then** o `pAliq`
   da DPS transmitida é `5.00`.
2. **Given** o mesmo grupo, **When** a tela de emissão de NFS-e mostra a alíquota do grupo
   selecionado, **Then** o valor exibido bate com o que seria transmitido ao órgão (mesma
   unidade, percentual).

### Edge Cases

- Documento fiscal com `companyId` nulo (Emitente nunca provisionado): download não eleva,
  cai no token do usuário, fiscal-api recusa (comportamento já existente, preservado).
- Pedido com múltiplos pagamentos, um deles com id órfão e outro válido: bloqueia a emissão
  citando a forma inválida especificamente (não trata o pedido inteiro como genericamente
  quebrado).
- Grupo de ISSQN sem retenção marcada: `pAliq` nunca é transmitido (comportamento já existente,
  fora do escopo desta correção — só o cálculo quando há retenção muda).

## Requirements *(mandatory)*

### Functional Requirements

**B1 — Proxy e adapter fiscal**

- **FR-001**: O proxy `/api/proxy/fiscal` DEVE elevar `GET /v1/fiscal-documents` (lista, com
  `companyId` na query) para o token de serviço, com o mesmo dono verificado no servidor
  (`identity.companyId`) já usado nas demais rotas company-scoped — via um allowlist explícito
  desta rota, não a reabertura do disjunto genérico `Boolean(queryCompanyId)` que causou o
  CRITICAL da spec 029.
- **FR-002**: `HttpFiscalApiAdapter.listDocuments`/`getSummary` (erp-api) DEVEM enviar `companyId`
  como query param para a fiscal-api (contrato real de `GET /v1/fiscal-documents[/summary]`), não
  só como header `X-Company-Id`.
- **FR-003**: O branch de download de documento (`fiscalDocumentDownloadId`) do proxy DEVE enviar
  `X-Company-Id: identity.companyId` na chamada upstream quando eleva, para rotas que a
  fiscal-api valida com o decorator `@CompanyId()` (DANFE/DANFSE).
- **FR-004**: Documento cujo dono não se resolve (erro de rede, documento inexistente, sem
  `companyId`) DEVE continuar saindo com o token do usuário — nunca eleva sem confirmar o dono.
- **FR-005**: Documento de organização diferente da ativa DEVE ser recusado (403), nunca
  entregue.

**B2 — Pagamento real na NF-e**

- **FR-006**: Os formulários de Pedidos de venda, Vendas (reaproveita o mesmo form), Compras e
  Ordens de Serviço DEVEM listar formas de pagamento a partir de `/v1/payment-methods` (UUID
  real), não do catálogo mock local (`purchases/data/mock-payment-methods.ts`).
- **FR-007**: Uma migração de dados DEVE resolver pedidos de venda existentes cujo pagamento
  aponta para um dos 5 ids conhecidos do catálogo mock (`pm-dinheiro`, `pm-boleto`, `pm-pix`,
  `pm-cartao-debito`, `pm-cartao-credito`), substituindo pelo UUID real da forma de sistema
  correspondente (via `systemKey`): os 4 primeiros mapeiam 1:1 pelo mesmo texto de `systemKey`;
  `pm-cartao-credito` mapeia para o `systemKey` `pm-cartao` (Cartão de Crédito). Um eventual
  `methodId` literal `pm-cartao` (sem sufixo) mapeia também para Crédito, por segurança.
- **FR-008**: Pagamentos cujo `methodId` é `pm-transferencia` (sem forma de sistema
  correspondente) ou qualquer outro id não reconhecido (nem slug mock conhecido, nem UUID
  existente) permanecem como estão — a migração não inventa um vínculo para id não reconhecível.
- **FR-009**: A mensagem de bloqueio de emissão DEVE distinguir "forma existe mas sem
  `fiscalCode`" (mensagem já existente) de "forma não está mais cadastrada" (mensagem nova,
  orienta a editar o pedido).
- **FR-010**: `mock-payment-methods.ts` DEVE ser removido depois que os 4 formulários migrarem
  (nenhum consumidor restante).

**B3 — Alíquota de ISSQN**

- **FR-011**: O cálculo de `pAliq` na DPS (fiscal-api) DEVE tratar `issRate` como percentual
  (0–100), consistente com a validação e a exibição já existentes no erp-api/erp-web — não
  multiplicar por 100.
- **FR-012**: Testes existentes que assumiam `issRate` como fração (0–1) DEVEM ser corrigidos
  para percentual, preservando a cobertura do comportamento (retenção liga/desliga `pAliq`).

### Key Entities

- **PaymentMethod** (erp-api, já existe): `id` (UUID), `systemKey` (slug estável das 15 formas de
  sistema), `fiscalCode` (tPag). Fonte de verdade para o backfill.
- **SaleOrderPayment** (dentro de `SaleOrder`, já existe): `methodId` — hoje pode conter um slug
  de catálogo mock em registros antigos; após a migração, sempre um UUID de `PaymentMethod` ou um
  id não reconhecido preservado como está (FR-008).
- **FiscalGroup (ISSQN)** (erp-api, já existe): `issqnRate` — percentual 0–100, sem mudança de
  schema; só o consumo em `dps-xml.builder.ts` (fiscal-api) muda.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Facilita NF-e carrega a lista de documentos da organização em até 3 segundos, sem
  erro, para uma organização com Emitente configurado.
- **SC-002**: 100% dos downloads de XML e PDF de documentos autorizados e pertencentes à
  organização ativa completam com sucesso; 100% das tentativas de baixar documento de outra
  organização são recusadas.
- **SC-003**: A NF-e do pedido #8 (e qualquer pedido com pagamento em forma configurada) emite
  sem a rejeição de forma de pagamento desconhecida.
- **SC-004**: Zero pedidos de venda pré-existentes com `methodId` de um dos 4 slugs mock
  conhecidos permanecem não resolvidos após a migração rodar.
- **SC-005**: `pAliq` transmitido numa NFS-e com retenção reflete o percentual configurado no
  grupo, sem fator de 100 na direção errada.

## Assumptions

- O único consumidor de `GET /api/proxy/fiscal/v1/fiscal-documents` hoje é uso direto/futuro da
  rota (a listagem do Facilita NF-e já migrou para o erp-api) — reabrir o allowlist para essa
  rota é sobre paridade de contrato e o pedido explícito do teste, não sobre desfazer a migração.
- O grupo de ISSQN "Principal" com `issqnRate = 0.05` cadastrado hoje é dado incorreto (typo),
  não algo que a correção deva "consertar" automaticamente — corrigir o lado errado tem efeito
  fiscal (o próprio prompt pede cautela); a correção do dado é manual, feita pelo usuário depois
  que o código estiver correto e sem ambiguidade de unidade.
- Nenhuma migration de schema é necessária para B2 (é um backfill de dado, não mudança de
  coluna) nem para B3 (é uma correção de cálculo em runtime, o dado já está correto na tabela).
