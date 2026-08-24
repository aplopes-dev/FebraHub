import { BadRequestException } from '@nestjs/common';
import { Appointment } from '../../../../scheduling/appointments/domain/entities/appointment.entity';
import { FinancialEntry } from '../../../../financial/entries/domain/entities/financial-entry.entity';
import { Patient } from '../../../../patients/domain/entities/patient.entity';
import { PatientTreatment } from '../../../../patients/patient-treatments/domain/entities/patient-treatment.entity';
import { InMemoryDashboardPatientsQuery } from '../../../tests/in-memory-dashboard-patients.query';
import { GetDashboardPatientsSummaryUseCase } from '../get-dashboard-patients-summary/get-dashboard-patients-summary.use-case';
import { ListDashboardPatientsByMetricUseCase } from './list-dashboard-patients-by-metric.use-case';

const IDS = {
  active: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  inactive: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  other: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  newPatient: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
  treat: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
  treatOk: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
  ana: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
  bruno: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8',
  old: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9',
  p1: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  p2: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  p3: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
} as const;

describe('Dashboard patients metrics', () => {
  const storeId = 'store-1';
  const otherStoreId = 'store-2';
  const categoryId = '11111111-1111-4111-8111-111111111111';
  const now = new Date('2026-07-17T12:00:00.000Z');

  function createStack() {
    const query = new InMemoryDashboardPatientsQuery();
    return {
      query,
      summary: new GetDashboardPatientsSummaryUseCase(query),
      list: new ListDashboardPatientsByMetricUseCase(query),
    };
  }

  function seedPatient(
    query: InMemoryDashboardPatientsQuery,
    overrides: {
      id: string;
      storeId?: string;
      status?: 'active' | 'inactive';
      name?: string;
      email?: string;
      cpf?: string | null;
      phone?: string;
    },
  ) {
    query.seedPatient(
      Patient.create(
        {
          storeId: overrides.storeId ?? storeId,
          status: overrides.status ?? 'active',
          name: overrides.name ?? 'Paciente',
          cpf: overrides.cpf ?? null,
          rg: '',
          birthDate: null,
          gender: 'female',
          photoObjectKey: null,
          photoMimeType: null,
          phone: overrides.phone ?? '73999990000',
          landlinePhone: '',
          email: overrides.email ?? '',
          socialNetwork: '',
          medicalRecordNumber: '',
          referralOriginId: null,
          profession: '',
          categoryId,
          guardianName: '',
          guardianBirthDate: null,
          guardianCpf: null,
          guardianPhone: '',
          guardianNotes: '',
          zipCode: '',
          street: '',
          streetNumber: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          planId: null,
          planNumber: '',
          planHolderName: '',
          planHolderCpf: null,
        },
        overrides.id,
      ),
    );
  }

  function seedAppointment(
    query: InMemoryDashboardPatientsQuery,
    overrides: {
      id: string;
      patientId: string;
      storeId?: string;
      status?: Appointment['status'];
      startAt: Date;
    },
  ) {
    const endAt = new Date(overrides.startAt.getTime() + 30 * 60_000);
    query.seedAppointment(
      Appointment.create(
        {
          storeId: overrides.storeId ?? storeId,
          patientId: overrides.patientId,
          professionalId: 'pro-1',
          procedureId: null,
          roomId: null,
          categoryId: null,
          status: overrides.status ?? 'finished',
          channel: null,
          insuranceType: 'private',
          startAt: overrides.startAt,
          endAt,
          durationMin: 30,
          notes: null,
          returnOption: null,
          returnDate: null,
          returnReason: null,
          fitInId: null,
        },
        overrides.id,
      ),
    );
  }

  function seedOverdueIncome(
    query: InMemoryDashboardPatientsQuery,
    overrides: {
      id: string;
      patientId: string | null;
      storeId?: string;
      valueCents: number;
      dueDate: Date;
      status?: 'pending' | 'paid' | 'cancelled';
      type?: 'income' | 'expense';
    },
  ) {
    query.seedEntry(
      FinancialEntry.create(
        {
          storeId: overrides.storeId ?? storeId,
          type: overrides.type ?? 'income',
          status: overrides.status ?? 'pending',
          source: 'manual',
          description: 'Parcela',
          valueCents: overrides.valueCents,
          dueDate: overrides.dueDate,
          patientId: overrides.patientId,
        },
        overrides.id,
      ),
    );
  }

  function seedTreatment(
    query: InMemoryDashboardPatientsQuery,
    overrides: {
      id: string;
      patientId: string;
      storeId?: string;
      status?: 'active' | 'completed';
    },
  ) {
    query.seedTreatment(
      PatientTreatment.create(
        {
          storeId: overrides.storeId ?? storeId,
          patientId: overrides.patientId,
          status: overrides.status ?? 'active',
          valueCents: 10000,
          sortOrder: 0,
        },
        overrides.id,
      ),
    );
  }

  it('summarizes the five patient metrics for the store', async () => {
    const { query, summary } = createStack();

    seedPatient(query, { id: IDS.active, name: 'Ana' });
    seedPatient(query, {
      id: IDS.inactive,
      name: 'Inativa',
      status: 'inactive',
    });
    seedPatient(query, {
      id: IDS.other,
      name: 'Outra loja',
      storeId: otherStoreId,
    });

    seedAppointment(query, {
      id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      patientId: IDS.active,
      startAt: new Date('2026-04-01T10:00:00.000Z'),
    });
    seedAppointment(query, {
      id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
      patientId: IDS.active,
      status: 'scheduled',
      startAt: new Date('2026-07-01T10:00:00.000Z'),
    });
    seedAppointment(query, {
      id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
      patientId: IDS.active,
      startAt: new Date('2025-01-01T10:00:00.000Z'),
    });

    seedOverdueIncome(query, {
      id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
      patientId: IDS.active,
      valueCents: 5000,
      dueDate: new Date('2026-07-01T00:00:00.000Z'),
    });
    seedOverdueIncome(query, {
      id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
      patientId: IDS.active,
      valueCents: 2500,
      dueDate: new Date('2026-06-01T00:00:00.000Z'),
    });
    seedOverdueIncome(query, {
      id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd3',
      patientId: IDS.active,
      valueCents: 9999,
      dueDate: new Date('2026-07-20T00:00:00.000Z'),
    });
    seedOverdueIncome(query, {
      id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
      patientId: IDS.active,
      valueCents: 1000,
      dueDate: new Date('2026-06-01T00:00:00.000Z'),
      status: 'paid',
    });

    seedPatient(query, { id: IDS.newPatient, name: 'Nova' });
    seedAppointment(query, {
      id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4',
      patientId: IDS.newPatient,
      startAt: new Date('2026-07-05T10:00:00.000Z'),
    });

    seedPatient(query, { id: IDS.treat, name: 'Tratamento' });
    seedTreatment(query, {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
      patientId: IDS.treat,
    });
    seedPatient(query, { id: IDS.treatOk, name: 'Com consulta' });
    seedTreatment(query, {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
      patientId: IDS.treatOk,
    });
    seedAppointment(query, {
      id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5',
      patientId: IDS.treatOk,
      status: 'confirmed',
      startAt: new Date('2026-07-20T10:00:00.000Z'),
    });

    const result = await summary.execute({ storeId, now });

    expect(result).toEqual({
      totalRegisteredCount: 4,
      seenLast6MonthsCount: 2,
      overdueDebtsPatientsCount: 1,
      newSeenThisMonthCount: 1,
      openTreatmentWithoutAppointmentCount: 1,
    });
  });

  it('ignores other stores (anti-IDOR) on summary and list', async () => {
    const { query, summary, list } = createStack();
    seedPatient(query, {
      id: IDS.other,
      storeId: otherStoreId,
      name: 'Outra',
    });
    seedAppointment(query, {
      id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc6',
      storeId: otherStoreId,
      patientId: IDS.other,
      startAt: new Date('2026-07-05T10:00:00.000Z'),
    });
    seedOverdueIncome(query, {
      id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd5',
      storeId: otherStoreId,
      patientId: IDS.other,
      valueCents: 1000,
      dueDate: new Date('2026-06-01T00:00:00.000Z'),
    });
    seedTreatment(query, {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
      storeId: otherStoreId,
      patientId: IDS.other,
    });

    const result = await summary.execute({ storeId, now });
    expect(result).toEqual({
      totalRegisteredCount: 0,
      seenLast6MonthsCount: 0,
      overdueDebtsPatientsCount: 0,
      newSeenThisMonthCount: 0,
      openTreatmentWithoutAppointmentCount: 0,
    });

    const listed = await list.execute({
      storeId,
      metric: 'total_registered',
      now,
    });
    expect(listed.total).toBe(0);
  });

  it('lists overdue debts with SUM(valueCents) and supports search/pagination', async () => {
    const { query, list } = createStack();
    seedPatient(query, {
      id: IDS.ana,
      name: 'Ana Silva',
      email: 'ana@ex.com',
      cpf: '52998224725',
    });
    seedPatient(query, {
      id: IDS.bruno,
      name: 'Bruno Santos',
      email: 'bruno@ex.com',
    });
    seedOverdueIncome(query, {
      id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd6',
      patientId: IDS.ana,
      valueCents: 1000,
      dueDate: new Date('2026-06-01T00:00:00.000Z'),
    });
    seedOverdueIncome(query, {
      id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd7',
      patientId: IDS.ana,
      valueCents: 500,
      dueDate: new Date('2026-05-01T00:00:00.000Z'),
    });
    seedOverdueIncome(query, {
      id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd8',
      patientId: IDS.bruno,
      valueCents: 2000,
      dueDate: new Date('2026-06-15T00:00:00.000Z'),
    });

    const page1 = await list.execute({
      storeId,
      metric: 'overdue_debts',
      page: 1,
      perPage: 1,
      now,
    });
    expect(page1.total).toBe(2);
    expect(page1.totalPages).toBe(2);
    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]).toMatchObject({
      id: IDS.ana,
      valueCents: 1500,
    });

    const searched = await list.execute({
      storeId,
      metric: 'overdue_debts',
      search: 'bruno@',
      now,
    });
    expect(searched.total).toBe(1);
    expect(searched.items[0]?.id).toBe(IDS.bruno);
  });

  it('counts new_seen_this_month only when first finished appointment is in month', async () => {
    const { query, list } = createStack();
    seedPatient(query, { id: IDS.old, name: 'Antiga' });
    seedAppointment(query, {
      id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc7',
      patientId: IDS.old,
      startAt: new Date('2026-01-10T10:00:00.000Z'),
    });
    seedAppointment(query, {
      id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc8',
      patientId: IDS.old,
      startAt: new Date('2026-07-10T10:00:00.000Z'),
    });

    seedPatient(query, { id: IDS.newPatient, name: 'Nova' });
    seedAppointment(query, {
      id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc9',
      patientId: IDS.newPatient,
      startAt: new Date('2026-07-02T10:00:00.000Z'),
    });

    const result = await list.execute({
      storeId,
      metric: 'new_seen_this_month',
      now,
    });
    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe(IDS.newPatient);
  });

  it('excludes open treatments that already have a future open appointment', async () => {
    const { query, list } = createStack();
    seedPatient(query, { id: IDS.p1, name: 'Sem consulta' });
    seedTreatment(query, {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4',
      patientId: IDS.p1,
    });

    seedPatient(query, { id: IDS.p2, name: 'Com consulta' });
    seedTreatment(query, {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5',
      patientId: IDS.p2,
    });
    seedAppointment(query, {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc10',
      patientId: IDS.p2,
      status: 'patient_waiting',
      startAt: new Date('2026-07-18T10:00:00.000Z'),
    });

    seedPatient(query, { id: IDS.p3, name: 'Tratamento finalizado' });
    seedTreatment(query, {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee6',
      patientId: IDS.p3,
      status: 'completed',
    });

    const result = await list.execute({
      storeId,
      metric: 'open_treatment_without_appointment',
      now,
    });
    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe(IDS.p1);
  });

  it('rejects invalid metric', async () => {
    const { list } = createStack();
    await expect(
      list.execute({ storeId, metric: 'birthdays', now }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
