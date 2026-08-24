import { UpdateMovementCategoryUseCase } from './update-movement-category.use-case';
import { BranchNotFoundError } from '../../../../tenancy/domain/errors/branch-not-found.error';
import {
  BRANCH_ID,
  makeBranch,
  makeCnpj,
  ORGANIZATION_ID,
  OTHER_BRANCH_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { MovementCategoryImmutableFieldError } from '../../../domain/errors/movement-category-immutable-field.error';
import { MovementCategoryNotFoundError } from '../../../domain/errors/movement-category-not-found.error';
import {
  makeMovementCategory,
  makeRepositories,
  MOVEMENT_CATEGORY_ID,
} from '../../../tests/movement-categories-test-factory';

describe('UpdateMovementCategoryUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new UpdateMovementCategoryUseCase(
      repos.movementCategoryRepository,
      repos.branchRepository,
    );
    return { ...repos, useCase };
  }

  function baseInput() {
    return {
      organizationId: ORGANIZATION_ID,
      id: MOVEMENT_CATEGORY_ID,
      name: 'Novo nome',
      type: 'entrada' as const,
      branchIds: [BRANCH_ID],
    };
  }

  it('atualiza nome, type e unidades', async () => {
    const { useCase, movementCategoryRepository, branchRepository } = setup();
    await branchRepository.save(makeBranch());
    await movementCategoryRepository.save(
      makeMovementCategory({ type: 'saida' }),
    );

    const updated = await useCase.execute(baseInput());

    expect(updated.name).toBe('Novo nome');
    expect(updated.type).toBe('entrada');
    expect(updated.code).toBe('CM-010');
    expect(updated.branchIds).toEqual([BRANCH_ID]);
  });

  it('permite editar nome de categoria de sistema sem mudar type', async () => {
    const { useCase, movementCategoryRepository, branchRepository } = setup();
    await branchRepository.save(makeBranch());
    await movementCategoryRepository.save(
      makeMovementCategory({
        isSystem: true,
        systemKey: 'ajuste',
        type: 'saida',
        code: 'CM-001',
      }),
    );

    const updated = await useCase.execute({
      ...baseInput(),
      type: 'saida',
      name: 'Ajustes (renomeado)',
    });

    expect(updated.name).toBe('Ajustes (renomeado)');
    expect(updated.type).toBe('saida');
    expect(updated.isSystem).toBe(true);
  });

  it('bloqueia mudança de type em categoria de sistema', async () => {
    const { useCase, movementCategoryRepository, branchRepository } = setup();
    await branchRepository.save(makeBranch());
    await movementCategoryRepository.save(
      makeMovementCategory({
        isSystem: true,
        systemKey: 'ajuste',
        type: 'saida',
        code: 'CM-001',
      }),
    );

    await expect(
      useCase.execute({ ...baseInput(), type: 'entrada' }),
    ).rejects.toBeInstanceOf(MovementCategoryImmutableFieldError);
  });

  it('rejeita unidade de outra organização', async () => {
    const { useCase, movementCategoryRepository, branchRepository } = setup();
    await movementCategoryRepository.save(makeMovementCategory());
    await branchRepository.save(
      makeBranch({
        id: OTHER_BRANCH_ID,
        organizationId: OTHER_ORGANIZATION_ID,
        document: makeCnpj(20),
      }),
    );

    await expect(
      useCase.execute({ ...baseInput(), branchIds: [OTHER_BRANCH_ID] }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });

  it('responde 404 para inexistente', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(makeBranch());

    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      MovementCategoryNotFoundError,
    );
  });
});
