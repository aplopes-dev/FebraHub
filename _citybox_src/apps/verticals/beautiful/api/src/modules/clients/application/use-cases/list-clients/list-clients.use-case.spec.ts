import { InMemoryClientRepository } from '../../../tests/in-memory-client.repository';
import { InMemoryClientCategoryRepository } from '../../../../client-categories/tests/in-memory-client-category.repository';
import { CreateClientUseCase } from '../create-client/create-client.use-case';
import { ListClientsUseCase } from './list-clients.use-case';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';
const OTHER_STORE_ID = '019c0000-0000-7000-8000-000000000002';

describe('ListClientsUseCase', () => {
  let repository: InMemoryClientRepository;
  let categories: InMemoryClientCategoryRepository;
  let create: CreateClientUseCase;
  let sut: ListClientsUseCase;

  beforeEach(async () => {
    repository = new InMemoryClientRepository();
    categories = new InMemoryClientCategoryRepository();
    create = new CreateClientUseCase(repository, categories);
    sut = new ListClientsUseCase(repository);

    await create.execute({
      storeId: STORE_ID,
      name: 'Maria Souza',
      phone: '(73) 99876-5432',
    });
    await create.execute({
      storeId: STORE_ID,
      name: 'João Silva',
      phone: '(73) 99111-2222',
    });
    await create.execute({
      storeId: OTHER_STORE_ID,
      name: 'Outra Loja',
      phone: '(73) 99000-0000',
    });
  });

  it('should list all clients for the store with pagination and stats', async () => {
    const result = await sut.execute({ storeId: STORE_ID, page: 1, perPage: 10 });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(10);
    expect(result.stats.totalClients).toBe(2);
  });

  it('should filter by name search', async () => {
    const result = await sut.execute({ storeId: STORE_ID, search: 'maria' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Maria Souza');
  });

  it('should filter by phone search', async () => {
    const result = await sut.execute({ storeId: STORE_ID, search: '99111' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('João Silva');
  });

  it('should not return clients from another store', async () => {
    const result = await sut.execute({ storeId: OTHER_STORE_ID });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Outra Loja');
  });
});
