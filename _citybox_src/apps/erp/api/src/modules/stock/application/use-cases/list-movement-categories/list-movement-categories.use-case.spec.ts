import { ListMovementCategoriesUseCase } from './list-movement-categories.use-case';
import {
  BRANCH_ID,
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import {
  makeMovementCategory,
  makeRepositories,
  MOVEMENT_CATEGORY_ID,
  OTHER_MOVEMENT_CATEGORY_ID,
} from '../../../tests/movement-categories-test-factory';

describe('ListMovementCategoriesUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    const useCase = new ListMovementCategoriesUseCase(
      repos.movementCategoryRepository,
    );

    await repos.movementCategoryRepository.save(
      makeMovementCategory({
        id: MOVEMENT_CATEGORY_ID,
        code: 'CM-001',
        name: 'Ajustes de Estoque',
        type: 'saida',
        branchIds: [BRANCH_ID],
      }),
    );
    await repos.movementCategoryRepository.save(
      makeMovementCategory({
        id: OTHER_MOVEMENT_CATEGORY_ID,
        code: 'CM-004',
        name: 'Entrada avulsa',
        type: 'entrada',
        branchIds: [BRANCH_ID],
      }),
    );

    return { ...repos, useCase };
  }

  it('lista ordenado por código', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.items.map((c) => c.code)).toEqual(['CM-001', 'CM-004']);
    expect(result.total).toBe(2);
  });

  it('filtra por type', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      type: 'entrada',
    });

    expect(result.items.map((c) => c.code)).toEqual(['CM-004']);
    expect(result.total).toBe(1);
  });

  it('filtra pela busca (nome ou código)', async () => {
    const { useCase } = await setup();

    const byName = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'avulsa',
    });
    expect(byName.items.map((c) => c.code)).toEqual(['CM-004']);

    const byCode = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'cm-001',
    });
    expect(byCode.items.map((c) => c.code)).toEqual(['CM-001']);
  });

  it('não devolve categoria de outra organização', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: OTHER_ORGANIZATION_ID,
    });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
