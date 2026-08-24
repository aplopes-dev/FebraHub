import { InMemoryTransactionRepository } from '../../../../transactions/infrastructure/database/in-memory-transaction.repository';
import {
  makeRental,
  seedTransaction,
  TEST_STORE,
} from '../../../../transactions/application/use-cases/shared/transaction-test-fixtures';
import { InMemoryExpenseRepository } from '../../../infrastructure/database/in-memory-expense.repository';
import {
  GetFinancialSummaryUseCase,
  type AgencyFinancialSummary,
  type SingleAgentFinancialSummary,
} from './get-financial-summary.use-case';

describe('GetFinancialSummaryUseCase', () => {
  let transactions: InMemoryTransactionRepository;
  let expenses: InMemoryExpenseRepository;
  let useCase: GetFinancialSummaryUseCase;

  beforeEach(() => {
    transactions = new InMemoryTransactionRepository();
    expenses = new InMemoryExpenseRepository();
    useCase = new GetFinancialSummaryUseCase(transactions, expenses);
  });

  it('builds the agency DRE from completed deals, admin fees and expenses', async () => {
    await seedTransaction(transactions, {
      status: 'COMPLETED',
      grossValueCents: 1_000_000,
    });
    await seedTransaction(transactions, {
      type: 'RENTAL',
      status: 'CONTRACT_SIGNED',
      grossValueCents: 300_000,
      rental: makeRental({ baseRentCents: 300_000, adminFeePercent: 10 }),
    });
    await seedTransaction(transactions, {
      status: 'CANCELLED',
      grossValueCents: 9_000_000,
    });
    await expenses.create({
      storeId: TEST_STORE,
      label: 'Aluguel',
      amountCents: 10_000,
      date: '2026-07-01',
      category: 'fixo',
    });

    const summary = (await useCase.execute({
      storeId: TEST_STORE,
      organizationType: 'AGENCY',
    })) as AgencyFinancialSummary;

    expect(summary.organizationType).toBe('AGENCY');
    expect(summary.grossRevenueCents).toBe(1_300_000);
    expect(summary.dre.commissionExpensesCents).toBe(36_000);
    expect(summary.dre.adminFeesCents).toBe(30_000);
    expect(summary.dre.operatingExpensesCents).toBe(10_000);
    // 24.000 (comissão da agência) + 30.000 (taxa de administração) − 10.000
    expect(summary.dre.netProfitCents).toBe(44_000);
    expect(summary.estimatedNetProfitCents).toBe(44_000);
    expect(summary.commissionsToReleaseCents).toBe(10_800);
    expect(summary.overdueRentalsCount).toBe(1);
  });

  it('builds the single-agent ledger from commissions and expenses', async () => {
    await seedTransaction(transactions, {
      status: 'COMPLETED',
      grossValueCents: 1_000_000,
      title: 'Venda — Casa Pontal',
    });
    await expenses.create({
      storeId: TEST_STORE,
      label: 'Anúncios',
      amountCents: 20_000,
      date: '2026-07-20',
      category: 'marketing',
    });

    const summary = (await useCase.execute({
      storeId: TEST_STORE,
      organizationType: 'SINGLE_AGENT',
    })) as SingleAgentFinancialSummary;

    expect(summary.grossRevenueCents).toBe(60_000);
    expect(summary.expensesCents).toBe(20_000);
    expect(summary.netProfitCents).toBe(40_000);
    expect(summary.ledger).toHaveLength(2);
    expect(summary.ledger.map((entry) => entry.type)).toContain('income');
  });

  it('scopes the single-agent ledger to the actor', async () => {
    await seedTransaction(transactions, {
      status: 'COMPLETED',
      captorId: 'carla-mendes',
      sellerId: 'carla-mendes',
      grossValueCents: 1_000_000,
    });

    const summary = (await useCase.execute({
      storeId: TEST_STORE,
      organizationType: 'SINGLE_AGENT',
      actorAgentId: 'ana-helena',
    })) as SingleAgentFinancialSummary;

    expect(summary.grossRevenueCents).toBe(0);
  });

  it('rejects malformed periods', async () => {
    await expect(
      useCase.execute({
        storeId: TEST_STORE,
        organizationType: 'AGENCY',
        from: 'ontem',
      }),
    ).rejects.toThrow();
  });
});
