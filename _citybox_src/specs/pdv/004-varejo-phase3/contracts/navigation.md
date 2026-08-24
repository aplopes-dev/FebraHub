# Contract: Navigation (Fase 3 Varejo)

Estende [Fase 1 navigation](../../002-common-core-phase1/contracts/navigation.md). Biblioteca: `go_router`. Independente das rotas food da Fase 2 (podem coexistir).

## Rotas estáveis (novas + relevantes)

| name / path | Page | Módulo | Guard turno |
|---|---|---|---|
| `priceCheck` → `/price-check` | Consulta de preço | `price_check` | **sim** |
| `refund` → `/refund` | Devolução | `refund` | **sim** |
| `credit` → `/credit` | Crédito dos clientes | `credit` | **sim** |
| `counter` → `/counter` | Balcão (+ barcode/grade/peso) | `counter` + behaviors | **sim** |
| `payment` → `/payment` | Pagamento | — | **sim** |
| `sales` / history | Últimas vendas (Fase 1) | `history` | **sim** |

### Query / extra

| Param | Onde | Uso |
|---|---|---|
| `saleId` | `/refund` | opcional — pré-seleciona venda |
| `customerId` | `/credit` | opcional — abre conta do cliente |
| `intent=open` | `/cash` | herdado Fase 1 |

## Guards

Exigir turno open (além dos paths Fase 1):

- `/price-check`, `/refund`, `/credit`

Sem turno → `go('/cash?intent=open')`.

Módulo indisponível: Home/atalho **não** navegam; deep path → redirect Home ou empty state (não crash).

## Home / wiring

| Ação | Atalho | Destino |
|---|---|---|
| Devolução | `V` | `/refund` |
| Crédito dos clientes | `C` | `/credit` |
| Consulta de preço | (definir no catálogo Home; sugerido ícone/atalho na entrega) | `/price-check` |

Balcão: barcode no toolbar (módulo `barcode`); diálogos grade/peso **não** são rotas.

## Diálogos (não-rotas)

| Fluxo | Host |
|---|---|
| Grade variação | `showDialog` + `PdvDialogBody` **large** |
| Peso / balança | `showDialog` + `PdvDialogBody` **medium** ou **large** se keypad |
| Confirmação devolução / comprovante | `PdvDialogBody` **medium** |
| Receber crédito | `PdvDialogBody` **medium** |

## Comportamentos preservados

1. Título da janela por location.
2. Consulta de preço **não** toca `counterCartProvider`.
3. Pós-devolução: permanece em `/refund` ou volta Home — escolha de UX na implementação; documentar no AGENTS se não óbvio.
4. Saídas food na venda finalizada continuam filtradas por módulo (Fase 0); esta fase não as altera.
