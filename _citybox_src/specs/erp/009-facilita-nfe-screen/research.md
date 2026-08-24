# Research — Tela Facilita NFE (aba "Emitido")

## 1. Escopo confirmado

Só a aba "Emitido" (US1). "Recebido", "Histórico de Envios" e as ações "Agendar
envio"/"Enviar por e-mail" ficam como placeholder (ver spec.md `## Clarifications`).

## 2. Resolução de `companyId` (fiscal-api) a partir da loja ativa (erp-web)

- **Decision**: resolver o Emitente fiscal pelo **CNPJ da organização ativa**, não por um
  novo filtro `storeId`. `erp-web` já sabe o CNPJ da organização (`company-settings`,
  `GET /v1/organizations/current` na `erp-api`). Chamar
  `GET /v1/companies?cnpj={cnpj}&active=true` na `fiscal-api` (rota existente,
  `list-companies`) para obter o `Company.id` (= `companyId` de `fiscal-documents`), com
  `staleTime` alto (React Query) — o vínculo Emitente↔Organização não muda a cada render.
- **Rationale**: zero mudança de contrato na `fiscal-api` (o filtro `cnpj` já existe);
  reaproveita dado que o app já carrega na tela de Dados da empresa.
- **Alternatives considered**: adicionar filtro `storeId` a `GET /v1/companies` — rejeitado
  por não ser necessário (o filtro `cnpj` já resolve o caso 1:1 Organização↔Emitente da
  Fase 1 do piloto Ilhéus) e por manter o escopo de backend desta entrega restrito ao
  módulo `fiscal-documents`.
- **Edge case**: se não existir `Company` cadastrado para o CNPJ da organização (Emitente
  fiscal ainda não configurado), a aba "Emitido" mostra estado vazio com mensagem
  orientando a configurar o Emitente fiscal (fora do escopo desta feature configurar isso
  — só sinalizar).

## 3. Backend novo em `fiscal-api` (módulo `fiscal-documents`) — resolvido via Clarifications

A Constitution (Princípio II) exige busca/paginação/ordenação **backend-driven**; a
`erp-api`/`erp-web` não podem carregar o conjunto completo e filtrar no cliente.
`GET /v1/fiscal-documents` hoje filtra por `companyId`/`documentType`/`status`/
`sourceSystem`/`externalReference` e pagina (`page`/`perPage`), mas **não tem busca
textual nem endpoint de totais por status**. Decisão (clarificada com o usuário):
estender a `fiscal-api` nesta entrega.

### 3.1 `search` em `GET /v1/fiscal-documents`

- **Decision**: novo query param `search` (string, opcional) no
  `ListFiscalDocumentsRoute`/`ListFiscalDocumentsUseCase`/
  `FiscalDocumentRepository.findAll`, resolvido via `WHERE` no Prisma (`OR` sobre
  `number`, `series` — `contains`, `mode: 'insensitive'`), nunca carregado em
  memória para filtrar. **Ajuste feito na implementação**: `customer.name` ficou
  fora do `search` — o repositório fake (`InMemoryFiscalDocumentRepository`,
  usado pelo contrato compartilhado com o Prisma) não tem relação com
  `InMemoryCustomerRepository`, e a entidade `FiscalDocument` não carrega o nome
  do cliente como propriedade própria (só via `withItems`-like join só de
  leitura, ver §3.5). Buscar por nome de cliente ficaria inconsistente entre os
  dois repositórios do contrato — mantido fora do escopo do `search` por ora;
  documentado como limitação conhecida.
- **Rationale**: mesmo padrão dos demais módulos (`bank-accounts`, `financial-statement`)
  — busca com debounce 400ms no client, `search` na query string, cache por
  `queryKey` incluindo o termo.
- **Alternatives considered**: filtrar só por `status`/`documentType` sem busca livre —
  rejeitado pelo usuário (a tela precisa da caixa "Buscar por" do mockup).

### 3.2 Endpoint de totais por status

