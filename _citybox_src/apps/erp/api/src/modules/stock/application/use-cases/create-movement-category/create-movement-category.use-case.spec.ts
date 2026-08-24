import { CreateMovementCategoryUseCase } from './create-movement-category.use-case';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { BranchNotFoundError } from '../../../../tenancy/domain/errors/branch-not-found.error';
import {
  BRANCH_ID,
  makeBranch,
  makeCnpj,
  ORGANIZATION_ID,
  OTHER_BRANCH_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import {
  makeMovementCategory,
  makeRepositories,
} from '../../../tests/movement-categories-test-factory';

describe('CreateMovementCategoryUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new CreateMovementCategoryUseCase(
      repos.movementCategoryRepository,
      repos.branchRepository,
    );
    return { ...repos, useCase };
  }

  function baseInput() {
    return {
      organizationId: ORGANIZATION_ID,
      name: '  Ajuste manual  ',
      type: 'saida' as const,
      branchIds: [BRANCH_ID],
    };
  }

  it('cria categoria com código CM-001, nome aparado e isSystem=false', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(makeBranch());

    const category = await useCase.execute(baseInput());

    expect(category.code).toBe('CM-001');
    expect(category.name).toBe('Ajuste manual');
    expect(category.type).toBe('saida');
    expect(category.isSystem).toBe(false);
    expect(category.systemKey).toBeNull();
    expect(category.branchIds).toEqual([BRANCH_ID]);
  });

  it('incrementa o código a partir do maior existente', async () => {
    const { useCase, branchRepository, movementCategoryRepository } = setup();
    await branchRepository.save(makeBranch());
    await movementCategoryRepository.save(
      makeMovementCategory({ code: 'CM-008' }),
    );

    const category = await useCase.execute(baseInput());

    expect(category.code).toBe('CM-009');
  });

  it('deduplica branchIds', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(makeBranch());

    const category = await useCase.execute({
      ...baseInput(),
      branchIds: [BRANCH_ID, BRANCH_ID],
    });

    expect(category.branchIds).toEqual([BRANCH_ID]);
  });

  it('rejeita nome vazio', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(makeBranch());

    await expect(
      useCase.execute({ ...baseInput(), name: '   ' }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejeita sem unidades', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ ...baseInput(), branchIds: [] }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejeita unidade de outra organização', async () => {
    const { useCase, branchRepository } = setup();
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
});
