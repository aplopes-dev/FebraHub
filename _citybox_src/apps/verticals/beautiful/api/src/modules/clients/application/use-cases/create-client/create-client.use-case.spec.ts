import { InMemoryClientRepository } from '../../../tests/in-memory-client.repository';
import { InMemoryClientCategoryRepository } from '../../../../client-categories/tests/in-memory-client-category.repository';
import { CreateClientUseCase } from './create-client.use-case';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';

describe('CreateClientUseCase', () => {
  let repository: InMemoryClientRepository;
  let categories: InMemoryClientCategoryRepository;
  let sut: CreateClientUseCase;

  beforeEach(() => {
    repository = new InMemoryClientRepository();
    categories = new InMemoryClientCategoryRepository();
    sut = new CreateClientUseCase(repository, categories);
  });

  it('should create a new client successfully', async () => {
    const result = await sut.execute({
      storeId: STORE_ID,
      name: 'Maria Souza',
      phone: '(73) 99876-5432',
    });

    expect(result.id).toBeDefined();
    expect(result.storeId).toBe(STORE_ID);
    expect(result.name).toBe('Maria Souza');
    expect(result.phone).toBe('(73) 99876-5432');
    expect(repository.items).toHaveLength(1);
  });

  it('should allow duplicate phone numbers', async () => {
    await sut.execute({
      storeId: STORE_ID,
      name: 'Maria Souza',
      phone: '(73) 99876-5432',
    });
    await sut.execute({
      storeId: STORE_ID,
      name: 'João Souza',
      phone: '(73) 99876-5432',
    });

    expect(repository.items).toHaveLength(2);
  });

  it('should reject invalid name', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        name: 'M',
        phone: '(73) 99876-5432',
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('should reject invalid phone', async () => {
    await expect(
      sut.execute({
        storeId: STORE_ID,
        name: 'Maria Souza',
        phone: '123',
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });
});
