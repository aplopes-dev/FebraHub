# Quickstart: PDV Food (Fase 2)

Validação manual/automatizada pós-implementação. Sem backend.

## Prerequisites

- Fases 0 e 1 no app (módulos/comportamentos food, `go_router`, turno, centavos, settings)
- Flutter SDK no `PATH` (ver `apps/pdv/app/AGENTS.md`)
- Spec: [spec.md](./spec.md) · Contratos: [contracts/](./contracts/) · Modelo: [data-model.md](./data-model.md)

## Setup

```bash
cd apps/pdv/app
export PATH="$HOME/development/flutter/bin:$PATH"   # ajuste ao SDK
flutter pub get
flutter analyze    # No issues found!
flutter test
```

## Run

```bash
flutter run -d linux     # caixa expandido
flutter run              # Android tablet/celular — validar médio/compacto
```

Perfil **Restaurante** ou **Lanchonete com delivery** via painel debug (não-release). Perfil **Loja** para SC-005 (food ausente).

## Scenarios (aceitação)

### 1. Breakpoints (SC-004, FR-001)

1. Android ~800 px (ou `tester.view` nos widget tests): abrir Mesas e Comandas — ação principal utilizável.
2. Redimensionar / dispositivo compacto: listas empilhadas, sem colunas mortas.
3. Desktop expandido: Balcão/Pagamento sem regressão grosseira do layout atual.

### 2. Ciclo mesa → pagamento (SC-001, SC-002, SC-008)

1. Abrir turno (hub Caixa).
2. Home `M` → mesa livre → Balcão vinculado → lançar item → pagamento → finalizar.
3. Retorno a `/tables`: mesa free (ou closing→free).
4. Esperado: zero “não implementado”; `returnTo` coerente ([navigation.md](./contracts/navigation.md)).

### 3. Comandas Home + Balcão (SC-003)

1. Home `Q` e botão Comandas no Balcão → mesmo `/tabs`.
2. Abrir por número → lançar → fechar → Pagamento.
3. Módulo `tabs` off (perfil Loja): ambas entradas ausentes.

### 4. Blocos food + totais (SC-006, SC-009)

1. Perfil Restaurante: adicional + observação + meia-pizza em produto elegível.
2. Ativar taxa 10% e couvert; conferir ordem e centavos ([food-totals.md](./contracts/food-totals.md)).
3. Últimas vendas / detalhe: addons, taxa e couvert visíveis.

### 5. Atendimentos (SC-001)

1. Com mesa/comanda aberta: Home `A` lista sessão → retomar → cancelar com confirmação.

### 6. Delivery (SC-001)

1. `D`: cliente + endereço (campo **Filled**) + taxa + entregador → pedido na fila `W`.
2. Despachar status.
3. Módulos off: `D`/`W` e saídas na venda finalizada ausentes.

### 7. Guards sem turno (herança Fase 1)

Sem turno: `M`/`Q`/`A`/`D`/`W` → hub Caixa.

### 8. Reinício (SC-007)

Com mesa/comanda/pedido open: matar app → reabrir → sessões restauradas (`pdv.salon.v1`).

### 9. TextField Filled ([filled-fields.md](./contracts/filled-fields.md))

1. Abrir comanda (número) e novo delivery (endereço): campos com fundo `inputFill`, não outlined.
2. Widget test cobre `filled == true`.

### 10. Perfil Loja (SC-005)

Nenhuma ação/bloco food (mesas, comandas, atendimentos, delivery, addons, taxa, couvert) na Home/Balcão/totais/venda finalizada.

## Automated smoke

```bash
flutter analyze && flutter test
```

Focar testes novos em: `pdv_breakpoints`, food totals, salon transfer/split, home wiring M/Q/A/D/W, filled field, counter layouts.

## AGENTS.md

Na entrega: remover/atualizar nota de “mobile adiado” para o escopo desta fase; documentar features food + regra **TextField Filled** canônica em `ui/pdv_filled_field.dart`.
