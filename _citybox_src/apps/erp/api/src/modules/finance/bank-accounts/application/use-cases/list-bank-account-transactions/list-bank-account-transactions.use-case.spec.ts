import { ListBankAccountTransactionsUseCase } from './list-bank-account-transactions.use-case';
import { BankAccountNotFoundError } from '../../../domain/errors/bank-account-not-found.error';
import { BankTransaction } from '../../../domain/entities/bank-transaction.entity';
import {
  makeBankAccount,
  makeBankAccountRepositories,
  BANK_ACCOUNT_ID,
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tests/bank-accounts-test-factory';

describe('ListBankAccountTransactionsUseCase', () => {
  function setup() {
    const repos = makeBankAccountRepositories();
    const useCase = new ListBankAccountTransactionsUseCase(
      repos.bankAccountRepository,
      repos.bankTransactionRepository,
    );
    return { ...repos, useCase };
  }

  function seed(
    bankTransactionRepository: ReturnType<
      typeof makeBankAccountRepositories
    >['bankTransactionRepository'],
  ) {
    bankTransactionRepository.insert(
      BankTransaction.create({
        organizationId: ORGANIZATION_ID,
        bankAccountId: BANK_ACCOUNT_ID,
        kind: 'credit',
        amountCents: 5_000,
        effectiveAt: new Date('2026-01-10'),
        sourceType: 'bank_transfer',
        sourceId: 'transfer-1',
      }),
    );
    bankTransactionRepository.insert(
      BankTransaction.create({
        organizationId: ORGANIZATION_ID,
        bankAccountId: BANK_ACCOUNT_ID,
        kind: 'debit',
        amountCents: 2_000,
        effectiveAt: new Date('2026-01-20'),
        sourceType: 'bank_transfer',
        sourceId: 'transfer-2',
      }),
    );
  }

  it('lista as movimentações da conta, mais recente primeiro', async () => {
    const { useCase, bankAccountRepository, bankTransactionRepository } =
      setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));
    seed(bankTransactionRepository);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
    });

    expect(result.items.map((item) => item.kind)).toEqual(['debit', 'credit']);
    expect(result.total).toBe(2);
  });

  it('filtra por tipo', async () => {
    const { useCase, bankAccountRepository, bankTransactionRepository } =
      setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));
    seed(bankTransactionRepository);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
      kind: 'credit',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].kind).toBe('credit');
  });

  it('filtra por período', async () => {
    const { useCase, bankAccountRepository, bankTransactionRepository } =
      setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));
    seed(bankTransactionRepository);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
      effectiveFrom: new Date('2026-01-15'),
      effectiveTo: new Date('2026-01-25'),
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].effectiveAt.toISOString().slice(0, 10)).toBe(
      '2026-01-20',
    );
  });

  it('lança BankAccountNotFoundError para conta inexistente ou de outra organização', async () => {
    const { useCase, bankAccountRepository } = setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));

    await expect(
      useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        bankAccountId: BANK_ACCOUNT_ID,
      }),
    ).rejects.toBeInstanceOf(BankAccountNotFoundError);
  });
});
