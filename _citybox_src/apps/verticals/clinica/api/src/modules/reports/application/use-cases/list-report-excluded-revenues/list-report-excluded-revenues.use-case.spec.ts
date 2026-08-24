import { ListReportExcludedRevenuesUseCase } from './list-report-excluded-revenues.use-case';
import { InMemoryReportExcludedRevenuesRepository } from '../../../tests/in-memory-report-excluded-revenues.repository';

const STORE_A = '11111111-1111-4111-8111-111111111111';
const STORE_B = '22222222-2222-4222-8222-222222222222';

describe('ListReportExcludedRevenuesUseCase', () => {
  function createHarness() {
    const repo = new InMemoryReportExcludedRevenuesRepository();
    const useCase = new ListReportExcludedRevenuesUseCase(repo);
    return { repo, useCase };
  }

  it('lists cancelled income entries whose updatedAt day is in range', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'e1',
        storeId: STORE_A,
        type: 'income',
        status: 'cancelled',
        updatedAt: '2026-07-18T14:00:00.000Z',
        patientName: 'Ana',
        description: 'Recebimento duplicado',
        valueCents: 18000,
        paidValueCents: 18000,
      },
      {
        id: 'e2',
        storeId: STORE_A,
        type: 'income',
        status: 'cancelled',
        updatedAt: '2026-06-15T10:00:00.000Z',
        patientName: 'Bruno',
        description: 'Fora do período',
        valueCents: 1000,
        paidValueCents: null,
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe('e1');
    expect(result.items[0]?.excludedAt).toBe('2026-07-18');
    expect(result.items[0]?.excludedBy).toBe('Não informado');
    expect(result.items[0]?.valueCents).toBe(18000);
  });

  it('uses cancelledByName when present and falls back otherwise', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'with-actor',
        storeId: STORE_A,
        type: 'income',
        status: 'cancelled',
        updatedAt: '2026-07-20T10:00:00.000Z',
        patientName: 'Ana',
        description: 'Com ator',
        valueCents: 1000,
        paidValueCents: null,
        cancelledByName: 'Maria Silva',
      },
      {
        id: 'legacy',
        storeId: STORE_A,
        type: 'income',
        status: 'cancelled',
        updatedAt: '2026-07-19T10:00:00.000Z',
        patientName: 'Bruno',
        description: 'Legado',
        valueCents: 2000,
        paidValueCents: null,
        cancelledByName: null,
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.excludedBy).toBe('Maria Silva');
    expect(result.items[1]?.excludedBy).toBe('Não informado');
  });

  it('excludes expenses and non-cancelled incomes', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'exp',
        storeId: STORE_A,
        type: 'expense',
        status: 'cancelled',
        updatedAt: '2026-07-10T12:00:00.000Z',
        patientName: null,
        description: 'Despesa',
        valueCents: 50,
        paidValueCents: null,
      },
      {
        id: 'recv',
        storeId: STORE_A,
        type: 'income',
        status: 'received',
        updatedAt: '2026-07-10T12:00:00.000Z',
        patientName: 'X',
        description: 'Ativa',
        valueCents: 100,
        paidValueCents: 100,
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(0);
  });

  it('maps missing patient to dash and uses paidValueCents when set', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'e-manual',
        storeId: STORE_A,
        type: 'income',
        status: 'cancelled',
        updatedAt: '2026-07-12T08:00:00.000Z',
        patientName: null,
        description: 'Avulsa',
        valueCents: 20000,
        paidValueCents: 15000,
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.items[0]?.patientName).toBe('—');
    expect(result.items[0]?.valueCents).toBe(15000);
  });

  it('scopes by storeId and paginates', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'a1',
        storeId: STORE_A,
        type: 'income',
        status: 'cancelled',
        updatedAt: '2026-07-10T10:00:00.000Z',
        patientName: 'A',
        description: 'A',
        valueCents: 1,
        paidValueCents: null,
      },
      {
        id: 'a2',
        storeId: STORE_A,
        type: 'income',
        status: 'cancelled',
        updatedAt: '2026-07-18T10:00:00.000Z',
        patientName: 'B',
        description: 'B',
        valueCents: 2,
        paidValueCents: null,
      },
      {
        id: 'b1',
        storeId: STORE_B,
        type: 'income',
        status: 'cancelled',
        updatedAt: '2026-07-15T10:00:00.000Z',
        patientName: 'C',
        description: 'C',
        valueCents: 3,
        paidValueCents: null,
      },
    ]);

    const page1 = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      page: 1,
      perPage: 1,
    });

    expect(page1.total).toBe(2);
    expect(page1.totalPages).toBe(2);
    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]?.excludedAt).toBe('2026-07-18');
  });

  it('rejects inverted civil date range', async () => {
    const { useCase } = createHarness();

    await expect(
      useCase.execute({
        storeId: STORE_A,
        startDate: '2026-07-31',
        endDate: '2026-07-01',
      }),
    ).rejects.toThrow();
  });
});
