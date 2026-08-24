import { CreateBankAccountUseCase } from './create-bank-account.use-case';
import {
  makeBankAccount,
  makeBankAccountRepositories,
  OPENED_AT,
  ORGANIZATION_ID,
} from '../../../tests/bank-accounts-test-factory';

describe('CreateBankAccountUseCase', () => {
  function setup() {
    const repos = makeBankAccountRepositories();
    const useCase = new CreateBankAccountUseCase(repos.bankAccountRepository);
    return { ...repos, useCase };
  }

  it('cria a conta com os textos aparados e os opcionais em branco', async () => {
    const { useCase } = setup();

    const bankAccount = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      name: '  Caixa operacional  ',
      openedAt: OPENED_AT,
    });

    expect(bankAccount.name).toBe('Caixa operacional');
    expect(bankAccount.bankName).toBe('');
    expect(bankAccount.openingBalanceCents).toBe(0);
    expect(bankAccount.branchIds).toEqual([]);
    expect(bankAccount.deletedAt).toBeNull();
  });

  it('guarda banco, saldo inicial e unidades atendidas', async () => {
    const { useCase, bankAccountRepository } = setup();
    const branchIds = ['c1111111-1111-4111-8111-111111111111'];

    const bankAccount = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      name: 'Conta Itaú',
      bankName: '  Itaú  ',
      openingBalanceCents: 15_000,
      openedAt: OPENED_AT,
      branchIds,
    });

    expect(bankAccount.bankName).toBe('Itaú');
    expect(bankAccount.openingBalanceCents).toBe(15_000);
    expect(bankAccount.branchIds).toEqual(branchIds);
    await expect(
      bankAccountRepository.findById(ORGANIZATION_ID, bankAccount.id),
    ).resolves.not.toBeNull();
  });

  it('aceita apelido repetido — o nome não é único', async () => {
    const { useCase, bankAccountRepository } = setup();
    await bankAccountRepository.save(
      makeBankAccount({ name: 'Caixa operacional' }),
    );

    const bankAccount = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      name: 'Caixa operacional',
      openedAt: OPENED_AT,
    });

    expect(bankAccount.name).toBe('Caixa operacional');
  });

  it('guarda o bankCode e devolve ele de volta (round-trip do Select — FR-015)', async () => {
    const { useCase } = setup();

    const bankAccount = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      name: 'Conta Itaú',
      bankName: 'Itaú',
      bankCode: 'bank-itau',
      openedAt: OPENED_AT,
    });

    expect(bankAccount.bankCode).toBe('bank-itau');
  });

  it('cria a movimentação de saldo inicial quando openingBalanceCents > 0 (RN-02/FR-003)', async () => {
    const { useCase, bankTransactionRepository } = setup();

    const bankAccount = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      name: 'Conta com saldo',
      openingBalanceCents: 10_000,
      openedAt: OPENED_AT,
    });

    const balances = await bankTransactionRepository.sumBalancesByAccountIds(
      ORGANIZATION_ID,
      [bankAccount.id],
    );
    expect(balances[bankAccount.id]).toBe(10_000);
  });

  it('não cria nenhuma movimentação quando openingBalanceCents é 0', async () => {
    const { useCase, bankTransactionRepository } = setup();

    const bankAccount = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      name: 'Conta zerada',
      openedAt: OPENED_AT,
    });

    const balances = await bankTransactionRepository.sumBalancesByAccountIds(
      ORGANIZATION_ID,
      [bankAccount.id],
    );
    expect(balances[bankAccount.id]).toBeUndefined();
  });
});
