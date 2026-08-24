import { CreateStockUseCase } from './create-stock.use-case';
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
import { makeRepositories } from '../../../tests/stocks-test-factory';

describe('CreateStockUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new CreateStockUseCase(
      repos.stockRepository,
      repos.branchRepository,
    );
    return { ...repos, useCase };
  }

  function baseInput() {
    return {
      organizationId: ORGANIZATION_ID,
      name: '  Depósito Pontal  ',
      location: 'deposito' as const,
      property: 'proprio' as const,
    };
  }

  it('cria o estoque com nome aparado e isDefault=false', async () => {
    const { useCase } = setup();

    const stock = await useCase.execute(baseInput());

    expect(stock.name).toBe('Depósito Pontal');
    expect(stock.location).toBe('deposito');
    expect(stock.property).toBe('proprio');
    expect(stock.isDefault).toBe(false);
    expect(stock.branchIds).toEqual([]);
  });

  it('vincula as unidades informadas, sem repetir id', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(makeBranch());

    const stock = await useCase.execute({
      ...baseInput(),
      branchIds: [BRANCH_ID, BRANCH_ID],
    });

    expect(stock.branchIds).toEqual([BRANCH_ID]);
  });

  it('rejeita nome vazio', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ ...baseInput(), name: '   ' }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejeita location inválida', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        ...baseInput(),
        location: 'galpao' as 'deposito',
      }),
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

  it('rejeita unidade excluída', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(makeBranch().softDelete());

    await expect(
      useCase.execute({ ...baseInput(), branchIds: [BRANCH_ID] }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });
});
