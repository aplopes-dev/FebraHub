import { FindBankAccountByIdUseCase } from './find-bank-account-by-id.use-case';
import { BankAccountNotFoundError } from '../../../domain/errors/bank-account-not-found.error';
import { BankTransaction } from '../../../domain/entities/bank-transaction.entity';
import {
  makeBankAccount,
  makeBankAccountRepositories,
  BANK_ACCOUNT_ID,
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tests/bank-accounts-test-factory';

describe('FindBankAccountByIdUseCase', () => {
  function setup() {
    const repos = makeBankAccountRepositories();
    const useCase = new FindBankAccountByIdUseCase(
      repos.bankAccountRepository,
      repos.bankTransactionRepository,
    );
    return { ...repos, useCase };
  }

  it('devolve a conta e o saldo calculado', async () => {
    const { useCase, bankAccountRepository, bankTransactionRepository } =
      setup();
    await bankAccountRepository.save(
      makeBankAccount({ id: BANK_ACCOUNT_ID, openingBalanceCents: 10_000 }),
    );
    bankTransactionRepository.insert(
      BankTransaction.create({
        organizationId: ORGANIZATION_ID,
        bankAccountId: BANK_ACCOUNT_ID,
        kind: 'credit',
        amountCents: 5_000,
        effectiveAt: new Date(),
        sourceType: 'bank_transfer',
        sourceId: 'transfer-1',
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: BANK_ACCOUNT_ID,
    });

    expect(result.account.id).toBe(BANK_ACCOUNT_ID);
    expect(result.currentBalanceCents).toBe(15_000);
  });

  it('lança BankAccountNotFoundError para conta inexistente ou de outra organização', async () => {
    const { useCase, bankAccountRepository } = setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));

    await expect(
      useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        id: BANK_ACCOUNT_ID,
      }),
    ).rejects.toBeInstanceOf(BankAccountNotFoundError);
  });
});
