import { ClinicPlan } from '../../domain/entities/clinic-plan.entity';
import { InMemoryClinicPlanRepository } from '../../tests/in-memory-clinic-plan.repository';
import { applyDefaultPlanFlag } from './apply-default-plan-flag';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('applyDefaultPlanFlag', () => {
  let repository: InMemoryClinicPlanRepository;

  beforeEach(() => {
    repository = new InMemoryClinicPlanRepository();
  });

  it('moves default flag to target plan and keeps it active', async () => {
    const planA = ClinicPlan.create({
      storeId: STORE_ID,
      name: 'Plano A',
      sortOrder: 1,
      isDefault: true,
      status: 'active',
    });
    const planB = ClinicPlan.create({
      storeId: STORE_ID,
      name: 'Plano B',
      sortOrder: 2,
      status: 'inactive',
    });

    await repository.saveAggregate({
      plan: planA,
      specialties: [],
      treatments: [],
    });
    await repository.saveAggregate({
      plan: planB,
      specialties: [],
      treatments: [],
    });

    await applyDefaultPlanFlag(repository, STORE_ID, planB.id, 'test');

    const updatedA = await repository.findById(STORE_ID, planA.id);
    const updatedB = await repository.findById(STORE_ID, planB.id);

    expect(updatedA?.isDefault).toBe(false);
    expect(updatedB?.isDefault).toBe(true);
    expect(updatedB?.status).toBe('active');
  });
});
