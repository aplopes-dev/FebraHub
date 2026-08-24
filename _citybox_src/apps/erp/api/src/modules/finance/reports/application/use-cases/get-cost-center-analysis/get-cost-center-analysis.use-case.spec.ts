import { InvalidReportPeriodError } from '../../../domain/errors/invalid-report-period.error';
import {
  makeAllocation,
  makeReportRepositories,
  ORGANIZATION_ID,
} from '../../../tests/reports-test-factory';
import { makeCostCenter } from '../../../../cost-centers/tests/cost-centers-test-factory';
import { GetCostCenterAnalysisUseCase } from './get-cost-center-analysis.use-case';

const FROM = new Date('2026-08-01');
const TO = new Date('2026-08-31');

function makeUseCase() {
  const repositories = makeReportRepositories();
  const useCase = new GetCostCenterAnalysisUseCase(
    repositories.financeReportRepository,
    repositories.costCenterRepository,
  );
  return { useCase, ...repositories };
}

describe('GetCostCenterAnalysisUseCase', () => {
  it('aggregates by cost center, sorted by value desc', async () => {
    const { useCase, costCenterRepository, financeReportRepository } =
      makeUseCase();

    const rh = makeCostCenter({
      id: 'c1111111-1111-4111-8111-111111111111',
      name: 'RH',
    });
    const financeiro = makeCostCenter({
      id: 'c2222222-2222-4222-8222-222222222222',
      name: 'Financeiro',
    });
    await costCenterRepository.save(rh);
    await costCenterRepository.save(financeiro);

    financeReportRepository.addAllocation(
      makeAllocation({
        costCenterId: rh.id,
        amountCents: 50000,
        operation: 'payable',
      }),
    );
    financeReportRepository.addAllocation(
      makeAllocation({
        costCenterId: financeiro.id,
        amountCents: 20000,
        operation: 'payable',
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
      type: 'despesa',
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].costCenterName).toBe('RH');
    expect(result.items[0].valueCents).toBe(50000);
    expect(result.items[1].costCenterName).toBe('Financeiro');
    expect(result.items[1].valueCents).toBe(20000);
  });

  it('sums share to 1 across all items including Outros', async () => {
    const { useCase, costCenterRepository, financeReportRepository } =
      makeUseCase();

    const rh = makeCostCenter({
      id: 'c1111111-1111-4111-8111-111111111111',
      name: 'RH',
    });
    await costCenterRepository.save(rh);

    financeReportRepository.addAllocation(
      makeAllocation({
        costCenterId: rh.id,
        amountCents: 7000,
        operation: 'payable',
      }),
    );
    // Centro de custo não resolvido pelo repositório de cost-centers — cai em "Outros".
    financeReportRepository.addAllocation(
      makeAllocation({
        costCenterId: 'c9999999-9999-4999-8999-999999999999',
        amountCents: 3000,
        operation: 'payable',
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
      type: 'despesa',
    });

    const shareSum = result.items.reduce((sum, item) => sum + item.share, 0);
    expect(shareSum).toBeCloseTo(1, 9);
  });

  it('filters by operation according to type', async () => {
    const { useCase, costCenterRepository, financeReportRepository } =
      makeUseCase();

    const rh = makeCostCenter({
      id: 'c1111111-1111-4111-8111-111111111111',
      name: 'RH',
    });
    await costCenterRepository.save(rh);

    financeReportRepository.addAllocation(
      makeAllocation({
        costCenterId: rh.id,
        amountCents: 10000,
        operation: 'payable',
      }),
    );
    financeReportRepository.addAllocation(
      makeAllocation({
        costCenterId: rh.id,
        amountCents: 40000,
        operation: 'receivable',
      }),
    );

    const despesa = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
      type: 'despesa',
    });
    expect(despesa.totalCents).toBe(10000);

    const receita = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
      type: 'receita',
    });
    expect(receita.totalCents).toBe(40000);
  });

  it('buckets an unresolved cost center under "Outros"', async () => {
    const { useCase, financeReportRepository } = makeUseCase();

    financeReportRepository.addAllocation(
      makeAllocation({
        costCenterId: 'c9999999-9999-4999-8999-999999999999',
        amountCents: 5000,
        operation: 'payable',
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
      type: 'despesa',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].costCenterId).toBeNull();
    expect(result.items[0].costCenterName).toBe('Outros');
    expect(result.items[0].valueCents).toBe(5000);
  });

  it('returns an empty report for a period without allocations of the selected type', async () => {
    const { useCase } = makeUseCase();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
      type: 'despesa',
    });

    expect(result.items).toEqual([]);
    expect(result.totalCents).toBe(0);
  });

  it('excludes allocations from a soft-deleted financial entry', async () => {
    const { useCase, costCenterRepository, financeReportRepository } =
      makeUseCase();

    const rh = makeCostCenter({ name: 'RH' });
    await costCenterRepository.save(rh);

    financeReportRepository.addAllocation(
      makeAllocation({
        costCenterId: rh.id,
        amountCents: 10000,
        deletedAt: new Date('2026-08-02'),
        operation: 'payable',
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
      type: 'despesa',
    });

    expect(result.totalCents).toBe(0);
  });

  it('throws InvalidReportPeriodError when to is before from', async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        from: TO,
        to: FROM,
        type: 'despesa',
      }),
    ).rejects.toBeInstanceOf(InvalidReportPeriodError);
  });

  it('never leaks allocations from another organization', async () => {
    const { useCase, costCenterRepository, financeReportRepository } =
      makeUseCase();

    const rh = makeCostCenter({ name: 'RH' });
    await costCenterRepository.save(rh);

    financeReportRepository.addAllocation(
      makeAllocation({
        organizationId: 'other-org-id',
        costCenterId: rh.id,
        amountCents: 10000,
        operation: 'payable',
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      from: FROM,
      to: TO,
      type: 'despesa',
    });

    expect(result.totalCents).toBe(0);
  });
});
