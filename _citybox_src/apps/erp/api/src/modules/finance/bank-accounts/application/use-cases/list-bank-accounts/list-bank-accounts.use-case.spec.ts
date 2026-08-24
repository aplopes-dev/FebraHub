import { ListBankAccountsUseCase } from './list-bank-accounts.use-case';
import { BankTransaction } from '../../../domain/entities/bank-transaction.entity';
import {
  BANK_ACCOUNT_ID,
  makeBankAccount,
  makeBankAccountRepositories,
  ORGANIZATION_ID,
  OTHER_BANK_ACCOUNT_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tests/bank-accounts-test-factory';

describe('ListBankAccountsUseCase', () => {
  async function setup() {
    const repos = makeBankAccountRepositories();
    const useCase = new ListBankAccountsUseCase(
      repos.bankAccountRepository,
      repos.bankTransactionRepository,
    );

    await repos.bankAccountRepository.save(
      makeBankAccount({
        id: BANK_ACCOUNT_ID,
        name: 'Caixa operacional',
        bankName: 'Banco do Brasil',
        openingBalanceCents: 10_000,
      }),
    );
    await repos.bankAccountRepository.save(
      makeBankAccount({
        id: OTHER_BANK_ACCOUNT_ID,
        name: 'Conta Itaú',
        bankName: 'Itaú',
      }),
    );
    await repos.bankAccountRepository.softDelete(
      ORGANIZATION_ID,
      OTHER_BANK_ACCOUNT_ID,
      new Date(),
    );

    return { ...repos, useCase };
  }

  it('lista só as ativas por padrão e conta as duas abas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.items.map((item) => item.id)).toEqual([BANK_ACCOUNT_ID]);
    expect(result.total).toBe(1);
    expect(result.tabCounts).toEqual({ active: 1, deleted: 1 });
  });

  it('devolve o saldo calculado por conta, não o saldo de abertura estático (FR-004)', async () => {
    const { useCase, bankTransactionRepository } = await setup();
    bankTransactionRepository.replaceBySource(
      ORGANIZATION_ID,
      'bank_transfer',
      'transfer-1',
      [
        BankTransaction.create({
          organizationId: ORGANIZATION_ID,
          bankAccountId: BANK_ACCOUNT_ID,
          kind: 'credit',
          amountCents: 5_000,
          effectiveAt: new Date(),
          sourceType: 'bank_transfer',
          sourceId: 'transfer-1',
        }),
      ],
    );

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    // 10.000 (saldo inicial) + 5.000 (transferência) = 15.000 — nunca 10.000.
    expect(result.balances[BANK_ACCOUNT_ID]).toBe(15_000);
  });

  it('lista só as excluídas na aba "deleted"', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'deleted',
    });

    expect(result.items.map((item) => item.id)).toEqual([
      OTHER_BANK_ACCOUNT_ID,
    ]);
    expect(result.total).toBe(1);
  });

  it('busca também pelo nome do banco', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'brasil',
    });

    expect(result.items.map((item) => item.name)).toEqual([
      'Caixa operacional',
    ]);
    // Os contadores dizem quanto existe em cada aba, não quanto a busca achou.
    expect(result.tabCounts).toEqual({ active: 1, deleted: 1 });
  });

  it('não devolve conta de outra organização', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: OTHER_ORGANIZATION_ID,
    });

    expect(result.items).toHaveLength(0);
    expect(result.tabCounts).toEqual({ active: 0, deleted: 0 });
  });
});
