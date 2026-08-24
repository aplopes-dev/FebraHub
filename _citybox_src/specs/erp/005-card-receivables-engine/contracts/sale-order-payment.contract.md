# Contrato — `SaleOrderPayment` (delta de escrita)

Não é uma rota nova. Estende o corpo já aceito por `POST /v1/sale-orders`,
`PUT /v1/sale-orders/:id` e `PATCH /v1/sale-orders/:id/status` (este último não reenvia `payments` —
ver research.md D11) em `SaleOrderPaymentDto`
(`apps/erp/api/src/modules/sales/application/dtos/sale-order.dto.ts`).

## Campos adicionados

```ts
type SaleOrderPaymentDto = {
  id?: string;                 // já existia
  amountCents: number;         // já existia
  methodId: string;            // já existia — inalterado
  bankAccountId?: string | null; // já existia

  // NOVOS — todos opcionais, retrocompatíveis:
  cardPaymentType?: 'pix' | 'debit' | 'credit';
  brand?: string | null;
  installments?: number;
};
```

## Regras de validação (camada de domínio, `SaleOrder.normalizePayments`)

| Regra | Efeito se violada |
|---|---|
| `installments`, quando enviado, deve ser inteiro ≥ 1 | `ValidatorDomainError` (422) |
| `brand` obrigatório quando `cardPaymentType` é `debit` ou `credit` | `ValidatorDomainError` (422) |
| `brand` deve ser `null`/ausente quando `cardPaymentType = 'pix'` (RN-11) | valor é normalizado para `null`, não é erro bloqueante |
| Nenhuma validação contra `CardContract`/`CardPaymentMethod` acontece aqui | correspondência é responsabilidade do motor no fechamento — um pagamento em cartão sem contrato cadastrado é **válido** e cai no fallback (FR-005) |

## Exemplo — pagamento em crédito parcelado

```json
{
  "amountCents": 60000,
  "methodId": "pm-cartao-credito",
  "bankAccountId": "ba_01HXYZ...",
  "cardPaymentType": "credit",
  "brand": "Visa",
  "installments": 6
}
```

## Exemplo — pagamento em Pix

```json
{
  "amountCents": 10000,
  "methodId": "pm-pix",
  "bankAccountId": "ba_01HXYZ...",
  "cardPaymentType": "pix"
}
```

## Exemplo — pagamento em dinheiro (inalterado)

```json
{
  "amountCents": 5000,
  "methodId": "pm-dinheiro",
  "bankAccountId": null
}
```

## Frontend — catálogo de formas de pagamento (mock, `sales-orders`)

O painel de pagamentos (`sale-order-payments-panel.tsx`) passa a decidir a exibição dos campos
Bandeira/Parcelas pelo `cardPaymentType` da forma de pagamento selecionada — não pelo texto do
label. Ver research.md D3/D4 para a origem do catálogo de bandeiras e a extensão do catálogo mock de
formas de pagamento (split Débito/Crédito).

## Fora de escopo desta entrega

- Rota HTTP de `/v1/card-contracts` **não muda** — nenhum campo novo, nenhum comportamento novo.
- Nenhum endpoint novo é criado por esta feature.
