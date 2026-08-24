import { CreateClinicPlanUseCase } from '../create-clinic-plan/create-clinic-plan.use-case';
import { UpdateClinicPlanUseCase } from './update-clinic-plan.use-case';
import { InMemoryClinicPlanRepository } from '../../../tests/in-memory-clinic-plan.repository';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('UpdateClinicPlanUseCase', () => {
  let repository: InMemoryClinicPlanRepository;
  let createUseCase: CreateClinicPlanUseCase;
  let updateUseCase: UpdateClinicPlanUseCase;

  beforeEach(() => {
    repository = new InMemoryClinicPlanRepository();
    createUseCase = new CreateClinicPlanUseCase(repository);
    updateUseCase = new UpdateClinicPlanUseCase(repository);
  });

  it('replaces specialties and treatments', async () => {
    const created = await createUseCase.execute({
      storeId: STORE_ID,
      name: 'Plano',
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

    const specialtyId = created.specialties[0].id;

    const updated = await updateUseCase.execute({
      storeId: STORE_ID,
      id: created.plan.id,
      name: 'Plano Atualizado',
      status: 'active',
      isDefault: false,
      specialties: [
        {
          id: specialtyId,
          name: 'Odonto',
          treatments: [
            {
              name: 'Restauração',
              valueCents: 25000,
              costCents: 12000,
              enabled: true,
              acceptsFaces: false,
            },
          ],
        },
      ],
    });

    expect(updated.plan.name).toBe('Plano Atualizado');
    expect(updated.treatments[0]?.name).toBe('Restauração');
  });

  it('swaps default flag on update', async () => {
    const planA = await createUseCase.execute({
      storeId: STORE_ID,
      name: 'A',
      status: 'active',
      isDefault: true,
      treatmentInit: 'empty',
      specialties: [],
    });

    const planB = await createUseCase.execute({
      storeId: STORE_ID,
      name: 'B',
      status: 'active',
      isDefault: false,
      treatmentInit: 'empty',
      specialties: [],
    });

    await updateUseCase.execute({
      storeId: STORE_ID,
      id: planB.plan.id,
      name: 'B',
      status: 'active',
      isDefault: true,
      specialties: [],
    });

    const refreshedA = await repository.findById(STORE_ID, planA.plan.id);
    const refreshedB = await repository.findById(STORE_ID, planB.plan.id);
    expect(refreshedA?.isDefault).toBe(false);
    expect(refreshedB?.isDefault).toBe(true);
    expect(refreshedB?.status).toBe('active');
  });
});
