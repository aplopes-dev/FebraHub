import { InMemoryClientRepository } from '../../../tests/in-memory-client.repository';
import { InMemoryClientCategoryRepository } from '../../../../client-categories/tests/in-memory-client-category.repository';
import { CreateClientUseCase } from '../create-client/create-client.use-case';
import { GetClientByIdUseCase } from './get-client-by-id.use-case';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';
const OTHER_STORE_ID = '019c0000-0000-7000-8000-000000000002';

describe('GetClientByIdUseCase', () => {
  let repository: InMemoryClientRepository;
  let categories: InMemoryClientCategoryRepository;
  let create: CreateClientUseCase;
  let sut: GetClientByIdUseCase;

  beforeEach(() => {
    repository = new InMemoryClientRepository();
    categories = new InMemoryClientCategoryRepository();
    create = new CreateClientUseCase(repository, categories);
    sut = new GetClientByIdUseCase(repository);
  });

  it('should return a client by id', async () => {
    const created = await create.execute({
      storeId: STORE_ID,
      name: 'Maria Souza',
      phone: '(73) 99876-5432',
    });

    const result = await sut.execute({ storeId: STORE_ID, id: created.id });
    expect(result.id).toBe(created.id);
    expect(result.name).toBe('Maria Souza');
  });

  it('should throw when client does not exist', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        id: '00000000-0000-4000-8000-000000000099',
      }),
    ).rejects.toBeInstanceOf(ClientNotFoundError);
  });

  it('should throw when client belongs to another store', async () => {
    const created = await create.execute({
      storeId: STORE_ID,
      name: 'Maria Souza',
      phone: '(73) 99876-5432',
    });

    await expect(
      sut.execute({ storeId: OTHER_STORE_ID, id: created.id }),
    ).rejects.toBeInstanceOf(ClientNotFoundError);
  });
});
