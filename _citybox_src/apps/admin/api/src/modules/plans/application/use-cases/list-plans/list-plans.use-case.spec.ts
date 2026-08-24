import { ListPlansUseCase } from './list-plans.use-case';
import { CreatePlanUseCase } from '../create-plan/create-plan.use-case';
import { InMemoryPlanRepository } from '../../../tests/in-memory-plan.repository';
import type { CreatePlanDto } from '../../dtos/plan.dto';

function buildDto(overrides: Partial<CreatePlanDto> = {}): CreatePlanDto {
  return {
    code: 'clinica-prata',
    name: 'Clínica Prata',
    description: 'Plano de entrada para a vertical Clínica',
    prices: [{ cycle: 'MONTHLY', priceCents: 19900 }],
    vertical: 'Clínica',
    tier: 'prata',
    maxNegocios: 1,
    maxUsers: 5,
    ...overrides,
  };
}

describe('ListPlansUseCase', () => {
  it('filters plans by vertical', async () => {
    const repository = new InMemoryPlanRepository();
    const createPlan = new CreatePlanUseCase(repository);
    const listPlans = new ListPlansUseCase(repository);

    await createPlan.execute(
      buildDto({
        code: 'comercio-basico',
        vertical: 'Comércio',
        tier: 'basico',
      }),
    );
    await createPlan.execute(
      buildDto({ code: 'clinica-prata', vertical: 'Clínica', tier: 'prata' }),
    );
    await createPlan.execute(
      buildDto({
        code: 'clinica-ouro',
        vertical: 'Clínica',
        tier: 'ouro',
        maxNegocios: 3,
      }),
    );

    const result = await listPlans.execute({ vertical: 'Clínica' });

    expect(result.total).toBe(2);
    expect(result.plans.map(({ plan }) => plan.tier).sort()).toEqual([
      'ouro',
      'prata',
    ]);
  });

  it('returns every plan when no vertical filter is given', async () => {
    const repository = new InMemoryPlanRepository();
    const createPlan = new CreatePlanUseCase(repository);
    const listPlans = new ListPlansUseCase(repository);

    await createPlan.execute(
      buildDto({
        code: 'comercio-basico',
        vertical: 'Comércio',
        tier: 'basico',
      }),
    );
    await createPlan.execute(buildDto({ code: 'clinica-prata' }));

    const result = await listPlans.execute({});

    expect(result.total).toBe(2);
  });
});
