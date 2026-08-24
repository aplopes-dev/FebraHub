import { BadRequestException } from '@nestjs/common';
import { AppointmentCategory } from '../../../../scheduling/appointment-categories/domain/entities/appointment-category.entity';
import { InMemoryAppointmentCategoryRepository } from '../../../../scheduling/appointment-categories/tests/in-memory-appointment-category.repository';
import { Appointment } from '../../../../scheduling/appointments/domain/entities/appointment.entity';
import type { AppointmentStatus } from '../../../../scheduling/shared/domain/appointment-types';
import { InMemoryAppointmentRepository } from '../../../../scheduling/appointments/tests/in-memory-appointment.repository';
import { GetDashboardAppointmentsUseCase } from './get-dashboard-appointments.use-case';

const storeId = '11111111-1111-1111-1111-111111111111';
const otherStoreId = '22222222-2222-2222-2222-222222222222';
const CAT_A = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
const CAT_B = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2';
const IDS = {
  a1: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  a2: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  a3: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  a4: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
  a5: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
  a6: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
} as const;

describe('GetDashboardAppointmentsUseCase', () => {
  function createUseCase() {
    const appointmentRepo = new InMemoryAppointmentRepository();
    const categoryRepo = new InMemoryAppointmentCategoryRepository();
    return {
      appointmentRepo,
      categoryRepo,
      useCase: new GetDashboardAppointmentsUseCase(
        appointmentRepo,
        categoryRepo,
      ),
    };
  }

  async function seedCategory(
    repo: InMemoryAppointmentCategoryRepository,
    id: string,
    name: string,
    color = '#0891b2',
  ) {
    await repo.save(AppointmentCategory.create({ storeId, name, color }, id));
  }

  function seedAppointment(
    repo: InMemoryAppointmentRepository,
    input: {
      id: string;
      storeId?: string;
      status: AppointmentStatus;
      startAt: Date;
      categoryId?: string | null;
      categoryName?: string | null;
      patientId?: string;
      patientName?: string;
      phone?: string;
      professionalId?: string;
    },
  ) {
    const endAt = new Date(input.startAt.getTime() + 30 * 60_000);
    repo.seed({
      appointment: Appointment.create(
        {
          storeId: input.storeId ?? storeId,
          patientId: input.patientId ?? 'patient-1',
          professionalId: input.professionalId ?? 'pro-1',
          procedureId: null,
          roomId: null,
          categoryId: input.categoryId ?? null,
          status: input.status,
          channel: null,
          insuranceType: 'private',
          startAt: input.startAt,
          endAt,
          durationMin: 30,
          notes: null,
          returnOption: null,
          returnDate: null,
          returnReason: null,
          fitInId: null,
        },
        input.id,
      ),
      patientName: input.patientName ?? 'Paciente',
      patientPhone: input.phone ?? '73999990000',
      category:
        input.categoryId != null
          ? {
              id: input.categoryId,
              name: input.categoryName ?? 'Categoria',
              color: '#0891b2',
            }
          : null,
    });
  }

  it('requires month when periodMode is monthly', async () => {
    const { useCase } = createUseCase();
    await expect(
      useCase.execute({
        storeId,
        periodMode: 'monthly',
        year: 2026,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('summarizes terminal outcomes, ignores non-terminal, filters category', async () => {
    const { appointmentRepo, categoryRepo, useCase } = createUseCase();
    await seedCategory(categoryRepo, CAT_A, 'Avaliação');
    await seedCategory(categoryRepo, CAT_B, 'Retorno');

    seedAppointment(appointmentRepo, {
      id: IDS.a1,
      status: 'finished',
      startAt: new Date('2026-07-10T12:00:00.000Z'),
      categoryId: CAT_A,
      categoryName: 'Avaliação',
    });
    seedAppointment(appointmentRepo, {
      id: IDS.a2,
      status: 'missed',
      startAt: new Date('2026-07-11T12:00:00.000Z'),
      categoryId: CAT_A,
      categoryName: 'Avaliação',
    });
    seedAppointment(appointmentRepo, {
      id: IDS.a3,
      status: 'cancelled_patient',
      startAt: new Date('2026-07-12T12:00:00.000Z'),
      categoryId: CAT_B,
      categoryName: 'Retorno',
    });
    seedAppointment(appointmentRepo, {
      id: IDS.a4,
      status: 'scheduled',
      startAt: new Date('2026-07-13T12:00:00.000Z'),
      categoryId: CAT_A,
      categoryName: 'Avaliação',
    });
    seedAppointment(appointmentRepo, {
      id: IDS.a5,
      status: 'finished',
      startAt: new Date('2026-06-01T12:00:00.000Z'),
      categoryId: CAT_A,
      categoryName: 'Avaliação',
    });

    const all = await useCase.execute({
      storeId,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });

    expect(all.summary).toEqual({
      realizedCount: 1,
      missedCancelledCount: 2,
      totalCount: 3,
      attendanceRate: (1 / 3) * 100,
    });
    expect(all.timeline).toHaveLength(31);
    expect(all.timeline[9]).toMatchObject({
      key: '2026-07-10',
      label: '10',
      realized: 1,
      missedCancelled: 0,
    });
    expect(all.categories.map((c) => c.name)).toEqual(['Avaliação', 'Retorno']);

    const filtered = await useCase.execute({
      storeId,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      categoryId: CAT_A,
    });
    expect(filtered.summary.totalCount).toBe(2);
    expect(filtered.summary.realizedCount).toBe(1);
    expect(filtered.summary.missedCancelledCount).toBe(1);
  });

  it('filters annual period and isolates store', async () => {
    const { appointmentRepo, categoryRepo, useCase } = createUseCase();
    await seedCategory(categoryRepo, CAT_A, 'Avaliação');

    seedAppointment(appointmentRepo, {
      id: IDS.a1,
      status: 'finished',
      startAt: new Date('2026-03-15T00:00:00.000Z'),
      categoryId: CAT_A,
    });
    seedAppointment(appointmentRepo, {
      id: IDS.a2,
      status: 'finished',
      startAt: new Date('2025-12-31T00:00:00.000Z'),
      categoryId: CAT_A,
    });
    seedAppointment(appointmentRepo, {
      id: IDS.a3,
      storeId: otherStoreId,
      status: 'finished',
      startAt: new Date('2026-03-01T00:00:00.000Z'),
      categoryId: CAT_A,
    });

    const result = await useCase.execute({
      storeId,
      periodMode: 'annual',
      year: 2026,
    });

    expect(result.summary.totalCount).toBe(1);
    expect(result.timeline).toHaveLength(12);
    expect(result.timeline[2]).toMatchObject({
      key: '2026-03',
      label: 'Mar',
      realized: 1,
    });
  });

  it('returns distinct dashboard years descending (terminal only)', async () => {
    const { appointmentRepo, categoryRepo, useCase } = createUseCase();
    await seedCategory(categoryRepo, CAT_A, 'Avaliação');

    seedAppointment(appointmentRepo, {
      id: IDS.a1,
      status: 'finished',
      startAt: new Date('2026-07-01T00:00:00.000Z'),
    });
    seedAppointment(appointmentRepo, {
      id: IDS.a2,
      status: 'missed',
      startAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    seedAppointment(appointmentRepo, {
      id: IDS.a3,
      status: 'scheduled',
      startAt: new Date('2023-01-01T00:00:00.000Z'),
    });
    seedAppointment(appointmentRepo, {
      id: IDS.a4,
      status: 'cancelled_pro',
      startAt: new Date('2025-06-01T00:00:00.000Z'),
    });

    const result = await useCase.execute({
      storeId,
      periodMode: 'annual',
      year: 2026,
    });

    expect(result.years).toEqual([2026, 2025, 2024]);
  });
});
