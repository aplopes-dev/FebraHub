# Research: Catálogo — backend de Adicionais e Sugestões do produto

Sem `NEEDS CLARIFICATION` restante no Technical Context do `plan.md` — a stack,
storage e padrão arquitetural já são ditados pelo `apps/erp/api/AGENTS.md` e
pelo módulo `catalog` existente. Este documento registra as decisões de design
tomadas ao ler o código real (não há ambiguidade de tecnologia a pesquisar
externamente; a pesquisa foi **no próprio monorepo**).

## Decisão 1 — Onde vivem as duas seções: aninhadas no payload do produto

**Decision**: `addonSettings`, `addonLines` e `suggestions` entram como campos
opcionais em `CreateProductDto`/`UpdateProductDto` e na resposta
`ProductResponse`, exatamente como `variations`/`suppliers`/`branchIds` já
funcionam hoje. Sem endpoints `POST/PUT/DELETE` por linha.

**Rationale**: É o padrão já estabelecido e testado no mesmo módulo para
"coleções pequenas, donas de um produto, sempre substituídas por completo ao
salvar o formulário" — `variations` (`resolveProductVariations`), `suppliers`
(`ProductSupplierLink[]`) e `branchIds`. O frontend (mock atual) já modela as
duas abas como parte do mesmo objeto de formulário do produto
(`ProductAddonsConfig`/`ProductSuggestionRow[]` num único `onChange` por aba),
então o contrato aninhado é o que o cliente (quando migrar do mock) já espera
sem redesenho de tela.

**Alternatives considered**:
- *Endpoints REST próprios por linha* (`POST /v1/products/:id/addon-lines`,
  etc.) — rejeitado: quebra o padrão do módulo, obriga o frontend a orquestrar
  N chamadas por save (o form atual salva tudo de uma vez com um botão
  "Salvar" único), e nenhuma outra seção do produto funciona assim hoje.
- *Sub-recurso paginado independente* (`GET /v1/products/:id/addons?page=`) —
  rejeitado: FR-020/FR-021 e a UI (lista pequena, sempre carregada inteira,
  reordenável por drag-and-drop) não pedem paginação; o princípio II da
  Constitution (busca/paginação no backend) se aplica a coleções que crescem
  sem limite — não é o caso de "adicionais de um produto" (tipicamente < 20
  linhas).

## Decisão 2 — Catálogo de Adicionais como entidade própria da organização

**Decision**: `ProductAddon` é uma entidade nova (`nome`, `preço padrão`,
soft-delete), com CRUD dedicado em `v1/product-addons` — mesmo molde de
`v1/product-categories` (nome único, sem `page`/`perPage` obrigatório,
`?active=true` alimentando dropdown).

**Rationale**: Confirmado pelo mock do frontend (`MOCK_PRODUCT_ADDONS`, uma
lista simples de `{ id, name }` independente de `MOCK_PRODUCTS`) e pela
Assumption já registrada no spec. Um catálogo à parte também é o que permite
reaproveitar o mesmo adicional ("Bacon") em N produtos sem duplicar cadastro —
o próprio objetivo da User Story 1.

**Alternatives considered**:
- *Adicional = um `Product` com `type = addon`* — rejeitado: infla a entidade
  `Product` (SKU, categoria, unidade de medida, estoque, variações — tudo
  irrelevante para um adicional simples de nome+preço) e contradiz o mock, que
  já trata os dois catálogos como coisas diferentes.

## Decisão 3 — Duplicidade de nome no catálogo de Adicionais: validação de aplicação, não constraint de banco case-insensitive

**Decision**: Unicidade de nome (case-insensitive, só entre ativos) verificada
no use case (`CreateProductAddonUseCase`/`UpdateProductAddonUseCase`, molde
exato de `CreateProductCategoryUseCase.findByName`), com um `@@unique` simples
`[organizationId, name]` no schema como rede de segurança contra corrida —
mesmo padrão de `ProductCategory`/`UnitOfMeasure`, que também não usam índice
parcial (`WHERE deleted_at IS NULL`) para a unicidade.

**Rationale**: Prisma 7 não expõe índice parcial (`@@unique` com predicado) na
DSL sem sair do fluxo `prisma migrate dev` (regra §5.9 do `AGENTS.md` proíbe
SQL manual em migration) — replicar exatamente a solução já adotada por
`ProductCategory`/`UnitOfMeasure` evita inventar um mecanismo novo só para
esta feature.

**Alternatives considered**:
- *Índice único parcial via SQL manual pós-migration* — rejeitado por §5.9.
- *Unicidade case-sensitive pura no banco, sem checagem de app* — rejeitado:
  não atende FR-002 (case-insensitive) sozinho.

## Decisão 4 — Substituição atômica das duas seções ao salvar o produto

**Decision**: `UpdateProductUseCase` (e `CreateProductUseCase`) chamam
`resolveProductAddonLines`/`resolveProductSuggestions` (moldados em
`resolveProductVariations`) dentro da mesma `$transaction` do Prisma que já
substitui `variations`/`suppliers`/`branches` — `deleteMany` + `createMany`
por seção, ou `upsert` por linha com `sortOrder` explícito.

**Rationale**: FR-012/FR-019 exigem atomicidade "tudo ou nada"; o
`UpdateProductUseCase` já abre uma transação para as demais seções do produto
— estender a mesma transação evita um segundo ponto de falha parcial.

**Alternatives considered**:
- *Transações separadas por seção* — rejeitado: uma falha ao gravar
  `suggestions` depois de `addonLines` já commitado deixaria o produto num
  estado parcialmente salvo, violando FR-012/FR-019 e SC-002.

## Decisão 5 — Preço da linha de adicional é congelado no vínculo (não FK "ao vivo" no preço do catálogo)

**Decision**: `ProductAddonLine.priceCents` é uma coluna própria, copiada do
`ProductAddon.defaultPriceCents` só como valor inicial ao criar a linha no
frontend — sem trigger, sem recomputo no `GET`.

**Rationale**: Edge case do spec ("um adicional com preço alterado no catálogo
depois de já vinculado... o vínculo existente mantém o preço configurado na
linha do produto"). Mesma filosofia de `ProductVariationOption.priceCents`
(override nullable que, quando setado, é o preço final da linha).

**Alternatives considered**:
- *Sempre ler o preço do catálogo, sem override por linha* — rejeitado:
  contradiz FR-008 explicitamente ("preço... editável e persistido de forma
  independente") e o comportamento do frontend mock (`CurrencyInput` por
  linha, editável).

## Decisão 6 — Exclusão de `Product` sugerido: leitura filtra, não cascata

**Decision**: `ProductSuggestion.suggestedProductId` usa `onDelete: Restrict`
a nível de FK (não permite hard-delete de um `Product` referenciado — mas
`Product` já é soft-delete, então isso nunca dispara na prática) e a
**leitura** (`FindProductByIdUseCase`/`resolveProductSuggestions` no GET)
filtra `suggestedProduct.deletedAt IS NULL` antes de devolver a lista.

**Rationale**: FR-018 pede que a sugestão "suma da listagem ativa" sem quebrar
o produto dono — filtrar na leitura é mais barato e mais seguro que apagar a
linha (o vínculo pode reaparecer se o produto for restaurado via
`POST /v1/products/:id/restore`, comportamento já existente na API).

**Alternatives considered**:
- *Apagar a `ProductSuggestion` quando o produto sugerido é excluído* —
  rejeitado: perde a linha se o produto sugerido for restaurado depois (a API
  já suporta restore de produto), forçando o lojista a reconfigurar a
  sugestão à toa.
