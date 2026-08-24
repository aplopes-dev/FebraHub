# Quickstart: PDV Núcleo Comum (Fase 1)

Validação manual/automatizada pós-implementação. Sem backend.

## Prerequisites

- Fase 0 entregue no app (`go_router`, centavos, módulos, estados UI)
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
flutter run -d linux    # ou windows / android
```

Perfil de módulos: usar painel **debug** (só não-release) se precisar de Loja vs Restaurante.

## Scenarios (aceitação)

### 1. Ciclo de turno (SC-001, SC-009)

1. Cold start → Home; abrir **Caixa** (hub) → abrir turno com fundo (ex.: R$ 100,00).
2. Balcão → lançar itens → (opcional) ajuste desconto **ou** acréscimo → pagar (incluir dinheiro) → finalizar.
3. Home `S` → sangria com motivo → comprovante.
4. Hub Caixa → fechar com contagem → ver diferença.
5. Esperado: sem “não implementado”; expected bate com [cash-shift.md](./contracts/cash-shift.md).

### 2. Guards sem turno (SC-008)

1. Garantir nenhum turno open (fechar ou limpar prefs de teste).
2. Tentar Balcão, `S`, `U` → deve ir ao hub Caixa.
3. `Ç` e `F9` → Configurações / seletor de vendedor **funcionam**.

### 3. Home wiring (SC-002)

Com módulos available e turno open: `S`, `U`, `Ç`, `F9` e entrada Caixa → destinos reais (não snack “não implementado”).

### 4. Configurações × módulos (SC-003, SC-006)

1. Entrar por Home, Balcão e Pagamento → mesma `/settings`.
2. Seção módulos: read-only; perfil Loja explica Comandas ausente.
3. Release build: sem painel de escrita de módulos.

### 5. Ajuste XOR (SC-005)

Balcão: desconto 10% → trocar por acréscimo em valor → desconto some; total em centavos bate com [sale-adjustment.md](./contracts/sale-adjustment.md).

### 6. Fechar com venda aberta (SC-010)

Carrinho com itens → hub → Fechar → bloqueado até limpar/cancelar/concluir.

### 7. Persistência (SC-011)

Turno open + 1 venda → matar app → subir de novo → mesmo turno, expected e Últimas vendas coerentes.

### 8. Últimas vendas

Lista do turno → detalhe → reimpressão (fixture) → cancelar com confirmação → status e gaveta atualizam (só dinheiro líquido).

## Automated focus

```bash
flutter test test/unit/          # expected drawer, adjustment, cancel
flutter test test/widget/        # guards, home actions, settings read-only
```

## Docs-as-code

Ao concluir implementação: atualizar `apps/pdv/app/AGENTS.md` (status, estrutura `cash`/`sales_history`/`settings`, regras de turno, histórico).
