import { GetClinicPlanByIdUseCase } from './get-clinic-plan-by-id.use-case';
import { CreateClinicPlanUseCase } from '../create-clinic-plan/create-clinic-plan.use-case';
import { InMemoryClinicPlanRepository } from '../../../tests/in-memory-clinic-plan.repository';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('GetClinicPlanByIdUseCase', () => {
  it('returns aggregate with nested specialties and treatments', async () => {
    const repository = new InMemoryClinicPlanRepository();
    const createUseCase = new CreateClinicPlanUseCase(repository);
    const getUseCase = new GetClinicPlanByIdUseCase(repository);

    const created = await createUseCase.execute({
      storeId: STORE_ID,
      name: 'Particular',
      status: 'active',
      isDefault: false,
      treatmentInit: 'empty',
      specialties: [
        {
          name: 'Odonto',
          treatments: [
            {
              name: 'Limpeza',
              valueCents: 15000,
              costCents: 8000,
              enabled: true,
              acceptsFaces: false,
            },
          ],
        },
      ],
    });

    const aggregate = await getUseCase.execute({
      storeId: STORE_ID,
      id: created.plan.id,
    });
    expect(aggregate.specialties).toHaveLength(1);
    expect(aggregate.treatments).toHaveLength(1);
    expect(aggregate.treatments[0]?.name).toBe('Limpeza');
  });
});
