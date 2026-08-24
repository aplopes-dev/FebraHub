# Contract: Navigation (Fase 2 Food)

Estende [Fase 1 navigation](../../002-common-core-phase1/contracts/navigation.md). Biblioteca: `go_router`.

## Rotas estáveis (novas + relevantes)

| name / path | Page | Módulo | Guard turno |
|---|---|---|---|
| `tables` → `/tables` | Mapa de mesas | `tables` | **sim** |
| `tabs` → `/tabs` | Comandas | `tabs` | **sim** |
| `service` → `/service` | Fila atendimentos | `service` | **sim** |
| `deliveryNew` → `/delivery/new` | Novo pedido delivery | `delivery` | **sim** |
| `deliveryOrders` → `/delivery/orders` | Pedidos delivery | `delivery_orders` | **sim** |
| `counter` → `/counter` | Balcão | `counter` | **sim** |
| `payment` → `/payment` | Pagamento | — | **sim** |
| `saleCompleted` → `/sale-completed` | Venda finalizada | — | implícito |

### Query / extra

| Param | Onde | Uso |
|---|---|---|
| `accountId` | `/counter`, `/payment` | conta de salão vinculada |
| `returnTo` | `/payment`, `/sale-completed` | `/tables` \| `/tabs` \| `/delivery/orders` \| `/` |
| `intent=open` | `/cash` | herdado Fase 1 |

## Guards

Além dos paths Fase 1, exigir turno open:

- `/tables`, `/tabs`, `/service`, `/delivery/new`, `/delivery/orders`

Sem turno → `go('/cash?intent=open')`.

Módulo indisponível: Home/atalho/app bar **não** navegam (já filtrados); deep path → redirect Home ou empty state (não crash).

## Home / app bar wiring

| Ação | Atalho | Destino |
|---|---|---|
| Mesas | `M` | `/tables` |
| Comandas | `Q` | `/tabs` |
| Atendimentos | `A` | `/service` |
| Delivery | `D` | `/delivery/new` |
| Pedidos delivery | `W` | `/delivery/orders` |
| Comandas (Balcão app bar) | — | `/tabs` |

## Pós-venda / retorno

1. Origem mesa → `returnTo=/tables` (mesa some de ocupada / free após close).
2. Origem comanda → `returnTo=/tabs`.
3. Origem delivery → `returnTo=/delivery/orders` (status atualizado).
4. Origem balcão puro → `returnTo=/` ou `/counter` (comportamento atual Fase 0/1).

## Comportamentos preservados

1. Título da janela por location.
2. Sale completed limpa carrinho/pagamentos **depois** de gravar `SaleRecord` e fechar `SalonAccount`.
3. Diálogos (addons, meia, confirmações) = `showDialog` / sheets — não rotas.
4. Saídas Delivery/Atendimentos na venda finalizada só se módulo visible (Fase 0).
