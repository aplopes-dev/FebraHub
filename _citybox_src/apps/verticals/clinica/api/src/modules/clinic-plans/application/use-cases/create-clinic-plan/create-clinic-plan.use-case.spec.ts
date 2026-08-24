import { CreateClinicPlanUseCase } from './create-clinic-plan.use-case';
import { InMemoryClinicPlanRepository } from '../../../tests/in-memory-clinic-plan.repository';
import { NoDefaultPlanError } from '../../../domain/errors/clinic-plan.errors';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('CreateClinicPlanUseCase', () => {
  let repository: InMemoryClinicPlanRepository;
  let useCase: CreateClinicPlanUseCase;

  beforeEach(() => {
    repository = new InMemoryClinicPlanRepository();
    useCase = new CreateClinicPlanUseCase(repository);
  });

  it('assigns next sort order and saves specialties', async () => {
    await useCase.execute({
      storeId: STORE_ID,
      name: 'Plano 1',
      status: 'active',
      isDefault: true,
      treatmentInit: 'empty',
      specialties: [],
    });

    const second = await useCase.execute({
      storeId: STORE_ID,
      name: 'Plano 2',
      status: 'active',
      isDefault: false,
      treatmentInit: 'empty',
      specialties: [
        {
          name: 'Geral',
          treatments: [
            {
              name: 'Consulta',
              valueCents: 20000,
              costCents: 10000,
              enabled: true,
              acceptsFaces: false,
            },
          ],
        },
      ],
    });

    expect(second.plan.sortOrder).toBe(2);
    expect(second.specialties).toHaveLength(1);
    expect(second.treatments).toHaveLength(1);
  });

  it('copies default plan tree when treatmentInit is copy_default', async () => {
    await useCase.execute({
      storeId: STORE_ID,
      name: 'Default',
      status: 'active',
      isDefault: true,
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

    const copied = await useCase.execute({
      storeId: STORE_ID,
      name: 'Copiado',
      status: 'active',
      isDefault: false,
      treatmentInit: 'copy_default',
      specialties: [],
    });

    expect(copied.specialties).toHaveLength(1);
    expect(copied.treatments[0]?.name).toBe('Limpeza');
  });

  it('creates new ids when copy_default sends specialties copied from default plan (ERP preview)', async () => {
    const defaultPlan = await useCase.execute({
      storeId: STORE_ID,
      name: 'Default',
      status: 'active',
      isDefault: true,
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

    const sourceSpecialtyId = defaultPlan.specialties[0].id;
    const sourceTreatmentId = defaultPlan.treatments[0].id;

    const copied = await useCase.execute({
      storeId: STORE_ID,
      name: 'Copiado via ERP',
      status: 'active',
      isDefault: false,
      treatmentInit: 'copy_default',
      specialties: [
        {
          id: sourceSpecialtyId,
          name: 'Odonto',
          treatments: [
            {
              id: sourceTreatmentId,
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

    expect(copied.specialties).toHaveLength(1);
    expect(copied.specialties[0]?.id).not.toBe(sourceSpecialtyId);
    expect(copied.treatments[0]?.id).not.toBe(sourceTreatmentId);
    expect(copied.treatments[0]?.name).toBe('Limpeza');
  });

  it('throws when copy-default has no default plan', async () => {
    await expect(
      useCase.execute({
        storeId: STORE_ID,
        name: 'Sem default',
        status: 'active',
        isDefault: false,
        treatmentInit: 'copy_default',
        specialties: [],
      }),
    ).rejects.toBeInstanceOf(NoDefaultPlanError);
  });

  it('swaps default plan when creating with isDefault true', async () => {
    const first = await useCase.execute({
      storeId: STORE_ID,
      name: 'A',
      status: 'active',
      isDefault: true,
      treatmentInit: 'empty',
      specialties: [],
    });

    const second = await useCase.execute({
      storeId: STORE_ID,
      name: 'B',
      status: 'active',
      isDefault: true,
      treatmentInit: 'empty',
      specialties: [],
    });

    const refreshedFirst = await repository.findById(STORE_ID, first.plan.id);
    expect(refreshedFirst?.isDefault).toBe(false);
    expect(second.plan.isDefault).toBe(true);
  });
});
