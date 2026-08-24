import { InMemoryClientRepository } from '../../../tests/in-memory-client.repository';
import { InMemoryClientCategoryRepository } from '../../../../client-categories/tests/in-memory-client-category.repository';
import { CreateClientUseCase } from '../create-client/create-client.use-case';
import { UpdateClientUseCase } from './update-client.use-case';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';
const OTHER_STORE_ID = '019c0000-0000-7000-8000-000000000002';

describe('UpdateClientUseCase', () => {
  let repository: InMemoryClientRepository;
  let categories: InMemoryClientCategoryRepository;
  let create: CreateClientUseCase;
  let sut: UpdateClientUseCase;

  beforeEach(() => {
    repository = new InMemoryClientRepository();
    categories = new InMemoryClientCategoryRepository();
    create = new CreateClientUseCase(repository, categories);
    sut = new UpdateClientUseCase(repository, categories);
  });

  it('should update client name and phone', async () => {
    const created = await create.execute({
      storeId: STORE_ID,
      name: 'Maria Souza',
      phone: '(73) 99876-5432',
    });

    const result = await sut.execute({
      storeId: STORE_ID,
      id: created.id,
      name: 'Maria S. Oliveira',
      phone: '(73) 99111-0000',
    });

    expect(result.name).toBe('Maria S. Oliveira');
    expect(result.phone).toBe('(73) 99111-0000');
  });

  it('should throw when client does not exist', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        id: '00000000-0000-4000-8000-000000000099',
        name: 'Qualquer',
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
      sut.execute({
        storeId: OTHER_STORE_ID,
        id: created.id,
        name: 'Hack',
      }),
    ).rejects.toBeInstanceOf(ClientNotFoundError);
  });
});
