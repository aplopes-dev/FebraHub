import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tenancy/tests/tenancy-test-factory';
import { BankAccount } from '../domain/entities/bank-account.entity';
import { BankTransaction } from '../domain/entities/bank-transaction.entity';
import { InMemoryBankAccountRepository } from './in-memory-bank-account.repository';
import { InMemoryBankTransactionRepository } from './in-memory-bank-transaction.repository';

export { ORGANIZATION_ID, OTHER_ORGANIZATION_ID };

export const BANK_ACCOUNT_ID = 'b1111111-1111-4111-8111-111111111111';
export const OTHER_BANK_ACCOUNT_ID = 'b2222222-2222-4222-8222-222222222222';
export const BANK_TRANSACTION_ID = 'b3333333-3333-4333-8333-333333333333';

export const OPENED_AT = new Date('2026-01-01T00:00:00.000Z');

export function makeBankAccount(
  overrides: Partial<{
    id: string;
    organizationId: string;
    name: string;
    bankName: string;
    bankCode: string;
    openingBalanceCents: number;
    openedAt: Date;
    branchIds: string[];
  }> = {},
): BankAccount {
  return BankAccount.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      name: overrides.name ?? 'Caixa operacional',
      bankName: overrides.bankName ?? 'Banco do Brasil',
      bankCode: overrides.bankCode ?? 'bank-bb',
      openingBalanceCents: overrides.openingBalanceCents ?? 0,
      openedAt: overrides.openedAt ?? OPENED_AT,
      branchIds: overrides.branchIds ?? [],
    },
    overrides.id ?? BANK_ACCOUNT_ID,
  );
}

export function makeBankTransaction(
  overrides: Partial<{
    id: string;
    organizationId: string;
    bankAccountId: string;
    kind: BankTransaction['kind'];
    description: string;
    amountCents: number;
    effectiveAt: Date;
    sourceType: BankTransaction['sourceType'];
    sourceId: string | null;
    createdByName: string;
  }> = {},
): BankTransaction {
  return BankTransaction.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      bankAccountId: overrides.bankAccountId ?? BANK_ACCOUNT_ID,
      kind: overrides.kind ?? 'credit',
      description: overrides.description ?? '',
      amountCents: overrides.amountCents ?? 1000,
      effectiveAt: overrides.effectiveAt ?? OPENED_AT,
      sourceType: overrides.sourceType ?? 'bank_transfer',
      sourceId: overrides.sourceId ?? null,
      createdByName: overrides.createdByName ?? '',
    },
    overrides.id ?? BANK_TRANSACTION_ID,
  );
}

/**
 * `bankTransactionRepository` é compartilhada entre esta fábrica e a de
 * `financial-entries` (ver `financial-entries-test-factory.ts`) quando um
 * spec precisa provar o efeito colateral de ledger de um caso de uso de
 * lançamento — passe a mesma instância adiante em vez de criar uma nova.
 */
export function makeBankAccountRepositories(
  bankTransactionRepository: InMemoryBankTransactionRepository = new InMemoryBankTransactionRepository(),
) {
  return {
    bankAccountRepository: new InMemoryBankAccountRepository(
      bankTransactionRepository,
    ),
    bankTransactionRepository,
  };
}
