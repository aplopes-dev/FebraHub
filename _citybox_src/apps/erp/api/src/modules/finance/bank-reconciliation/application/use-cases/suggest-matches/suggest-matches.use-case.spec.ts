import {
  makeFinancialEntry,
  makeFinancialEntryRepositories,
} from '../../../../financial-entries/tests/financial-entries-test-factory';
import {
  ORGANIZATION_ID,
  BANK_ACCOUNT_ID,
  BANK_STATEMENT_ID,
  makeBankStatementTransaction,
  makeBankReconciliationRepositories,
} from '../../../tests/bank-reconciliation-test-factory';
import { SuggestMatchesUseCase } from './suggest-matches.use-case';

function setup() {
  const { financialEntryRepository } = makeFinancialEntryRepositories();
  const { bankStatementTransactionRepository } =
    makeBankReconciliationRepositories();
  const useCase = new SuggestMatchesUseCase(
    bankStatementTransactionRepository,
    financialEntryRepository,
  );
  return {
    financialEntryRepository,
    bankStatementTransactionRepository,
    useCase,
  };
}

describe('SuggestMatchesUseCase', () => {
  it('sugere um lançamento receivable com valor/data/conta compatíveis com uma transação de crédito', async () => {
    const {
      financialEntryRepository,
      bankStatementTransactionRepository,
      useCase,
    } = setup();
    await financialEntryRepository.save(
      makeFinancialEntry({
        id: 'entry-1',
        operation: 'receivable',
        amountCents: 15_000,
        bankAccountId: BANK_ACCOUNT_ID,
        dueDate: new Date('2026-07-05T00:00:00.000Z'),
      }),
    );
    const transaction = makeBankStatementTransaction({
      kind: 'credit',
      amountCents: 15_000,
      postedAt: new Date('2026-07-05T00:00:00.000Z'),
    });
    await bankStatementTransactionRepository.saveMany([transaction]);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
    });

    expect(result.kind).toBe('exact');
    expect(result.candidates.map((c) => c.financialEntryId)).toEqual([
      'entry-1',
    ]);
  });

  it('não sugere lançamento fora da janela de datas', async () => {
    const {
      financialEntryRepository,
      bankStatementTransactionRepository,
      useCase,
    } = setup();
    await financialEntryRepository.save(
      makeFinancialEntry({
        id: 'entry-far',
        operation: 'receivable',
        amountCents: 15_000,
        bankAccountId: BANK_ACCOUNT_ID,
        dueDate: new Date('2026-07-20T00:00:00.000Z'), // muito longe
      }),
    );
    const transaction = makeBankStatementTransaction({
      kind: 'credit',
      amountCents: 15_000,
      postedAt: new Date('2026-07-05T00:00:00.000Z'),
    });
    await bankStatementTransactionRepository.saveMany([transaction]);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
    });

    expect(result.kind).toBe('none');
  });

  it('não sugere lançamento payable para uma transação de crédito (sinal incompatível)', async () => {
    const {
      financialEntryRepository,
      bankStatementTransactionRepository,
      useCase,
    } = setup();
    await financialEntryRepository.save(
      makeFinancialEntry({
        id: 'entry-payable',
        operation: 'payable',
        amountCents: 15_000,
        bankAccountId: BANK_ACCOUNT_ID,
        dueDate: new Date('2026-07-05T00:00:00.000Z'),
      }),
    );
    const transaction = makeBankStatementTransaction({
      kind: 'credit',
      amountCents: 15_000,
      postedAt: new Date('2026-07-05T00:00:00.000Z'),
    });
    await bankStatementTransactionRepository.saveMany([transaction]);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
    });

    expect(result.kind).toBe('none');
  });

  it('lançamento já com paidCents totalizando o valor (status pending encerrado) não aparece como candidato', async () => {
    const {
      financialEntryRepository,
      bankStatementTransactionRepository,
      useCase,
    } = setup();
    // Lançamento já quitado por outra via (status vira 'paid', sai de 'pending').
    await financialEntryRepository.save(
      makeFinancialEntry({
        id: 'entry-paid',
        operation: 'receivable',
        amountCents: 15_000,
        bankAccountId: BANK_ACCOUNT_ID,
        dueDate: new Date('2026-07-05T00:00:00.000Z'),
        payments: [
          {
            id: 'p1',
            amountCents: 15_000,
            paidAt: new Date('2026-07-05T00:00:00.000Z'),
            paymentMethod: 'dinheiro',
            cardBrand: null,
          },
        ],
      }),
    );
    const transaction = makeBankStatementTransaction({
      kind: 'credit',
      amountCents: 15_000,
      postedAt: new Date('2026-07-05T00:00:00.000Z'),
    });
    await bankStatementTransactionRepository.saveMany([transaction]);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
    });

    expect(result.kind).toBe('none');
  });
});
