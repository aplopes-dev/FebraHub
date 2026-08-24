import { FindBranchByIdUseCase } from './find-branch-by-id.use-case';
import { BranchNotFoundError } from '../../../domain/errors/branch-not-found.error';
import {
  BRANCH_ID,
  makeBranch,
  makeCnpj,
  makeRepositories,
  ORGANIZATION_ID,
  OTHER_BRANCH_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tests/tenancy-test-factory';

describe('FindBranchByIdUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    const branch = await repos.branchRepository.save(makeBranch());
    const outra = await repos.branchRepository.save(
      // Id explícito: `makeBranch` reutiliza `BRANCH_ID` por padrão, e as duas
      // unidades precisam ser distintas para o recorte significar algo.
      makeBranch({ id: OTHER_BRANCH_ID, code: '002', document: makeCnpj(5) }),
    );
    const useCase = new FindBranchByIdUseCase(repos.branchRepository);
    return { ...repos, useCase, branch, outra };
  }

  it('devolve a unidade da organização ativa', async () => {
    const { useCase } = await setup();

    const branch = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: BRANCH_ID,
    });

    expect(branch.id).toBe(BRANCH_ID);
  });

  it('devolve 404 para unidade de outra organização', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ organizationId: OTHER_ORGANIZATION_ID, id: BRANCH_ID }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });

  it('devolve 404 para unidade fora do acesso do membro, na mesma organização', async () => {
    // O recorte por papel também vale no acesso direto por id: saber o id de
    // uma unidade não pode dar acesso ao cadastro fiscal dela.
    const { useCase, outra } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: outra.id,
        allowedBranchIds: [BRANCH_ID],
      }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });

  it('ignora o recorte quando o papel acessa todas as unidades', async () => {
    const { useCase, outra } = await setup();

    const branch = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: outra.id,
      allowedBranchIds: null,
    });

    expect(branch.id).toBe(outra.id);
  });

  it('devolve 404 para unidade desativada', async () => {
    const { useCase, branchRepository, branch } = await setup();
    await branchRepository.save(branch.softDelete());

    await expect(
      useCase.execute({ organizationId: ORGANIZATION_ID, id: BRANCH_ID }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });
});
