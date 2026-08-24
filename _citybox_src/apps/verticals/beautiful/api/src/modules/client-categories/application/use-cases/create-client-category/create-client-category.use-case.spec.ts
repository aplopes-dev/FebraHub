import { InMemoryClientCategoryRepository } from '../../../tests/in-memory-client-category.repository';
import { ClientCategoryDuplicateError } from '../../../domain/errors/client-category-duplicate.error';
import { CreateClientCategoryUseCase } from './create-client-category.use-case';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';
const OTHER_STORE_ID = '019c0000-0000-7000-8000-000000000002';

describe('CreateClientCategoryUseCase', () => {
  let repository: InMemoryClientCategoryRepository;
  let sut: CreateClientCategoryUseCase;

  beforeEach(() => {
    repository = new InMemoryClientCategoryRepository();
    sut = new CreateClientCategoryUseCase(repository);
  });

  it('should create a category', async () => {
    const result = await sut.execute({ storeId: STORE_ID, name: '  VIP  ' });

    expect(result.name).toBe('VIP');
    expect(result.storeId).toBe(STORE_ID);
    expect(result.colorId).toBe('#3b82f6');
    expect(result.isProtected).toBe(false);
    expect(repository.items).toHaveLength(1);
  });

  it('should create a category with custom color', async () => {
    const result = await sut.execute({
      storeId: STORE_ID,
      name: 'Premium',
      colorId: '#8b5cf6',
    });

    expect(result.colorId).toBe('#8b5cf6');
  });

  it('should reject duplicate names in the same store', async () => {
    await sut.execute({ storeId: STORE_ID, name: 'VIP' });

    await expect(
      sut.execute({ storeId: STORE_ID, name: 'VIP' }),
    ).rejects.toBeInstanceOf(ClientCategoryDuplicateError);
  });

  it('should allow the same name in another store', async () => {
    await sut.execute({ storeId: STORE_ID, name: 'VIP' });
    const other = await sut.execute({ storeId: OTHER_STORE_ID, name: 'VIP' });

    expect(other.storeId).toBe(OTHER_STORE_ID);
    expect(repository.items).toHaveLength(2);
  });
});
