import { DeleteFinancialGroupUseCase } from './delete-financial-group.use-case';
import { FinancialGroupInUseError } from '../../../domain/errors/financial-group-in-use.error';
import { FinancialGroupNotFoundError } from '../../../domain/errors/financial-group-not-found.error';
import { FinancialGroupNotRemovableError } from '../../../domain/errors/financial-group-not-removable.error';
import {
  FINANCIAL_GROUP_ID,
  makeFinancialGroup,
  makeFinancialGroupRepositories,
  ORGANIZATION_ID,
} from '../../../tests/financial-groups-test-factory';

describe('DeleteFinancialGroupUseCase', () => {
  function setup() {
    const repos = makeFinancialGroupRepositories();
    const useCase = new DeleteFinancialGroupUseCase(repos.groupRepository);
    return { ...repos, useCase };
  }

  it('marca o grupo sem contas vinculadas como excluído', async () => {
    const { useCase, groupRepository } = setup();
    await groupRepository.save(makeFinancialGroup());

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_GROUP_ID,
    });

    const group = await groupRepository.findById(
      ORGANIZATION_ID,
      FINANCIAL_GROUP_ID,
    );
    expect(group?.deletedAt).toBeInstanceOf(Date);
  });

  it('bloqueia exclusão quando há contas do plano vinculadas', async () => {
    const { useCase, groupRepository } = setup();
    await groupRepository.save(makeFinancialGroup());
    groupRepository.linkChartOfAccount(
      FINANCIAL_GROUP_ID,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: FINANCIAL_GROUP_ID,
      }),
    ).rejects.toBeInstanceOf(FinancialGroupInUseError);
  });

  it('409 ao tentar excluir um grupo provisionado pelo sistema', async () => {
    const { useCase, groupRepository } = setup();
    await groupRepository.save(
      makeFinancialGroup({ systemKey: 'fg-receitas', isSystem: true }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: FINANCIAL_GROUP_ID,
      }),
    ).rejects.toBeInstanceOf(FinancialGroupNotRemovableError);

    const group = await groupRepository.findById(
      ORGANIZATION_ID,
      FINANCIAL_GROUP_ID,
    );
    expect(group?.deletedAt).toBeNull();
  });

  it('404 se o grupo não existe', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: FINANCIAL_GROUP_ID,
      }),
    ).rejects.toBeInstanceOf(FinancialGroupNotFoundError);
  });

  it('404 se o grupo já está excluído', async () => {
    const { useCase, groupRepository } = setup();
    await groupRepository.save(makeFinancialGroup().softDelete());

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: FINANCIAL_GROUP_ID,
      }),
    ).rejects.toBeInstanceOf(FinancialGroupNotFoundError);
  });
});
