import { InMemoryTransactionRepository } from '../../../infrastructure/database/in-memory-transaction.repository';
import { TransactionNotFoundError } from '../../../domain/errors/transaction-not-found.error';
import {
  seedTransaction,
  TEST_STORE,
} from '../shared/transaction-test-fixtures';
import { GetTransactionByIdUseCase } from './get-transaction-by-id.use-case';

describe('GetTransactionByIdUseCase', () => {
  let repo: InMemoryTransactionRepository;
  let useCase: GetTransactionByIdUseCase;

  beforeEach(() => {
    repo = new InMemoryTransactionRepository();
    useCase = new GetTransactionByIdUseCase(repo);
  });

  it('returns the transaction with its activity log', async () => {
    const created = await seedTransaction(repo);

    const found = await useCase.execute({
      storeId: TEST_STORE,
      id: created.id,
    });

    expect(found.id).toBe(created.id);
    expect(found.activityLog).toHaveLength(1);
    expect(found.activityLog[0].at).toBe('2026-07-01');
  });

  it('throws when the transaction belongs to another store', async () => {
    const created = await seedTransaction(repo, { storeId: 'other-store' });

    await expect(
      useCase.execute({ storeId: TEST_STORE, id: created.id }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });
});
