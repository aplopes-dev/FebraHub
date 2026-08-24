# Quickstart: validar Adicionais e Sugestões do produto (backend)

Pré-requisitos: infra local no ar (`pnpm infra:up`), `erp-api` migrada e
rodando (`pnpm --filter @citybox/erp-api dev`, porta 3114), uma organização
válida (via `pnpm --filter @citybox/erp-api db:seed` ou já existente) e um
token de acesso — em dev, `AUTH_DEV_BYPASS=true` + `Authorization: Bearer
dev-admin` (ver `apps/erp/api/AGENTS.md` §5.3).

Defina o cabeçalho comum:

```bash
export ERP_API=http://localhost:3114/api
export ORG_ID=<uuid-da-organizacao-de-teste>
export AUTH_HEADER="Authorization: Bearer dev-admin"
```

## 1. Migrar o schema

```bash
pnpm --filter @citybox/erp-api db:migrate:dev --name add_product_addons_and_suggestions
pnpm --filter @citybox/erp-api db:generate
```

**Expected**: migration aplicada sem erro; 4 tabelas novas
(`product_addons`, `product_addon_settings`, `product_addon_lines`,
`product_suggestions`) visíveis no schema `erp`.

## 2. Cadastrar dois adicionais no catálogo (User Story 1)

```bash
curl -s -X POST "$ERP_API/v1/product-addons" \
  -H "$AUTH_HEADER" -H "X-Organization-Id: $ORG_ID" -H "Content-Type: application/json" \
  -d '{"name":"Bacon","defaultPriceCents":350}'

curl -s -X POST "$ERP_API/v1/product-addons" \
  -H "$AUTH_HEADER" -H "X-Organization-Id: $ORG_ID" -H "Content-Type: application/json" \
  -d '{"name":"Queijo cheddar","defaultPriceCents":200}'
```

**Expected**: dois `201` com `id`/`name`/`defaultPriceCents`. Repetir o
primeiro `POST` com o mesmo nome → `409` (FR-002).

```bash
curl -s "$ERP_API/v1/product-addons" -H "$AUTH_HEADER" -H "X-Organization-Id: $ORG_ID"
```

**Expected**: `data` com os dois adicionais criados (SC-001 — base do
seletor).

## 3. Configurar os adicionais de um produto existente (User Story 2)

Substitua `PRODUCT_ID` por um produto já cadastrado na organização (ex.: via
`GET $ERP_API/v1/products?perPage=1`).

```bash
curl -s -X PUT "$ERP_API/v1/products/$PRODUCT_ID" \
  -H "$AUTH_HEADER" -H "X-Organization-Id: $ORG_ID" -H "Content-Type: application/json" \
  -d '{
    "...": "demais campos do produto conforme o payload atual de UpdateProduct",
    "addonSettings": { "minQuantity": 1, "maxQuantity": 3, "chargeFromSelectedQuantity": true, "chargeFromQuantity": 2 },
    "addonLines": [
      { "addonId": "<id-bacon>", "maxQuantity": 2, "priceCents": 350, "sortOrder": 0 },
      { "addonId": "<id-queijo>", "maxQuantity": 1, "priceCents": 200, "sortOrder": 1 }
    ]
  }'
```

**Expected**: `200` com `addonSettings`/`addonLines` ecoados. Repetir o `GET`
do produto e confirmar que os mesmos valores voltam exatamente iguais
(SC-001).

**Validação de erro** (FR-007): reenviar com `minQuantity: 5, maxQuantity: 1`
→ `422`. **Validação de duplicidade** (FR-009): reenviar `addonLines` com o
mesmo `addonId` duas vezes → `409`.

## 4. Configurar sugestões (User Story 3)

```bash
curl -s -X PUT "$ERP_API/v1/products/$PRODUCT_ID" \
  -H "$AUTH_HEADER" -H "X-Organization-Id: $ORG_ID" -H "Content-Type: application/json" \
  -d '{
    "...": "demais campos do produto",
    "suggestions": [
      { "suggestedProductId": "<id-produto-b>", "sortOrder": 0 },
      { "suggestedProductId": "<id-produto-c>", "sortOrder": 1 }
    ]
  }'
```

**Expected**: `200` com `suggestions` ecoadas. Reenviar com
`suggestedProductId` igual ao próprio `$PRODUCT_ID` → `422` (FR-015,
autossugestão). Reenviar com o mesmo `suggestedProductId` duas vezes → `409`
(FR-014).

## 5. Exclusão não quebra o produto dono (SC-003)

```bash
curl -s -X DELETE "$ERP_API/v1/product-addons/<id-bacon>" -H "$AUTH_HEADER" -H "X-Organization-Id: $ORG_ID"
curl -s -X DELETE "$ERP_API/v1/products/<id-produto-b>" -H "$AUTH_HEADER" -H "X-Organization-Id: $ORG_ID"

curl -s "$ERP_API/v1/products/$PRODUCT_ID" -H "$AUTH_HEADER" -H "X-Organization-Id: $ORG_ID"
```

**Expected**: `200` — o produto carrega normalmente; `addonLines` não traz
mais a linha do Bacon excluído, `suggestions` não traz mais o produto B
excluído, sem erro 404/500.

## 6. Testes automatizados

```bash
pnpm --filter @citybox/erp-api test -- product-addon
pnpm --filter @citybox/erp-api test -- product.entity
pnpm --filter @citybox/erp-api typecheck
pnpm --filter @citybox/erp-api lint
```

**Expected**: todos verdes — cobre os use cases novos (`create/update/delete/
list-product-addon`) e a extensão de `create-product`/`update-product` para
`addonSettings`/`addonLines`/`suggestions`, com repositórios in-memory (molde
`tests/in-memory-*.repository.ts` de `variations`).
