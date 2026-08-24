# Data Model — spec erp/030

Nenhuma entidade nova. Uma migração de dado (sem alteração de schema) em uma tabela existente.

## `SaleOrderPayment` (existente, `apps/erp/api/prisma/schema.prisma`)

| Campo | Tipo | Mudança |
|---|---|---|
| `methodId` | `String` | Sem mudança de tipo/coluna. Migração de **dado**: linhas cujo valor é um dos 5 ids mock conhecidos (`pm-dinheiro`, `pm-boleto`, `pm-pix`, `pm-cartao-debito`, `pm-cartao-credito`) passam a apontar para o `id` (UUID) real da `PaymentMethod` correspondente da mesma organização, resolvido por `systemKey`. |

## `PaymentMethod` (existente, sem mudança)

Fonte de verdade do backfill — `systemKey` já espelha os ids do mock antigo por design
(`pm-dinheiro`, `pm-boleto`, `pm-cartao` [= crédito], `pm-cartao-debito`, `pm-pix`, …), ver
`finance.seed.ts`.

## `FiscalGroup` (ISSQN, existente, sem mudança)

`issqnRate` continua `number | null`, percentual 0–100. Nenhuma coluna muda — só o consumo em
`dps-xml.builder.ts` (fiscal-api, fora do erp-api) para de multiplicar por 100.
