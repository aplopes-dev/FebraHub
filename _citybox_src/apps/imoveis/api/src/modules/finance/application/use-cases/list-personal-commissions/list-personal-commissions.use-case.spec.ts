import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { InMemoryTransactionRepository } from '../../../../transactions/infrastructure/database/in-memory-transaction.repository';
import {
  seedTransaction,
  TEST_STORE,
} from '../../../../transactions/application/use-cases/shared/transaction-test-fixtures';
import { ListPersonalCommissionsUseCase } from './list-personal-commissions.use-case';

describe('ListPersonalCommissionsUseCase', () => {
  let transactions: InMemoryTransactionRepository;
  let useCase: ListPersonalCommissionsUseCase;

  beforeEach(() => {
    transactions = new InMemoryTransactionRepository();
    useCase = new ListPersonalCommissionsUseCase(transactions);
  });

  it('returns the captor slice with released status for completed deals', async () => {
    await seedTransaction(transactions, {
      status: 'COMPLETED',
      captorId: 'ana-helena',
      grossValueCents: 1_000_000,
    });

    const entries = await useCase.execute({
      storeId: TEST_STORE,
      agentId: 'ana-helena',
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].role).toBe('captor');
    expect(entries[0].amountCents).toBe(18_000);
    expect(entries[0].status).toBe('released');
  });

  it('returns the seller slice as pending while the deal is open', async () => {
    await seedTransaction(transactions, {
      status: 'PROPOSAL',
      captorId: 'ana-helena',
      sellerId: 'bruno-costa',
      grossValueCents: 1_000_000,
    });

    const entries = await useCase.execute({
      storeId: TEST_STORE,
      agentId: 'bruno-costa',
    });

    expect(entries[0].role).toBe('seller');
    expect(entries[0].status).toBe('pending');
  });

  it('skips cancelled deals and agents without a slice', async () => {
    await seedTransaction(transactions, { status: 'CANCELLED' });

    await expect(
      useCase.execute({ storeId: TEST_STORE, agentId: 'ana-helena' }),
    ).resolves.toEqual([]);
    await expect(
      useCase.execute({ storeId: TEST_STORE, agentId: 'carla-mendes' }),
    ).resolves.toEqual([]);
  });

  it('requires an agentId', async () => {
    await expect(
      useCase.execute({ storeId: TEST_STORE, agentId: '  ' }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });
});
