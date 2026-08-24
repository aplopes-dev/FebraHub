import { CreateCostCenterUseCase } from './create-cost-center.use-case';
import { CostCenterNameTakenError } from '../../../domain/errors/cost-center-name-taken.error';
import {
  makeCostCenter,
  makeCostCenterRepositories,
  ORGANIZATION_ID,
} from '../../../tests/cost-centers-test-factory';

describe('CreateCostCenterUseCase', () => {
  function setup() {
    const repos = makeCostCenterRepositories();
    const useCase = new CreateCostCenterUseCase(repos.costCenterRepository);
    return { ...repos, useCase };
  }

  it('cria o centro de custo com o nome aparado', async () => {
    const { useCase } = setup();

    const costCenter = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      name: '  Administrativo  ',
    });

    expect(costCenter.name).toBe('Administrativo');
    expect(costCenter.deletedAt).toBeNull();
  });

  it('rejeita nome já usado na organização', async () => {
    const { useCase, costCenterRepository } = setup();
    await costCenterRepository.save(makeCostCenter({ name: 'Comercial' }));

    await expect(
      useCase.execute({ organizationId: ORGANIZATION_ID, name: 'comercial' }),
    ).rejects.toBeInstanceOf(CostCenterNameTakenError);
  });
});
