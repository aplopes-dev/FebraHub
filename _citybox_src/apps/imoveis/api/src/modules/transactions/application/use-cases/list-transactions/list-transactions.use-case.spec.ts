import { InMemoryTransactionRepository } from '../../../infrastructure/database/in-memory-transaction.repository';
import {
  seedTransaction,
  TEST_STORE,
} from '../shared/transaction-test-fixtures';
import { ListTransactionsUseCase } from './list-transactions.use-case';

describe('ListTransactionsUseCase', () => {
  let repo: InMemoryTransactionRepository;
  let useCase: ListTransactionsUseCase;

  beforeEach(() => {
    repo = new InMemoryTransactionRepository();
    useCase = new ListTransactionsUseCase(repo);
  });

  it('paginates and reports totals', async () => {
    for (let i = 0; i < 5; i += 1) {
      await seedTransaction(repo, { title: `Venda ${i}` });
    }

    const result = await useCase.execute({
      storeId: TEST_STORE,
      page: 2,
      perPage: 2,
    });

    expect(result.total).toBe(5);
    expect(result.items).toHaveLength(2);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it('isolates by store', async () => {
    await seedTransaction(repo, { storeId: 'other-store' });
    await seedTransaction(repo);

    const result = await useCase.execute({ storeId: TEST_STORE });

    expect(result.total).toBe(1);
  });

  it('filters by type, status and agent', async () => {
    await seedTransaction(repo, {
      type: 'RENTAL',
      status: 'COMPLETED',
      captorId: 'carla-mendes',
      sellerId: null,
    });
    await seedTransaction(repo, { type: 'SALE', status: 'PROPOSAL' });

    const byType = await useCase.execute({
      storeId: TEST_STORE,
      type: ['RENTAL'],
    });
    expect(byType.total).toBe(1);

    const byStatus = await useCase.execute({
      storeId: TEST_STORE,
      status: ['COMPLETED'],
    });
    expect(byStatus.total).toBe(1);

    const byAgent = await useCase.execute({
      storeId: TEST_STORE,
      agentId: 'bruno-costa',
    });
    expect(byAgent.total).toBe(1);
    expect(byAgent.items[0].type).toBe('SALE');
  });

  it('searches on title, property, lead and agent ids', async () => {
    await seedTransaction(repo, { title: 'Venda — Cobertura Norte' });
    await seedTransaction(repo, { title: 'Locação — Loja Centro' });

    const result = await useCase.execute({
      storeId: TEST_STORE,
      search: 'cobertura',
    });

    expect(result.total).toBe(1);
    expect(result.items[0].title).toContain('Cobertura');
  });

  it('rejects unknown status values', async () => {
    await expect(
      useCase.execute({ storeId: TEST_STORE, status: ['NOPE'] }),
    ).rejects.toThrow(
      /Filtros de listagem inválidos|Invalid transaction status/,
    );
  });

  it('rejects malformed period filters', async () => {
    await expect(
      useCase.execute({ storeId: TEST_STORE, periodFrom: '01/07/2026' }),
    ).rejects.toThrow();
  });
});
