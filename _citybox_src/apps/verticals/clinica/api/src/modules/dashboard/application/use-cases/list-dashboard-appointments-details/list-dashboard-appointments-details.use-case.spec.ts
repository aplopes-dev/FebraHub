import { Appointment } from '../../../../scheduling/appointments/domain/entities/appointment.entity';
import type { AppointmentStatus } from '../../../../scheduling/shared/domain/appointment-types';
import { InMemoryAppointmentRepository } from '../../../../scheduling/appointments/tests/in-memory-appointment.repository';
import { ListDashboardAppointmentsDetailsUseCase } from './list-dashboard-appointments-details.use-case';

const storeId = '11111111-1111-1111-1111-111111111111';
const CAT_A = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
const IDS = {
  a1: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
  a2: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
  a3: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd3',
  a4: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
} as const;

describe('ListDashboardAppointmentsDetailsUseCase', () => {
  function createUseCase() {
    const appointmentRepo = new InMemoryAppointmentRepository();
    return {
      appointmentRepo,
      useCase: new ListDashboardAppointmentsDetailsUseCase(appointmentRepo),
    };
  }

  function seedAppointment(
    repo: InMemoryAppointmentRepository,
    input: {
      id: string;
      status: AppointmentStatus;
      startAt: Date;
      patientName: string;
      categoryId?: string | null;
    },
  ) {
    const endAt = new Date(input.startAt.getTime() + 30 * 60_000);
    repo.seed({
      appointment: Appointment.create(
        {
          storeId,
          patientId: `patient-${input.id}`,
          professionalId: 'pro-1',
          procedureId: null,
          roomId: null,
          categoryId: input.categoryId ?? CAT_A,
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
      patientName: input.patientName,
      patientPhone: '73999990000',
      category: {
        id: CAT_A,
        name: 'Avaliação',
        color: '#0891b2',
      },
    });
  }

  it('lists only the requested group with pagination', async () => {
    const { appointmentRepo, useCase } = createUseCase();

    seedAppointment(appointmentRepo, {
      id: IDS.a1,
      status: 'finished',
      startAt: new Date('2026-07-10T12:00:00.000Z'),
      patientName: 'Ana',
    });
    seedAppointment(appointmentRepo, {
      id: IDS.a2,
      status: 'finished',
      startAt: new Date('2026-07-11T12:00:00.000Z'),
      patientName: 'Bia',
    });
    seedAppointment(appointmentRepo, {
      id: IDS.a3,
      status: 'missed',
      startAt: new Date('2026-07-12T12:00:00.000Z'),
      patientName: 'Carla',
    });
    seedAppointment(appointmentRepo, {
      id: IDS.a4,
      status: 'scheduled',
      startAt: new Date('2026-07-13T12:00:00.000Z'),
      patientName: 'Diana',
    });

    const page1 = await useCase.execute({
      storeId,
      group: 'realized',
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      page: 1,
      perPage: 1,
    });

    expect(page1.total).toBe(2);
    expect(page1.totalPages).toBe(2);
    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]?.patientName).toBe('Bia');
    expect(page1.items[0]?.status).toBe('finished');
    expect(page1.items[0]?.professionalId).toBe('pro-1');

    const missed = await useCase.execute({
      storeId,
      group: 'missed_cancelled',
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });
    expect(missed.total).toBe(1);
    expect(missed.items[0]?.patientName).toBe('Carla');
  });
});
