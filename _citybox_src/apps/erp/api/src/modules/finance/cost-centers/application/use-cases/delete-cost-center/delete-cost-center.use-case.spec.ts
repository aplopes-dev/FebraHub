import { DeleteCostCenterUseCase } from './delete-cost-center.use-case';
import { CostCenterNotFoundError } from '../../../domain/errors/cost-center-not-found.error';
import { CostCenterNotRemovableError } from '../../../domain/errors/cost-center-not-removable.error';
import {
  COST_CENTER_ID,
  makeCostCenter,
  makeCostCenterRepositories,
  ORGANIZATION_ID,
} from '../../../tests/cost-centers-test-factory';

describe('DeleteCostCenterUseCase', () => {
  function setup() {
    const repos = makeCostCenterRepositories();
    const useCase = new DeleteCostCenterUseCase(repos.costCenterRepository);
    return { ...repos, useCase };
  }

  it('marca o centro de custo como excluído sem apagá-lo', async () => {
    const { useCase, costCenterRepository } = setup();
    await costCenterRepository.save(makeCostCenter());

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: COST_CENTER_ID,
    });

    const stored = await costCenterRepository.findById(
      ORGANIZATION_ID,
      COST_CENTER_ID,
    );
    expect(stored?.deletedAt).toBeInstanceOf(Date);
    expect(
      await costCenterRepository.count(ORGANIZATION_ID, { tab: 'active' }),
    ).toBe(0);
  });

  it('409 ao tentar excluir um centro de custo provisionado pelo sistema', async () => {
    const { useCase, costCenterRepository } = setup();
    await costCenterRepository.save(
      makeCostCenter({ systemKey: 'cc-administrativo', isSystem: true }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: COST_CENTER_ID,
      }),
    ).rejects.toBeInstanceOf(CostCenterNotRemovableError);

    const stored = await costCenterRepository.findById(
      ORGANIZATION_ID,
      COST_CENTER_ID,
    );
    expect(stored?.deletedAt).toBeNull();
  });

  it('404 se o centro de custo não existe', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: COST_CENTER_ID,
      }),
    ).rejects.toBeInstanceOf(CostCenterNotFoundError);
  });
});
