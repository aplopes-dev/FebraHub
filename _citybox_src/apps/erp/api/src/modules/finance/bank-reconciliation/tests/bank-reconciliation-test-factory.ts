import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tenancy/tests/tenancy-test-factory';
import {
  BANK_ACCOUNT_ID,
  OTHER_BANK_ACCOUNT_ID,
  makeBankAccount,
  makeBankAccountRepositories,
} from '../../bank-accounts/tests/bank-accounts-test-factory';
import { BankStatement } from '../domain/entities/bank-statement.entity';
import { BankStatementTransaction } from '../domain/entities/bank-statement-transaction.entity';
import { BankStatementMatch } from '../domain/entities/bank-statement-match.entity';
import { InMemoryBankStatementRepository } from './in-memory-bank-statement.repository';
import { InMemoryBankStatementTransactionRepository } from './in-memory-bank-statement-transaction.repository';
import { InMemoryBankStatementMatchRepository } from './in-memory-bank-statement-match.repository';

export {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  BANK_ACCOUNT_ID,
  OTHER_BANK_ACCOUNT_ID,
  makeBankAccount,
  makeBankAccountRepositories,
};

export const BANK_STATEMENT_ID = 'c1111111-1111-4111-8111-111111111111';
export const BANK_STATEMENT_TRANSACTION_ID =
  'c2222222-2222-4222-8222-222222222222';
export const BANK_STATEMENT_MATCH_ID = 'c3333333-3333-4333-8333-333333333333';
export const OBJECT_KEY = `${ORGANIZATION_ID}/financeiro/conciliacao-bancaria/${BANK_STATEMENT_ID}/extrato.ofx`;

export const PERIOD_START = new Date('2026-07-01T00:00:00.000Z');
export const PERIOD_END = new Date('2026-07-31T00:00:00.000Z');
export const POSTED_AT = new Date('2026-07-05T00:00:00.000Z');

export function makeBankStatement(
  overrides: Partial<{
    id: string;
    organizationId: string;
    bankAccountId: string | null;
    bankName: string;
    bankCode: string;
    branchNumber: string;
    accountNumber: string;
    periodStart: Date;
    periodEnd: Date;
    status: BankStatement['status'];
    pendingCount: number;
    reconciledCount: number;
    discardedCount: number;
    fileName: string;
    objectKey: string;
    importedByName: string;
  }> = {},
): BankStatement {
  return BankStatement.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      bankAccountId:
        overrides.bankAccountId !== undefined
          ? overrides.bankAccountId
          : BANK_ACCOUNT_ID,
      bankName: overrides.bankName ?? 'Banco do Brasil',
      bankCode: overrides.bankCode ?? '001',
      branchNumber: overrides.branchNumber ?? '1234',
      accountNumber: overrides.accountNumber ?? '567890',
      periodStart: overrides.periodStart ?? PERIOD_START,
      periodEnd: overrides.periodEnd ?? PERIOD_END,
      status: overrides.status,
      pendingCount: overrides.pendingCount,
      reconciledCount: overrides.reconciledCount,
      discardedCount: overrides.discardedCount,
      fileName: overrides.fileName ?? 'extrato-julho.ofx',
      objectKey: overrides.objectKey ?? OBJECT_KEY,
      importedByName: overrides.importedByName ?? '',
    },
    overrides.id ?? BANK_STATEMENT_ID,
  );
}

export function makeBankStatementTransaction(
  overrides: Partial<{
    id: string;
    organizationId: string;
    bankStatementId: string;
    bankAccountId: string | null;
    fitId: string;
    dedupeKey: string;
    postedAt: Date;
    amountCents: number;
    kind: BankStatementTransaction['kind'];
    transactionType: string;
    memo: string;
    status: BankStatementTransaction['status'];
  }> = {},
): BankStatementTransaction {
  return BankStatementTransaction.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      bankStatementId: overrides.bankStatementId ?? BANK_STATEMENT_ID,
      bankAccountId:
        overrides.bankAccountId !== undefined
          ? overrides.bankAccountId
          : BANK_ACCOUNT_ID,
      fitId: overrides.fitId ?? '2026070500001',
      dedupeKey: overrides.dedupeKey ?? overrides.fitId ?? '2026070500001',
      postedAt: overrides.postedAt ?? POSTED_AT,
      amountCents: overrides.amountCents ?? 15000,
      kind: overrides.kind ?? 'credit',
      transactionType: overrides.transactionType ?? 'XFER',
      memo: overrides.memo ?? 'TED RECEBIDA - JOAO SILVA',
      status: overrides.status,
    },
    overrides.id ?? BANK_STATEMENT_TRANSACTION_ID,
  );
}

export function makeBankStatementMatch(
  overrides: Partial<{
    id: string;
    organizationId: string;
    bankStatementTransactionId: string;
    financialEntryId: string;
    financialEntryPaymentId: string;
    amountCents: number;
  }> = {},
): BankStatementMatch {
  return BankStatementMatch.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      bankStatementTransactionId:
        overrides.bankStatementTransactionId ?? BANK_STATEMENT_TRANSACTION_ID,
      financialEntryId:
        overrides.financialEntryId ?? 'e1111111-1111-4111-8111-111111111111',
      financialEntryPaymentId:
        overrides.financialEntryPaymentId ??
        'p1111111-1111-4111-8111-111111111111',
      amountCents: overrides.amountCents ?? 15000,
    },
    overrides.id ?? BANK_STATEMENT_MATCH_ID,
  );
}

export function makeBankReconciliationRepositories() {
  return {
    bankStatementRepository: new InMemoryBankStatementRepository(),
    bankStatementTransactionRepository:
      new InMemoryBankStatementTransactionRepository(),
    bankStatementMatchRepository: new InMemoryBankStatementMatchRepository(),
  };
}