- **Decision**: novo `GET /v1/fiscal-documents/summary` (mesmo `companyId`/`search`/
  `documentType` do filtro ativo, sem `status`/paginação) devolvendo
  `{ total, authorized, cancelled }` — contagens via `count()` agrupado por status no
  banco (Prisma `groupBy` ou 3 `count()` com `WHERE status IN (...)` mapeado).
  `manifestedFinal`/`unmanifested` **não fazem parte da resposta** (ver §4) — o frontend
  sempre renderiza esses 2 cards zerados/desabilitados, sem chamada de API para eles.
- **Rationale**: os cards de totais MUST refletir o conjunto filtrado (FR-003) sem violar
  o Princípio II — um endpoint de agregação dedicado evita carregar todas as páginas no
  cliente só para somar.
- **Mapeamento de status → card**:
  - "Autorizadas" = `AUTHORIZED`
  - "Canceladas" = `CANCEL_AUTHORIZED`
  - "Total" = contagem de todos os documentos do filtro (todos os `FISCAL_DOCUMENT_STATUSES`)

### 3.3 Cards "Manifestações finais" / "Não manifestadas"

- **Decision** (clarificado com o usuário): manter os 5 cards do mockup na aba "Emitido"
  por fidelidade visual, mas "Manifestações finais" e "Não manifestadas" ficam **sempre
  zerados e visualmente marcados como não aplicáveis** (ex.: `Tooltip`/opacidade
  reduzida) — não geram chamada de API nem contam no summary endpoint.
- **Rationale**: manifestação do destinatário é um conceito do fluxo de documentos
  **recebidos** (fora de escopo, US2) — não existe no domínio de documentos emitidos.
  Remover os cards mudaria o layout aprovado no mockup sem necessidade; zerá-los é a
  opção que menos surpreende visualmente mantendo honestidade sobre o dado (não fica
  parecendo "0 pendências", fica marcado como indisponível).

### 3.4 `documentType` já suporta NFC-e — só a anotação Swagger está desatualizada

- **Finding**: `FiscalDocumentType`/`DOCUMENT_TYPES` (`fiscal-document.entity.ts`) já
  inclui `'NFCE'` — o `@ApiQuery({ enum: ['NFE', 'NFSE'] })` do
  `ListFiscalDocumentsRoute` está com a doc Swagger incompleta (não bloqueia
  funcionalmente; o DTO tipa `FiscalDocumentType`, que aceita `NFCE`).
- **Decision**: corrigir a anotação Swagger (`enum: ['NFE', 'NFSE', 'NFCE']`) na mesma
  tarefa que adiciona `search`, já que o arquivo é tocado de qualquer forma.

### 3.5 Coluna "Cliente" (FR-004) — `customerName` é um join só de leitura

- **Finding**: `toFiscalDocumentResponse` hoje devolve `customerId` (uuid), nunca o
  nome do cliente — e `PrismaFiscalDocumentRepository.findAll` nem inclui a relação
  `customer` na query. A coluna "Cliente" da aba "Emitido" (FR-004) ficaria sempre
  vazia sem essa mudança.
- **Decision**: `findAll`/`findById` do repositório Prisma passam a `include: {
  customer: true }` além de `items`; a entidade `FiscalDocument` ganha um método
  `withCustomerName(name: string | null)` (mesmo padrão de `withItems` — join de
  leitura anexado depois da reconstrução, não uma prop do `FiscalDocumentProps`);
  `toFiscalDocumentResponse` passa a expor `customerName`. O repositório fake
  (`InMemoryFiscalDocumentRepository`) ganha o mesmo método de conveniência para os
  testes poderem simular um documento com cliente identificado.
- **Rationale**: manter `customerName` fora de `FiscalDocumentProps` evita que a
  entidade de domínio dependa de uma tabela relacionada só para leitura de exibição —
  seguindo exatamente o precedente já estabelecido por `items`.

## 4. Frontend — stack e padrão a seguir

