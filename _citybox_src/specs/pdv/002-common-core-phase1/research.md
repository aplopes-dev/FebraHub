# Phase 0 Research: PDV Núcleo Comum (Fase 1)

Nenhum item da Technical Context ficou como `NEEDS CLARIFICATION` — a sessão `/speckit-clarify` (Q2–Q6) + Q1 do specify fecharam comportamento. As decisões abaixo resolvem implementação.

**Escopo**: gap **Fase 1** (itens 7–12). **Não** é a Fase 2 do gap (Food/Mesas/Comandas).

## 1. Hub Caixa e módulo `cash_hub`

**Decision**: Novo id de módulo núcleo `PdvModuleIds.cashHub = 'cash_hub'` (tier `core`, kind `screen`). Entrada dedicada na Home (rail ou grid — preferência: **rail**, junto ao apoio de turno, sem reordenar Balcão) e/ou moldura. Rotas do hub e fluxos abrir/fechar vivem em `features/cash/`. Interceptações sem turno (`counter`, `cash_drawer`, `history`) redirecionam para `/cash` (hub) com query opcional `?intent=open`.

Sangria continua no id existente `cash_drawer` (Home `S`); o hub oferece **atalho** para o mesmo fluxo quando o turno está aberto.

**Rationale**: Spec Q2 / FR-001 / FR-022; não sobrecarregar Configurações; padrão PDV de “caixa” como destino.

**Alternatives considered**:
- *Fechamento só em Settings* — rejeitada (Q2 = hub).
- *Duas ações Home Abrir/Fechar* — rejeitada (Q2 opção C).

## 2. Guard de turno ( Balcão / Sangria / Últimas vendas )

**Decision**: Camada única `CashShiftGate` (application): `hasOpenShift`. Navegação para `/counter`, `/cash/movement`, `/sales` (últimas vendas) verifica o gate; se fechado → `go('/cash?intent=open')`. Home **lista** as ações (módulos available); o bloqueio é na **navegação**, não escondendo Balcão. Configurações (`/settings`) e Vendedor (dialog) **não** passam pelo gate.

**Rationale**: FR-019 / SC-008; Home permanece útil para Configurações/Vendedor.

**Alternatives considered**:
- *Esconder Balcão sem turno* — rejeitada: Q1 diz Home pode listar; bloqueio ao entrar.

## 3. Persistência local do turno

**Decision**: Reusar **`shared_preferences`** com chave versionada `pdv.cash_shift.v1` (JSON serializado: turno + movimentos + vendas do turno). Controller hidrata no `build()`; cada mutação persiste de forma imutável (`state = …` + write). Volume esperado por turno de demo é pequeno (&lt; alguns milhares de vendas na fixture).

Se o JSON crescer demais em testes longos, migrar depois para arquivo via `path_provider` — **não** nesta fase.

**Rationale**: Q6 / FR-025; mesmo pacote da Fase 0; AGENTS §4.10: não é segredo (não usar secure storage).

**Alternatives considered**:
- *Só memória* — rejeitada (Q6).
- *Hive/Isar* — overkill.
- *SQLite* — prematuro sem sync.

## 4. Fórmula do esperado em gaveta

**Decision** (domínio puro, testável):

```
expectedCents =
  openingFloatCents
  + sum(reinforcementCents)
  - sum(withdrawalCents)
  + sum(over valid sales: cashReceivedCents - changeCents)
```

Meios ≠ dinheiro (`PaymentMethod` cartão/PIX/…) **ignorados**. Cancelamento: remove a venda da soma (estorna o dinheiro líquido que ela tinha contribuído). Venda só cartão: impacto 0 na gaveta.

Identificar “dinheiro” pelo id/código do método de pagamento da fixture (ex.: `cash` / rótulo Dinheiro) — documentar no contrato [cash-shift.md](./contracts/cash-shift.md).

**Rationale**: Q3 / FR-023 / SC-004.

## 5. Fechamento vs venda em curso

**Decision**: `isSaleInProgress` = carrinho com linhas **ou** pagamento com entradas/rascunho ativo (providers existentes do counter/payment). `closeShift` retorna erro de domínio / UI bloqueia se true. Não limpar carrinho automaticamente.

**Rationale**: Q5 / FR-024 / SC-010.

## 6. Ajuste de venda (desconto XOR acréscimo)

**Decision**: `SaleAdjustment?` no estado do carrinho/totais: `{ kind: discount|surcharge, mode: percent|amount, valueCentsOrBps }`. Aplicar outro kind **substitui**. Ordem: (1) linhas com desconto por linha → subtotal; (2) único ajuste de venda. Percentual sobre o subtotal pós-linhas; arredondamento half-up para centavos. Total final ≥ 0.

Taxa de serviço / couvert (módulos behavior) **não** entram — Fase 2 gap.

**Rationale**: Q4 / FR-013 / User Story 5 cenário 5.

## 7. Registro de venda no turno

**Decision**: Ao navegar para venda finalizada com sucesso, **além** de limpar carrinho/pagamentos, append `SaleRecord` imutável no turno aberto (itens resumidos, pagamentos, vendedor, totais, `cashNetCents`). Últimas vendas leem essa lista (mais recentes primeiro). Cancelamento marca `status=cancelled` e recalcula esperado.

**Rationale**: FR-007/008; SC-004.

## 8. Configurações vs painel debug

**Decision**: `features/settings/` — preferências locais (terminal id, impressora, gaveta, balança — strings/bools em `shared_preferences` chave `pdv.terminal_settings.v1`) + seção **ModulesReadOnly** que lista o catálogo Fase 0 com estados e texto “configurado no ERP”. **Zero** escrita no conjunto de módulos. Painel debug permanece só em `!kReleaseMode` (Fase 0).

Três entradas (Home `Ç`, Balcão, Pagamento) → mesma rota `/settings`.

**Rationale**: FR-010–012 / §5.4 do gap / SC-003 / SC-006.

## 9. Vendedor na Home (F9)

**Decision**: Na Home, ação `seller` chama o mesmo fluxo do Pagamento (`SellerPickerDialog` / `saleSellerProvider`) — sem rota nova. Só se `isOperationallyVisible(seller)`.

**Rationale**: FR-014; item mais barato do gap.

## 10. Navegação

**Decision**: Estender `PdvRoutes` / `createPdvRouter` — ver [contracts/navigation.md](./contracts/navigation.md). Redirect guard centralizado (lista de paths protegidos) para não espalhar `if (!hasOpenShift)` em cada página.

**Rationale**: FR-017; herança go_router Fase 0.

## 11. Listagem locais (nuance constituição §8.1)

**Decision**: Últimas vendas: paginação/busca no **repositório/controller** sobre a lista persistida (ex.: `page`/`perPage`/`search` no application), UI só renderiza a página atual + `PdvEmptyState` se vazio. Não `.filter` ad hoc na presentation sobre lista completa sem critério.

**Rationale**: FR-007; alinha espírito §8.1 sem backend.
