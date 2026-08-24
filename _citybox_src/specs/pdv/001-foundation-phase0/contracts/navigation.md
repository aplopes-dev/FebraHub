# Contract: Navigation (go_router)

Rotas declarativas das cinco telas existentes (FR-010). Biblioteca: `go_router`.

## Rotas estáveis

| name / path | Page | Entrada típica |
|---|---|---|
| `home` → `/` | `HomePage` | cold start |
| `counter` → `/counter` | `CounterPage` | ação Balcão |
| `payment` → `/payment` | `PaymentPage` | F2 / pagar no Balcão |
| `saleCompleted` → `/sale-completed` | `SaleCompletedPage` | finalizar pagamento |
| `customerForm` → `/customer/form` | `CustomerFormPage` | Home/Balcão/Pagamento (novo/editar) |

Query/extra opcionais (ex.: `?customerId=`) só se já existirem no fluxo atual — não inventar deep links novos nesta fase.

## Comportamentos preservados

1. **Título da janela**: ao mudar de rota, atualizar o provider de título da title bar (substituir o papel de `pushWithPageTitle`).
2. **Venda finalizada**: navegar com **replace** (ou limpar pilha até home) de forma que “voltar” do sistema não reabra a venda; zerar carrinho, pagamentos, vendedor e observação (já existente em post-frame).
3. **Diálogos** (CustomerPicker, SellerPicker, etc.): permanecem `showDialog` — não viram rotas nesta fase.
4. **Shell**: `PdvScaffold` / title bar envolvem as rotas via `ShellRoute` ou builder equivalente, sem regressão desktop.

## Fora de escopo

- Deep link de pedido delivery, restauração Android após kill, retorno “mesa de origem” — só garantir ids estáveis para fases seguintes.
