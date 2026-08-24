import type { FinancialEntry } from '../entities/financial-entry.entity';

export type BankTransactionInput = {
  kind: 'credit' | 'debit';
  amountCents: number;
  effectiveAt: Date;
  description: string;
};

function describe(entry: FinancialEntry): string {
  if (entry.description) return entry.description;
  if (entry.partyName) return entry.partyName;
  return entry.operation === 'receivable'
    ? 'Recebimento de lançamento financeiro'
    : 'Pagamento de lançamento financeiro';
}

/**
 * Deriva as movimentações de ledger que um lançamento financeiro produz na
 * sua conta bancária — usada tanto pelo repositório Prisma real quanto pelo
 * repositório in-memory de teste, para garantir que os dois nunca divirjam
 * sobre "o que este lançamento gera" (só divergem em como persistem).
 *
 * `[]` quando o lançamento não tem conta bancária vinculada — nada a
 * movimentar. Um input por linha de `payments[]`; ou, quando `payments`
 * está vazio mas `paidCents > 0` (o recebível que
 * `PrismaSaleOrderRepository.maybeCreateReceivable` grava direto via Prisma,
 * sem popular `payments[]`), um único input sintético cobrindo o total pago.
 *
 * Ver `specs/erp/002-bank-account-ledger/research.md` D1.
 */
export function deriveBankTransactionInputsFromEntry(
  entry: FinancialEntry,
): BankTransactionInput[] {
  if (!entry.bankAccountId) return [];

  const kind: BankTransactionInput['kind'] =
    entry.operation === 'receivable' ? 'credit' : 'debit';

  if (entry.payments.length > 0) {
    return entry.payments.map((payment) => ({
      kind,
      amountCents: payment.amountCents,
      effectiveAt: payment.paidAt,
      description: describe(entry),
    }));
  }

  if (entry.paidCents > 0) {
    return [
      {
        kind,
        amountCents: entry.paidCents,
        effectiveAt: entry.competenceDate,
        description: describe(entry),
      },
    ];
  }

  return [];
}
