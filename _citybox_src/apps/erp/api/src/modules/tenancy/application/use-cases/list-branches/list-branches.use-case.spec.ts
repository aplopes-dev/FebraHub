import { ListBranchesUseCase } from './list-branches.use-case';
import {
  makeBranch,
  makeCnpj,
  makeRepositories,
  ORGANIZATION_ID,
} from '../../../tests/tenancy-test-factory';

describe('ListBranchesUseCase', () => {
  async function setup(total: number) {
    const repos = makeRepositories();
    const ids: string[] = [];

    for (let index = 1; index <= total; index += 1) {
      const branch = makeBranch({
        id: `branch-${index}`,
        code: String(index).padStart(3, '0'),
        document: makeCnpj(index),
        tradeName: `Loja ${index}`,
      });
      await repos.branchRepository.save(branch);
      ids.push(branch.id);
    }

    const useCase = new ListBranchesUseCase(repos.branchRepository);
    return { ...repos, useCase, ids };
  }

  it('devolve a página pedida junto com o total e o número de páginas', async () => {
    const { useCase } = await setup(5);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      page: 2,
      perPage: 2,
    });

    expect(result.total).toBe(5);
    expect(result.page).toBe(2);
    expect(result.perPage).toBe(2);
    expect(result.totalPages).toBe(3);
    expect(result.items.map((branch) => branch.code)).toEqual(['003', '004']);
  });

  it('recorta a lista pelas filiais que o solicitante pode ver', async () => {
    const { useCase, ids } = await setup(4);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      allowedBranchIds: [ids[0], ids[2]],
    });

    expect(result.total).toBe(2);
    expect(result.items.map((branch) => branch.id)).toEqual([ids[0], ids[2]]);
  });
});
