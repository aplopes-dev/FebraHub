import { BadRequestException } from '@nestjs/common';
import { Appointment } from '../../../../scheduling/appointments/domain/entities/appointment.entity';
import { InMemoryAppointmentRepository } from '../../../../scheduling/appointments/tests/in-memory-appointment.repository';
import { ListDashboardCancelledAppointmentTasksUseCase } from './list-dashboard-cancelled-appointment-tasks.use-case';

describe('ListDashboardCancelledAppointmentTasksUseCase', () => {
  const storeId = 'store-1';

  function createUseCase(repo = new InMemoryAppointmentRepository()) {
    return {
      repo,
      useCase: new ListDashboardCancelledAppointmentTasksUseCase(repo),
    };
  }

  function seedAppointment(
    repo: InMemoryAppointmentRepository,
    overrides: {
      id: string;
      storeId?: string;
      status:
        | 'scheduled'
        | 'finished'
        | 'missed'
        | 'cancelled_patient'
        | 'cancelled_pro';
      startAt: Date;
      patientId?: string;
      patientName?: string;
      patientPhone?: string | null;
      professionalId?: string;
      durationMin?: number;
      categoryId?: string | null;
      notes?: string | null;
    },
  ) {
    const startAt = overrides.startAt;
    const durationMin = overrides.durationMin ?? 30;
    const endAt = new Date(startAt.getTime() + durationMin * 60_000);
    const appointment = Appointment.create(
      {
        storeId: overrides.storeId ?? storeId,
        patientId: overrides.patientId ?? 'patient-1',
        professionalId: overrides.professionalId ?? 'pro-1',
        procedureId: null,
        roomId: null,
        categoryId: overrides.categoryId ?? null,
        status: overrides.status,
        channel: null,
        insuranceType: 'private',
        startAt,
        endAt,
        durationMin,
        notes: overrides.notes ?? null,
        returnOption: null,
        returnDate: null,
        returnReason: null,
        fitInId: null,
      },
      overrides.id,
    );
    repo.seed({
      appointment,
      patientName: overrides.patientName ?? 'Paciente',
      patientPhone: overrides.patientPhone ?? '73999990000',
      category: null,
    });
  }

  it('lists missed, cancelled_patient and cancelled_pro in range', async () => {
    const { repo, useCase } = createUseCase();

    seedAppointment(repo, {
      id: 'a1',
      status: 'cancelled_patient',
      startAt: new Date('2026-07-22T10:00:00.000Z'),
      patientName: 'Ana',
      notes: 'Remarcou',
    });
    seedAppointment(repo, {
      id: 'a2',
      status: 'cancelled_pro',
      startAt: new Date('2026-07-23T14:00:00.000Z'),
      patientName: 'Bruno',
      professionalId: 'pro-2',
    });
    seedAppointment(repo, {
      id: 'a3',
      status: 'missed',
      startAt: new Date('2026-07-22T11:00:00.000Z'),
      patientName: 'Carla',
    });
    seedAppointment(repo, {
      id: 'a4',
      status: 'finished',
      startAt: new Date('2026-07-22T12:00:00.000Z'),
      patientName: 'Diego',
    });
    seedAppointment(repo, {
      id: 'a5',
      status: 'cancelled_patient',
      startAt: new Date('2026-06-01T10:00:00.000Z'),
      patientName: 'Fora',
    });
    seedAppointment(repo, {
      id: 'a6',
      storeId: 'store-2',
      status: 'cancelled_pro',
      startAt: new Date('2026-07-22T15:00:00.000Z'),
      patientName: 'Outra loja',
    });

    const result = await useCase.execute({
      storeId,
      startDate: '2026-07-20',
      endDate: '2026-07-26',
    });

    expect(result.total).toBe(3);
    expect(result.items.map((item) => item.id)).toEqual(['a2', 'a3', 'a1']);
    expect(result.items[0]).toMatchObject({
      id: 'a2',
      patientName: 'Bruno',
      status: 'cancelled_pro',
      professionalId: 'pro-2',
    });
    expect(result.items[1]).toMatchObject({
      id: 'a3',
      patientName: 'Carla',
      status: 'missed',
    });
    expect(result.items[2]).toMatchObject({
      id: 'a1',
      patientName: 'Ana',
      status: 'cancelled_patient',
      observations: 'Remarcou',
      appointmentAt: '2026-07-22T10:00:00.000Z',
    });
  });

  it('paginates server-side', async () => {
    const { repo, useCase } = createUseCase();

    seedAppointment(repo, {
      id: 'p1',
      status: 'cancelled_patient',
      startAt: new Date('2026-07-22T09:00:00.000Z'),
    });
    seedAppointment(repo, {
      id: 'p2',
      status: 'cancelled_pro',
      startAt: new Date('2026-07-22T10:00:00.000Z'),
    });
    seedAppointment(repo, {
      id: 'p3',
      status: 'cancelled_patient',
      startAt: new Date('2026-07-22T11:00:00.000Z'),
    });

    const result = await useCase.execute({
      storeId,
      startDate: '2026-07-20',
      endDate: '2026-07-26',
      page: 2,
      perPage: 1,
    });

    expect(result.total).toBe(3);
    expect(result.page).toBe(2);
    expect(result.perPage).toBe(1);
    expect(result.totalPages).toBe(3);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('p2');
  });

  it('rejects invalid date range', async () => {
    const { useCase } = createUseCase();

    await expect(
      useCase.execute({
        storeId,
        startDate: '2026-07-26',
        endDate: '2026-07-20',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
