import { InMemoryTransactionRepository } from '../../../infrastructure/database/in-memory-transaction.repository';
import {
  seedTransaction,
  TEST_STORE,
} from '../shared/transaction-test-fixtures';
import { GetTransactionsReportUseCase } from './get-transactions-report.use-case';

describe('GetTransactionsReportUseCase', () => {
  let repo: InMemoryTransactionRepository;
  let useCase: GetTransactionsReportUseCase;

  beforeEach(() => {
    repo = new InMemoryTransactionRepository();
    useCase = new GetTransactionsReportUseCase(repo);
  });

  it('aggregates by status, type and agent ignoring cancelled deals', async () => {
    await seedTransaction(repo, {
      status: 'COMPLETED',
      grossValueCents: 1_000_000,
    });
    await seedTransaction(repo, {
      type: 'RENTAL',
      status: 'PROPOSAL',
      grossValueCents: 500_000,
    });
    await seedTransaction(repo, {
      status: 'CANCELLED',
      grossValueCents: 9_000_000,
    });

    const report = await useCase.execute({ storeId: TEST_STORE });

    expect(report.totalCount).toBe(2);
    expect(report.totalGrossValueCents).toBe(1_500_000);
    expect(report.totalCommissionCents).toBe(90_000);
    expect(report.completedCount).toBe(1);
    expect(report.byType).toHaveLength(2);
    expect(report.byStatus.map((row) => row.status)).toEqual([
      'COMPLETED',
      'PROPOSAL',
    ]);

    const captor = report.byAgent.find((row) => row.agentId === 'ana-helena');
    expect(captor?.dealsCount).toBe(2);
    expect(captor?.commissionCents).toBe(27_000);
  });

  it('counts a deal once when captor and seller are the same agent', async () => {
    await seedTransaction(repo, {
      captorId: 'ana-helena',
      sellerId: 'ana-helena',
      grossValueCents: 1_000_000,
    });

    const report = await useCase.execute({ storeId: TEST_STORE });

    expect(report.byAgent).toHaveLength(1);
    expect(report.byAgent[0].dealsCount).toBe(1);
    expect(report.byAgent[0].commissionCents).toBe(36_000);
  });

  it('rejects malformed periods', async () => {
    await expect(
      useCase.execute({ storeId: TEST_STORE, from: '2026-13-99x' }),
    ).rejects.toThrow();
  });

  it('returns an empty report for a store with no deals', async () => {
    const report = await useCase.execute({ storeId: 'empty-store' });

    expect(report.totalCount).toBe(0);
    expect(report.byAgent).toEqual([]);
  });
});
