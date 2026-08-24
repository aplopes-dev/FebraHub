import { InMemoryTransactionRepository } from '../../../../transactions/infrastructure/database/in-memory-transaction.repository';
import {
  makeRental,
  seedTransaction,
  TEST_STORE,
} from '../../../../transactions/application/use-cases/shared/transaction-test-fixtures';
import { ListRentalPayoutsUseCase } from './list-rental-payouts.use-case';

describe('ListRentalPayoutsUseCase', () => {
  let transactions: InMemoryTransactionRepository;
  let useCase: ListRentalPayoutsUseCase;

  beforeEach(() => {
    transactions = new InMemoryTransactionRepository();
    useCase = new ListRentalPayoutsUseCase(transactions);
  });

  it('computes admin fee, deductions and owner payout', async () => {
    await seedTransaction(transactions, {
      type: 'RENTAL',
      rental: makeRental({
        baseRentCents: 300_000,
        adminFeePercent: 10,
        receivedCents: 300_000,
        deductions: [{ label: 'Reparo', amountCents: 5_000 }],
      }),
    });

    const rows = await useCase.execute({ storeId: TEST_STORE });

    expect(rows).toHaveLength(1);
    expect(rows[0].adminFeeCents).toBe(30_000);
    expect(rows[0].deductionsCents).toBe(5_000);
    expect(rows[0].payoutCents).toBe(265_000);
    expect(rows[0].status).toBe('AWAITING_PAYMENT');
  });

  it('ignores sales', async () => {
    await seedTransaction(transactions, { type: 'SALE' });

    await expect(useCase.execute({ storeId: TEST_STORE })).resolves.toEqual([]);
  });
});
