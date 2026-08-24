import { CreateClinicPlanUseCase } from '../create-clinic-plan/create-clinic-plan.use-case';
import { UpdateClinicPlanStatusUseCase } from './update-clinic-plan-status.use-case';
import { InMemoryClinicPlanRepository } from '../../../tests/in-memory-clinic-plan.repository';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('UpdateClinicPlanStatusUseCase', () => {
  it('clears default when inactivating default plan', async () => {
    const repository = new InMemoryClinicPlanRepository();
    const createUseCase = new CreateClinicPlanUseCase(repository);
    const updateStatusUseCase = new UpdateClinicPlanStatusUseCase(repository);

    const created = await createUseCase.execute({
      storeId: STORE_ID,
      name: 'Default',
      status: 'active',
      isDefault: true,
      treatmentInit: 'empty',
      specialties: [],
    });

    const updated = await updateStatusUseCase.execute({
      storeId: STORE_ID,
      id: created.plan.id,
      active: false,
    });

    expect(updated.status).toBe('inactive');
    expect(updated.isDefault).toBe(false);
  });
});
