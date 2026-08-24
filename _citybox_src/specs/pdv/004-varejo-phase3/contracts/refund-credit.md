# Contract: Refund + Customer credit

## Devolução (`refund`)

### Fluxo

1. Busca venda (`saleId` / número / lista do turno) — paginação/critério no application.
2. Exibe linhas com **qty elegível** = vendida − Σ devoluções anteriores.
3. Operador marca qty a devolver (Filled / steppers grandes, altura `controlHeight`).
4. Escolhe `refundMethod`: `cash` | `customer_credit` (só meios habilitados na fixture).
5. Confirma → `RefundRecord` + atualiza elegibilidade + comprovante (`PdvDialogBody` medium).

### Gaveta / crédito

| Método | Efeito |
|---|---|
| `cash` | esperado em gaveta do turno **diminui** por `totalCents` |
| `customer_credit` | `CustomerCreditAccount.balanceCents` **aumenta** + ledger `credit_from_refund` |

### Regras

- Venda cancelada / sem elegível: não devolve.
- Qty 0 ou &gt; elegível: validação impede.
- Turno open obrigatório.

## Crédito (`credit`)

### Fluxo

1. Lista/busca cliente (campo Filled; diálogo large se picker).
2. Mostra `balanceCents` (`amount*` tabular).
3. Extrato: entries ordenadas desc; empty state Fase 0.
4. Receber pagamento: valor Filled (centavos via teclado/máscara do projeto); 0 &lt; amount ≤ balance.
5. Confirma → balance ↓, entry `payment`; se recebido em dinheiro, gaveta **aumenta**.

### Fora desta fase

- Meio “fiado” no Pagamento para **aumentar** saldo na venda.
- Juros / limite de crédito além do saldo fixture.

## Persistência

- `pdv.refund.v1`, `pdv.credit.v1` — hidratar no `build()` dos controllers.
- Reinício restaura saldos e devoluções (SC-009).

## UI desktop

- Páginas com `PdvFormSection` / `PdvStatCard` para saldo e totais (como hub caixa).
- Ações principais `FilledButton` altura tema; diálogos Md/Lg tokens.
- Sem tipografia &lt; `bodyMd` em campos operacionais.
