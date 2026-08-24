import { CreatePatientCategoryUseCase } from './create-patient-category.use-case';
import { InMemoryPatientCategoryRepository } from '../../../tests/in-memory-patient-category.repository';
import { PatientCategoryNameTakenError } from '../../../domain/errors/patient-category-name-taken.error';

describe('CreatePatientCategoryUseCase', () => {
  let useCase: CreatePatientCategoryUseCase;
  let repo: InMemoryPatientCategoryRepository;

  beforeEach(() => {
    repo = new InMemoryPatientCategoryRepository();
    useCase = new CreatePatientCategoryUseCase(repo);
  });

  it('creates a category', async () => {
    const category = await useCase.execute({
      storeId: 'store-1',
      name: 'Convênio',
      colorId: '#22c55e',
    });

    expect(category.name).toBe('Convênio');
    expect(category.colorId).toBe('#22c55e');
    expect(category.isProtected).toBe(false);
  });

  it('rejects duplicate name in same store', async () => {
    await useCase.execute({
      storeId: 'store-1',
      name: 'VIP',
      colorId: '#a855f7',
    });

    await expect(
      useCase.execute({
        storeId: 'store-1',
        name: 'vip',
        colorId: '#3b82f6',
      }),
    ).rejects.toBeInstanceOf(PatientCategoryNameTakenError);
  });
});
