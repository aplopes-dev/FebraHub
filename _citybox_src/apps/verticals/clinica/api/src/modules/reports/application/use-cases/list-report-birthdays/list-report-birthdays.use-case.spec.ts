import { ListReportBirthdaysUseCase } from './list-report-birthdays.use-case';
import { InMemoryReportBirthdaysRepository } from '../../../tests/in-memory-report-birthdays.repository';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';

const STORE_A = '11111111-1111-4111-8111-111111111111';
const STORE_B = '22222222-2222-4222-8222-222222222222';

describe('ListReportBirthdaysUseCase', () => {
  function createHarness() {
    const repo = new InMemoryReportBirthdaysRepository();
    const useCase = new ListReportBirthdaysUseCase(repo);
    return { repo, useCase };
  }

  it('lists birthdays for today (month/day match)', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'p1',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Ana',
        phone: '7332334455',
        mobile: '73999887766',
        birthDate: '1990-07-23',
      },
      {
        id: 'p2',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Bruno',
        phone: '',
        mobile: '73988776655',
        birthDate: '1985-07-24',
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-07-23',
      endDate: '2026-07-23',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.patientName).toBe('Ana');
    expect(result.items[0]?.mobile).toBe('73999887766');
    expect(result.items[0]?.phone).toBe('7332334455');
  });

  it('covers year wrap (Dec → Jan)', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'p-dec',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Dezembro',
        phone: '',
        mobile: '1',
        birthDate: '1991-12-30',
      },
      {
        id: 'p-jan',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Janeiro',
        phone: '',
        mobile: '2',
        birthDate: '1992-01-02',
      },
      {
        id: 'p-out',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Fora',
        phone: '',
        mobile: '3',
        birthDate: '1993-01-10',
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2025-12-28',
      endDate: '2026-01-05',
    });

    expect(result.items.map((row) => row.patientName)).toEqual([
      'Dezembro',
      'Janeiro',
    ]);
  });

  it('excludes patients without birthDate and inactive by default', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'p-ok',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Ativo',
        phone: '',
        mobile: '1',
        birthDate: '2000-03-15',
      },
      {
        id: 'p-no-bd',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Sem data',
        phone: '',
        mobile: '2',
        birthDate: null,
      },
      {
        id: 'p-off',
        storeId: STORE_A,
        status: 'inactive',
        patientName: 'Inativo',
        phone: '',
        mobile: '3',
        birthDate: '2000-03-15',
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.patientName).toBe('Ativo');
  });

  it('scopes by storeId', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'p-a',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Loja A',
        phone: '',
        mobile: '1',
        birthDate: '1999-05-10',
      },
      {
        id: 'p-b',
        storeId: STORE_B,
        status: 'active',
        patientName: 'Loja B',
        phone: '',
        mobile: '2',
        birthDate: '1999-05-10',
      },
    ]);

    const result = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.patientName).toBe('Loja A');
  });

  it('paginates results', async () => {
    const { repo, useCase } = createHarness();
    repo.seed(
      Array.from({ length: 5 }, (_, index) => ({
        id: `p-${index}`,
        storeId: STORE_A,
        status: 'active' as const,
        patientName: `Paciente ${index + 1}`,
        phone: '',
        mobile: String(index),
        birthDate: `1990-06-${String(index + 1).padStart(2, '0')}`,
      })),
    );

    const page1 = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      page: 1,
      perPage: 2,
    });
    const page2 = await useCase.execute({
      storeId: STORE_A,
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      page: 2,
      perPage: 2,
    });

    expect(page1.total).toBe(5);
    expect(page1.totalPages).toBe(3);
    expect(page1.items).toHaveLength(2);
    expect(page1.items[0]?.patientName).toBe('Paciente 1');
    expect(page2.items[0]?.patientName).toBe('Paciente 3');
  });

  it('rejects inverted date range', async () => {
    const { useCase } = createHarness();

    await expect(
      useCase.execute({
        storeId: STORE_A,
        startDate: '2026-07-20',
        endDate: '2026-07-10',
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });
});
