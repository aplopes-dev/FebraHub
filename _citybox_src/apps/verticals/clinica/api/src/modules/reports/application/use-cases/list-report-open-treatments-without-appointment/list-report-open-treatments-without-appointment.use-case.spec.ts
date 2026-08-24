import { ListReportOpenTreatmentsWithoutAppointmentUseCase } from './list-report-open-treatments-without-appointment.use-case';
import { InMemoryReportOpenTreatmentsRepository } from '../../../tests/in-memory-report-open-treatments.repository';

const STORE_A = '11111111-1111-4111-8111-111111111111';
const STORE_B = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-07-23T15:00:00.000Z');

describe('ListReportOpenTreatmentsWithoutAppointmentUseCase', () => {
  function createHarness() {
    const repo = new InMemoryReportOpenTreatmentsRepository();
    const useCase = new ListReportOpenTreatmentsWithoutAppointmentUseCase(repo);
    return { repo, useCase };
  }

  it('lists patients with active treatment and no live appointment', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'p1',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Ana',
        phone: '7332334455',
        mobile: '73999887766',
        document: '52998224725',
        hasActiveTreatment: true,
        appointments: [],
      },
      {
        id: 'p2',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Bruno',
        phone: '',
        mobile: '73988776655',
        document: '39053344705',
        hasActiveTreatment: true,
        appointments: [
          {
            status: 'scheduled',
            startAt: new Date('2026-07-24T10:00:00.000Z'),
          },
        ],
      },
    ]);

    const result = await useCase.execute({ storeId: STORE_A, now: NOW });

    expect(result.total).toBe(1);
    expect(result.items[0]?.patientName).toBe('Ana');
    expect(result.items[0]?.mobile).toBe('73999887766');
    expect(result.items[0]?.document).toBe('52998224725');
  });

  it('excludes patients without active treatment', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'p1',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Sem tratamento',
        phone: '',
        mobile: '1',
        document: '1',
        hasActiveTreatment: false,
        appointments: [],
      },
    ]);

    const result = await useCase.execute({ storeId: STORE_A, now: NOW });
    expect(result.total).toBe(0);
  });

  it('excludes inactive patients by default', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'p1',
        storeId: STORE_A,
        status: 'inactive',
        patientName: 'Inativo',
        phone: '',
        mobile: '1',
        document: '1',
        hasActiveTreatment: true,
        appointments: [],
      },
    ]);

    const result = await useCase.execute({ storeId: STORE_A, now: NOW });
    expect(result.total).toBe(0);
  });

  it('keeps patient with past finished appointment', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'p1',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Histórico',
        phone: '',
        mobile: '1',
        document: '1',
        hasActiveTreatment: true,
        appointments: [
          {
            status: 'finished',
            startAt: new Date('2026-07-20T10:00:00.000Z'),
          },
        ],
      },
    ]);

    const result = await useCase.execute({ storeId: STORE_A, now: NOW });
    expect(result.total).toBe(1);
  });

  it('excludes patient with in_progress appointment even if startAt is past', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'p1',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Em atendimento',
        phone: '',
        mobile: '1',
        document: '1',
        hasActiveTreatment: true,
        appointments: [
          {
            status: 'in_progress',
            startAt: new Date('2026-07-23T14:00:00.000Z'),
          },
        ],
      },
    ]);

    const result = await useCase.execute({ storeId: STORE_A, now: NOW });
    expect(result.total).toBe(0);
  });

  it('scopes by storeId and paginates', async () => {
    const { repo, useCase } = createHarness();
    repo.seed([
      {
        id: 'p-a1',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Alice',
        phone: '',
        mobile: '1',
        document: '1',
        hasActiveTreatment: true,
        appointments: [],
      },
      {
        id: 'p-a2',
        storeId: STORE_A,
        status: 'active',
        patientName: 'Carla',
        phone: '',
        mobile: '2',
        document: '2',
        hasActiveTreatment: true,
        appointments: [],
      },
      {
        id: 'p-b',
        storeId: STORE_B,
        status: 'active',
        patientName: 'Bruno',
        phone: '',
        mobile: '3',
        document: '3',
        hasActiveTreatment: true,
        appointments: [],
      },
    ]);

    const page1 = await useCase.execute({
      storeId: STORE_A,
      now: NOW,
      page: 1,
      perPage: 1,
    });

    expect(page1.total).toBe(2);
    expect(page1.totalPages).toBe(2);
    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]?.patientName).toBe('Alice');
  });
});
