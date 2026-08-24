import { InMemoryClientRepository } from '../../../tests/in-memory-client.repository';
import { InMemoryClientCategoryRepository } from '../../../../client-categories/tests/in-memory-client-category.repository';
import { CreateClientUseCase } from '../create-client/create-client.use-case';
import { DeleteClientUseCase } from './delete-client.use-case';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';
const OTHER_STORE_ID = '019c0000-0000-7000-8000-000000000002';

describe('DeleteClientUseCase', () => {
  let repository: InMemoryClientRepository;
  let categories: InMemoryClientCategoryRepository;
  let create: CreateClientUseCase;
  let sut: DeleteClientUseCase;

  beforeEach(() => {
    repository = new InMemoryClientRepository();
    categories = new InMemoryClientCategoryRepository();
    create = new CreateClientUseCase(repository, categories);
    sut = new DeleteClientUseCase(repository);
  });

  it('should delete an existing client', async () => {
    const created = await create.execute({
      storeId: STORE_ID,
      name: 'Maria Souza',
      phone: '(73) 99876-5432',
    });

    await sut.execute({ storeId: STORE_ID, id: created.id });

    expect(repository.items).toHaveLength(0);
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

    expect(repository.items).toHaveLength(1);
  });
});
