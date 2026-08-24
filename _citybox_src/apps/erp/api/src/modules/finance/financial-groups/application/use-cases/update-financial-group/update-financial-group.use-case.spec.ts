import { UpdateFinancialGroupUseCase } from './update-financial-group.use-case';
import { FinancialGroupNameTakenError } from '../../../domain/errors/financial-group-name-taken.error';
import { FinancialGroupNotFoundError } from '../../../domain/errors/financial-group-not-found.error';
import { FinancialGroupImmutableFieldError } from '../../../domain/errors/financial-group-immutable-field.error';
import {
  FINANCIAL_GROUP_ID,
  makeFinancialGroup,
  makeFinancialGroupRepositories,
  ORGANIZATION_ID,
  OTHER_FINANCIAL_GROUP_ID,
} from '../../../tests/financial-groups-test-factory';

describe('UpdateFinancialGroupUseCase', () => {
  function setup() {
    const repos = makeFinancialGroupRepositories();
    const useCase = new UpdateFinancialGroupUseCase(repos.groupRepository);
    return { ...repos, useCase };
  }

  it('atualiza nome e tipo', async () => {
    const { useCase, groupRepository } = setup();
    await groupRepository.save(makeFinancialGroup());

    const group = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_GROUP_ID,
      name: '  Serviços  ',
      type: 'despesa',
    });

    expect(group.name).toBe('Serviços');
    expect(group.type).toBe('despesa');
  });

  it('aceita manter o próprio nome', async () => {
    const { useCase, groupRepository } = setup();
    await groupRepository.save(makeFinancialGroup({ name: 'Vendas' }));

    const group = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_GROUP_ID,
      name: 'Vendas',
      type: 'despesa',
    });

    expect(group.type).toBe('despesa');
  });

  it('permite renomear um grupo do sistema mantendo o tipo', async () => {
    const { useCase, groupRepository } = setup();
    await groupRepository.save(
      makeFinancialGroup({ systemKey: 'fg-receitas', isSystem: true }),
    );

    const group = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_GROUP_ID,
      name: 'Entradas',
      type: 'receita',
    });

    expect(group.name).toBe('Entradas');
    expect(group.isSystem).toBe(true);
  });

  it('rejeita troca de tipo em grupo do sistema', async () => {
    const { useCase, groupRepository } = setup();
    await groupRepository.save(
      makeFinancialGroup({ systemKey: 'fg-receitas', isSystem: true }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: FINANCIAL_GROUP_ID,
        name: 'Vendas',
        type: 'despesa',
      }),
    ).rejects.toBeInstanceOf(FinancialGroupImmutableFieldError);
  });

  it('rejeita nome de outro grupo da organização', async () => {
    const { useCase, groupRepository } = setup();
    await groupRepository.save(makeFinancialGroup({ name: 'Vendas' }));
    await groupRepository.save(
      makeFinancialGroup({ id: OTHER_FINANCIAL_GROUP_ID, name: 'Impostos' }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: OTHER_FINANCIAL_GROUP_ID,
        name: 'vendas',
        type: 'despesa',
      }),
    ).rejects.toBeInstanceOf(FinancialGroupNameTakenError);
  });

  it('404 se o grupo não existe', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: FINANCIAL_GROUP_ID,
        name: 'Vendas',
        type: 'receita',
      }),
    ).rejects.toBeInstanceOf(FinancialGroupNotFoundError);
  });
});
