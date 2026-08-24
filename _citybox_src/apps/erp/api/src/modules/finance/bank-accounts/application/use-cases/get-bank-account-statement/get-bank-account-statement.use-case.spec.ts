import { GetBankAccountStatementUseCase } from './get-bank-account-statement.use-case';
import { BankAccountNotFoundError } from '../../../domain/errors/bank-account-not-found.error';
import { BankTransaction } from '../../../domain/entities/bank-transaction.entity';
import {
  makeBankAccount,
  makeBankAccountRepositories,
  BANK_ACCOUNT_ID,
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tests/bank-accounts-test-factory';

describe('GetBankAccountStatementUseCase', () => {
  function setup() {
    const repos = makeBankAccountRepositories();
    const useCase = new GetBankAccountStatementUseCase(
      repos.bankAccountRepository,
      repos.bankTransactionRepository,
    );
    return { ...repos, useCase };
  }

  /** 3 movimentações, mais antiga primeiro: 10.000, +5.000, -2.000 → saldo final 13.000. */
  function seedThreeMovements(
    bankTransactionRepository: ReturnType<
      typeof makeBankAccountRepositories
    >['bankTransactionRepository'],
  ) {
    const movements = [
      BankTransaction.create({
        organizationId: ORGANIZATION_ID,
        bankAccountId: BANK_ACCOUNT_ID,
        kind: 'initial_balance',
        amountCents: 10_000,
        effectiveAt: new Date('2026-01-01'),
        sourceType: 'initial_balance',
        sourceId: BANK_ACCOUNT_ID,
      }),
      BankTransaction.create({
        organizationId: ORGANIZATION_ID,
        bankAccountId: BANK_ACCOUNT_ID,
        kind: 'credit',
        amountCents: 5_000,
        effectiveAt: new Date('2026-01-02'),
        sourceType: 'bank_transfer',
        sourceId: 'transfer-1',
      }),
      BankTransaction.create({
        organizationId: ORGANIZATION_ID,
        bankAccountId: BANK_ACCOUNT_ID,
        kind: 'debit',
        amountCents: 2_000,
        effectiveAt: new Date('2026-01-03'),
        sourceType: 'bank_transfer',
        sourceId: 'transfer-2',
      }),
    ];
    for (const movement of movements) {
      bankTransactionRepository.insert(movement);
    }
  }

  it('devolve o saldo acumulado correto por linha, mais recente primeiro', async () => {
    const { useCase, bankAccountRepository, bankTransactionRepository } =
      setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));
    seedThreeMovements(bankTransactionRepository);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
    });

    expect(result.items.map((item) => item.runningBalanceCents)).toEqual([
      13_000, 15_000, 10_000,
    ]);
    // A movimentação mais antiga mostra saldo igual ao próprio valor (SC-003).
    expect(result.items[2].runningBalanceCents).toBe(
      result.items[2].transaction.amountCents,
    );
  });

  it('mantém o saldo acumulado correto entre páginas (FR-007)', async () => {
    const { useCase, bankAccountRepository, bankTransactionRepository } =
      setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));
    seedThreeMovements(bankTransactionRepository);

    const page1 = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
      page: 1,
      perPage: 2,
    });
    const page2 = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
      page: 2,
      perPage: 2,
    });

    expect(page1.items.map((item) => item.runningBalanceCents)).toEqual([
      13_000, 15_000,
    ]);
    // Página 2 continua a mesma sequência — não reinicia, não recalcula errado.
    expect(page2.items.map((item) => item.runningBalanceCents)).toEqual([
      10_000,
    ]);
    expect(page2.total).toBe(3);
  });

  it('devolve lista vazia sem erro para conta sem movimentações', async () => {
    const { useCase, bankAccountRepository } = setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
    });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
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
