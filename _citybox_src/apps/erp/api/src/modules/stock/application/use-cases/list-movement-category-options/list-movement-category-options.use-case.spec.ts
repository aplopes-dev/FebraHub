import { ListMovementCategoryOptionsUseCase } from './list-movement-category-options.use-case';
import {
  BRANCH_ID,
  ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import {
  makeMovementCategory,
  makeRepositories,
  MOVEMENT_CATEGORY_ID,
  OTHER_MOVEMENT_CATEGORY_ID,
} from '../../../tests/movement-categories-test-factory';

describe('ListMovementCategoryOptionsUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    const useCase = new ListMovementCategoryOptionsUseCase(
      repos.movementCategoryRepository,
    );

    await repos.movementCategoryRepository.save(
      makeMovementCategory({
        id: MOVEMENT_CATEGORY_ID,
        code: 'CM-001',
        name: 'Zeta saída',
        type: 'saida',
        branchIds: [BRANCH_ID],
      }),
    );
    await repos.movementCategoryRepository.save(
      makeMovementCategory({
        id: OTHER_MOVEMENT_CATEGORY_ID,
        code: 'CM-004',
        name: 'Alpha entrada',
        type: 'entrada',
        branchIds: [BRANCH_ID],
      }),
    );

    return { useCase };
  }

  it('retorna options ordenadas por nome', async () => {
    const { useCase } = await setup();

    const options = await useCase.execute({
      organizationId: ORGANIZATION_ID,
    });

    expect(options.map((o) => o.name)).toEqual(['Alpha entrada', 'Zeta saída']);
    expect(options[0]).toEqual({
      id: OTHER_MOVEMENT_CATEGORY_ID,
      name: 'Alpha entrada',
      type: 'entrada',
    });
  });

  it('filtra por type', async () => {
    const { useCase } = await setup();

    const options = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      type: 'saida',
    });

    expect(options).toEqual([
      {
        id: MOVEMENT_CATEGORY_ID,
        name: 'Zeta saída',
        type: 'saida',
      },
    ]);
  });
});
