import { UpdatePatientCategoryUseCase } from './update-patient-category.use-case';
import { ListPatientCategoriesUseCase } from '../list-patient-categories/list-patient-categories.use-case';
import { InMemoryPatientCategoryRepository } from '../../../tests/in-memory-patient-category.repository';
import { PatientCategoryNameTakenError } from '../../../domain/errors/patient-category-name-taken.error';
import { PatientCategoryNotFoundError } from '../../../domain/errors/patient-category-not-found.error';

describe('UpdatePatientCategoryUseCase', () => {
  let useCase: UpdatePatientCategoryUseCase;
  let listUseCase: ListPatientCategoriesUseCase;
  let repo: InMemoryPatientCategoryRepository;

  beforeEach(() => {
    repo = new InMemoryPatientCategoryRepository();
    useCase = new UpdatePatientCategoryUseCase(repo);
    listUseCase = new ListPatientCategoriesUseCase(repo);
  });

  it('updates name and color of protected category', async () => {
    const category = repo.seed({
      storeId: 'store-1',
      name: 'Particular',
      colorId: '#3b82f6',
      isProtected: true,
    });

    const updated = await useCase.execute({
      storeId: 'store-1',
      id: category.id,
      name: 'Particular Atualizado',
      colorId: '#22c55e',
    });

    expect(updated.name).toBe('Particular Atualizado');
    expect(updated.colorId).toBe('#22c55e');
    expect(updated.isProtected).toBe(true);
  });

  it('rejects duplicate name in same store', async () => {
    repo.seed({
      storeId: 'store-1',
      name: 'VIP',
      colorId: '#a855f7',
      isProtected: false,
    });
    const category = repo.seed({
      storeId: 'store-1',
      name: 'Convênio',
      colorId: '#22c55e',
      isProtected: false,
    });

    await expect(
      useCase.execute({
        storeId: 'store-1',
        id: category.id,
        name: 'VIP',
        colorId: '#f97316',
      }),
    ).rejects.toBeInstanceOf(PatientCategoryNameTakenError);
  });

  it('throws NotFound for wrong store', async () => {
    const category = repo.seed({
      storeId: 'store-1',
      name: 'VIP',
      colorId: '#a855f7',
      isProtected: false,
    });

    await expect(
      useCase.execute({
        storeId: 'store-2',
        id: category.id,
        name: 'Novo',
        colorId: '#ef4444',
      }),
    ).rejects.toBeInstanceOf(PatientCategoryNotFoundError);
  });

  it('lists categories for store', async () => {
    repo.seed({
      storeId: 'store-1',
      name: 'Particular',
      colorId: '#3b82f6',
      isProtected: true,
    });
    repo.seed({
      storeId: 'store-1',
      name: 'VIP',
      colorId: '#a855f7',
      isProtected: false,
    });

    const categories = await listUseCase.execute({ storeId: 'store-1' });
    expect(categories).toHaveLength(2);
  });
});
