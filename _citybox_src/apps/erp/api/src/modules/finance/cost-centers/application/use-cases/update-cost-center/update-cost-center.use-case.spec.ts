import { UpdateCostCenterUseCase } from './update-cost-center.use-case';
import { CostCenterNameTakenError } from '../../../domain/errors/cost-center-name-taken.error';
import { CostCenterNotFoundError } from '../../../domain/errors/cost-center-not-found.error';
import {
  COST_CENTER_ID,
  makeCostCenter,
  makeCostCenterRepositories,
  ORGANIZATION_ID,
  OTHER_COST_CENTER_ID,
} from '../../../tests/cost-centers-test-factory';

describe('UpdateCostCenterUseCase', () => {
  function setup() {
    const repos = makeCostCenterRepositories();
    const useCase = new UpdateCostCenterUseCase(repos.costCenterRepository);
    return { ...repos, useCase };
  }

  it('atualiza o nome do centro de custo', async () => {
    const { useCase, costCenterRepository } = setup();
    await costCenterRepository.save(makeCostCenter({ name: 'Administrativo' }));

    const costCenter = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: COST_CENTER_ID,
      name: '  Financeiro  ',
    });

    expect(costCenter.name).toBe('Financeiro');
  });

  it('rejeita nome já usado por outro centro de custo', async () => {
    const { useCase, costCenterRepository } = setup();
    await costCenterRepository.save(makeCostCenter({ name: 'Administrativo' }));
    await costCenterRepository.save(
      makeCostCenter({ id: OTHER_COST_CENTER_ID, name: 'Comercial' }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: COST_CENTER_ID,
        name: 'comercial',
      }),
    ).rejects.toBeInstanceOf(CostCenterNameTakenError);
  });

  it('404 se o centro de custo não existe', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: COST_CENTER_ID,
        name: 'Financeiro',
      }),
    ).rejects.toBeInstanceOf(CostCenterNotFoundError);
  });
});
