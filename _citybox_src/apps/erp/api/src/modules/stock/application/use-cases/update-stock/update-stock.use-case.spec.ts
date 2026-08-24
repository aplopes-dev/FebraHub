import { UpdateStockUseCase } from './update-stock.use-case';
import { BranchNotFoundError } from '../../../../tenancy/domain/errors/branch-not-found.error';
import {
  BRANCH_ID,
  makeBranch,
  makeCnpj,
  ORGANIZATION_ID,
  OTHER_BRANCH_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import {
  makeRepositories,
  makeStock,
  STOCK_ID,
} from '../../../tests/stocks-test-factory';

describe('UpdateStockUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new UpdateStockUseCase(
      repos.stockRepository,
      repos.branchRepository,
    );
    return { ...repos, useCase };
  }

  function baseInput() {
    return {
      organizationId: ORGANIZATION_ID,
      id: STOCK_ID,
      name: 'Depósito Centro Sul',
      location: 'proprio' as const,
      property: 'terceiro' as const,
    };
  }

  it('atualiza nome, localização e propriedade', async () => {
    const { useCase, stockRepository } = setup();
    await stockRepository.save(makeStock());

    const updated = await useCase.execute(baseInput());

    expect(updated.name).toBe('Depósito Centro Sul');
    expect(updated.location).toBe('proprio');
    expect(updated.property).toBe('terceiro');
    expect(updated.isDefault).toBe(false);
  });

  it('troca as unidades vinculadas', async () => {
    const { useCase, stockRepository, branchRepository } = setup();
    await branchRepository.save(makeBranch());
    await stockRepository.save(makeStock({ branchIds: [] }));

    const updated = await useCase.execute({
      ...baseInput(),
      branchIds: [BRANCH_ID],
    });

    expect(updated.branchIds).toEqual([BRANCH_ID]);
  });

  it('rejeita unidade de outra organização', async () => {
    const { useCase, stockRepository, branchRepository } = setup();
    await stockRepository.save(makeStock());
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

  it('responde 404 para estoque inexistente', async () => {
    const { useCase } = setup();

    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      StockNotFoundError,
    );
  });

  it('responde 404 para estoque de outra organização', async () => {
    const { useCase, stockRepository } = setup();
    await stockRepository.save(makeStock());

    await expect(
      useCase.execute({
        ...baseInput(),
        organizationId: OTHER_ORGANIZATION_ID,
      }),
    ).rejects.toBeInstanceOf(StockNotFoundError);
  });
});
