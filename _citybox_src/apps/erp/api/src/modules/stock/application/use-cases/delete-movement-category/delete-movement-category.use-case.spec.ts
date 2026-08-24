import { DeleteMovementCategoryUseCase } from './delete-movement-category.use-case';
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { MovementCategoryNotFoundError } from '../../../domain/errors/movement-category-not-found.error';
import { MovementCategoryNotRemovableError } from '../../../domain/errors/movement-category-not-removable.error';
import {
  makeMovementCategory,
  makeRepositories,
  MOVEMENT_CATEGORY_ID,
} from '../../../tests/movement-categories-test-factory';

describe('DeleteMovementCategoryUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new DeleteMovementCategoryUseCase(
      repos.movementCategoryRepository,
    );
    return { ...repos, useCase };
  }

  it('remove categoria de usuário', async () => {
    const { useCase, movementCategoryRepository } = setup();
    await movementCategoryRepository.save(makeMovementCategory());

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: MOVEMENT_CATEGORY_ID,
    });

    const stored = await movementCategoryRepository.findById(
      ORGANIZATION_ID,
      MOVEMENT_CATEGORY_ID,
    );
    expect(stored).toBeNull();
  });

  it('bloqueia exclusão de categoria de sistema', async () => {
    const { useCase, movementCategoryRepository } = setup();
    await movementCategoryRepository.save(
      makeMovementCategory({
        isSystem: true,
        systemKey: 'ajuste',
        code: 'CM-001',
      }),
    );

    const error = await useCase
      .execute({ organizationId: ORGANIZATION_ID, id: MOVEMENT_CATEGORY_ID })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(MovementCategoryNotRemovableError);
    expect(
      (error as MovementCategoryNotRemovableError).externalMessage,
    ).toMatch(/sistema/i);

    const stored = await movementCategoryRepository.findById(
      ORGANIZATION_ID,
      MOVEMENT_CATEGORY_ID,
    );
    expect(stored).not.toBeNull();
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

  it('bloqueia exclusão de categoria já usada em movimentação', async () => {
    // StockMovement.category é onDelete: Restrict — sem a checagem o delete
    // estourava FK (P2003) e escapava como 500, apesar da rota documentar 409.
    const { useCase, movementCategoryRepository } = setup();
    await movementCategoryRepository.save(
      makeMovementCategory({ isSystem: false }),
    );
    movementCategoryRepository.inUseIds.add(MOVEMENT_CATEGORY_ID);

    const error = await useCase
      .execute({ organizationId: ORGANIZATION_ID, id: MOVEMENT_CATEGORY_ID })
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(MovementCategoryNotRemovableError);
    expect(
      (error as MovementCategoryNotRemovableError).externalMessage,
    ).toMatch(/já foi usada em movimentações/);
    expect(movementCategoryRepository.categories.has(MOVEMENT_CATEGORY_ID)).toBe(
      true,
    );
  });

  it('permite excluir categoria de usuário nunca usada', async () => {
    const { useCase, movementCategoryRepository } = setup();
    await movementCategoryRepository.save(
      makeMovementCategory({ isSystem: false }),
    );

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: MOVEMENT_CATEGORY_ID,
    });

    expect(movementCategoryRepository.categories.has(MOVEMENT_CATEGORY_ID)).toBe(
      false,
    );
  });
});
