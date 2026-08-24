import { ListClinicPlansUseCase } from './list-clinic-plans.use-case';
import { InMemoryClinicPlanRepository } from '../../../tests/in-memory-clinic-plan.repository';
import { ClinicPlan } from '../../../domain/entities/clinic-plan.entity';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('ListClinicPlansUseCase', () => {
  it('returns plans ordered by sortOrder', async () => {
    const repository = new InMemoryClinicPlanRepository();
    const useCase = new ListClinicPlansUseCase(repository);

    const second = ClinicPlan.create({
      storeId: STORE_ID,
      name: 'B',
      sortOrder: 2,
    });
    const first = ClinicPlan.create({
      storeId: STORE_ID,
      name: 'A',
      sortOrder: 1,
    });
    await repository.saveAggregate({
      plan: second,
      specialties: [],
      treatments: [],
    });
    await repository.saveAggregate({
      plan: first,
      specialties: [],
      treatments: [],
    });

    const plans = await useCase.execute({ storeId: STORE_ID });
    expect(plans.map((plan) => plan.name)).toEqual(['A', 'B']);
  });
});
