import { InvalidSplitError } from '../../../domain/errors/invalid-split.error';
import { TransactionNotFoundError } from '../../../domain/errors/transaction-not-found.error';
import { InMemoryTransactionRepository } from '../../../infrastructure/database/in-memory-transaction.repository';
import {
  seedTransaction,
  TEST_STORE,
} from '../shared/transaction-test-fixtures';
import { UpdateTransactionSplitUseCase } from './update-transaction-split.use-case';

describe('UpdateTransactionSplitUseCase', () => {
  let repo: InMemoryTransactionRepository;
  let useCase: UpdateTransactionSplitUseCase;

  beforeEach(() => {
    repo = new InMemoryTransactionRepository();
    useCase = new UpdateTransactionSplitUseCase(repo);
  });

  it('recalculates amounts and appends an activity', async () => {
    const created = await seedTransaction(repo, { grossValueCents: 1_000_000 });

    const updated = await useCase.execute({
      storeId: TEST_STORE,
      id: created.id,
      agencyPercent: 50,
      captorPercent: 25,
      sellerPercent: 25,
      actorName: 'Ana Helena',
    });

    expect(updated.split.agencyAmountCents).toBe(30_000);
    expect(updated.split.captorAmountCents).toBe(15_000);
    expect(updated.splitSource).toBe('MANUAL');
    expect(updated.commissionPercent).toBe(6);
    expect(updated.activityLog).toHaveLength(2);
  });

  it('applies a new total commission when provided', async () => {
    const created = await seedTransaction(repo, { grossValueCents: 1_000_000 });

    const updated = await useCase.execute({
      storeId: TEST_STORE,
      id: created.id,
      agencyPercent: 40,
      captorPercent: 30,
      sellerPercent: 30,
      commissionPercent: 10,
      actorName: 'Ana Helena',
    });

    expect(updated.commissionPercent).toBe(10);
    expect(updated.split.totalCommissionCents).toBe(100_000);
    expect(updated.activityLog[1].message).toContain('10%');
  });

  it('accounts for extra participants', async () => {
    const created = await seedTransaction(repo, { grossValueCents: 1_000_000 });

    const updated = await useCase.execute({
      storeId: TEST_STORE,
      id: created.id,
      agencyPercent: 40,
      captorPercent: 25,
      sellerPercent: 25,
      others: [{ label: 'Parceiro', percent: 10 }],
      actorName: 'Ana Helena',
    });

    expect(updated.split.others).toHaveLength(1);
    expect(updated.split.others[0].amountCents).toBe(6_000);
  });

  it('rejects splits that do not add up to 100%', async () => {
    const created = await seedTransaction(repo);

    await expect(
      useCase.execute({
        storeId: TEST_STORE,
        id: created.id,
        agencyPercent: 40,
        captorPercent: 30,
        sellerPercent: 20,
        actorName: 'Ana Helena',
      }),
    ).rejects.toBeInstanceOf(InvalidSplitError);
  });

  it('rejects unknown transactions', async () => {
    await expect(
      useCase.execute({
        storeId: TEST_STORE,
        id: 'missing',
        agencyPercent: 40,
        captorPercent: 30,
        sellerPercent: 30,
        actorName: 'Ana Helena',
      }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });
});
