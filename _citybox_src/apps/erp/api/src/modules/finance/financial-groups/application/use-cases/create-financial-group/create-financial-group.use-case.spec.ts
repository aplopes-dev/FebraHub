import { CreateFinancialGroupUseCase } from './create-financial-group.use-case';
import { FinancialGroupNameTakenError } from '../../../domain/errors/financial-group-name-taken.error';
import {
  makeFinancialGroup,
  makeFinancialGroupRepositories,
  ORGANIZATION_ID,
} from '../../../tests/financial-groups-test-factory';

describe('CreateFinancialGroupUseCase', () => {
  function setup() {
    const repos = makeFinancialGroupRepositories();
    const useCase = new CreateFinancialGroupUseCase(repos.groupRepository);
    return { ...repos, useCase };
  }

  it('cria o grupo com o nome aparado e ativo', async () => {
    const { useCase } = setup();

    const group = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      name: '  Despesas fixas  ',
      type: 'despesa',
    });

    expect(group.name).toBe('Despesas fixas');
    expect(group.type).toBe('despesa');
    expect(group.deletedAt).toBeNull();
  });

  it('rejeita nome já usado na organização, ignorando maiúsculas', async () => {
    const { useCase, groupRepository } = setup();
    await groupRepository.save(makeFinancialGroup({ name: 'Vendas' }));

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        name: 'vendas',
        type: 'receita',
      }),
    ).rejects.toBeInstanceOf(FinancialGroupNameTakenError);
  });

  it('rejeita nome de grupo excluído — unique do banco não conhece soft-delete', async () => {
    const { useCase, groupRepository } = setup();
    await groupRepository.save(
      makeFinancialGroup({ name: 'Vendas' }).softDelete(),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        name: 'Vendas',
        type: 'receita',
      }),
    ).rejects.toBeInstanceOf(FinancialGroupNameTakenError);
  });
});
