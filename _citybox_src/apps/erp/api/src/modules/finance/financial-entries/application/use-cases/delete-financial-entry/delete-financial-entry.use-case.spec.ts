import { DeleteFinancialEntryUseCase } from './delete-financial-entry.use-case';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import { FinancialEntryNotRemovableError } from '../../../domain/errors/financial-entry-not-removable.error';
import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import {
  BANK_ACCOUNT_ID,
  makeBankAccount,
} from '../../../../bank-accounts/tests/bank-accounts-test-factory';
import { InMemoryBankStatementMatchRepository } from '../../../../bank-reconciliation/tests/in-memory-bank-statement-match.repository';
import { makeBankStatementMatch } from '../../../../bank-reconciliation/tests/bank-reconciliation-test-factory';
import {
  FINANCIAL_ENTRY_ID,
  makeFinancialEntry,
  makeFinancialEntryPayment,
  makeFinancialEntryRepositories,
  ORGANIZATION_ID,
} from '../../../tests/financial-entries-test-factory';

describe('DeleteFinancialEntryUseCase', () => {
  function setup() {
    const repos = makeFinancialEntryRepositories();
    const bankStatementMatchRepository =
      new InMemoryBankStatementMatchRepository();
    const useCase = new DeleteFinancialEntryUseCase(
      repos.financialEntryRepository,
      bankStatementMatchRepository,
    );
    return { ...repos, bankStatementMatchRepository, useCase };
  }

  it('exclui (soft-delete) um lançamento existente', async () => {
    const { useCase, financialEntryRepository } = setup();
    await financialEntryRepository.save(makeFinancialEntry());

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_ENTRY_ID,
    });

    const entry = await financialEntryRepository.findById(
      ORGANIZATION_ID,
      FINANCIAL_ENTRY_ID,
    );
    expect(entry?.deletedAt).not.toBeNull();
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

  it('lança FinancialEntryNotFoundError para lançamento já excluído', async () => {
    const { useCase, financialEntryRepository } = setup();
    await financialEntryRepository.save(makeFinancialEntry());
    await financialEntryRepository.softDelete(
      ORGANIZATION_ID,
      FINANCIAL_ENTRY_ID,
      new Date(),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: FINANCIAL_ENTRY_ID,
      }),
    ).rejects.toBeInstanceOf(FinancialEntryNotFoundError);
  });

  it('permite excluir mesmo um lançamento vinculado a um pedido de venda (FR-017)', async () => {
    const { useCase, financialEntryRepository } = setup();
    const linked = makeFinancialEntry();
    await financialEntryRepository.save(
      FinancialEntry.with(
        { ...linked.props, saleOrderId: 'so-1111-1111-4111-8111-111111111111' },
        linked.id,
      ),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: FINANCIAL_ENTRY_ID,
      }),
    ).resolves.toBeUndefined();
  });

  it('remove as movimentações de ledger do lançamento excluído (FR-017, primeira metade)', async () => {
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

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_ENTRY_ID,
    });

    const balances = await bankTransactionRepository.sumBalancesByAccountIds(
      ORGANIZATION_ID,
      [BANK_ACCOUNT_ID],
    );
    expect(balances[BANK_ACCOUNT_ID]).toBeUndefined();
  });

  it('bloqueia a exclusão quando o lançamento tem um pagamento com conciliação ativa (US10/FR-006e)', async () => {
    const { useCase, financialEntryRepository, bankStatementMatchRepository } =
      setup();
    await financialEntryRepository.save(makeFinancialEntry());
    await bankStatementMatchRepository.saveMany([
      makeBankStatementMatch({ financialEntryId: FINANCIAL_ENTRY_ID }),
    ]);

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: FINANCIAL_ENTRY_ID,
      }),
    ).rejects.toBeInstanceOf(FinancialEntryNotRemovableError);

    const entry = await financialEntryRepository.findById(
      ORGANIZATION_ID,
      FINANCIAL_ENTRY_ID,
    );
    expect(entry?.deletedAt).toBeNull();
  });

  it('permite excluir depois que a conciliação do pagamento foi desfeita (US10/FR-006f)', async () => {
    const { useCase, financialEntryRepository, bankStatementMatchRepository } =
      setup();
    await financialEntryRepository.save(makeFinancialEntry());
    const match = makeBankStatementMatch({
      financialEntryId: FINANCIAL_ENTRY_ID,
    });
    await bankStatementMatchRepository.saveMany([match]);
    // `UndoReconciliationUseCase` hard-deleta o match ao desfazer (R9) —
    // simulado aqui diretamente no repositório in-memory.
    await bankStatementMatchRepository.deleteByTransactionId(
      ORGANIZATION_ID,
      match.bankStatementTransactionId,
    );

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_ENTRY_ID,
    });

    const entry = await financialEntryRepository.findById(
      ORGANIZATION_ID,
      FINANCIAL_ENTRY_ID,
    );
    expect(entry?.deletedAt).not.toBeNull();
  });
});
