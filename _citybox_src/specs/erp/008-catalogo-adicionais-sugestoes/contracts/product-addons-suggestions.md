# Contracts: Adicionais e Sugestões do produto

Base: `apps/erp/api`, prefixo global `/api`. Todas as rotas exigem
`X-Organization-Id` (guards globais — ver `apps/erp/api/AGENTS.md` §5.3/§5.4).
Erros seguem `AppError` (`AppExceptionFilter`): `*NotFound` → 404,
`*Taken`/`*Duplicate` → 409, `ValidatorDomainError`/demais `DomainError` → 422.

## 1. Catálogo de Adicionais (`v1/product-addons`)

Molde exato de `v1/product-categories`.

### `GET /api/v1/product-addons`

Query: `active?: boolean` (default `true`), `page?`, `perPage?` (teto 100),
`search?`. Sem `page`/`perPage` → lista simples (alimenta o seletor da aba
Adicionais do produto, FR-005). Com paginação → uso futuro (tela de cadastro
dedicada, fora de escopo desta fatia).

```jsonc
// 200 — sem paginação
{ "data": [ { "id": "uuid", "name": "Bacon", "defaultPriceCents": 350, "createdAt": "…", "updatedAt": "…" } ] }
```

### `POST /api/v1/product-addons`

Body:
```jsonc
{ "name": "Bacon", "defaultPriceCents": 350 }
```
- `name`: obrigatório, `1..120` chars.
- `defaultPriceCents`: obrigatório, inteiro `>= 0`.
- 409 `ProductAddonNameTakenError` se já existe ativo com o mesmo nome (case-insensitive) — FR-002.
- 201 → `ProductAddonResponse` (mesmo shape do item da listagem).

### `PUT /api/v1/product-addons/:id`

Body igual ao `POST`. 404 se não existir/for de outra organização. 409 igual
ao create se o novo nome colidir com outro ativo. 200 → `ProductAddonResponse`.

### `DELETE /api/v1/product-addons/:id`

Soft-delete (FR-004). 404 se não existir. 204 sem corpo. Não bloqueia mesmo se
houver `ProductAddonLine` referenciando — o vínculo existente persiste (edge
case do spec); o adicional só some da listagem de ativos e do seletor.

## 2. Seções aninhadas no produto (`v1/products`)

Sem rota nova — `addonSettings`, `addonLines` e `suggestions` entram nos
contratos já existentes de `GET`/`POST`/`PUT /v1/products/:id`.

### Payload de escrita (`POST`/`PUT /v1/products` — trecho novo)

```jsonc
{
  // … demais campos do produto (inalterados) …
  "addonSettings": {
    "minQuantity": 1,
    "maxQuantity": 3,
    "chargeFromSelectedQuantity": true,
    "chargeFromQuantity": 2
  },
  "addonLines": [
    { "addonId": "uuid-bacon", "maxQuantity": 2, "priceCents": 350, "sortOrder": 0 },
    { "addonId": "uuid-queijo", "maxQuantity": 1, "priceCents": 200, "sortOrder": 1 }
  ],
  "suggestions": [
    { "suggestedProductId": "uuid-produto-b", "sortOrder": 0 },
    { "suggestedProductId": "uuid-produto-c", "sortOrder": 1 }
  ]
}
```

Todos os três campos são **opcionais** no request:
- Omitido → seção não é tocada nesta fatia? **Não** — segue o mesmo contrato
  de `variations`/`suppliers`: omitido ou `[]` é tratado como "produto sem
  nenhuma linha" e o `PUT` **substitui** o conjunto existente por vazio
  (replace-all, FR-011/FR-017). Isso espelha exatamente como `variations`
  já se comporta hoje (`resolveProductVariations` recebe `inputs ?? []`).
- `addonSettings` ausente → grava/mantém os defaults (`minQuantity: 0,
  maxQuantity: 0, chargeFromSelectedQuantity: false, chargeFromQuantity: 1`).

**Validações e erros** (aplicadas antes de qualquer escrita — FR-012/FR-019):

| Condição | Erro | HTTP |
|---|---|---|
| `addonSettings.minQuantity > maxQuantity` | `ProductAddonSettingsInvalidError` | 422 |
| `addonSettings.chargeFromSelectedQuantity=true` e `chargeFromQuantity < 1` | `ProductAddonSettingsInvalidError` | 422 |
| `addonLines[].addonId` repetido | `ProductAddonDuplicateLineError` | 409 |
| `addonLines[].addonId` não existe na organização (mesmo soft-deleted, se referenciado por engano num vínculo novo) | `ProductAddonNotFoundError` | 404 |
| `suggestions[].suggestedProductId` repetido | `ProductSuggestionDuplicateLineError` | 409 |
| `suggestions[].suggestedProductId === product.id` | `ProductSuggestionSelfReferenceError` | 422 |
| `suggestions[].suggestedProductId` não existe/não é da organização | `ProductNotFoundError` (já existe) | 404 |

### Payload de leitura (`GET /v1/products/:id` e itens de `GET /v1/products` — trecho novo)

```jsonc
{
  // … demais campos do ProductResponse (inalterados) …
  "addonSettings": {
    "minQuantity": 1,
    "maxQuantity": 3,
    "chargeFromSelectedQuantity": true,
    "chargeFromQuantity": 2
  },
  "addonLines": [
    {
      "id": "uuid-line-1",
      "addonId": "uuid-bacon",
      "addonName": "Bacon",
      "maxQuantity": 2,
      "priceCents": 350,
      "sortOrder": 0
    }
  ],
  "suggestions": [
    {
      "id": "uuid-sugg-1",
      "suggestedProductId": "uuid-produto-b",
      "suggestedProductName": "Refrigerante Lata",
      "sortOrder": 0
    }
  ]
}
```

- `addonSettings` nunca é `null` na resposta — produto sem configuração devolve
  os defaults (`{ minQuantity: 0, maxQuantity: 0, chargeFromSelectedQuantity:
  false, chargeFromQuantity: 1 }`), mesmo padrão de `technical-sheets`/
  `fiscal-parameters` ("sem ficha → payload vazio com defaults").
- `addonLines`/`suggestions` só trazem linhas **ativas** — um adicional
  excluído (FR-004) ou um produto sugerido excluído (FR-018) some da lista,
  mas a linha em si (`ProductAddonLine`/`ProductSuggestion`) permanece no
  banco até o próprio produto dono ser excluído (cascade).
- `addonName`/`suggestedProductName` são enriquecimentos de leitura (join),
  para o frontend não precisar de uma segunda chamada para exibir o nome —
  mesmo padrão de `priceLists: string[]` já feito no `ProductResponse`.

## 3. Fora de escopo desta fatia

- `GET /v1/product-addons/:id` isolado (não pedido — a listagem já basta para
  o seletor).
- `POST /v1/product-addons/:id/restore` (spec não pede restore do catálogo de
  adicionais, só soft-delete — FR-004).
- Qualquer campo de disponibilidade/canal nos adicionais/sugestões (fora de
  escopo, ver Assumptions do spec).
