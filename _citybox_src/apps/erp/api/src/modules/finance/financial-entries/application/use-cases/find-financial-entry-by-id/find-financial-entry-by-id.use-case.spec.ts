import { FindFinancialEntryByIdUseCase } from './find-financial-entry-by-id.use-case';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import {
  FINANCIAL_ENTRY_ID,
  makeFinancialEntry,
  makeFinancialEntryRepositories,
  ORGANIZATION_ID,
} from '../../../tests/financial-entries-test-factory';

describe('FindFinancialEntryByIdUseCase', () => {
  function setup() {
    const repos = makeFinancialEntryRepositories();
    const useCase = new FindFinancialEntryByIdUseCase(
      repos.financialEntryRepository,
    );
    return { ...repos, useCase };
  }

  it('encontra um lançamento existente', async () => {
    const { useCase, financialEntryRepository } = setup();
    await financialEntryRepository.save(makeFinancialEntry());

    const entry = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_ENTRY_ID,
    });

    expect(entry.id).toBe(FINANCIAL_ENTRY_ID);
  });

  it('devolve o lançamento mesmo se já excluído (aba Excluídos leva ao detalhe)', async () => {
    const { useCase, financialEntryRepository } = setup();
    await financialEntryRepository.save(makeFinancialEntry());
    await financialEntryRepository.softDelete(
      ORGANIZATION_ID,
      FINANCIAL_ENTRY_ID,
      new Date(),
    );

    const entry = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_ENTRY_ID,
    });

    expect(entry.deletedAt).not.toBeNull();
  });

  it('lança FinancialEntryNotFoundError para lançamento inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: FINANCIAL_ENTRY_ID,
      }),
    ).rejects.toBeInstanceOf(FinancialEntryNotFoundError);
  });

  it('expõe isReadOnly quando o lançamento está vinculado a um pedido de venda', async () => {
    const { useCase, financialEntryRepository } = setup();
    const linked = makeFinancialEntry();
    await financialEntryRepository.save(
      FinancialEntry.with(
        { ...linked.props, saleOrderId: 'so-1111-1111-4111-8111-111111111111' },
        linked.id,
      ),
    );

    const entry = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: FINANCIAL_ENTRY_ID,
    });

    expect(entry.isReadOnly).toBe(true);
  });
});
