import { DeletePatientCategoryUseCase } from './delete-patient-category.use-case';
import { InMemoryPatientCategoryRepository } from '../../../tests/in-memory-patient-category.repository';
import { PatientCategoryIsProtectedError } from '../../../domain/errors/patient-category-is-protected.error';
import { PatientCategoryHasPatientsError } from '../../../domain/errors/patient-category-has-patients.error';

describe('DeletePatientCategoryUseCase', () => {
  let useCase: DeletePatientCategoryUseCase;
  let repo: InMemoryPatientCategoryRepository;

  beforeEach(() => {
    repo = new InMemoryPatientCategoryRepository();
    useCase = new DeletePatientCategoryUseCase(repo);
  });

  it('blocks delete of protected category', async () => {
    const category = repo.seed({
      storeId: 'store-1',
      name: 'Particular',
      colorId: '#3b82f6',
      isProtected: true,
    });

    await expect(
      useCase.execute({ storeId: 'store-1', id: category.id }),
    ).rejects.toBeInstanceOf(PatientCategoryIsProtectedError);
  });

  it('blocks delete when patients are linked', async () => {
    const category = repo.seed({
      storeId: 'store-1',
      name: 'Convênio',
      colorId: '#22c55e',
      isProtected: false,
    });
    repo.seedPatientLink('store-1', category.id);

    await expect(
      useCase.execute({ storeId: 'store-1', id: category.id }),
    ).rejects.toBeInstanceOf(PatientCategoryHasPatientsError);
  });

  it('deletes unprotected category without patients', async () => {
    const category = repo.seed({
      storeId: 'store-1',
      name: 'VIP',
      colorId: '#a855f7',
      isProtected: false,
    });

    await useCase.execute({ storeId: 'store-1', id: category.id });
    expect(await repo.findById('store-1', category.id)).toBeNull();
  });
});
