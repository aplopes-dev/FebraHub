import { UpdateBankAccountUseCase } from './update-bank-account.use-case';
import { BankAccountNotFoundError } from '../../../domain/errors/bank-account-not-found.error';
import {
  makeBankAccount,
  makeBankAccountRepositories,
  BANK_ACCOUNT_ID,
  OPENED_AT,
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tests/bank-accounts-test-factory';

describe('UpdateBankAccountUseCase', () => {
  function setup() {
    const repos = makeBankAccountRepositories();
    const useCase = new UpdateBankAccountUseCase(repos.bankAccountRepository);
    return { ...repos, useCase };
  }

  it('atualiza os campos e faz round-trip do bankCode (FR-015)', async () => {
    const { useCase, bankAccountRepository } = setup();
    await bankAccountRepository.save(
      makeBankAccount({ id: BANK_ACCOUNT_ID, bankCode: 'bank-bb' }),
    );

    const updated = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: BANK_ACCOUNT_ID,
      name: 'Nova conta',
      bankCode: 'bank-itau',
      bankName: 'Itaú',
      openedAt: OPENED_AT,
    });

    expect(updated.bankCode).toBe('bank-itau');
  });

  it('aumentar o saldo de abertura ressincroniza a movimentação initial_balance', async () => {
    const { useCase, bankAccountRepository, bankTransactionRepository } =
      setup();
    await bankAccountRepository.save(
      makeBankAccount({
        id: BANK_ACCOUNT_ID,
        openingBalanceCents: 10_000,
        openedAt: OPENED_AT,
      }),
    );

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: BANK_ACCOUNT_ID,
      name: 'Conta',
      openingBalanceCents: 25_000,
      openedAt: OPENED_AT,
    });

    const balances = await bankTransactionRepository.sumBalancesByAccountIds(
      ORGANIZATION_ID,
      [BANK_ACCOUNT_ID],
    );
    expect(balances[BANK_ACCOUNT_ID]).toBe(25_000);
  });

  it('zerar o saldo de abertura remove a movimentação initial_balance (nunca duplica)', async () => {
    const { useCase, bankAccountRepository, bankTransactionRepository } =
      setup();
    await bankAccountRepository.save(
      makeBankAccount({
        id: BANK_ACCOUNT_ID,
        openingBalanceCents: 10_000,
        openedAt: OPENED_AT,
      }),
    );

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: BANK_ACCOUNT_ID,
      name: 'Conta',
      openingBalanceCents: 0,
      openedAt: OPENED_AT,
    });

    const balances = await bankTransactionRepository.sumBalancesByAccountIds(
      ORGANIZATION_ID,
      [BANK_ACCOUNT_ID],
    );
    expect(balances[BANK_ACCOUNT_ID]).toBeUndefined();
  });

  it('lança BankAccountNotFoundError para conta inexistente ou de outra organização', async () => {
    const { useCase, bankAccountRepository } = setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));

    await expect(
      useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        id: BANK_ACCOUNT_ID,
        name: 'Conta',
        openedAt: OPENED_AT,
      }),
    ).rejects.toBeInstanceOf(BankAccountNotFoundError);
  });
});
