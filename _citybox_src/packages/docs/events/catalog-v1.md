# Event Catalog v1 — CloudEvents (d2-g3-i02)

Envelope: `specversion`, `id`, `source`, `type`, `time`, `data`.

| # | type | Consumers |
|---|------|-----------|
| 1 | `citybox.store.onboarded.v1` | marketplace-projection, search-indexer |
| 2 | `citybox.catalog.item.updated.v1` | marketplace-projection, search-indexer |
| 3 | `citybox.offer.published.v1` | marketplace-projection, search-indexer |
| 4 | `citybox.stock.changed.v1` | workers |
| 5 | `citybox.availability.changed.v1` | workers |
| 6 | `citybox.order.created.v1` | marketplace-projection, notifications |
| 7 | `citybox.order.status.changed.v1` | marketplace-projection |
| 8 | `citybox.shipping.quoted.v1` | workers |
| 9 | `citybox.device.registered.v1` | workers |
| 10 | `citybox.store.created.v1` | food-api worker (`food.store-setup`) |
| 11 | `citybox.store.updated.v1` | food-api worker (`food.store-setup`) |

**`citybox.store.created.v1` / `citybox.store.updated.v1`** — publicados pela `platform-api` ao criar/atualizar loja (routing `citybox.store.created` / `citybox.store.updated`). Payload: `storeId`, `vertical`, dados cadastrais espelhados, `updatedAt` ISO. Consumer `food.store-setup` filtra `vertical === 'Food'`; `created` dispara seed idempotente; `updated` apenas upsert `FoodStore`.

