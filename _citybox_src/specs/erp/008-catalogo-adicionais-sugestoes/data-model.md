# Data Model: Catálogo — backend de Adicionais e Sugestões do produto

Todas as tabelas abaixo entram no schema `erp` (`apps/erp/api/prisma/schema.prisma`),
mesmo banco (`citybox_platform`) e mesma convenção do restante do módulo
`catalog`: `id String @id @default(uuid())`, `organizationId` obrigatório,
`@@map` em snake_case, timestamps `createdAt`/`updatedAt` (`@db.Timestamptz(3)`),
dinheiro em **centavos** (`Int`). Todas entram em `TENANT_SCOPED_MODELS`
(`shared/infra/prisma/tenant-scope.extension.ts`).

## ProductAddon

Catálogo de adicionais da organização (User Story 1). Independente de `Product`.

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `String` (uuid) | PK |
| `organizationId` | `String` | FK `Organization`, obrigatório |
| `name` | `String` | Obrigatório; único por organização entre ativos, case-insensitive (validado na aplicação — FR-002) |
| `defaultPriceCents` | `Int` | Default `0`; `>= 0` |
| `deletedAt` | `DateTime?` | Soft-delete (FR-004) |
| `createdAt` / `updatedAt` | `DateTime` | Automáticos |

```prisma
model ProductAddon {
  id                String    @id @default(uuid())
  organizationId    String    @map("organization_id")
  name              String
  defaultPriceCents Int       @default(0) @map("default_price_cents")
  deletedAt         DateTime? @map("deleted_at") @db.Timestamptz(3)
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)

  organization Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  productLines ProductAddonLine[]

  @@unique([organizationId, name])
  @@unique([id, organizationId])
  @@index([organizationId])
  @@index([organizationId, deletedAt])
  @@map("product_addons")
  @@schema("erp")
}
```

## ProductAddonSettings

Configuração de adicionais do produto — **1:1 com `Product`** (User Story 2).
Só existe quando o lojista configurou a seção pelo menos uma vez; ausência =
seção com os defaults do frontend (min 1 / max 1 / cobrança desativada).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `String` (uuid) | PK |
| `organizationId` | `String` | FK `Organization` |
| `productId` | `String` (unique) | FK `Product`, 1:1 |
| `minQuantity` | `Int` | Default `0`; `>= 0` |
| `maxQuantity` | `Int` | Default `0`; `>= 0`; `>= minQuantity` (FR-007) |
| `chargeFromSelectedQuantity` | `Boolean` | Default `false` |
| `chargeFromQuantity` | `Int` | Default `1`; `>= 1`; obrigatório funcionalmente só quando a flag acima é `true` (FR-006) |

```prisma
model ProductAddonSettings {
  id                         String   @id @default(uuid())
  organizationId             String   @map("organization_id")
  productId                  String   @unique @map("product_id")
  minQuantity                Int      @default(0) @map("min_quantity")
  maxQuantity                Int      @default(0) @map("max_quantity")
  chargeFromSelectedQuantity Boolean  @default(false) @map("charge_from_selected_quantity")
  chargeFromQuantity         Int      @default(1) @map("charge_from_quantity")
  createdAt                  DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt                  DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  product Product @relation(fields: [productId, organizationId], references: [id, organizationId], onDelete: Cascade)

  @@index([organizationId])
  @@map("product_addon_settings")
  @@schema("erp")
}
```

## ProductAddonLine

