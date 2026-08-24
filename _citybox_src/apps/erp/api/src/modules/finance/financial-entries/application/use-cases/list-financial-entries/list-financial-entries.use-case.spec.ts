import { ListFinancialEntriesUseCase } from './list-financial-entries.use-case';
import { InvalidStatementPeriodError } from '../../../domain/errors/invalid-statement-period.error';
import {
  CHART_OF_ACCOUNT_ID,
  makeChartOfAccount,
} from '../../../../chart-of-accounts/tests/chart-of-accounts-test-factory';
import { BANK_ACCOUNT_ID } from '../../../../bank-accounts/tests/bank-accounts-test-factory';
import { makeFinancialGroup } from '../../../../financial-groups/tests/financial-groups-test-factory';
import {
  COST_CENTER_ID,
  makeCostCenter,
} from '../../../../cost-centers/tests/cost-centers-test-factory';
import {
  DUE_DATE,
  FINANCIAL_ENTRY_ID,
  makeFinancialEntry,
  makeFinancialEntryAllocation,
  makeFinancialEntryPayment,
  makeFinancialEntryRepositories,
  ORGANIZATION_ID,
  OTHER_FINANCIAL_ENTRY_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tests/financial-entries-test-factory';

const PAYABLE_ID = 'e3333333-3333-4333-8333-333333333333';
const OTHER_CATEGORY_ID = 'a9999999-9999-4999-8999-999999999999';
const LATER_DUE_DATE = new Date('2026-09-15T00:00:00.000Z');
const LATER_COMPETENCE_ENTRY_ID = 'e4444444-4444-4444-8444-444444444444';
const LATER_COMPETENCE_DATE = new Date('2026-09-01T00:00:00.000Z');
const BANK_ACCOUNT_ENTRY_ID = 'e5555555-5555-4555-8555-555555555555';

describe('ListFinancialEntriesUseCase', () => {
  async function setup() {
    const repos = makeFinancialEntryRepositories();
    const useCase = new ListFinancialEntriesUseCase(
      repos.financialEntryRepository,
    );

    await repos.financialGroupRepository.save(makeFinancialGroup());
    await repos.chartOfAccountRepository.save(
      makeChartOfAccount({ id: CHART_OF_ACCOUNT_ID }),
    );
    await repos.chartOfAccountRepository.save(
      makeChartOfAccount({ id: OTHER_CATEGORY_ID, name: 'Outra categoria' }),
    );
    await repos.costCenterRepository.save(
      makeCostCenter({ id: COST_CENTER_ID }),
    );

    await repos.financialEntryRepository.save(
      makeFinancialEntry({
        id: FINANCIAL_ENTRY_ID,
        operation: 'receivable',
        description: 'Venda balcão',
        partyName: 'Maria Silva',
        dueDate: DUE_DATE,
        payments: [makeFinancialEntryPayment({ amountCents: 10_000 })],
        allocations: [
          makeFinancialEntryAllocation({
            chartOfAccountId: CHART_OF_ACCOUNT_ID,
            costCenterId: COST_CENTER_ID,
            amountCents: 10_000,
            percentage: 100,
          }),
        ],
      }),
    );
    await repos.financialEntryRepository.save(
      makeFinancialEntry({
        id: PAYABLE_ID,
        operation: 'payable',
        description: 'Aluguel',
        partyName: 'Imobiliária Centro',
        dueDate: LATER_DUE_DATE,
        amountCents: 20_000,
        allocations: [
          makeFinancialEntryAllocation({
            chartOfAccountId: OTHER_CATEGORY_ID,
            costCenterId: COST_CENTER_ID,
            amountCents: 20_000,
            percentage: 100,
          }),
        ],
      }),
    );
    await repos.financialEntryRepository.save(
      makeFinancialEntry({
        id: OTHER_FINANCIAL_ENTRY_ID,
        description: 'Lançamento cancelado',
      }),
    );
    await repos.financialEntryRepository.softDelete(
      ORGANIZATION_ID,
      OTHER_FINANCIAL_ENTRY_ID,
      new Date(),
    );

    return { ...repos, useCase };
  }

  it('lista só os ativos por padrão, do vencimento mais distante ao mais próximo', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.items.map((item) => item.id)).toEqual([
      PAYABLE_ID,
      FINANCIAL_ENTRY_ID,
    ]);
    expect(result.total).toBe(2);
    expect(result.tabCounts).toEqual({ active: 2, deleted: 1 });
  });

  it('lista só os excluídos na aba "deleted"', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'deleted',
    });

    expect(result.items.map((item) => item.id)).toEqual([
      OTHER_FINANCIAL_ENTRY_ID,
    ]);
    expect(result.total).toBe(1);
  });

  it('filtra pela operação', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      operation: 'payable',
    });

    expect(result.items.map((item) => item.id)).toEqual([PAYABLE_ID]);
  });

  it('filtra por status', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      status: ['paid'],
    });

    expect(result.items.map((item) => item.id)).toEqual([FINANCIAL_ENTRY_ID]);
  });

  it('filtra por categoria financeira (chartOfAccountId)', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      chartOfAccountId: [OTHER_CATEGORY_ID],
    });

    expect(result.items.map((item) => item.id)).toEqual([PAYABLE_ID]);
  });

  it('filtra por centro de custo (costCenterId)', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      costCenterId: [COST_CENTER_ID],
    });

    expect(result.items.map((item) => item.id).sort()).toEqual(
      [PAYABLE_ID, FINANCIAL_ENTRY_ID].sort(),
    );
  });

  it('busca também pelo nome da parte, sem mexer nos contadores das abas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'imobiliária',
    });

    expect(result.items.map((item) => item.id)).toEqual([PAYABLE_ID]);
    // Os contadores dizem quanto existe em cada aba, não quanto o filtro achou.
    expect(result.tabCounts).toEqual({ active: 2, deleted: 1 });
  });

  it('recorta o período pelo vencimento', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      dueFrom: new Date('2026-09-01T00:00:00.000Z'),
      dueTo: new Date('2026-09-30T00:00:00.000Z'),
    });

    expect(result.items.map((item) => item.id)).toEqual([PAYABLE_ID]);
    expect(result.total).toBe(1);
  });

  it('ordena por valor crescente quando sort=amount_asc', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      sort: 'amount_asc',
    });

    expect(result.items.map((item) => item.id)).toEqual([
      FINANCIAL_ENTRY_ID,
      PAYABLE_ID,
    ]);
  });

  it('não devolve lançamento de outra organização', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: OTHER_ORGANIZATION_ID,
    });

    expect(result.items).toHaveLength(0);
    expect(result.tabCounts).toEqual({ active: 0, deleted: 0 });
  });

  it('recorta o período pela competência (eixo alternativo ao vencimento)', async () => {
    const { useCase, financialEntryRepository } = await setup();
    await financialEntryRepository.save(
      makeFinancialEntry({
        id: LATER_COMPETENCE_ENTRY_ID,
        description: 'Lançamento de competência futura',
        competenceDate: LATER_COMPETENCE_DATE,
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      competenceFrom: new Date('2026-09-01T00:00:00.000Z'),
      competenceTo: new Date('2026-09-30T00:00:00.000Z'),
    });

    expect(result.items.map((item) => item.id)).toEqual([
      LATER_COMPETENCE_ENTRY_ID,
    ]);
  });

  it('filtra por conta bancária (bankAccountId)', async () => {
    const { useCase, financialEntryRepository } = await setup();
    await financialEntryRepository.save(
      makeFinancialEntry({
        id: BANK_ACCOUNT_ENTRY_ID,
        description: 'Lançamento vinculado a uma conta específica',
        bankAccountId: BANK_ACCOUNT_ID,
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
    });

    expect(result.items.map((item) => item.id)).toEqual([
      BANK_ACCOUNT_ENTRY_ID,
    ]);
  });

  it('rejeita vencimento com data final anterior à inicial', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        dueFrom: new Date('2026-09-30T00:00:00.000Z'),
        dueTo: new Date('2026-09-01T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(InvalidStatementPeriodError);
  });

  it('rejeita competência com data final anterior à inicial', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        competenceFrom: new Date('2026-09-30T00:00:00.000Z'),
        competenceTo: new Date('2026-09-01T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(InvalidStatementPeriodError);
  });
});
