import { RestoreFinancialEntryUseCase } from './restore-financial-entry.use-case';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import {
  BANK_ACCOUNT_ID,
  makeBankAccount,
} from '../../../../bank-accounts/tests/bank-accounts-test-factory';
import {
  FINANCIAL_ENTRY_ID,
  makeFinancialEntry,
  makeFinancialEntryPayment,
  makeFinancialEntryRepositories,
  ORGANIZATION_ID,
} from '../../../tests/financial-entries-test-factory';

describe('RestoreFinancialEntryUseCase', () => {
  function setup() {
    const repos = makeFinancialEntryRepositories();
    const useCase = new RestoreFinancialEntryUseCase(
      repos.financialEntryRepository,
    );
    return { ...repos, useCase };
  }

  it('restaura um lançamento excluído', async () => {
    const { useCase, financialEntryRepository } = setup();
    await financialEntryRepository.save(makeFinancialEntry());
    await financialEntryRepository.softDelete(
      ORGANIZATION_ID,
      FINANCIAL_ENTRY_ID,
      new Date(),
    );

    const entry = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_ENTRY_ID,
    });

    expect(entry.deletedAt).toBeNull();
  });

  it('é idempotente para lançamento já ativo', async () => {
    const { useCase, financialEntryRepository } = setup();
    await financialEntryRepository.save(makeFinancialEntry());

    const entry = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_ENTRY_ID,
    });

    expect(entry.deletedAt).toBeNull();
  });

  it('lança FinancialEntryNotFoundError para lançamento inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: FINANCIAL_ENTRY_ID,
      }),
    ).rejects.toBeInstanceOf(FinancialEntryNotFoundError);
  });

  it('permite restaurar mesmo um lançamento vinculado a um pedido de venda (FR-017)', async () => {
    const { useCase, financialEntryRepository } = setup();
    const linked = makeFinancialEntry();
    await financialEntryRepository.save(
      FinancialEntry.with(
        { ...linked.props, saleOrderId: 'so-1111-1111-4111-8111-111111111111' },
        linked.id,
      ),
    );
    await financialEntryRepository.softDelete(
      ORGANIZATION_ID,
      FINANCIAL_ENTRY_ID,
      new Date(),
    );

    const entry = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_ENTRY_ID,
    });

    expect(entry.deletedAt).toBeNull();
  });

  it('recria as movimentações de ledger a partir dos pagamentos persistidos (FR-017, segunda metade)', async () => {
    const {
      useCase,
      financialEntryRepository,
      bankAccountRepository,
      bankTransactionRepository,
    } = setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));
    await financialEntryRepository.save(
      makeFinancialEntry({
        bankAccountId: BANK_ACCOUNT_ID,
        payments: [makeFinancialEntryPayment({ amountCents: 10_000 })],
      }),
    );
    await financialEntryRepository.softDelete(
      ORGANIZATION_ID,
      FINANCIAL_ENTRY_ID,
      new Date(),
    );

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_ENTRY_ID,
    });

    const balances = await bankTransactionRepository.sumBalancesByAccountIds(
      ORGANIZATION_ID,
      [BANK_ACCOUNT_ID],
    );
    expect(balances[BANK_ACCOUNT_ID]).toBe(10_000);
  });
});
