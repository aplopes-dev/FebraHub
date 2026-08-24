import { UpdateBranchUseCase } from './update-branch.use-case';
import { BranchNotFoundError } from '../../../domain/errors/branch-not-found.error';
import { HeadquartersDuplicateError } from '../../../domain/errors/headquarters-duplicate.error';
import {
  BRANCH_ID,
  makeBranch,
  makeCnpj,
  makeRepositories,
  ORGANIZATION_ID,
  OTHER_BRANCH_ID,
} from '../../../tests/tenancy-test-factory';

describe('UpdateBranchUseCase', () => {
  async function setup(isHeadquarters = false) {
    const repos = makeRepositories();
    await repos.branchRepository.save(makeBranch({ isHeadquarters }));
    const useCase = new UpdateBranchUseCase(repos.branchRepository);
    return { ...repos, useCase };
  }

  function baseInput() {
    return {
      organizationId: ORGANIZATION_ID,
      id: BRANCH_ID,
      legalName: 'Comércio Ilhéus Ltda ME',
    };
  }

  it('atualiza razão social e situação da unidade', async () => {
    const { useCase } = await setup();

    const updated = await useCase.execute({ ...baseInput(), active: false });

    expect(updated.legalName).toBe('Comércio Ilhéus Ltda ME');
    expect(updated.active).toBe(false);
    // Identidade fiscal permanece: código e documento não são editáveis.
    expect(updated.code).toBe('001');
  });

  it('rejeita promover a matriz quando outra unidade já é a matriz', async () => {
    const { useCase, branchRepository } = await setup();
    await branchRepository.save(
      makeBranch({
        id: OTHER_BRANCH_ID,
        code: '002',
        document: makeCnpj(2),
        isHeadquarters: true,
      }),
    );

    await expect(
      useCase.execute({ ...baseInput(), isHeadquarters: true }),
    ).rejects.toBeInstanceOf(HeadquartersDuplicateError);
  });

  it('aceita marcar como matriz a unidade que já é a matriz', async () => {
    const { useCase } = await setup(true);

    const updated = await useCase.execute({
      ...baseInput(),
      isHeadquarters: true,
    });

    expect(updated.isHeadquarters).toBe(true);
  });

  it('retorna 404 quando a unidade não existe', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ ...baseInput(), id: OTHER_BRANCH_ID }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });
});
