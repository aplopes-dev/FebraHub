import { InvalidReportPeriodError } from '../../../domain/errors/invalid-report-period.error';
import {
  makeAllocation,
  makeReportRepositories,
  ORGANIZATION_ID,
} from '../../../tests/reports-test-factory';
import { makeChartOfAccount } from '../../../../chart-of-accounts/tests/chart-of-accounts-test-factory';
import { makeFinancialGroup } from '../../../../financial-groups/tests/financial-groups-test-factory';
import { GetIncomeStatementUseCase } from './get-income-statement.use-case';

const FROM = new Date('2026-08-01');
const TO = new Date('2026-08-31');

function makeUseCase() {
  const repositories = makeReportRepositories();
  const useCase = new GetIncomeStatementUseCase(
    repositories.financeReportRepository,
    repositories.financialGroupRepository,
    repositories.chartOfAccountRepository,
  );
  return { useCase, ...repositories };
}

describe('GetIncomeStatementUseCase', () => {
  it('aggregates a single account into its group, applying the positive sign', async () => {
    const {
      useCase,
      financialGroupRepository,
      chartOfAccountRepository,
      financeReportRepository,
    } = makeUseCase();

    const group = makeFinancialGroup({
      name: 'Receitas Operacionais',
      type: 'receita',
      classification: 'resultado',
      catalogOrder: 1,
      sign: 'positive',
    });
    await financialGroupRepository.save(group);
    const account = makeChartOfAccount({
      name: 'Vendas de mercadorias',
      financialGroupId: group.id,
    });
    await chartOfAccountRepository.save(account);
    financeReportRepository.addAllocation(
      makeAllocation({
        chartOfAccountId: account.id,
        amountCents: 50000,
        operation: 'receivable',
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
    });

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].financialGroupId).toBe(group.id);
    expect(result.groups[0].name).toBe('Receitas Operacionais');
    expect(result.groups[0].sign).toBe('positive');
    expect(result.groups[0].totalCents).toBe(50000);
    expect(result.groups[0].accounts).toHaveLength(1);
    expect(result.groups[0].accounts[0].name).toBe('Vendas de mercadorias');
    expect(result.groups[0].accounts[0].totalCents).toBe(50000);
    expect(result.operatingResultCents).toBe(50000);
    expect(result.entryCount).toBe(1);
  });

  it('subtracts groups with a negative sign from operatingResultCents', async () => {
    const {
      useCase,
      financialGroupRepository,
      chartOfAccountRepository,
      financeReportRepository,
    } = makeUseCase();

    const revenueGroup = makeFinancialGroup({
      id: 'f1111111-1111-4111-8111-111111111111',
      name: 'Receitas Operacionais',
      type: 'receita',
      classification: 'resultado',
      catalogOrder: 1,
      sign: 'positive',
    });
    const costGroup = makeFinancialGroup({
      id: 'f2222222-2222-4222-8222-222222222222',
      name: 'Custos Operacionais',
      type: 'despesa',
      classification: 'resultado',
      catalogOrder: 3,
      sign: 'negative',
    });
    await financialGroupRepository.save(revenueGroup);
    await financialGroupRepository.save(costGroup);

    const revenueAccount = makeChartOfAccount({
      id: 'a1111111-1111-4111-8111-111111111111',
      name: 'Vendas',
      financialGroupId: revenueGroup.id,
    });
    const costAccount = makeChartOfAccount({
      id: 'a2222222-2222-4222-8222-222222222222',
      name: 'CMV',
      financialGroupId: costGroup.id,
    });
    await chartOfAccountRepository.save(revenueAccount);
    await chartOfAccountRepository.save(costAccount);

    financeReportRepository.addAllocation(
      makeAllocation({
        chartOfAccountId: revenueAccount.id,
        amountCents: 80000,
        operation: 'receivable',
      }),
    );
    financeReportRepository.addAllocation(
      makeAllocation({
        chartOfAccountId: costAccount.id,
        amountCents: 30000,
        operation: 'payable',
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
    });

    expect(result.operatingResultCents).toBe(50000);
  });

  it('returns groups ordered by catalogOrder regardless of save order', async () => {
    const { useCase, financialGroupRepository } = makeUseCase();

    const groupB = makeFinancialGroup({
      id: 'f2222222-2222-4222-8222-222222222222',
      name: 'Despesas Operacionais',
      classification: 'resultado',
      catalogOrder: 4,
      sign: 'negative',
    });
    const groupA = makeFinancialGroup({
      id: 'f1111111-1111-4111-8111-111111111111',
      name: 'Receitas Operacionais',
      classification: 'resultado',
      catalogOrder: 1,
      sign: 'positive',
    });
    await financialGroupRepository.save(groupB);
    await financialGroupRepository.save(groupA);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
    });

    expect(result.groups.map((group) => group.name)).toEqual([
      'Receitas Operacionais',
      'Despesas Operacionais',
    ]);
  });

  it('never omits a fixed-model group without allocations in the period', async () => {
    const { useCase, financialGroupRepository } = makeUseCase();

    const group = makeFinancialGroup({
      name: 'Outras Despesas',
      classification: 'resultado',
      catalogOrder: 7,
      sign: 'negative',
    });
    await financialGroupRepository.save(group);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
    });

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].totalCents).toBe(0);
    expect(result.groups[0].accounts).toEqual([]);
    expect(result.operatingResultCents).toBe(0);
  });

  it('excludes groups outside the fixed model (sign not set)', async () => {
    const {
      useCase,
      financialGroupRepository,
      chartOfAccountRepository,
      financeReportRepository,
    } = makeUseCase();

    const patrimonialGroup = makeFinancialGroup({
      name: 'Ativo',
      type: 'receita',
      classification: 'patrimonial',
      sign: null,
    });
    await financialGroupRepository.save(patrimonialGroup);
    const account = makeChartOfAccount({
      name: 'Recebimento de clientes',
      financialGroupId: patrimonialGroup.id,
    });
    await chartOfAccountRepository.save(account);
    financeReportRepository.addAllocation(
      makeAllocation({
        chartOfAccountId: account.id,
        amountCents: 999999,
        operation: 'receivable',
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
    });

    expect(result.groups).toEqual([]);
    expect(result.operatingResultCents).toBe(0);
  });

  it('sums multiple accounts within the same group', async () => {
    const {
      useCase,
      financialGroupRepository,
      chartOfAccountRepository,
      financeReportRepository,
    } = makeUseCase();

    const group = makeFinancialGroup({
      name: 'Despesas Operacionais',
      classification: 'resultado',
      catalogOrder: 4,
      sign: 'negative',
    });
    await financialGroupRepository.save(group);
    const accountA = makeChartOfAccount({
      id: 'a1111111-1111-4111-8111-111111111111',
      name: 'Aluguel',
      financialGroupId: group.id,
    });
    const accountB = makeChartOfAccount({
      id: 'a2222222-2222-4222-8222-222222222222',
      name: 'Salários',
      financialGroupId: group.id,
    });
    await chartOfAccountRepository.save(accountA);
    await chartOfAccountRepository.save(accountB);

    financeReportRepository.addAllocation(
      makeAllocation({ chartOfAccountId: accountA.id, amountCents: 3000 }),
    );
    financeReportRepository.addAllocation(
      makeAllocation({ chartOfAccountId: accountB.id, amountCents: 7000 }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
    });

    expect(result.groups[0].totalCents).toBe(10000);
    expect(result.groups[0].accounts).toHaveLength(2);
  });

  it('returns all fixed groups with zero totals for a period without allocations', async () => {
    const { useCase, financialGroupRepository } = makeUseCase();

    const group = makeFinancialGroup({
      classification: 'resultado',
      catalogOrder: 1,
      sign: 'positive',
    });
    await financialGroupRepository.save(group);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
    });

    expect(result.groups[0].totalCents).toBe(0);
    expect(result.operatingResultCents).toBe(0);
    expect(result.entryCount).toBe(0);
  });

  it('excludes allocations from a soft-deleted financial entry', async () => {
    const {
      useCase,
      financialGroupRepository,
      chartOfAccountRepository,
      financeReportRepository,
    } = makeUseCase();

    const group = makeFinancialGroup({
      classification: 'resultado',
      catalogOrder: 3,
      sign: 'negative',
    });
    await financialGroupRepository.save(group);
    const account = makeChartOfAccount({ financialGroupId: group.id });
    await chartOfAccountRepository.save(account);

    financeReportRepository.addAllocation(
      makeAllocation({
        chartOfAccountId: account.id,
        amountCents: 10000,
        deletedAt: new Date('2026-08-02'),
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
    });

    expect(result.groups[0].totalCents).toBe(0);
  });

  it('throws InvalidReportPeriodError when to is before from', async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        from: TO,
        to: FROM,
      }),
    ).rejects.toBeInstanceOf(InvalidReportPeriodError);
  });

  it('never leaks allocations from another organization', async () => {
    const {
      useCase,
      financialGroupRepository,
      chartOfAccountRepository,
      financeReportRepository,
    } = makeUseCase();

    const group = makeFinancialGroup({
      classification: 'resultado',
      catalogOrder: 3,
      sign: 'negative',
    });
    await financialGroupRepository.save(group);
    const account = makeChartOfAccount({ financialGroupId: group.id });
    await chartOfAccountRepository.save(account);

    financeReportRepository.addAllocation(
      makeAllocation({
        organizationId: 'other-org-id',
        chartOfAccountId: account.id,
        amountCents: 10000,
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
    });

    expect(result.groups[0].totalCents).toBe(0);
  });
});
