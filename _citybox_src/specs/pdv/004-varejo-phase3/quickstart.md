# Quickstart: PDV Varejo (Fase 3)

Validação manual/automatizada pós-implementação. Sem backend.

## Prerequisites

- Fases 0 e 1 no app (módulos, `go_router`, turno, centavos, settings)
- Fase 2 **opcional** (se presente: reusar breakpoints + `PdvFilledField`)
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
flutter run -d linux     # caixa expandido — validar fonts/botões/diálogos grandes
flutter run              # Android tablet ~800 px — SC-008
```

Perfil **Loja** ou **Mercado** via painel debug (não-release). Perfil **Restaurante** para SC-007 (comportamentos varejo ausentes; V/C seguem catálogo núcleo).

## Scenarios (aceitação)

### 1. Código de barras + qty × produto (SC-002)

1. Abrir turno (hub Caixa) → Balcão.
2. Bipar/digitar ≥ 5 códigos válidos da fixture (incluir qty × produto ao menos uma vez).
3. Mesmo código de novo → quantidade na linha sobe.
4. Código inválido → mensagem; carrinho intacto.
5. Ir a Pagamento e finalizar (&lt; 5 min no roteiro guiado).

### 2. Grade / variação

1. Produto com variantes → diálogo **large** → escolher tamanho/cor → carrinho com rótulo.
2. Módulo `variant_grid` off: sem diálogo de grade.

### 3. Peso / balança (SC-003)

1. Produto por peso → diálogo Filled → peso → preview centavos ([weight-money.md](./contracts/weight-money.md)).
2. “Ler balança” (settings) preenche simulação → confirmar.
3. Total da venda bate com half-up.

### 4. Consulta de preço (SC-004)

1. `/price-check` (ou entrada Home) → código válido → nome + preço.
2. Com venda aberta no Balcão (outra rota): carrinho **não** muda.
3. Módulo `price_check` off: entrada ausente.

### 5. Devolução `V` (SC-001, SC-005)

1. Home/`V` → buscar venda → devolver parte → comprovante.
2. Estorno dinheiro → gaveta do turno reflete.
3. Sem turno → hub Caixa.

### 6. Crédito `C` (SC-001, SC-006)

1. Home/`C` → cliente com saldo → extrato → receber pagamento parcial.
2. Saldo e extrato atualizam; empty state se sem movimentos.

### 7. Filled + desktop UI ([filled-fields.md](./contracts/filled-fields.md))

1. Campos em consulta/devolução/crédito/diálogos: fundo `inputFill`, não outlined.
2. Diálogos de grade/peso: largura Md/Lg; botões altos; texto legível à distância do caixa.
3. Widget test cobre `filled == true`.

### 8. Breakpoints (SC-008)

Tablet ~800 px: consulta, devolução, crédito e Balcão com código utilizáveis.

### 9. Reinício (SC-009)

Com devolução e saldo de crédito gravados: matar app → reabrir → dados restaurados.

### 10. Perfil Restaurante (SC-007)

Sem `barcode` / `scale` / `variant_grid` / `price_check` operacionais; Devolução/Crédito só se núcleo available no snapshot.

## Automated smoke

```bash
flutter analyze && flutter test
```

Focar testes novos em: barcode resolve/merge, weight half-up, refund eligibility, credit payment, Home V/C wiring, filled field + dialog width.

## AGENTS.md

Na entrega: documentar features varejo (`price_check`, refund/credit flows, barcode/grade/scale no Balcão); reforçar regra **Filled + escala desktop** (§4.8.1); registrar id `price_check` no catálogo.
