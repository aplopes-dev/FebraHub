import { CreateClinicPlanUseCase } from '../create-clinic-plan/create-clinic-plan.use-case';
import { DeleteClinicPlanUseCase } from './delete-clinic-plan.use-case';
import { InMemoryClinicPlanRepository } from '../../../tests/in-memory-clinic-plan.repository';
import { CannotDeleteDefaultPlanError } from '../../../domain/errors/clinic-plan.errors';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('DeleteClinicPlanUseCase', () => {
  let repository: InMemoryClinicPlanRepository;
  let createUseCase: CreateClinicPlanUseCase;
  let deleteUseCase: DeleteClinicPlanUseCase;

  beforeEach(() => {
    repository = new InMemoryClinicPlanRepository();
    createUseCase = new CreateClinicPlanUseCase(repository);
    deleteUseCase = new DeleteClinicPlanUseCase(repository);
  });

  it('deletes non-default plan', async () => {
    const created = await createUseCase.execute({
      storeId: STORE_ID,
      name: 'Temporário',
      status: 'active',
      isDefault: false,
      treatmentInit: 'empty',
      specialties: [],
    });

    await deleteUseCase.execute({ storeId: STORE_ID, id: created.plan.id });
    expect(await repository.findById(STORE_ID, created.plan.id)).toBeNull();
  });

  it('blocks deleting default plan', async () => {
    const created = await createUseCase.execute({
      storeId: STORE_ID,
      name: 'Default',
      status: 'active',
      isDefault: true,
      treatmentInit: 'empty',
      specialties: [],
    });

    await expect(
      deleteUseCase.execute({ storeId: STORE_ID, id: created.plan.id }),
    ).rejects.toBeInstanceOf(CannotDeleteDefaultPlanError);
  });
});