- **Decision**: seguir o padrão MUI 100% já estabelecido no módulo Finanças do
  `erp-web` (`features/bank-accounts`, `features/financial-statement`) — não usar
  `data-table-shadcn`/`@citybox/ui` nesta feature.
  - `api/` — `fiscal-document.dto.ts` (shape da resposta), `fiscal-document.mapper.ts`,
    `facilita-nfe.service.ts` (via `comercioFetch`/proxy — ver §5).
  - `hooks/` — `use-facilita-nfe-list.ts` (molde `use-bank-account-list.ts`: search com
    debounce 400ms, page/perPage, React Query), `use-facilita-nfe-summary.ts` (query
    separada para os cards, mesmos filtros exceto paginação).
  - `components/` — `FacilitaNfeTabs` (MUI `Tabs`), `FacilitaNfeSummaryCards` (molde
    `financial-statement-summary-cards.tsx`), `FacilitaNfeIssuedTable` (`DataTable` de
    `@/components/ui/data-table`, `manualPagination`).
  - `pages/` — `FacilitaNfePage` (client component; a rota
    `app/(app)/financas/facilita-nfe/page.tsx` passa a reexportar essa page, saindo do
    `PlaceholderPage`).
- **Rationale**: consistência com o restante de Finanças (mesmo reviewer, mesmo padrão
  visual); zero componente novo de tabela.

## 5. Como a chamada chega na `fiscal-api`

- **Decision**: **novo proxy** `app/api/proxy/fiscal/[...path]/route.ts` (molde
  `app/api/proxy/comercio/`) — injeta o mesmo Bearer da sessão BFF (cookie httpOnly) e
  encaminha para `FISCAL_API_URL` (nova env, default `http://127.0.0.1:3116/api` —
  porta real confirmada em `services/fiscal-api/.env`, `PORT=3116`). **Achado**: essa
  porta não consta na tabela "Mapa de serviços e portas" do `CLAUDE.md` raiz nem do
  `AGENTS.md` raiz — a tabela precisa ganhar a linha `fiscal-api · @citybox/fiscal-api ·
  3116 · services/fiscal-api` na mesma operação que introduzir `FISCAL_API_URL` (Docs-as-
  Code, Constitution Princípio I).
- **Rationale**: mesma arquitetura de auth do resto do app (§5.0 do `AGENTS.md` de
  `erp-web`) — o browser nunca fala direto com a `fiscal-api`; o BFF troca o cookie por
  Bearer. `fiscal-api` usa guards Keycloak (`AuthGuard`/`PermissionGuard`,
  `RequirePermission('fiscal.documents.view')`) — o client OAuth do `erp-web`
  (`citybox-backoffice`) precisa ter esse escopo/role liberado no realm (verificar em
  Keycloak antes de implementar; se não tiver, é um pré-requisito de infra, não de
  código).
- **Alternatives considered**: reexportar via `erp-api` (BFF de domínio) — rejeitado por
  enquanto: nenhuma outra tela do `erp-web` faz isso, aumentaria o escopo (mudança em 2
  serviços) sem necessidade — o padrão de proxy direto já existe e resolve.

## 6. Navegação

- **Correção (após checar `lib/navigation.ts` diretamente na fase de implementação)**:
  o item `financas-facilita-nfe` (`/financas/facilita-nfe`) **não está** `disabled` —
  só o item de Estoque (`estoque/facilita-nfe`, "NF-e de entrada") tem `disabled: true`.
  A leitura original deste research (baseada só no texto do `AGENTS.md`, sem checar o
  código) misturou a nota de `disabled` do grupo COMPRAS de Estoque com o grupo NOTAS
  FISCAIS de Finanças — eram grupos diferentes. **Nenhuma mudança em `lib/navigation.ts`
  é necessária**: o item já é clicável e já aparece no ⌘K hoje; a tela só está em branco
  porque a rota renderiza `PlaceholderPage` (corrigido nesta feature).

## 7. Testes

- Backend (`fiscal-api`): estender `list-fiscal-documents.use-case.spec.ts` (`search`) +
  novo `get-fiscal-documents-summary.use-case.spec.ts`; Postgres real (sem mocks de
  banco, conforme `AGENTS.md` raiz).
- Frontend (`erp-web`): Vitest + Testing Library para `use-facilita-nfe-list`/
  `use-facilita-nfe-summary` (MSW mockando o proxy) e para os componentes de tabela/
  cards (estados vazio/erro/carregando).