Linha de adicional vinculada a um produto (N:1 com `Product`, N:1 com `ProductAddon`).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `String` (uuid) | PK |
| `organizationId` | `String` | FK `Organization` |
| `productId` | `String` | FK `Product` (dono) |
| `addonId` | `String` | FK `ProductAddon` (catálogo); `onDelete: Restrict` — não impede soft-delete do catálogo, só protege contra hard-delete acidental |
| `maxQuantity` | `Int` | Default `1`; `>= 1` |
| `priceCents` | `Int` | Obrigatório; `>= 0`; congelado no vínculo (Research #5) |
| `sortOrder` | `Int` | Default `0`; ordem de exibição (FR-010) |

```prisma
model ProductAddonLine {
  id             String @id @default(uuid())
  organizationId String @map("organization_id")
  productId      String @map("product_id")
  addonId        String @map("addon_id")
  maxQuantity    Int    @default(1) @map("max_quantity")
  priceCents     Int    @map("price_cents")
  sortOrder      Int    @default(0) @map("sort_order")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  product Product      @relation(fields: [productId, organizationId], references: [id, organizationId], onDelete: Cascade)
  addon   ProductAddon @relation(fields: [addonId, organizationId], references: [id, organizationId], onDelete: Restrict)

  /// FR-009: um adicional não pode aparecer 2x na lista do mesmo produto.
  @@unique([productId, addonId])
  @@index([organizationId])
  @@index([addonId])
  @@map("product_addon_lines")
  @@schema("erp")
}
```

## ProductSuggestion

Linha de sugestão (cross-sell) vinculada a um produto — User Story 3.

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `String` (uuid) | PK |
| `organizationId` | `String` | FK `Organization` |
| `productId` | `String` | FK `Product` (dono) |
| `suggestedProductId` | `String` | FK `Product` (sugerido); `productId != suggestedProductId` (FR-015, validado na aplicação — Prisma não expressa `CHECK` entre colunas na DSL) |
| `sortOrder` | `Int` | Default `0`; ordem de exibição (FR-016) |

```prisma
model ProductSuggestion {
  id                 String @id @default(uuid())
  organizationId     String @map("organization_id")
  productId          String @map("product_id")
  suggestedProductId String @map("suggested_product_id")
  sortOrder          Int    @default(0) @map("sort_order")

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  product          Product @relation("ProductSuggestionOwner", fields: [productId, organizationId], references: [id, organizationId], onDelete: Cascade)
  suggestedProduct Product @relation("ProductSuggestionTarget", fields: [suggestedProductId, organizationId], references: [id, organizationId], onDelete: Restrict)

  /// FR-014: um produto sugerido não pode aparecer 2x na lista do mesmo produto dono.
  @@unique([productId, suggestedProductId])
  @@index([organizationId])
  @@index([suggestedProductId])
  @@map("product_suggestions")
  @@schema("erp")
}
```

## Alterações em `Product`

```prisma
model Product {
  // … campos existentes inalterados …

  addonSettings ProductAddonSettings?
  addonLines    ProductAddonLine[]
  suggestionsAsOwner  ProductSuggestion[] @relation("ProductSuggestionOwner")
  suggestionsAsTarget ProductSuggestion[] @relation("ProductSuggestionTarget")
}
```

`suggestionsAsOwner` = sugestões que este produto configurou; `suggestionsAsTarget`
= produtos que sugerem este (não exposta em nenhuma rota nesta fatia — só a
relação inversa do Prisma, para o `onDelete: Restrict` funcionar).

## Regras de validação centralizadas (fora do schema)

| Regra | Onde vive | Requisito |
|---|---|---|
| `minQuantity <= maxQuantity` | Zod validator da entidade `Product` (seção addonSettings) | FR-007 |
| `chargeFromQuantity >= 1` quando `chargeFromSelectedQuantity = true` | idem | FR-006 |
| Nome de `ProductAddon` único (case-insensitive, só entre ativos) | `CreateProductAddonUseCase`/`UpdateProductAddonUseCase` | FR-002 |
| Sem 2 `ProductAddonLine` para o mesmo `addonId` no produto | `resolveProductAddonLines` (antes de persistir) | FR-009 |
| Sem 2 `ProductSuggestion` para o mesmo `suggestedProductId` no produto | `resolveProductSuggestions` | FR-014 |
| `suggestedProductId != productId` | `resolveProductSuggestions` | FR-015 |
| Todo `addonId`/`suggestedProductId` referenciado existe e é da organização | `resolveProductAddonLines`/`resolveProductSuggestions` (mesmo padrão de `VariationNotFoundError`) | FR-008, FR-013 |

## Migration

Uma única migration Prisma (`db:migrate:dev --name add_product_addons_and_suggestions`)
cria as 4 tabelas + as colunas de relação em `Product`. Sem dado a migrar (feature
nova, sem equivalente anterior persistido — o mock do frontend nunca gravou nada).
