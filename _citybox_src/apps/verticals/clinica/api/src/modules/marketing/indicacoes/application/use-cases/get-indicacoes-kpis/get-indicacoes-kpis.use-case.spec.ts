import type {
  IndicacoesPeriodCriteria,
  IndicacoesReferrerRow,
  IndicacoesReferredPatientRow,
  ListIndicacoesReferrersCriteria,
  ListIndicacoesReferredPatientsCriteria,
  PaginatedIndicacoesResult,
} from '../../../domain/indicacoes.types';
import { IndicacoesRepository } from '../../../domain/repositories/indicacoes.repository';
import { GetIndicacoesKpisUseCase } from './get-indicacoes-kpis.use-case';
import { ListIndicacoesReferredPatientsUseCase } from '../list-indicacoes-referred-patients/list-indicacoes-referred-patients.use-case';
import { ListIndicacoesReferrersUseCase } from '../list-indicacoes-referrers/list-indicacoes-referrers.use-case';

class InMemoryIndicacoesRepository extends IndicacoesRepository {
  referred: IndicacoesReferredPatientRow[] = [];
  referrers: IndicacoesReferrerRow[] = [];
  kpis = {
    totalReferrals: 0,
    approvedBudgetsValueCents: 0,
    withoutScheduledAppointment: 0,
  };
  years: number[] = [2025, 2026];

  getKpis(
    storeId: string,
    criteria: IndicacoesPeriodCriteria,
  ): Promise<{
    totalReferrals: number;
    approvedBudgetsValueCents: number;
    withoutScheduledAppointment: number;
  }> {
    void storeId;
    void criteria;
    return Promise.resolve(this.kpis);
  }

  listYears(storeId: string): Promise<number[]> {
    void storeId;
    return Promise.resolve(this.years);
  }

  listReferredPatients(
    storeId: string,
    criteria: ListIndicacoesReferredPatientsCriteria,
  ): Promise<PaginatedIndicacoesResult<IndicacoesReferredPatientRow>> {
    void storeId;
    const sorted = [...this.referred].sort((a, b) => {
      const cmp = a.referralDate.localeCompare(b.referralDate);
      return criteria.sortOrder === 'asc' ? cmp : -cmp;
    });
    return Promise.resolve({
      items: sorted.slice(criteria.skip, criteria.skip + criteria.take),
      total: sorted.length,
    });
  }

  listReferrers(
    storeId: string,
    criteria: ListIndicacoesReferrersCriteria,
  ): Promise<PaginatedIndicacoesResult<IndicacoesReferrerRow>> {
    void storeId;
    const sorted = [...this.referrers].sort((a, b) => {
      const cmp = a[criteria.sortBy] - b[criteria.sortBy];
      return criteria.sortOrder === 'asc' ? cmp : -cmp;
    });
    return Promise.resolve({
      items: sorted.slice(criteria.skip, criteria.skip + criteria.take),
      total: sorted.length,
    });
  }
}

describe('Indicacoes use cases', () => {
  it('getKpis returns repository payload with years', async () => {
    const repo = new InMemoryIndicacoesRepository();
    repo.kpis = {
      totalReferrals: 3,
      approvedBudgetsValueCents: 150000,
      withoutScheduledAppointment: 1,
    };
    const useCase = new GetIndicacoesKpisUseCase(repo);

    const result = await useCase.execute({
      storeId: 'store-1',
      periodMode: 'annual',
      year: 2026,
    });

    expect(result.totalReferrals).toBe(3);
    expect(result.approvedBudgetsValueCents).toBe(150000);
    expect(result.withoutScheduledAppointment).toBe(1);
    expect(result.years).toEqual([2025, 2026]);
  });

  it('listReferredPatients paginates and sorts', async () => {
    const repo = new InMemoryIndicacoesRepository();
    repo.referred = [
      {
        id: '1',
        name: 'A',
        phone: '1',
        referredBy: 'X',
        referralDate: '2026-01-10',
        firstAppointmentDate: null,
        firstAppointmentStatus: 'nao_realizada',
        approvedBudgetsCount: 0,
      },
      {
        id: '2',
        name: 'B',
        phone: '2',
        referredBy: 'Y',
        referralDate: '2026-03-10',
        firstAppointmentDate: '2026-03-12',
        firstAppointmentStatus: 'agendada',
        approvedBudgetsCount: 1,
      },
    ];
    const useCase = new ListIndicacoesReferredPatientsUseCase(repo);

    const result = await useCase.execute({
      storeId: 'store-1',
      periodMode: 'annual',
      year: 2026,
      page: 1,
      perPage: 1,
      sortOrder: 'desc',
    });

    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.items[0]?.id).toBe('2');
  });

  it('listReferrers requires month for monthly mode', async () => {
    const repo = new InMemoryIndicacoesRepository();
    const useCase = new ListIndicacoesReferrersUseCase(repo);

    await expect(
      useCase.execute({
        storeId: 'store-1',
        periodMode: 'monthly',
        year: 2026,
      }),
    ).rejects.toThrow(/month is required/);
  });

  it('listReferrers sorts by approvedBudgetsCount', async () => {
    const repo = new InMemoryIndicacoesRepository();
    repo.referrers = [
      {
        id: 'a',
        name: 'A',
        phone: '',
        kind: 'patient',
        totalReferrals: 5,
        approvedBudgetsCount: 1,
      },
      {
        id: 'b',
        name: 'B',
        phone: '',
        kind: 'team',
        totalReferrals: 2,
        approvedBudgetsCount: 4,
      },
    ];
    const useCase = new ListIndicacoesReferrersUseCase(repo);

    const result = await useCase.execute({
      storeId: 'store-1',
      periodMode: 'monthly',
      year: 2026,
      month: 8,
      sortBy: 'approvedBudgetsCount',
      sortOrder: 'desc',
    });

    expect(result.items[0]?.id).toBe('b');
    expect(result.items[1]?.id).toBe('a');
  });
});
