import { Appointment } from '../../../appointments/domain/entities/appointment.entity';
import { InMemoryAppointmentRepository } from '../../../appointments/tests/in-memory-appointment.repository';
import { InMemoryFitInRepository } from '../../../fit-ins/tests/in-memory-fit-in.repository';
import { CommitmentOverlapsInProgressAppointmentError } from '../../domain/errors/commitment-overlaps-in-progress.error';
import { DisplaceAppointmentsForCommitmentService } from './displace-appointments-for-commitment.service';

describe('DisplaceAppointmentsForCommitmentService', () => {
  const storeId = 'store-a';
  const professionalId = 'pro-1';
  const rangeStart = new Date('2026-08-11T09:00:00.000Z');
  const rangeEnd = new Date('2026-08-11T10:00:00.000Z');

  let appointments: InMemoryAppointmentRepository;
  let fitIns: InMemoryFitInRepository;
  let service: DisplaceAppointmentsForCommitmentService;

  beforeEach(() => {
    appointments = new InMemoryAppointmentRepository();
    fitIns = new InMemoryFitInRepository();
    service = new DisplaceAppointmentsForCommitmentService(
      appointments,
      fitIns,
    );
  });

  async function seedAppointment(
    status: Appointment['status'],
    startAt = new Date('2026-08-11T09:00:00.000Z'),
    endAt = new Date('2026-08-11T09:30:00.000Z'),
  ) {
    const appointment = Appointment.create({
      storeId,
      patientId: 'patient-1',
      professionalId,
      procedureId: null,
      roomId: null,
      categoryId: 'cat-1',
      channel: null,
      insuranceType: 'private',
      startAt,
      endAt,
      durationMin: 30,
      notes: null,
      returnOption: null,
      returnDate: null,
      returnReason: null,
      fitInId: null,
      status,
    });
    const saved = await appointments.save(appointment);
    return saved.appointment;
  }

  it('bloqueia compromisso sobre consulta em andamento', async () => {
    await seedAppointment('in_progress');

    await expect(
      service.assertNoInProgress({
        context: 'test',
        storeId,
        professionalId,
        rangeStart,
        rangeEnd,
      }),
    ).rejects.toBeInstanceOf(CommitmentOverlapsInProgressAppointmentError);
  });

  it('desloca consulta scheduled para fit-in pending e cancela cancelled_pro', async () => {
    const appointment = await seedAppointment('scheduled');

    await service.assertNoInProgress({
      context: 'test',
      storeId,
      professionalId,
      rangeStart,
      rangeEnd,
    });

    const displaced = await service.displace({
      storeId,
      professionalId,
      rangeStart,
      rangeEnd,
      commitmentTitle: 'Reunião urgente',
    });

    expect(displaced).toHaveLength(1);
    expect(displaced[0]?.appointmentId).toBe(appointment.id);
    expect(displaced[0]?.patientId).toBe('patient-1');

    const after = await appointments.findById(storeId, appointment.id);
    expect(after?.appointment.status).toBe('cancelled_pro');

    expect(fitIns.items).toHaveLength(1);
    const fitIn = fitIns.items[0]?.fitIn;
    expect(fitIn?.status).toBe('pending');
    expect(fitIn?.patientId).toBe('patient-1');
    expect(fitIn?.professionalId).toBe(professionalId);
    expect(fitIn?.categoryId).toBe('cat-1');
    expect(fitIn?.shifts).toEqual(['morning']);
    expect(fitIn?.observation).toBe(
      'Deslocado pelo compromisso: Reunião urgente',
    );
    expect(displaced[0]?.fitInId).toBe(fitIn?.id);
  });

  it('não desloca consulta fora do intervalo do compromisso', async () => {
    await seedAppointment(
      'scheduled',
      new Date('2026-08-11T11:00:00.000Z'),
      new Date('2026-08-11T11:30:00.000Z'),
    );

    const displaced = await service.displace({
      storeId,
      professionalId,
      rangeStart,
      rangeEnd,
      commitmentTitle: 'Compromisso',
    });

    expect(displaced).toHaveLength(0);
    expect(fitIns.items).toHaveLength(0);
  });
});
