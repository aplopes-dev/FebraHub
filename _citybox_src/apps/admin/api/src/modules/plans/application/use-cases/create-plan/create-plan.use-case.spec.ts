import { CreatePlanUseCase } from './create-plan.use-case';
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

describe('CreatePlanUseCase', () => {
  it('persists vertical, tier and maxNegocios on the created plan', async () => {
    const repository = new InMemoryPlanRepository();
    const useCase = new CreatePlanUseCase(repository);

    const plan = await useCase.execute(buildDto());

    expect(plan.vertical).toBe('Clínica');
    expect(plan.tier).toBe('prata');
    expect(plan.maxNegocios).toBe(1);
  });

  it('keeps plans from different verticals isolated in the repository', async () => {
    const repository = new InMemoryPlanRepository();
    const useCase = new CreatePlanUseCase(repository);

    await useCase.execute(
      buildDto({
        code: 'comercio-basico',
        vertical: 'Comércio',
        tier: 'basico',
      }),
    );
    await useCase.execute(
      buildDto({
        code: 'clinica-ouro',
        vertical: 'Clínica',
        tier: 'ouro',
        maxNegocios: 3,
      }),
    );

    const comercioPlans = await repository.findAll({ vertical: 'Comércio' });
    const clinicaPlans = await repository.findAll({ vertical: 'Clínica' });

    expect(comercioPlans).toHaveLength(1);
    expect(clinicaPlans).toHaveLength(1);
    expect(clinicaPlans[0].tier).toBe('ouro');
  });
});
