import { InMemoryAppointmentCategoryRepository } from '../../../tests/in-memory-appointment-category.repository';
import { AppointmentCategoryDuplicateError } from '../../../domain/errors/appointment-category-duplicate.error';
import { CreateAppointmentCategoryUseCase } from './create-appointment-category.use-case';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';
const OTHER_STORE_ID = '019c0000-0000-7000-8000-000000000002';

describe('CreateAppointmentCategoryUseCase', () => {
  let repository: InMemoryAppointmentCategoryRepository;
  let sut: CreateAppointmentCategoryUseCase;

  beforeEach(() => {
    repository = new InMemoryAppointmentCategoryRepository();
    sut = new CreateAppointmentCategoryUseCase(repository);
  });

  it('should create a category for the store', async () => {
    const result = await sut.execute({
      storeId: STORE_ID,
      name: 'Retorno',
      color: '#10b981',
    });

    expect(result.id).toBeDefined();
    expect(result.storeId).toBe(STORE_ID);
    expect(result.name).toBe('Retorno');
    expect(result.color).toBe('#10b981');
    expect(repository.items.size).toBe(1);
  });

  it('should reject duplicate name in the same store', async () => {
    await sut.execute({ storeId: STORE_ID, name: 'Retorno' });

    await expect(
      sut.execute({ storeId: STORE_ID, name: 'Retorno' }),
    ).rejects.toBeInstanceOf(AppointmentCategoryDuplicateError);
  });

  it('should allow the same name in another store', async () => {
    await sut.execute({ storeId: STORE_ID, name: 'Retorno' });

    const other = await sut.execute({
      storeId: OTHER_STORE_ID,
      name: 'Retorno',
    });

    expect(other.storeId).toBe(OTHER_STORE_ID);
    expect(repository.items.size).toBe(2);
  });
});
