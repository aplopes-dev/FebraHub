# Phase 1 Data Model: PDV Fundação (Fase 0)

Modelo de domínio **in-app** (Dart), sem Prisma. Fonte: [spec.md](./spec.md) Key Entities + [research.md](./research.md).

## PdvModuleId

Identificador estável (`String`). Constantes em `PdvModuleIds` (estendido).

### Telas (existentes — `kind: screen`)

| Id | Rótulo típico | Tier | Segmento |
|---|---|---|---|
| `counter` | Balcão | core | ⬛ |
| `customer` | Cliente | core | ⬛ |
| `seller` | Vendedor | core | ⬛ |
| `cash_drawer` | Sangria / reforço | core | ⬛ |
| `history` | Últimas vendas | core | ⬛ |
| `refund` | Devolução | core | ⬛ |
| `credit` | Crédito dos clientes | core | ⬛ |
| `settings` | Configurações | core | ⬛ |
| `tables` | Mesas | optional | 🍽 |
| `tabs` | Comandas | optional | 🍽 |
| `service` | Atendimentos | optional | 🍽 |
| `delivery` | Delivery | optional | 🍽 |
| `delivery_orders` | Pedidos delivery | optional | 🍽 |

### Comportamentos (novos — `kind: behavior`, FR-001)

| Id (proposto) | Descrição | Tier | Segmento |
|---|---|---|---|
| `barcode` | Código de barras no Balcão | optional | 🏬 |
| `scale` | Balança / peso | optional | 🏬 |
| `variant_grid` | Grade tamanho/cor | optional | 🏬 |
| `item_addon` | Adicional/opcional | optional | 🍽 |
| `kitchen_note` | Observação de cozinha | optional | 🍽 |
| `half_pizza` | Meia-a-meia | optional | 🍽 |
| `production_print` | Impressão de produção | optional | 🍽 |
| `service_fee` | Taxa de serviço | optional | 🍽 |
| `couvert` | Couvert / entrada | optional | 🍽 |

Nomes finais dos ids de comportamento podem ser camel/snake desde que estáveis e únicos; alinhar no código e nos testes.

## PdvModuleDefinition

Entrada do catálogo (imutável).

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `String` | obrigatório, único no catálogo |
| `kind` | `PdvModuleKind` (`screen` \| `behavior`) | obrigatório |
| `tier` | `PdvModuleTier` (`core` \| `optional`) | core = ⬛; optional = segmento |
| `label` | `String` | exibição em painel/dev e futuros settings leitura |
| `segmentHint` | opcional (`food` \| `retail` \| `both`) | documentação/fixture; não substitui `tier` |

## PdvModuleState

| Valor | Significado | UI operacional (Fase 0) |
|---|---|---|
| `available` | ligado e utilizável | visível |
| `disabled` | desligado neste terminal / não contratado (ops) | **ausente** |
| `blocked` | bloqueado (Fase 4: gerente; Fase 1: leitura) | **ausente** (mesmo tratamento visual) |

## ModuleSetSnapshot

Conjunto pronto do terminal (o que o ERP enviaria).

| Campo | Tipo | Regra |
|---|---|---|
| `states` | `Map<String, PdvModuleState>` | cobre todos os ids do catálogo, ou defaults: ausente no map → tratar como `available` **somente se** política explícita documentada; preferível map completo nos perfis |
| `profileName` | `String?` | nome do perfil fixture, se aplicável |
| `updatedAt` | `DateTime` | para cache / debug |

**Validação (`ModuleSetValidator`)**:
- Todo id com `tier == core` MUST estar `available`; caso contrário rejeitar ou forçar `available` + log/assert em debug.
- Ids desconhecidos: ignorar ou rejeitar (preferir rejeitar em debug; ignorar em release com log).
- Snapshot vazio / cache corrompido: cair no perfil padrão de desenvolvimento.

**Consulta**:
- `isOperationallyVisible(id) => state[id] == available` (após validação).
- Não expor “lista de escondidos” como API pública principal — derivar de states.

## SegmentProfile (fixture)

| Campo | Tipo | Regra |
|---|---|---|
| `name` | `String` | `Restaurante` \| `Lanchonete com delivery` \| `Loja` \| `Mercado` |
| `snapshot` | `ModuleSetSnapshot` | sempre inclui núcleo `available`; difere nos opcionais |

## Money (centavos)

| Campo | Tipo | Regra |
|---|---|---|
| `cents` | `int` | ≥ 0 no domínio de preço/total/recebido; troco/remaining derivados |
| formatação | só na UI | `formatCents` → `R$ X.XXX,XX` |

Entidades afetadas (renomear campos):

| Antes | Depois |
|---|---|
| `CounterProduct.price` (`double`) | `priceCents` (`int`) |
| `CounterCartLine` totais linha | centavos |
| `CounterTotals.subtotal/discount/total` | `*Cents` |
| `PaymentEntry.amount` | `amountCents` |
| `PaymentSummary.total/received` | `totalCents` / `receivedCents` |
| fixtures `2.5` / `5.5` | `250` / `550` |

**Invariantes**:
- `remainingCents = max(0, totalCents - receivedCents)`
- `changeCents = max(0, receivedCents - totalCents)`
- `canFinalize <=> totalCents > 0 && receivedCents >= totalCents` (inteiro, sem epsilon)

## RouteDestination

| Id de rota | Tela | Notas |
|---|---|---|
| `/` ou `/home` | Início | |
| `/counter` | Balcão | |
| `/payment` | Pagamento | exige contexto de venda ativa (providers) |
| `/sale-completed` | Venda finalizada | replace; limpa estado pós-frame |
| `/customer/new` (e edit se houver) | Cadastro cliente | parâmetros mínimos |

Parâmetros extras (retorno mesa etc.) **não** obrigatórios nesta fase — só identificadores estáveis (FR-010).

## List/Screen UI state (vocabulário)

| Estado | Widget compartilhado |
|---|---|
| loading | `PdvLoadingState` |
| error | `PdvErrorState` |
| empty | `PdvEmptyState` |
| content | conteúdo da feature |

Não é entidade persistida — contrato de UI (FR-012).

## Transições relevantes

```
Module state (modelo):
  available <-> disabled   (dev panel / futura config)
  available <-> blocked    (modelo; UI ops trata blocked como disabled)
  disabled  <-> blocked    (modelo; ambos invisíveis na ops)

App start:
  cache hit → apply snapshot → validate core
  cache miss → default profile → validate → write cache

Sale flow (rotas):
  home → counter → payment → sale-completed → (home | counter)
  sale-completed NÃO empilha volta para payment da mesma venda
```
