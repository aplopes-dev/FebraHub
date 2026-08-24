import { FindMovementCategoryByIdUseCase } from './find-movement-category-by-id.use-case';
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { MovementCategoryNotFoundError } from '../../../domain/errors/movement-category-not-found.error';
import {
  makeMovementCategory,
  makeRepositories,
  MOVEMENT_CATEGORY_ID,
} from '../../../tests/movement-categories-test-factory';

describe('FindMovementCategoryByIdUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new FindMovementCategoryByIdUseCase(
      repos.movementCategoryRepository,
    );
    return { ...repos, useCase };
  }

  it('retorna a categoria', async () => {
    const { useCase, movementCategoryRepository } = setup();
    await movementCategoryRepository.save(makeMovementCategory());

    const category = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: MOVEMENT_CATEGORY_ID,
    });

    expect(category.id).toBe(MOVEMENT_CATEGORY_ID);
    expect(category.name).toBe('Categoria teste');
  });

  it('responde 404 para inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: MOVEMENT_CATEGORY_ID,
      }),
    ).rejects.toBeInstanceOf(MovementCategoryNotFoundError);
  });

  it('responde 404 para outra organização', async () => {
    const { useCase, movementCategoryRepository } = setup();
    await movementCategoryRepository.save(makeMovementCategory());

    await expect(
      useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        id: MOVEMENT_CATEGORY_ID,
      }),
    ).rejects.toBeInstanceOf(MovementCategoryNotFoundError);
  });
});
