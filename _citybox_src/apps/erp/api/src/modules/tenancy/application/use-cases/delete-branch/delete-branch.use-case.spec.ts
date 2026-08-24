import { DeleteBranchUseCase } from './delete-branch.use-case';
import { BranchNotFoundError } from '../../../domain/errors/branch-not-found.error';
import {
  BRANCH_ID,
  makeBranch,
  makeRepositories,
  ORGANIZATION_ID,
  OTHER_BRANCH_ID,
} from '../../../tests/tenancy-test-factory';

describe('DeleteBranchUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.branchRepository.save(makeBranch());
    const useCase = new DeleteBranchUseCase(repos.branchRepository);
    return { ...repos, useCase };
  }

  it('desativa a unidade sem apagar o registro', async () => {
    const { useCase, branchRepository } = await setup();

    await useCase.execute({ organizationId: ORGANIZATION_ID, id: BRANCH_ID });

    const branch = await branchRepository.findById(ORGANIZATION_ID, BRANCH_ID);
    expect(branch).not.toBeNull();
    expect(branch?.deletedAt).toBeInstanceOf(Date);
    expect(branch?.active).toBe(false);
  });

  it('retorna 404 quando a unidade não existe', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: OTHER_BRANCH_ID,
      }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });
});
