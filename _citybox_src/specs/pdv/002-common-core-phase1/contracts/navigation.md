# Contract: Navigation (Fase 1)

Estende as rotas da Fase 0 (`contracts` de `001-foundation-phase0`). Biblioteca: `go_router`.

## Rotas estáveis

| name / path | Page | Módulo / guard |
|---|---|---|
| `home` → `/` | `HomePage` | — |
| `counter` → `/counter` | `CounterPage` | **exige turno open** |
| `payment` → `/payment` | `PaymentPage` | **exige turno open** (entrada via Balcão) |
| `saleCompleted` → `/sale-completed` | `SaleCompletedPage` | pós-venda (turno open implícito) |
| `customerForm` → `/customer/form` | `CustomerFormPage` | sem guard de turno |
| `cash` → `/cash` | Hub Caixa | `cash_hub` (core); query `?intent=open` opcional |
| `cashMovement` → `/cash/movement` | Sangria/reforço | `cash_drawer`; **exige turno open** |
| `salesHistory` → `/sales` | Últimas vendas | `history`; **exige turno open** |
| `saleDetail` → `/sales/:id` | Detalhe da venda | `history`; **exige turno open** |
| `settings` → `/settings` | Configurações | `settings`; **sem** guard de turno |

## Guards

Paths protegidos (sem turno open → `go('/cash?intent=open')`):

- `/counter`, `/payment`, `/cash/movement`, `/sales`, `/sales/:id`

Não protegidos: `/`, `/cash`, `/settings`, `/customer/form`, diálogos (vendedor).

## Home wiring (eliminar “não implementado”)

| Ação / atalho | Destino |
|---|---|
| Balcão `B` | `/counter` (guard) |
| Sangria `S` | `/cash/movement` (guard) |
| Últimas vendas `U` | `/sales` (guard) |
| Configurações `Ç` | `/settings` |
| Vendedor `F9` | `SellerPickerDialog` (sem rota) |
| Hub Caixa (nova entrada) | `/cash` |

Balcão / Pagamento botões Configurações → `/settings`.

## Comportamentos preservados

1. Título da janela sincronizado por location (incluir novos paths).
2. Venda finalizada: replace/limpeza de pilha; **registrar** `SaleRecord` no turno antes/junto da limpeza de carrinho.
3. Diálogos (vendedor, comprovante, confirmações) permanecem `showDialog`.
4. `SaleCompleted` saídas Delivery/Atendimentos continuam filtradas por módulo (Fase 0 §5.8).

## Fora de escopo

Deep links delivery, restauração Android kill além do turno persistido, retorno mesa — Fase 2+ gap.
